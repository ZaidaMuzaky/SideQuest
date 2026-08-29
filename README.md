# SideQuest

SideQuest is a mobile-first real-world adventure discovery app. A user provides available time, budget, mood, and travel radius; SideQuest returns one safe, achievable activity framed as a Quest and rewards verified completion with XP.

## Status

**Foundation through SQ-0005 implemented.** The repository contains the Expo application, UI primitives, local Supabase configuration, typed client foundation, base schema, owner-scoped RLS, an approved catalog view, and private proof/avatar Storage policies. No product features, RPC workflows, or catalog seed data exist yet.

## Planned stack

- React Native + Expo + TypeScript (strict)
- Expo Router + NativeWind
- Supabase Auth, PostgreSQL, Storage, and Row Level Security

## Repository structure

```text
SideQuest/
├── app/                      # Expo Router development placeholder routes
├── src/                      # UI, typed configuration, and Supabase client foundation
├── supabase/                 # Local stack config; schema migrations begin in SQ-0004
├── AGENTS.md                 # Rules and workflow for coding agents
├── README.md
├── package.json              # npm scripts and dependency manifest
└── docs/                     # Product, UX, domain, architecture, QA, and delivery source of truth
```

## Documentation map

- Product and scope: [01](docs/01-product-brief.md), [02](docs/02-prd.md), [03](docs/03-mvp-scope.md)
- Users and UX: [04](docs/04-user-personas.md), [05](docs/05-user-stories.md), [06](docs/06-user-flows.md), [07](docs/07-screen-specifications.md)
- Requirements and systems: [08](docs/08-functional-requirements.md), [09](docs/09-quest-system.md), [10](docs/10-gamification-system.md)
- Data and architecture: [11](docs/11-data-model.md), [12](docs/12-technical-architecture.md), [13](docs/13-api-and-services.md), [14](docs/14-security-and-privacy.md)
- Quality and experience: [15](docs/15-edge-cases.md), [16](docs/16-acceptance-criteria.md), [17](docs/17-testing-strategy.md), [18](docs/18-design-system.md), [19](docs/19-accessibility.md), [20](docs/20-analytics.md)
- Delivery: [21](docs/21-post-mvp-roadmap.md), [22](docs/22-development-backlog.md), [23](docs/23-open-questions.md)
- Planning result: [Documentation Readiness Report](docs/DOCUMENTATION-READINESS-REPORT.md)

## Local development

Prerequisites: a current Node.js/npm environment supported by Expo SDK 57, plus Android Studio/device tooling for Android or macOS/Xcode for a local iOS simulator/build.

```bash
npm install
npm start
```

Useful commands:

```bash
npm run android
npm run ios
npm run lint
npm run typecheck
npm test
npm run config:check
```

### Local Supabase

Prerequisites: Docker Desktop (or another Docker-compatible daemon) and the Node/npm prerequisites above. The Supabase CLI is project-local; no global installation is required.

```bash
npm run supabase:start
npm run supabase:status
```

Copy `.env.example` to an ignored `.env.local`, then replace the publishable-key placeholder with the public key printed by `npm run supabase:status`. The local API defaults to `http://127.0.0.1:54321`. Both `EXPO_PUBLIC_*` values are embedded in the client bundle and are public; never place service-role keys, database passwords, JWT signing secrets, or provider secrets there.

The client is created lazily through `src/lib/supabase`; missing configuration reports the missing variable name without logging values. Local development uses `.env.local`. Staging/preview and production provide the same two public variable names through their build environment (for example, environment-scoped EAS variables), with separate Supabase projects and no committed environment files.

Useful local commands:

```bash
npm run supabase:status
npm run supabase:types
npm run supabase:test
npm run supabase:schema:check
npm run supabase:authorization:check
npm run supabase:reset
npm run supabase:stop
```

`supabase:reset` is destructive to the local development database only. `supabase:types` requires a running local stack and overwrites `src/types/database.generated.ts` from the actual `public` schema; run it after every migration beginning with SQ-0004. SQ-0003 intentionally provides no schema or seed data.

