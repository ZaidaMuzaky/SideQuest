-- SQ-0806: bounded owner-scoped safety/availability reports.
create table public.quest_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_instance_id uuid references public.quest_instances(id) on delete set null,
  reason text not null check (reason in ('unsafe', 'unavailable', 'incorrect')),
  created_at timestamptz not null default now()
);
alter table public.quest_reports enable row level security;
create policy quest_reports_insert_owner on public.quest_reports for insert to authenticated with check ((select auth.uid()) = user_id);
create policy quest_reports_select_owner on public.quest_reports for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.quest_reports from anon;
grant insert, select on public.quest_reports to authenticated;
