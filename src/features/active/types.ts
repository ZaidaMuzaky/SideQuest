import type { Json } from '@/types/database.generated';
import type { QuestLocationSnapshot } from './map-link';

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
  location?: QuestLocationSnapshot;
  locationMode: 'none' | 'area' | 'place';
};

export type ActiveQuestUiState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'expired'; reason: 'availability_expired' | 'safety_disabled' }
  | { kind: 'active'; quest: ActiveQuestDetail; offline?: boolean };
