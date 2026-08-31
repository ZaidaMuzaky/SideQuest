import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database,Json } from '@/types/database.generated';
import type { ProofAsset } from './proof-picker';
export type ProofUploadPhase='reading'|'uploading'|'registering';
export type UploadProofInput={userId:string;questInstanceId:string;proofId:string;asset:ProofAsset;note?:string;onProgress?:(phase:ProofUploadPhase)=>void};
export type UploadProofResult={status:'uploaded';outcome:'registered'|'already_registered';proofId:string;questInstanceId:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function parse(value:Json):UploadProofResult{if(typeof value!=='object'||value===null||Array.isArray(value))throw new Error('Invalid proof registration response');const v=value as Record<string,Json|undefined>;
 if(v.status!=='uploaded'||(v.outcome!=='registered'&&v.outcome!=='already_registered')||typeof v.proof_id!=='string'||typeof v.quest_instance_id!=='string')throw new Error('Invalid proof registration response');
 return {status:'uploaded',outcome:v.outcome,proofId:v.proof_id,questInstanceId:v.quest_instance_id};}
function duplicate(error:unknown){return typeof error==='object'&&error!==null&&'statusCode'in error&&String((error as {statusCode:unknown}).statusCode)==='409';}
export async function uploadAndRegisterProof(client:SupabaseClient<Database>,input:UploadProofInput):Promise<UploadProofResult>{
 if(!uuid.test(input.userId)||!uuid.test(input.questInstanceId)||!uuid.test(input.proofId)||input.asset.mimeType!=='image/jpeg'||(input.note?.length??0)>500)throw new Error('Invalid proof upload input');
 const path=`${input.userId}/${input.questInstanceId}/${input.proofId}.jpg`; input.onProgress?.('reading');
 const bytes=await (await fetch(input.asset.uri)).arrayBuffer(); if(bytes.byteLength!==input.asset.byteSize)throw new Error('Proof file changed before upload');
 input.onProgress?.('uploading'); const uploaded=await client.storage.from('quest-proofs').upload(path,bytes,{contentType:'image/jpeg',upsert:false});
 if(uploaded.error&&!duplicate(uploaded.error))throw uploaded.error;
 input.onProgress?.('registering'); const {data,error}=await client.rpc('register_quest_proof',{p_proof_id:input.proofId,p_quest_instance_id:input.questInstanceId,p_storage_path:path,p_mime_type:'image/jpeg',p_byte_size:input.asset.byteSize,p_note:input.note??null});
 if(error)throw error;return parse(data);
}
