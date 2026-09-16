---
id: SPEC-003
type: spec
status: draft
parent: FEAT-001
depends_on: [SPEC-002]
supersedes: []
---

# SPEC-003

## Intent

Establish migration-driven schema management and the initial PostgreSQL
schema covering the tables this Program needs, so that no runtime request
handler ever implicitly creates or alters schema.

## Requirements

### R1 — Schema changes are migration-driven, version-controlled, and run before app start

A migration mechanism exists. Migrations are files tracked in version
control. The deployment sequence is: build → database available → run
migrations → start application. No request handler path contains
implicit schema creation (e.g. no runtime `CREATE TABLE IF NOT EXISTS`).

### R2 — Initial migration creates the tables this Program requires

The initial migration(s) create, at minimum: `organizations`,
`catalog_items`, `suppliers`, `procurements`, `procurement_items`,
`procurement_results`, `price_observations`, `favorites`, `sync_runs`,
`sync_checkpoints`.

### R3 — Provenance columns exist on every table sourced from Compras.gov.br

`catalog_items`, `organizations`, `suppliers`, `procurements`,
`procurement_items`, `procurement_results`, and `price_observations` each
include `source`, `source_id`, and `fetched_at` columns (plus
`source_updated_at` where the upstream provides it), with a unique
constraint on `(source, source_id)`.

### R4 — Initial indexes exist from the first migration

The initial migration creates indexes for: `procurements(source,
source_id)`, `procurements(published_at)`, `procurements(organization_id)`,
`procurement_items(procurement_id)`, `procurement_items(catalog_item_id)`,
`procurement_results(procurement_item_id)`,
`procurement_results(supplier_id)`, `price_observations(catalog_item_id,
observed_at)`, `favorites(entity_type, entity_id)`.

### R5 — `favorites` and future per-user tables carry a `user_id` column

`favorites` includes a `user_id` column from its first migration, even
though the initial deployment operates with a single implicit user.

## Acceptance Scenarios

- **Given** a fresh PostgreSQL database with no schema, **when** the
  migration command runs, **then** every table in R2 exists with the
  columns/constraints from R3–R5, and the application starts successfully
  afterward.
- **Given** the migration has already run once, **when** it is run again
  against the same database, **then** it does not fail or duplicate
  schema objects (migrations are safely re-runnable/tracked).
- **Given** a developer greps the request-handling code for schema DDL,
  **when** searching for `CREATE TABLE` outside the migrations directory,
  **then** no matches are found.
- **Given** two records from the same source share the same `source_id`,
  **when** both are inserted, **then** the second insert violates the
  `(source, source_id)` unique constraint rather than silently duplicating
  the row.

## Edge Cases

- A migration fails partway through — the migration run must not leave the
  schema in a state where the application starts against a partially
  migrated database; exact rollback mechanics are a Plan-level decision but
  R1's ordering (migrate fully before start) must hold.
- Re-running migrations in an already-up-to-date database is a no-op, not
  an error.

## Constraints

- Runtime request handlers MUST NEVER contain implicit schema creation
  logic (Constitution Data Invariant).
- `(source, source_id)` MUST be unique wherever the upstream entity
  provides a stable identifier (Constitution Data Invariant).
- Internal identifiers remain independent of upstream identifier formats
  (Constitution Data Invariant) — exact PK type (UUID/UUIDv7/DB-generated)
  is left open pending ADR-005.

## Non-Goals

- Tables belonging to out-of-Program-scope features: `interests`,
  `interest_filters`, `interest_matches`, `radar_events`, `contracts`,
  `contract_items` — not created by this Spec.
- Seed/fixture data — this Spec only establishes structure, not content.
- Choice of ORM/query builder itself (Drizzle/Kysely/direct SQL) — that is
  ADR-001, resolved at Plan time, not decided by this Spec.

## Unresolved Questions

- ADR-001 (PostgreSQL access library) and ADR-002 (migration tooling)
  remain open and must be resolved before `/create-plan` can pick a
  concrete migration mechanism.
- ADR-005 (internal identifier format) remains open and determines the
  primary key type used across every table in R2.

## Sources

[[KNOW-004]] (table set, provenance columns, indexes, migration
discipline, user_id boundary), Constitution `Data Invariants` and
`Architecture Invariants`.
