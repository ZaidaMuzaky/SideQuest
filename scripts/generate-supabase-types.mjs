import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const command = process.execPath;
const cliEntrypoint = resolve(process.cwd(), 'node_modules/supabase/dist/supabase.js');
const result = spawnSync(command, [cliEntrypoint, 'gen', 'types', 'typescript', '--local', '--schema', 'public'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || 'Supabase type generation failed. Is the local stack running?\n');
  process.exit(result.status ?? 1);
}

const destination = resolve(process.cwd(), 'src/types/database.generated.ts');
writeFileSync(destination, result.stdout, 'utf8');
process.stdout.write(`Generated ${destination}\n`);
