import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import type { ActiveQuestSummary } from './types';

export async function getActiveQuest(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<ActiveQuestSummary | null> {
  const { data, error } = await client
    .from('quest_instances')
    .select('id, snapshot, category_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const snapshot = data.snapshot;
  const title = typeof snapshot === 'object' && snapshot !== null && 'title' in snapshot && typeof snapshot.title === 'string'
    ? snapshot.title : '';
  return { id: data.id, title, category: String(data.category_id), snapshot };
}
