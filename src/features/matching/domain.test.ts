import { isEligibleTemplate, rankEligibleTemplates, weightedMatchScore, type MatchRequest, type MatchTemplate } from './domain';

const now = new Date('2026-08-29T00:00:00.000Z');
const request: MatchRequest = { time: '1_hour', budget: 'under_50000', mood: 'chill', distance: 'under_3_km', hasUsableForegroundLocation: true, flexibleBudgetSafetyCeiling: 250_000 };
const baseline: MatchTemplate = { id: 'template-a', category: 'chill', categoryEnabled: true, moderationStatus: 'approved', enabledAt: new Date('2026-01-01'), disabledAt: null, availabilityEligible: true, safetyEligible: true, durationMin: 20, durationMax: 60, estimatedCostMin: 0, estimatedCostMax: 50_000, currencyCode: 'IDR', locationMode: 'none', fitScore: 1, noveltyScore: 1, catalogConfidenceScore: 1 };
const change = (values: Partial<MatchTemplate>) => ({ ...baseline, ...values });

describe('SQ-0301 hard matching constraints (FR-MATCH-001/002)', () => {
  test('accepts inclusive time and budget boundaries and rejects values above them', () => {
    expect(isEligibleTemplate(baseline, request, now)).toBe(true);
    expect(isEligibleTemplate(change({ durationMax: 61 }), request, now)).toBe(false);
    expect(isEligibleTemplate(change({ estimatedCostMax: 50_001 }), request, now)).toBe(false);
    expect(isEligibleTemplate(change({ estimatedCostMin: 1, estimatedCostMax: 1 }), { ...request, budget: 'free' }, now)).toBe(false);
    expect(isEligibleTemplate(change({ estimatedCostMin: 0, estimatedCostMax: 1 }), { ...request, budget: 'free' }, now)).toBe(false);
    expect(isEligibleTemplate(change({ estimatedCostMax: 250_000 }), { ...request, budget: 'flexible' }, now)).toBe(true);
    expect(isEligibleTemplate(change({ estimatedCostMax: 250_001 }), { ...request, budget: 'flexible' }, now)).toBe(false);
  });

  test.each([
    ['30_minutes', 30], ['1_hour', 60], ['2_hours', 120], ['half_day', 240],
  ] as const)('%s uses an inclusive %i-minute ceiling', (time, ceiling) => {
    expect(isEligibleTemplate(change({ durationMax: ceiling }), { ...request, time }, now)).toBe(true);
    expect(isEligibleTemplate(change({ durationMax: ceiling + 1 }), { ...request, time }, now)).toBe(false);
  });

  test.each([
    ['under_50000', 50_000], ['under_100000', 100_000],
  ] as const)('%s uses an inclusive IDR %i ceiling', (budget, ceiling) => {
    expect(isEligibleTemplate(change({ estimatedCostMax: ceiling }), { ...request, budget }, now)).toBe(true);
    expect(isEligibleTemplate(change({ estimatedCostMax: ceiling + 1 }), { ...request, budget }, now)).toBe(false);
  });

  test.each([
    { categoryEnabled: false }, { moderationStatus: 'draft' as const }, { availabilityEligible: false },
    { enabledAt: null }, { enabledAt: new Date('2026-08-29T00:00:00.001Z') }, { disabledAt: now },
    { currencyCode: 'USD' }, { safetyEligible: false },
  ])('excludes unavailable, unsafe, or invalid catalog rows: %o', (values) => {
    expect(isEligibleTemplate(change(values), request, now)).toBe(false);
  });

  test('uses inclusive enablement and exclusive disablement timestamps', () => {
    expect(isEligibleTemplate(change({ enabledAt: now }), request, now)).toBe(true);
    expect(isEligibleTemplate(change({ disabledAt: new Date(now.getTime() + 1) }), request, now)).toBe(true);
  });

  test('Random selects seeded categories but is never itself a category', () => {
    for (const category of ['chill', 'food', 'explore', 'active', 'creative'] as const) {
      expect(isEligibleTemplate(change({ category }), { ...request, mood: 'random' }, now)).toBe(true);
    }
    expect(isEligibleTemplate(change({ category: 'food' }), request, now)).toBe(false);
  });
});

