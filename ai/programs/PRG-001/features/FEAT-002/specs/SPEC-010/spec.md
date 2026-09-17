---
id: SPEC-010
type: spec
status: draft
parent: FEAT-002
depends_on: [SPEC-006, SPEC-007, SPEC-008]
supersedes: []
---

# SPEC-010

## Intent

Ingest procurement (contratação) processes and their items from
Compras.gov.br into `procurements`/`procurement_items`, as the
`sync_procurements` job, including organizations as a side effect and a
defined resolution for items that reference a not-yet-synced catalog
item.

## Requirements

### R1 — Procurement and organization DTOs are validated and normalized

The adapter defines validation schemas for the upstream
procurement/organization response shapes, and normalizers mapping them
to `Procurement` (`id`, `source`, `source_id`, `organization_id`,
`published_at`, provenance fields, and the fields needed for the
Explorar listing/detail views per KNOW-006: objeto, UASG, processo,
modalidade, valor estimado, situação) and `Organization` entities.

### R2 — `sync_procurements` upserts procurements, items, and organizations idempotently

The job upserts `organizations` (on `(source, source_id)`), then
`procurements` (referencing the resolved `organization_id`), then
`procurement_items` (referencing the resolved `procurement_id` and
`catalog_item_id`), all via SPEC-007's upsert helper. Re-running the
job against unchanged upstream data produces no duplicate rows in any
of the three tables.

### R3 — A procurement item referencing an unsynced catalog item creates a stub `catalog_item`

When a `procurement_item`'s upstream data references a CATMAT/CATSER
code that does not yet exist in `catalog_items`, the job inserts a
minimal stub `catalog_item` row for it (`source`, `source_id`, and
whatever fields the procurement payload itself provides — at minimum
enough to satisfy the FK and be identifiable) rather than skipping the
item or failing the batch. A subsequent `sync_catalog` run (SPEC-008)
upserts that same `(source, source_id)` normally, filling in the
complete record without creating a duplicate.

### R4 — `sync_procurements` checkpoints its progress

Following the same pattern as SPEC-008 R3, the job persists a
checkpoint after each committed batch.

## Acceptance Scenarios

- **Given** a recorded fixture of a procurement page referencing a
  catalog item already present in `catalog_items`, **when**
  `sync_procurements` processes it, **then** the resulting
  `procurement_items` row's `catalog_item_id` correctly references the
  existing row — no stub is created.
- **Given** a recorded fixture of a procurement item referencing a
  CATMAT code not present in `catalog_items`, **when**
  `sync_procurements` processes it, **then** a stub `catalog_item` row
  is created for that `(source, source_id)`, and the `procurement_item`
  row references it successfully.
- **Given** a stub `catalog_item` created by `sync_procurements`,
  **when** `sync_catalog` (SPEC-008) subsequently runs and encounters
  the same `(source, source_id)`, **then** it upserts (updates) that
  same row with the full catalog data rather than creating a duplicate.
- **Given** `sync_procurements` runs twice against the same fixture
  data, **when** the second run completes, **then** row counts in
  `organizations`, `procurements`, and `procurement_items` are all
  unchanged.

## Edge Cases

- A procurement references an organization not yet seen — the job
  upserts the organization first, within the same transaction/batch as
  the procurement that references it (or a preceding one), never
  leaving a procurement with a dangling `organization_id`.
- A stub `catalog_item`'s minimal data (e.g. no `type`) does not yet
  satisfy SPEC-008 R1's normal validation expectations — this is
  acceptable specifically for stub rows created via this path; SPEC-008
  R2's upsert on the same `(source, source_id)` is what brings the row
  to full validity, not a violation of SPEC-008 itself.

## Constraints

- Depends on SPEC-006, SPEC-007, and SPEC-008 (stub rows must land in
  the same `catalog_items` table and schema SPEC-008 also writes to).
- `(source, source_id)` uniqueness and provenance apply to all three
  written tables.
- Tests use recorded/synthetic fixtures, never the live service.

## Non-Goals

- Procurement results (homologated outcomes/winning suppliers) —
  that's SPEC-011.
- Any UI display of procurement data — that's FEAT-004.
- Contracts (`sync_contracts`) — out of Program scope.

## Unresolved Questions

None — the catalog-FK resolution strategy (R3) reflects the
user-confirmed decision.

## Sources

[[KNOW-003]] (Procurement/ProcurementItem entities, mapping pipeline),
[[KNOW-004]] (provenance, table set, relationships), [[KNOW-005]]
(sync_procurements job), [[KNOW-006]] (Contratações fields/UI needs
that shape which fields the normalizer must retain).
