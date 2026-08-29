import { parseRerollQuestResult, rerollQuest } from './repository';

test('SQ-0303 calls the authoritative reroll RPC with transient coordinates', async () => {
  const rpc = jest.fn(async () => ({ data: { status: 'candidate', candidate: { title: 'Next' }, instance_id: 'i2',
    search_id: 's1', candidate_expires_at: '2026-08-29T10:00:00Z' }, error: null }));
  await expect(rerollQuest({ rpc } as never, { candidateId: 'i1', searchId: 's1', requestId: 'r1',
    coordinates: { latitude: -6.2, longitude: 106.8 }, timezone: 'Asia/Jakarta' })).resolves.toMatchObject({
      status: 'candidate', instanceId: 'i2', searchId: 's1', candidate: { title: 'Next' },
    });
  expect(rpc).toHaveBeenCalledWith('reroll_quest', { p_candidate_id: 'i1', p_search_id: 's1', p_request_id: 'r1',
    p_latitude: -6.2, p_longitude: 106.8, p_timezone: 'Asia/Jakarta' });
});

test.each([
  [{ status: 'exhausted', reason: 'no_unseen_eligible_quest', search_id: 's1' }, { status: 'exhausted' }],
  [{ status: 'expired', reason: 'candidate_expired', search_id: 's1' }, { status: 'expired' }],
  [{ status: 'rate_limited', reason: 'reroll_rate_limit_exceeded', retry_after_seconds: 20, search_id: 's1' },
    { status: 'rate_limited', retryAfterSeconds: 20 }],
])('SQ-0303 parses typed terminal outcome %#', (wire, expected) => {
  expect(parseRerollQuestResult(wire)).toMatchObject(expected);
});

test('SQ-0303 rejects an unrecognized server result', () => {
  expect(() => parseRerollQuestResult({ status: 'mystery', search_id: 's1' })).toThrow('Invalid reroll response');
  expect(() => parseRerollQuestResult({ status: 'candidate', candidate: null, instance_id: 'i2', search_id: 's1', candidate_expires_at: 'later' })).toThrow('Invalid reroll response');
  expect(() => parseRerollQuestResult({ status: 'rate_limited', reason: 'reroll_rate_limit_exceeded', retry_after_seconds: 0.5, search_id: 's1' })).toThrow('Invalid reroll response');
});

test('SQ-0303 surfaces RPC failures', async () => {
  const error = new Error('offline');
  const rpc = jest.fn(async () => ({ data: null, error }));
  await expect(rerollQuest({ rpc } as never, { candidateId: 'i1', searchId: 's1', requestId: 'r1' })).rejects.toBe(error);
});
