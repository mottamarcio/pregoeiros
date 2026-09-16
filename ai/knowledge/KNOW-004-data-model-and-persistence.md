---
id: KNOW-004
type: knowledge
status: active
sources:
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
---

# KNOW-004

## Summary

PostgreSQL is both the operational and analytical database for Pregoeiros.
It stores a normalized domain model derived from upstream data, tracks
provenance for every imported record, and is accessed exclusively through a
repository layer — never directly from routes or components.

## Known Facts

- Initial logical table set (converged across PRD and architecture spec):
  `organizations`, `catalog_items`, `suppliers`, `procurements`,
  `procurement_items`, `procurement_results`, `contracts`, `contract_items`,
  `price_observations`, `favorites`, `interests`, `interest_filters`,
  `interest_matches`, `radar_events`, `sync_runs`, plus (architecture spec
  only) `sync_checkpoints`. Future modules may add `price_registries`,
  `price_registry_items`, `procurement_snapshots`, `procurement_events`,
  `legacy_procurements`.
- Domain entities (in `src/lib/domain/`) are named independently from the
  upstream API shape, e.g. `Supplier { id, document?, name }` — upstream DTO
  differences (naming, casing, nesting, nullability, legacy conventions)
  terminate at the source-adapter/normalization boundary.
- Entity relationships: `Organization` 1—* `Procurement` 1—* `ProcurementItem`
  → `CatalogItem`, and `ProcurementItem` 1—* `ProcurementResult` → `Supplier`.
  `Organization` 1—* `Contract` 1—* `ContractItem`. `CatalogItem` 1—*
  `PriceObservation`. Monitoring: `Interest` 1—* `InterestMatch` → entity;
  `Favorite` → entity; `RadarEvent` → {Interest, entity}.
- **Provenance is mandatory** on every persisted record imported from an
  external source: at minimum `source`, `source_id`, `fetched_at`; when
  available, also `source_updated_at`. Example:
  `source=comprasgov, source_id=..., source_updated_at=..., fetched_at=2026-09-16T03:04:11Z`.
  This lets Pregoeiros answer: where did this record originate, when was it
  retrieved, has upstream changed, and which source needs refreshing. It also
  prepares the architecture for additional future data sources.
- **Internal vs external IDs**: Pregoeiros uses internal DB identifiers
  independent from upstream identifiers. The pair `(source, source_id)` MUST
  be unique where the upstream entity provides a stable identifier — this
  decouples internal relationships from upstream ID format quirks.
- **Raw payload storage**: selected upstream payloads MAY be retained in
  `jsonb` (useful for debugging, migration, recovering un-normalized fields,
  auditing) but "PostgreSQL must not become an indiscriminate JSON archive" —
  fields needed for filtering, joining, sorting, analytics, or application
  behavior SHOULD be modeled as proper columns/relationships.
- **Database access is isolated behind repositories** at
  `src/lib/server/repositories/` (e.g. `procurement.repository.ts`,
  `catalog.repository.ts`, `supplier.repository.ts`, `price.repository.ts`,
  `contract.repository.ts`, `favorite.repository.ts`,
  `interest.repository.ts`, `radar.repository.ts`, `sync.repository.ts`).
  Routes MUST NOT contain arbitrary SQL; Svelte components MUST NOT access
  repositories directly; application services coordinate repositories.
- Indexes present from the start (converged list): `procurements(source,
  source_id)`, `procurements(published_at)`, `procurements(organization_id)`,
  `procurement_items(procurement_id)`, `procurement_items(catalog_item_id)`,
  `procurement_results(procurement_item_id)`,
  `procurement_results(supplier_id)`, `price_observations(catalog_item_id,
  observed_at)`, `contracts(end_date)`, `contracts(supplier_id)`,
  `favorites(entity_type, entity_id)`, `interest_matches(interest_id,
  discovered_at)`, `radar_events(created_at)`, `radar_events(seen_at)`.
  Full-text/`pg_trgm`/GIN search indexes are a later addition — no dedicated
  search engine before PostgreSQL search proves insufficient.
- Search progression is explicitly staged: Phase 1 ILIKE/normalized exact
  fields → Phase 2 PostgreSQL full-text search → Phase 3 `pg_trgm`/ranking →
  dedicated search infrastructure only if justified.
- **Schema changes MUST be migration-driven**; migrations run before the
  application depends on the new schema; deployment sequence is build →
  database available → run migrations → start application. Runtime request
  handlers must never contain implicit schema creation ("if table doesn't
  exist, CREATE TABLE...").
- Health endpoint `/api/health` distinguishes at minimum `application` and
  `database` status, and should also expose per-source status (e.g.
  `sources.comprasgov: "degraded"`) without making Compras.gov.br
  unavailability fail the main health check.
- Security boundaries: the browser must never receive DB credentials,
  upstream secrets, internal sync credentials, or unrestricted DB interfaces.
  All server-side inputs must be validated; all DB queries must be
  parameterized; Interest definitions must use a constrained schema, never
  arbitrary user-provided SQL/query expressions; external strings rendered in
  the UI are treated as untrusted data; exports must apply the same
  authorization boundaries as web views once multi-user auth exists.
- Auth/users: authentication is out of scope for validating the initial
  architecture, but Favorites/Interests/Radar are user-specific, so records
  SHOULD include a `user_id` boundary even for a single-implicit-user first
  release, to allow later migration to authenticated multi-user without
  redesigning persistence.

## Constraints

- `(source, source_id)` uniqueness is required wherever the upstream entity
  has a stable identifier.
- Analytics/aggregation belongs primarily in PostgreSQL, not in
  application-memory processing of large object graphs (see [[KNOW-008]]).
- Materialized views MAY be introduced later only for proven high-cost
  analytical queries — not a default.

## Unknowns

- ADR-005 (internal identifier format: UUID / UUIDv7 / DB-generated) is open.
- ADR-006 (Interest filter representation: normalized relational vs
  constrained JSONB) is open — PRD sketches a conceptual `jsonb`-like example
  filter (`catalogItemId`, `states`, `organizationIds`) but leaves the final
  schema undecided.
- ADR-007 (authentication provider and when multi-user auth enters scope) is
  open.

## Conflicts

None — PRD §20 and Architecture Spec §12 list near-identical table sets; the
architecture spec additionally lists `sync_checkpoints` and future tables not
named in the PRD, treated here as an extension rather than a contradiction.

## Provenance

- Table set, indexes, provenance fields: `ai/raw/product-requirements-specification.md` §19–21.
- Domain layer, provenance, internal vs external IDs, raw payload policy,
  repository isolation, indexing, security boundaries, auth/user_id:
  `ai/raw/architecture-specification.md` §10–18, §46–48, §51.

## Related Topics

[[KNOW-003]], [[KNOW-005]], [[KNOW-007]], [[KNOW-008]]
