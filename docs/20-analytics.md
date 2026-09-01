# Analytics

## Purpose and principles

Measure whether the core loop is useful. Use pseudonymous user ID after consent/legal basis, stable event names, server events for authoritative transitions, and minimal properties. Never collect proof content/path, notes, email/name, raw coordinates, address, tokens, or free-form Quest instructions.

## Events

| Event | Source | When | Allowed properties |
|---|---|---|---|
| `app_opened` | client | authenticated shell opens | app version, platform, session state |
| `onboarding_completed` | server/client deduped | first completion | step count, duration bucket |
| `quest_search_started` | client | valid Find tap | time/budget/mood/distance enum, location mode, search ID |
| `quest_generated` | server | Candidate committed | search ID, template family/version, category, fit buckets, repeated_recent boolean |
| `quest_no_match` | server | no eligible result | search ID, reason code, constraint enums |
| `quest_rerolled` | server | Candidate transitioned | search ID, category, reroll ordinal |
| `quest_accepted` | server | Active transition | instance ID, category, candidate age bucket |
| `quest_abandoned` | server | terminal transition | instance ID, category, elapsed bucket; no free-form reason |
| `proof_upload_started` | client | upload begins | instance ID, source camera/library, size bucket |
| `proof_uploaded` | server/client deduped | metadata registered | instance ID, size bucket, duration bucket |
| `quest_completed` | server | completion committed | instance ID, category, XP awarded, level before/after, elapsed bucket |
| `profile_viewed` | client | profile visible | level bucket |
| `history_viewed` | client | history visible | has_active, result-count bucket |
| `permission_result` | client | OS permission result | permission location/camera/photos, result enum, request context |
| `operation_failed` | client/server | actionable domain failure | operation, safe error code, retryable, correlation ID |

Server events are authoritative for generated/accepted/abandoned/completed. IDs are operational pseudonymous keys and require retention/access controls.

## Funnel and metrics

```text
App Open → Search Started → Quest Generated → Accepted → Proof Uploaded → Completed → 7-day Return/Search
```

Track generation rate, no-match reasons, accept/generated, complete/accepted, median time to candidate, median accepted-to-complete, rerolls/search, abandonment rate, 1/7/30-day return, category coverage, and safety reports per generated Quest. Segment only by coarse constraint/category/platform, never precise location or sensitive inference.

## Governance

- Create a typed event schema and automated property allowlist.
- Document owner, definition, source, and version for each event.
- Development/staging data is separated from production.
- MVP does not integrate a third-party analytics or crash vendor and sends no additional telemetry externally. Vendor selection, consent, processor review, and production instrumentation are deferred to post-MVP external release preparation.
- Apply retention limits, deletion/anonymization support, role-based access, and store/privacy disclosures.
- Revisit initial success targets only after a documented baseline; do not move targets to manufacture success.
