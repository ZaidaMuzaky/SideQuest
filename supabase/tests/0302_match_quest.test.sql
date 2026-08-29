begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(32);

select ok(public.is_valid_quest_availability('{"days":[1,2,3,4,5],"start_time":"09:00","end_time":"18:00","valid_from":null,"valid_until":null}'),
  'SQ-0302 validates the canonical availability contract');
select isnt(public.is_valid_quest_availability('{"days":[0],"start_time":"09:00","end_time":"18:00"}'),true,
  'SQ-0302 rejects malformed availability');
select isnt(public.is_valid_quest_availability('{"days":[1,1],"start_time":"09:00","end_time":"18:00"}'),true,
  'SQ-0302 rejects duplicate availability weekdays');
select isnt(public.is_valid_quest_availability('{"days":[1],"start_time":"09:00","end_time":"09:00"}'),true,
  'SQ-0302 rejects an empty availability time window');
select isnt(public.is_valid_quest_availability('{"days":[1],"start_time":"09:00","end_time":"18:00","extra":true}'),true,
  'SQ-0302 rejects unknown availability fields');
select ok(public.quest_availability_allows(null,'2026-08-31 12:00+00','UTC'),
  'SQ-0302 treats NULL availability as generally available');
select ok(public.quest_availability_allows('{"days":[1],"start_time":"09:00","end_time":"18:00"}', '2026-08-31 12:00+00','UTC'),
  'SQ-0302 evaluates ISO weekdays and local time windows');
select isnt(public.quest_availability_allows('{"days":[2],"start_time":"09:00","end_time":"18:00"}', '2026-08-31 12:00+00','UTC'),true,
  'SQ-0302 excludes an unavailable weekday');
select isnt(public.quest_availability_allows('{"days":[1],"start_time":"13:00","end_time":"18:00"}', '2026-08-31 12:00+00','UTC'),true,
  'SQ-0302 excludes outside the local time window');
select ok(public.quest_availability_allows('{"days":[1],"start_time":"09:00","end_time":"18:00","valid_from":"2026-08-31","valid_until":"2026-08-31"}', '2026-08-31 12:00+00','UTC'),
  'SQ-0302 evaluates inclusive calendar date bounds');
select isnt(public.quest_availability_allows('{"days":[1],"start_time":"09:00","end_time":"18:00","valid_until":"2026-08-30"}', '2026-08-31 12:00+00','UTC'),true,
  'SQ-0302 excludes after valid_until');
select isnt(has_function_privilege('anon','public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text)','EXECUTE'),true,
  'SQ-0302 denies anonymous match execution');
select ok(position('hashtextextended(owner_id::text, 0)' in
  pg_get_functiondef('public.match_quest(uuid,text,text,text,text,double precision,double precision,text,text)'::regprocedure)) > 0,
  'SQ-0302 serializes the per-user hourly rate decision');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('03020000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'match@example.test','','{}','{"display_name":"Match User"}',now(),now());
update public.quest_templates set moderation_status='disabled' where moderation_status='approved';
insert into public.categories(slug,name_key,is_enabled)
values('chill','categories.chill',true)
on conflict(slug) do update set name_key=excluded.name_key,is_enabled=true;

insert into public.locations(id,name,area_code,latitude,longitude,timezone,is_enabled)
values('03020000-0000-4000-8000-000000000010','Controlled Place','controlled_area',0,0,'UTC',true);

insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,area_codes,location_id,physical_demand,safety_notes,
 moderation_status,priority,enabled_at)
select v.id,v.family,1,c.id,v.title,'Description','["Step"]',v.duration,v.duration,v.cost,v.cost,'IDR','easy',50,v.mode,v.areas,v.location,
 'Low','Stay aware',v.status,v.priority,now()-interval '1 day'
