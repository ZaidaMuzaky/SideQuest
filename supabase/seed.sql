-- SQ-0006: deterministic, geography-neutral development catalog.
-- This seed is intentionally limited to non-production demo content. It is
-- safe to run repeatedly: stable IDs are inserted once and category labels
-- are reconciled by their authoritative slugs.

insert into public.categories (slug, name_key, is_enabled)
values
  ('chill', 'categories.chill', true),
  ('food', 'categories.food', true),
  ('explore', 'categories.explore', true),
  ('active', 'categories.active', true),
  ('creative', 'categories.creative', true)
on conflict (slug) do update
set name_key = excluded.name_key,
    is_enabled = excluded.is_enabled;

insert into public.locations (id, name, area_code, timezone, is_enabled)
values
  ('00000000-0000-4000-8000-000000000001', 'Development Reading Room', 'dev_area_alpha', 'UTC', true),
  ('00000000-0000-4000-8000-000000000002', 'Development Market Hall', 'dev_area_beta', 'UTC', true)
on conflict (id) do nothing;

insert into public.quest_templates (
  id, template_family_id, version, category_id, title, description,
  instructions, duration_min, duration_max, estimated_cost_min,
  estimated_cost_max, currency_code, difficulty, base_xp, location_mode,
  area_codes, location_id, physical_demand, safety_notes, moderation_status,
  priority, enabled_at
)
select seed.id, seed.family_id, 1, category.id, seed.title, seed.description,
  seed.instructions::jsonb, seed.duration_min, seed.duration_max,
  seed.cost_min, seed.cost_max, 'IDR', seed.difficulty::public.difficulty,
  seed.base_xp, seed.location_mode::public.location_mode, seed.area_codes,
  seed.location_id, seed.physical_demand, seed.safety_notes, 'approved',
  0, now()
from (values
  ('00000000-0000-4000-8000-000000000101'::uuid, '00000000-0000-4000-8000-000000000201'::uuid, 'chill', 'Reset Walk', 'Take a calm, screen-free pause.', '["Choose a comfortable pace", "Notice five things around you", "Finish with a slow breath"]', 15, 30, 0, 0, 'easy', 50, 'none', null::text[], null::uuid, 'Light walking or seated reflection.', 'Stay in a comfortable public or familiar setting and stop if conditions feel unsafe.'),
  ('00000000-0000-4000-8000-000000000102'::uuid, '00000000-0000-4000-8000-000000000202'::uuid, 'food', 'Flavor Notes', 'Explore a small, budget-friendly taste.', '["Choose one affordable item", "Taste it mindfully", "Write one sentence about the flavor"]', 20, 45, 0, 50000, 'easy', 60, 'area', array['dev_area_alpha'], null::uuid, 'Seated activity with optional short walk.', 'Choose a clean, public venue and respect dietary needs and venue rules.'),
  ('00000000-0000-4000-8000-000000000103'::uuid, '00000000-0000-4000-8000-000000000203'::uuid, 'explore', 'Notice the Details', 'Find and appreciate small details in a public place.', '["Choose a public route", "Find three overlooked details", "Record what made one detail interesting"]', 30, 60, 0, 0, 'easy', 70, 'place', null::text[], '00000000-0000-4000-8000-000000000001'::uuid, 'Walking on a user-chosen accessible route.', 'Use public paths, remain aware of surroundings, and do not enter restricted areas.'),
  ('00000000-0000-4000-8000-000000000104'::uuid, '00000000-0000-4000-8000-000000000204'::uuid, 'active', 'Gentle Movement', 'Complete a short movement break at your own pace.', '["Choose a clear safe space", "Move gently for five minutes", "Cool down and check in with yourself"]', 10, 30, 0, 0, 'easy', 60, 'none', null::text[], null::uuid, 'Low-impact movement; adapt or stop as needed.', 'Avoid traffic, heights, and unsafe surfaces; stop immediately if uncomfortable.'),
  ('00000000-0000-4000-8000-000000000105'::uuid, '00000000-0000-4000-8000-000000000205'::uuid, 'creative', 'Tiny Field Notes', 'Make a small creative record of what you notice.', '["Pick one nearby subject", "Create a six-line sketch or note", "Give it a short title"]', 20, 45, 0, 0, 'easy', 60, 'area', array['dev_area_beta'], null::uuid, 'Seated or standing creative activity.', 'Do not photograph people without consent and respect private property.'
) as seed(id, family_id, slug, title, description, instructions, duration_min, duration_max, cost_min, cost_max, difficulty, base_xp, location_mode, area_codes, location_id, physical_demand, safety_notes)
join public.categories category on category.slug = seed.slug
on conflict (id) do nothing;
