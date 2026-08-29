import { getQuestServerTime } from './server-time';

test('SQ-0305 reads the countdown anchor from the authenticated server RPC', async () => {
  const rpc = jest.fn(async () => ({ data: '2026-08-29T10:00:00Z', error: null }));
  await expect(getQuestServerTime({ rpc } as never)).resolves.toBe('2026-08-29T10:00:00Z');
  expect(rpc).toHaveBeenCalledWith('quest_server_time');
});

test('SQ-0305 rejects missing or malformed server time', async () => {
  await expect(getQuestServerTime({ rpc: async () => ({ data: 'later', error: null }) } as never)).rejects.toThrow('Invalid server time response');
  const error = new Error('offline');
  await expect(getQuestServerTime({ rpc: async () => ({ data: null, error }) } as never)).rejects.toBe(error);
});
