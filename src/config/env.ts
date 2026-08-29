export const PUBLIC_ENV_NAMES = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const;

export type PublicEnvironment = Readonly<{
  supabaseUrl: string;
  supabasePublishableKey: string;
}>;

export type PublicEnvironmentSource = Readonly<{
  supabaseUrl: string | undefined;
  supabasePublishableKey: string | undefined;
}>;

function requireValue(value: string | undefined, name: (typeof PUBLIC_ENV_NAMES)[number]): string {
  if (!value?.trim()) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value.trim();
}

function requireHttpUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.');
  }

  if (url.username || url.password) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must not contain credentials.');
  }

  return url.toString().replace(/\/$/, '');
}

export function parsePublicEnvironment(source: PublicEnvironmentSource): PublicEnvironment {
  const supabaseUrl = requireHttpUrl(
    requireValue(source.supabaseUrl, 'EXPO_PUBLIC_SUPABASE_URL'),
  );
  const supabasePublishableKey = requireValue(
    source.supabasePublishableKey,
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );

  return Object.freeze({ supabaseUrl, supabasePublishableKey });
}

export function getPublicEnvironment(): PublicEnvironment {
  // Expo only inlines EXPO_PUBLIC_* variables when accessed with static dot notation.
  return parsePublicEnvironment({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
