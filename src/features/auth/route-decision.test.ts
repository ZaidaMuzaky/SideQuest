import { routeDecision } from './session';

test('protected route waits for session before deciding', () => {
  expect(routeDecision('/protected/quests', { session: null, isLoading: true, error: null })).toBe('loading');
  expect(routeDecision('/protected/quests', { session: null, isLoading: false, error: null })).toBe('auth');
  expect(routeDecision('/protected/quests', { session: {} as never, isLoading: false, error: null })).toBe('allow');
});

test('public foundation route is never redirected by the session gate', () => {
  expect(routeDecision('/', { session: null, isLoading: true, error: null })).toBe('allow');
});
