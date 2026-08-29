import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getPublicEnvironment } from '@/config/env';
import type { Database } from '@/types/database.generated';

import { createSupabaseClientOptions, getSupabaseClientCredentials } from './client-options';

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    const credentials = getSupabaseClientCredentials(getPublicEnvironment());
    client = createClient<Database>(
      credentials.url,
      credentials.publishableKey,
      createSupabaseClientOptions(localStorage),
    );
  }

  return client;
}
