# Security and Privacy

## Principles and threat model

Collect the minimum data, keep proof/location private, treat the client as untrusted, and make authorization server-enforced. Primary threats: cross-account data access, leaked proof images, forged XP/completions, malicious uploads/input, token theft, coordinate overcollection, and excessive operational logging.

## Authentication

- Use Supabase Auth and current secure defaults; require TLS.
- Store refresh/session material using provider-supported secure mobile persistence; never log tokens.
- Configure email verification and password recovery before public launch (OQ-001).
- Rate limit sign-in/sign-up through provider controls; use generic enumeration-resistant messages.
- Account-sensitive actions (email change/deletion) require recent authentication.

## Authorization and RLS

Enable RLS on every exposed table. Default deny, then allow authenticated users to select/update their own profile/preferences and select their own searches/instances/proofs/completions/progress/ledger where needed. Catalog access uses an approved/enabled view or security-invoker function. Direct client insert/update of completion, XP ledger, progress, ownership fields, reward fields, and arbitrary status transitions is denied. Transactional functions validate `auth.uid()`, use a pinned `search_path`, minimal grants, and careful `SECURITY DEFINER` only when necessary.

RLS tests MUST attempt cross-user reads/writes and forged ownership/reward changes.

## Storage

- Buckets `quest-proofs` and `avatars` are private.
- Path convention: `{auth.uid()}/{quest_instance_id}/{proof_id}.{safe_ext}`.
- Signed read URLs are short-lived and never persisted/analytically tracked.
- Validate MIME by decoded content where practical, byte limit, dimensions, ownership, and expected path; randomize names.
- Strip unnecessary EXIF, especially geolocation, before or immediately after upload.
- Abandoned/replaced proof metadata becomes `pending_delete`; an explicit cleanup process deletes the Storage object and only then may remove metadata. Deleting a database row alone is never treated as object deletion.

## Location privacy

- Request only foreground permission, at point of need, with purpose text.
- No background tracking, route history, arrival verification, or analytics coordinates.
- Raw search coordinates are transient and discarded after matching. Server logs must not include them.
- A selected public Quest location may be stored in an instance because it is content, not a record of the user’s exact path.
- Privacy policy states purpose, retention, processors, rights, and how denial affects functionality.

## Validation and API safety

Client validation improves UX; server schemas/checks are authoritative. Bound strings/arrays/files, normalize identifiers, parameterize SQL, validate redirect/deep links, and allowlist external-map schemes/hosts. Rate limit auth, matching, reroll, proof registration, and completion. Use idempotency and database uniqueness for reward mutations.

## Abuse and content safety

Only approved templates are eligible. Operational staff can disable templates/locations without an MVP admin UI. Provide support/report path, preserve minimal incident audit data, and never auto-punish solely on anomaly signals. Proof is not public and is not automatically judged for content in MVP; terms prohibit illegal/abusive imagery.

## Secrets and supply chain

Only Supabase anon/public configuration is in the app. Service-role/API secrets live in Supabase or CI. Pin and review dependencies, run vulnerability/license checks, protect production migrations, and separate environment resources.

## Retention, deletion, and user rights

Recommended policy pending legal review (OQ-005): proof retained while account exists unless user deletes account; operational logs 30–90 days; analytics uses pseudonymous IDs and documented retention. Account deletion initiates deletion of proof/avatar objects and cascades account-owned relational data; required security/legal audit records, if any, are minimized and anonymized. Show completion/progress impact before deletion. Document backup expiry and processor deletion timelines.

## Incident and release controls

Have a contact, revocation procedure, template disable switch, storage-access audit, and breach-response playbook before beta. Security/RLS/storage policy tests are release blockers. Conduct a privacy and store disclosure review for Location, Camera, Photos, identifiers, analytics, and deletion.
