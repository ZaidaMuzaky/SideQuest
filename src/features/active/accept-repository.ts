import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '@/types/database.generated';

export type AcceptQuestResult =
  | { status: 'active'; outcome: 'accepted' | 'already_active' | 'existing_active'; instanceId: string;
      searchId: string; active: Json; acceptedAt: string }
  | { status: 'expired'; reason: 'candidate_expired'; instanceId: string; searchId: string };

function object(value: Json): Record<string, Json | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid accept response');
  return value;
}

function requiredString(value: Json | undefined): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error('Invalid accept response');
  return value;
}

export function parseAcceptQuestResult(value: Json): AcceptQuestResult {
  const data = object(value);
  const status = requiredString(data.status);
  const instanceId = requiredString(data.instance_id);
  const searchId = requiredString(data.search_id);
  if (status === 'active') {
    const outcome = requiredString(data.outcome);
    if (!['accepted','already_active','existing_active'].includes(outcome) || data.active === undefined)
      throw new Error('Invalid accept response');
    const active = object(data.active) as Json;
    return { status, outcome: outcome as 'accepted' | 'already_active' | 'existing_active', instanceId, searchId,
      active, acceptedAt: requiredString(data.accepted_at) };
  }
  if (status === 'expired' && data.reason === 'candidate_expired')
    return { status, reason: data.reason, instanceId, searchId };
  throw new Error('Invalid accept response');
}

export async function acceptQuest(client: SupabaseClient<Database>, candidateId: string): Promise<AcceptQuestResult> {
  const { data, error } = await client.rpc('accept_quest', { p_candidate_id: candidateId });
  if (error) throw error;
  return parseAcceptQuestResult(data);
}
