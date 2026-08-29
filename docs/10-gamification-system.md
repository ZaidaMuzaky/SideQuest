# Gamification System

## Objectives

Reward completed real-world exploration, make cumulative progress understandable, and avoid coercive or monetary mechanics.

## XP

- Each Quest Instance snapshots a server-approved `base_xp` from 50–200.
- Difficulty guidance: Easy 75, Medium 100, Hard 150; templates may vary within bounds based on duration/effort.
- MVP completion XP = base XP. Recommended P1 bonuses: first-ever completion +25 once; first completion in a new category +15 once.
- Abandoned, expired, candidate, and rerolled Quests award zero.
- XP has no cash value, cannot be purchased/transferred, and never decreases in MVP except an audited administrative correction.

## Levels

Level is derived from lifetime XP using a simple increasing threshold:

`xp_required_to_reach_level(L) = 100 × (L - 1) × L / 2`, for level `L ≥ 1`.

Examples: Level 1 starts at 0 XP; L2 at 100; L3 at 300; L4 at 600; L5 at 1,000. Store lifetime XP and current level for efficient reads, but validate level from the same shared/server function. UI shows XP within the current level and the next threshold.

## Completion transaction

The database transaction locks the Active Instance and progress row, verifies proof and ownership, inserts the unique completion, calculates the total approved XP (including any P1 bonus), writes exactly one immutable `quest_completion` XP ledger entry, updates lifetime totals/level/completed count, and returns the delta. A unique instance completion and idempotency key prevent double reward. `quest_completions` proves completion, `xp_ledger` audits the award, and `user_progress` is a rebuildable transactional cache.

## Presentation

Celebration shows Quest title, XP gained, progress bar, and level-up if applicable. Motion is brief and skippable; reduced-motion uses a static transition. Do not use loss aversion, countdown pressure, or shame language.

## Anti-abuse

- Server authority; no client-submitted reward amount.
- Unique completion per Quest Instance and unique XP ledger source.
- Search/accept/complete rate limits and anomaly logging.
- Proof object ownership/path validation and metadata sanitization.
- Configurable per-day completion anomaly threshold triggers review/logging, not automatic punishment in MVP.
- Deleting/re-uploading proof cannot re-award XP.

## Streak decision

Streaks are P2 and excluded from the base schema/UI unless approved. They add timezone, grace-period, and coercion complexity without proving the core loop.
