-- SQ-0404: authoritative, idempotent Active Quest abandonment.

create function public.abandon_quest(p_quest_instance_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  quest_row public.quest_instances%rowtype;
  now_value timestamptz := clock_timestamp();
  cleanup_count integer;
  outcome_value text;
begin
  if owner_id is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if p_quest_instance_id is null then raise exception using errcode='22023', message='quest_instance_id is required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  select * into quest_row from public.quest_instances
    where id=p_quest_instance_id and user_id=owner_id for update;
  if not found then raise exception using errcode='42501', message='Quest is unavailable'; end if;

  if quest_row.status='active' then
    update public.quest_instances set status='abandoned',status_reason='user_abandoned',abandoned_at=now_value,updated_at=now_value
      where id=quest_row.id returning * into quest_row;
    outcome_value := 'abandoned';
  elsif quest_row.status='abandoned' and quest_row.status_reason='user_abandoned' then
    outcome_value := 'already_abandoned';
  else
    raise exception using errcode='P0001', message='quest_not_abandonable';
  end if;

  update public.quest_proofs set status='pending_delete',updated_at=now_value
    where quest_instance_id=quest_row.id and user_id=owner_id and status<>'pending_delete';
  get diagnostics cleanup_count = row_count;

  return jsonb_build_object('status','abandoned','outcome',outcome_value,'instance_id',quest_row.id,
    'search_id',quest_row.search_id,'abandoned',quest_row.snapshot,'abandoned_at',quest_row.abandoned_at,
    'proof_cleanup_queued',cleanup_count>0 or exists(select 1 from public.quest_proofs
      where quest_instance_id=quest_row.id and user_id=owner_id and status='pending_delete'));
end;
$$;

revoke execute on function public.abandon_quest(uuid) from public,anon;
grant execute on function public.abandon_quest(uuid) to authenticated;
