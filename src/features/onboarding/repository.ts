import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';

export const ONBOARDING_DEFAULTS = {
  time: 'flexible', budget: 'flexible', mood: 'random', distance: 'flexible',
} as const;
export type OnboardingPreferences = Readonly<{ time: string; budget: string; mood: string; distance: string }>;

export function validateOnboardingPreferences(input: OnboardingPreferences): string | null {
  if (!['30_minutes', '1_hour', '2_hours', 'half_day', 'flexible'].includes(input.time)) return 'Choose a time preference.';
  if (!['free', 'under_50000', 'under_100000', 'flexible'].includes(input.budget)) return 'Choose a budget preference.';
  if (!['chill', 'food', 'explore', 'active', 'creative', 'random'].includes(input.mood)) return 'Choose a mood preference.';
  if (!['walking', 'under_3_km', 'under_10_km', 'flexible'].includes(input.distance)) return 'Choose a distance preference.';
  return null;
}

/** RLS-authorized, repeat-safe save. Repeating the request preserves the same values and completion timestamp. */
export async function saveOnboarding(client: SupabaseClient<Database>, userId: string, input: OnboardingPreferences): Promise<void> {
  const invalid = validateOnboardingPreferences(input);
  if (invalid) throw new Error(invalid);
  const { error: preferencesError } = await client.from('user_preferences').update({
    default_time: input.time, default_budget: input.budget, default_mood: input.mood, default_distance: input.distance,
  }).eq('user_id', userId);
  if (preferencesError) throw preferencesError;
  const { error: profileError } = await client.from('profiles').update({ onboarding_completed_at: new Date().toISOString() })
    .eq('user_id', userId).is('onboarding_completed_at', null);
  if (profileError) throw profileError;
}
