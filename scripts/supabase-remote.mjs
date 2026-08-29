import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { runCli, verifyMigrationHistory, verifyRemoteTarget } from './supabase-remote-guard.mjs';
import { prepareRemoteTapSql, validateRemoteTapOutput } from './supabase-remote-tap.mjs';

const action = process.argv[2];

try {
  if (action === 'link') {
    const { projectRef } = verifyRemoteTarget({ requireLinked: false });
    runCli(['link', '--project-ref', projectRef]);
    verifyRemoteTarget();
  } else if (action === 'check') {
    verifyRemoteTarget();
    verifyMigrationHistory();
    runCli(['db', 'push', '--linked', '--dry-run', '--skip-vault']);
    runCli(['db', 'lint', '--linked', '--schema', 'public', '--level', 'error', '--fail-on', 'error']);
  } else if (action === 'push') {
    verifyRemoteTarget({ requirePushApproval: true });
    verifyMigrationHistory();
    runCli(['db', 'push', '--linked', '--dry-run', '--skip-vault']);
    runCli(['db', 'push', '--linked', '--skip-vault', '--yes']);
    verifyMigrationHistory({ requireExact: true });
    runCli(['db', 'lint', '--linked', '--schema', 'public', '--level', 'error', '--fail-on', 'error']);
  } else if (action === 'test') {
    verifyRemoteTarget();
    verifyMigrationHistory({ requireExact: true });
    const testsDirectory = resolve(process.cwd(), 'supabase/tests');
    const testFiles = readdirSync(testsDirectory)
      .filter((name) => /\.test\.sql$/.test(name))
      .sort();
    if (testFiles.length === 0) throw new Error('No remote pgTAP test files were found.');
    for (const requiredTest of ['0004_base_schema.test.sql', '0005_rls_storage.test.sql']) {
      if (!testFiles.includes(requiredTest)) throw new Error(`Required remote pgTAP suite is missing: ${requiredTest}`);
    }

    for (const testFile of testFiles) {
      const testPath = resolve(testsDirectory, testFile);
      const sql = readFileSync(testPath, 'utf8');
      const prepared = prepareRemoteTapSql(sql, testFile);
      const temporaryDirectory = mkdtempSync(resolve(tmpdir(), 'sidequest-remote-tap-'));
      const remoteTestPath = resolve(temporaryDirectory, testFile);
      let output;
      try {
        writeFileSync(remoteTestPath, prepared.sql, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
        output = runCli(['db', 'query', '--linked', '--file', remoteTestPath], { capture: true });
      } finally {
        rmSync(temporaryDirectory, { recursive: true, force: true });
      }
      try {
        validateRemoteTapOutput(output, prepared.plan, testFile);
      } catch (error) {
        process.stderr.write(output);
        throw error;
      }
      process.stdout.write(`Remote pgTAP passed: ${testFile} (${prepared.plan} assertions).\n`);
    }
  } else if (action === 'types') {
    verifyRemoteTarget();
    verifyMigrationHistory({ requireExact: true });
    const generated = runCli(['gen', 'types', 'typescript', '--linked', '--schema', 'public'], { capture: true });
    if (!generated.includes('export type Database')) {
      throw new Error('Remote type generation did not return the expected TypeScript Database contract.');
    }
    const destination = resolve(process.cwd(), 'src/types/database.generated.ts');
    const temporary = `${destination}.${process.pid}.tmp`;
    try {
      writeFileSync(temporary, generated, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, destination);
    } finally {
      rmSync(temporary, { force: true });
    }
    process.stdout.write(`Generated ${destination} from the verified development project.\n`);
  } else {
    throw new Error('Expected one action: link, check, push, test, or types.');
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
