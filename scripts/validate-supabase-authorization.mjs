import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationDirectory = resolve(process.cwd(), 'supabase/migrations');
const sql = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(resolve(migrationDirectory, name), 'utf8'))
  .join('\n')
  .toLowerCase();

const tables = [
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
  'avatar_cleanup_queue',
];

for (const table of tables) {
  if (!sql.includes(`alter table public.${table} enable row level security`)) {
    throw new Error(`SQ-0005 does not enable RLS on public.${table}`);
  }
}

const requiredFragments = [
  'with (security_invoker = true, security_barrier = true)',
  'create view public.approved_quest_catalog',
  "('quest-proofs', 'quest-proofs', false)",
  "('avatars', 'avatars', false)",
  'create policy quest_proofs_owner_active_insert',
  'create policy quest_proofs_owner_select',
  'create policy avatars_owner_insert',
  'create policy avatars_owner_select',
  'create policy avatars_owner_delete',
  'revoke execute on function public.validate_quest_proof_owner()',
  'from public, anon, authenticated',
  "avatar_path ~ ('^' || (select auth.uid())::text",
  '(jpg|jpeg|png|webp|heic|heif)$',
  'grant select (id, slug, name_key, is_enabled)',
  'moderation_status,',
  'enabled_at,',
  'disabled_at',
  'revoke all on table storage.objects, storage.buckets from public, anon, authenticated',
  'grant select, insert on table storage.objects to authenticated',
  'revoke update, delete, select on table storage.objects from public, anon',
  'revoke update, delete on table storage.objects from authenticated',
  'grant delete on table storage.objects to authenticated',
  'create or replace function public.handle_new_user()',
  "values (new.id, 'flexible', 'flexible', 'random', 'flexible')",
  'create trigger on_auth_user_created',
];

for (const fragment of requiredFragments) {
  if (!sql.includes(fragment)) {
    throw new Error(`Missing SQ-0005 authorization contract: ${fragment}`);
  }
}

const terminalImagePathPatterns = sql.split('(jpg|jpeg|png|webp|heic|heif)$').length - 1;
if (terminalImagePathPatterns < 3) {
  throw new Error('SQ-0005 image path regexes must terminate after the safe extension');
}

const forbiddenFragments = [
  'create policy quest_proofs_owner_delete',
  'create policy quest_proofs_owner_update',
  'create policy avatars_owner_update',
];

for (const fragment of forbiddenFragments) {
  if (sql.includes(fragment)) {
    throw new Error(`Unsafe or out-of-scope SQ-0005 SQL detected: ${fragment}`);
  }
}

process.stdout.write(
  `Validated SQ-0005 RLS for ${tables.length} tables, private buckets, and storage policy boundaries.\n`,
);
