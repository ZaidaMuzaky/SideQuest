import { abandonQuest, parseAbandonQuestResult } from './abandon-repository';

const wire = { status: 'abandoned', outcome: 'abandoned', instance_id: 'q1', search_id: 's1', abandoned: { title: 'Quest' },
  abandoned_at: '2026-08-29T10:00:00Z', proof_cleanup_queued: true } as const;

test('SQ-0404 invokes the authoritative abandon RPC', async () => {
  const rpc = jest.fn(async () => ({ data: wire, error: null }));
  await expect(abandonQuest({ rpc } as never, 'q1')).resolves.toMatchObject({ status: 'abandoned', outcome: 'abandoned',
    instanceId: 'q1', proofCleanupQueued: true });
  expect(rpc).toHaveBeenCalledWith('abandon_quest', { p_quest_instance_id: 'q1' });
});

test('SQ-0404 parses idempotent replay', () => {
  expect(parseAbandonQuestResult({ ...wire, outcome: 'already_abandoned' })).toMatchObject({ outcome: 'already_abandoned' });
});

test('SQ-0404 rejects malformed outcomes and surfaces RPC errors', async () => {
  expect(() => parseAbandonQuestResult({ ...wire, outcome: 'completed' })).toThrow('Invalid abandon response');
  const error = new Error('offline');
  await expect(abandonQuest({ rpc: jest.fn(async () => ({ data: null, error })) } as never, 'q1')).rejects.toBe(error);
});
