import { validateOnboardingPreferences, ONBOARDING_DEFAULTS, saveOnboarding } from './repository';
test('SQ-0104 accepts documented neutral defaults', () => expect(validateOnboardingPreferences(ONBOARDING_DEFAULTS)).toBeNull());
test('SQ-0104 rejects invalid preference values', () => expect(validateOnboardingPreferences({ ...ONBOARDING_DEFAULTS, mood: 'party' })).toBeTruthy());

test('SQ-0104 save is safely repeatable with the same values', async () => {
  const update = jest.fn(() => ({ eq: jest.fn(() => ({ is: jest.fn(async () => ({ error: null })) })) }));
  const client = { from: jest.fn(() => ({ update })) } as never;
  await saveOnboarding(client, 'user-1', ONBOARDING_DEFAULTS);
  await saveOnboarding(client, 'user-1', ONBOARDING_DEFAULTS);
  expect(update).toHaveBeenCalledTimes(4);
  expect(update).toHaveBeenNthCalledWith(1, expect.objectContaining({ default_mood: 'random' }));
});
