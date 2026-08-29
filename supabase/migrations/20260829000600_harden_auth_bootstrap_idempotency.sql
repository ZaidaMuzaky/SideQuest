-- SQ-0102: make Auth bootstrap safe for repeated invocation without mutating state.
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
  insert into public.profiles (user_id, display_name) values (new.id, display_name_value)
    on conflict (user_id) do nothing;
  insert into public.user_preferences (user_id, default_time, default_budget, default_mood, default_distance)
    values (new.id, 'flexible', 'flexible', 'random', 'flexible')
    on conflict (user_id) do nothing;
  insert into public.user_progress (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
