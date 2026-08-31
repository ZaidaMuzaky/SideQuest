import { createClient } from '@supabase/supabase-js';

const projectRef = process.env.SIDEQUEST_SUPABASE_PROJECT_REF;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const environment = process.env.SIDEQUEST_SUPABASE_ENVIRONMENT;
const approval = process.env.SIDEQUEST_SUPABASE_ALLOW_PROOF_CLEANUP;

if (environment !== 'development' || !projectRef || !serviceKey || approval !== 'YES_DEDICATED_SIDEQUEST_DEVELOPMENT') {
  throw new Error('Proof cleanup requires the dedicated development environment and explicit approval.');
}
if (!/^khhfrhiapfzuddhmlkmt$/.test(projectRef)) throw new Error('Unexpected Supabase project.');

const client = createClient(`https://${projectRef}.supabase.co`, serviceKey, { auth: { persistSession: false } });
const { data: proofs, error: queryError } = await client.from('quest_proofs')
  .select('id,user_id,storage_path').eq('status', 'pending_delete').order('created_at').limit(100);
if (queryError) throw queryError;

let removed = 0;
let failed = 0;
for (const proof of proofs ?? []) {
  const ownerPrefix = `${proof.user_id}/`;
  if (!proof.storage_path.startsWith(ownerPrefix)) {
    failed += 1;
    console.error(JSON.stringify({ event: 'proof_cleanup_failed', proof_id: proof.id, reason: 'owner_path_mismatch' }));
    continue;
  }
  const { error: storageError } = await client.storage.from('quest-proofs').remove([proof.storage_path]);
  if (storageError) {
    failed += 1;
    console.error(JSON.stringify({ event: 'proof_cleanup_failed', proof_id: proof.id, reason: 'storage_delete_failed', message: storageError.message }));
    continue;
  }
  const { error: metadataError } = await client.from('quest_proofs').delete().eq('id', proof.id).eq('user_id', proof.user_id).eq('status', 'pending_delete');
  if (metadataError) {
    failed += 1;
    console.error(JSON.stringify({ event: 'proof_cleanup_failed', proof_id: proof.id, reason: 'metadata_delete_failed', message: metadataError.message }));
    continue;
  }
  removed += 1;
  console.log(JSON.stringify({ event: 'proof_cleanup_removed', proof_id: proof.id }));
}
console.log(JSON.stringify({ event: 'proof_cleanup_complete', scanned: proofs?.length ?? 0, removed, failed }));
if (failed) process.exitCode = 1;
