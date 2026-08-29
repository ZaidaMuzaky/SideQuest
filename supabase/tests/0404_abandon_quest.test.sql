begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(14);

select isnt(has_function_privilege('anon','public.abandon_quest(uuid)','EXECUTE'),true,'SQ-0404 denies anonymous abandon');
select ok(has_function_privilege('authenticated','public.abandon_quest(uuid)','EXECUTE'),'SQ-0404 grants authenticated abandon');
select ok(position('pg_advisory_xact_lock' in pg_get_functiondef('public.abandon_quest(uuid)'::regprocedure))>0,
 'SQ-0404 serializes lifecycle mutation per user');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('04040000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','abandon@example.test','','{}','{"display_name":"Abandon User"}',now(),now()),
 ('04040000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-abandon@example.test','','{}','{"display_name":"Other User"}',now(),now());
insert into public.categories(slug,name_key,is_enabled) values('chill','categories.chill',true) on conflict(slug) do update set is_enabled=true;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,enabled_at)
select '04040000-0000-4000-8000-000000000101','04040000-0000-4000-8000-000000000201',1,id,'Fixture','Description','["Step"]',30,30,
 0,0,'IDR','easy',50,'none','Low','Safe','approved',now()-interval '1 day' from public.categories where slug='chill';
insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,expires_at) values
 ('04040000-0000-4000-8000-000000000301','04040000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval '30 minutes'),
 ('04040000-0000-4000-8000-000000000302','04040000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval '30 minutes');
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,accepted_at,completed_at)
select v.id,'04040000-0000-4000-8000-000000000001',v.search_id,'04040000-0000-4000-8000-000000000101',v.status,
 jsonb_build_object('title',v.title),c.id,50,v.accepted,v.completed
from (values
 ('04040000-0000-4000-8000-000000000401'::uuid,'04040000-0000-4000-8000-000000000301'::uuid,'active'::public.quest_status,'Active fixture',now(),null::timestamptz),
 ('04040000-0000-4000-8000-000000000402','04040000-0000-4000-8000-000000000302','completed','Completed fixture',now(),now())
) v(id,search_id,status,title,accepted,completed) join public.categories c on c.slug='chill';
insert into public.quest_proofs(id,quest_instance_id,user_id,storage_path,mime_type,byte_size,status)
values('04040000-0000-4000-8000-000000000501','04040000-0000-4000-8000-000000000401','04040000-0000-4000-8000-000000000001',
 '04040000-0000-4000-8000-000000000001/proof.jpg','image/jpeg',100,'uploaded');

select set_config('request.jwt.claim.sub','04040000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(public.abandon_quest('04040000-0000-4000-8000-000000000401')->>'outcome','abandoned','SQ-0404 abandons an owned Active Quest');
select is((select status::text from public.quest_instances where id='04040000-0000-4000-8000-000000000401'),'abandoned','SQ-0404 persists Abandoned status');
select is((select status_reason from public.quest_instances where id='04040000-0000-4000-8000-000000000401'),'user_abandoned','SQ-0404 records documented reason');
select ok((select abandoned_at is not null from public.quest_instances where id='04040000-0000-4000-8000-000000000401'),'SQ-0404 records abandoned_at');
select is((select status from public.quest_proofs where id='04040000-0000-4000-8000-000000000501'),'pending_delete','SQ-0404 marks proof metadata for explicit cleanup');
select is((select count(*) from public.xp_ledger where user_id='04040000-0000-4000-8000-000000000001'),0::bigint,'SQ-0404 awards zero XP');
select is((select count(*) from public.quest_instances where user_id='04040000-0000-4000-8000-000000000001' and status='active'),0::bigint,'SQ-0404 leaves no Active Quest');
select is(public.abandon_quest('04040000-0000-4000-8000-000000000401')->>'outcome','already_abandoned','SQ-0404 replay is idempotent');
select is((select count(*) from public.quest_proofs where id='04040000-0000-4000-8000-000000000501'),1::bigint,'SQ-0404 never deletes proof metadata directly');
select throws_ok($$select public.abandon_quest('04040000-0000-4000-8000-000000000402')$$,'P0001','quest_not_abandonable','SQ-0404 rejects completed terminal state');

reset role;
select set_config('request.jwt.claim.sub','04040000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.abandon_quest('04040000-0000-4000-8000-000000000401')$$,'42501','Quest is unavailable','SQ-0404 prevents cross-owner abandon');
reset role;
select * from finish();
rollback;
