begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(13);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('07030000-0000-4000-8000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','avatar-owner@example.test','','{}','{"display_name":"Avatar Owner"}',now(),now()),
('07030000-0000-4000-8000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','avatar-other@example.test','','{}','{"display_name":"Avatar Other"}',now(),now());
select ok(has_table_privilege('authenticated','storage.objects','delete'),'SQ-0703 grants authenticated Storage API delete');
select is((select file_size_limit from storage.buckets where id='avatars'),10485760::bigint,'SQ-0703 enforces avatar size');
select is((select allowed_mime_types from storage.buckets where id='avatars'),array['image/jpeg']::text[],'SQ-0703 enforces normalized JPEG');
select is((select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname='avatars_owner_delete' and cmd='DELETE'),1::bigint,'SQ-0703 installs owner delete policy');
set local role authenticated;
select set_config('request.jwt.claim.sub','07030000-0000-4000-8000-000000000011',true);
select is((public.replace_avatar('07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000101.jpg',null)->>'outcome'),'updated','SQ-0703 sets first avatar');
select is((public.replace_avatar('07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000102.jpg','07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000101.jpg')->>'outcome'),'updated','SQ-0703 atomically replaces expected avatar');
select is((public.replace_avatar('07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000102.jpg','07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000101.jpg')->>'outcome'),'already_updated','SQ-0703 safely replays uncertain replacement');
select is((select count(*) from public.list_avatar_cleanup()),1::bigint,'SQ-0703 durably queues superseded avatar');
select is((public.replace_avatar('07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000103.jpg',null)->>'outcome'),'conflict','SQ-0703 rejects stale concurrent replacement');
select is((select count(*) from public.list_avatar_cleanup()),2::bigint,'SQ-0703 queues losing concurrent upload');
select is((public.replace_avatar(null,'07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000102.jpg')->>'outcome'),'updated','SQ-0703 removes current avatar');
select is((public.replace_avatar(null,'07030000-0000-4000-8000-000000000011/07030000-0000-4000-8000-000000000102.jpg')->>'outcome'),'already_updated','SQ-0703 safely replays uncertain removal');
select set_config('request.jwt.claim.sub','07030000-0000-4000-8000-000000000012',true);
select is((select count(*) from public.list_avatar_cleanup()),0::bigint,'SQ-0703 cleanup queue is owner-private');
select * from finish();
rollback;
