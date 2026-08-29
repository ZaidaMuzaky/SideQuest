import { acceptQuest, parseAcceptQuestResult } from './accept-repository';

test('SQ-0401 invokes the authoritative accept RPC and parses an Active snapshot', async () => {
  const rpc = jest.fn(async () => ({ data: { status: 'active', outcome: 'accepted', instance_id: 'i1', search_id: 's1',
    active: { title: 'Quest' }, accepted_at: '2026-08-29T10:00:00Z' }, error: null }));
  await expect(acceptQuest({ rpc } as never, 'i1')).resolves.toEqual({ status: 'active', outcome: 'accepted',
    instanceId: 'i1', searchId: 's1', active: { title: 'Quest' }, acceptedAt: '2026-08-29T10:00:00Z' });
  expect(rpc).toHaveBeenCalledWith('accept_quest', { p_candidate_id: 'i1' });
});

test.each(['already_active','existing_active'] as const)('SQ-0401 parses the %s idempotent outcome', (outcome) => {
  expect(parseAcceptQuestResult({ status: 'active', outcome, instance_id: 'i1', search_id: 's1', active: {},
    accepted_at: '2026-08-29T10:00:00Z' })).toMatchObject({ status: 'active', outcome, instanceId: 'i1' });
});

test('SQ-0401 parses authoritative Candidate expiry', () => {
  expect(parseAcceptQuestResult({ status: 'expired', reason: 'candidate_expired', instance_id: 'i1', search_id: 's1' }))
    .toEqual({ status: 'expired', reason: 'candidate_expired', instanceId: 'i1', searchId: 's1' });
});

test('SQ-0401 rejects an unrecognized response', () => {
  expect(() => parseAcceptQuestResult({ status: 'active', outcome: 'invented', instance_id: 'i1', search_id: 's1',
    active: {}, accepted_at: '2026-08-29T10:00:00Z' })).toThrow('Invalid accept response');
});

test('SQ-0401 surfaces RPC errors', async () => {
  const error = new Error('offline');
  await expect(acceptQuest({ rpc: jest.fn(async () => ({ data: null, error })) } as never, 'i1')).rejects.toBe(error);
});
