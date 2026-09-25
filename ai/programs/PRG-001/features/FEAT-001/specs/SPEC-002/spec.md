---
id: SPEC-002
type: spec
status: draft
parent: FEAT-001
depends_on: [SPEC-001]
supersedes: []
---

# SPEC-002 — Runtime, Configuration and Database Baseline

## Intent

Make the application runnable as a Docker Compose stack (`web` + `db`) and
in local development. Provide validated, server-only configuration. Provide
the Drizzle/PostgreSQL 16 baseline — client, schema entry point, migration
workflow and required extensions — on which every Feature adds its own
tables.

## Requirements

### R1 — Compose stack

`docker compose up` starts two services:

- **`db`:** `postgres:16-alpine`, a persistent named volume, and a healthcheck using `pg_isready`;
- **`web`:** the production build, `node build/index.js`, listening on port **3000** (D-27, D-28).

`web` starts only after `db` reports healthy.

### R2 — Migrations applied before the app serves

When the `web` container starts, pending migrations are applied before the HTTP server accepts requests. If migration fails, the container exits non-zero and does not serve. *Assumption: migrate-on-start via the container entrypoint, the simplest option for a single-replica v1.*

### R3 — Local development flow

With only `db` running from Compose, `npm run dev` serves the app on port 5173 using `DATABASE_URL` from `.env`. `.env.example` documents every variable with safe local defaults, and `.env` stays git-ignored.

### R4 — Validated server configuration

`$lib/server/env.ts` parses `process.env` with a Zod schema at server startup and exports typed values. Missing or invalid required variables abort startup with an error that names each offending variable. This Spec defines `DATABASE_URL` and `PUBLIC_APP_NAME`; later Features extend the same schema with their own variables.

### R5 — No database URL in public configuration

Configuration validation rejects any variable prefixed `PUBLIC_` whose value contains a PostgreSQL connection string (`postgres://` or `postgresql://`), aborting startup.

### R6 — Database client

`$lib/server/db/client.ts` exposes a single pooled Drizzle client created from `DATABASE_URL`, reused across requests. It lives only under `$lib/server`.

### R7 — Migration workflow

- The Drizzle schema entry point is `$lib/server/db/schema.ts`.
- Migrations are generated into `src/lib/server/db/migrations/` (D-22) via `npm run db:generate` and applied via `npm run db:migrate`.
- Applying migrations to an up-to-date database is a no-op that exits 0.

### R8 — Baseline migration

The first migration creates the `pgcrypto` and `pg_trgm` extensions with `IF NOT EXISTS` and nothing else; tables and enums belong to the Features that own them. The `citext` extension is not created (D-24).

### R9 — Integration-test database

`npm run test:integration` runs against a disposable PostgreSQL 16 database (`compose.test.yml` locally, the service container in CI) that is migrated from scratch at the start of each run.

## Acceptance Scenarios

- **Given** Docker installed and no prior volume, **when** `docker compose up -d` runs, **then** `db` becomes healthy, migrations apply, and `GET http://localhost:3000/` responds from the production build.
- **Given** `DATABASE_URL` is unset, **when** the server starts, **then** startup aborts and the error names `DATABASE_URL`.
- **Given** `PUBLIC_APP_NAME=postgres://u:p@db/x`, **when** the server starts, **then** startup aborts with a message that public variables must not contain database URLs.
- **Given** a freshly migrated database, **when** `npm run db:migrate` runs again, **then** it exits 0 and applies nothing.
- **Given** the baseline migration applied, **when** querying `pg_extension`, **then** `pgcrypto` and `pg_trgm` are present and `citext` is absent.
- **Given** only `db` running from Compose, **when** `npm run dev` runs, **then** the app serves on port 5173 connected to that database.

## Edge Cases

- `db` slow to become healthy: `web` waits rather than crashing; no hard-coded sleep.
- Extensions already present (e.g. a restored backup): the baseline migration still succeeds.
- A migration failing midway leaves the database without partial effects of that migration (run each migration in a transaction).
- `.env` absent in the container: variables come from the Compose `env_file`/environment. The same validation applies.

## Constraints

- Constitution: secrets and credentials only on the server; nothing public contains them; 100% parameterized SQL (Drizzle query builder or the `sql` tagged template, never string concatenation); migrations backward-compatible within a major version; timezone-aware timestamps and exact decimals (enforced by Features' schemas).
- Decisions D-22, D-24, D-26b, D-27, D-28.

## Non-Goals

- Any domain tables or enums (owned by FEAT-002…FEAT-010).
- Production hosting, TLS/reverse proxy and backups (FEAT-001 open question).
- The scheduler/cron process and `ENABLE_CRON` (FEAT-003).
- `AUTH_DISABLED` and authentication variables (FEAT-002).

## Unresolved Questions

- None.

## Sources

- [[KNOW-018]] deployment, Compose, environment variables
- [[KNOW-024]] migrations and conventions
- [[KNOW-016]] PostgreSQL extensions
- [[KNOW-023]] `PUBLIC_` rule, prepared statements
- `ai/raw/06-DECISOES.md` D-22, D-24, D-26b, D-27, D-28
