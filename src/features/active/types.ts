import type { Json } from '@/types/database.generated';

export type ActiveQuestSummary = {
  id: string;
  title: string;
  category: string;
  snapshot: Json;
  proofStatus?: string;
};

export type ActiveQuestDetail = ActiveQuestSummary & {
  description: string;
  instructions: string[];
  categorySlug: string;
  durationMinutes: { min: number; max: number };
  estimatedCost: { min: number; max: number; currency: string };
  difficulty: string;
  baseXp: number;
  physicalDemand: string;
  safetyNotes: string;
};

export type ActiveQuestUiState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'active'; quest: ActiveQuestDetail; offline?: boolean };
