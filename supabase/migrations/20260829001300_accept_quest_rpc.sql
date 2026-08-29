-- SQ-0401: server-authoritative, idempotent Candidate acceptance.

create function public.accept_quest(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  candidate_row public.quest_instances%rowtype;
  active_row public.quest_instances%rowtype;
  now_value timestamptz := clock_timestamp();
begin
  if owner_id is null then
    raise exception using errcode='42501', message='Authentication required';
  end if;
  if p_candidate_id is null then
    raise exception using errcode='22023', message='candidate_id is required';
  end if;

  -- Serialize every accept decision for one user. The partial unique index remains
  -- the final database invariant if another authoritative path is introduced.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));

  select * into candidate_row
  from public.quest_instances
  where id=p_candidate_id and user_id=owner_id
  for update;
  if not found then
    raise exception using errcode='42501', message='Candidate is unavailable';
  end if;

  if candidate_row.status='active' then
    return jsonb_build_object('status','active','outcome','already_active','instance_id',candidate_row.id,
      'search_id',candidate_row.search_id,'active',candidate_row.snapshot,'accepted_at',candidate_row.accepted_at);
  end if;
  if candidate_row.status<>'candidate' then
    raise exception using errcode='P0001', message='candidate_not_acceptable';
  end if;
  select * into active_row
  from public.quest_instances
  where user_id=owner_id and status='active'
  order by accepted_at,id
  limit 1;
  if found then
    return jsonb_build_object('status','active','outcome','existing_active','instance_id',active_row.id,
      'search_id',active_row.search_id,'active',active_row.snapshot,'accepted_at',active_row.accepted_at);
  end if;

  if candidate_row.candidate_expires_at is null or candidate_row.candidate_expires_at<=now_value then
    update public.quest_instances
      set status='expired',status_reason='candidate_expired',expired_at=now_value,updated_at=now_value
      where id=candidate_row.id;
    return jsonb_build_object('status','expired','reason','candidate_expired','instance_id',candidate_row.id,
      'search_id',candidate_row.search_id);
  end if;

  update public.quest_instances
    set status='active',accepted_at=now_value,updated_at=now_value
    where id=candidate_row.id
    returning * into active_row;

  return jsonb_build_object('status','active','outcome','accepted','instance_id',active_row.id,
    'search_id',active_row.search_id,'active',active_row.snapshot,'accepted_at',active_row.accepted_at);
end;
$$;

revoke execute on function public.accept_quest(uuid) from public,anon;
grant execute on function public.accept_quest(uuid) to authenticated;
