import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import type { ActiveQuestDetail, ActiveQuestSummary } from './types';

function snapshotObject(snapshot: ActiveQuestSummary['snapshot']): Record<string, unknown> {
  return typeof snapshot === 'object' && snapshot !== null && !Array.isArray(snapshot) ? snapshot : {};
}

function text(value: unknown) { return typeof value === 'string' ? value : ''; }
function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }

export function toActiveQuestDetail(summary: ActiveQuestSummary): ActiveQuestDetail {
  const snapshot = snapshotObject(summary.snapshot);
  return {
    ...summary,
    title: text(snapshot.title) || summary.title,
    description: text(snapshot.description),
    instructions: Array.isArray(snapshot.instructions) ? snapshot.instructions.filter((item): item is string => typeof item === 'string') : [],
    categorySlug: text(snapshot.category_slug),
    durationMinutes: { min: number(snapshot.duration_min), max: number(snapshot.duration_max) },
    estimatedCost: { min: number(snapshot.estimated_cost_min), max: number(snapshot.estimated_cost_max), currency: text(snapshot.currency_code) },
    difficulty: text(snapshot.difficulty),
    baseXp: number(snapshot.base_xp),
    physicalDemand: text(snapshot.physical_demand),
    safetyNotes: text(snapshot.safety_notes),
  };
}

export async function getActiveQuest(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ActiveQuestSummary | null> {
  const { data, error } = await client
    .from('quest_instances')
    .select('id, snapshot, category_id, quest_proofs(status)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const snapshot = data.snapshot;
  const title = typeof snapshot === 'object' && snapshot !== null && 'title' in snapshot && typeof snapshot.title === 'string'
    ? snapshot.title : '';
  const proof = Array.isArray(data.quest_proofs) ? data.quest_proofs[0] : undefined;
  const proofStatus = proof && typeof proof.status === 'string' ? proof.status : undefined;
  return { id: data.id, title, category: String(data.category_id), snapshot,
    ...(proofStatus ? { proofStatus } : {}) };
}
