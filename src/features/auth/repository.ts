import type { AuthError, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';

export type SignUpInput = Readonly<{ email: string; password: string; displayName: string }>;
export type SignUpResult = Readonly<{ userId: string | null; needsEmailConfirmation: boolean }>;

export function validateSignUp(input: SignUpInput): string | null {
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) return 'Enter a valid email address.';
  if (input.password.length < 8) return 'Password must be at least 8 characters.';
  const name = input.displayName.trim();
  if (name.length < 2 || name.length > 40) return 'Display name must be 2–40 characters.';
  return null;
}

export async function signUp(client: SupabaseClient<Database>, input: SignUpInput): Promise<SignUpResult> {
  const { data, error } = await client.auth.signUp({
    email: input.email.trim(), password: input.password, options: { data: { display_name: input.displayName.trim() } },
  });
  if (error) throw error;
  return { userId: data.user?.id ?? null, needsEmailConfirmation: data.user?.identities?.length === 0 || data.session === null };
}

export function safeAuthMessage(error: unknown): string {
  const authError = error as Partial<AuthError>;
  if (authError.status === 429) return 'Too many attempts. Please try again later.';
  return 'Unable to create your account. Check your details and try again.';
}
