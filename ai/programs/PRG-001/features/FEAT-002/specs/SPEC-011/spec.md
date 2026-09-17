---
id: SPEC-011
type: spec
status: draft
parent: FEAT-002
depends_on: [SPEC-006, SPEC-007, SPEC-009, SPEC-010]
supersedes: []
---

# SPEC-011

## Intent

Ingest homologated procurement item results (who supplied, at what
price, when) from Compras.gov.br into `procurement_results`, as the
`sync_procurement_results` job, linking each result to its
`procurement_item` and winning `supplier`.

## Requirements

### R1 — Result DTOs are validated and normalized into `ProcurementResult`

The adapter defines a validation schema for the upstream result
response shape and a normalizer mapping it to `ProcurementResult`
(`id`, `source`, `source_id`, `procurement_item_id`, `supplier_id`,
quantity, unit value, homologation date, provenance fields).

### R2 — `sync_procurement_results` upserts results idempotently, referencing existing suppliers and items

The job resolves each result's `procurement_item_id` (must already
exist, from SPEC-010) and `supplier_id` (must already exist, from
SPEC-009) via `(source, source_id)` lookup, then upserts into
`procurement_results` via SPEC-007's helper. Re-running against
unchanged data produces no duplicate rows.

### R3 — Terminology precision is enforced at the data layer: a result is not a "win" claim beyond what's recorded

The normalized `ProcurementResult` records only what the source data
actually establishes (a homologated result linking a supplier to an
item at a price) — it does not synthesize or infer a broader "won the
procurement" status beyond the item-level result itself, consistent
with KNOW-006/KNOW-010's terminology precision rule that presence/
results must never be overstated.

### R4 — `sync_procurement_results` checkpoints its progress

Following the same pattern as prior ingestion Specs, the job persists a
checkpoint after each committed batch.

## Acceptance Scenarios

- **Given** a recorded fixture of a result referencing a
  `procurement_item` and `supplier` that already exist, **when**
  `sync_procurement_results` processes it, **then** the resulting
  `procurement_results` row correctly references both by internal ID.
- **Given** a result references a `procurement_item` or `supplier` that
  does not yet exist locally, **when** the job processes it, **then**
  the job's own behavior is defined (see Edge Cases) rather than
  crashing the batch unhandled.
- **Given** `sync_procurement_results` runs twice against the same
  fixture data, **when** the second run completes, **then** the row
  count in `procurement_results` is unchanged.

## Edge Cases

- A result references a `procurement_item`/`supplier` not yet synced
  locally (an ordering problem symmetric to SPEC-010 R3, but for a
  result rather than a catalog reference) — unlike SPEC-010's stub
  approach, this Spec does NOT create a stub `procurement_item` or
  `supplier` (a result without its parent item/supplier existing is a
  genuine ordering violation the job cannot meaningfully recover from
  by fabricating a parent entity's business data). The job skips that
  result, logs it as part of the run's observability metadata (SPEC-007
  R1), and relies on a subsequent run — after `sync_procurements`/
  `sync_suppliers` have caught up — to successfully link it. This
  differs deliberately from SPEC-010 R3's stub approach; the difference
  is recorded here, not left implicit.
- Two results reference the same `procurement_item` (multiple lots or
  partial awards) — both are retained as separate `procurement_results`
  rows; this Spec does not assume one result per item.

## Constraints

- Depends on SPEC-006, SPEC-007, SPEC-009, and SPEC-010 — results
  cannot be meaningfully ingested before their referenced suppliers and
  procurement items exist.
- `(source, source_id)` uniqueness and provenance apply.
- Tests use recorded/synthetic fixtures, never the live service.

## Non-Goals

- Any UI display of results — that's FEAT-004/FEAT-005.
- Deriving statistics (median/average price, etc.) from results — that
  belongs to a future Analyze-pillar Feature (FEAT-006/FEAT-008 per
  PRG-001), not this ingestion Spec.
- ARP-based results — out of Program scope.

## Unresolved Questions

None.

## Sources

[[KNOW-003]] (ProcurementResult entity, relationships), [[KNOW-004]]
(provenance), [[KNOW-005]] (sync_procurement_results job), [[KNOW-006]]
/ [[KNOW-010]] (terminology precision: result ≠ overall win).
