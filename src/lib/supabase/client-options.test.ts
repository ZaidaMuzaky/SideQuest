import { parsePublicEnvironment } from '@/config/env';

import { createSupabaseClientOptions, getSupabaseClientCredentials } from './client-options';

describe('SQ-0003 Supabase client configuration', () => {
  it('uses only validated public credentials and enables persisted sessions', () => {
    const storage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const environment = parsePublicEnvironment({
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'public-key',
    });

    expect(getSupabaseClientCredentials(environment)).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'public-key',
    });
    expect(createSupabaseClientOptions(storage)).toEqual({
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  });
});
