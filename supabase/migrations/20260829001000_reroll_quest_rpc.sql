-- SQ-0303: atomic, idempotent and rate-limited Candidate rerolls.

create table public.quest_reroll_requests (
  request_id uuid primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  search_id uuid not null,
  candidate_id uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  constraint quest_reroll_requests_search_owner_fk
    foreign key (search_id, user_id) references public.quest_searches(id, user_id) on delete cascade,
  constraint quest_reroll_requests_candidate_owner_fk
    foreign key (candidate_id, user_id) references public.quest_instances(id, user_id) on delete cascade,
  constraint quest_reroll_requests_result_check check (jsonb_typeof(result) = 'object')
);

create index quest_reroll_requests_user_created_idx
  on public.quest_reroll_requests(user_id, created_at desc);

alter table public.quest_reroll_requests enable row level security;
revoke all on table public.quest_reroll_requests from public, anon, authenticated;

create trigger quest_reroll_requests_prevent_update
before update on public.quest_reroll_requests
for each row execute function public.prevent_immutable_record_update();

-- SQ-0302 initially counted only search rows because rerolls did not yet exist.
-- Extend that applied RPC forward so both entry points enforce one combined limit.
do $$
declare
  definition text;
  original text := 'if (select count(*) from public.quest_searches where user_id=owner_id and created_at > now_value-interval ''1 hour'') >= 30 then';
  replacement text := 'if (select count(*) from (select created_at from public.quest_searches where user_id=owner_id and created_at>now_value-interval ''1 hour'' union all select created_at from public.quest_reroll_requests where user_id=owner_id and created_at>now_value-interval ''1 hour'') requests) >= 30 then';
begin
  definition := pg_catalog.pg_get_functiondef(
    'public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text)'::regprocedure
  );
  if pg_catalog.strpos(definition, original) = 0 then
    raise exception 'SQ-0303 match_quest rate predicate was not found';
  end if;
  execute pg_catalog.replace(definition, original, replacement);
end;
$$;

