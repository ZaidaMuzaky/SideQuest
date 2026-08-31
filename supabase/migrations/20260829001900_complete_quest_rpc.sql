-- SQ-0503: atomic, idempotent Quest completion using the SQ-0601 level contract.

alter table public.quest_completions
  add column total_xp_after bigint not null,
  add column completed_count_after integer not null,
  add constraint quest_completions_total_xp_after_check check (total_xp_after >= xp_awarded),
  add constraint quest_completions_completed_count_after_check check (completed_count_after > 0);

create function public.complete_quest(p_quest_instance_id uuid,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  owner_id uuid:=auth.uid(); quest_row public.quest_instances%rowtype; proof_row public.quest_proofs%rowtype;
  progress_row public.user_progress%rowtype; completion_row public.quest_completions%rowtype;
  now_value timestamptz:=clock_timestamp(); new_total bigint; new_level integer; completion_id uuid:=gen_random_uuid(); ledger_total bigint;
begin
  if owner_id is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_quest_instance_id is null or p_idempotency_key is null then raise exception using errcode='22023',message='quest_instance_id and idempotency_key are required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text,0));

  select * into completion_row from public.quest_completions where user_id=owner_id and idempotency_key=p_idempotency_key;
  if found then
    if completion_row.quest_instance_id<>p_quest_instance_id then raise exception using errcode='22023',message='Completion key is already used'; end if;
    return jsonb_build_object('status','completed','outcome','already_completed','completion_id',completion_row.id,
      'instance_id',completion_row.quest_instance_id,'xp_awarded',completion_row.xp_awarded,'total_xp',completion_row.total_xp_after,
      'level_before',completion_row.level_before,'level_after',completion_row.level_after,
      'completed_count',completion_row.completed_count_after,'completed_at',completion_row.completed_at);
  end if;

  select * into quest_row from public.quest_instances where id=p_quest_instance_id and user_id=owner_id for update;
  if not found then raise exception using errcode='42501',message='Quest is unavailable'; end if;
  if quest_row.status='completed' then
    select * into completion_row from public.quest_completions where quest_instance_id=quest_row.id;
    return jsonb_build_object('status','completed','outcome','already_completed','completion_id',completion_row.id,
      'instance_id',completion_row.quest_instance_id,'xp_awarded',completion_row.xp_awarded,'total_xp',completion_row.total_xp_after,
      'level_before',completion_row.level_before,'level_after',completion_row.level_after,
      'completed_count',completion_row.completed_count_after,'completed_at',completion_row.completed_at);
  end if;
  if quest_row.status<>'active' then raise exception using errcode='P0001',message='quest_not_completable'; end if;
  select * into proof_row from public.quest_proofs where quest_instance_id=quest_row.id and user_id=owner_id and status='uploaded' for update;
  if not found then raise exception using errcode='P0001',message='uploaded_proof_required'; end if;
  select * into progress_row from public.user_progress where user_id=owner_id for update;
  if not found then raise exception using errcode='P0001',message='progress_unavailable'; end if;
  select coalesce(sum(amount),0) into ledger_total from public.xp_ledger where user_id=owner_id;
  if ledger_total<>progress_row.lifetime_xp or progress_row.level<>public.quest_level_for_xp(progress_row.lifetime_xp) then
    raise exception using errcode='P0001',message='progress_inconsistent';
  end if;

  new_total:=progress_row.lifetime_xp+quest_row.base_xp;
  new_level:=public.quest_level_for_xp(new_total);
  insert into public.quest_completions(id,quest_instance_id,user_id,proof_id,xp_awarded,level_before,level_after,idempotency_key,
    total_xp_after,completed_count_after,completed_at)
  values(completion_id,quest_row.id,owner_id,proof_row.id,quest_row.base_xp,progress_row.level,new_level,p_idempotency_key,
    new_total,progress_row.completed_count+1,now_value) returning * into completion_row;
  insert into public.xp_ledger(user_id,quest_completion_id,amount,reason,created_at)
    values(owner_id,completion_row.id,quest_row.base_xp,'quest_completion',now_value);
  update public.quest_instances set status='completed',status_reason=null,completed_at=now_value,updated_at=now_value where id=quest_row.id;
  update public.user_progress set lifetime_xp=new_total,level=new_level,completed_count=completed_count+1,updated_at=now_value
    where user_id=owner_id;
  return jsonb_build_object('status','completed','outcome','completed','completion_id',completion_row.id,'instance_id',quest_row.id,
    'xp_awarded',completion_row.xp_awarded,'total_xp',completion_row.total_xp_after,'level_before',completion_row.level_before,
    'level_after',completion_row.level_after,'completed_count',completion_row.completed_count_after,'completed_at',completion_row.completed_at);
end;$$;

revoke execute on function public.complete_quest(uuid,uuid) from public,anon;
grant execute on function public.complete_quest(uuid,uuid) to authenticated;
