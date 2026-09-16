---
id: SPEC-005
type: spec
status: draft
parent: FEAT-001
depends_on: [SPEC-002, SPEC-003]
supersedes: []
---

# SPEC-005

## Intent

Expose a `/api/health` endpoint that distinguishes application health from
database health, so operators and orchestration tooling (e.g. Docker
Compose's `service_healthy` condition) can detect real failures without
Compras.gov.br's own availability determining Pregoeiros' reported health.

## Requirements

### R1 — `/api/health` reports application and database status separately

`GET /api/health` returns a response distinguishing at minimum
`application` status and `database` status (e.g. connectivity check
against PostgreSQL via SPEC-002/SPEC-003's schema).

### R2 — Compras.gov.br availability does not affect the top-level health status

The endpoint's overall/application status is never marked unhealthy solely
because the upstream Compras.gov.br API is slow, degraded, or unreachable.
Per-source status (e.g. `sources.comprasgov`) MAY be exposed separately
from the top-level status.

### R3 — Database failure is reported accurately

When PostgreSQL is unreachable, the endpoint reports `database` as
unhealthy while still responding (not hanging or crashing the process).

## Acceptance Scenarios

- **Given** the application and database are both healthy, **when**
  `GET /api/health` is called, **then** it returns a response indicating
  both `application: ok` and `database: ok`.
- **Given** PostgreSQL is stopped, **when** `GET /api/health` is called,
  **then** the response reports `database` as unhealthy while the endpoint
  itself still responds (does not time out or crash).
- **Given** Compras.gov.br is unreachable but the local database is
  healthy, **when** `GET /api/health` is called, **then** the top-level/
  application status remains healthy.

## Edge Cases

- The health check must not perform an expensive or slow query — a
  lightweight connectivity check (e.g. `SELECT 1`) is sufficient; it must
  not, for example, aggregate across large tables.

## Constraints

- Must not leak sensitive configuration (credentials, internal DSNs) in the
  response body.
- Depends on SPEC-002 (a reachable PostgreSQL instance to check against)
  and SPEC-003 (a migrated schema, so the connectivity check has something
  real to query).

## Non-Goals

- Per-sync-job freshness/staleness reporting (e.g. "Contratações atualizado
  há 12 minutos") — that is a data-freshness UX concern owned by the
  Features that display synced data (FEAT-002 and consumers), not this
  infrastructure-level health check.
- Authentication/authorization on the health endpoint itself.

## Unresolved Questions

None — this Spec's requirements are fully grounded in KNOW-004.

## Sources

[[KNOW-004]] (health endpoint requirements, example response shape),
Constitution `Integration Invariants` (upstream outage must not make the
app unavailable).
