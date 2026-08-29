import { PREFERENCE_OPTIONS, type OnboardingPreferences } from '@/features/onboarding/repository';

export type ExploreFilterKey = keyof OnboardingPreferences;

export function validateExploreFilters(input: Partial<OnboardingPreferences>): ExploreFilterKey | null {
  for (const key of ['time', 'budget', 'mood', 'distance'] as const) {
    const value = input[key];
    if (!value || !PREFERENCE_OPTIONS[key].some(([option]) => option === value)) return key;
  }
  return null;
}

export function isValidExploreFilters(input: Partial<OnboardingPreferences>): input is OnboardingPreferences {
  return validateExploreFilters(input) === null;
}
