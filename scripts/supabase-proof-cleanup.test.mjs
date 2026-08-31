import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./supabase-proof-cleanup.mjs', import.meta.url), 'utf8');
test('SQ-0505 requires explicit dedicated-environment approval', () => {
  assert.match(source, /SIDEQUEST_SUPABASE_ALLOW_PROOF_CLEANUP/);
  assert.match(source, /YES_DEDICATED_SIDEQUEST_DEVELOPMENT/);
  assert.match(source, /khhfrhiapfzuddhmlkmt/);
});
test('SQ-0505 deletes storage before metadata and scopes metadata to owner/status', () => {
  assert.ok(source.indexOf("storage.from('quest-proofs').remove") < source.indexOf("from('quest_proofs').delete"));
  assert.match(source, /\.eq\('user_id', proof\.user_id\)/);
  assert.match(source, /\.eq\('status', 'pending_delete'\)/);
  assert.match(source, /owner_path_mismatch/);
  assert.match(source, /storage_delete_failed/);
});
