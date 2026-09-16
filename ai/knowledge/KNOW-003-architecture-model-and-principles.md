---
id: KNOW-003
type: knowledge
status: active
sources:
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
---

# KNOW-003

## Summary

Pregoeiros is architected as a **modular monolith** adopting a **local read
model**: it asynchronously ingests and normalizes Compras.gov.br data into
PostgreSQL, and nearly all web requests are served from PostgreSQL rather
than proxying the upstream API live. The guiding rule is that external API
schemas must never become the application's domain model.

## Known Facts

- Three primary architectural actors: User → Pregoeiros → {PostgreSQL,
  Compras.gov.br}. The browser must never talk to Compras.gov.br directly;
  ALL external API communication happens server-side (centralizes error
  handling, retries/timeouts, provenance, normalization, caching, historical
  persistence, and protects the frontend from upstream schema leakage).
- Primary architectural flow: External Source → Source Adapter → Domain/
  Application Services → Repository → PostgreSQL, then SvelteKit Routes →
  Svelte Components. Background ingestion flow: Scheduler → Sync Job →
  Source Adapter → Normalization → Repository → PostgreSQL → {Interest
  Processing, Radar Events, Historical Analytics}.
- Dependency direction points inward: UI → Routes/Actions → Services →
  {Repositories, Sources} → {PostgreSQL, Compras.gov}. Forbidden dependencies:
  domain → Svelte component; repository → Svelte route; source adapter → UI;
  Svelte component → database; Svelte component → Compras.gov directly.
- Layer locations: source adapters at `src/lib/server/sources/comprasgov/`
  (client.ts, errors.ts, pagination.ts, dto/, plus one file per resource type:
  catalog.ts, procurements.ts, results.ts, suppliers.ts, prices.ts,
  contracts.ts, arps.ts, legacy.ts); domain entities at `src/lib/domain/`;
  repositories at `src/lib/server/repositories/`; services at
  `src/lib/server/services/`; jobs under `src/lib/server/jobs/`.
- Mapping rule for the source layer: API endpoint → DTO → normalizer → domain
  entity → repository. Never: API endpoint → JSON → Svelte component
  directly.
- A shared server-side `HttpClient` abstraction must support `AbortSignal`,
  timeouts, structured errors, and bounded retries with observability
  metadata. Retries should happen only for transient failures (connection
  reset, appropriate timeouts, HTTP 429/502/503/504) using exponential
  backoff with jitter, and must respect `Retry-After` when present. Ordinary
  client errors (400, 404) must not be retried. The app must not invent an
  undocumented upstream rate limit.
- Architectural Decision — **Local Read Model**: Compras.gov → (async sync) →
  PostgreSQL → (normal web requests) → Pregoeiros. Benefits: historical
  analysis, fast filtering, cross-entity joins, Radar, Interests, resilience
  to upstream downtime, lower upstream request volume, reproducible
  analytics. Trade-off: data may lag upstream, so the UI must expose data
  freshness (see [[KNOW-010]]).
- Architectural Decision — **Modular Monolith**: justified by one product,
  one primary database, shared domain, small operational footprint,
  substantial transactional relationships, and no demonstrated independent
  scaling requirement. Modules are source-code boundaries, not network
  services; background ingestion jobs may later be extracted to a separate
  worker process without changing the domain model if needed.
- Architectural Decision — **PostgreSQL before additional infrastructure**:
  PostgreSQL should initially cover persistence, analytics, full-text search,
  locking, transactions, uniqueness/idempotency, and job checkpoints.
  Introducing Redis, a queue system, a search engine, object storage, or an
  analytical warehouse requires an ADR and a measured/demonstrated need.
- Architectural Decision — **Source-agnostic domain**: domain entities must be
  named generically (`Procurement`, `Supplier`, `CatalogItem`, `Contract`),
  never `ComprasGovProcurement`/`ComprasGovSupplier` outside the source
  adapter — this leaves room for future sources such as "Portal CP".
- Architectural Decision — **Historical truth vs current truth**: the app
  must not assume the current API response answers every historical
  question; it distinguishes current normalized entity, historical
  observations, and recorded changes — especially for prices, procurement
  status, results, and contract lifecycle (see [[KNOW-004]], [[KNOW-008]]).
- Architecture quality attributes explicitly called out: maintainability,
  reliability, performance, resilience, traceability, testability,
  portability, accessibility, simplicity.
- Recommended MVP build order (the "one complete architectural slice" over
  "every route" principle): CATMAT → catalog sync → catalog_items →
  `/produtos` → `/produtos/:id` → favorite; then Procurements → Items →
  Results → Suppliers; then Prices → Historical analytics; then Interests →
  Radar.

## Constraints

- All external API communication MUST happen server-side; no direct
  browser → Compras.gov.br requests (MVP constraint #10 in the architecture
  spec, see [[KNOW-002]]).
- The application MUST prefer degraded read availability over complete
  failure when local data exists (see [[KNOW-005]] failure model).
- The architecture should remain understandable by a small engineering team
  without requiring a distributed-systems stack.

## Unknowns

- Exact triggers/thresholds for when PostgreSQL is considered "a measured
  bottleneck" justifying additional infrastructure are not defined.
- Internal identifier format (UUID vs UUIDv7 vs DB-generated) is an open ADR
  (ADR-005).

## Conflicts

None identified — architecture spec is the authoritative elaboration of
principles the PRD states more informally (e.g., "não criaria inicialmente um
backend Go separado").

## Provenance

- System context, layering, dependency direction, HTTP client rules:
  `ai/raw/architecture-specification.md` §5–9, §57.
- Architectural decisions (local read model, modular monolith, PostgreSQL
  first, source-agnostic domain, historical vs current truth):
  `ai/raw/architecture-specification.md` §61–65.
- MVP build order and quality attributes: `ai/raw/architecture-specification.md` §67–69.
- PRD confirmation of "no separate Go backend": `ai/raw/product-requirements-specification.md` §3.

## Related Topics

[[KNOW-001]], [[KNOW-002]], [[KNOW-004]], [[KNOW-005]], [[KNOW-011]]
