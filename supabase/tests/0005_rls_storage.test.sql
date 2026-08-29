begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(46);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-one@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-two@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.profiles (user_id, display_name) values
  ('00000000-0000-4000-8000-000000000011', 'RLS User One'),
  ('00000000-0000-4000-8000-000000000012', 'RLS User Two');

insert into public.user_preferences (
  user_id, default_time, default_budget, default_mood, default_distance
) values
  ('00000000-0000-4000-8000-000000000011', '1_hour', 'free', 'random', 'walking'),
  ('00000000-0000-4000-8000-000000000012', '1_hour', 'free', 'chill', 'walking');

insert into public.categories (id, slug, name_key, is_enabled) values
  (11, 'chill', 'category.chill', true),
  (12, 'food', 'category.food', false),
  (13, 'explore', 'category.explore', true);

insert into public.locations (
  id, name, area_code, latitude, longitude, timezone, is_enabled
) values (
  '90000000-0000-4000-8000-000000000011', 'Disabled place', 'test-area', -6.2, 106.8,
  'Asia/Jakarta', false
);

insert into public.quest_templates (
  id, template_family_id, version, category_id, title, description, instructions,
  duration_min, duration_max, estimated_cost_min, estimated_cost_max, currency_code,
  difficulty, base_xp, location_mode, location_id, physical_demand, safety_notes, moderation_status,
  enabled_at
) values
  ('10000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000011', 1, 11,
   'Approved', 'Visible', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', null, 'Low', 'Stay aware', 'approved', now() - interval '1 minute'),
  ('10000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000012', 1, 11,
   'Draft', 'Hidden', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', null, 'Low', 'Stay aware', 'draft', now() - interval '1 minute'),
  ('10000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000013', 1, 12,
   'Disabled category', 'Hidden', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', null, 'Low', 'Stay aware', 'approved', now() - interval '1 minute'),
  ('10000000-0000-4000-8000-000000000014', '11000000-0000-4000-8000-000000000014', 1, 13,
   'Future', 'Hidden', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', null, 'Low', 'Stay aware', 'approved', now() + interval '1 day'),
  ('10000000-0000-4000-8000-000000000015', '11000000-0000-4000-8000-000000000015', 1, 13,
   'Expired', 'Hidden', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'none', null, 'Low', 'Stay aware', 'approved', now() - interval '2 days'),
  ('10000000-0000-4000-8000-000000000016', '11000000-0000-4000-8000-000000000016', 1, 13,
   'Disabled location', 'Hidden', '["Step"]', 30, 60, 0, 0, 'IDR', 'easy', 50,
   'place', '90000000-0000-4000-8000-000000000011', 'Low', 'Stay aware', 'approved',
   now() - interval '1 minute');

update public.quest_templates
set disabled_at = now() - interval '1 day'
where id = '10000000-0000-4000-8000-000000000015';

insert into public.quest_searches (
  id, user_id, time_filter, budget_filter, mood_filter, distance_filter, expires_at
) values
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011',
   '1_hour', 'free', 'random', 'walking', now() + interval '30 minutes'),
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012',
   '1_hour', 'free', 'chill', 'walking', now() + interval '30 minutes');

insert into public.quest_instances (
  id, user_id, search_id, template_id, status, snapshot, category_id, base_xp, accepted_at
) values
  ('30000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000011',
   '20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011',
   'active', '{}', 11, 50, now()),
  ('30000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000012',
   '20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000011',
   'active', '{}', 11, 50, now());

insert into public.quest_instances (
  id, user_id, search_id, template_id, status, snapshot, category_id, base_xp, completed_at
) values
  ('30000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000011',
   '20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011',
   'completed', '{}', 11, 50, now()),
  ('30000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000012',
   '20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000011',
   'completed', '{}', 11, 50, now());

insert into public.quest_proofs (
  id, quest_instance_id, user_id, storage_path, mime_type, byte_size
) values
  ('40000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000021',
   '00000000-0000-4000-8000-000000000011',
   '00000000-0000-4000-8000-000000000011/30000000-0000-4000-8000-000000000021/40000000-0000-4000-8000-000000000021.jpg',
   'image/jpeg', 100),
  ('40000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000022',
   '00000000-0000-4000-8000-000000000012',
   '00000000-0000-4000-8000-000000000012/30000000-0000-4000-8000-000000000022/40000000-0000-4000-8000-000000000022.jpg',
   'image/jpeg', 100);

insert into public.quest_completions (
  id, quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key
) values
  ('50000000-0000-4000-8000-000000000021', '30000000-0000-4000-8000-000000000021',
   '00000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000021',
   50, 1, 1, '60000000-0000-4000-8000-000000000021'),
  ('50000000-0000-4000-8000-000000000022', '30000000-0000-4000-8000-000000000022',
   '00000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000022',
   50, 1, 1, '60000000-0000-4000-8000-000000000022');

insert into public.user_progress (user_id, lifetime_xp, level, completed_count) values
  ('00000000-0000-4000-8000-000000000011', 50, 1, 1),
  ('00000000-0000-4000-8000-000000000012', 50, 1, 1);

insert into public.xp_ledger (id, user_id, quest_completion_id, amount, reason) values
  ('70000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000011',
   '50000000-0000-4000-8000-000000000021', 50, 'quest_completion'),
  ('70000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000012',
   '50000000-0000-4000-8000-000000000022', 50, 'quest_completion');

select is(
  (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity
    and relname in ('profiles', 'user_preferences', 'categories', 'locations', 'quest_templates',
      'quest_searches', 'quest_instances', 'quest_proofs', 'quest_completions', 'user_progress', 'xp_ledger')),
  11::bigint,
  'SQ-0005 enables RLS on all eleven public tables'
);

select is(
  (select count(*) from storage.buckets where id in ('quest-proofs', 'avatars') and not public),
  2::bigint,
  'SQ-0005 creates both Storage buckets as private'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);

select results_eq(
  $$select display_name from public.profiles order by display_name$$,
  $$values ('RLS User One'::text)$$,
  'SQ-0005/FR-PROFILE-001 allows an owner profile read only'
);

select is((select count(*) from public.quest_searches), 1::bigint,
  'SQ-0005/AC-PRIV-001 hides another user search');
select is((select count(*) from public.quest_instances), 2::bigint,
  'SQ-0005/AC-PRIV-001 hides another user Quest Instance history');

select is((select count(*) from public.user_preferences), 1::bigint,
  'SQ-0005/AC-PRIV-001 hides another user preferences');
select is((select count(*) from public.quest_completions), 1::bigint,
  'SQ-0005/AC-PRIV-001 hides another user completion history');
select is((select count(*) from public.user_progress), 1::bigint,
  'SQ-0005/AC-PRIV-001 hides another user progress');
select is((select count(*) from public.xp_ledger), 1::bigint,
  'SQ-0005/AC-PRIV-001 hides another user XP ledger');

select lives_ok(
  $$update public.profiles set display_name = 'RLS User One Updated'
    where user_id = '00000000-0000-4000-8000-000000000011'$$,
  'SQ-0005 allows an owner to update an approved profile column'
);

select lives_ok(
  $$update public.user_preferences set theme = 'dark'
    where user_id = '00000000-0000-4000-8000-000000000011'$$,
  'SQ-0005 allows an owner to update an approved preference column'
);

select is(
  (with changed as (
    update public.profiles set display_name = 'Cross-account edit'
    where user_id = '00000000-0000-4000-8000-000000000012' returning 1
  ) select count(*) from changed),
  0::bigint,
  'SQ-0005/AC-PRIV-001 prevents cross-user profile updates'
);

select is(
  (with changed as (
    update public.user_preferences set theme = 'light'
    where user_id = '00000000-0000-4000-8000-000000000012' returning 1
  ) select count(*) from changed),
  0::bigint,
  'SQ-0005/AC-PRIV-001 prevents cross-user preference updates'
);

select throws_ok(
  $$update public.profiles
    set avatar_path = '00000000-0000-4000-8000-000000000012/80000000-0000-4000-8000-000000000012.png'
    where user_id = '00000000-0000-4000-8000-000000000011'$$,
  '42501', null,
  'SQ-0005 rejects a forged cross-owner avatar path on profile update'
);

select throws_ok(
  $$update public.profiles
    set avatar_path =
      '00000000-0000-4000-8000-000000000011/80000000-0000-4000-8000-000000000011.png.exe'
    where user_id = '00000000-0000-4000-8000-000000000011'$$,
  '42501', null,
  'SQ-0005 rejects an avatar profile path with a trailing double extension'
);

select throws_ok(
  $$update public.profiles set user_id = '00000000-0000-4000-8000-000000000012'
    where user_id = '00000000-0000-4000-8000-000000000011'$$,
  '42501', null,
  'SQ-0005 denies forging profile ownership'
);

select throws_ok(
  $$delete from public.profiles
    where user_id = '00000000-0000-4000-8000-000000000011'$$,
  '42501', null,
  'SQ-0005 denies direct client profile deletion'
);

select throws_ok(
  $$insert into public.quest_searches
      (user_id, time_filter, budget_filter, mood_filter, distance_filter, expires_at)
    values ('00000000-0000-4000-8000-000000000011', '1_hour', 'free', 'chill', 'walking',
      now() + interval '30 minutes')$$,
  '42501', null,
  'SQ-0005 denies direct client search insertion'
);

select throws_ok(
  $$delete from public.quest_searches
    where id = '20000000-0000-4000-8000-000000000011'$$,
  '42501', null,
  'SQ-0005 denies direct private-table deletion'
);

select throws_ok(
  $$update public.quest_instances set status = 'abandoned', status_reason = 'user_abandoned',
      abandoned_at = now() where id = '30000000-0000-4000-8000-000000000011'$$,
  '42501', null,
  'SQ-0005 denies arbitrary direct lifecycle transitions'
);

select throws_ok(
  $$insert into public.quest_proofs
      (quest_instance_id, user_id, storage_path, mime_type, byte_size)
    values ('30000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000011', 'forged/proof.jpg', 'image/jpeg', 100)$$,
  '42501', null,
  'SQ-0005 denies direct proof metadata insertion'
);

select throws_ok(
  $$insert into public.quest_completions
      (quest_instance_id, user_id, proof_id, xp_awarded, level_before, level_after, idempotency_key)
    values ('30000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000011', gen_random_uuid(), 9999, 1, 99,
      gen_random_uuid())$$,
  '42501', null,
  'SQ-0005 denies direct completion insertion'
);

select throws_ok(
  $$insert into public.user_progress (user_id, lifetime_xp, level, completed_count)
    values ('00000000-0000-4000-8000-000000000011', 9999, 99, 99)$$,
  '42501', null,
  'SQ-0005 denies forged progress insertion'
);

select throws_ok(
  $$insert into public.xp_ledger (user_id, quest_completion_id, amount, reason)
    values ('00000000-0000-4000-8000-000000000011', gen_random_uuid(), 9999,
      'quest_completion')$$,
  '42501', null,
  'SQ-0005 denies forged XP ledger insertion'
);

select results_eq(
  $$select title from public.approved_quest_catalog order by title$$,
  $$values ('Approved'::text)$$,
  'SQ-0005 catalog view exposes only approved content in enabled categories'
);

select is((select count(*) from public.categories), 2::bigint,
  'SQ-0005 base category reads expose enabled rows only');
select is((select count(*) from public.locations), 0::bigint,
  'SQ-0005 base Location reads hide disabled rows');
select is((select count(*) from public.quest_templates), 1::bigint,
  'SQ-0005 base Quest Template reads expose approved and currently enabled rows only');

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('quest-proofs',
      '00000000-0000-4000-8000-000000000011/30000000-0000-4000-8000-000000000011/40000000-0000-4000-8000-000000000011.jpg')
    returning id$$,
  'SQ-0005 allows Storage upload INSERT RETURNING for an owned Active Quest'
);

select is(
  (select count(*) from storage.objects where bucket_id = 'quest-proofs'),
  1::bigint,
  'SQ-0005 lets the owner read the valid Active-Quest upload before metadata registration'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('quest-proofs',
      '00000000-0000-4000-8000-000000000011/30000000-0000-4000-8000-000000000012/40000000-0000-4000-8000-000000000012.jpg')$$,
  '42501', null,
  'SQ-0005/AC-PRIV-001 denies proof upload for another user Quest'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('quest-proofs',
      '00000000-0000-4000-8000-000000000011/not-an-instance/not-a-proof.exe')$$,
  '42501', null,
  'SQ-0005 rejects malformed proof paths and unsafe extensions'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('quest-proofs',
      '00000000-0000-4000-8000-000000000011/30000000-0000-4000-8000-000000000011/40000000-0000-4000-8000-000000000019.jpg.exe')$$,
  '42501', null,
  'SQ-0005 rejects a proof path with a trailing double extension'
);

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars',
      '00000000-0000-4000-8000-000000000011/80000000-0000-4000-8000-000000000011.png')$$,
  'SQ-0005 allows an owner avatar upload path'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars',
      '00000000-0000-4000-8000-000000000012/80000000-0000-4000-8000-000000000012.png')$$,
  '42501', null,
  'SQ-0005/AC-PRIV-001 denies cross-owner avatar upload paths'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars',
      '00000000-0000-4000-8000-000000000011/80000000-0000-4000-8000-000000000019.png.trailing')$$,
  '42501', null,
  'SQ-0005 rejects an avatar path with a trailing suffix'
);