create function public.reroll_quest(
  p_candidate_id uuid,
  p_search_id uuid,
  p_request_id uuid,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_timezone text default 'UTC'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  search_row public.quest_searches%rowtype;
  candidate_row public.quest_instances%rowtype;
  prior_request public.quest_reroll_requests%rowtype;
  chosen record;
  now_value timestamptz := clock_timestamp();
  time_ceiling integer;
  budget_ceiling integer;
  distance_ceiling double precision;
  request_count integer;
  candidate_count integer;
  retry_at timestamptz;
  snapshot_value jsonb;
  next_id uuid;
  next_expiry timestamptz;
  result_value jsonb;
begin
  if owner_id is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if p_candidate_id is null or p_search_id is null or p_request_id is null then
    raise exception using errcode='22023', message='candidate_id, search_id, and request_id are required';
  end if;
  if (p_latitude is null) <> (p_longitude is null) or p_latitude not between -90 and 90
    or p_longitude not between -180 and 180 then
    raise exception using errcode='22023', message='Invalid foreground coordinates';
  end if;
  begin perform now_value at time zone p_timezone; exception when invalid_parameter_value then
    raise exception using errcode='22023', message='Invalid timezone'; end;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || p_search_id::text, 0));

  select * into prior_request from public.quest_reroll_requests
    where request_id=p_request_id and user_id=owner_id;
  if found then
    if prior_request.candidate_id <> p_candidate_id or prior_request.search_id <> p_search_id then
      raise exception using errcode='22023', message='Reroll request does not match its original operation';
    end if;
    return prior_request.result;
  end if;
  if exists(select 1 from public.quest_reroll_requests where request_id=p_request_id) then
    raise exception using errcode='42501', message='Reroll request is unavailable';
  end if;

  select * into search_row from public.quest_searches where id=p_search_id and user_id=owner_id;
  if not found then raise exception using errcode='42501', message='Search is unavailable'; end if;
  select * into candidate_row from public.quest_instances
    where id=p_candidate_id and search_id=p_search_id and user_id=owner_id for update;
  if not found then raise exception using errcode='42501', message='Candidate is unavailable'; end if;
  if candidate_row.status <> 'candidate' then
    raise exception using errcode='P0001', message='candidate_not_rerollable';
  end if;

  if candidate_row.candidate_expires_at is null or candidate_row.candidate_expires_at <= now_value then
    update public.quest_instances set status='expired',status_reason='candidate_expired',expired_at=now_value,updated_at=now_value
      where id=candidate_row.id;
    result_value := jsonb_build_object('status','expired','reason','candidate_expired','search_id',p_search_id);
    insert into public.quest_reroll_requests values(p_request_id,owner_id,p_search_id,p_candidate_id,result_value,now_value);
    return result_value;
  end if;

  select count(*) into request_count from (
    select created_at from public.quest_searches where user_id=owner_id and created_at>now_value-interval '1 hour'
    union all
    select created_at from public.quest_reroll_requests where user_id=owner_id and created_at>now_value-interval '1 hour'
  ) requests;
  if request_count >= 30 then
    select min(created_at)+interval '1 hour' into retry_at from (
      select created_at from public.quest_searches where user_id=owner_id and created_at>now_value-interval '1 hour'
      union all
      select created_at from public.quest_reroll_requests where user_id=owner_id and created_at>now_value-interval '1 hour'
    ) requests;
    result_value := jsonb_build_object('status','rate_limited','reason','reroll_rate_limit_exceeded',
      'retry_after_seconds',greatest(1,ceil(extract(epoch from retry_at-now_value))::integer),'search_id',p_search_id);
    insert into public.quest_reroll_requests values(p_request_id,owner_id,p_search_id,p_candidate_id,result_value,now_value);
    return result_value;
  end if;

  update public.quest_instances set status='rerolled',status_reason='rerolled',updated_at=now_value
    where id=candidate_row.id;
  select count(*) into candidate_count from public.quest_instances where search_id=p_search_id and user_id=owner_id;
  if candidate_count >= 10 then
    result_value := jsonb_build_object('status','exhausted','reason','candidate_limit_reached','search_id',p_search_id);
    insert into public.quest_reroll_requests values(p_request_id,owner_id,p_search_id,p_candidate_id,result_value,now_value);
    return result_value;
  end if;

  time_ceiling := case search_row.time_filter when '30_minutes' then 30 when '1_hour' then 60 when '2_hours' then 120 else 240 end;
  budget_ceiling := case search_row.budget_filter when 'free' then 0 when 'under_50000' then 50000 when 'under_100000' then 100000 else 250000 end;
  distance_ceiling := case search_row.distance_filter when 'walking' then 1.0 when 'under_3_km' then 3.0 when 'under_10_km' then 10.0 else null end;

  with catalog as (
    select t.*,c.slug category_slug,l.name location_name,l.area_code location_area_code,
      l.latitude location_latitude,l.longitude location_longitude,l.address location_address,
      l.external_map_url,l.timezone location_timezone,l.availability_json location_availability,l.is_enabled location_enabled,
      case when l.latitude is not null and p_latitude is not null then
        6371.0*2*asin(sqrt(power(sin(radians(l.latitude-p_latitude)/2),2)
          +cos(radians(p_latitude))*cos(radians(l.latitude))*power(sin(radians(l.longitude-p_longitude)/2),2))) end distance_km
    from public.quest_templates t join public.categories c on c.id=t.category_id
    left join public.locations l on l.id=t.location_id
    where c.is_enabled and t.moderation_status='approved' and t.enabled_at is not null and t.enabled_at<=now_value
      and (t.disabled_at is null or t.disabled_at>now_value)
  ), eligible as (
    select *,exists(select 1 from public.quest_instances completed where completed.user_id=owner_id
      and completed.template_id=catalog.id and completed.status='completed'
      and completed.completed_at>now_value-interval '30 days') recently_completed,
      greatest(0,1-duration_max::numeric/time_ceiling) time_score,
      case when budget_ceiling=0 then 1::numeric else greatest(0,1-estimated_cost_max::numeric/budget_ceiling) end budget_score,
      case when location_mode in ('none','area') then 1::numeric when distance_ceiling is null then 1::numeric/(1+distance_km)
        else greatest(0,1-distance_km/distance_ceiling)::numeric end location_score
    from catalog where duration_max<=time_ceiling and estimated_cost_max<=budget_ceiling and currency_code='IDR'
      and (search_row.mood_filter='random' or category_slug=search_row.mood_filter)
      and public.quest_availability_allows(availability_json,now_value,coalesce(location_timezone,p_timezone))
      and (location_availability is null or public.quest_availability_allows(location_availability,now_value,location_timezone))
      and case location_mode when 'none' then true
        when 'area' then search_row.area_code is not null and search_row.area_code=any(area_codes)
        when 'place' then p_latitude is not null and location_id is not null and location_enabled
          and location_latitude is not null and (distance_ceiling is null or distance_km<=distance_ceiling) end
      and not exists(select 1 from public.quest_instances qi where qi.user_id=owner_id and qi.status='active' and qi.template_id=catalog.id)
      and not exists(select 1 from public.quest_instances seen where seen.search_id=p_search_id and seen.template_id=catalog.id)
  )
  select *,(.5*time_score+.3*budget_score+.2*location_score) score into chosen from eligible
  order by recently_completed asc,(.5*time_score+.3*budget_score+.2*location_score) desc,priority desc,
    pg_catalog.md5(owner_id::text||p_search_id::text||id::text),id limit 1;

  if chosen.id is null then
    result_value := jsonb_build_object('status','exhausted','reason','no_unseen_eligible_quest','search_id',p_search_id);
  else
    snapshot_value := jsonb_build_object('snapshot_version',1,'template_id',chosen.id,'template_family_id',chosen.template_family_id,
      'template_version',chosen.version,'title',chosen.title,'description',chosen.description,'instructions',chosen.instructions,
      'category_slug',chosen.category_slug,'duration_min',chosen.duration_min,'duration_max',chosen.duration_max,
      'estimated_cost_min',chosen.estimated_cost_min,'estimated_cost_max',chosen.estimated_cost_max,'currency_code',chosen.currency_code,
      'difficulty',chosen.difficulty,'base_xp',chosen.base_xp,'location_mode',chosen.location_mode,'availability',chosen.availability_json,
      'physical_demand',chosen.physical_demand,'safety_notes',chosen.safety_notes,
      'location',case when chosen.location_mode='place' then jsonb_build_object('id',chosen.location_id,'name',chosen.location_name,
        'area_code',chosen.location_area_code,'latitude',chosen.location_latitude,'longitude',chosen.location_longitude,
        'address',chosen.location_address,'external_map_url',chosen.external_map_url) else null end,
      'match',jsonb_build_object('score',round(chosen.score*100),'time_score',chosen.time_score,'budget_score',chosen.budget_score,
        'location_score',chosen.location_score,'distance_km',chosen.distance_km,'filters',jsonb_build_object('time',search_row.time_filter,
        'budget',search_row.budget_filter,'mood',search_row.mood_filter,'distance',search_row.distance_filter,'area_code',search_row.area_code)));
    insert into public.quest_instances(user_id,search_id,template_id,status,snapshot_version,snapshot,category_id,base_xp,location_id,
      candidate_expires_at,created_at,updated_at) values(owner_id,p_search_id,chosen.id,'candidate',1,snapshot_value,chosen.category_id,
      chosen.base_xp,chosen.location_id,now_value+interval '30 minutes',now_value,now_value)
      returning id,candidate_expires_at into next_id,next_expiry;
    result_value := jsonb_build_object('status','candidate','candidate',snapshot_value,'instance_id',next_id,
      'search_id',p_search_id,'candidate_expires_at',next_expiry);
  end if;
  insert into public.quest_reroll_requests values(p_request_id,owner_id,p_search_id,p_candidate_id,result_value,now_value);
  return result_value;
end;
$$;

revoke execute on function public.reroll_quest(uuid,uuid,uuid,double precision,double precision,text) from public,anon;
grant execute on function public.reroll_quest(uuid,uuid,uuid,double precision,double precision,text) to authenticated;
