import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { levelForXp, xpForLevel } from './xp-level';

export type ProgressSummary = {
  userId: string; lifetimeXp: number; level: number; completedCount: number;
  currentLevelXp: number; nextLevelXp: number; progressPercent: number;
};

export function toProgressSummary(row: Database['public']['Tables']['user_progress']['Row']): ProgressSummary {
  const xp = BigInt(row.lifetime_xp);
  const level = levelForXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - current;
  const percent = span === 0n ? 0 : Number(((xp - current) * 100n) / span);
  return { userId: row.user_id, lifetimeXp: Number(xp), level, completedCount: row.completed_count,
    currentLevelXp: Number(xp - current), nextLevelXp: Number(span), progressPercent: Math.max(0, Math.min(100, percent)) };
}

export async function getProgress(client: SupabaseClient<Database>, userId: string): Promise<ProgressSummary> {
  const { data, error } = await client.from('user_progress').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return toProgressSummary(data);
}
