begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(25);

select ok(to_regclass('public.quest_reroll_requests') is not null,'SQ-0303 has the minimal idempotency/rate ledger');
select isnt(has_table_privilege('anon','public.quest_reroll_requests','SELECT'),true,
  'SQ-0303 does not expose the internal request ledger');
select isnt(has_table_privilege('authenticated','public.quest_reroll_requests','SELECT'),true,
  'SQ-0303 prevents authenticated users from reading stored reroll results directly');
select isnt(has_table_privilege('authenticated','public.quest_reroll_requests','INSERT'),true,
  'SQ-0303 prevents clients from forging reroll request ledger rows');
select isnt(has_function_privilege('anon','public.reroll_quest(uuid,uuid,uuid,double precision,double precision,text)','EXECUTE'),true,
  'SQ-0303 denies anonymous rerolls');
select ok(has_function_privilege('authenticated','public.reroll_quest(uuid,uuid,uuid,double precision,double precision,text)','EXECUTE'),
  'SQ-0303 grants the RPC only to authenticated users');
select ok(position('not exists(select 1 from public.quest_instances seen' in replace(
  pg_get_functiondef('public.reroll_quest(uuid,uuid,uuid,double precision,double precision,text)'::regprocedure),E'\n',' '))>0,
  'SQ-0303 excludes every template represented by the search instances');
select ok(position('pg_advisory_xact_lock' in
  pg_get_functiondef('public.reroll_quest(uuid,uuid,uuid,double precision,double precision,text)'::regprocedure))>0,
  'SQ-0303 serializes concurrent rerolls');
select ok(position('public.quest_reroll_requests' in
  pg_get_functiondef('public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text)'::regprocedure))>0,
  'SQ-0303 extends initial matching to enforce the combined rolling request limit');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('03030000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reroll@example.test','','{}','{"display_name":"Reroll User"}',now(),now()),
 ('03030000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-reroll@example.test','','{}','{"display_name":"Other User"}',now(),now());
update public.quest_templates set moderation_status='disabled' where moderation_status='approved';
insert into public.categories(slug,name_key,is_enabled) values('chill','categories.chill',true)
on conflict(slug) do update set is_enabled=true;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,priority,enabled_at)
select v.id,v.family,1,c.id,v.title,'Description','["Step"]',30,30,0,0,'IDR','easy',50,'none','Low','Stay aware','approved',v.priority,now()-interval '1 day'
from (values
 ('03030000-0000-4000-8000-000000000101'::uuid,'03030000-0000-4000-8000-000000000201'::uuid,'First',2),
 ('03030000-0000-4000-8000-000000000102','03030000-0000-4000-8000-000000000202','Second',1)
) v(id,family,title,priority) join public.categories c on c.slug='chill';

select set_config('request.jwt.claim.sub','03030000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(public.match_quest('03030000-0000-4000-8000-000000000301','30_minutes','free','chill','walking')->'candidate'->>'title',
 'First','SQ-0303 fixture starts with the highest-ranked Candidate');
select is(public.reroll_quest(
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and status='candidate'),
  '03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000401')->'candidate'->>'title',
 'Second','SQ-0303 returns an unseen eligible Candidate');
select is((select status::text from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and template_id='03030000-0000-4000-8000-000000000101'),
 'rerolled','SQ-0303 atomically transitions the prior Candidate');
select is((select status_reason from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and template_id='03030000-0000-4000-8000-000000000101'),
 'rerolled','SQ-0303 records the documented transition reason');
select is((select count(*) from public.quest_instances where user_id='03030000-0000-4000-8000-000000000001' and status='active'),0::bigint,
 'SQ-0303 never creates an Active Quest');
select is((select count(*) from public.xp_ledger where user_id='03030000-0000-4000-8000-000000000001'),0::bigint,
 'SQ-0303 never awards XP');
select is((public.reroll_quest(
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301'
    and template_id='03030000-0000-4000-8000-000000000101'),
  '03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000401')->>'instance_id'),
 (select id::text from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301'
   and template_id='03030000-0000-4000-8000-000000000102'),
 'SQ-0303 replays the exact successful result idempotently');
select is((select count(*) from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301'),2::bigint,
 'SQ-0303 replay does not create another Candidate');
reset role;
select throws_ok(
 $$update public.quest_reroll_requests set result='{"status":"forged"}' where request_id='03030000-0000-4000-8000-000000000401'$$,
 'P0001','quest_reroll_requests records are immutable',
 'SQ-0303 keeps stored idempotent results immutable');
set local role authenticated;
select throws_ok(
 $$select public.reroll_quest(
   (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and status='candidate'),
   '03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000401')$$,
 '22023','Reroll request does not match its original operation',
 'SQ-0303 rejects request UUID reuse for a different Candidate');
select is(public.reroll_quest(
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and status='candidate'),
  '03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000402')->>'status',
 'exhausted','SQ-0303 returns exhausted after all eligible templates are represented');

do $$ begin
  perform public.match_quest('03030000-0000-4000-8000-000000000302','30_minutes','free','chill','walking');
end $$;
reset role;
update public.quest_instances set candidate_expires_at=now()-interval '1 second'
 where search_id='03030000-0000-4000-8000-000000000302';
set local role authenticated;
select is(public.reroll_quest(
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000302'),
  '03030000-0000-4000-8000-000000000302','03030000-0000-4000-8000-000000000403')->>'status',
 'expired','SQ-0303 returns a typed expired outcome');
select is((select status::text from public.quest_instances where search_id='03030000-0000-4000-8000-000000000302'),
 'expired','SQ-0303 authoritatively expires a stale Candidate');

reset role;
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,candidate_expires_at)
select gen_random_uuid(),user_id,search_id,template_id,'candidate',snapshot,category_id,base_xp,now()+interval '30 minutes'
from (select * from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' limit 1) source
cross join generate_series(1,8);
-- The two prior rows plus eight harmless fixture copies reach the documented cap.
set local role authenticated;
select is(public.reroll_quest(
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and status='candidate' order by created_at desc limit 1),
  '03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000404')->>'reason',
 'candidate_limit_reached','SQ-0303 enforces ten Candidates per search');

reset role;
insert into public.quest_reroll_requests(request_id,user_id,search_id,candidate_id,result,created_at)
select gen_random_uuid(),'03030000-0000-4000-8000-000000000001','03030000-0000-4000-8000-000000000301',
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' limit 1),
  '{"status":"fixture"}'::jsonb,now()
from generate_series(1,24);
set local role authenticated;
select is(public.reroll_quest(
  (select id from public.quest_instances where search_id='03030000-0000-4000-8000-000000000301' and status='candidate' limit 1),
  '03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000406')->>'status',
 'rate_limited','SQ-0303 enforces the combined rolling search/reroll hourly limit');

reset role;
select set_config('request.jwt.claim.sub','03030000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok(
 $$select public.reroll_quest('03030000-0000-4000-8000-000000000101','03030000-0000-4000-8000-000000000301','03030000-0000-4000-8000-000000000405')$$,
 '42501','Search is unavailable','SQ-0303 prevents cross-owner rerolls without leaking ownership');

reset role;
select * from finish();
rollback;