from (values
 ('03020000-0000-4000-8000-000000000101'::uuid,'03020000-0000-4000-8000-000000000201'::uuid,'Free exact',30,0,'none'::public.location_mode,null::text[],null::uuid,'approved',1),
 ('03020000-0000-4000-8000-000000000102','03020000-0000-4000-8000-000000000202','Fifty boundary',30,50000,'none',null,null,'disabled',1),
 ('03020000-0000-4000-8000-000000000103','03020000-0000-4000-8000-000000000203','Hundred boundary',30,100000,'none',null,null,'disabled',1),
 ('03020000-0000-4000-8000-000000000104','03020000-0000-4000-8000-000000000204','Flexible boundary',30,250000,'none',null,null,'disabled',1),
 ('03020000-0000-4000-8000-000000000105','03020000-0000-4000-8000-000000000205','Over ceiling',30,250001,'none',null,null,'disabled',100),
 ('03020000-0000-4000-8000-000000000106','03020000-0000-4000-8000-000000000206','Controlled area',30,0,'area',array['controlled_area'],null,'disabled',1),
 ('03020000-0000-4000-8000-000000000107','03020000-0000-4000-8000-000000000207','Safety disabled',1,0,'none',null,null,'disabled',100),
 ('03020000-0000-4000-8000-000000000109','03020000-0000-4000-8000-000000000209','Template controlled area',30,0,'area',array['template_only_area'],null,'disabled',1)
) v(id,family,title,duration,cost,mode,areas,location,status,priority)
join public.categories c on c.slug='chill';

select set_config('request.jwt.claim.sub','03020000-0000-4000-8000-000000000001',true);
set local role authenticated;

select is((public.match_quest('03020000-0000-4000-8000-000000000301','30_minutes','free','chill','walking')->'candidate'->>'title'),
 'Free exact','SQ-0302 Free accepts only zero-cost candidates');
select is((select count(*) from public.quest_instances where search_id='03020000-0000-4000-8000-000000000301'),1::bigint,
 'SQ-0302 persists exactly one Candidate snapshot');
select is((public.match_quest('03020000-0000-4000-8000-000000000301','30_minutes','free','chill','walking')->>'instance_id'),
 (select id::text from public.quest_instances where search_id='03020000-0000-4000-8000-000000000301'),
 'SQ-0302 search UUID is idempotent');
select throws_ok(
  $$select public.match_quest('03020000-0000-4000-8000-000000000301','1_hour','free','chill','walking')$$,
  '22023','Search request does not match its original filters',
  'SQ-0302 rejects changed filters when a search UUID is retried');
select is((select candidate_expires_at-created_at from public.quest_instances where search_id='03020000-0000-4000-8000-000000000301'),
 interval '30 minutes','SQ-0302 Candidate TTL is exactly 30 minutes');
select is((select snapshot->'match'->>'score' from public.quest_instances where search_id='03020000-0000-4000-8000-000000000301'),
 '50','SQ-0302 composes the exact normalized 50/30/20 score');
select ok((select snapshot->'match'->>'time_score' from public.quest_instances where search_id='03020000-0000-4000-8000-000000000301')::numeric between 0 and 1
 and (select snapshot->'match'->>'budget_score' from public.quest_instances where search_id='03020000-0000-4000-8000-000000000301')::numeric between 0 and 1,
 'SQ-0302 score components remain normalized');

reset role;
update public.quest_instances set status='completed',completed_at=now()
  where search_id='03020000-0000-4000-8000-000000000301';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000301','30_minutes','free','chill','walking')->>'status',
 'candidate','SQ-0302 replay reconstructs the original typed Candidate result after lifecycle changes');
reset role;
insert into public.quest_templates(id,template_family_id,version,category_id,title,description,instructions,duration_min,duration_max,
 estimated_cost_min,estimated_cost_max,currency_code,difficulty,base_xp,location_mode,physical_demand,safety_notes,moderation_status,priority,enabled_at)
