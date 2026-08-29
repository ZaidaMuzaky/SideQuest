import { sessionRoute } from './session';

test('session route gate distinguishes loading, auth, and protected states', () => {
  expect(sessionRoute({ isLoading: true, session: null, error: null })).toBe('loading');
  expect(sessionRoute({ isLoading: false, session: null, error: null })).toBe('auth');
  expect(sessionRoute({ isLoading: false, session: {} as never, error: null })).toBe('protected');
});
