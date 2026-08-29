# MVP Scope

This document is the scope-control authority. Priority meanings: **Must/P0** is release-blocking; **Should/P1** is valuable but removable; **Could/P2** is explicitly optional.

## Must Have (P0)

- Email/password sign-up, sign-in, sign-out, and persisted session.
- Basic profile with display name; optional avatar may use a generated placeholder.
- Short onboarding capturing default mood and discovery preferences; users can edit them later.
- Explore selectors for time, budget, mood, and distance.
- Foreground location permission flow. When location is unavailable, exclude `place`, exclude `area` unless an eligible area is already known without new input, and keep `none` Quests eligible.
- Deterministic matching from curated, enabled Quest Templates.
- Candidate Quest result with all specified metadata, Accept, and Reroll.
- Server-enforced maximum of one Active Quest per user.
- Active Quest recovery, instructions, external-map action where relevant, abandon action.
- Exactly one private image proof from camera or system image picker, plus optional note. Picker remains usable if camera is denied; if neither is available, completion is blocked with Settings guidance.
- Atomic, idempotent completion and XP award.
- XP, level, progress, completed count, category statistics, and Quest history.
- Loading, empty, error, permission-denied, and offline handling on critical paths.
- Supabase RLS, private proof storage, validation, observability, and core analytics.
- Accessibility baseline and light/dark system theme.
- `id-ID` default locale, `en` fallback, localization keys for all user-facing strings, and an 18+ onboarding/legal gate.

## Should Have (P1)

- Optional avatar upload.
- Visible Candidate TTL countdown / “expires in…” indicator. Backend 30-minute TTL enforcement remains P0.
- Manual neighborhood/area selection when location is denied.
- Basic in-app “Quest unavailable/unsafe” reporting link or form.
- Shareable completion card without proof/location data.
- Simple first-completion and category-diversity bonuses, only if they remain server-authoritative.

## Could Have (P2)

- Simple daily completion streak.
- Local notification reminder for an accepted Quest.
- Saved filter presets.
- Candidate list fallback showing up to three alternatives.

## Not in MVP

- Guest completion or anonymous XP.
- Friends, feed, chat, parties, leaderboards, public profiles.
- Complex achievements, currencies, inventory, marketplace, rewards with monetary value.
- In-app turn-by-turn maps, background GPS, continuous route tracking.
- AI-generated Quests or advanced recommendation ML.
- Automated computer-vision proof verification.
- Creator/business accounts, sponsored Quests, public content submission.
- AR, city-wide campaigns, seasonal live operations.
- Full administration application; seed scripts/database tooling are sufficient.

## Scope-change rule

Any addition requires an explicit product decision, updated requirements and acceptance criteria, security/privacy review, and backlog estimate. “Architectural extensibility” alone does not justify implementing post-MVP behavior.
