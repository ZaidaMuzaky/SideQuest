import type { SupportedStorage } from '@supabase/supabase-js';

import type { PublicEnvironment } from '@/config/env';

export function createSupabaseClientOptions(storage: SupportedStorage) {
  return {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  } as const;
}

export function getSupabaseClientCredentials(environment: PublicEnvironment) {
  return {
    url: environment.supabaseUrl,
    publishableKey: environment.supabasePublishableKey,
  } as const;
}
