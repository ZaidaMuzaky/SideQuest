-- SQ-0302: server-authoritative deterministic Quest matching.

create function public.is_valid_quest_availability(value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  day_value jsonb;
  start_value time;
  end_value time;
  from_value date;
  until_value date;
begin
  if value is null then return true; end if;
  if jsonb_typeof(value) <> 'object'
    or value ?| array(select key from jsonb_object_keys(value) as keys(key)
      where key not in ('days', 'start_time', 'end_time', 'valid_from', 'valid_until'))
    or not (value ? 'days' and value ? 'start_time' and value ? 'end_time')
    or jsonb_typeof(value->'days') <> 'array'
    or jsonb_array_length(value->'days') = 0
    or jsonb_typeof(value->'start_time') <> 'string'
    or jsonb_typeof(value->'end_time') <> 'string'
    or not ((value->>'start_time') ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$')
    or not ((value->>'end_time') ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$') then
    return false;
  end if;

  for day_value in select jsonb_array_elements(value->'days') loop
    if jsonb_typeof(day_value) <> 'number' or (day_value::text)::numeric <> trunc((day_value::text)::numeric)
      or (day_value::text)::integer not between 1 and 7 then return false; end if;
  end loop;
  if (select count(*) from jsonb_array_elements(value->'days')) <>
     (select count(distinct item) from jsonb_array_elements(value->'days') item) then return false; end if;

  start_value := (value->>'start_time')::time;
  end_value := (value->>'end_time')::time;
  if start_value >= end_value then return false; end if;

  if value ? 'valid_from' and value->'valid_from' <> 'null'::jsonb then
    if jsonb_typeof(value->'valid_from') <> 'string' or not ((value->>'valid_from') ~ '^\d{4}-\d{2}-\d{2}$') then return false; end if;
    from_value := (value->>'valid_from')::date;
    if from_value::text <> value->>'valid_from' then return false; end if;
  end if;
  if value ? 'valid_until' and value->'valid_until' <> 'null'::jsonb then
    if jsonb_typeof(value->'valid_until') <> 'string' or not ((value->>'valid_until') ~ '^\d{4}-\d{2}-\d{2}$') then return false; end if;
    until_value := (value->>'valid_until')::date;
    if until_value::text <> value->>'valid_until' then return false; end if;
  end if;
  return from_value is null or until_value is null or from_value <= until_value;
exception when others then
  return false;
end;
$$;

create function public.quest_availability_allows(value jsonb, instant timestamptz, timezone_name text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare local_value timestamp; local_date date; local_time time; iso_day integer;
begin
  if value is null then return true; end if;
  if not public.is_valid_quest_availability(value) then return false; end if;
  local_value := instant at time zone timezone_name;
  local_date := local_value::date;
  local_time := local_value::time;
  iso_day := extract(isodow from local_value)::integer;
  return (value->'days') @> to_jsonb(array[iso_day])
    and local_time >= (value->>'start_time')::time
    and local_time <= (value->>'end_time')::time
    and ((value->>'valid_from') is null or local_date >= (value->>'valid_from')::date)
    and ((value->>'valid_until') is null or local_date <= (value->>'valid_until')::date);
exception when others then return false;
end;
$$;

alter table public.locations drop constraint locations_availability_check;
alter table public.locations add constraint locations_availability_check
  check (public.is_valid_quest_availability(availability_json));
alter table public.quest_templates drop constraint quest_templates_availability_check;
alter table public.quest_templates add constraint quest_templates_availability_check
  check (public.is_valid_quest_availability(availability_json));

create function public.match_quest(
  p_search_id uuid,
  p_time_filter text,
  p_budget_filter text,
  p_mood_filter text,
  p_distance_filter text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_area_code text default null,
  p_timezone text default 'UTC'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  existing_owner uuid;
  existing_search public.quest_searches%rowtype;
  existing_candidate public.quest_instances%rowtype;
  chosen record;
  now_value timestamptz := clock_timestamp();
  time_ceiling integer;
  budget_ceiling integer;
  distance_ceiling double precision;
  controlled_area text;
  snapshot_value jsonb;
begin
  if owner_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_search_id is null then raise exception using errcode = '22023', message = 'search_id is required'; end if;
  if p_time_filter not in ('30_minutes','1_hour','2_hours','half_day')
    or p_budget_filter not in ('free','under_50000','under_100000','flexible')
    or p_mood_filter not in ('chill','food','explore','active','creative','random')
    or p_distance_filter not in ('walking','under_3_km','under_10_km','flexible') then
    raise exception using errcode = '22023', message = 'Invalid matching filter';
  end if;
  if (p_latitude is null) <> (p_longitude is null) or p_latitude not between -90 and 90
    or p_longitude not between -180 and 180 then
    raise exception using errcode = '22023', message = 'Invalid foreground coordinates';
  end if;
  begin perform now_value at time zone p_timezone; exception when invalid_parameter_value then
    raise exception using errcode = '22023', message = 'Invalid timezone'; end;

  if p_area_code is not null and exists(select 1 from public.locations where area_code=p_area_code and is_enabled) then
    controlled_area := p_area_code;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text || p_search_id::text, 0));
  select * into existing_search from public.quest_searches where id = p_search_id;
  existing_owner := existing_search.user_id;
  if existing_owner is not null and existing_owner <> owner_id then
    raise exception using errcode = '42501', message = 'Search is unavailable';
  end if;
  if existing_owner = owner_id then
    if existing_search.time_filter <> p_time_filter or existing_search.budget_filter <> p_budget_filter
      or existing_search.mood_filter <> p_mood_filter or existing_search.distance_filter <> p_distance_filter
      or existing_search.area_code is distinct from controlled_area then
      raise exception using errcode = '22023', message = 'Search request does not match its original filters';
    end if;
    select * into existing_candidate from public.quest_instances
      where search_id = p_search_id and user_id = owner_id
      order by created_at, id limit 1;
    if found then
      return jsonb_build_object('status','candidate','candidate',existing_candidate.snapshot,
        'instance_id',existing_candidate.id,'search_id',p_search_id,
        'candidate_expires_at',existing_candidate.candidate_expires_at);
    end if;
    return jsonb_build_object('status','no_match','reason',coalesce(
      (select result_reason from public.quest_searches where id=p_search_id),'no_eligible_quest'),
      'suggestions',jsonb_build_array('adjust_time','adjust_budget','adjust_mood','adjust_distance'));
  end if;

  if (select count(*) from public.quest_searches where user_id=owner_id and created_at > now_value-interval '1 hour') >= 30 then
    raise exception using errcode = 'P0001', message = 'match_rate_limit_exceeded';
  end if;

  time_ceiling := case p_time_filter when '30_minutes' then 30 when '1_hour' then 60 when '2_hours' then 120 else 240 end;
  budget_ceiling := case p_budget_filter when 'free' then 0 when 'under_50000' then 50000 when 'under_100000' then 100000 else 250000 end;
  distance_ceiling := case p_distance_filter when 'walking' then 1.0 when 'under_3_km' then 3.0 when 'under_10_km' then 10.0 else null end;
  insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,area_code,expires_at)
  values(p_search_id,owner_id,p_time_filter,p_budget_filter,p_mood_filter,p_distance_filter,controlled_area,now_value+interval '30 minutes');

  with catalog as (
    select t.*, c.slug category_slug, l.name location_name, l.area_code location_area_code,
      l.latitude location_latitude, l.longitude location_longitude, l.address location_address,
      l.external_map_url, l.timezone location_timezone, l.availability_json location_availability,
      l.is_enabled location_enabled,
      case when l.latitude is not null and p_latitude is not null then
        6371.0 * 2 * asin(sqrt(power(sin(radians(l.latitude-p_latitude)/2),2)
          + cos(radians(p_latitude))*cos(radians(l.latitude))*power(sin(radians(l.longitude-p_longitude)/2),2))) end distance_km
    from public.quest_templates t join public.categories c on c.id=t.category_id
    left join public.locations l on l.id=t.location_id
    where c.is_enabled and t.moderation_status='approved' and t.enabled_at is not null and t.enabled_at<=now_value
      and (t.disabled_at is null or t.disabled_at>now_value)
  ), eligible as (
    select *, exists(select 1 from public.quest_instances completed
      where completed.user_id=owner_id and completed.template_id=catalog.id
        and completed.status='completed' and completed.completed_at>now_value-interval '30 days') recently_completed,
      greatest(0,1-duration_max::numeric/time_ceiling) time_score,
      case when budget_ceiling=0 then 1::numeric else greatest(0,1-estimated_cost_max::numeric/budget_ceiling) end budget_score,
      case when location_mode in ('none','area') then 1::numeric
        when distance_ceiling is null then 1::numeric/(1+distance_km)
        else greatest(0,1-distance_km/distance_ceiling)::numeric end location_score
    from catalog
    where duration_max<=time_ceiling and estimated_cost_max<=budget_ceiling and currency_code='IDR'
      and (p_mood_filter='random' or category_slug=p_mood_filter)
      and public.quest_availability_allows(availability_json,now_value,coalesce(location_timezone,p_timezone))
      and (location_availability is null or public.quest_availability_allows(location_availability,now_value,location_timezone))
      and case location_mode
        when 'none' then true
        when 'area' then controlled_area is not null and controlled_area=any(area_codes)
        when 'place' then p_latitude is not null and location_id is not null and location_enabled
          and location_latitude is not null and (distance_ceiling is null or distance_km<=distance_ceiling)
      end
      and not exists(select 1 from public.quest_instances qi where qi.user_id=owner_id and qi.status='active' and qi.template_id=catalog.id)
  )
  select *, (.5*time_score+.3*budget_score+.2*location_score) score into chosen from eligible
  order by recently_completed asc, (.5*time_score+.3*budget_score+.2*location_score) desc, priority desc,
    pg_catalog.md5(owner_id::text||p_search_id::text||id::text), id limit 1;

  if chosen.id is null then
    update public.quest_searches set result_reason='no_eligible_quest' where id=p_search_id;
    return jsonb_build_object('status','no_match','reason','no_eligible_quest',
      'suggestions',jsonb_build_array('adjust_time','adjust_budget','adjust_mood','adjust_distance'));
  end if;

  snapshot_value := jsonb_build_object('snapshot_version',1,'template_id',chosen.id,'template_family_id',chosen.template_family_id,
    'template_version',chosen.version,'title',chosen.title,'description',chosen.description,'instructions',chosen.instructions,
    'category_slug',chosen.category_slug,'duration_min',chosen.duration_min,'duration_max',chosen.duration_max,
    'estimated_cost_min',chosen.estimated_cost_min,'estimated_cost_max',chosen.estimated_cost_max,'currency_code',chosen.currency_code,
    'difficulty',chosen.difficulty,'base_xp',chosen.base_xp,'location_mode',chosen.location_mode,
    'availability',chosen.availability_json,'physical_demand',chosen.physical_demand,'safety_notes',chosen.safety_notes,
    'location',case when chosen.location_mode='place' then jsonb_build_object('id',chosen.location_id,'name',chosen.location_name,
      'area_code',chosen.location_area_code,'latitude',chosen.location_latitude,'longitude',chosen.location_longitude,
      'address',chosen.location_address,'external_map_url',chosen.external_map_url) else null end,
    'match',jsonb_build_object('score',round(chosen.score*100),'time_score',chosen.time_score,
      'budget_score',chosen.budget_score,'location_score',chosen.location_score,'distance_km',chosen.distance_km,
      'filters',jsonb_build_object('time',p_time_filter,'budget',p_budget_filter,'mood',p_mood_filter,'distance',p_distance_filter,'area_code',controlled_area)));
  insert into public.quest_instances(user_id,search_id,template_id,status,snapshot_version,snapshot,category_id,base_xp,location_id,
    candidate_expires_at,created_at,updated_at)
  values(owner_id,p_search_id,chosen.id,'candidate',1,snapshot_value,chosen.category_id,chosen.base_xp,chosen.location_id,
    now_value+interval '30 minutes',now_value,now_value)
  returning id,candidate_expires_at into existing_candidate.id,existing_candidate.candidate_expires_at;
  return jsonb_build_object('status','candidate','candidate',snapshot_value,'instance_id',existing_candidate.id,
    'search_id',p_search_id,'candidate_expires_at',existing_candidate.candidate_expires_at);
end;
$$;

revoke execute on function public.is_valid_quest_availability(jsonb) from public,anon,authenticated;
revoke execute on function public.quest_availability_allows(jsonb,timestamptz,text) from public,anon,authenticated;
revoke execute on function public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text) from public,anon;
grant execute on function public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text) to authenticated;
