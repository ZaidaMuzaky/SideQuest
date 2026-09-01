import { ALLOWED_EVENTS, createObservability } from './logger';

test('SQ-0804 exposes only the documented allowlisted events', () => {
  expect(ALLOWED_EVENTS).toHaveLength(15);
  const emit = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  const logger = createObservability(true);
  logger.track('quest_completed', { proofPath: 'private', category: 'chill' });
  logger.track('email_export', { email: 'private' });
  expect(emit).toHaveBeenCalledTimes(1);
  expect(emit.mock.calls[0]?.[0]).not.toContain('private');
  emit.mockRestore();
});
