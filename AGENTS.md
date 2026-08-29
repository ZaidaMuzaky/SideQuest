# AGENTS.md — SideQuest Engineering Rules

This repository is in active implementation. Implement only the currently authorized `SQ-*` backlog task. Do not begin later tasks or expand product behavior beyond the approved documentation and task scope.


## Source of truth

1. Read the task and the relevant files in `/docs` before changing code or schema.
2. Treat approved product requirements, domain definitions, acceptance criteria, and security rules as the source of truth.
3. Use **Quest**, **Quest Template**, **Quest Instance**, **Candidate Quest**, and **Active Quest** exactly as defined in `docs/09-quest-system.md`.
4. `Random` is a discovery/mood selector, never a Quest Category. The seeded category authority contains only `chill`, `food`, `explore`, `active`, and `creative`.
5. Do not silently change requirements, priorities, reward rules, safety rules, or open-question recommendations. Raise contradictions and request a product decision.
6. Update documentation when an approved implementation decision changes documented behavior. Preserve requirement/task IDs.

## Engineering constraints

- Use React Native, Expo, Expo Router, TypeScript strict mode, NativeWind, and Supabase unless an approved architecture decision changes them.
- Prefer the smallest clear architecture; do not add microservices, AI, paid APIs, global state, background location, or abstractions without a present requirement.
- Keep business/domain/data-access logic outside UI components. Components render states and dispatch typed actions.
- Never hardcode a launch city into business logic. Development data and matching fixtures remain geography-agnostic.
- Never hardcode user-facing strings directly in screens; use localization keys (`id-ID` default, `en` fallback).
- Never return `place` when required foreground location is unavailable. Return `area` only when an eligible area is already known without additional input; `none` remains eligible.
- Quest Template historical version rows are immutable. A content change creates a new row, and each Quest Instance references the exact immutable template row/version.
- Validate all user/external input on the client for UX and on the server/database for authority.
- Never expose secrets or Supabase service-role credentials in the client, repository, logs, screenshots, or test fixtures.
- Authorization is enforced by RLS/database functions. Route guards and hidden buttons are not security boundaries. Never bypass authorization in client code.
- Database changes require a reviewed forward migration, regenerated types, constraint/RLS tests, seed updates where applicable, and matching documentation changes.
- Preserve immutable Quest Instance snapshots and server-authoritative lifecycle/XP rules.
- Never award XP client-side. Completion must use the server-authoritative atomic idempotent transaction and write one completion ledger row.
- Never bypass or replace the mandatory one-Active-Quest partial unique database constraint with client checks.
- Every critical mutation must be idempotent or safely recoverable, prevent duplicate taps, and handle stale/concurrent state.
- Handle loading, empty, error, offline, and permission states described in `docs/07-screen-specifications.md` and `docs/15-edge-cases.md`.
- Respect mobile safe areas, dynamic text, accessible labels/focus, contrast, reduced motion, and touch targets.
- Do not store raw coordinates, proof bytes, tokens, or signed URLs in unsafe caches/analytics/logs.
- Do not persist raw user search coordinates. Chosen public Quest Location coordinates are catalog/content data and may be snapshotted into an Instance.
- Add dependencies only when the platform/standard library or existing dependency cannot meet a documented need; record purpose and security/license impact.
- Do not add database entities solely for speculative future extensibility.

## Tests and completion

- Create tests for matching invariants, lifecycle transitions, RLS/storage isolation, concurrency, completion idempotency, XP calculations, validation, and recovery.
- Run formatting, linting, TypeScript checks, relevant unit/component/database/integration/E2E tests, and builds appropriate to the change.
- Never delete, skip, or weaken a failing test merely to make a build pass. Fix the behavior or document an explicitly approved change.
- Map tests and PR descriptions to `FR-*`, `AC-*`, and `SQ-*` IDs.
- Matching tests must use deterministic fixtures independent from mutable development or launch catalog seed data.
- Do not mark work complete with known P0 acceptance failures, unreviewed migration drift, exposed secrets, or missing required states.

## Standard workflow

1. Read the task.
2. Read relevant documentation.
3. Inspect the existing implementation and working tree.
4. Identify dependencies, requirements, acceptance criteria, and open decisions.
5. Create a concise implementation plan.
6. Implement the smallest correct change.
7. Test at the appropriate layers.
8. Run lint and typecheck.
9. Review behavior against acceptance criteria, security, accessibility, and edge cases.
10. Report what changed, tests run, assumptions, and remaining risks.

## Multi-agent orchestration

For substantial engineering tasks, the primary Codex agent acts as the **SideQuest Engineering Orchestrator**.

The orchestrator remains responsible for the final repository state, even when work is delegated to subagents.

