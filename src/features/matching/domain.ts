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
}>;

export type MatchTemplate = Readonly<{
  id: string;
  category: QuestCategory;
  categoryEnabled: boolean;
  moderationStatus: 'approved' | 'draft' | 'disabled';
  enabledAt: Date | null;
  disabledAt: Date | null;
  availabilityEligible: boolean;
  durationMin: number;
  durationMax: number;
  estimatedCostMin: number;
  estimatedCostMax: number;
  currencyCode: string;
  locationMode: LocationMode;
  areaCodes?: readonly string[];
  location?: Readonly<{ enabled: boolean; hasCoordinates: boolean; distanceKm: number }>;
}>;

export type AvailabilityWindow = Readonly<{
  days: readonly number[];
  start_time: string;
  end_time: string;
  valid_from: string | null;
  valid_until: string | null;
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
export const FLEXIBLE_BUDGET_SAFETY_CEILING_IDR = 250_000;

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
    if (template.estimatedCostMax > FLEXIBLE_BUDGET_SAFETY_CEILING_IDR) return false;
  } else if (template.estimatedCostMax > BUDGET_CEILINGS[request.budget]) return false;

  if (template.locationMode === 'none') return true;
  if (template.locationMode === 'area') {
    return Boolean(request.knownEligibleAreaCode && template.areaCodes?.includes(request.knownEligibleAreaCode));
  }
  if (!request.hasUsableForegroundLocation || !template.location?.enabled || !template.location.hasCoordinates) return false;
  return request.distance === 'flexible' || template.location.distanceKm <= DISTANCE_CEILINGS[request.distance];
}

export function compatibilityScores(template: MatchTemplate, request: MatchRequest) {
  const time = Math.max(0, 1 - template.durationMax / TIME_CEILINGS[request.time]);
  const budgetCeiling = request.budget === 'flexible'
    ? FLEXIBLE_BUDGET_SAFETY_CEILING_IDR
    : BUDGET_CEILINGS[request.budget];
  const budget = budgetCeiling === 0 ? 1 : Math.max(0, 1 - template.estimatedCostMax / budgetCeiling);
  let location = 1;
  if (template.locationMode === 'place') {
    const distance = template.location?.distanceKm ?? Number.POSITIVE_INFINITY;
    location = request.distance === 'flexible'
      ? 1 / (1 + distance)
      : Math.max(0, 1 - distance / DISTANCE_CEILINGS[request.distance]);
  }
  return { time, budget, location, total: time * 0.5 + budget * 0.3 + location * 0.2 } as const;
}

export function isAvailabilityWindow(value: unknown): value is AvailabilityWindow {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const keys = Object.keys(item);
  if (!keys.includes('days') || !keys.includes('start_time') || !keys.includes('end_time')
    || keys.some((key) => !['days', 'start_time', 'end_time', 'valid_from', 'valid_until'].includes(key))) return false;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  const validDate = (candidate: unknown) => {
    if (typeof candidate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return false;
    return new Date(`${candidate}T00:00:00.000Z`).toISOString().slice(0, 10) === candidate;
  };
  return Array.isArray(item.days) && item.days.length > 0
    && item.days.every((day) => Number.isInteger(day) && Number(day) >= 1 && Number(day) <= 7)
    && new Set(item.days).size === item.days.length
    && typeof item.start_time === 'string' && time.test(item.start_time)
    && typeof item.end_time === 'string' && time.test(item.end_time)
    && item.start_time < item.end_time
    && (item.valid_from === undefined || item.valid_from === null || validDate(item.valid_from))
    && (item.valid_until === undefined || item.valid_until === null || validDate(item.valid_until))
    && (item.valid_from == null || item.valid_until == null || String(item.valid_from) <= String(item.valid_until));
}

export function isAvailableAt(window: AvailabilityWindow | null, localDateTime: Date): boolean {
  if (!window) return true;
  const date = localDateTime.toISOString().slice(0, 10);
  const time = localDateTime.toISOString().slice(11, 16);
  const isoDay = localDateTime.getUTCDay() || 7;
  return window.days.includes(isoDay)
    && time >= window.start_time && time <= window.end_time
    && (!window.valid_from || date >= window.valid_from)
    && (!window.valid_until || date <= window.valid_until);
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
    const scoreDifference = compatibilityScores(right, request).total - compatibilityScores(left, request).total;
    if (scoreDifference !== 0) return scoreDifference;
    const leftTie = deterministicTieBreaker(`${context.userId}:${context.searchId}:${left.id}`);
    const rightTie = deterministicTieBreaker(`${context.userId}:${context.searchId}:${right.id}`);
    return leftTie - rightTie || left.id.localeCompare(right.id);
  });
}
