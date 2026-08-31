begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('07020000-0000-4000-8000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','history-owner@example.test','','{}','{"display_name":"History Owner"}',now(),now()),
('07020000-0000-4000-8000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','history-other@example.test','','{}','{"display_name":"History Other"}',now(),now());
insert into public.categories(id,slug,name_key,is_enabled) values (71,'chill','category.chill',true);
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,enabled_at)
values ('07020000-0000-4000-8000-000000000101','07020000-0000-4000-8000-000000000102',1,71,'History fixture','Fixture description','["Fixture step"]',30,60,0,0,'IDR','easy',100,'none','Low','Stay aware','approved',now()-interval '1 minute');
insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,expires_at)
values('07020000-0000-4000-8000-000000000301','07020000-0000-4000-8000-000000000011','30_minutes','free','chill','walking',now()+interval '30 min');
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,accepted_at,completed_at,abandoned_at,status_reason)
select v.id,'07020000-0000-4000-8000-000000000011','07020000-0000-4000-8000-000000000301',t.id,v.status::public.quest_status,v.snapshot::jsonb,t.category_id,100,now()-interval '2 days',
  case when v.status='completed' then v.occurred_at else null end,
  case when v.status='abandoned' then v.occurred_at else null end,
  case when v.status='abandoned' then 'user_abandoned' else null end
from public.quest_templates t cross join (values
  ('07020000-0000-4000-8000-000000000401'::uuid,'completed',now(),'{"title":"Finished later"}'),
  ('07020000-0000-4000-8000-000000000403'::uuid,'completed',now(),'{"title":"Finished tied"}'),
  ('07020000-0000-4000-8000-000000000402'::uuid,'abandoned',now()-interval '1 hour','{"title":"Stopped earlier"}')
) v(id,status,occurred_at,snapshot)
where t.id='07020000-0000-4000-8000-000000000101';
select set_config('request.jwt.claim.sub','07020000-0000-4000-8000-000000000012',true);
set local role authenticated;
select is((select count(*) from public.list_quest_history()),0::bigint,'SQ-0702 history is owner-private');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','07020000-0000-4000-8000-000000000011',true);
select is((select count(*) from public.list_quest_history()),3::bigint,'SQ-0702 owner sees terminal history');
select is((select status from public.list_quest_history() limit 1),'completed','SQ-0702 returns newest terminal status first');
select is((select snapshot->>'title' from public.list_quest_history() limit 1),'Finished tied','SQ-0702 returns immutable snapshot');
select is((select count(*) from public.list_quest_history('completed')),2::bigint,'SQ-0702 filters completed history');
select is((select count(*) from public.list_quest_history('abandoned')),1::bigint,'SQ-0702 filters abandoned history');
select is((select id from public.list_quest_history(null, now(), '07020000-0000-4000-8000-000000000403', 1)),'07020000-0000-4000-8000-000000000401'::uuid,'SQ-0702 cursor uses id to break equal timestamps');
select is((select count(*) from public.list_quest_history(null, now(), '07020000-0000-4000-8000-000000000401', 1)),1::bigint,'SQ-0702 applies stable cursor and limit');
select throws_ok($$select * from public.list_quest_history('active')$$,'22023','Invalid history status','SQ-0702 rejects invalid status');
select throws_ok($$select * from public.list_quest_history(null, now(), null, 20)$$,'22023','History cursor timestamp and id must be provided together','SQ-0702 rejects half cursor');
select throws_ok($$select * from public.list_quest_history(null, null, null, null)$$,'22023','History limit must be between 1 and 51','SQ-0702 rejects null limit');
select throws_ok($$select * from public.list_quest_history(null, null, null, 52)$$,'22023','History limit must be between 1 and 51','SQ-0702 rejects oversized limit');
select ok(not has_function_privilege('anon','public.list_quest_history(text,timestamptz,uuid,integer)','execute'),'SQ-0702 denies anonymous RPC execution');
select ok(has_function_privilege('authenticated','public.list_quest_history(text,timestamptz,uuid,integer)','execute'),'SQ-0702 grants authenticated RPC execution');
select * from finish();
rollback;
