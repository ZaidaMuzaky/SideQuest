import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8').toLowerCase();
const categories = [...sql.matchAll(/\('([a-z]+)', 'categories\.[a-z]+', true\)/g)].map((m) => m[1]);
const expected = ['chill', 'food', 'explore', 'active', 'creative'];
if (JSON.stringify(categories) !== JSON.stringify(expected)) throw new Error('SQ-0006 categories must be exactly the five authoritative slugs');
if (sql.includes("'random'")) throw new Error('SQ-0006 must never seed random as a category');
if ((sql.match(/on conflict \(id\) do nothing/g) ?? []).length < 2) throw new Error('SQ-0006 seed inserts must be rerunnable');
for (const mode of ['none', 'area', 'place']) if (!sql.includes(`'${mode}'`)) throw new Error(`SQ-0006 missing location mode: ${mode}`);
if (sql.includes('jakarta') || sql.includes('surabaya') || sql.includes('jakarta')) throw new Error('SQ-0006 seed must remain geography-agnostic');
process.stdout.write('Validated SQ-0006 deterministic categories, templates, location modes, and geography-neutral seed.\n');
