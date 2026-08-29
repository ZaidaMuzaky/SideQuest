import { getActiveQuest } from './repository';

function activeQuestQuery(result: unknown) {
  const maybeSingle = jest.fn(async () => result);
  const statusEq = jest.fn(() => ({ maybeSingle }));
  const userEq = jest.fn(() => ({ eq: statusEq }));
  const select = jest.fn(() => ({ eq: userEq }));
  const from = jest.fn(() => ({ select }));
  return { client: { from } as never, from, select, userEq, statusEq, maybeSingle };
}

test('SQ-0204 restores the authoritative Active Quest snapshot', async () => {
  const query = activeQuestQuery({
    data: {
      id: 'active-1',
      category_id: 3,
      snapshot: { title: 'Sketch the skyline', instructions: ['Bring a pencil'], location: {
        name: 'Public park', latitude: -6.2, longitude: 106.8, external_map_url: 'https://maps.apple.com/?q=Park' } },
      quest_proofs: [{ status: 'uploaded' }],
    },
    error: null,
  });

  await expect(getActiveQuest(query.client, 'user-1')).resolves.toEqual({
    id: 'active-1',
    category: '3',
    title: 'Sketch the skyline',
    snapshot: { title: 'Sketch the skyline', instructions: ['Bring a pencil'], location: {
      name: 'Public park', latitude: -6.2, longitude: 106.8, external_map_url: 'https://maps.apple.com/?q=Park' } },
    proofStatus: 'uploaded',
  });
  expect(query.from).toHaveBeenCalledWith('quest_instances');
  expect(query.select).toHaveBeenCalledWith('id, snapshot, category_id, quest_proofs(status)');
  expect(query.userEq).toHaveBeenCalledWith('user_id', 'user-1');
  expect(query.statusEq).toHaveBeenCalledWith('status', 'active');
});

test('SQ-0204 returns no banner when the user has no Active Quest', async () => {
  const query = activeQuestQuery({ data: null, error: null });
  await expect(getActiveQuest(query.client, 'user-1')).resolves.toBeNull();
});

test('SQ-0204 does not hide Active Quest restore failures', async () => {
  const error = new Error('offline');
  const query = activeQuestQuery({ data: null, error });
  await expect(getActiveQuest(query.client, 'user-1')).rejects.toBe(error);
});
