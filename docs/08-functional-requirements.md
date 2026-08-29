# Functional Requirements

`MUST` requirements are testable MVP obligations. P0 unless marked otherwise.

## Authentication and profile

- **FR-AUTH-001:** The system MUST support email/password account creation with normalized email and provider-compliant password validation.
- **FR-AUTH-002:** The app MUST restore a valid session on launch and route invalid/expired sessions to Sign In.
- **FR-AUTH-003:** Sign-out MUST clear client session material and protected cached data.
- **FR-ONB-001:** New users MUST complete onboarding before first Explore access; saving MUST be retryable and idempotent.
- **FR-PROFILE-001:** Users MUST read/update only their own profile and preferences.
- **FR-PROFILE-002:** Profile MUST display authoritative level, XP, completion count, category counts, and paginated history.

## Discovery and matching

- **FR-DISC-001:** Search MUST require one valid value for time, budget, mood, and distance.
- **FR-DISC-002:** The app MUST request foreground location only when a user initiates a proximity-dependent search.
- **FR-DISC-003:** When foreground location is unavailable, matching MUST exclude `place`, exclude `area` unless an eligible area is already known without additional input, and keep `none` eligible; constraints MUST not be silently widened.
- **FR-MATCH-001:** Matching MUST exclude disabled, unsafe, unavailable, over-time, over-budget, and over-distance templates.
- **FR-MATCH-002:** `Random` MUST select among otherwise eligible seeded categories and MUST NOT be stored as a Quest category.
- **FR-MATCH-003:** Matching MUST prefer templates not completed recently and exclude candidates already rerolled in the current search session.
- **FR-MATCH-004:** A successful search MUST create exactly one Candidate Quest Instance containing an immutable execution snapshot.
- **FR-MATCH-006:** Subsequent rerolls MUST exclude every `template_id` already represented by a Quest Instance with the same `search_id`, without a separate exclusion entity.
- **FR-MATCH-005:** No match MUST return a reason code and safe, explicit relaxation suggestions.
- **FR-REROLL-001:** Reroll MUST transition the current Candidate to `rerolled` and MUST NOT create an Active Quest or award XP.
- **FR-REROLL-002:** Server-side limits MUST cap excessive search/reroll requests and return retry guidance.

## Quest lifecycle

- **FR-QUEST-001:** Quest Instance status MUST follow the transitions in [09-quest-system.md](09-quest-system.md).
- **FR-QUEST-002:** The database MUST enforce at most one `active` Quest Instance per user.
- **FR-QUEST-003:** Accept MUST be server-authoritative and idempotent; conflict MUST return the existing Active Quest.
- **FR-QUEST-004:** Active Quest instructions and reward MUST use the instance snapshot, unaffected by later template edits.
- **FR-QUEST-005:** A `place` Quest MUST generate a platform-safe external map action primarily from snapshotted latitude, longitude, and location name; an allowlisted HTTPS override/fallback is optional. SideQuest MUST NOT provide turn-by-turn navigation.
- **FR-QUEST-006:** Abandon MUST require confirmation, award zero XP, and be idempotent.
- **FR-QUEST-007:** Candidate expiry MUST be server-enforced with a default 30-minute TTL, prevent acceptance, and offer a new search; a visible countdown is P1.
- **FR-QUEST-008:** An Active Quest MUST NOT expire from ordinary duration. It MAY become `expired` only with `status_reason=availability_expired` or `safety_disabled`.

## Proof and completion

- **FR-PROOF-001:** Completion MUST require exactly one successfully registered owner-private photo proof; a note of 0–500 characters is optional.
- **FR-PROOF-002:** Upload MUST validate ownership, instance status, object path, MIME type, and configured size limit.
- **FR-PROOF-003:** Users MUST be able to retry or replace proof before completion.
- **FR-PROOF-004:** Proof input MUST allow camera or system image picker. If camera is denied, picker remains usable; if neither is available, completion is blocked with Settings guidance.
- **FR-COMP-001:** Completion MUST atomically validate Active ownership/proof, create one completion, transition status, award XP, and update progress.
- **FR-COMP-002:** Completion MUST accept an idempotency key and return the original result for a duplicate request.
- **FR-COMP-003:** XP MUST be computed server-side from the snapshotted reward plus approved bonuses.
- **FR-COMP-004:** The client MUST not display XP as awarded until the authoritative transaction succeeds.

## Reliability, privacy, analytics, accessibility

- **FR-REL-001:** Critical mutations MUST show pending state, prevent duplicate taps, and expose retryable versus terminal errors.
- **FR-REL-002:** Cached Active Quest may be displayed offline but MUST be labeled stale; mutations require reconnect and refetch.
- **FR-SEC-001:** RLS MUST deny cross-user reads/writes by default; proof objects MUST reside in private storage.
- **FR-PRIV-001:** Raw search coordinates MUST not be stored in analytics and MUST be discarded after matching unless a selected location reference is snapshotted.
- **FR-AN-001:** The app MUST emit the minimal events and consent-safe properties in [20-analytics.md](20-analytics.md), without proof content or precise coordinates.
- **FR-ACC-001:** Every core-loop action MUST be screen-reader labeled, keyboard/switch navigable where supported, and operable with reduced motion and dynamic text.
- **FR-OBS-001:** Failures MUST include a correlation ID in structured logs without secrets, proof content, or precise coordinates.
- **FR-DELETE-001:** Account deletion MUST remove/anonymize user data and proof objects according to [14-security-and-privacy.md](14-security-and-privacy.md).
- **FR-I18N-001:** The app MUST use localization keys for user-facing strings, default to `id-ID`, and fall back to `en`; full bilingual content parity is not an MVP requirement.
- **FR-AGE-001:** MVP onboarding/legal flow MUST state and enforce the product’s 18+ eligibility policy to the extent approved by final legal copy.
