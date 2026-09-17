---
id: SPEC-008
type: spec
status: draft
parent: FEAT-002
depends_on: [SPEC-006, SPEC-007]
supersedes: []
---

# SPEC-008

## Intent

Ingest the CATMAT/CATSER catalog from Compras.gov.br into
`catalog_items`, via the shared HTTP client (SPEC-006) and sync
runtime (SPEC-007), as the `sync_catalog` job.

## Requirements

### R1 — Catalog DTOs are validated and normalized into `CatalogItem`

The catalog source adapter defines a validation schema for the
upstream CATMAT/CATSER response shape (consumed by SPEC-006's R4), and
a normalizer mapping validated DTOs to the domain `CatalogItem` entity
(`id`, `source`, `source_id`, `type` [material/service], `description`,
`fetched_at`, `source_updated_at` when available), named independently
of the upstream field names/casing.

### R2 — `sync_catalog` upserts catalog items idempotently

The `sync_catalog` job fetches catalog pages via the source adapter,
normalizes each item, and upserts into `catalog_items` on
`(source, source_id)` using SPEC-007's runtime upsert helper. Running
`sync_catalog` twice in a row with unchanged upstream data results in
no duplicate rows and no unnecessary row updates (an upsert whose
values are unchanged does not need to be distinguished from a no-op by
this Spec, only that no duplicate is created).

### R3 — `sync_catalog` supports incremental fetching via SPEC-007's checkpoint

The job persists its position (e.g. last processed page or cursor) via
SPEC-007's checkpoint API after each successfully committed batch, so a
subsequent invocation resumes rather than re-fetching the entire
catalog from the start — except where a full-catalog approach is
explicitly chosen as the incremental strategy for this dataset (see
Unresolved Questions).

### R4 — Both material (CATMAT) and service (CATSER) items are ingested under one interface

`catalog_items` receives both CATMAT and CATSER records, distinguished
by a `type` column, from the same job — not two separate jobs or two
separate tables (KNOW-006: "CATMAT and CATSER appear under one unified
interface").

## Acceptance Scenarios

- **Given** a recorded fixture of a CATMAT page response, **when** the
  adapter parses it, **then** it produces `CatalogItem` objects with
  correct `id`/`type`/`description` and provenance fields, with no
  reference to the upstream DTO's own field names leaking into the
  domain entity's shape.
- **Given** `sync_catalog` runs against a fixture set of pages,
  **when** it completes, **then** `catalog_items` contains exactly one
  row per unique `(source, source_id)` across CATMAT and CATSER items
  combined.
- **Given** `sync_catalog` is run twice against the same fixture data,
  **when** the second run completes, **then** the row count in
  `catalog_items` is unchanged (idempotent).
- **Given** the upstream catalog response for a page doesn't match the
  expected schema, **when** `sync_catalog` processes that page,
  **then** the run's `sync_runs` row reflects the failure (per SPEC-007
  R1) rather than silently skipping or corrupting data.

## Edge Cases

- An upstream catalog item has no `type` field or an unrecognized value
  — the normalizer treats this as a validation failure (SPEC-006 R4),
  not a silent default to "material".
- A catalog item's `description` is empty or missing — accepted as a
  valid (if unhelpful) normalized value; description completeness is a
  data-quality concern, not a structural validation failure.

## Constraints

- Depends on SPEC-006 for HTTP/validation behavior and SPEC-007 for
  run tracking, locking, and checkpointing — this Spec does not
  reimplement either.
- Provenance fields are mandatory on every row (Constitution Data
  Invariant), inherited from SPEC-006/SPEC-007's shared patterns.
- Source adapter tests use recorded/synthetic fixtures, never the live
  Compras.gov.br service (FEAT-002 Constraints).

## Non-Goals

- Any UI display of catalog data — that's FEAT-003.
- Price statistics or historical price data for catalog items — that's
  SPEC-012 (Prices Ingestion).
- ARPs or legacy catalog data — out of Program scope.

## Unresolved Questions

- Whether the Compras.gov.br CATMAT/CATSER endpoint actually supports
  incremental (delta) fetching, or only full-catalog pagination, is not
  yet confirmed against the real API — R3 is written to accommodate
  either, but the concrete Plan must determine which the upstream API
  actually offers.

## Sources

[[KNOW-003]] (source layer, mapping pipeline), [[KNOW-004]] (provenance,
CatalogItem entity), [[KNOW-005]] (sync_catalog job), [[KNOW-006]]
(unified CATMAT/CATSER interface).
