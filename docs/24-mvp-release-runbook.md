# SideQuest MVP Release Runbook

## Preflight

- Confirm `main` is clean and all CI quality gates pass.
- Verify Supabase migrations against the dedicated development project before any production promotion.
- Confirm private Storage buckets, RLS, Auth deletion, and Edge Function deployment status.
- Run the device smoke matrix for Auth, onboarding, Explore, Active, proof, completion, history, and account deletion.

## Rollback

- Disable new matching/acceptance entry points with the existing application release controls.
- Revert only forward migrations with an approved follow-up migration; never rewrite applied history.
- Preserve proof cleanup and account-deletion recovery evidence.

## Deferred external-release decisions

- OQ-003 production geography, licensed location source, and launch catalog validation.
- OQ-004 third-party analytics/crash vendor and consent/processor review.
- OQ-005 legal, retention, and store disclosure review.

These are release-readiness actions, not unfinished MVP software implementation.