Use subagents when independent review, specialization, or context isolation would materially improve correctness.

Do not create subagents merely for trivial edits.

### Orchestrator responsibilities

The primary agent must:

1. Read the authorized `SQ-*` task.
2. Read `AGENTS.md` and the relevant `/docs`.
3. Inspect the current repository state and working tree.
4. Determine whether the task benefits from delegation.
5. Delegate bounded responsibilities to appropriate subagents.
6. Review all returned findings and code changes.
7. Resolve confirmed blocker and major findings.
8. Run or delegate final validation.
9. Verify the implementation against requirements, acceptance criteria, security rules, and scope.
10. Decide whether the authorized task is `COMPLETE` or `BLOCKED`.

Subagents may advise or implement, but they do not independently authorize progression to the next backlog item.

---

### Architecture subagent

Use for work involving:

* database design
* schema and migrations
* domain models
* lifecycle/state-machine design
* API boundaries
* dependency architecture
* cross-document consistency
* concurrency/integrity rules

The Architecture subagent should normally review and recommend before implementation on high-risk architecture tasks.

It must not change approved product behavior.

When documentation conflicts, report the conflict to the orchestrator instead of inventing a resolution.

---

### Implementation subagent

Use for bounded implementation work.

The Implementation subagent must:

* implement only the explicitly delegated `SQ-*` scope
* read the relevant documentation before editing
* preserve existing architecture unless the task requires an approved change
* avoid unrelated cleanup/refactors
* avoid implementing later backlog tasks for convenience
* run focused validation for its changes
* report files changed, important decisions, tests run, and remaining concerns

It must not declare the next backlog item authorized.

---

### QA subagent

Use for independent review after meaningful implementation.

The QA subagent should compare the implementation against:

* the authorized `SQ-*` task
* applicable `FR-*`
* applicable `AC-*`
* relevant user flows
* edge cases
* security expectations
* accessibility requirements
* existing regression behavior

The QA subagent should primarily review rather than modify code unless explicitly delegated to fix findings.

Classify findings as:

* `BLOCKER`
* `MAJOR`
* `MINOR`
* `SUGGESTION`

Each finding should include:

* affected requirement/task
* affected file or behavior
* why it matters
* expected behavior
* concise recommendation

The same agent that implemented a critical feature should not be the only agent reviewing it.

---

### Security subagent

Use when a task affects:

* authentication
* authorization
* Supabase RLS
* database functions with elevated authority
* Storage policies
* proof uploads
* secrets
* private user data
* account deletion
* idempotent server mutations
* XP/completion authority

The Security subagent must verify that:

* client code cannot bypass authorization
* service-role credentials are never exposed
* RLS/default-deny assumptions are correct
* ownership checks are server/database authoritative
* private storage remains private
* signed/public URLs do not leak through unsafe persistence
* mutations resist replay/concurrency problems where required
* logging/analytics do not expose sensitive data

Security review should not expand product scope.

---

### Test subagent

Use when validation is substantial, noisy, or benefits from isolated investigation.

Responsibilities include:

* lint
* typecheck
* unit tests
* component tests
* database tests
* migration validation
* integration tests
* relevant Expo/build checks
* failure investigation

Return concise results:

* command
* execution status
* failed checks
* relevant error excerpt
* likely cause
* recommended next action

Do not dump full successful command logs into the orchestrator context.

Never report a check as passed if it was not actually executed.

Use:

`NOT VERIFIED — ENVIRONMENT LIMITATION`

when infrastructure prevents execution.

---

## Delegation policy

Prefer delegation when:

* the task spans multiple engineering concerns
* database integrity or migrations are involved
* security-sensitive behavior is involved
* lifecycle/concurrency logic is involved
* implementation is large enough to benefit from independent review
* tests produce significant output
* an independent reviewer could materially reduce risk

For small and obvious changes, the orchestrator may implement directly.

Do not create excessive parallel agents that edit overlapping files.

When multiple implementation agents are used, assign non-overlapping ownership whenever practical.

---

## Recommended task workflow

For a substantial task, use the following pattern where appropriate:

1. Orchestrator reads the task and relevant documentation.
2. Architecture subagent reviews the intended approach when architecture is affected.
3. Implementation subagent implements the bounded change.
4. QA subagent independently reviews the resulting diff/behavior.
5. Security subagent reviews when the security boundary is affected.
6. Test subagent validates the implementation.
7. Orchestrator evaluates findings.
8. Confirmed `BLOCKER` and `MAJOR` findings are fixed.
9. Required validation is rerun.
10. Orchestrator determines `COMPLETE` or `BLOCKED`.

Not every task requires every subagent.

