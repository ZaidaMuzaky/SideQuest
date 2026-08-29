# Screen Specifications

All screens respect safe areas, dynamic type, 44×44 pt minimum targets (48×48 dp preferred), loading/empty/error states, and system light/dark theme. Authenticated tab navigation is **Explore / Quests / Profile**.

## S01 Splash / Session Gate

- **Purpose/entry:** app launch; restore session and route.
- **UI/data:** brand mark, non-blocking progress; auth session, profile/onboarding flag, Active Quest summary.
- **States:** timeout offers Retry; offline with cached valid session may open read-only shell; invalid/expired session routes to Auth.
- **Navigation:** replace route only; no back stack.

## S02 Welcome and S03 Sign In / Sign Up

- **Purpose:** explain value and authenticate.
- **Components:** concise value statement; email/password/display-name fields as applicable; password visibility; submit; mode switch.
- **Primary:** Continue / Sign In / Create Account. **Secondary:** switch mode; password recovery is P1 unless required by launch policy.
- **States:** inline validation, submitting, provider/service error, verification notice if enabled. Never reveal whether an unrelated account exists beyond provider-safe messages.

## S04 Onboarding

- **Purpose:** establish defaults without requesting OS permissions.
- **Sections:** value/safety intro; default mood; default time/budget/distance; completion.
- **Primary:** Save and Explore. **Secondary:** Back.
- **Data:** preference enums and `onboarding_completed_at`.
- **States:** local validation; retry on save; preserve selections. Maximum three short steps.

## S05 Explore

- **Purpose:** start discovery within seconds.
- **Sections/components:** compact greeting/progress; Active Quest resume banner when applicable; segmented chips for time, budget, mood, distance; Find button.
- **Primary:** Find a Quest. **Secondary:** resume Active Quest.
- **Data:** preferences, current filters, connectivity, location capability.
- **States:** skeleton; first-use defaults; validation; offline disables search with explanation; permission rationale is presented only after Find.

## S06 Location Permission / Fallback Sheet

- **Purpose:** obtain foreground location or select a safe fallback.
- **Components:** why/when explanation, Continue, Use available Quests, Settings for permanently denied; P1 manual area. Without location, `place` is excluded, `area` requires an already-known eligible area, and `none` remains eligible.
- **States:** requesting, denied, limited/approximate, unavailable, timeout. Dismiss returns to Explore without changing filters.

## S07 Matching

- **Purpose:** communicate brief progress without encouraging screen time.
- **Components:** lightweight animation/reduced-motion static state, selected constraints, Cancel.
- **Data:** search request ID. Timeout/error offers Retry and Edit filters.

## S08 Quest Candidate

- **Purpose:** present one informed choice.
- **Sections:** title, category, short description, fit chips (duration/cost/distance), difficulty, XP, location and availability caveat, numbered instructions, safety note.
- **Primary:** Accept Quest. **Secondary:** Reroll; Edit filters.
- **States:** accepting/rerolling buttons lock against duplicates; server-expired candidate offers Find Another; no P0 countdown is required (visible TTL is P1); no location hides map action; offline preserves display but disables mutation.
- **Navigation:** Back returns to Explore; candidate is not Active.

## S09 No Match / No More Results

- **Purpose:** recover without violating constraints.
- **Components:** reason, suggested explicit relaxations, Edit filters, Retry; never imply user fault.
- **Empty variants:** no catalog in area, all candidates excluded/recent, temporary availability, location unavailable.

## S10 Active Quest

- **Purpose:** guide execution and proof.
- **Sections:** status/progress, title and instructions, metadata, external-map button if relevant, proof card, Complete, Abandon.
- **Data:** authoritative instance, location reference, proof metadata, connectivity.
- **Primary:** Add proof / Complete Quest. **Secondary:** Open Maps, replace proof, Abandon.
- **States:** cached-offline banner; upload progress/retry; stale template does not alter snapshot instructions; completed conflict routes to completion detail.
- **Edge:** only one Active; incomplete proof disables completion with explanation.

## S11 Proof Capture / Review

- **Purpose:** select one photo and optional note.
- **Components:** Camera, Choose photo, preview/remove, note counter, upload.
- **Validation:** JPEG/PNG/HEIC as supported, normalized before upload, configured maximum size, note ≤500 characters.
- **Permission:** camera denial retains picker option; total denial shows Settings. Upload failure keeps local preview for the current session and offers Retry.

## S12 Abandon Confirmation

- **Purpose:** prevent accidental loss.
- **Components:** consequence text, Keep Quest (default), Abandon Quest (destructive). Loading prevents double submit; failure returns to Active with message.

## S13 Completion Celebration

- **Purpose:** confirm immutable result and progress.
- **Sections:** completed title, XP gained, level progress, optional level-up treatment.
- **Primary:** Find Another Quest. **Secondary:** View History.
- **States:** reduced-motion alternative; re-entry renders existing completion without replaying reward mutation.

## S14 Quests / History and S15 Quest Detail

- **Purpose:** resume Active or review history.
- **Components:** Active card pinned; Completed/Abandoned filters; paginated cards; detail snapshot and proof thumbnail.
- **States:** skeleton, no history, pagination retry, offline cached subset. Proof uses signed URL and accessible alternative text supplied by the user note or generic label.

## S16 Profile / Settings

- **Purpose:** identity, progress, preferences, privacy, account controls.
- **Sections:** avatar/name; level and XP; completed/category stats; edit preferences; privacy/help; sign out; delete account.
- **States:** partial statistic failure does not hide identity; sign-out confirmation when a local upload is pending; account deletion requires re-authentication/explicit confirmation.

## S17 Generic Blocking Error / Session Expired

- **Purpose:** consistent recovery.
- **Components:** plain-language message, Retry, Sign In when required, correlation ID copy action. No stack traces or sensitive payloads.
