import { parsePublicEnvironment, PUBLIC_ENV_NAMES } from './env';

describe('SQ-0003 public environment boundary', () => {
  it('accepts and normalizes valid public Supabase configuration', () => {
    expect(
      parsePublicEnvironment({
        supabaseUrl: ' http://127.0.0.1:54321/ ',
        supabasePublishableKey: ' local-publishable-key ',
      }),
    ).toEqual({
      supabaseUrl: 'http://127.0.0.1:54321',
      supabasePublishableKey: 'local-publishable-key',
    });
  });

  it('fails safely when required configuration is missing', () => {
    expect(() =>
      parsePublicEnvironment({ supabaseUrl: undefined, supabasePublishableKey: undefined }),
    ).toThrow('EXPO_PUBLIC_SUPABASE_URL');
  });

  it('rejects URLs containing credentials', () => {
    expect(() =>
      parsePublicEnvironment({
        supabaseUrl: 'https://user:password@example.com',
        supabasePublishableKey: 'public-key',
      }),
    ).toThrow('must not contain credentials');
  });

  it('allowlists only client-safe configuration names', () => {
    expect(PUBLIC_ENV_NAMES).toEqual([
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ]);
    expect(PUBLIC_ENV_NAMES.join(' ')).not.toMatch(/service|password|secret/i);
  });
});
