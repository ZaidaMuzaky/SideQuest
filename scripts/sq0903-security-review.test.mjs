import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('SQ-0903 repository security checklist', () => {
  const migrations = readFileSync(new URL('../supabase/migrations/20260829000300_enforce_rls_and_private_storage.sql', import.meta.url), 'utf8');
  const deletion = readFileSync(new URL('../supabase/functions/delete-account/index.ts', import.meta.url), 'utf8');
  assert.match(migrations, /enable row level security/i);
  assert.match(migrations, /storage\.objects/);
  assert.match(deletion, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(readFileSync(new URL('../app/profile.tsx', import.meta.url), 'utf8'), /SERVICE_ROLE|service_role/i);
});
