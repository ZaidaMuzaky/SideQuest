import { getProfileSummary } from './repository';

test('SQ-0701 builds authoritative profile aggregates', async () => {
  const rows: any = {
    profiles: { data: { user_id: 'u', display_name: 'Ada', avatar_path: null }, error: null },
    user_progress: { data: { user_id: 'u', lifetime_xp: 150, level: 2, completed_count: 2, updated_at: '' }, error: null },
    quest_completions: { data: [{ xp_awarded: 100, quest_instances: { category_id: 2 } }, { xp_awarded: 50, quest_instances: { category_id: 2 } }], error: null },
  };
  const client: any = { from: (table: string) => ({ select: () => ({ eq: () => ({ single: async () => rows[table] }), then: undefined }), }) };
  client.from = (table: string) => table === 'quest_completions' ? { select: () => ({ eq: async () => rows[table] }) } : { select: () => ({ eq: () => ({ single: async () => rows[table] }) }) };
  await expect(getProfileSummary(client, 'u')).resolves.toMatchObject({ displayName: 'Ada', categories: [{ categoryId: 2, completedCount: 2, xp: 150 }] });
});
