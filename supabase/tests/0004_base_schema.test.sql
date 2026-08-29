begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(16);

-- Production audit FKs default deferred so coordinated account deletion can
-- remove the owned graph. Constraint-negative tests opt into immediate checks.
set constraints all immediate;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'one@example.test', '', '{}'::jsonb, '{"display_name":"User One"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'two@example.test', '', '{}'::jsonb, '{"display_name":"User Two"}'::jsonb, now(), now());

insert into public.categories (id, slug, name_key)
values (1, 'chill', 'category.chill');

insert into public.quest_templates (
  id, template_family_id, version, category_id, title, description, instructions,
  duration_min, duration_max, estimated_cost_min, estimated_cost_max, currency_code,
  difficulty, base_xp, location_mode, physical_demand, safety_notes, moderation_status
) values
  ('10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 1, 1,
   'Template One', 'Description', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', 'Low', 'Stay aware', 'approved'),
  ('10000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002', 1, 1,
   'Template Two', 'Description', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', 'Low', 'Stay aware', 'approved'),
  ('10000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000003', 1, 1,
   'Template Three', 'Description', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', 'Low', 'Stay aware', 'approved');

insert into public.quest_searches (
  id, user_id, time_filter, budget_filter, mood_filter, distance_filter, expires_at
) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
   '1_hour', 'free', 'random', 'walking', now() + interval '30 minutes');

insert into public.quest_instances (
  id, user_id, search_id, template_id, status, snapshot, category_id, base_xp, accepted_at
) values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'active', '{}', 1, 50, now());

select throws_ok(
  $$insert into public.quest_instances
      (user_id, search_id, template_id, status, snapshot, category_id, base_xp, accepted_at)
    values
      ('00000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000002', 'active', '{}', 1, 50, now())$$,
  '23505', null,
  'SQ-0004/AC-QUEST-002 rejects a second Active Quest for one user'
);

select throws_ok(
  $$insert into public.quest_templates
      (template_family_id, version, category_id, title, description, instructions, duration_min,
       duration_max, estimated_cost_min, estimated_cost_max, currency_code, difficulty, base_xp,
       location_mode, physical_demand, safety_notes, moderation_status)
    values
      ('11000000-0000-4000-8000-000000000001', 1, 1, 'Duplicate', 'Description', '["Step"]',
       30, 60, 0, 0, 'IDR', 'easy', 50, 'none', 'Low', 'Stay aware', 'approved')$$,
  '23505', null,
  'SQ-0004 rejects duplicate Quest Template family versions'
);

select throws_ok(
  $$insert into public.quest_templates
      (template_family_id, version, category_id, title, description, instructions, duration_min,
       duration_max, currency_code, difficulty, base_xp, location_mode, physical_demand,
       safety_notes, moderation_status)
    values
      (gen_random_uuid(), 1, 1, 'Invalid duration', 'Description', '["Step"]', 60, 30,
       'IDR', 'easy', 50, 'none', 'Low', 'Stay aware', 'approved')$$,
  '23514', null,
  'SQ-0004 rejects an invalid duration range'
);

select throws_ok(
  $$insert into public.quest_templates
      (template_family_id, version, category_id, title, description, instructions, duration_min,
       duration_max, estimated_cost_min, estimated_cost_max, currency_code, difficulty, base_xp,
       location_mode, physical_demand, safety_notes, moderation_status)
    values
      (gen_random_uuid(), 1, 1, 'Invalid cost', 'Description', '["Step"]', 30, 60,
       100, 50, 'IDR', 'easy', 50, 'none', 'Low', 'Stay aware', 'approved')$$,
  '23514', null,
  'SQ-0004 rejects an invalid cost range'
);

select throws_ok(
  $$insert into public.locations (name, area_code, latitude, longitude, timezone)
    values ('Invalid coordinates', 'test-area', 91, 181, 'UTC')$$,
  '23514', null,
  'SQ-0004 rejects invalid coordinates'
);

select throws_ok(
  $$insert into public.categories (id, slug, name_key) values (2, 'random', 'category.random')$$,
  '23514', null,
  'SQ-0004 prevents random from becoming a Quest Category'
);

select throws_ok(
  $$insert into public.quest_instances
      (user_id, search_id, template_id, status, snapshot, category_id, base_xp)
    values
      ('00000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
       '10000000-0000-4000-8000-000000000001', 'candidate', '{}', 1, 50)$$,
  '23503', null,
  'SQ-0004 rejects a Quest Instance linked to another user search'
);

insert into public.quest_instances (
  id, user_id, search_id, template_id, status, snapshot, category_id, base_xp, completed_at
) values
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002',
   'completed', '{}', 1, 50, now()),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003',
   'completed', '{}', 1, 50, now());

