export const QUEST_CATEGORIES = ['chill', 'food', 'explore', 'active', 'creative'] as const;
export type QuestCategory = (typeof QUEST_CATEGORIES)[number];
export type TimeFilter = '30_minutes' | '1_hour' | '2_hours' | 'half_day';
export type BudgetFilter = 'free' | 'under_50000' | 'under_100000' | 'flexible';
export type DistanceFilter = 'walking' | 'under_3_km' | 'under_10_km' | 'flexible';
export type MoodFilter = QuestCategory | 'random';
export type LocationMode = 'none' | 'area' | 'place';

export type MatchRequest = Readonly<{
  time: TimeFilter;
  budget: BudgetFilter;
  mood: MoodFilter;
  distance: DistanceFilter;
  knownEligibleAreaCode?: string;
  hasUsableForegroundLocation: boolean;
  flexibleBudgetSafetyCeiling: number;
}>;

export type MatchTemplate = Readonly<{
  id: string;
  category: QuestCategory;
  categoryEnabled: boolean;
  moderationStatus: 'approved' | 'draft' | 'disabled';
  enabledAt: Date | null;
  disabledAt: Date | null;
  availabilityEligible: boolean;
  safetyEligible: boolean;
  durationMin: number;
  durationMax: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  currencyCode: string;
  locationMode: LocationMode;
  areaCodes?: readonly string[];
  location?: Readonly<{ enabled: boolean; hasCoordinates: boolean; distanceKm: number }>;
  fitScore: number;
  noveltyScore: number;
  catalogConfidenceScore: number;
}>;

const TIME_CEILINGS: Record<TimeFilter, number> = {
  '30_minutes': 30, '1_hour': 60, '2_hours': 120, half_day: 240,
};
const BUDGET_CEILINGS: Record<Exclude<BudgetFilter, 'flexible'>, number> = {
  free: 0, under_50000: 50_000, under_100000: 100_000,
};
const DISTANCE_CEILINGS: Record<Exclude<DistanceFilter, 'flexible'>, number> = {
  walking: 1, under_3_km: 3, under_10_km: 10,
};

export function isEligibleTemplate(template: MatchTemplate, request: MatchRequest, now: Date): boolean {
  if (!QUEST_CATEGORIES.includes(template.category) || !template.categoryEnabled) return false;
  if (template.moderationStatus !== 'approved' || !template.availabilityEligible) return false;
  if (!template.enabledAt || template.enabledAt > now) return false;
  if (template.disabledAt && template.disabledAt <= now) return false;
  if (request.mood !== 'random' && template.category !== request.mood) return false;
  if (template.durationMax > TIME_CEILINGS[request.time]) return false;
  if (template.currencyCode !== 'IDR') return false;
  if (request.budget === 'free') {
    if (template.estimatedCostMin !== 0 || template.estimatedCostMax !== 0) return false;
  } else if (request.budget === 'flexible') {
    if (template.estimatedCostMax > request.flexibleBudgetSafetyCeiling) return false;
  } else if (template.estimatedCostMax > BUDGET_CEILINGS[request.budget]) return false;
  if (!template.safetyEligible) return false;

  if (template.locationMode === 'none') return true;
  if (template.locationMode === 'area') {
    return Boolean(request.knownEligibleAreaCode && template.areaCodes?.includes(request.knownEligibleAreaCode));
  }
  if (!request.hasUsableForegroundLocation || !template.location?.enabled || !template.location.hasCoordinates) return false;
  return request.distance === 'flexible' || template.location.distanceKm <= DISTANCE_CEILINGS[request.distance];
}

export function weightedMatchScore(template: MatchTemplate): number {
  for (const score of [template.fitScore, template.noveltyScore, template.catalogConfidenceScore]) {
    if (!Number.isFinite(score) || score < 0 || score > 1) throw new RangeError('Match score components must be normalized from 0 to 1');
  }
  return template.fitScore * 0.5 + template.noveltyScore * 0.3 + template.catalogConfidenceScore * 0.2;
}

function deterministicTieBreaker(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function rankEligibleTemplates(
  templates: readonly MatchTemplate[],
  request: MatchRequest,
  context: Readonly<{
    now: Date;
    userId: string;
    searchId: string;
    activeTemplateId?: string;
    representedTemplateIds: ReadonlySet<string>;
    completedAtByTemplateId: ReadonlyMap<string, Date>;
    cooldownDays?: number;
  }>,
): MatchTemplate[] {
  const eligible = templates.filter((template) =>
    template.id !== context.activeTemplateId
    && !context.representedTemplateIds.has(template.id)
    && isEligibleTemplate(template, request, context.now));
  const cooldownMs = (context.cooldownDays ?? 30) * 24 * 60 * 60 * 1000;
  const novel = eligible.filter((template) => {
    const completedAt = context.completedAtByTemplateId.get(template.id);
    return !completedAt || context.now.getTime() - completedAt.getTime() >= cooldownMs;
  });
  const pool = novel.length > 0 ? novel : eligible;
  return [...pool].sort((left, right) => {
    const scoreDifference = weightedMatchScore(right) - weightedMatchScore(left);
    if (scoreDifference !== 0) return scoreDifference;
    const leftTie = deterministicTieBreaker(`${context.userId}:${context.searchId}:${left.id}`);
    const rightTie = deterministicTieBreaker(`${context.userId}:${context.searchId}:${right.id}`);
    return leftTie - rightTie || left.id.localeCompare(right.id);
  });
}
