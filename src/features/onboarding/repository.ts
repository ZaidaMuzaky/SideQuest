import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';

export const ONBOARDING_DEFAULTS = {
  time: 'flexible', budget: 'flexible', mood: 'random', distance: 'flexible',
} as const;
export type OnboardingPreferences = Readonly<{ time: string; budget: string; mood: string; distance: string }>;

export const PREFERENCE_OPTIONS = {
  time: [['flexible', 'flexible'], ['30_minutes', 'thirtyMinutes'], ['1_hour', 'oneHour'], ['2_hours', 'twoHours'], ['half_day', 'halfDay']],
  budget: [['flexible', 'flexible'], ['free', 'free'], ['under_50000', 'under50000'], ['under_100000', 'under100000']],
  mood: [['random', 'surprise'], ['chill', 'chill'], ['food', 'food'], ['explore', 'explore'], ['active', 'active'], ['creative', 'creative']],
  distance: [['flexible', 'flexible'], ['walking', 'walking'], ['under_3_km', 'under3km'], ['under_10_km', 'under10km']],
} as const;

export async function getPreferences(client: SupabaseClient<Database>, userId: string): Promise<OnboardingPreferences> {
  const { data, error } = await client.from('user_preferences').select('default_time,default_budget,default_mood,default_distance').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? { time: data.default_time, budget: data.default_budget, mood: data.default_mood, distance: data.default_distance } : ONBOARDING_DEFAULTS;
}

/** RLS-authorized preference edit; deliberately does not alter onboarding completion. */
export async function updatePreferences(client: SupabaseClient<Database>, userId: string, input: OnboardingPreferences): Promise<void> {
  const invalid = validateOnboardingPreferences(input);
  if (invalid) throw new Error(invalid);
  const { error } = await client.from('user_preferences').update({ default_time: input.time, default_budget: input.budget, default_mood: input.mood, default_distance: input.distance }).eq('user_id', userId);
  if (error) throw error;
}

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
