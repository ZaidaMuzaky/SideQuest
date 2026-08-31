grant delete on table storage.objects to authenticated;
revoke delete on table storage.objects from anon;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg']
where id = 'avatars';

create table public.avatar_cleanup_queue (
  storage_path text primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint avatar_cleanup_owner_path_check check (
    storage_path ~ ('^' || user_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.jpg$')
  )
);
alter table public.avatar_cleanup_queue enable row level security;
revoke all on table public.avatar_cleanup_queue from public, anon, authenticated;

create or replace function public.replace_avatar(p_new_path text, p_expected_path text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid := auth.uid(); current_path text;
begin
  if uid is null then raise exception using errcode='42501',message='Authentication required'; end if;
  if p_new_path is not null and p_new_path !~ ('^'||uid::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.jpg$') then
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

create or replace function public.list_avatar_cleanup()
returns table(storage_path text) language sql stable security definer set search_path=''
as $$ select q.storage_path from public.avatar_cleanup_queue q where q.user_id=(select auth.uid()) order by q.created_at $$;

create or replace function public.confirm_avatar_cleanup(p_storage_path text)
returns void language plpgsql security definer set search_path=''
as $$ begin delete from public.avatar_cleanup_queue where user_id=auth.uid() and storage_path=p_storage_path; end $$;

revoke all on function public.replace_avatar(text,text), public.list_avatar_cleanup(), public.confirm_avatar_cleanup(text) from public,anon;
grant execute on function public.replace_avatar(text,text), public.list_avatar_cleanup(), public.confirm_avatar_cleanup(text) to authenticated;
