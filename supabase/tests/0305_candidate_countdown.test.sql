begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

select ok(
  not has_function_privilege('anon', 'public.quest_server_time()', 'execute'),
  'SQ-0305 does not expose the server clock RPC to anonymous clients'
);
select ok(
  has_function_privilege('authenticated', 'public.quest_server_time()', 'execute'),
  'SQ-0305 allows authenticated clients to obtain a server time anchor'
);
select ok(
  abs(extract(epoch from (public.quest_server_time() - clock_timestamp()))) < 2,
  'SQ-0305 returns current database time for the display-only countdown'
);

select * from finish();
rollback;
