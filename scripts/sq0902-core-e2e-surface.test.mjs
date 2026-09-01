import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

test('SQ-0902 core route surface exists', () => {
  for (const route of ['app/auth.tsx','app/onboarding.tsx','app/index.tsx','app/active.tsx','app/history.tsx','app/profile.tsx']) {
    assert.equal(existsSync(new URL(`../${route}`, import.meta.url)), true, route);
  }
});
