import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.generated';

export async function getQuestServerTime(client: SupabaseClient<Database>) {
  const { data, error } = await client.rpc('quest_server_time');
  if (error) throw error;
  if (typeof data !== 'string' || !Number.isFinite(Date.parse(data))) throw new Error('Invalid server time response');
  return data;
}
