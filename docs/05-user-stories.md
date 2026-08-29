# User Stories

Priorities: P0 release-blocking, P1 important, P2 optional. Acceptance-criteria mappings use `AC-*` IDs from [16-acceptance-criteria.md](16-acceptance-criteria.md).

## Authentication and onboarding

| ID | Priority | Story | Acceptance mapping |
|---|---|---|---|
| US-AUTH-001 | P0 | As a new user, I want to create an account so that my Quests and progress persist. | AC-AUTH-001 |
| US-AUTH-002 | P0 | As a returning user, I want to sign in and restore my session so that I can continue where I left off. | AC-AUTH-002 |
| US-AUTH-003 | P0 | As a signed-in user, I want to sign out so that another person cannot access my account. | AC-AUTH-003 |
| US-ONB-001 | P0 | As a new user, I want a short onboarding so that recommendations start with useful defaults. | AC-ONB-001 |
| US-ONB-002 | P1 | As a user, I want to edit my preferences so that defaults reflect my current habits. | AC-PROFILE-002 |

## Discovery and candidate

| ID | Priority | Story | Acceptance mapping |
|---|---|---|---|
| US-DISC-001 | P0 | As a user, I want to specify time, budget, mood, and distance so that a Quest fits my situation. | AC-DISC-001 |
| US-DISC-002 | P0 | As a user without foreground location, I want eligible Quests that do not require it so that discovery still works safely. | AC-PERM-001 |
| US-MATCH-001 | P0 | As a user, I want one eligible Quest quickly so that I act instead of browsing. | AC-MATCH-001, AC-MATCH-002 |
| US-MATCH-002 | P0 | As a user, I want an honest no-match recovery so that constraints are never silently violated. | AC-MATCH-003 |
| US-CAND-001 | P0 | As a user, I want complete Quest details so that I can make an informed acceptance decision. | AC-CAND-001 |
| US-CAND-002 | P0 | As a user, I want to reroll so that I can reject a candidate without changing all filters. | AC-REROLL-001 |

## Quest execution

| ID | Priority | Story | Acceptance mapping |
|---|---|---|---|
| US-QUEST-001 | P0 | As a user, I want to accept a Quest so that it becomes my current objective. | AC-QUEST-001 |
| US-QUEST-002 | P0 | As a user, I want only one Active Quest so that my progress is unambiguous. | AC-QUEST-002 |
| US-QUEST-003 | P0 | As a user, I want my Active Quest restored after app restart so that interruption does not lose it. | AC-QUEST-003 |
| US-QUEST-004 | P0 | As a user, I want to open a relevant location in my map app so that I can navigate there. | AC-QUEST-004 |
| US-QUEST-005 | P0 | As a user, I want to abandon a Quest with confirmation so that I can stop safely without earning XP. | AC-QUEST-005 |

## Proof, completion, and progress

| ID | Priority | Story | Acceptance mapping |
|---|---|---|---|
| US-PROOF-001 | P0 | As a user, I want to attach a photo and optional note so that I can record completion evidence. | AC-PROOF-001 |
| US-PROOF-002 | P0 | As a user, I want failed uploads to be retryable so that network issues do not erase my Quest. | AC-PROOF-002 |
| US-COMP-001 | P0 | As a user, I want completion to award XP once so that progress is reliable. | AC-COMP-001, AC-COMP-002 |
| US-COMP-002 | P0 | As a user, I want a completion celebration and level progress so that the achievement feels meaningful. | AC-COMP-003 |
| US-PROG-001 | P0 | As a user, I want to see total XP, level, completed count, and category stats so that I understand my exploration. | AC-PROFILE-001 |
| US-HIST-001 | P0 | As a user, I want a chronological history so that I can revisit past Quests. | AC-HIST-001 |

## Reliability, privacy, and optional value

| ID | Priority | Story | Acceptance mapping |
|---|---|---|---|
| US-REL-001 | P0 | As a user, I want clear offline and expired-session recovery so that failures are understandable. | AC-REL-001, AC-REL-002 |
| US-PRIV-001 | P0 | As a user, I want proof and location data private so that using the app does not expose sensitive activity. | AC-PRIV-001 |
| US-ACC-001 | P0 | As an assistive-technology user, I want core actions labeled and operable so that I can complete the loop. | AC-ACC-001 |
| US-AVATAR-001 | P1 | As a user, I want an avatar so that my profile feels personal. | AC-PROFILE-003 |
| US-REPORT-001 | P1 | As a user, I want to flag an unavailable or unsafe Quest so that I can recover and improve catalog quality. | AC-REPORT-001 |
| US-STREAK-001 | P2 | As a returning user, I want a simple streak so that regular exploration is visible. | Deferred |