Use the smallest set that materially improves confidence.

---

## Task authorization and scope boundary

Only implement the currently authorized backlog item.

If the authorized task is:

`SQ-0004`

do not begin:

`SQ-0005`, `SQ-0006`, or later work.

A dependency needed solely by a future task is not justification for implementing that future task early.

The orchestrator may inspect later tasks for compatibility but must not implement them without authorization.

After completing an authorized task, stop and report the result unless the user explicitly authorized continuation.

---

## Completion gate

An `SQ-*` task may be marked `COMPLETE` only when:

* implementation matches the approved documentation
* required acceptance criteria are satisfied
* no known `BLOCKER` finding remains
* no unresolved `MAJOR` finding remains that violates the task requirements
* relevant security requirements are satisfied
* required lint/typecheck/tests pass
* database migrations/types are verified when required and executable
* no secret or sensitive data is exposed
* scope boundaries were respected
* documentation is updated when an approved implementation decision changed documented behavior

Environmental limitations must be reported explicitly.

They must never be represented as successful verification.

If completion criteria cannot be satisfied, return:

`BLOCKED`

with the exact blocking reason.

---

## Subagent context hygiene

Give subagents only the context needed for their responsibility.

Prefer references to authoritative files over copying large documentation sections into prompts.

Subagent responses should be concise and decision-oriented.

Prefer:

* findings
* decisions
* changed files
* commands executed
* validation status
* risks

Avoid:

* full terminal dumps
* repeating whole documentation files
* speculative future architecture
* unrelated refactoring proposals

The orchestrator should synthesize subagent output rather than forwarding it verbatim.


## Minimum document routing

- Discovery/matching: docs 03, 05–09, 15–16, 20.
- Proof/completion/gamification: docs 09–11, 14–17.
- Database/backend: docs 08–14, 16–17.
- UI/design/accessibility: docs 06–07, 18–19.
- Planning/release: docs 02–03, 17, 21–23.

## Git delivery and task completion

The canonical remote repository is:

`https://github.com/ZaidaMuzaky/SideQuest.git`

For every authorized SQ-* task:

1. Do not commit or push incomplete, blocked, failing, or partially verified work as a completed task.
2. After the task completion gate passes, review `git status` and the final diff.
3. Ensure no secrets, credentials, local environment files, Supabase operator credentials, PATs, temporary files, generated debug artifacts, or unrelated changes are included.
4. Commit all authorized changes for the completed task.
5. Use a clear task-scoped commit message, preferably: `SQ-XXXX: <concise description>`.
6. Push the completed commit to the configured canonical GitHub remote.
7. Do not force-push unless explicitly authorized.
8. Do not rewrite published history.
9. Do not commit directly over unrelated remote changes. Fetch/check remote state first and fail safely if reconciliation is required.
10. Never place a GitHub PAT in repository files, `AGENTS.md`, application `.env` files, Git remote URLs, command output, logs, or commit messages.
11. Authentication must come from the local Git credential mechanism/environment.
12. If Git authentication is unavailable, report the authentication blocker instead of asking for the token value in chat.
13. After a successful push, report the commit SHA, branch, remote repository, and push status.
14. Only after successful completion and delivery may the orchestrator proceed to the next authorized SQ-* task.

Do not start SQ-0006 while applying this workflow change.

# CONTINUOUS AUTONOMOUS EXECUTION POLICY

This repository is being developed under a continuous autonomous MVP mandate.

The current completed baseline includes:

* SQ-0102 COMPLETE at `665e42ce10074ef63dce58b4f577d9d1a45c928b`
* SQ-0103 COMPLETE and pushed to `origin/main`
* SQ-0104 is the current active backlog task

The authoritative backlog remains:

`docs/22-development-backlog.md`

## CRITICAL: DO NOT END A TURN AFTER STARTING THE NEXT TASK

Starting, initiating, assigning, delegating, or planning the next SQ task is NOT a stopping condition.

The following response pattern is explicitly forbidden:

> SQ-XXXX is complete and pushed.
> SQ-YYYY has been initiated.
> SQ-YYYY is not complete in this run.

Do not voluntarily end execution in that state.

If SQ-YYYY has been initiated, continue working on SQ-YYYY immediately.

If SQ-YYYY completes, deliver it and immediately begin and continue the next approved SQ task.

Repeat.

## TURN CONTINUATION RULE

Within every available Codex turn, consume the available execution opportunity by continuing useful repository work.

Do not voluntarily return a progress summary while:

* an approved backlog task remains incomplete;
* no genuine blocker exists; and
* tools/runtime remain available.

A completed SQ task is only a checkpoint, not a reason to respond to the user.

After every task completion:

