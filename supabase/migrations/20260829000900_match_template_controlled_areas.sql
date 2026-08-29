-- SQ-0302: recognize controlled area codes from approved Quest Template catalog
-- data as well as enabled public Location catalog data.

create function public.is_controlled_quest_area(value text, instant timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select value is not null and (
    exists (
      select 1 from public.locations
      where area_code = value and is_enabled
    )
    or exists (
      select 1
      from public.quest_templates as template
      join public.categories as category on category.id = template.category_id
      where template.location_mode = 'area'
        and value = any(template.area_codes)
        and template.moderation_status = 'approved'
        and template.enabled_at is not null
        and template.enabled_at <= instant
        and (template.disabled_at is null or template.disabled_at > instant)
        and category.is_enabled
    )
  );
$$;

do $$
declare
  definition text;
  original text := 'if p_area_code is not null and exists(select 1 from public.locations where area_code=p_area_code and is_enabled) then';
  replacement text := 'if p_area_code is not null and public.is_controlled_quest_area(p_area_code, now_value) then';
begin
  definition := pg_catalog.pg_get_functiondef(
    'public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text)'::regprocedure
  );
  if pg_catalog.strpos(definition, original) = 0 then
    raise exception 'SQ-0302 match_quest controlled-area predicate was not found';
  end if;
  execute pg_catalog.replace(definition, original, replacement);
end;
$$;

revoke execute on function public.is_controlled_quest_area(text,timestamptz)
  from public, anon, authenticated;
