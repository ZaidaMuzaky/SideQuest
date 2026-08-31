import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { toProgressSummary, type ProgressSummary } from '@/features/gamification/progress-repository';

export type CategoryAggregate = { categoryId: number; completedCount: number; xp: number };
export type ProfileSummary = { userId: string; displayName: string | null; avatarPath: string | null; progress: ProgressSummary; categories: CategoryAggregate[] };

export async function getProfileSummary(client: SupabaseClient<Database>, userId: string): Promise<ProfileSummary> {
  const [profile, progress, completions] = await Promise.all([
    client.from('profiles').select('user_id, display_name, avatar_path').eq('user_id', userId).single(),
    client.from('user_progress').select('*').eq('user_id', userId).single(),
    client.from('quest_completions').select('xp_awarded, quest_instances!inner(category_id)').eq('user_id', userId),
  ]);
  if (profile.error) throw profile.error;
  if (progress.error) throw progress.error;
  if (completions.error) throw completions.error;
  const grouped = new Map<number, CategoryAggregate>();
  for (const row of completions.data) {
    const instance = row.quest_instances as unknown as { category_id: number };
    const current = grouped.get(instance.category_id) ?? { categoryId: instance.category_id, completedCount: 0, xp: 0 };
    current.completedCount += 1; current.xp += row.xp_awarded; grouped.set(instance.category_id, current);
  }
  return { userId: profile.data.user_id, displayName: profile.data.display_name, avatarPath: profile.data.avatar_path, progress: toProgressSummary(progress.data), categories: [...grouped.values()].sort((a, b) => a.categoryId - b.categoryId) };
}
