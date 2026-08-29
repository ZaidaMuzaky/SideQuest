-- SQ-0405: trusted-only explicit Active Quest expiry.

create function public.enforce_authoritative_active_expiry()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if old.status='active' and new.status='expired' then
    if new.status_reason not in ('availability_expired','safety_disabled') then
      raise exception using errcode='22023',message='invalid_active_expiry_reason';
    end if;
    if pg_catalog.current_setting('sidequest.authoritative_active_expiry',true) is distinct from 'true' then
      raise exception using errcode='42501',message='active_expiry_requires_authoritative_rpc';
    end if;
  end if;
  return new;
end;
$$;

create trigger quest_instances_authoritative_active_expiry
before update of status on public.quest_instances
for each row execute function public.enforce_authoritative_active_expiry();

create function public.expire_active_quest(p_quest_instance_id uuid,p_reason text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  quest_row public.quest_instances%rowtype;
  now_value timestamptz:=clock_timestamp();
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using errcode='42501',message='Trusted server role required';
  end if;
  if p_quest_instance_id is null then raise exception using errcode='22023',message='quest_instance_id is required'; end if;
  if p_reason not in ('availability_expired','safety_disabled') then
    raise exception using errcode='22023',message='Invalid Active expiry reason';
  end if;

  select * into quest_row from public.quest_instances where id=p_quest_instance_id for update;
  if not found then raise exception using errcode='P0002',message='Quest is unavailable'; end if;
  if quest_row.status='expired' and quest_row.status_reason=p_reason then
    return jsonb_build_object('status','expired','outcome','already_expired','reason',quest_row.status_reason,
      'instance_id',quest_row.id,'expired_at',quest_row.expired_at);
  end if;
  if quest_row.status<>'active' then raise exception using errcode='P0001',message='quest_not_expirable'; end if;

  perform pg_catalog.set_config('sidequest.authoritative_active_expiry','true',true);
  update public.quest_instances set status='expired',status_reason=p_reason,expired_at=now_value,updated_at=now_value
    where id=quest_row.id returning * into quest_row;
  perform pg_catalog.set_config('sidequest.authoritative_active_expiry','false',true);
  return jsonb_build_object('status','expired','outcome','expired','reason',quest_row.status_reason,
    'instance_id',quest_row.id,'expired_at',quest_row.expired_at);
end;
$$;

revoke execute on function public.enforce_authoritative_active_expiry() from public,anon,authenticated,service_role;
revoke execute on function public.expire_active_quest(uuid,text) from public,anon,authenticated;
grant execute on function public.expire_active_quest(uuid,text) to service_role;
