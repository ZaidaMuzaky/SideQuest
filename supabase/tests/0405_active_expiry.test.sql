begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(15);

select isnt(has_function_privilege('authenticated','public.expire_active_quest(uuid,text)','EXECUTE'),true,'SQ-0405 denies client expiry');
select isnt(has_function_privilege('anon','public.expire_active_quest(uuid,text)','EXECUTE'),true,'SQ-0405 denies anonymous expiry');
select ok(has_function_privilege('service_role','public.expire_active_quest(uuid,text)','EXECUTE'),'SQ-0405 grants trusted service role only');
select ok(position('duration' in lower(pg_get_functiondef('public.expire_active_quest(uuid,text)'::regprocedure)))=0,'SQ-0405 never uses estimated duration');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',email,'','{}','{"display_name":"Expiry User"}',now(),now()
from (values
 ('04050000-0000-4000-8000-000000000001'::uuid,'expiry1@example.test'),
 ('04050000-0000-4000-8000-000000000002','expiry2@example.test'),
 ('04050000-0000-4000-8000-000000000003','expiry3@example.test')) v(id,email);
insert into public.categories(slug,name_key,is_enabled) values('chill','categories.chill',true) on conflict(slug) do update set is_enabled=true;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,enabled_at)
select '04050000-0000-4000-8000-000000000101','04050000-0000-4000-8000-000000000201',1,id,'Fixture','Description','["Step"]',30,30,
 0,0,'IDR','easy',50,'none','Low','Safe','approved',now()-interval '1 day' from public.categories where slug='chill';
insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,expires_at)
select ('04050000-0000-4000-8000-00000000030'||n)::uuid,('04050000-0000-4000-8000-00000000000'||n)::uuid,
 '30_minutes','free','chill','walking',now()+interval '30 minutes' from generate_series(1,3)n;
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,accepted_at)
select ('04050000-0000-4000-8000-00000000040'||n)::uuid,('04050000-0000-4000-8000-00000000000'||n)::uuid,
 ('04050000-0000-4000-8000-00000000030'||n)::uuid,'04050000-0000-4000-8000-000000000101','active',
 jsonb_build_object('title','Fixture','duration_max',30),c.id,50,now()-interval '2 days'
from generate_series(1,3)n cross join public.categories c where c.slug='chill';

select is((select status::text from public.quest_instances where id='04050000-0000-4000-8000-000000000401'),'active','SQ-0405 elapsed duration leaves Active unchanged');
select throws_ok($$update public.quest_instances set status='expired',status_reason='safety_disabled',expired_at=now() where id='04050000-0000-4000-8000-000000000401'$$,
 '42501','active_expiry_requires_authoritative_rpc','SQ-0405 trigger rejects direct expiry even by elevated SQL');

select set_config('request.jwt.claim.role','service_role',true);
set local role service_role;
select is(public.expire_active_quest('04050000-0000-4000-8000-000000000401','safety_disabled')->>'outcome','expired','SQ-0405 explicitly expires for safety');
select is((select status_reason from public.quest_instances where id='04050000-0000-4000-8000-000000000401'),'safety_disabled','SQ-0405 persists safety reason');
select ok((select expired_at is not null from public.quest_instances where id='04050000-0000-4000-8000-000000000401'),'SQ-0405 records expiry timestamp');
select is(public.expire_active_quest('04050000-0000-4000-8000-000000000401','safety_disabled')->>'outcome','already_expired','SQ-0405 same request is idempotent');
select is(public.expire_active_quest('04050000-0000-4000-8000-000000000402','availability_expired')->>'reason','availability_expired','SQ-0405 supports explicit availability expiry');
select throws_ok($$select public.expire_active_quest('04050000-0000-4000-8000-000000000403','duration_elapsed')$$,
 '22023','Invalid Active expiry reason','SQ-0405 rejects every unapproved reason');
select is((select count(*) from public.xp_ledger where user_id in ('04050000-0000-4000-8000-000000000001','04050000-0000-4000-8000-000000000002')),0::bigint,'SQ-0405 awards no XP');
select is((select status::text from public.quest_instances where id='04050000-0000-4000-8000-000000000403'),'active','SQ-0405 invalid request leaves Active state intact');

reset role;
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
select throws_ok($$select public.expire_active_quest('04050000-0000-4000-8000-000000000403','safety_disabled')$$,
 '42501','Trusted server role required','SQ-0405 function also validates trusted role internally');
reset role;
select * from finish();
rollback;
