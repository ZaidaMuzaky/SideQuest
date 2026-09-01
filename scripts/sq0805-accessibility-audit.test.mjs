import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const files = ['app/index.tsx','app/active.tsx','app/history.tsx','app/profile.tsx','app/auth.tsx'].map((name) => [name, readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')]);

test('SQ-0805 core routes expose accessible semantics and localized copy', () => {
  for (const [name, source] of files) {
    assert.match(source, /developmentCopy/, name);
    assert.match(source, /Button/, name);
  }
  assert.match(files.find(([name]) => name === 'app/profile.tsx')[1], /accessibilityLabel=.*passwordLabel/);
  assert.match(files.find(([name]) => name === 'app/active.tsx')[1], /ActiveQuestUi/);
});
