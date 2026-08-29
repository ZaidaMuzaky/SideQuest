import { createObservability, createCorrelationId } from './logger';

test('redacts sensitive context and emits correlation id', () => {
  const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  createObservability(true).log('info', 'test', { token: 'secret', safe: 'ok' });
  expect(info).toHaveBeenCalledWith(expect.stringContaining('"token":"[REDACTED]"'));
  expect(info).toHaveBeenCalledWith(expect.stringContaining('correlationId'));
  info.mockRestore();
});

test('tracking is a no-op without a vendor', () => {
  expect(() => createObservability(false).track('future.event', { token: 'secret' })).not.toThrow();
  expect(createCorrelationId()).toMatch(/^sq-/);
});
