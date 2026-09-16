---
id: SPEC-002
type: spec
status: draft
parent: FEAT-001
depends_on: []
supersedes: []
---

# SPEC-002

## Intent

Provide a reproducible, containerized runtime environment (app +
PostgreSQL) that a developer or self-hoster can bring up with a single
command, configured entirely through environment variables, with no
secrets committed to the repository.

## Requirements

### R1 — Docker Compose brings up app and PostgreSQL together

`docker-compose.yml` defines an `app` service (built from the repository's
`Dockerfile`) and a `postgres` service (official `postgres` image). The
`app` service depends on `postgres`, ideally gated on
`condition: service_healthy`.

### R2 — PostgreSQL data survives app container replacement

The `postgres` service mounts a named volume at
`/var/lib/postgresql/data`. Rebuilding or replacing the `app` container
does not delete or reset existing PostgreSQL data.

### R3 — Configuration is environment-variable driven

The application reads `DATABASE_URL`, `COMPRAS_GOV_BASE_URL`,
`SYNC_ENABLED`, `SYNC_CRON`, and `LOG_LEVEL` from the environment. A
`.env.example` file documents every required variable with placeholder
(non-real) values. No secret or credential is committed to the repository
in any tracked file.

### R4 — SvelteKit can run on the host against a Dockerized PostgreSQL

In local development, a developer can run PostgreSQL alone in Docker
(`docker compose up postgres`) and run the SvelteKit dev server directly on
the host against it, without additional configuration beyond
`DATABASE_URL`.

## Acceptance Scenarios

- **Given** a clean checkout with Docker installed, **when** a developer
  runs `docker compose up`, **then** both `postgres` and `app` start
  successfully and the app can reach the database.
- **Given** the stack is running, **when** the `app` container is stopped,
  rebuilt, and restarted, **then** previously persisted PostgreSQL data is
  still present (volume survived).
- **Given** `.env.example` exists, **when** a developer copies it to `.env`
  and fills in real values, **then** the application starts using those
  values with no code changes required.
- **Given** a developer wants faster local iteration, **when** they run
  only `postgres` in Docker and `npm run dev` (or equivalent) on the host,
  **then** the app connects successfully using the same `DATABASE_URL`
  pattern.

## Edge Cases

- `postgres` is not yet healthy when `app` starts — `app` must fail fast or
  retry connecting rather than crash-looping opaquely; exact retry
  behavior is a Plan-level implementation detail, but the app must not
  silently hang with no diagnostic output.
- A required environment variable is missing — the application should fail
  with a clear error identifying the missing variable, not a generic crash.

## Constraints

- Secrets MUST NEVER be committed to the repository (Constitution Security
  Invariant).
- No infrastructure beyond `app` + `postgres` is introduced in this Spec —
  no Redis, no additional services.

## Non-Goals

- Production/cloud deployment topology beyond what Docker Compose itself
  expresses — no Kubernetes manifests, no cloud-specific configuration.
- CI/CD pipeline configuration.
- The actual database schema/migrations (covered by SPEC-003, which
  depends on this Spec).

## Unresolved Questions

- Exact retry/backoff behavior for the app waiting on Postgres readiness is
  left to `/create-plan` — this Spec only requires that failure is
  diagnosable, not silent.

## Sources

[[KNOW-002]] (Docker Compose structure, environment variables, dev-mode
host execution), Constitution `Compatibility Requirements` (fixed stack) and
`Security Invariants` (no committed secrets).