select '03020000-0000-4000-8000-000000000108','03020000-0000-4000-8000-000000000208',1,c.id,'Novel alternative','Description',
 '["Step"]'::jsonb,30,30,0,0,'IDR','easy',50,'none','Low','Stay aware','approved',0,now()-interval '1 day'
from public.categories c where c.slug='chill';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000308','30_minutes','free','chill','walking')->'candidate'->>'title',
 'Novel alternative','SQ-0302 prefers a non-recent eligible template');
reset role;
update public.quest_templates set moderation_status='disabled' where id='03020000-0000-4000-8000-000000000108';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000309','30_minutes','free','chill','walking')->'candidate'->>'title',
 'Free exact','SQ-0302 falls back to recent completion when no alternative exists');

reset role;
update public.quest_templates set moderation_status='disabled' where id='03020000-0000-4000-8000-000000000101';
update public.quest_templates set moderation_status='approved' where id='03020000-0000-4000-8000-000000000102';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000302','1_hour','under_50000','chill','walking')->'candidate'->>'title',
 'Fifty boundary','SQ-0302 accepts the 50k boundary');
reset role;
update public.quest_templates set moderation_status='disabled' where id='03020000-0000-4000-8000-000000000102';
update public.quest_templates set moderation_status='approved' where id='03020000-0000-4000-8000-000000000103';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000303','1_hour','under_100000','chill','walking')->'candidate'->>'title',
 'Hundred boundary','SQ-0302 accepts the 100k boundary');
reset role;
update public.quest_templates set moderation_status='disabled' where id='03020000-0000-4000-8000-000000000103';
update public.quest_templates set moderation_status='approved' where id in ('03020000-0000-4000-8000-000000000104','03020000-0000-4000-8000-000000000105');
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000304','1_hour','flexible','chill','walking')->'candidate'->>'title',
 'Flexible boundary','SQ-0302 accepts 250k and hard-excludes above 250k before ranking');
reset role;
update public.quest_templates set moderation_status='disabled' where id in ('03020000-0000-4000-8000-000000000104','03020000-0000-4000-8000-000000000105');
update public.quest_templates set moderation_status='approved' where id='03020000-0000-4000-8000-000000000106';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000305','1_hour','free','chill','walking',null,null,'controlled_area')->'candidate'->>'title',
 'Controlled area','SQ-0302 matches a controlled known area without coordinates');
select is(public.match_quest('03020000-0000-4000-8000-000000000306','1_hour','free','chill','walking',null,null,'arbitrary_area')->>'status',
 'no_match','SQ-0302 rejects arbitrary uncontrolled areas and preserves location-denied behavior');
select is(public.match_quest('03020000-0000-4000-8000-000000000307','1_hour','free','random','walking',null,null,null)->>'status',
 'no_match','SQ-0302 Random remains a selector and does not bypass location or safety eligibility');
select is((select count(*) from public.quest_searches where id='03020000-0000-4000-8000-000000000305' and area_code='controlled_area'),1::bigint,
 'SQ-0302 persists only a controlled area and no raw search coordinates');
reset role;
update public.quest_templates set moderation_status='disabled' where id='03020000-0000-4000-8000-000000000106';
update public.quest_templates set moderation_status='approved' where id='03020000-0000-4000-8000-000000000109';
set local role authenticated;
select is(public.match_quest('03020000-0000-4000-8000-000000000310','1_hour','free','chill','walking',null,null,'template_only_area')->'candidate'->>'title',
 'Template controlled area','SQ-0302 accepts a controlled area defined only by approved Template catalog data');

reset role;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('03020000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'other-match@example.test','','{}','{"display_name":"Other Match User"}',now(),now());
select set_config('request.jwt.claim.sub','03020000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok(
  $$select public.match_quest('03020000-0000-4000-8000-000000000305','1_hour','free','chill','walking',null,null,'controlled_area')$$,
  '42501','Search is unavailable','SQ-0302 prevents cross-owner search reuse without exposing ownership details');

reset role;
select * from finish();
rollback;
