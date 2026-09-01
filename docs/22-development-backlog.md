# Development Backlog

Each task is sized for an independent coding-agent change (roughly a focused PR). “DoD” for every task: implementation plus relevant tests, lint/typecheck, acceptance/requirement references, no secrets, states/accessibility handled, and docs/migration updated when behavior changes.

## Epic 0 — Foundation

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0001 | Initialize Expo app | Strict TS, Expo Router, NativeWind, scripts. Dep: none. | P0 | Builds iOS/Android; lint/typecheck/test scripts pass. |
| SQ-0002 | Theme and primitives | Tokens, Button, Chip, Input, Card, status components. Dep: 0001. | P0 | 18/19; light/dark and large-text stories/tests. |
| SQ-0003 | Supabase local/environments | Client config, local stack, env example, generated types. Dep: 0001. | P0 | No service secret client-side; local health check. |
| SQ-0004 | Base schema migrations | Enums/profile/catalog/quest/progress tables and constraints. Dep: 0003. | P0 | 11; clean migration and rollback plan reviewed. |
| SQ-0005 | RLS/storage policies | Owner isolation, catalog view, private buckets. Dep: 0004. | P0 | AC-PRIV-001 adversarial tests pass. |
| SQ-0006 | Seed Development Quest Catalog | Geography-neutral development/demo records only; not final launch content. Dep: 0004. | P0 | Deterministic seed loads; no city hardcoded; clearly separated from test fixtures and production launch catalog. |
| SQ-0007 | App shell/observability | Route groups, error boundary, typed errors, safe logger. Dep: 0001–3. | P0 | FR-OBS-001; correlation ID and redaction tests. |
| SQ-0008 | Localization foundation | Typed localization keys, `id-ID` default, `en` fallback, locale tests. Dep: 0001. | P0 | FR-I18N-001; screens cannot hardcode user-facing strings. |

## Epic 1 — Authentication & Onboarding

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0101 | Auth repository/session gate | Supabase session restore and protected route logic. Dep: 0003,0007. | P0 | AC-AUTH-002, AC-REL-002. |
| SQ-0102 | Sign-up screen | Validation, profile bootstrap transaction, errors. Dep: 0101,0004. | P0 | AC-AUTH-001. |
| SQ-0103 | Sign-in/sign-out | Forms, cache clearing, back-stack reset. Dep: 0101. | P0 | AC-AUTH-002/003. |
| SQ-0104 | Onboarding flow | Three-step defaults, 18+ eligibility/legal presentation, and idempotent save. Dep: 0102,0002,0008. | P0 | AC-ONB-001, FR-AGE-001. |
| SQ-0105 | Edit preferences | Profile settings reuse onboarding controls. Dep: 0104. | P1 | AC-PROFILE-002. |

## Epic 2 — Quest Discovery

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0201 | Explore filter form | Four selector groups, defaults, validation. Dep: 0104,0002. | P0 | AC-DISC-001. |
| SQ-0202 | Foreground location adapter | Point-of-use rationale, permission/freshness states. Dep: 0201. | P0 | AC-PERM-001, EC-001/002. |
| SQ-0203 | Candidate UI | Loading, candidate, no-match, reroll, and base error states; no countdown required. Dep: 0201,0202,0302,0303. | P0 | AC-CAND-001, AC-MATCH-003. |
| SQ-0204 | Active resume banner | Query and route to existing Active. Dep: 0402. | P0 | AC-QUEST-003. |

## Epic 3 — Quest Matching

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0301 | Matching domain tests | Constraint, novelty, score, location-mode, currency, and safety tests using dedicated deterministic fixtures. Dep: 0004 domain/schema foundation only; not SQ-0006 or launch catalog. | P0 | FR-MATCH-001–003/006 boundary coverage; catalog changes cannot destabilize tests. |
| SQ-0302 | `match_quest` RPC | Validate/rate limit/match/snapshot Candidate. Dep: 0301,0005. | P0 | AC-MATCH-001/002; no coordinates persisted. |
| SQ-0303 | Reroll RPC/client | Transition, exclusions, exhaustion, limits. Dep: 0302. | P0 | AC-REROLL-001. |
| SQ-0304 | Candidate expiry | Server-enforce default 30-minute TTL, reject expired acceptance, and integrate Candidate Find-Another recovery. Dep: 0302,0401,0203. | P0 | FR-QUEST-007, EC-007; no visible countdown required. |
| SQ-0305 | Candidate expiry countdown | Optional visible “expires in…” indicator using server time. Dep: 0304,0203. | P1 | Indicator is accessible and never authoritative. |

## Epic 4 — Quest Execution

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0401 | Accept RPC | Transaction/idempotency/one-Active conflict. Dep: 0004,0302. | P0 | AC-QUEST-001/002 concurrency test. |
| SQ-0402 | Active Quest screen | Snapshot, instructions, states, recovery. Dep: 0401,0002. | P0 | AC-QUEST-003. |
| SQ-0403 | External map linking | Validated map URI and fallback. Dep: 0402. | P0 | AC-QUEST-004. |
| SQ-0404 | Abandon flow/RPC | Confirmation, `user_abandoned` transition, explicit proof cleanup marker. Dep: 0402. | P0 | AC-QUEST-005. |
| SQ-0405 | Explicit Active expiry | Server transitions for `availability_expired` and `safety_disabled`; never elapsed duration. Dep: 0401,0402. | P0 | FR-QUEST-008, AC-QUEST-006. |

