import { validateOnboardingPreferences, ONBOARDING_DEFAULTS, saveOnboarding, updatePreferences } from './repository';
test('SQ-0104 accepts documented neutral defaults', () => expect(validateOnboardingPreferences(ONBOARDING_DEFAULTS)).toBeNull());
test('SQ-0104 rejects invalid preference values', () => expect(validateOnboardingPreferences({ ...ONBOARDING_DEFAULTS, mood: 'party' })).toBeTruthy());

test('SQ-0104 save is safely repeatable with the same values', async () => {
  const update = jest.fn(() => ({ eq: jest.fn(() => ({ is: jest.fn(async () => ({ error: null })) })) }));
  const from = jest.fn(() => ({ update }));
  const client = { from: from } as never;
  await saveOnboarding(client, 'user-1', ONBOARDING_DEFAULTS);
  await saveOnboarding(client, 'user-1', ONBOARDING_DEFAULTS);
  expect(update).toHaveBeenCalledTimes(4);
  expect(update).toHaveBeenNthCalledWith(1, expect.objectContaining({ default_mood: 'random' }));
});

test('SQ-0105 preference edits do not update profile onboarding state', async () => {
  const update = jest.fn(() => ({ eq: jest.fn(async () => ({ error: null })) }));
  const from = jest.fn(() => ({ update }));
  const client = { from } as never;
  await updatePreferences(client, 'user-1', ONBOARDING_DEFAULTS);
  expect(from).toHaveBeenCalledWith('user_preferences');
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ default_mood: 'random' }));
});
