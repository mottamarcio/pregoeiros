---
id: SPEC-013
type: spec
status: draft
parent: FEAT-002
depends_on: [SPEC-007, SPEC-008, SPEC-009, SPEC-010, SPEC-011, SPEC-012]
supersedes: []
---

# SPEC-013

## Intent

Provide a resumable historical backfill path for every dataset in this
Feature's scope (catalog, suppliers, procurements/items, results,
prices), reusing the same normalization/persistence code the
incremental sync jobs (SPEC-008–SPEC-012) already use — never a second,
parallel import implementation.

## Requirements

### R1 — Bootstrap reuses each dataset's existing normalizer and repository code

For each dataset, the bootstrap path calls the same normalizer and the
same SPEC-007 upsert helper that dataset's incremental sync job
(SPEC-008–SPEC-012) already uses. No dataset has a separate
bootstrap-only normalization function.

### R2 — Bootstrap operates in bounded batches with persisted progress

Bootstrap processes each dataset in fixed-size batches (a configurable
batch size, defaulting to a reasonable value — e.g. 500 records per
batch, applied uniformly since no dataset-specific tuning requirement
is documented) and persists its progress via SPEC-007's checkpoint API
after each batch commits, using the same "checkpoint only advances
after durable persistence" guarantee as incremental sync (SPEC-007 R3).

### R3 — Bootstrap is resumable after interruption

If bootstrap for a dataset is interrupted (process killed, error,
manual stop) after N batches have committed, re-invoking bootstrap for
that dataset resumes from batch N+1's checkpoint rather than
restarting from the beginning or duplicating already-imported records.

### R4 — Bootstrap respects each dataset's cross-dataset ordering

Since SPEC-010/SPEC-011/SPEC-012 depend on catalog and/or supplier data
existing (directly or via the stub mechanism), bootstrapping "all
datasets from zero" processes catalog and suppliers before procurements/
results/prices — or relies on the same stub-creation behavior those
Specs already define, so bootstrap does not require a strict
dataset-by-dataset ordering to produce correct data, only that it
eventually converges to the same complete state incremental sync would
reach.

## Acceptance Scenarios

- **Given** a dataset's bootstrap has committed 5 of 10 planned
  batches when the process is killed, **when** bootstrap for that
  dataset is re-invoked, **then** it resumes from batch 6 and does not
  reprocess or duplicate batches 1–5's records.
- **Given** bootstrap for `procurements` runs before `catalog`
  bootstrap has completed, **when** a procurement item references an
  unsynced catalog item, **then** the same stub-creation behavior from
  SPEC-010 R3 applies — bootstrap does not require a different
  resolution strategy than incremental sync.
- **Given** bootstrap completes for a dataset, **when** the
  corresponding incremental sync job (e.g. `sync_catalog`) next runs,
  **then** it behaves exactly as it would after any other prior run —
  no bootstrap-specific state prevents normal incremental operation
  from taking over.

## Edge Cases

- Bootstrap is invoked for a dataset that has already fully bootstrapped
  (checkpoint indicates completion) — this is a no-op success, not an
  error, matching SPEC-007 R6's "already caught up" behavior.
- A batch fails mid-bootstrap — the same transactional-batch guarantee
  as SPEC-007 R4 applies: neither partial data nor an advanced
  checkpoint results from a failed batch.

## Constraints

- Must share normalization/persistence code with incremental sync
  (Constitution Architecture Invariant: "bootstrap and incremental
  synchronization MUST share the same normalization and persistence
  code paths").
- Depends on SPEC-007 (checkpoint/transaction/idempotency guarantees)
  and every dataset Spec (SPEC-008–SPEC-012), since it reuses their
  code rather than duplicating it.
- Tests use recorded/synthetic fixtures, never the live service.

## Non-Goals

- A new/separate import implementation — explicitly forbidden by this
  Spec's own R1 and the Constitution.
- ARP or legacy data bootstrap — out of Program scope.
- Any UI showing bootstrap progress — that's a future Feature's concern
  (e.g. the Data Ingestion Status modal pattern from KNOW-010), not this
  Spec's own scope.

## Unresolved Questions

None.

## Sources

[[KNOW-005]] (bootstrap: resumable, bounded batches, shared code path,
backfill priority rationale), Constitution `Architecture Invariants`
("bootstrap and incremental synchronization MUST share the same
normalization and persistence code paths").