## Epic 5 — Proof & Completion

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0501 | Proof picker/camera | Permission, preview, normalize, validate. Dep: 0402. | P0 | AC-PROOF-001; EC-003/013. |
| SQ-0502 | Private upload/registration | Storage path, policies, progress, retry/replace. Dep: 0501,0005. | P0 | AC-PROOF-001/002. |
| SQ-0503 | Completion RPC | Lock, proof/state checks, immutable completion, exactly one total-award ledger row, and cached progress update in one idempotent transaction. Dep: 0502,0601. | P0 | AC-COMP-001/002 rollback, replay, and different-key concurrency tests. |
| SQ-0504 | Celebration UI | XP delta, level-up, reduced motion. Dep: 0503,0002. | P0 | AC-COMP-003. |
| SQ-0505 | Proof media cleanup | Process `pending_delete`: remove Storage object, then metadata. Dep: 0502,0404. | P0 | No cross-user deletes; DB deletion alone is insufficient; failures observable. |

## Epic 6 — Gamification

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0601 | XP/level SQL + TS contract | Threshold function and fixtures. Dep: 0004. | P0 | 10 examples match across server/client. |
| SQ-0602 | Progress query/components | Authoritative totals and progress bar. Dep: 0503,0002. | P0 | AC-PROFILE-001. |

## Epic 7 — Profile & History

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0701 | Profile summary | Identity, progress, category aggregates. Dep: 0602. | P0 | AC-PROFILE-001. |
| SQ-0702 | History/detail | Cursor pagination, filters, owner-private proof URL. Dep: 0503. | P0 | AC-HIST-001, AC-PRIV-001. |
| SQ-0703 | Avatar upload | Private avatar replace/delete. Dep: 0701. | P1 | AC-PROFILE-003. |
| SQ-0704 | Account deletion | Reauth, cascade/object cleanup workflow. Dep: 0701,0505. | P0 | FR-DELETE-001 and policy test. |

## Epic 8 — Reliability & Edge Cases

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0801 | Query cache/offline behavior | Safe persistence, foreground/reconnect refetch. Dep: feature epics. | P0 | AC-REL-001; EC-008–010. |
| SQ-0802 | Rate limits/idempotency audit | Auth/match/reroll/proof/complete controls. Dep: RPCs. | P0 | 09/14 abuse tests. |
| SQ-0803 | Error-state audit | Typed copy and retry for every screen. Dep: feature epics. | P0 | 07 and EC matrix covered. |
| SQ-0804 | Analytics instrumentation | Internal typed allowlisted diagnostics only; third-party production vendor deferred by OQ-004. Dep: features. | P0 | FR-AN-001 MVP-safe schema tests; external vendor work deferred. |
| SQ-0805 | Accessibility audit/fixes | VoiceOver/TalkBack, text, contrast, motion. Dep: feature epics. | P0 | AC-ACC-001. |
| SQ-0806 | Quest report flow | unavailable/unsafe reporting. Dep: 0402. | P1 | AC-REPORT-001. |

## Epic 9 — QA & Release Preparation

| ID | Task | Description / dependencies | Pri | Acceptance / DoD addition |
|---|---|---|---|---|
| SQ-0901 | CI quality gates | lint/type/unit/db/integration build pipelines. Dep: 0001–5. | P0 | 17 gates enforced. |
| SQ-0902 | Core E2E suite | iOS/Android core and recovery flows. Dep: all P0 features. | P0 | All P0 ACs traced. |
| SQ-0903 | Security/privacy review | RLS/storage/secrets/deletion/store disclosures. Dep: all P0. | P0 | 14 checklist signed off. |
| SQ-0904 | Launch catalog review | Release-readiness review for a future OQ-003 production geography/source; MVP remains on deterministic geography-neutral catalog. | P0 | Deferred external-launch gate; no fabricated production data. |
| SQ-0905 | Beta/device validation | Matrix, performance, crash-free smoke, accessibility. Dep: 0901–4. | P0 | Release gate evidence recorded. |
| SQ-0906 | Release runbook | Migration, rollback/disable switch, support/incident contacts. Dep: 0903–5. | P0 | Dry run completed in staging. |

## Practical dependency sequence

Epic numbers organize work; they are not a strict execution order. For discovery/matching, implement in this dependency order:

1. `SQ-0201` Explore filters and `SQ-0202` Location adapter.
2. `SQ-0301` Matching tests, `SQ-0302` Matching RPC, and `SQ-0303` Reroll RPC.
3. `SQ-0203` Candidate UI.

After the base Candidate UI and `SQ-0401` accept transaction exist, `SQ-0304` integrates server TTL enforcement and expired recovery. This avoids completing Candidate UI against a fictional backend and contains no circular dependency.

## P0 requirement coverage

| Requirement group | Backlog tasks |
|---|---|
| FR-AUTH / FR-ONB | SQ-0101–0104 |
| FR-PROFILE | SQ-0105, SQ-0701–0702 |
| FR-DISC | SQ-0201–0202, SQ-0801 |
| FR-MATCH / FR-REROLL | SQ-0301–0303 |
| FR-QUEST | SQ-0304, SQ-0401–0405 |
| FR-PROOF | SQ-0501–0502, SQ-0505 |
| FR-COMP | SQ-0503–0504, SQ-0601–0602 |
| FR-REL / FR-OBS | SQ-0007, SQ-0801–0803 |
| FR-SEC / FR-PRIV / FR-DELETE | SQ-0005, SQ-0505, SQ-0704, SQ-0802, SQ-0903 |
| FR-AN | SQ-0804 (after OQ-004 for production vendor behavior) |
| FR-ACC | SQ-0002, SQ-0805, SQ-0902/0905 |
| FR-I18N | SQ-0008 plus every screen task |
| FR-AGE | SQ-0104, with final legal wording under OQ-005 before external beta |
