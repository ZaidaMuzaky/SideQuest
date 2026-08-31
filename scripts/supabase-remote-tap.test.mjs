import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { prepareRemoteTapSql, validateRemoteTapOutput } from './supabase-remote-tap.mjs';

const fixture = `begin;
select plan(2);
select is(1, 1, 'first');
select set_config('request.jwt.claim.sub', 'x', true);
select lives_ok($sql$select ';'::text$sql$, 'second');
select * from finish();
rollback;
`;

const dataModifyingCteFixture = `begin;
select plan(1);
select is(
  (with changed as (
    update public.example set value = 'x' returning 1
  ) select count(*) from changed),
  0::bigint,
  'data-modifying CTE remains top-level'
);
select * from finish();
rollback;
`;

test('SQ-0005 remote TAP preparation emits one marker-delimited final result set', () => {
  const prepared = prepareRemoteTapSql(fixture, 'fixture.test.sql');
  assert.equal(prepared.plan, 2);
  assert.match(prepared.sql, /grant insert on table pg_temp\.sidequest_tap_output to authenticated, anon/);
  assert.match(prepared.sql, /select 1, is\(/);
  assert.match(prepared.sql, /select 2, lives_ok\(/);
  assert.match(prepared.sql, /select set_config/);
  assert.match(prepared.sql, /reset role;[\s\S]+__SIDEQUEST_TAP_BEGIN__[\s\S]+string_agg[\s\S]+__SIDEQUEST_TAP_END__/);
  assert.match(prepared.sql, /rollback;\s*$/);
});

test('SQ-0005 lifts data-modifying CTEs out of assertion arguments', () => {
  const prepared = prepareRemoteTapSql(dataModifyingCteFixture, 'cte.fixture.sql');
  assert.match(prepared.sql, /^with changed as \([\s\S]+insert into pg_temp\.sidequest_tap_output/m);
  assert.doesNotMatch(prepared.sql, /\(with changed as/);
  assert.equal(prepared.capturedAssertions.length, 1);
});

for (const [file, plan] of [
  ['0004_base_schema.test.sql', 16],
  ['0005_rls_storage.test.sql', 46],
  ['0302_match_quest.test.sql', 32],
  ['0303_reroll_quest.test.sql', 25],
  ['0304_candidate_expiry.test.sql', 5],
  ['0305_candidate_countdown.test.sql', 3],
  ['0401_accept_quest.test.sql', 16],
  ['0404_abandon_quest.test.sql', 14],
  ['0405_active_expiry.test.sql', 15],
  ['0502_register_proof.test.sql', 14],
  ['0503_complete_quest.test.sql', 19],
  ['0601_xp_level_contract.test.sql', 10],
  ['0702_history.test.sql', 14],
  ['0703_avatar.test.sql', 13],
]) {
  test(`SQ-0005 remote TAP preparation preserves all assertions in ${file}`, () => {
    const source = readFileSync(resolve(process.cwd(), 'supabase/tests', file), 'utf8');
    const prepared = prepareRemoteTapSql(source, file);
    assert.equal(prepared.plan, plan);
    assert.equal(prepared.capturedAssertions.length, plan);
    assert.deepEqual(prepared.capturedAssertions.map(({ ordinal }) => ordinal),
      Array.from({ length: plan }, (_, index) => index + 1));
    assert.equal((prepared.sql.match(/insert into pg_temp\.sidequest_tap_output \(sequence, line\)/g) ?? []).length, plan + 2);
  });
}

test('SQ-0005 captures every actual SQ-0004 assertion form exactly once', () => {
  const source = readFileSync(resolve(process.cwd(), 'supabase/tests/0004_base_schema.test.sql'), 'utf8');
  const captured = prepareRemoteTapSql(source, '0004_base_schema.test.sql').capturedAssertions;
  const counts = Object.groupBy(captured, ({ name }) => name);
  assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([name, values]) => [name, values.length])), {
    throws_ok: 13,
    hasnt_column: 1,
    lives_ok: 1,
    is: 1,
  });
});

test('SQ-0005 captures every actual SQ-0005 assertion form exactly once', () => {
  const source = readFileSync(resolve(process.cwd(), 'supabase/tests/0005_rls_storage.test.sql'), 'utf8');
  const captured = prepareRemoteTapSql(source, '0005_rls_storage.test.sql').capturedAssertions;
  const counts = Object.groupBy(captured, ({ name }) => name);
  assert.deepEqual(Object.fromEntries(Object.entries(counts).map(([name, values]) => [name, values.length])), {
    is: 19,
    results_eq: 3,
    lives_ok: 4,
    throws_ok: 20,
  });
});

test('SQ-0005 remote TAP preparation rejects plan mismatch and commits', () => {
  assert.throws(() => prepareRemoteTapSql(fixture.replace('plan(2)', 'plan(3)'), 'fixture.sql'), /declares 3.*contains 2/);
  assert.throws(() => prepareRemoteTapSql(fixture.replace('rollback;', 'commit;'), 'fixture.sql'), /must not commit/);
});

test('SQ-0005 remote TAP parser accepts a complete ordered result', () => {
  const output = `| __SIDEQUEST_TAP_BEGIN__
1..2
ok 1 - first
ok 2 - second
__SIDEQUEST_TAP_END__ |`;
  assert.doesNotThrow(() => validateRemoteTapOutput(output, 2, 'fixture.sql'));
});

for (const [name, output] of [
  ['final result only', 'ok 2 - second'],
  ['missing assertion', '__SIDEQUEST_TAP_BEGIN__\n1..2\nok 1 - first\n__SIDEQUEST_TAP_END__'],
  ['duplicate assertion', '__SIDEQUEST_TAP_BEGIN__\n1..2\nok 1 - first\nok 1 - first again\n__SIDEQUEST_TAP_END__'],
  ['out of order', '__SIDEQUEST_TAP_BEGIN__\n1..2\nok 2 - second\nok 1 - first\n__SIDEQUEST_TAP_END__'],
  ['logical failure', '__SIDEQUEST_TAP_BEGIN__\n1..2\nok 1 - first\nnot ok 2 - second\n__SIDEQUEST_TAP_END__'],
  ['bailout', '__SIDEQUEST_TAP_BEGIN__\n1..2\nok 1 - first\nBail out!\n__SIDEQUEST_TAP_END__'],
]) {
  test(`SQ-0005 remote TAP parser rejects ${name}`, () => {
    assert.throws(() => validateRemoteTapOutput(output, 2, 'fixture.sql'));
  });
}
