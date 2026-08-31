create or replace function public.list_quest_history(p_status text default null, p_cursor_at timestamptz default null, p_cursor_id uuid default null, p_limit integer default 21)
returns table(id uuid, status text, snapshot jsonb, category_id smallint, occurred_at timestamptz, xp_awarded integer)
language sql security invoker stable set search_path=''
as $$
  select qi.id, qi.status::text, qi.snapshot, qi.category_id,
    case when qi.status = 'completed' then qi.completed_at else qi.abandoned_at end as occurred_at,
    coalesce(qc.xp_awarded, 0)
  from public.quest_instances qi
  left join public.quest_completions qc on qc.quest_instance_id = qi.id and qc.user_id = qi.user_id
  where qi.user_id = (select auth.uid()) and qi.status in ('completed','abandoned')
    and (p_status is null or qi.status::text = p_status)
    and (p_cursor_at is null or (case when qi.status = 'completed' then qi.completed_at else qi.abandoned_at end, qi.id) < (p_cursor_at, p_cursor_id))
  order by case when qi.status = 'completed' then qi.completed_at else qi.abandoned_at end desc, qi.id desc
  limit least(greatest(p_limit, 1), 51)
$$;
revoke all on function public.list_quest_history(text,timestamptz,uuid,integer) from public, anon;
grant execute on function public.list_quest_history(text,timestamptz,uuid,integer) to authenticated;
