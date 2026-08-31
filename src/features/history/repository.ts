import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.generated';

export type HistoryStatus = 'completed' | 'abandoned';
export type HistoryItem = { categoryId: number; id: string; occurredAt: string; status: HistoryStatus; title: string; xpAwarded: number };
export type HistoryPage = { items: HistoryItem[]; nextCursor: string | null };
export type QuestHistoryDetail = HistoryItem & { proof: { alt: string; mimeType: string; note: string | null; signedUrl: string } | null; snapshot: Json };

type PageRow = { category_id: number; id: string; occurred_at: string; snapshot: Json; status: string; xp_awarded: number };
type DetailRow = { abandoned_at: string | null; category_id: number; completed_at: string | null; created_at: string; id: string; snapshot: Json; status: string; quest_completions: { proof_id: string; xp_awarded: number }[] | null; quest_proofs: { id: string; mime_type: string; note: string | null; status: string; storage_path: string }[] | null };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function title(snapshot: Json) { return snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) && typeof snapshot.title === 'string' ? snapshot.title : ''; }
function encodeCursor(row: PageRow) { return encodeURIComponent(JSON.stringify([row.occurred_at, row.id])); }
function decodeCursor(value: string): [string, string] {
  try { const parsed: unknown = JSON.parse(decodeURIComponent(value)); if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'string' && !Number.isNaN(Date.parse(parsed[0])) && typeof parsed[1] === 'string' && uuidPattern.test(parsed[1])) return [parsed[0], parsed[1]]; } catch { /* normalized below */ }
  throw new Error('Invalid history cursor');
}
function mapRow(row: PageRow): HistoryItem { return { categoryId: row.category_id, id: row.id, occurredAt: row.occurred_at, status: row.status as HistoryStatus, title: title(row.snapshot), xpAwarded: row.xp_awarded }; }

export async function listQuestHistory(client: SupabaseClient<Database>, _userId: string, options: { cursor?: string | null; limit?: number; status?: HistoryStatus } = {}): Promise<HistoryPage> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50); const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const { data, error } = await client.rpc('list_quest_history', { p_limit: limit + 1, ...(cursor ? { p_cursor_at: cursor[0], p_cursor_id: cursor[1] } : {}), ...(options.status ? { p_status: options.status } : {}) });
  if (error) throw error; const rows = (data ?? []) as PageRow[]; const page = rows.slice(0, limit);
  return { items: page.map(mapRow), nextCursor: rows.length > limit && page.length ? encodeCursor(page[page.length - 1]!) : null };
}

export async function getQuestHistoryDetail(client: SupabaseClient<Database>, userId: string, instanceId: string): Promise<QuestHistoryDetail | null> {
  if (!uuidPattern.test(instanceId)) return null;
  const { data, error } = await client.from('quest_instances').select('id,status,snapshot,category_id,created_at,completed_at,abandoned_at,quest_completions(xp_awarded,proof_id),quest_proofs(id,storage_path,note,mime_type,status)').eq('user_id', userId).eq('id', instanceId).in('status', ['completed', 'abandoned']).maybeSingle();
  if (error) throw error; if (!data) return null; const row = data as unknown as DetailRow; const completion = row.quest_completions?.[0];
  const proof = completion ? row.quest_proofs?.find((candidate) => candidate.id === completion.proof_id && candidate.status === 'uploaded') : undefined;
  let signedUrl: string | null = null; if (proof) { const signed = await client.storage.from('quest-proofs').createSignedUrl(proof.storage_path, 300); if (signed.error) throw signed.error; signedUrl = signed.data.signedUrl; }
  return { categoryId: row.category_id, id: row.id, occurredAt: row.completed_at ?? row.abandoned_at ?? row.created_at, status: row.status as HistoryStatus, title: title(row.snapshot), xpAwarded: completion?.xp_awarded ?? 0, snapshot: row.snapshot,
    proof: proof && signedUrl ? { alt: proof.note?.trim() || '', mimeType: proof.mime_type, note: proof.note, signedUrl } : null };
}
