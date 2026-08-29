-- SQ-0305: authenticated, non-authoritative display clock for Candidate countdowns.

create function public.quest_server_time()
returns timestamptz
language sql
volatile
set search_path = ''
as $$
  select clock_timestamp();
$$;

revoke all on function public.quest_server_time() from public, anon;
grant execute on function public.quest_server_time() to authenticated;