insert into public.quest_proofs (id, quest_instance_id, user_id, storage_path, mime_type, byte_size)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000001', 'user-one/proof-one.jpg', 'image/jpeg', 100),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000001', 'user-one/proof-two.jpg', 'image/jpeg', 100);

insert into public.quest_completions (
  id, quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key
) values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
   50, 1, 1, '60000000-0000-4000-8000-000000000001');

insert into public.xp_ledger (id, user_id, quest_completion_id, amount, reason)
values (
  '70000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001', 50, 'quest_completion'
);

update public.user_progress
set lifetime_xp = 50, level = 1, completed_count = 1
where user_id = '00000000-0000-4000-8000-000000000001';

select throws_ok(
  $$insert into public.quest_completions
      (quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key)
    values
      ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
       '40000000-0000-4000-8000-000000000002', 50, 1, 1,
       '60000000-0000-4000-8000-000000000002')$$,
  '23505', null,
  'SQ-0004/AC-COMP-002 rejects duplicate completion for one Quest Instance'
);

select throws_ok(
  $$insert into public.quest_completions
      (quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key)
    values
      ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001',
       '40000000-0000-4000-8000-000000000002', 50, 1, 1,
       '60000000-0000-4000-8000-000000000001')$$,
  '23505', null,
  'SQ-0004/AC-COMP-002 rejects duplicate idempotency key per user'
);

select throws_ok(
  $$insert into public.quest_completions
      (quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key)
    values
      ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002',
       '40000000-0000-4000-8000-000000000002', 50, 1, 1,
       '60000000-0000-4000-8000-000000000003')$$,
  '23503', null,
  'SQ-0004 rejects completion ownership inconsistent with Instance and proof'
);

insert into public.quest_completions (
  id, quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key
) values (
  '50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002',
  50, 1, 1, '60000000-0000-4000-8000-000000000004'
);

select throws_ok(
  $$insert into public.xp_ledger (user_id, quest_completion_id, amount, reason)
    values
      ('00000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002',
       999, 'quest_completion')$$,
  '23503', null,
  'SQ-0004 rejects ledger ownership or amount inconsistent with its completion'
);

select throws_ok(
  $$insert into public.user_progress (user_id, lifetime_xp, level, completed_count)
    values ('00000000-0000-4000-8000-000000000002', -1, 0, -1)$$,
  '23514', null,
  'SQ-0004 rejects invalid progress values'
);

insert into public.quest_searches (
  id, user_id, time_filter, budget_filter, mood_filter, distance_filter, expires_at
) values
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002',
   '1_hour', 'free', 'chill', 'walking', now() + interval '30 minutes');

select throws_ok(
  $$insert into public.quest_instances
      (user_id, search_id, template_id, status, snapshot, category_id, base_xp)
    values
      ('00000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002',
       '10000000-0000-4000-8000-000000000001', 'active', '{}', 1, 50)$$,
  '23514', null,
  'SQ-0004 rejects Active state without accepted_at'
);

select hasnt_column(
  'public', 'quest_searches', 'latitude',
  'SQ-0004 quest searches do not store raw latitude'
);

set constraints all deferred;

select lives_ok(
  $$delete from auth.users where id = '00000000-0000-4000-8000-000000000001'$$,
  'SQ-0004 account deletion can cascade through owned relational records'
);

select is(
  (
    select
      (select count(*) from public.profiles where user_id = '00000000-0000-4000-8000-000000000001')
      + (select count(*) from public.quest_searches where user_id = '00000000-0000-4000-8000-000000000001')
      + (select count(*) from public.quest_instances where user_id = '00000000-0000-4000-8000-000000000001')
      + (select count(*) from public.quest_proofs where user_id = '00000000-0000-4000-8000-000000000001')
      + (select count(*) from public.quest_completions where user_id = '00000000-0000-4000-8000-000000000001')
      + (select count(*) from public.user_progress where user_id = '00000000-0000-4000-8000-000000000001')
      + (select count(*) from public.xp_ledger where user_id = '00000000-0000-4000-8000-000000000001')
  ),
  0::bigint,
  'SQ-0004 account deletion leaves no owned relational rows'
);

select * from finish();
rollback;
