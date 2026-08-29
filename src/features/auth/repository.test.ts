import { validateSignUp } from './repository';

test('SQ-0102 validates signup input without contacting privileged services', () => {
  expect(validateSignUp({ email: 'bad', password: 'short', displayName: 'A' })).toBeTruthy();
  expect(validateSignUp({ email: 'user@example.com', password: 'password123', displayName: 'Ari' })).toBeNull();
});

test('SQ-0102 rejects invalid display names and accepts canonical input', () => {
  expect(validateSignUp({ email: 'user@example.com', password: 'password123', displayName: ' Ari ' })).toBeNull();
  expect(validateSignUp({ email: 'user@example.com', password: 'password123', displayName: 'A' })).toBeTruthy();
});
