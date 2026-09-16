---
id: KNOW-005
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
---

# KNOW-005

## Summary

Pregoeiros keeps its local PostgreSQL representation of Compras.gov.br data
current through idempotent, restartable background sync jobs, without any
dedicated queue infrastructure in the MVP. Every job run is recorded, and the
application must degrade gracefully (stale data, not downtime) when upstream
is unavailable.

## Known Facts

- Initial sync jobs (converged naming across sources): catalog sync,
  procurements sync, procurement results sync, prices sync, suppliers sync,
  contracts sync, ARPs sync (architecture spec only), and interest
  processing. PRD job names: `sync-catalog`, `sync-procurements`,
  `sync-results`, `sync-prices`, `sync-suppliers`, `sync-contracts`,
  `process-interests`. Architecture spec job names:
  `sync_catalog`, `sync_procurements`, `sync_procurement_results`,
  `sync_prices`, `sync_suppliers`, `sync_contracts`, `sync_arps`,
  `process_interests`.
- Jobs MUST be idempotent, restartable, observable, bounded, and safe to run
  repeatedly. No Redis/BullMQ in the MVP — jobs are invoked by cron / Docker
  scheduler pattern / host scheduler / deployment platform scheduler, with
  state persisted in PostgreSQL. Exact frequencies are configurable; example
  schedule: 03:00 sync_procurements, 03:10 sync_procurement_results, 03:20
  sync_prices, 03:30 sync_contracts, 03:45 process_interests (architecture
  spec); PRD's simpler example: 03:00 sync incremental, 03:30 process
  interests.
- The application MUST NOT depend on jobs executing at an exact second; a
  missed job should be recoverable on the next run.
- **Concurrency protection**: PostgreSQL advisory locks
  (`pg_try_advisory_lock(job)`) prevent accidental concurrent execution of
  the same job — chosen specifically to avoid introducing Redis solely for
  distributed locks.
- **Sync run state** (`sync_runs` table): `id, job, started_at, finished_at,
  status, records_read, records_created, records_updated, cursor` (PRD) /
  `pages_processed, error_code, error_message` (architecture spec adds these
  instead of a single `cursor`+`error`). Possible statuses:
  `running, succeeded, failed, partial`.
- **Sync checkpoints** (`sync_checkpoints`, architecture spec): `job, cursor,
  updated_at`. The cursor may be a timestamp, upstream page, upstream
  identifier, or compound position; checkpoint semantics depend on the
  specific API endpoint. A checkpoint MUST only advance after the associated
  data has been safely persisted.
- **Transactions/idempotency**: each sync batch should be transactional where
  practical — fetch page → begin transaction → upsert entities, update
  relationships, record changes, update checkpoint → commit. If the
  transaction fails, the checkpoint must not move forward. Upserts should
  rely on stable unique constraints such as `(source, source_id)` rather than
  application-side existence checks.
- **Bootstrap** (historical backfill) is distinct from incremental sync: it
  must be resumable, operate in bounded batches, persist progress, and reuse
  the same normalization/persistence code paths as incremental sync (no
  duplicate import implementations). The PRD frames this as a priority change:
  "eu faria o backfill e o pipeline de ingestão relativamente cedo" — because
  Histórico, Radar, Favoritos, and Interesses become much simpler once the
  app controls a normalized local representation instead of querying the
  upstream API live for every screen.
- **Interest matching flow**: sync procurements → new/changed entities →
  process interests → InterestMatch → RadarEvent. Interest processing runs
  after relevant sync jobs and SHOULD only process records introduced or
  materially changed since the previous checkpoint (not a full rescan of
  history per Interest). Matches MUST be idempotent; a uniqueness rule
  (same interest + same entity + same matching event) prevents duplicate
  Radar entries.
- **Failure model**: Compras.gov.br can be temporarily unavailable, slow,
  rate-limited, inconsistent, or partially unavailable. When it fails: sync
  fails/retries → existing PostgreSQL data remains available → UI displays a
  freshness warning. The app MUST prefer degraded read availability over
  complete failure when local data already exists.
- **Data freshness** must be exposed per major dataset, distinguishing
  `fresh`, `stale`, `sync failed`, `never synchronized`. An upstream outage
  should normally make data stale, not make the whole app unavailable.
- **Observability**: server logs should be structured. HTTP integration logs
  should include source, endpoint, duration, status, attempt. Sync logs
  should include job, run_id, duration, pages, records_read,
  records_created, records_updated, retries, status. Sensitive query
  parameters and credentials MUST be redacted. `sync_runs` history
  complements (not replaces) logs.

## Constraints

- No dedicated queue infrastructure (Redis/BullMQ) for the MVP.
- Bootstrap and incremental sync must share normalization/persistence code —
  never two independent import implementations.
- A checkpoint must never advance before its batch's data is safely
  persisted (durability-before-progress rule).

## Unknowns

- ADR-004 (exact job execution/scheduling mechanism for the initial
  deployment) is open.
- Exact retry/backoff parameters for sync jobs specifically (vs. the generic
  HTTP client retry policy in [[KNOW-003]]) are not specified beyond "bounded
  retries."

## Conflicts

- PRD's `sync_runs` schema uses a single `cursor` + `error` field; the
  architecture spec instead separates checkpoint state into a dedicated
  `sync_checkpoints` table and adds `pages_processed`, `error_code`,
  `error_message` to `sync_runs`. Treated as the architecture spec refining
  the PRD's earlier sketch, not a genuine disagreement — worth confirming
  during schema design.
- Job name lists differ slightly (`sync-results` in PRD vs
  `sync_procurement_results` in architecture spec; architecture spec adds
  `sync_arps` which the PRD's job list omits, though the PRD does mention
  ARPs as a future v0.2 feature — see [[KNOW-011]]).

## Provenance

- PRD job list, cron example, `sync_runs` schema: `ai/raw/product-requirements-specification.md` §17–19.
- Architecture spec sync jobs, checkpoints, transactions, bootstrap,
  scheduling, advisory locks, failure model, freshness, observability:
  `ai/raw/architecture-specification.md` §27 (Interest Matching), §32–40, §52.

## Related Topics

[[KNOW-003]], [[KNOW-004]], [[KNOW-007]], [[KNOW-010]]