SQ-0005 Storage buckets are private. Proof object paths use `{user_id}/{quest_instance_id}/{proof_id}.{safe_ext}` and avatar paths use `{user_id}/{random_uuid}.{safe_ext}`. The allowed lowercase extensions are `jpg`, `jpeg`, `png`, `webp`, `heic`, and `heif`; later upload work must additionally enforce the documented decoded-content, byte-size, and image-dimension checks once their approved limits are defined. Signed URLs are short-lived access artifacts and must never be persisted or sent to logs/analytics.

### Dedicated cloud development verification

Remote verification supplements the local workflow and is restricted to a dedicated non-production Supabase project. Administration credentials belong only in the operator shell or CI secret store; they are not app runtime configuration, are not read by Expo, and must never use an `EXPO_PUBLIC_*` name. `.env.remote.example` records variable names only and is not loaded automatically.

Configure `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SIDEQUEST_SUPABASE_ENVIRONMENT`, `SIDEQUEST_SUPABASE_PROJECT_REF`, `SIDEQUEST_SUPABASE_CONFIRM_PROJECT_REF`, and `SIDEQUEST_SUPABASE_EXPECTED_PROJECT_NAME` in the operator shell or CI secret store. `SIDEQUEST_SUPABASE_ENVIRONMENT` must be `development`; both project-ref variables must match exactly. The expected name must exactly match the Supabase Management API and explicitly identify both SideQuest and dev/development; production, live, and staging names are rejected.

Create a Supabase personal access token and provide it as `SUPABASE_ACCESS_TOKEN` through the operator shell or CI secret store, then run `npm run supabase:remote:link`. The wrapper intentionally does not rely on cached interactive login state. Linking verifies the requested ref, deliberate ref confirmation, and exact project name before writing the ignored local link metadata. The check command rejects remote migration history unless it is an exact prefix of repository history, then performs a migration dry run and remote `public` schema lint: `npm run supabase:remote:check`.

Applying forward migrations requires the additional `SIDEQUEST_SUPABASE_ALLOW_MIGRATION_PUSH` acknowledgement value `YES_DEDICATED_SIDEQUEST_DEVELOPMENT`, then `npm run supabase:remote:push`. The wrapper repeats project identity checks, performs a dry run first, skips Vault changes, applies migrations without seed data, and lists migration history afterward. It deliberately provides no remote reset, repair, seed, or database-URL command.

After a successful push, run `npm run supabase:remote:test` to execute both SQ-0004 and SQ-0005 pgTAP suites against the linked project, and `npm run supabase:remote:types` to regenerate `src/types/database.generated.ts` from its `public` schema. The remote test wrapper uses the official `supabase db query --linked --file` command because `supabase test db` starts a local `pg_prove` container even for its linked mode. Since the linked query command exposes only its final result set, the wrapper executes a protected temporary copy that collects every TAP line in a transaction-local table and returns one marker-delimited result; it then requires the exact plan, every sequential passing assertion, and no failure diagnostics. Original test files remain unchanged, and every suite must retain its `begin`/`finish()`/`rollback` boundaries. Finish with `npm run supabase:schema:check`, `npm run supabase:authorization:check`, `npm run typecheck`, and `npm test`. Remote pgTAP fixtures are transaction-scoped and the policies are not weakened for testing.

### Migration recovery policy

Migrations are forward-only and must be reviewed with a clean local `supabase:reset` before deployment. During local development, correct an unapplied migration and reset the disposable local database. After a migration has reached a shared or production environment, never rewrite its history: create and review a new forward corrective migration. Production recovery uses the environment's verified backup/point-in-time recovery procedure plus a forward corrective migration; destructive reset is never a production rollback command. SQ-0005 defaults direct client mutations to denied; later server-authoritative workflow RPCs must retain pinned search paths and minimal grants.

If app startup reports a missing public environment variable, confirm `.env.local` contains both names from `.env.example`, then fully reload Expo. Use the host-reachable local API address instead of loopback when testing on a physical device.

## Development workflow

Select a small `SQ-*` backlog task, read its linked `FR-*`/`AC-*` documents, inspect the repository, implement and test the smallest correct change, then report verification and documentation impact. All coding agents and contributors must follow [AGENTS.md](AGENTS.md).
