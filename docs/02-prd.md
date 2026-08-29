# SideQuest Product Requirements Document

Status: Draft for approval  
Release: MVP

## Background and problem statement

Spontaneous free time is frequently lost to indecision. Place directories expose too many options and leave users to construct the activity themselves. SideQuest must convert immediate constraints into a small, safe, real-world action with a visible ending and reward.

## Goals and success criteria

1. A signed-in, onboarded user can receive a matching Quest in seconds.
2. A user can maintain at most one Active Quest and recover it after interruption.
3. A user can submit photo proof, complete once, and receive XP exactly once.
4. The product records enough privacy-conscious analytics to measure the core funnel.

Success metrics and initial targets are defined in [01-product-brief.md](01-product-brief.md) and event semantics in [20-analytics.md](20-analytics.md).

## User needs

- “Give me something that fits my time, money, mood, and mobility.”
- “Tell me exactly what to do without requiring lengthy planning.”
- “Let me safely resume if I close the app or lose connectivity.”
- “Show that my completed exploration adds up to progress.”
- “Do not expose my precise location or proof photos.”

## Core experience

1. User authenticates and completes short onboarding.
2. Explore shows four required context selectors with sensible defaults.
3. Find Quest obtains foreground location only when needed and permitted.
4. Server returns one eligible Quest Instance from curated templates.
5. User accepts or rerolls the candidate.
6. Accepted Quest becomes the sole Active Quest.
7. User follows instructions, submits one photo plus optional note, and requests completion.
8. Server atomically completes the Quest and awards XP.
9. Celebration displays level progress and routes to history or Explore.

## MVP features

### Authentication and onboarding

Email/password sign-up, sign-in, sign-out, session recovery, display name, optional avatar, and lightweight preference defaults. Email verification policy is an open launch decision (OQ-001).

### Discovery and matching

Required inputs: time (30 minutes, 1 hour, 2 hours, half day), budget (free, ≤Rp50,000, ≤Rp100,000, flexible), mood (Chill, Food, Explore, Active, Creative, Random), and distance (walking, ≤3 km, ≤10 km, flexible). Walking distance is a 1 km estimate. “Random” means any eligible seeded category, not a stored Quest category and not unsafe or unconstrained content.

### Quest lifecycle

Candidate, Active, Completed, Abandoned, and Expired states are defined in [09-quest-system.md](09-quest-system.md). Candidates may be rerolled. Accept is server-authoritative and enforces one Active Quest.

### Proof and completion

MVP proof is one image and an optional note. Upload success is required before completion. Proof is private to its owner. Completion and XP are one atomic, idempotent server operation.

### Progress and profile

Show total XP, level, progress to next level, completed count, per-category counts, and reverse-chronological Quest history.

## Navigation decision

Use three tabs:

- **Explore:** discovery form and candidate result.
- **Quests:** Active Quest first; otherwise history with completed/abandoned filters.
- **Profile:** identity, progress, statistics, preferences, privacy/account actions, sign-out.

This keeps the Active Quest reachable without adding a dedicated tab.

## Constraints

- React Native, Expo, TypeScript strict mode, Expo Router, NativeWind.
- Supabase Auth, PostgreSQL, Storage, Row Level Security, and server-side RPC/Edge Function only where atomic or privileged behavior requires it.
- No background GPS. Foreground coarse coordinates are ephemeral unless a Quest Instance needs a location reference.
- The MVP requires connectivity for search, acceptance, proof upload, completion, and authoritative progress updates.
- Curated templates must be seeded for each launch area before release.
- The engine remains geography-agnostic; development uses deterministic fixtures and no launch city is hard-coded.
- Default locale is `id-ID`, fallback locale is `en`, and all user-facing copy uses localization keys. A fully bilingual MVP UI is not required.

## Assumptions

- MVP users must be 18+ and consent to location/photo permissions at point of use; final legal copy still requires release review.
- Launch content supports IDR and seeded Indonesian urban areas.
- External turn-by-turn navigation opens the device map app; SideQuest does not render a map SDK in MVP.
- Proof is honor-based; moderation is reactive and operational, not an in-app admin feature.

## Dependencies

Supabase project and policies; Expo build credentials; Apple/Google developer accounts; privacy policy and terms; approved Quest catalog; geocoding/place data strategy (OQ-003); analytics selection (OQ-004).

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sparse local Quest supply | No matches | Launch-area readiness checklist; non-location templates; graceful relax suggestions |
| Unsafe/stale venue content | Harm/trust loss | Curated templates, public-place rules, availability metadata, report/support path |
| Fake or duplicate completions | Inflated XP | One completion per instance, idempotency key, server-awarded XP, rate limits |
| Permission denial | Broken discovery | Exclude `place`; exclude `area` unless an eligible area is already known; keep `none`; manual area selection is P1 |
| Upload/network failures | Lost progress | Persistent Active Quest, retryable uploads, clear pending state |
| Scope expansion | Delayed validation | MoSCoW boundary and backlog traceability |

## Exclusions

Friends, feed, chat, parties, leaderboard, advanced achievements, AR, background tracking, AI generation, ML recommendations, creator/business accounts, sponsorship, marketplace, and a complex admin product.

## Requirements and validation

Normative behavior is in [08-functional-requirements.md](08-functional-requirements.md); P0 scenarios are in [16-acceptance-criteria.md](16-acceptance-criteria.md). The MVP may not ship unless the critical release gate in [17-testing-strategy.md](17-testing-strategy.md) passes.
