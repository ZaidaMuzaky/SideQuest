# Open Questions and Decision Log

None of the unresolved questions below blocks Epic 0. Each blocks only the named later milestone. Implementation agents must not silently resolve them.

## Genuinely unresolved

### OQ-001 — Email verification and recovery policy

- **Status:** IMPORTANT; blocks external beta auth completion, not Epic 0.
- **Why:** affects onboarding routing, abuse controls, support, and recovery screens.
- **Options:** mandatory verification before Explore; deferred verification with restrictions; passwordless magic link instead of the preferred password flow.
- **Recommendation:** require verification before external beta and include password recovery; permit bypass only in non-production internal development.
- **Impact:** mandatory adds friction but reduces abuse; deferred improves activation but complicates trust; magic link changes the specified auth UX.

## Resolved for MVP; deferred external-release decisions

### OQ-003 — Launch geography and location-data source/licensing

- **Status:** RESOLVED FOR MVP (2026-09-01). Production launch geography/source remains an external release-readiness decision and does not block MVP software completion.
- **Why:** final place coverage, accuracy, provenance, licensing, and launch QA depend on it.
- **Options:** one manually curated city/metro using approved open/licensed data; multiple cities with thinner supply; paid places API.
- **MVP decision:** keep the engine geography-agnostic and use only deterministic SideQuest-controlled development catalog/fixtures. Do not hardcode a city or add a provider. Production geography, provenance, licensing, and launch validation remain deferred to external launch preparation.
- **Impact:** one city improves quality but limits reach; multi-city raises no-match/safety risk; paid API adds cost/privacy/vendor dependency.
- **Development rule:** launch geography remains TBD; engine is geography-agnostic; `SQ-0006` creates deterministic development data and must not hardcode a city.

### OQ-004 — Analytics, crash reporting, and consent

- **Status:** RESOLVED FOR MVP (2026-09-01). Third-party vendor selection and consent remain deferred to post-MVP external release preparation.
- **Why:** vendor SDKs affect consent, privacy disclosures, residency, retention, and observability.
- **Options:** privacy-oriented managed tools; Supabase/server funnel events plus minimal crash tool; no product analytics for private alpha.
- **MVP decision:** do not integrate third-party analytics or crash reporting and do not transmit additional telemetry externally. Continue the existing internal observability/error-handling foundation. No vendor consent UI is required for MVP.
- **Impact:** managed tools accelerate analysis but add processors/cost; internal events need analysis work; none limits product learning.

### OQ-005 — Final legal/privacy retention review

- **Status:** BLOCKER before external beta; not Epic 0.
- **Why:** location, images, account deletion, age positioning, backup expiry, and processor terms require jurisdiction-specific review.
- **Options:** retain current recommended defaults pending counsel; shorter proof retention; user-controlled proof deletion while retaining completion metadata.
- **Recommendation:** complete legal review before beta; minimize operational logs to 30–90 days, delete proof on account deletion, and document backup/processor deletion timelines.
- **Impact:** shorter retention improves privacy but reduces support investigation; longer retention needs stronger justification and controls.

## Resolved MVP decisions

### SQ-0302 — Deterministic matching contract

- **Decision:** resolved 2026-08-29 — eligibility precedes deterministic ranking; eligible candidates use normalized time/budget/location compatibility weighted 50/30/20.
- **Budget:** Flexible remains one visible preference and uses an internal Rp250,000 MVP discovery ceiling.
- **Availability:** the backend owns the validated ISO-weekday, local `HH:mm`, and optional ISO-date-bounds contract; null means generally available absent another disabling rule.
- **Area and safety:** area identifiers come only from SideQuest-controlled catalog data; safety uses existing catalog/moderation availability and `safety_disabled` lifecycle semantics, without a new score or taxonomy.
- **Rationale:** resolves the matching RPC contract deterministically without adding user preferences, geography vendors, calendar engines, ML, or speculative schema.
- **Affected:** FR-MATCH-001–003/006, AC-MATCH-001/002, `SQ-0302`.

### OQ-002 — Walking distance

- **Decision:** resolved 2026-08-27 — walking distance is an estimated **1 km** for MVP.
- **Rationale:** a single explainable threshold keeps matching and QA deterministic.
- **Later review:** launch research may propose a documented change; it does not reopen MVP implementation by default.
- **Affected:** FR-DISC-001/FR-MATCH-001, AC-MATCH-001, `SQ-0301`.

### OQ-006 — Proof policy

- **Decision:** resolved 2026-08-27 — camera or system image picker; exactly one private image required; optional note; no strong identity/location verification claim.
- **Fallback:** camera denial leaves picker usable; if neither is available, completion is blocked with Settings guidance.
- **Rationale:** balances ritual, accessibility, and implementation simplicity.
- **Affected:** FR-PROOF-001/004, AC-PROOF-001, `SQ-0501`–`0502`.

### OQ-007 — Active Quest expiry

- **Decision:** resolved 2026-08-27 — no ordinary time/duration expiry. Active remains until completed, user-abandoned, explicit availability expiry, or safety disable.
- **Reasons:** `availability_expired` and `safety_disabled` for Active→Expired; `user_abandoned` for Active→Abandoned.
- **Rationale:** avoids surprising loss while retaining catalog safety controls.
- **Affected:** FR-QUEST-008, AC-QUEST-006, `SQ-0404`–`0405`.

### OQ-008 — Initial language

- **Decision:** resolved 2026-08-27 — default locale `id-ID`, fallback `en`, i18n-ready architecture, and localization keys for all user-facing strings.
- **Scope:** fully bilingual content parity is not required for MVP.
- **Rationale:** fits the initial market while avoiding hardcoded-copy migration later.
- **Affected:** FR-I18N-001, `SQ-0008`, all screen implementations.

### OQ-009 — Age eligibility

- **Decision:** resolved 2026-08-27 — SideQuest MVP is **18+**.
- **Scope:** onboarding/legal/store positioning reflects 18+; final wording remains part of OQ-005 legal review.
- **Rationale:** simplifies real-world activity, location, image, and consent safeguards for MVP.
- **Affected:** FR-AGE-001, `SQ-0104`, release legal review.

## Future decision-log format

For every later resolution record date, owner, selected option, rationale, affected `FR-*`/`AC-*`/`SQ-*` IDs, and migration/privacy/analytics implications.
