-- SQ-0304: Candidate TTL is authoritative for every activation path.

create function public.enforce_candidate_expiry_on_activation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'candidate' and new.status = 'active'
    and (old.candidate_expires_at is null or old.candidate_expires_at <= clock_timestamp()) then
    raise exception using errcode = 'P0001', message = 'candidate_expired';
  end if;
  return new;
end;
$$;

create trigger quest_instances_enforce_candidate_expiry
before update of status on public.quest_instances
for each row execute function public.enforce_candidate_expiry_on_activation();

revoke execute on function public.enforce_candidate_expiry_on_activation()
  from public, anon, authenticated;
