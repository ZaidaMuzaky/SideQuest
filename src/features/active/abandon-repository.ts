import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.generated';

export type AbandonQuestResult = { status: 'abandoned'; outcome: 'abandoned' | 'already_abandoned'; instanceId: string;
  searchId: string; abandoned: Json; abandonedAt: string; proofCleanupQueued: boolean };

function object(value: Json): Record<string, Json | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid abandon response');
  return value;
}
function string(value: Json | undefined) {
  if (typeof value !== 'string' || !value) throw new Error('Invalid abandon response');
  return value;
}

export function parseAbandonQuestResult(value: Json): AbandonQuestResult {
  const data = object(value);
  const outcome = string(data.outcome);
  if (data.status !== 'abandoned' || !['abandoned','already_abandoned'].includes(outcome)
    || typeof data.proof_cleanup_queued !== 'boolean') throw new Error('Invalid abandon response');
  if (data.abandoned === undefined) throw new Error('Invalid abandon response');
  const abandoned = object(data.abandoned) as Json;
  return { status: 'abandoned', outcome: outcome as 'abandoned' | 'already_abandoned', instanceId: string(data.instance_id),
    searchId: string(data.search_id), abandoned, abandonedAt: string(data.abandoned_at),
    proofCleanupQueued: data.proof_cleanup_queued };
}

export async function abandonQuest(client: SupabaseClient<Database>, questInstanceId: string) {
  const { data, error } = await client.rpc('abandon_quest', { p_quest_instance_id: questInstanceId });
  if (error) throw error;
  return parseAbandonQuestResult(data);
}
