import { clearSupabaseAuthStorage, validateSignIn, validateSignUp } from './repository';

test('SQ-0102 validates signup input without contacting privileged services', () => {
  expect(validateSignUp({ email: 'bad', password: 'short', displayName: 'A' })).toBeTruthy();
  expect(validateSignUp({ email: 'user@example.com', password: 'password123', displayName: 'Ari' })).toBeNull();
});

test('SQ-0102 rejects invalid display names and accepts canonical input', () => {
  expect(validateSignUp({ email: 'user@example.com', password: 'password123', displayName: ' Ari ' })).toBeNull();
  expect(validateSignUp({ email: 'user@example.com', password: 'password123', displayName: 'A' })).toBeTruthy();
});

test('SQ-0103 validates sign-in credentials', () => {
  expect(validateSignIn({ email: 'bad', password: '' })).toBeTruthy();
  expect(validateSignIn({ email: 'user@example.com', password: 'secret' })).toBeNull();
});

test('SQ-0103 clears persisted Supabase auth material on sign-out', () => {
  const values = new Map([['sb-project-auth-token', 'secret'], ['app-cache', 'safe']]);
  const storage: Storage = {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
  clearSupabaseAuthStorage(storage);
  expect(values.has('sb-project-auth-token')).toBe(false);
  expect(values.has('app-cache')).toBe(true);
});
