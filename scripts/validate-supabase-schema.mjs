import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationsDirectory = resolve(process.cwd(), 'supabase/migrations');
const expectedMigrationFiles = [
  '20260828000100_create_identity_and_catalog.sql',
  '20260828000200_create_quest_and_progress_records.sql',
];
const availableMigrationFiles = new Set(readdirSync(migrationsDirectory));

for (const file of expectedMigrationFiles) {
  if (!availableMigrationFiles.has(file)) {
    throw new Error(`Missing SQ-0004 migration: ${file}`);
  }
}

const sql = expectedMigrationFiles
  .map((file) => readFileSync(resolve(migrationsDirectory, file), 'utf8'))
  .join('\n')
  .toLowerCase();

const requiredTables = [
  'profiles',
  'user_preferences',
  'categories',
  'locations',
  'quest_templates',
  'quest_searches',
  'quest_instances',
  'quest_proofs',
  'quest_completions',
  'user_progress',
  'xp_ledger',
];

for (const table of requiredTables) {
  if (!sql.includes(`create table public.${table}`)) {
    throw new Error(`Missing required SQ-0004 table: ${table}`);
  }
}

const requiredFragments = [
  "create type public.quest_status",
  "create type public.difficulty",
  "create type public.location_mode",
  "unique (template_family_id, version)",
  "create unique index one_active_quest_per_user",
  "where status = 'active'",
  "unique (user_id, idempotency_key)",
  "check (slug in ('chill', 'food', 'explore', 'active', 'creative'))",
  "references auth.users (id) on delete cascade",
];

for (const fragment of requiredFragments) {
  if (!sql.includes(fragment)) {
    throw new Error(`Missing required SQ-0004 schema contract: ${fragment}`);
  }
}

const forbiddenFragments = [
  'create policy',
  'enable row level security',
  'create table public.quest_categories',
  'create type public.quest_category',
  'create table public.reroll_exclusions',
  'create table public.user_locations',
  'create bucket',
  'insert into public.categories',
  'insert into public.quest_templates',
  'create extension postgis',
];

for (const fragment of forbiddenFragments) {
  if (sql.includes(fragment)) {
    throw new Error(`Out-of-scope SQ-0004 SQL detected: ${fragment}`);
  }
}

process.stdout.write(`Validated ${expectedMigrationFiles.length} SQ-0004 migration files and ${requiredTables.length} tables.\n`);