describe('SQ-0301 location-mode invariants (FR-MATCH-001)', () => {
  test('none stays eligible without location and area requires a previously known eligible area', () => {
    expect(isEligibleTemplate(baseline, { ...request, hasUsableForegroundLocation: false }, now)).toBe(true);
    const area = change({ locationMode: 'area', areaCodes: ['area_alpha'] });
    expect(isEligibleTemplate(area, { ...request, hasUsableForegroundLocation: false }, now)).toBe(false);
    expect(isEligibleTemplate(area, { ...request, hasUsableForegroundLocation: false, knownEligibleAreaCode: 'area_alpha' }, now)).toBe(true);
  });

  test('place requires usable foreground location, an enabled coordinate-bearing place, and inclusive radius', () => {
    const place = change({ locationMode: 'place', location: { enabled: true, hasCoordinates: true, distanceKm: 3 } });
    expect(isEligibleTemplate(place, request, now)).toBe(true);
    expect(isEligibleTemplate(change({ ...place, location: { ...place.location!, distanceKm: 3.001 } }), request, now)).toBe(false);
    expect(isEligibleTemplate(place, { ...request, hasUsableForegroundLocation: false }, now)).toBe(false);
    expect(isEligibleTemplate(change({ ...place, location: { enabled: false, hasCoordinates: true, distanceKm: 1 } }), request, now)).toBe(false);
    expect(isEligibleTemplate(change({ ...place, location: { enabled: true, hasCoordinates: false, distanceKm: 1 } }), request, now)).toBe(false);
    expect(isEligibleTemplate(change({ ...place, location: { enabled: true, hasCoordinates: true, distanceKm: 999 } }), { ...request, distance: 'flexible' }, now)).toBe(true);
  });

  test.each([
    ['walking', 1], ['under_3_km', 3], ['under_10_km', 10],
  ] as const)('%s uses an inclusive %i km radius', (distance, ceiling) => {
    const atBoundary = change({ locationMode: 'place', location: { enabled: true, hasCoordinates: true, distanceKm: ceiling } });
    const overBoundary = change({ locationMode: 'place', location: { enabled: true, hasCoordinates: true, distanceKm: ceiling + 0.001 } });
    expect(isEligibleTemplate(atBoundary, { ...request, distance }, now)).toBe(true);
    expect(isEligibleTemplate(overBoundary, { ...request, distance }, now)).toBe(false);
  });
});

describe('SQ-0301 novelty, exclusions, and deterministic scoring (FR-MATCH-003/006)', () => {
  const context = { now, userId: 'user-1', searchId: 'search-1', representedTemplateIds: new Set<string>(), completedAtByTemplateId: new Map<string, Date>() };
  test('always excludes the Active and every template represented in the search', () => {
    const templates = [baseline, change({ id: 'template-b' }), change({ id: 'template-c' })];
    expect(rankEligibleTemplates(templates, request, { ...context, activeTemplateId: 'template-a', representedTemplateIds: new Set(['template-b']) }).map(({ id }) => id)).toEqual(['template-c']);
  });

  test('prefers away from recent completions but permits one when it is the only supply', () => {
    const recent = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const history = new Map([['template-a', recent]]);
    expect(rankEligibleTemplates([baseline, change({ id: 'template-b' })], request, { ...context, completedAtByTemplateId: history }).map(({ id }) => id)).toEqual(['template-b']);
    expect(rankEligibleTemplates([baseline], request, { ...context, completedAtByTemplateId: history }).map(({ id }) => id)).toEqual(['template-a']);
  });

  test('treats the exact cooldown boundary as non-recent', () => {
    const boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(rankEligibleTemplates([baseline], request, { ...context, completedAtByTemplateId: new Map([['template-a', boundary]]) })).toHaveLength(1);
  });

  test('uses the documented weights and a stable deterministic tie break', () => {
    expect(weightedMatchScore(change({ fitScore: 1, noveltyScore: 0, catalogConfidenceScore: 0 }))).toBe(0.5);
    expect(weightedMatchScore(change({ fitScore: 0, noveltyScore: 1, catalogConfidenceScore: 0 }))).toBe(0.3);
    expect(weightedMatchScore(change({ fitScore: 0, noveltyScore: 0, catalogConfidenceScore: 1 }))).toBe(0.2);
    const tied = [baseline, change({ id: 'template-b' })];
    const expected = rankEligibleTemplates(tied, request, context).map(({ id }) => id);
    expect(rankEligibleTemplates([...tied].reverse(), request, context).map(({ id }) => id)).toEqual(expected);
    expect(() => weightedMatchScore(change({ fitScore: Number.NaN }))).toThrow(RangeError);
  });
});
