-- SQ-0601: authoritative XP/level thresholds.

create function public.quest_level_for_xp(p_xp bigint)
returns integer language sql immutable strict set search_path=''
as $$ select greatest(1, floor((1 + sqrt(1 + 8 * greatest(p_xp, 0)::numeric / 100)) / 2)::integer); $$;

create function public.quest_xp_for_level(p_level integer)
returns bigint language sql immutable strict set search_path=''
as $$ select (100::bigint * greatest(p_level - 1, 0) * greatest(p_level, 1)) / 2; $$;

revoke all on function public.quest_level_for_xp(bigint), public.quest_xp_for_level(integer) from public, anon, authenticated;
grant execute on function public.quest_level_for_xp(bigint), public.quest_xp_for_level(integer) to authenticated;
