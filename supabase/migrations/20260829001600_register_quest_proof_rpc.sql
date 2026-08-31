-- SQ-0502: private proof registration and recoverable replacement.

alter table public.quest_proofs drop constraint quest_proofs_quest_instance_id_key;
create unique index one_uploaded_proof_per_instance on public.quest_proofs(quest_instance_id) where status='uploaded';

create function public.register_quest_proof(p_proof_id uuid,p_quest_instance_id uuid,p_storage_path text,
  p_mime_type text,p_byte_size integer,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare owner_id uuid:=auth.uid(); instance_row public.quest_instances%rowtype; existing public.quest_proofs%rowtype;
 object_metadata jsonb; now_value timestamptz:=clock_timestamp(); expected_path text;
begin
 if owner_id is null then raise exception using errcode='42501',message='Authentication required'; end if;
 if p_proof_id is null or p_quest_instance_id is null then raise exception using errcode='22023',message='proof_id and quest_instance_id are required'; end if;
 if p_mime_type<>'image/jpeg' or p_byte_size<=0 or p_byte_size>10485760 or p_note is not null and char_length(p_note)>500 then
  raise exception using errcode='22023',message='Invalid proof metadata'; end if;
 expected_path:=owner_id::text||'/'||p_quest_instance_id::text||'/'||p_proof_id::text||'.jpg';
 if p_storage_path is distinct from expected_path then raise exception using errcode='22023',message='Invalid proof storage path'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text||p_quest_instance_id::text,0));
 select * into instance_row from public.quest_instances where id=p_quest_instance_id and user_id=owner_id for update;
 if not found then raise exception using errcode='42501',message='Quest is unavailable'; end if;
 if instance_row.status<>'active' then raise exception using errcode='P0001',message='quest_not_active'; end if;
 select * into existing from public.quest_proofs where id=p_proof_id and user_id=owner_id;
 if found then
  if existing.quest_instance_id<>p_quest_instance_id or existing.storage_path<>p_storage_path or existing.mime_type<>p_mime_type
    or existing.byte_size<>p_byte_size or existing.note is distinct from p_note then raise exception using errcode='22023',message='Proof replay does not match'; end if;
  return jsonb_build_object('status','uploaded','outcome','already_registered','proof_id',existing.id,'quest_instance_id',existing.quest_instance_id);
 end if;
 select metadata into object_metadata from storage.objects where bucket_id='quest-proofs' and name=p_storage_path;
 if not found or coalesce(object_metadata->>'mimetype','')<>p_mime_type
   or coalesce((object_metadata->>'size')::integer,0)<>p_byte_size then
  raise exception using errcode='22023',message='Uploaded proof object does not match'; end if;
 update public.quest_proofs set status='pending_delete',updated_at=now_value
  where quest_instance_id=p_quest_instance_id and user_id=owner_id and status='uploaded';
 insert into public.quest_proofs(id,quest_instance_id,user_id,storage_path,mime_type,byte_size,note,status,created_at,updated_at)
 values(p_proof_id,p_quest_instance_id,owner_id,p_storage_path,p_mime_type,p_byte_size,p_note,'uploaded',now_value,now_value);
 return jsonb_build_object('status','uploaded','outcome','registered','proof_id',p_proof_id,'quest_instance_id',p_quest_instance_id);
end;$$;

revoke execute on function public.register_quest_proof(uuid,uuid,text,text,integer,text) from public,anon;
grant execute on function public.register_quest_proof(uuid,uuid,text,text,integer,text) to authenticated;
