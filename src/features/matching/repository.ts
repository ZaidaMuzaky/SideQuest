import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '@/types/database.generated';

export interface RerollQuestInput {
  candidateId: string;
  searchId: string;
  requestId: string;
  coordinates?: { latitude: number; longitude: number };
  timezone?: string;
}

export type RerollQuestResult =
  | { status: 'candidate'; candidate: Json; instanceId: string; searchId: string; candidateExpiresAt: string }
  | { status: 'exhausted'; reason: 'candidate_limit_reached' | 'no_unseen_eligible_quest'; searchId: string }
  | { status: 'expired'; reason: 'candidate_expired'; searchId: string }
  | { status: 'rate_limited'; reason: 'reroll_rate_limit_exceeded'; retryAfterSeconds: number; searchId: string };

function object(value: Json): Record<string, Json | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid reroll response');
  return value;
}

function string(value: Json | undefined): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error('Invalid reroll response');
  return value;
}

export function parseRerollQuestResult(value: Json): RerollQuestResult {
  const data = object(value);
  const status = string(data.status);
  const searchId = string(data.search_id);
  if (status === 'candidate') {
    if (data.candidate === undefined) throw new Error('Invalid reroll response');
    const candidate = object(data.candidate) as Json;
    return { status, candidate, instanceId: string(data.instance_id), searchId,
      candidateExpiresAt: string(data.candidate_expires_at) };
  }
  const reason = string(data.reason);
  if (status === 'exhausted' && (reason === 'candidate_limit_reached' || reason === 'no_unseen_eligible_quest'))
    return { status, reason, searchId };
  if (status === 'expired' && reason === 'candidate_expired') return { status, reason, searchId };
  if (status === 'rate_limited' && reason === 'reroll_rate_limit_exceeded'
    && typeof data.retry_after_seconds === 'number' && Number.isInteger(data.retry_after_seconds) && data.retry_after_seconds > 0)
    return { status, reason, retryAfterSeconds: data.retry_after_seconds, searchId };
  throw new Error('Invalid reroll response');
}

export async function rerollQuest(client: SupabaseClient<Database>, input: RerollQuestInput): Promise<RerollQuestResult> {
  const { data, error } = await client.rpc('reroll_quest', {
    p_candidate_id: input.candidateId,
    p_search_id: input.searchId,
    p_request_id: input.requestId,
    p_latitude: input.coordinates?.latitude ?? null,
    p_longitude: input.coordinates?.longitude ?? null,
    p_timezone: input.timezone ?? 'UTC',
  });
  if (error) throw error;
  return parseRerollQuestResult(data);
}
