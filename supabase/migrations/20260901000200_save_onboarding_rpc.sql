-- SQ-0104: atomically persist onboarding defaults and completion.
create or replace function public.save_onboarding(
  p_user_id uuid,
  p_default_time text,
  p_default_budget text,
  p_default_mood text,
  p_default_distance text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;
  if p_default_time not in ('30_minutes', '1_hour', '2_hours', 'half_day', 'flexible')
    or p_default_budget not in ('free', 'under_50000', 'under_100000', 'flexible')
    or p_default_mood not in ('chill', 'food', 'explore', 'active', 'creative', 'random')
    or p_default_distance not in ('walking', 'under_3_km', 'under_10_km', 'flexible') then
    raise exception 'invalid onboarding preferences';
  end if;

  update public.user_preferences
  set default_time = p_default_time, default_budget = p_default_budget,
      default_mood = p_default_mood, default_distance = p_default_distance
  where user_id = p_user_id;
  if not found then raise exception 'preferences not found'; end if;

  update public.profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where user_id = p_user_id;
  if not found then raise exception 'profile not found'; end if;
end;
$$;

revoke all on function public.save_onboarding(uuid, text, text, text, text) from public, anon;
grant execute on function public.save_onboarding(uuid, text, text, text, text) to authenticated;
