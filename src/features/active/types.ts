import type { Json } from '@/types/database.generated';

export type ActiveQuestSummary = {
  id: string;
  title: string;
  category: string;
  snapshot: Json;
};
