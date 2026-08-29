# APIs and External Services

## Required services

| Service | Purpose/data | Failure and fallback | Cost/privacy |
|---|---|---|---|
| Supabase Auth | Credentials, sessions, user ID | Retry; preserve form; expired session returns to sign-in | Included tiers vary; passwords handled by provider |
| Supabase PostgreSQL | Profiles, catalog, instances, proof metadata, progress | Typed retry/terminal errors; cached read-only Active Quest | Primary data processor; region and retention require launch decision |
| Supabase Storage | Private proof/avatar objects | Retry/replace; Quest stays Active | Storage/egress grows with photos; lifecycle cleanup required |
| Expo build/update tooling | Build and distribute app; no Quest content required | Local/dev builds; release process stops on outage | Review Expo privacy/config; avoid sending app data unnecessarily |
| Device OS services | Foreground coordinate, photo picker/camera, external maps | Permission fallback; non-location Quest; picker alternative | Data remains on device until explicit request/upload |

## Application service contracts

These are logical contracts; implement as typed repository calls plus PostgreSQL RPC where transactional.

### `match_quest`

Input: search UUID, time/budget/mood/distance enum, optional coordinate/already-known controlled area, timezone. Output: Candidate Instance snapshot or typed no-match reason/suggestions. Validates auth, rate limits, existing authoritative catalog/moderation state, server-owned availability, and hard filters before scoring. Flexible applies the internal Rp250,000 discovery ceiling without exposing a new preference. Eligible candidates receive deterministic normalized time/budget/location compatibility with 50/30/20 weighting; hard failures never become soft penalties. Without foreground location it excludes `place` and excludes `area` unless eligible controlled area context is already known. Arbitrary client area text is rejected, and raw coordinates are never persisted.

### `reroll_quest`

Input: candidate ID, search UUID, client-generated request UUID, and optional fresh foreground coordinates/timezone for place eligibility. Coordinates are transient inputs and are never persisted. Output: next Candidate or a typed exhausted, expired, or rate-limited outcome with retry guidance where applicable. Atomically marks the prior Candidate rerolled and excludes every `template_id` already represented by an Instance with the same `search_id`; the server owns limits and no exclusion table is used.

### `accept_quest`

Input: candidate ID. Output: Active Instance. Locks candidate, checks expiry/ownership, enforces unique Active. Duplicate call is idempotent; existing-active conflict returns that resource.

### `abandon_quest`

Input: Active Instance ID. Output: Abandoned snapshot. No XP. Idempotent for the same terminal state; completed conflict returns terminal error.

### `complete_quest`

Input: Active Instance ID and client-generated UUID idempotency key. Output: completion ID, XP delta, total XP, old/new level. Executes one transaction described in the gamification document.

### Read services

`get_active_quest`, `get_profile_summary`, `list_quest_history(cursor, limit)`, and `get_quest_detail` are owner-scoped RLS reads or safe RPC/views. Page size default 20, max 50.

## Optional/not selected for MVP

- **Maps/place API:** no embedded map is required. Generate the device-map action from curated latitude, longitude, and name; an optional validated HTTPS location URL is override/fallback only. Source/licensing for launch locations is OQ-003.
- **Weather:** post-MVP.
- **Push notifications:** P2; no notification vendor required.
- **AI provider:** explicitly excluded.
- **Analytics/crash vendor:** decision OQ-004; a privacy-conscious vendor or self-hosted/product database events may be chosen before instrumentation.

## Cross-cutting rules

All calls use TLS, authenticated user context, bounded payloads, versioned schemas, server timestamps, and correlation IDs. Do not expose provider internals in user messages. Timeouts are retryable only when the operation is idempotent or the client first refetches state.
