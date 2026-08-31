create or replace function public.list_quest_history(
  p_status text default null,
  p_cursor_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 21
)
returns table(id uuid, status text, snapshot jsonb, category_id smallint, occurred_at timestamptz, xp_awarded integer)
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  if p_status is not null and p_status not in ('completed', 'abandoned') then
    raise exception using errcode = '22023', message = 'Invalid history status';
  end if;
  if (p_cursor_at is null) <> (p_cursor_id is null) then
    raise exception using errcode = '22023', message = 'History cursor timestamp and id must be provided together';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 51 then
    raise exception using errcode = '22023', message = 'History limit must be between 1 and 51';
  end if;

  return query
  select qi.id, qi.status::text, qi.snapshot, qi.category_id,
    case when qi.status = 'completed' then qi.completed_at else qi.abandoned_at end as occurred_at,
    coalesce(qc.xp_awarded, 0)
  from public.quest_instances qi
  left join public.quest_completions qc on qc.quest_instance_id = qi.id and qc.user_id = qi.user_id
  where qi.user_id = (select auth.uid()) and qi.status in ('completed','abandoned')
    and (p_status is null or qi.status::text = p_status)
    and (p_cursor_at is null or (case when qi.status = 'completed' then qi.completed_at else qi.abandoned_at end, qi.id) < (p_cursor_at, p_cursor_id))
  order by case when qi.status = 'completed' then qi.completed_at else qi.abandoned_at end desc, qi.id desc
  limit p_limit;
end
$$;

revoke all on function public.list_quest_history(text,timestamptz,uuid,integer) from public, anon;
grant execute on function public.list_quest_history(text,timestamptz,uuid,integer) to authenticated;

create index if not exists quest_instances_user_terminal_history_idx
  on public.quest_instances (
    user_id,
    (case when status = 'completed' then completed_at else abandoned_at end) desc,
    id desc
  )
  where status in ('completed', 'abandoned');
