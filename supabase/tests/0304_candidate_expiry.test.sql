begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(5);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('03040000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'expiry@example.test','','{}','{"display_name":"Expiry User"}',now(),now());
insert into public.categories(slug,name_key,is_enabled) values('chill','categories.chill',true)
on conflict(slug) do update set is_enabled=true;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,enabled_at)
select '03040000-0000-4000-8000-000000000101','03040000-0000-4000-8000-000000000201',1,id,'Expiry fixture','Description',
 '["Step"]',30,30,0,0,'IDR','easy',50,'none','Low','Stay aware','approved',now()-interval '1 day'
from public.categories where slug='chill';
insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,expires_at)
values('03040000-0000-4000-8000-000000000301','03040000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval '30 minutes');
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,candidate_expires_at)
select '03040000-0000-4000-8000-000000000401','03040000-0000-4000-8000-000000000001',
 '03040000-0000-4000-8000-000000000301','03040000-0000-4000-8000-000000000101','candidate','{}',id,50,now()-interval '1 second'
from public.categories where slug='chill';

select throws_ok(
 $$update public.quest_instances set status='active',accepted_at=now() where id='03040000-0000-4000-8000-000000000401'$$,
 'P0001','candidate_expired','SQ-0304 rejects activation after the server Candidate TTL');
select is((select status::text from public.quest_instances where id='03040000-0000-4000-8000-000000000401'),
 'candidate','SQ-0304 rejected activation does not create an Active Quest');
select is((select count(*) from public.xp_ledger where user_id='03040000-0000-4000-8000-000000000001'),0::bigint,
 'SQ-0304 expiry rejection awards no XP');
select ok(position('candidate_expires_at' in pg_get_functiondef('public.enforce_candidate_expiry_on_activation()'::regprocedure))>0,
 'SQ-0304 enforces expiry in the database rather than the client');
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,candidate_expires_at)
select '03040000-0000-4000-8000-000000000402','03040000-0000-4000-8000-000000000001',
 '03040000-0000-4000-8000-000000000301','03040000-0000-4000-8000-000000000101','candidate','{}',id,50,now()+interval '1 second'
from public.categories where slug='chill';
select lives_ok(
 $$update public.quest_instances set status='active',accepted_at=now() where id='03040000-0000-4000-8000-000000000402'$$,
 'SQ-0304 permits activation at the unexpired side of the TTL boundary');

select * from finish();
rollback;
