# P0 Acceptance Criteria

Every P0 story in [05-user-stories.md](05-user-stories.md) maps here.

## Authentication/onboarding

- **AC-AUTH-001:** Given valid unused credentials and display name, when Sign Up succeeds, then an auth user, profile, progress row, and preferences are created without exposing privileged keys; invalid input creates none.
- **AC-AUTH-002:** Given a valid persisted session, when the app relaunches, then it routes to onboarding or authenticated tabs as appropriate; an invalid session routes to Sign In.
- **AC-AUTH-003:** Given a signed-in user, when Sign Out succeeds, then tokens and protected cache are cleared and authenticated routes cannot be revisited via Back.
- **AC-ONB-001:** Given a new account, when valid defaults are saved, then `onboarding_completed_at` is set once and Explore opens with those defaults; a failed save preserves selections and offers Retry.

## Discovery/candidate

- **AC-DISC-001:** Given any allowed selection combination, when Find is tapped, then the request contains exactly one valid time, budget, mood, and distance value and invalid/missing values block submission.
- **AC-PERM-001:** Given foreground location is unavailable, when matching runs, then `place` is excluded, `area` is excluded unless an eligible area was already known without new input, `none` remains eligible, and the app does not loop permission prompts.
- **AC-MATCH-001:** Given eligible catalog supply, when matching succeeds, then duration, `estimated_cost_max` in `IDR`, seeded category, distance, availability, and safety fields satisfy constraints; Random may select any enabled seeded category but is never stored as one.
- **AC-MATCH-002:** Given a successful match, when the response is persisted, then exactly one Candidate Instance exists with a versioned immutable snapshot and no Active Quest or XP change is created.
- **AC-MATCH-003:** Given no eligible template, when matching completes, then a typed no-match state and explicit relaxation suggestions appear and no constraint is silently expanded.
- **AC-CAND-001:** Given a Candidate, then title, description, category, duration, cost, distance where relevant, difficulty, XP, location where relevant, instructions, safety/physical-demand text, Accept, and Reroll are available accessibly.
- **AC-REROLL-001:** Given a valid Candidate, when Reroll succeeds, then it becomes rerolled with the documented reason, every template already represented under the same search is excluded, no XP is awarded, and another valid candidate or exhausted state appears.

## Quest execution

- **AC-QUEST-001:** Given an unexpired owned Candidate and no Active Quest, when Accept is called, then it becomes Active once and the Active screen displays its snapshot.
- **AC-QUEST-002:** Given an existing Active Quest, when any second Candidate is accepted concurrently, then the database stores only one Active and the client opens the existing one.
- **AC-QUEST-003:** Given an Active Quest, when the app restarts or reconnects, then the same authoritative instance and registered proof state are restored.
- **AC-QUEST-004:** Given a valid location Quest, when Open Maps is activated, then an allowlisted external navigation URI for the snapshotted public location opens; a non-location Quest shows no map dependency.
- **AC-QUEST-005:** Given an Active Quest, when Abandon is confirmed, then it becomes Abandoned once, awards zero XP, and leaves no Active Quest; cancel changes nothing.
- **AC-QUEST-006:** Given an Active Quest, when ordinary estimated duration passes, then it remains Active; only explicit availability expiry or safety disable may transition it to Expired with the corresponding reason/timestamp.

## Proof/completion/progress

- **AC-PROOF-001:** Given an Active owned Quest, when one valid camera or system-picker image and optional ≤500-character note upload/register successfully, then exactly one private proof is associated and may be replaced before completion; the app makes no strong identity/location verification claim.
- **AC-PROOF-002:** Given an upload failure, then the Quest remains Active, no completion/XP occurs, and Retry/replace is available without duplicate proof records.
- **AC-COMP-001:** Given an Active owned Quest with valid proof, when Complete succeeds, then one transaction creates one completion/ledger entry, transitions to Completed, and updates XP/level/count.
- **AC-COMP-002:** Given the same completion is submitted twice or response is lost, when retried with the same idempotency key (or same instance), then the original result is returned and totals change once.
- **AC-COMP-003:** Given successful completion, then celebration shows authoritative XP delta and level progress; reduced-motion users receive an equivalent static state.
- **AC-PROFILE-001:** Given known completions, when Profile loads, then lifetime XP, computed level, next threshold, completion count, and per-category counts equal authoritative records.
- **AC-HIST-001:** Given completed/abandoned Quests, when History loads, then owner-only snapshot records appear newest-first with stable pagination and an appropriate empty state.
- **AC-PROFILE-002 (P1):** Given saved preferences, when valid edits are submitted, then future Explore defaults use them and current Active Quest snapshots remain unchanged.
- **AC-PROFILE-003 (P1):** Given a valid avatar image, when replacement succeeds, then only the owner can read it and the prior object is scheduled for deletion.
- **AC-REPORT-001 (P1):** Given an Active/Candidate Quest that appears unsafe or unavailable, when the user reports it, then a bounded reason is recorded, the user can safely abandon/reroll, and no proof or precise user location is included.

## Reliability/privacy/accessibility

- **AC-REL-001:** Given offline state on a critical mutation, then it is not optimistically committed; the UI explains reconnect/retry and refetches before mutation.
- **AC-REL-002:** Given session expiry during a protected action, then no protected data leaks, sign-in is requested, and authoritative Quest state can resume afterward.
- **AC-PRIV-001:** Given two users and private proofs/history, when either attempts cross-user database/storage access, then RLS/storage policy denies it; analytics/logs contain no proof, note, raw coordinate, or token.
- **AC-ACC-001:** Given screen reader, 200% text, reduced motion, and non-color perception checks, then all core-loop content/actions remain labeled, reachable, understandable, and operable with target sizes meeting policy.