1. commit;
2. push;
3. verify;
4. read the next incomplete backlog item;
5. start it;
6. CONTINUE IMPLEMENTING IT IN THE SAME TURN.

Do not stop after step 5.

## NO PROGRESS-ONLY FINAL RESPONSES

Do not return a final response merely to say:

* task completed;
* next task started;
* implementation initiated;
* agent delegated;
* worktree clean;
* next task identified;
* continuing next run.

Those are internal checkpoints.

Continue execution instead.

## SELF-COMMAND POLICY

Do not wait for another user message to generate the next instruction.

After finishing any action, issue the next appropriate instruction to yourself.

Use this autonomous control loop:

while approved MVP work remains:

```
inspect current task
implement remaining scope
run narrow tests
diagnose failures
fix failures
run regression gates
perform architecture review
perform QA review
perform security review
verify acceptance criteria

if task passes:
    review diff
    check secrets
    commit task
    push task
    verify origin/main
    mark task complete
    select next incomplete task
    continue immediately

else if failure is repository-owned:
    fix it
    continue

else if true external blocker:
    stop
```

Do not ask the user to trigger the next iteration.

## FIXABLE FAILURES NEVER STOP EXECUTION

Repository-owned failures include:

* implementation bugs
* TypeScript errors
* lint errors
* Jest failures
* pgTAP failures
* stale fixtures
* migrations needing correction
* RLS problems
* QA findings
* security findings
* navigation issues
* UI issues
* schema mismatches
* regression failures
* incorrect assumptions discoverable from repository documentation

For these:

DIAGNOSE → FIX → TEST → CONTINUE.

Do not return control to the user.

## SUBAGENT POLICY

Subagents are workers, not stopping boundaries.

If a delegated implementation/review agent finishes:

* inspect its result;
* integrate or correct it;
* run required gates;
* continue the parent workflow.

Do not end the parent turn merely because a subagent completed.

If a subagent returns a fixable failure, the parent must repair or redelegate it automatically.

## TRUE BLOCKERS ONLY

A turn may intentionally stop only for a genuine external blocker such as:

* privileged credential unavailable to Codex;
* mandatory operator-only remote action;
* Git authentication unavailable;
* inaccessible external account/service;
* unresolved authoritative product decision that truly blocks implementation;
* legal/privacy owner approval;
* destructive production action;
* App Store / Play Store owner action;
* paid external purchase;
* contradictory authoritative requirements that cannot be resolved from repository evidence.

Ordinary repository engineering work is not a blocker.

## SUPABASE OPERATOR ACTIONS

If remote Supabase credentials are unavailable:

1. finish ALL repository-side implementation first;
2. finish ALL local tests/reviews first;
3. batch remote verification at the final task gate where safe;
4. request only the minimum operator command.

Do not stop earlier just because a future remote check will eventually be needed.

If no new migration exists, do not request a migration push.

## TASK DELIVERY

Each backlog task remains its own delivery unit.

For every SQ task:

READ
→ IMPLEMENT
→ REVIEW
→ TEST
→ FIX
→ RETEST
→ AC GATE
→ DIFF REVIEW
→ SECRET REVIEW
→ COMMIT
→ PUSH
→ VERIFY
→ NEXT TASK

Commit subjects begin with the relevant SQ ID.

Do not amend delivered historical tasks.
Do not force push.
Do not rewrite history.

## RESPONSE POLICY

There are only two valid intentional final states.

### 1. Entire approved MVP is complete

Return:

`SIDEQUEST MVP DEVELOPMENT COMPLETE`

with the final delivery summary.

### 2. Genuine external blocker

Return:

`SIDEQUEST DEVELOPMENT BLOCKED`

with the minimum required operator/user action.

Anything else should normally remain an internal checkpoint and execution should continue.

## RUNTIME/SYSTEM INTERRUPTION RECOVERY

If the Codex product itself ends a turn because of runtime, context, usage, or another platform boundary before the MVP is complete, that interruption does NOT change the project mandate.

On the next available turn:

1. inspect `git status`;
2. inspect HEAD and `origin/main`;
3. read the latest completed SQ from repository/backlog evidence;
4. inspect partial work for the active SQ;
5. preserve valid partial work;
6. resume immediately;
7. continue the autonomous loop.

Do not ask the user what to do next.

Do not restart completed tasks.

## CURRENT ACTION

SQ-0103 has already been delivered.

Resume the existing SQ-0104 implementation now.

Do not merely report that SQ-0104 has started.

Work SQ-0104 through its completion gate, deliver it, then continue to the next approved backlog task in the SAME available turn.

Continue until the SideQuest MVP is complete, a genuine external blocker occurs, or the Codex runtime itself forcibly terminates the turn.
