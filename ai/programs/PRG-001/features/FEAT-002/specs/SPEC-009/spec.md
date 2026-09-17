---
id: SPEC-009
type: spec
status: draft
parent: FEAT-002
depends_on: [SPEC-006, SPEC-007]
supersedes: []
---

# SPEC-009

## Intent

Ingest supplier (fornecedor) records from Compras.gov.br into
`suppliers`, via SPEC-006/SPEC-007, as the `sync_suppliers` job — the
prerequisite dataset SPEC-011 (Procurement Results) upserts against
when linking a result to its winning supplier.

## Requirements

### R1 — Supplier DTOs are validated and normalized into `Supplier`

The supplier source adapter defines a validation schema for the
upstream supplier response shape and a normalizer mapping validated
DTOs to the domain `Supplier` entity (`id`, `source`, `source_id`,
`document` [CNPJ, optional per KNOW-003's example], `name`,
provenance fields).

### R2 — `sync_suppliers` upserts suppliers idempotently

The `sync_suppliers` job fetches supplier pages, normalizes each, and
upserts into `suppliers` on `(source, source_id)` via SPEC-007's
runtime upsert helper, with the same idempotency guarantee as SPEC-008
R2.

### R3 — `sync_suppliers` checkpoints its progress

Following the same pattern as SPEC-008 R3, the job persists a
checkpoint after each committed batch so re-invocation resumes rather
than restarting.

## Acceptance Scenarios

- **Given** a recorded fixture of a supplier page response, **when**
  the adapter parses it, **then** it produces `Supplier` objects with
  correct `document`/`name` and provenance fields.
- **Given** `sync_suppliers` runs twice against the same fixture data,
  **when** the second run completes, **then** the row count in
  `suppliers` is unchanged (idempotent).
- **Given** two different upstream pages reference the same supplier
  `source_id` (e.g. due to pagination overlap), **when** both are
  processed, **then** exactly one `suppliers` row exists for that
  `source_id`.

## Edge Cases

- A supplier record has no `document` (CNPJ) — accepted as valid,
  since KNOW-003's own example entity marks `document` optional; a
  supplier is still identifiable via `(source, source_id)`.
- The same supplier CNPJ appears under two different upstream
  `source_id`s — this Spec does not require deduplication by CNPJ;
  `(source, source_id)` remains the uniqueness key, consistent with
  Constitution Data Invariants. Deduplication by document is out of
  scope here.

## Constraints

- Depends on SPEC-006 and SPEC-007, same as SPEC-008.
- Provenance fields mandatory on every row.
- Tests use recorded/synthetic fixtures, never the live service.

## Non-Goals

- Any UI display of supplier data — that's FEAT-005.
- Linking a supplier to specific procurement results — that's SPEC-011,
  which depends on this Spec's output existing.
- Supplier scoring, risk classification, or ranking — explicitly out of
  Program architecture scope (KNOW-003 non-goals).

## Unresolved Questions

None.

## Sources

[[KNOW-003]] (Supplier entity example, source layer), [[KNOW-004]]
(provenance), [[KNOW-005]] (sync_suppliers job).
