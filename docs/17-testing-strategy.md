# Testing Strategy

## Test pyramid

- **Unit:** filter conversion, matching score/tie-break, distance math, snapshot/version validation, currency ceilings, XP thresholds, localization-key coverage, error mapping, analytics property sanitization. Matching tests use deterministic fixtures independent from mutable catalog seeds.
- **Database:** migrations from empty state, constraints, partial unique Active index, RLS/storage policies, RPC transitions, locks/concurrency, idempotency, ledger reconciliation.
- **Integration:** app repositories against local/staging Supabase; auth lifecycle; match→accept→proof→complete; signed upload; pagination; session expiry.
- **Component:** every screen’s loading/empty/error/offline/permission states, form validation, dynamic text, accessible names, disabled/pending behavior.
- **E2E:** instrumented physical/simulator flows for first launch, sign-in, onboarding, match, reroll, accept, restore, proof, complete, profile/history, abandon, denial/offline recovery.
- **Manual/exploratory:** Quest clarity/safety, real venue behavior, external maps, low light/camera, slow networks, device settings changes, dark mode, haptics/motion, localized long text.

## Critical path release gate

Never release unless these pass in CI/staging and smoke testing:

1. Migrations, RLS cross-user denial, private storage policies.
2. One-Active concurrency test.
3. Completion/XP idempotency and transaction rollback tests.
4. Budget/time/distance/category matching invariants and no-silent-relax behavior.
5. Location-unavailable exclusion of `place` and unknown `area`, plus eligibility of `none`.
6. Active Quest restart/reconnect recovery and explicit-only expiry reasons.
7. Proof validation/upload failure recovery.
8. Auth sign-out/cache clearing and expired-session recovery.
9. Core E2E loop on supported iOS and Android versions.
10. Accessibility smoke checks for core screens.

## Device matrix

At minimum: current and oldest supported iOS on small/large devices; current and oldest supported Android on low/mid-range hardware; light/dark; 100%/200% text; screen reader smoke; reduced motion; granted/denied permissions; Wi-Fi, throttled, offline/reconnect. Define exact OS floor during project foundation using current Expo SDK support.

## Environments and data

Local Supabase uses deterministic seed templates covering every category/filter boundary and no-match cases. Staging uses non-production accounts/buckets and launch-like catalog. Tests create unique users and clean only their scoped fixtures. Never use real proof images or production coordinates in automated tests.

## Quality automation

Pull requests run formatting, lint, TypeScript, unit/component tests, migration validation, RLS/database tests, and dependency/security checks. Main/staging runs integration and E2E. Release builds add device smoke, store configuration/privacy manifest review, and analytics schema validation.

## Traceability

Tests name requirement/acceptance IDs. P0 acceptance coverage must be 100% by at least one automated test where technically stable plus manual evidence where OS permission/device behavior cannot be reliable in CI. Failures are fixed or explicitly accepted by the product/security owner; tests are never removed merely to pass.
