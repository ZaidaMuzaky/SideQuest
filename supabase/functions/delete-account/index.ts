import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (!body || typeof body.password !== 'string' || body.password.length < 1) return json({ error: 'reauthentication_required' }, 400);
  const url = Deno.env.get('SUPABASE_URL')!; const anon = Deno.env.get('SUPABASE_ANON_KEY')!; const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, service); const verified = await admin.auth.getUser(token);
  if (verified.error || !verified.data.user?.id || !verified.data.user.email) return json({ error: 'unauthorized' }, 401);
  const reauth = createClient(url, anon); const signedIn = await reauth.auth.signInWithPassword({ email: verified.data.user.email, password: body.password });
  if (signedIn.error || signedIn.data.user?.id !== verified.data.user.id) return json({ error: 'reauthentication_failed' }, 401);
  const userId = verified.data.user.id;
  for (const bucket of ['avatars', 'quest-proofs']) {
    const entries: { name: string }[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await admin.storage.from(bucket).list(userId, { limit: 100, offset });
      if (page.error) return json({ error: 'cleanup_failed' }, 500);
      entries.push(...(page.data ?? []));
      if ((page.data ?? []).length < 100) break;
    }
    const paths: string[] = [];
    for (const entry of entries) {
      if (bucket === 'avatars') paths.push(userId + '/' + entry.name);
      else for (let offset = 0; ; offset += 100) {
        const nested = await admin.storage.from(bucket).list(userId + '/' + entry.name, { limit: 100, offset });
        if (nested.error) return json({ error: 'cleanup_failed' }, 500);
        paths.push(...(nested.data ?? []).map((proof) => userId + '/' + entry.name + '/' + proof.name));
        if ((nested.data ?? []).length < 100) break;
      }
    }
    if (paths.length && (await admin.storage.from(bucket).remove(paths)).error) return json({ error: 'cleanup_failed' }, 500);
  }
  const revoked = await admin.auth.admin.signOut(userId, 'global');
  if (revoked.error) return json({ error: 'deletion_failed' }, 500);
  const deleted = await admin.auth.admin.deleteUser(userId); if (deleted.error) return json({ error: 'deletion_failed' }, 500); return json({ status: 'deleted' });
});
