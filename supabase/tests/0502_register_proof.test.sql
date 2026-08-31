begin;create extension if not exists pgtap with schema extensions;set local search_path=public,extensions;select plan(14);
select isnt(has_function_privilege('anon','public.register_quest_proof(uuid,uuid,text,text,integer,text)','EXECUTE'),true,'SQ-0502 denies anonymous registration');
select ok(has_function_privilege('authenticated','public.register_quest_proof(uuid,uuid,text,text,integer,text)','EXECUTE'),'SQ-0502 grants authenticated RPC');
select ok((select lower(indexdef) like '%where (status = ''uploaded''%' from pg_indexes where indexname='one_uploaded_proof_per_instance'),'SQ-0502 permits cleanup metadata while enforcing one uploaded proof');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)values
('05020000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','proof@example.test','','{}','{"display_name":"Proof User"}',now(),now()),
('05020000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-proof@example.test','','{}','{"display_name":"Other"}',now(),now());
insert into public.categories(slug,name_key,is_enabled)values('chill','categories.chill',true)on conflict(slug)do update set is_enabled=true;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,enabled_at)
select '05020000-0000-4000-8000-000000000101','05020000-0000-4000-8000-000000000201',1,id,'Fixture','Description','["Step"]',30,30,0,0,'IDR','easy',50,'none','Low','Safe','approved',now()-interval'1 day'from public.categories where slug='chill';
insert into public.quest_searches(id,user_id,time_filter,budget_filter,mood_filter,distance_filter,expires_at)values('05020000-0000-4000-8000-000000000301','05020000-0000-4000-8000-000000000001','30_minutes','free','chill','walking',now()+interval'30 min'),('05020000-0000-4000-8000-000000000302','05020000-0000-4000-8000-000000000002','30_minutes','free','chill','walking',now()+interval'30 min');
insert into public.quest_instances(id,user_id,search_id,template_id,status,snapshot,category_id,base_xp,accepted_at)
select v.id,v.uid,v.sid,'05020000-0000-4000-8000-000000000101','active','{"title":"Fixture"}',c.id,50,now()from(values
('05020000-0000-4000-8000-000000000401'::uuid,'05020000-0000-4000-8000-000000000001'::uuid,'05020000-0000-4000-8000-000000000301'::uuid),
('05020000-0000-4000-8000-000000000402','05020000-0000-4000-8000-000000000002','05020000-0000-4000-8000-000000000302'))v(id,uid,sid)cross join public.categories c where c.slug='chill';
insert into storage.objects(bucket_id,name,metadata)values
('quest-proofs','05020000-0000-4000-8000-000000000001/05020000-0000-4000-8000-000000000401/05020000-0000-4000-8000-000000000501.jpg','{"mimetype":"image/jpeg","size":100}'),
('quest-proofs','05020000-0000-4000-8000-000000000001/05020000-0000-4000-8000-000000000401/05020000-0000-4000-8000-000000000502.jpg','{"mimetype":"image/jpeg","size":120}');
select set_config('request.jwt.claim.sub','05020000-0000-4000-8000-000000000001',true);set local role authenticated;
select is(public.register_quest_proof('05020000-0000-4000-8000-000000000501','05020000-0000-4000-8000-000000000401','05020000-0000-4000-8000-000000000001/05020000-0000-4000-8000-000000000401/05020000-0000-4000-8000-000000000501.jpg','image/jpeg',100,null)->>'outcome','registered','SQ-0502 registers matching private object');
select is((select status from public.quest_proofs where id='05020000-0000-4000-8000-000000000501'),'uploaded','SQ-0502 persists current proof');
select is(public.register_quest_proof('05020000-0000-4000-8000-000000000501','05020000-0000-4000-8000-000000000401','05020000-0000-4000-8000-000000000001/05020000-0000-4000-8000-000000000401/05020000-0000-4000-8000-000000000501.jpg','image/jpeg',100,null)->>'outcome','already_registered','SQ-0502 retry is idempotent');
select throws_ok($$select public.register_quest_proof('05020000-0000-4000-8000-000000000503','05020000-0000-4000-8000-000000000401','wrong/path.jpg','image/jpeg',100,null)$$,'22023','Invalid proof storage path','SQ-0502 rejects arbitrary path');
select throws_ok($$select public.register_quest_proof('05020000-0000-4000-8000-000000000503','05020000-0000-4000-8000-000000000401','05020000-0000-4000-8000-000000000001/05020000-0000-4000-8000-000000000401/05020000-0000-4000-8000-000000000503.jpg','image/jpeg',100,null)$$,'22023','Uploaded proof object does not match','SQ-0502 requires uploaded object');
select is(public.register_quest_proof('05020000-0000-4000-8000-000000000502','05020000-0000-4000-8000-000000000401','05020000-0000-4000-8000-000000000001/05020000-0000-4000-8000-000000000401/05020000-0000-4000-8000-000000000502.jpg','image/jpeg',120,'replacement')->>'outcome','registered','SQ-0502 registers replacement');
select is((select status from public.quest_proofs where id='05020000-0000-4000-8000-000000000501'),'pending_delete','SQ-0502 queues replaced metadata for cleanup');
select is((select count(*)from public.quest_proofs where quest_instance_id='05020000-0000-4000-8000-000000000401'and status='uploaded'),1::bigint,'SQ-0502 keeps exactly one current uploaded proof');
select is((select count(*)from public.quest_proofs where quest_instance_id='05020000-0000-4000-8000-000000000401'),2::bigint,'SQ-0502 retains cleanup metadata');
reset role;select set_config('request.jwt.claim.sub','05020000-0000-4000-8000-000000000002',true);set local role authenticated;
select throws_ok($$select public.register_quest_proof('05020000-0000-4000-8000-000000000504','05020000-0000-4000-8000-000000000401','x','image/jpeg',100,null)$$,'22023','Invalid proof storage path','SQ-0502 does not accept cross-owner path');
select is((select count(*)from public.xp_ledger),0::bigint,'SQ-0502 never awards XP');
reset role;select * from finish();rollback;
