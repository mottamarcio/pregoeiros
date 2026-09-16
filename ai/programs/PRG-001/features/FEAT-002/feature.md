---
id: FEAT-002
type: feature
status: draft
parent: PRG-001
---

# FEAT-002

## Capability

Ingest and normalize the Compras.gov.br datasets this Program needs —
CATMAT/CATSER catalog, procurements, procurement items, procurement
results, suppliers, and practiced prices — into PostgreSQL through
idempotent, restartable background synchronization jobs, with full
provenance on every imported record.

## User Value

This is the capability that makes the local read model real: every other
Explorar Feature reads exclusively from PostgreSQL, never live from
Compras.gov.br. Without this Feature, there is no data to explore, and the
product's core resilience promise (stay usable when Compras.gov.br is slow
or down) cannot exist.

## Scope

- Source adapter layer (`src/lib/server/sources/comprasgov/`): HTTP client
  with `AbortSignal`, timeouts, structured errors, bounded retries with
  exponential backoff + jitter (only for transient failures — connection
  reset, appropriate timeouts, 429/502/503/504; never 400/404), respecting
  `Retry-After` when present; DTOs and endpoint modules for catalog,
  procurements, results, suppliers, and prices.
- Normalization functions mapping DTOs to domain entities (`CatalogItem`,
  `Organization`, `Supplier`, `Procurement`, `ProcurementItem`,
  `ProcurementResult`, `PriceObservation`), named independently of the
  upstream API shape.
- Repository layer for the above entities, isolating all SQL behind
  `src/lib/server/repositories/`.
- Background sync jobs: `sync_catalog`, `sync_procurements`,
  `sync_procurement_results`, `sync_prices`, `sync_suppliers` — each
  idempotent, restartable, and safe to run repeatedly, upserting on
  `(source, source_id)`, guarded by PostgreSQL advisory locks against
  concurrent execution of the same job.
- `sync_runs` and `sync_checkpoints` tracking: every job execution recorded
  with status (`running/succeeded/failed/partial`), record counts, and a
  checkpoint that only advances after its batch is durably persisted.
- Provenance fields (`source`, `source_id`, `fetched_at`, and
  `source_updated_at` when available) on every imported record.
- A resumable historical bootstrap path for the datasets in scope, sharing
  normalization/persistence code with incremental sync (no duplicate import
  implementation).
- Scheduling mechanism to trigger jobs (cron / container scheduler) per
  configurable frequency (`SYNC_CRON`).

## Non-Goals

- ARPs and legacy Compras.gov.br data ingestion — out of Program scope
  (v0.2/v0.5).
- Interest matching / Radar event generation from synced data — belongs to
  a future Program once Interesses/Radar are in scope.
- Contracts sync (`sync_contracts`) — out of Program scope.
- A queue system (Redis/BullMQ) — explicitly excluded; scheduling relies on
  cron/container patterns with PostgreSQL-tracked state.
- Building the UI that displays this data — that is FEAT-003 through
  FEAT-006.

## Constraints

- No direct browser-to-Compras.gov.br calls; all upstream communication is
  server-side only.
- Jobs must never invent an undocumented upstream rate limit.
- `(source, source_id)` must be unique wherever the upstream entity has a
  stable identifier; upserts rely on this constraint, not application-side
  existence checks.
- PostgreSQL must not become an indiscriminate JSON archive — fields needed
  for filtering/joining/analytics must be modeled as real columns.
- Every behavior change (normalizers, matching logic, retry behavior) must
  be covered by tests; source adapter tests must use recorded/synthetic
  fixtures and must not require the live Compras.gov.br service.

## Relevant Knowledge

[[KNOW-003]] (HTTP client rules, source layer, mapping pipeline),
[[KNOW-004]] (provenance, internal vs external IDs, repository isolation),
[[KNOW-005]] (sync jobs, checkpoints, idempotency, bootstrap, advisory
locks, failure model).

## Open Questions

- ADR-003 (whether Compras.gov.br response validation is required globally
  or only at critical boundaries) directly shapes this Feature's DTO/
  validation layer and is unresolved.
- ADR-004 (job execution/scheduling mechanism) is unresolved and affects
  how these jobs are actually triggered in the Docker environment.
- Minor Knowledge conflict carried from KNOW-005: PRD vs. architecture spec
  disagree slightly on `sync_runs` field names and on whether a
  `sync-results`/`sync_procurement_results` job is named consistently —
  needs to be settled when writing the Spec-level schema.
