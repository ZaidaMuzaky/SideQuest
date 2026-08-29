import { validateOnboardingPreferences, ONBOARDING_DEFAULTS } from './repository';
test('SQ-0104 accepts documented neutral defaults', () => expect(validateOnboardingPreferences(ONBOARDING_DEFAULTS)).toBeNull());
test('SQ-0104 rejects invalid preference values', () => expect(validateOnboardingPreferences({ ...ONBOARDING_DEFAULTS, mood: 'party' })).toBeTruthy());