select is((select count(*) from storage.objects where bucket_id = 'avatars'), 1::bigint,
  'SQ-0005 allows only the owner to read their avatar object');

select is(
  (with changed as (
    update storage.objects set name =
        '00000000-0000-4000-8000-000000000011/80000000-0000-4000-8000-000000000099.png'
      where bucket_id = 'avatars'
      returning 1
  ) select count(*) from changed),
  0::bigint,
  'SQ-0005 denies direct Storage object updates'
);

select throws_ok(
  $$delete from storage.objects where bucket_id = 'avatars'$$,
  '42501', null,
  'SQ-0005 denies direct Storage object deletion'
);

reset role;

insert into public.quest_proofs (
  id, quest_instance_id, user_id, storage_path, mime_type, byte_size
) values (
  '40000000-0000-4000-8000-000000000011',
  '30000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000011/30000000-0000-4000-8000-000000000011/40000000-0000-4000-8000-000000000011.jpg',
  'image/jpeg', 100
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);
select is((select count(*) from storage.objects where bucket_id = 'quest-proofs'), 1::bigint,
  'SQ-0005 retains owner proof reads after matching metadata registration');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);
select results_eq(
  $$select id from public.quest_proofs order by id$$,
  $$values ('40000000-0000-4000-8000-000000000022'::uuid)$$,
  'SQ-0005/AC-PRIV-001 exposes only the current user proof metadata'
);
select is((select count(*) from storage.objects), 0::bigint,
  'SQ-0005/AC-PRIV-001 denies cross-user proof and avatar object reads');

reset role;
set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501', null,
  'SQ-0005 denies anonymous private-table reads'
);

select throws_ok(
  $$select * from public.approved_quest_catalog$$,
  '42501', null,
  'SQ-0005 denies unauthenticated catalog access'
);

select is(
  (select count(*) from storage.objects),
  0::bigint,
  'SQ-0005 denies anonymous Storage reads'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars',
      '00000000-0000-4000-8000-000000000011/80000000-0000-4000-8000-000000000098.png')$$,
  '42501', null,
  'SQ-0005 denies anonymous Storage uploads'
);

select * from finish();
rollback;
