-- SQ-0102: atomically bootstrap application identity after Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name_value text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if char_length(display_name_value) < 2 or char_length(display_name_value) > 40 then
    raise exception 'display name is invalid';
  end if;
  insert into public.profiles (user_id, display_name) values (new.id, display_name_value);
  insert into public.user_preferences (user_id, default_time, default_budget, default_mood, default_distance)
    values (new.id, 'flexible', 'flexible', 'random', 'flexible');
  insert into public.user_progress (user_id) values (new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
