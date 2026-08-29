import assert from 'node:assert/strict';
import test from 'node:test';

import { findVerifiedProject, parseProjectList } from './supabase-remote-guard.mjs';

const expectedRef = 'abcdefghijklmnopqrst';
const expectedName = 'SideQuest Development';
const project = { id: 'management-project-id', ref: expectedRef, name: expectedName };

test('SQ-0005 accepts the Management API direct project array response', () => {
  assert.deepEqual(findVerifiedProject([project], expectedRef, expectedName), {
    ref: expectedRef,
    name: expectedName,
  });
});

test('SQ-0005 accepts the CLI JSON object response containing projects', () => {
  assert.deepEqual(findVerifiedProject({ projects: [project] }, expectedRef, expectedName), {
    ref: expectedRef,
    name: expectedName,
  });
});

test('SQ-0005 fails closed for malformed project-list responses', () => {
  for (const malformed of [null, {}, { projects: {} }, { projects: [null] }, { projects: [{ ref: expectedRef }] }]) {
    assert.throws(() => parseProjectList(malformed), /target identity was not verified/);
  }
});

test('SQ-0005 fails closed when the expected project is missing', () => {
  assert.throws(
    () => findVerifiedProject([], expectedRef, expectedName),
    /expected project ref is not accessible/,
  );
});

test('SQ-0005 rejects a project-ref mismatch without falling back to id', () => {
  const mismatched = { id: expectedRef, ref: 'tsrqponmlkjihgfedcba', name: expectedName };
  assert.throws(
    () => findVerifiedProject([mismatched], expectedRef, expectedName),
    /expected project ref is not accessible/,
  );
});

test('SQ-0005 rejects an exact project-name mismatch', () => {
  assert.throws(
    () => findVerifiedProject([project], expectedRef, 'SideQuest Dev Alternate'),
    /does not exactly match/,
  );
});

test('SQ-0005 supports legacy CLI entries that expose the project ref as id only', () => {
  const legacy = { id: expectedRef, name: expectedName };
  assert.deepEqual(findVerifiedProject([legacy], expectedRef, expectedName), {
    ref: expectedRef,
    name: expectedName,
  });
});

test('SQ-0005 rejects duplicate project refs', () => {
  assert.throws(
    () => parseProjectList([project, { ...project, name: 'SideQuest Development Duplicate' }]),
    /duplicate project refs/,
  );
});
