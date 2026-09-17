---
id: SPEC-007
type: spec
status: draft
parent: FEAT-002
depends_on: []
supersedes: []
---

# SPEC-007

## Intent

Provide the shared execution engine every dataset-specific sync job
(SPEC-008–SPEC-012) runs inside: `sync_runs` tracking, PostgreSQL
advisory locking against concurrent execution, and checkpoint
persistence — so each dataset job only has to supply its own fetch/
normalize/upsert logic, not reimplement run tracking or locking.

## Requirements

### R1 — Every job execution is recorded in `sync_runs`

Running a job creates a `sync_runs` row with `job`, `status`
(`running` → `succeeded`/`failed`/`partial`), `started_at`,
`finished_at`, `records_read`, `records_created`, `records_updated`,
and `pages_processed`. On failure, `error_code`/`error_message` are
recorded on that run.

### R2 — Concurrent execution of the same job is prevented

Before a job body runs, the runtime attempts a PostgreSQL advisory lock
keyed by the job name. If the lock is already held (another execution
of the same job is in progress), the new invocation exits immediately
without running the job body or creating a new `running` `sync_runs`
row, rather than running concurrently or queuing.

### R3 — A checkpoint only advances after its batch is durably persisted

The runtime exposes a checkpoint read/write API
(`sync_checkpoints(job, cursor, updated_at)`). A job's own code writes
its checkpoint only after the corresponding batch's upserts have
committed. If a batch's transaction fails, the checkpoint value from
before that batch is unchanged.

### R4 — Each sync batch is transactional

The runtime provides a way for a job to wrap "upsert this batch of
entities + advance the checkpoint" in a single database transaction,
so a mid-batch failure leaves neither partial data nor an advanced
checkpoint.

### R5 — Jobs are idempotent by construction via the runtime's upsert helper

The runtime provides a generic upsert-by-`(source, source_id)` helper
that dataset jobs use for every entity write, so re-running a job (or
re-processing an already-seen page) updates existing rows rather than
duplicating them.

### R6 — A missed or repeated invocation is safe

Invoking a job when its checkpoint is already fully caught up performs
no writes and completes as a `succeeded` run with `records_read: 0`
(or equivalent). Invoking a job after a previous run failed partway
resumes from the last durably-advanced checkpoint, not from the
beginning.

## Acceptance Scenarios

- **Given** `sync_procurements` is already running, **when** a second
  invocation of `sync_procurements` starts, **then** it exits
  immediately without creating a new `running` sync_runs row or
  touching the database beyond the lock attempt.
- **Given** a job processes 3 batches and the 2nd batch's transaction
  fails, **when** the job is re-run, **then** it resumes from the
  checkpoint as of the end of batch 1, and batch 2's data is not
  duplicated once it succeeds.
- **Given** a job runs to completion successfully, **when** its
  `sync_runs` row is inspected, **then** `status` is `succeeded` and
  `finished_at`/record counts are populated.
- **Given** a job's fetch step throws partway through, **when** the run
  ends, **then** its `sync_runs` row has `status: failed` (or
  `partial`, if it processed at least one successful batch before
  failing) with a populated `error_message`.
- **Given** the same entity is upserted twice via the runtime's helper
  with the same `(source, source_id)`, **when** both upserts complete,
  **then** exactly one row exists for that entity, reflecting the
  second upsert's values.

## Edge Cases

- The advisory lock's holder process crashes without releasing it —
  PostgreSQL advisory session-level locks release automatically when
  the holding connection closes, so this Spec does not require
  additional stale-lock cleanup logic; a Plan may still choose
  transaction-level locks (`pg_advisory_xact_lock`) as an implementation
  detail for equivalent behavior.
- A job produces zero records for a given run (e.g. nothing changed
  upstream) — this is a `succeeded` run with zero counts, not a
  `partial` or `failed` one.

## Constraints

- Concurrency protection uses PostgreSQL advisory locks specifically —
  no Redis or external lock service (Constitution Architecture
  Invariant: no additional infrastructure without demonstrated need).
- `(source, source_id)` uniqueness backs every upsert (Constitution Data
  Invariant); the runtime's upsert helper relies on a real unique
  constraint, not an application-side existence check.
- Every behavior here (locking, checkpoint advancement, transactional
  batching) must be covered by integration tests against a real
  disposable PostgreSQL database, per KNOW-003's testing strategy.

## Non-Goals

- Any dataset-specific fetch/normalize logic — that's SPEC-008 through
  SPEC-012, which consume this runtime.
- The exact external trigger mechanism (cron entry, container
  scheduler, manual invocation) — this Spec only requires that a job is
  programmatically invokable; the trigger mechanism is a Plan-level/
  ADR-004 decision.
- Interest processing or Radar event generation — out of Program scope.

## Unresolved Questions

- ADR-004 (exact external scheduling/trigger mechanism) remains open at
  the Spec level by design — R1–R6 describe the runtime's own
  behavior when a job runs, not what causes it to run.

## Sources

[[KNOW-005]] (sync jobs, checkpoints, idempotency, advisory locks,
transactions, failure model), [[KNOW-004]] (upsert-by-source_id,
(source, source_id) uniqueness), Constitution `Architecture Invariants`
and `Data Invariants`.
