alter table public.avatar_cleanup_queue drop constraint avatar_cleanup_owner_path_check;
alter table public.avatar_cleanup_queue add constraint avatar_cleanup_owner_path_check check (
  storage_path ~ ('^' || user_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$')
);

create or replace function public.replace_avatar(p_new_path text, p_expected_path text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid := auth.uid(); current_path text;
begin
  if uid is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_new_path is not null and p_new_path !~ ('^'||uid::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$') then
    raise exception using errcode='22023',message='Invalid avatar path';
  end if;
  select avatar_path into current_path from public.profiles where user_id=uid for update;
  if not found then raise exception using errcode='P0002',message='Profile not found'; end if;
  if current_path is distinct from p_expected_path then
    if p_new_path is not null then insert into public.avatar_cleanup_queue(storage_path,user_id) values(p_new_path,uid) on conflict do nothing; end if;
    return jsonb_build_object('outcome','conflict','current_path',current_path);
  end if;
  update public.profiles set avatar_path=p_new_path,updated_at=now() where user_id=uid;
  if current_path is not null and current_path is distinct from p_new_path then
    insert into public.avatar_cleanup_queue(storage_path,user_id) values(current_path,uid) on conflict do nothing;
  end if;
  return jsonb_build_object('outcome','updated','current_path',p_new_path,'cleanup_path',current_path);
end $$;
