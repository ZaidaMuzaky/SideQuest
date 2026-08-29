begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

select isnt(has_function_privilege('anon','public.accept_quest(uuid)','EXECUTE'),true,
  'SQ-0401 denies anonymous accept execution');
select ok(has_function_privilege('authenticated','public.accept_quest(uuid)','EXECUTE'),
  'SQ-0401 grants accept only to authenticated callers');
select ok(position('pg_advisory_xact_lock' in pg_get_functiondef('public.accept_quest(uuid)'::regprocedure))>0,
  'SQ-0401 serializes concurrent accept decisions per user');
select ok(position('security definer' in lower(pg_get_functiondef('public.accept_quest(uuid)'::regprocedure)))>0,
  'SQ-0401 uses a controlled authority boundary');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
 ('04010000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','accept@example.test','','{}','{"display_name":"Accept User"}',now(),now()),
 ('04010000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-accept@example.test','','{}','{"display_name":"Other User"}',now(),now());
insert into public.categories(slug,name_key,is_enabled) values('chill','categories.chill',true)
on conflict(slug) do update set is_enabled=true;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,enabled_at)
select '04010000-0000-4000-8000-000000000101','04010000-0000-4000-8000-000000000201',1,c.id,'Accept fixture','Description',
 '["Step"]',30,30,0,0,'IDR','easy',50,'none','Low','Stay aware','approved',now()-interval '1 day'
from public.categories c where c.slug='chill';
insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,expires_at)
values
 ('04010000-0000-4000-8000-000000000301','04010000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval '30 minutes'),
 ('04010000-0000-4000-8000-000000000302','04010000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval '30 minutes'),
 ('04010000-0000-4000-8000-000000000303','04010000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval '30 minutes'),
 ('04010000-0000-4000-8000-000000000304','04010000-0000-4000-8000-000000000002','30_minutes','free','chill','walking',now()+interval '30 minutes');
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,candidate_expires_at)
select v.id,v.user_id,v.search_id,'04010000-0000-4000-8000-000000000101','candidate',
 jsonb_build_object('title',v.title,'base_xp',50),c.id,50,v.expiry
from (values
 ('04010000-0000-4000-8000-000000000401'::uuid,'04010000-0000-4000-8000-000000000001'::uuid,'04010000-0000-4000-8000-000000000301'::uuid,'First candidate',now()+interval '30 minutes'),
 ('04010000-0000-4000-8000-000000000402','04010000-0000-4000-8000-000000000001','04010000-0000-4000-8000-000000000302','Second candidate',now()+interval '30 minutes'),
 ('04010000-0000-4000-8000-000000000403','04010000-0000-4000-8000-000000000001','04010000-0000-4000-8000-000000000303','Expired candidate',now()-interval '1 second'),
 ('04010000-0000-4000-8000-000000000404','04010000-0000-4000-8000-000000000002','04010000-0000-4000-8000-000000000304','Other candidate',now()+interval '30 minutes')
) v(id,user_id,search_id,title,expiry) join public.categories c on c.slug='chill';

select set_config('request.jwt.claim.sub','04010000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is(public.accept_quest('04010000-0000-4000-8000-000000000403')->>'status','expired',
  'SQ-0401 returns a typed expired outcome for a stale Candidate');
select is((select status::text from public.quest_instances where id='04010000-0000-4000-8000-000000000403'),'expired',
  'SQ-0401 authoritatively expires the stale Candidate');
select is(public.accept_quest('04010000-0000-4000-8000-000000000401')->>'outcome','accepted',
  'SQ-0401 accepts an unexpired owned Candidate');
select is((select status::text from public.quest_instances where id='04010000-0000-4000-8000-000000000401'),'active',
  'SQ-0401 persists the Candidate to Active transition');
select ok((select accepted_at is not null from public.quest_instances where id='04010000-0000-4000-8000-000000000401'),
  'SQ-0401 records the authoritative acceptance timestamp');
select is((select snapshot->>'title' from public.quest_instances where id='04010000-0000-4000-8000-000000000401'),'First candidate',
  'SQ-0401 preserves the immutable Quest Instance snapshot');
select is((select count(*) from public.xp_ledger where user_id='04010000-0000-4000-8000-000000000001'),0::bigint,
  'SQ-0401 does not award XP');
select is(public.accept_quest('04010000-0000-4000-8000-000000000401')->>'outcome','already_active',
  'SQ-0401 duplicate acceptance is idempotent');
select is(public.accept_quest('04010000-0000-4000-8000-000000000402')->>'instance_id','04010000-0000-4000-8000-000000000401',
  'SQ-0401 returns the existing Active Quest on conflict');
select is((select status::text from public.quest_instances where id='04010000-0000-4000-8000-000000000402'),'candidate',
  'SQ-0401 leaves the conflicting second Candidate unchanged');
select is((select count(*) from public.quest_instances where user_id='04010000-0000-4000-8000-000000000001' and status='active'),1::bigint,
  'SQ-0401 database state contains only one Active Quest');
reset role;
select set_config('request.jwt.claim.sub','04010000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok(
 $$select public.accept_quest('04010000-0000-4000-8000-000000000402')$$,
 '42501','Candidate is unavailable','SQ-0401 prevents cross-owner acceptance');

reset role;
select * from finish();
rollback;
