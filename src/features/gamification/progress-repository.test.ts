import { toProgressSummary } from './progress-repository';

test('SQ-0602 derives level progress from authoritative cached totals', () => {
  const result = toProgressSummary({ user_id: 'u', lifetime_xp: 150, level: 2, completed_count: 3, updated_at: 'now' });
  expect(result).toMatchObject({ userId: 'u', lifetimeXp: 150, level: 2, completedCount: 3, currentLevelXp: 50, nextLevelXp: 200, progressPercent: 25 });
});

test('SQ-0602 clamps progress when cached level is stale', () => {
  expect(toProgressSummary({ user_id: 'u', lifetime_xp: 300, level: 1, completed_count: 1, updated_at: 'now' }).level).toBe(3);
});
