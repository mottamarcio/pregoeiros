---
id: SPEC-012
type: spec
status: draft
parent: FEAT-002
depends_on: [SPEC-006, SPEC-007, SPEC-008]
supersedes: []
---

# SPEC-012

## Intent

Ingest practiced-price observations from Compras.gov.br's official
preços praticados module into `price_observations`, as the
`sync_prices` job — the raw, source-derived data that FEAT-006/FEAT-008
later compute Pregoeiros-derived statistics from.

## Requirements

### R1 — Price DTOs are validated and normalized into `PriceObservation`

The adapter defines a validation schema for the upstream price
response shape and a normalizer mapping it to `PriceObservation`
(`id`, `source`, `source_id`, `catalog_item_id`, `observed_at`, unit
value, and whatever dimensional fields (UF, órgão, quantidade) the
upstream data provides — per KNOW-008, applied "when supported by the
data"), provenance fields included.

### R2 — `sync_prices` upserts price observations idempotently, resolving the referenced catalog item

Same catalog-FK resolution as SPEC-010 R3: if a price observation
references a `catalog_item_id` not yet present locally, the job creates
a stub `catalog_item` row (consistent with the same user-confirmed
decision applied there), rather than skipping the observation or
failing the batch. Upserts on `(source, source_id)` via SPEC-007's
helper; re-running against unchanged data produces no duplicates.

### R3 — Every stored observation is marked as source data, never as a Pregoeiros-calculated statistic

`price_observations` rows store only what Compras.gov.br's practiced-
prices module itself reports — no median/average/quartile calculation
happens during ingestion. Those derived statistics are computed later,
at query time, by the Analyze-pillar Feature that reads this table
(KNOW-008: "Pregoeiros calculates ... mediana, média ... " is a
downstream concern, not an ingestion-time one).

### R4 — `sync_prices` checkpoints its progress

Following the same pattern as prior ingestion Specs, the job persists a
checkpoint after each committed batch.

## Acceptance Scenarios

- **Given** a recorded fixture of a price observation page referencing
  an existing catalog item, **when** `sync_prices` processes it,
  **then** the resulting `price_observations` row correctly references
  it by internal ID.
- **Given** a price observation references a catalog item not yet
  synced, **when** `sync_prices` processes it, **then** a stub
  `catalog_item` is created (same behavior as SPEC-010 R3), and the
  observation is retained rather than dropped.
- **Given** `sync_prices` runs twice against the same fixture data,
  **when** the second run completes, **then** the row count in
  `price_observations` is unchanged.
- **Given** a stored `price_observations` row, **when** inspected,
  **then** it contains no computed statistical field (no median/
  average column) — only the observed value(s) as reported upstream.

## Edge Cases

- The upstream response for a given filter combination (product/period/
  UF/órgão) returns zero observations — this is a valid, empty result,
  not an error; the job records it and moves on.
- Quantity or UF fields are absent for a given observation (not every
  filter dimension is always populated upstream, per KNOW-009 §9) —
  those columns are nullable; their absence does not block ingesting
  the observation's core price data.

## Constraints

- Depends on SPEC-006, SPEC-007, and SPEC-008 (shares the catalog-FK
  stub behavior).
- `(source, source_id)` uniqueness and provenance apply.
- PostgreSQL performs any later aggregation over this table (Constitution
  Data Invariant) — this Spec's own scope never computes aggregates.
- Tests use recorded/synthetic fixtures, never the live service.

## Non-Goals

- Computing mediana/média/mínimo/máximo/quartis or any other derived
  statistic — that is a future Analyze-pillar Feature's responsibility,
  reading from `price_observations`.
- Any UI display of price data — that's a future Feature.
- ARP-based price registries (`price_registries`/`price_registry_items`)
  — explicitly future/out of Program scope (KNOW-004).

## Unresolved Questions

None.

## Sources

[[KNOW-003]] (PriceObservation entity), [[KNOW-004]] (provenance,
future price_registries tables), [[KNOW-005]] (sync_prices job),
[[KNOW-008]] (preços praticados scope, observed-vs-derived boundary).
