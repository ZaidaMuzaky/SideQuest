# Edge Cases and Expected Behavior

| ID | Scenario | Expected behavior |
|---|---|---|
| EC-001 | Location denied once/permanently | Explain impact; exclude `place`; exclude `area` unless eligible area is already known; keep `none`; show Settings only when appropriate and do not loop prompts. |
| EC-002 | Approximate/stale/inaccurate location | Accept if within configured accuracy/freshness; otherwise retry or fallback; never claim exact distance. |
| EC-003 | Camera denied | Offer system photo picker. If both unavailable, explain that proof is required and link Settings. |
| EC-004 | No nearby/matching Quest | Return typed reason and explicit filter edits; never exceed budget/radius/time silently. |
| EC-005 | Repeated rerolls | Exclude prior session templates; return exhausted state; enforce rate limit with retry time. |
| EC-006 | Existing Active Quest during search/accept | Show resume banner; accept conflict routes to existing Active; no second Active row. |
| EC-007 | Candidate exceeds server 30-minute TTL before accept | Reject transition with `candidate_expired`, preserve filters, offer new match; no P0 countdown is assumed. |
| EC-008 | App closes during Active Quest | Restore authoritative Active snapshot and proof metadata on next launch. |
| EC-009 | Network lost while viewing | Keep cached screen with stale/offline banner; disable authoritative actions. |
| EC-010 | Network fails after mutation request | Refetch before retry; idempotency/unique constraints return original outcome. |
| EC-011 | Photo upload fails/interrupted | Quest remains Active; show progress/error; retry or replace; clean orphan object. |
| EC-012 | Local photo URI disappears | Ask user to choose/take photo again; do not mark proof uploaded. |
| EC-013 | Invalid/oversize/malicious file | Reject safely with accepted format/size guidance; log safe reason. |
| EC-014 | Quest location closes or feels unsafe | User can abandon without penalty and use report/support path; disable catalog location operationally. |
| EC-015 | User moves after generation | Snapshot remains valid; show distance as estimate; user may abandon. No background rematching. |
| EC-016 | Duplicate completion/tap/retry | One completion and ledger entry; return original result; celebration may re-render but XP is not repeated. |
| EC-017 | Completion arrives after abandonment/expiry | Reject terminal transition; refetch and show actual state. |
| EC-018 | Proof deleted/replaced during completion race | Transaction locks/validates current uploaded proof; fail without XP if invalid. |
| EC-019 | Session expires | Preserve non-sensitive local UI state; route to sign-in; resume authoritative state after auth. |
| EC-020 | Account deleted on another device | Revoke access, clear protected cache, route to Welcome. |
| EC-021 | Template edited/disabled after generation | Immutable Instance snapshot remains; safety invalidation may expire Active with `safety_disabled`; explicit availability end may use `availability_expired`; no duration-based expiry. |
| EC-022 | Place has missing map app/invalid URL | Hide/disable navigation with copy; retain textual address/instructions. |
| EC-023 | Flexible budget with expensive template | Always show cost estimate; catalog still enforces a configured consumer safety ceiling. |
| EC-024 | Timezone/day boundary | Store UTC; display local timezone; MVP XP is unaffected because streak is excluded. |
| EC-025 | XP total/level inconsistency | Server derives/reconciles from ledger; client displays server result and logs anomaly. |
| EC-026 | Very large text/long localization | Reflow, scroll, never truncate instructions/actions; test 200% font scale. |
| EC-027 | Screen reader/reduced motion | Announce status changes; static celebration and no motion-dependent meaning. |
| EC-028 | Supabase partial outage | Typed service error, retry/backoff, cached read-only Active; no optimistic completion. |
| EC-029 | History empty/pagination duplicate | Friendly empty state; stable cursor and ID de-duplication. |
| EC-030 | Two devices mutate same Active Quest | Database lock/state transition wins; losing client refetches terminal authoritative state. |
