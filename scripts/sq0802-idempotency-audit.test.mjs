import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrations = ['20260829000800_match_quest_rpc.sql','20260829001000_reroll_quest_rpc.sql','20260829001300_accept_quest_rpc.sql','20260829001400_abandon_quest_rpc.sql','20260829001600_register_quest_proof_rpc.sql','20260829001900_complete_quest_rpc.sql'].map((name) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')).join('\n');

test('SQ-0802 critical mutations retain idempotency and rate-limit guards', () => {
  assert.match(migrations, /p_request_id/);
  assert.match(migrations, /p_idempotency_key/);
  assert.match(migrations, /rate_limit/i);
  assert.match(migrations, /unique/i);
});
