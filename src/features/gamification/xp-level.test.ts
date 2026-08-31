import { levelForXp, xpForLevel } from './xp-level';
test('SQ-0601 matches documented XP thresholds', () => {
  expect([0, 100, 300, 600, 1000].map((value) => levelForXp(BigInt(value)))).toEqual([1, 2, 3, 4, 5]);
  expect(xpForLevel(5)).toBe(1000n);
});
