import { ONBOARDING_DEFAULTS } from '@/features/onboarding/repository';
import { isValidExploreFilters, validateExploreFilters } from './filters';

test('SQ-0201 accepts defaults as one valid value per selector', () => {
  expect(validateExploreFilters(ONBOARDING_DEFAULTS)).toBeNull();
  expect(isValidExploreFilters(ONBOARDING_DEFAULTS)).toBe(true);
});

test('SQ-0201 rejects missing or unknown selector values', () => {
  expect(validateExploreFilters({ time: ONBOARDING_DEFAULTS.time, budget: ONBOARDING_DEFAULTS.budget, distance: ONBOARDING_DEFAULTS.distance })).toBe('mood');
  expect(validateExploreFilters({ ...ONBOARDING_DEFAULTS, distance: 'nearby' })).toBe('distance');
});
