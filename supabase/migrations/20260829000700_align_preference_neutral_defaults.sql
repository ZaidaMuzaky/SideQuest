-- SQ-0102: allow the approved neutral signup time preference.
alter table public.user_preferences
  drop constraint user_preferences_default_time_check;

alter table public.user_preferences
  add constraint user_preferences_default_time_check
  check (default_time in ('30_minutes', '1_hour', '2_hours', 'half_day', 'flexible'));
