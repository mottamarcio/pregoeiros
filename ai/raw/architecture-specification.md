# Pregoeiros — Architecture Specification

**Status:** Draft
**Version:** 0.1
**Last updated:** September 2026
**Product:** Pregoeiros
**Primary data source:** Compras.gov.br — Dados Abertos

---

## 1. Purpose

This document defines the software architecture for **Pregoeiros**, a web application for exploring, monitoring, and analyzing Brazilian public procurement data.

Pregoeiros consumes public procurement data from the Compras.gov.br Open Data APIs, normalizes relevant records into a local PostgreSQL database, and exposes them through a SvelteKit web application.

The architecture is designed around three product capabilities:

1. **Explore** — search and inspect procurements, catalog items, suppliers, prices, contracts, and related public procurement data.
2. **Monitor** — follow specific entities through Favorites and monitor reusable search criteria through Interests and Radar.
3. **Analyze** — query historical procurement data, price observations, suppliers, products, buyers, and results.

The system is not intended to be a thin HTTP proxy or a visual wrapper around the Compras.gov.br Swagger API.

Pregoeiros owns a normalized application model and uses upstream APIs as data sources.

---

# 2. Architectural Goals

The architecture MUST optimize for:

* simple self-hosting;
* reproducible local development;
* reliable historical data collection;
* transparent provenance of imported data;
* efficient analytical queries;
* graceful degradation when Compras.gov.br is unavailable;
* incremental synchronization;
* idempotent background jobs;
* server-side rendering;
* responsive web interfaces;
* low operational complexity;
* explicit boundaries between upstream DTOs, domain models, persistence, and UI.

The architecture SHOULD remain understandable by a small engineering team without requiring a distributed-systems stack.

The architecture SHOULD prefer PostgreSQL and SvelteKit capabilities before introducing additional infrastructure.

---

# 3. Non-Goals

The initial architecture does not target:

* microservices;
* Kubernetes;
* event streaming infrastructure;
* Redis;
* Elasticsearch;
* a separate Go backend;
* a native mobile application;
* real-time bidding;
* procurement submission workflows;
* supplier scoring or automated risk classification;
* machine-learning infrastructure;
* a complete replica of every Compras.gov.br dataset.

Additional infrastructure may be introduced later when justified by measured requirements.

---

# 4. Technology Stack

## 4.1 Application

The application stack is:

* **Svelte 5**
* **SvelteKit**
* **TypeScript**
* **Tailwind CSS**
* **Iconify**

SvelteKit provides both the web application and the server-side application layer.

A separate backend service is not required for the initial architecture.

---

## 4.2 Database

**PostgreSQL** is the primary persistence layer.

PostgreSQL stores:

* normalized upstream procurement data;
* historical observations;
* synchronization state;
* application state;
* favorites;
* interests;
* radar events;
* derived analytical data where appropriate.

PostgreSQL runs in Docker for development and self-hosted deployments.

---

## 4.3 Infrastructure

The initial deployment topology is:

```text
┌──────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
│                                                          │
│  ┌─────────────────────┐       ┌──────────────────────┐  │
│  │     Pregoeiros      │       │      PostgreSQL      │  │
│  │                     │       │                      │  │
│  │ SvelteKit           │──────►│ normalized data      │  │
│  │ background jobs     │       │ historical data      │  │
│  │ web application     │       │ application state    │  │
│  └──────────┬──────────┘       └──────────────────────┘  │
│             │                                            │
└─────────────┼────────────────────────────────────────────┘
              │
              │ HTTPS
              ▼
┌─────────────────────────────┐
│ Compras.gov.br Open Data API│
└─────────────────────────────┘
```

In local development, PostgreSQL MAY run in Docker while the SvelteKit development server runs directly on the host.

---

# 5. System Context

Pregoeiros has three primary architectural actors:

```text
                     ┌──────────────┐
                     │     User     │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Pregoeiros  │
                     └──────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌──────────────┐           ┌────────────────┐
       │  PostgreSQL  │           │ Compras.gov.br │
       └──────────────┘           └────────────────┘
```

The browser SHOULD NOT communicate directly with Compras.gov.br.

All external API communication MUST happen server-side.

This provides:

* consistent upstream error handling;
* centralized retries and timeouts;
* provenance tracking;
* normalization;
* caching;
* historical persistence;
* protection from upstream schema leakage into the frontend.

---

# 6. Architectural Model

Pregoeiros uses a modular monolith architecture.

The primary flow is:

```text
External Source
      │
      ▼
Source Adapter
      │
      ▼
Domain / Application Services
      │
      ├──────────────► Repository
      │                    │
      │                    ▼
      │                PostgreSQL
      │
      ▼
SvelteKit Routes
      │
      ▼
Svelte Components
```

Background ingestion follows:

```text
Scheduler
   │
   ▼
Sync Job
   │
   ▼
Source Adapter
   │
   ▼
Normalization
   │
   ▼
Repository
   │
   ▼
PostgreSQL
   │
   ├──► Interest Processing
   │
   ├──► Radar Events
   │
   └──► Historical Analytics
```

The important architectural rule is:

> External API schemas must not become the application's domain model.

---

# 7. Application Layers

## 7.1 Source Layer

Location:

```text
src/lib/server/sources/
```

Initial source:

```text
src/lib/server/sources/comprasgov/
```

Responsibilities:

* HTTP communication;
* endpoint definitions;
* request parameter serialization;
* upstream pagination;
* DTO definitions;
* upstream error decoding;
* timeout handling;
* retry handling;
* response validation where required.

Example structure:

```text
comprasgov/
├── client.ts
├── errors.ts
├── pagination.ts
├── dto/
│   ├── catalog.ts
│   ├── procurement.ts
│   ├── supplier.ts
│   ├── contract.ts
│   └── price.ts
├── catalog.ts
├── procurements.ts
├── results.ts
├── suppliers.ts
├── prices.ts
├── contracts.ts
├── arps.ts
└── legacy.ts
```

No Svelte component or route should know the shape of these DTOs.

---

# 8. Compras.gov.br Integration

The initial source adapter will support the API modules required by product functionality.

The currently identified relevant areas include:

* CATMAT;
* CATSER;
* procurement/contracting records;
* procurement items;
* item results;
* practiced prices;
* suppliers;
* contracts;
* ARPs;
* legacy procurement data.

Not every available endpoint needs to be implemented.

Endpoints MUST be introduced according to product requirements.

The mapping should follow:

```text
API endpoint
     ↓
DTO
     ↓
normalizer
     ↓
domain entity
     ↓
repository
```

Never:

```text
API endpoint
     ↓
JSON
     ↓
Svelte component
```

---

# 9. HTTP Client

A shared server-side HTTP client abstraction should handle common upstream behavior.

Conceptually:

```ts
interface HttpClient {
  request<T>(
    request: HttpRequest,
    options?: RequestOptions
  ): Promise<T>;
}
```

Every upstream request MUST support:

* `AbortSignal`;
* timeout;
* structured errors;
* bounded retries;
* observability metadata.

Retries SHOULD occur only for transient failures such as:

* connection reset;
* timeout where retry is appropriate;
* HTTP 429;
* HTTP 502;
* HTTP 503;
* HTTP 504.

Retries SHOULD use exponential backoff with jitter.

The client MUST NOT automatically retry ordinary client errors such as HTTP 400 or 404.

If `Retry-After` is returned, the client SHOULD respect it where practical.

The application MUST NOT invent an upstream rate limit when one is not documented.

---

# 10. Domain Layer

Location:

```text
src/lib/domain/
```

The domain layer defines concepts understood by Pregoeiros rather than Compras.gov.br.

Initial entities include:

```text
CatalogItem
Organization
Supplier

Procurement
ProcurementItem
ProcurementResult

Contract
ContractItem

PriceObservation

Favorite
Interest
InterestMatch
RadarEvent
```

Example:

```ts
export interface Supplier {
  id: string;
  document?: string;
  name: string;
}
```

The actual upstream DTO may contain different names, casing, nesting, nullability, or legacy conventions.

Those differences terminate at the source adapter/normalization boundary.

---

# 11. Provenance

Every persisted record imported from an external source MUST retain sufficient provenance.

At minimum:

```text
source
source_id
fetched_at
```

When available:

```text
source_updated_at
```

Example:

```text
source              comprasgov
source_id           ...
source_updated_at   ...
fetched_at          2026-09-16T03:04:11Z
```

This allows Pregoeiros to answer:

* where did this record originate?
* when did we retrieve it?
* has upstream changed?
* which source should be refreshed?

This also prepares the architecture for additional procurement data sources later.

---

# 12. Database Architecture

PostgreSQL is both the operational and analytical database.

Initial logical model:

```text
organizations

catalog_items

suppliers

procurements
procurement_items
procurement_results

contracts
contract_items

price_observations

favorites

interests
interest_filters
interest_matches

radar_events

sync_runs
sync_checkpoints
```

Future modules may introduce:

```text
price_registries
price_registry_items

procurement_snapshots
procurement_events

legacy_procurements
```

---

# 13. Primary Entity Relationships

Conceptually:

```text
Organization
     │
     ├──────────< Procurement
     │                 │
     │                 └────< ProcurementItem
     │                            │
     │                            ├──► CatalogItem
     │                            │
     │                            └────< ProcurementResult
     │                                      │
     │                                      ▼
     │                                   Supplier
     │
     └──────────< Contract
                       │
                       └────< ContractItem
```

Price history:

```text
CatalogItem
     │
     └────< PriceObservation
```

Monitoring:

```text
Interest
   │
   └────< InterestMatch
              │
              └──► entity

Favorite
   │
   └──► entity

RadarEvent
   │
   ├──► Interest
   └──► entity
```

---

# 14. External IDs vs Internal IDs

Pregoeiros SHOULD use internal database identifiers independently from external identifiers.

For example:

```text
procurements

id                UUID / internal key
source            comprasgov
source_id         upstream identifier
...
```

The combination:

```text
(source, source_id)
```

MUST be unique where the upstream entity provides a stable identifier.

This avoids coupling internal relationships to an upstream identifier format.

---

# 15. Raw Payload Storage

Pregoeiros MAY retain selected upstream payloads in `jsonb`.

This is useful for:

* debugging;
* migration;
* recovering fields not originally normalized;
* auditing source transformations.

However:

> PostgreSQL must not become an indiscriminate JSON archive.

Fields required for:

* filtering;
* joining;
* sorting;
* analytics;
* application behavior

SHOULD be modeled as proper columns and relationships.

---

# 16. Database Access

Database access MUST be isolated behind repositories.

Location:

```text
src/lib/server/repositories/
```

Examples:

```text
procurement.repository.ts
catalog.repository.ts
supplier.repository.ts
price.repository.ts
contract.repository.ts
favorite.repository.ts
interest.repository.ts
radar.repository.ts
sync.repository.ts
```

Routes MUST NOT contain arbitrary SQL.

Svelte components MUST NOT access repositories.

Application services coordinate repositories.

---

# 17. Query Strategy

Pregoeiros is expected to become increasingly analytics-heavy.

For this reason, the persistence technology should preserve access to expressive SQL.

The selected database library SHOULD:

* support migrations;
* support parameterized SQL;
* provide good TypeScript types;
* not make complex analytical queries unnecessarily difficult.

Drizzle, Kysely, or direct typed SQL are acceptable candidates.

The final choice is an implementation-level ADR.

An ORM that encourages loading large object graphs into application memory SHOULD be avoided for analytics.

Aggregation belongs primarily in PostgreSQL.

---

# 18. Indexing Strategy

Indexes must follow observed query patterns, but important access paths should exist from the beginning.

Examples:

```text
procurements(source, source_id)
procurements(published_at)
procurements(organization_id)

procurement_items(procurement_id)
procurement_items(catalog_item_id)

procurement_results(procurement_item_id)
procurement_results(supplier_id)

price_observations(catalog_item_id, observed_at)

contracts(end_date)
contracts(supplier_id)

favorites(entity_type, entity_id)

interest_matches(interest_id, discovered_at)

radar_events(created_at)
radar_events(seen_at)
```

Search indexes may later use PostgreSQL:

* full-text search;
* `pg_trgm`;
* GIN indexes.

A dedicated search service should not be introduced before PostgreSQL search proves insufficient.

---

# 19. Application Services

Location:

```text
src/lib/server/services/
```

Services implement use cases.

Examples:

```text
search.service.ts
procurement.service.ts
catalog.service.ts
supplier.service.ts
price.service.ts
contract.service.ts

favorite.service.ts
interest.service.ts
radar.service.ts
history.service.ts

sync.service.ts
```

For example:

```text
HistoryService
     │
     ├── PriceRepository
     ├── SupplierRepository
     ├── ProcurementRepository
     └── CatalogRepository
```

A service may combine multiple repositories without exposing database details to the route.

---

# 20. SvelteKit Route Architecture

Routes represent web resources and navigation.

Initial structure:

```text
src/routes/
├── +layout.svelte
├── +layout.server.ts
├── +page.svelte
├── +page.server.ts
│
├── contratacoes/
│   ├── +page.svelte
│   ├── +page.server.ts
│   └── [id]/
│
├── produtos/
│   ├── +page.svelte
│   └── [id]/
│
├── fornecedores/
│   ├── +page.svelte
│   └── [id]/
│
├── contratos/
│   ├── +page.svelte
│   └── [id]/
│
├── precos/
├── historico/
├── favoritos/
├── interesses/
├── radar/
├── settings/
└── api/
    └── health/
```

Routes SHOULD remain thin.

A `+page.server.ts` typically:

1. validates URL parameters;
2. calls an application service;
3. returns a view model.

It SHOULD NOT contain:

* raw SQL;
* upstream HTTP implementation;
* synchronization logic;
* substantial business rules.

---

# 21. SSR Strategy

Server-side rendering is the default.

A page request generally follows:

```text
Browser
   │
   ▼
SvelteKit route
   │
   ▼
Application service
   │
   ▼
PostgreSQL
   │
   ▼
SSR HTML
```

This provides:

* fast initial rendering;
* shareable URLs;
* progressive enhancement;
* reduced browser-side complexity.

Client-side requests should be introduced where they materially improve UX.

Examples:

* autocomplete;
* interactive filters;
* pagination;
* favorite toggles;
* interest editing;
* marking Radar events as read;
* analytical visualizations.

Pregoeiros SHOULD NOT become a client-only SPA by default.

---

# 22. URL State

Shareable search state belongs in the URL.

Example:

```text
/contratacoes?uf=RJ&produto=123&pagina=2
```

Historical analysis:

```text
/historico/precos?produto=123&desde=2025-01-01&ate=2026-09-16
```

Appropriate URL state includes:

* search term;
* filters;
* sort;
* page;
* date range;
* selected analytical dimension.

Ephemeral UI state should remain client-side.

---

# 23. Pagination

Large datasets MUST be paginated server-side.

The browser must not receive thousands of records merely to filter them locally.

Standard page sizes should generally remain between 20 and 50 records.

For analytical views, PostgreSQL SHOULD calculate aggregates directly.

Cursor pagination MAY replace offset pagination where dataset size or update patterns justify it.

---

# 24. Search Architecture

Initial search uses PostgreSQL.

Search progression:

```text
Phase 1
ILIKE / normalized exact fields

      ↓

Phase 2
PostgreSQL full-text search

      ↓

Phase 3
pg_trgm / ranking improvements

      ↓

Dedicated search infrastructure
only if justified
```

Global search should eventually search across:

* catalog items;
* suppliers;
* procurements;
* contracts.

Results should be grouped by entity type.

---

# 25. Favorites Architecture

Favorites represent explicit entities selected by the user.

Supported entity types initially:

```text
catalog_item
procurement
supplier
contract
```

Conceptual schema:

```text
favorites

id
user_id
entity_type
entity_id
created_at
```

The application service MUST validate that the referenced entity exists.

Favorite behavior should not be mixed with Interest behavior.

A Favorite means:

> Follow this exact entity.

An Interest means:

> Find entities matching these criteria.

---

# 26. Interests Architecture

Interests are persisted matching rules.

Conceptually:

```text
interests

id
user_id
name
enabled
created_at
updated_at
last_processed_at
```

Filters may initially be represented relationally or as a constrained `jsonb` schema.

Example logical filter:

```json
{
  "catalogItemId": "...",
  "states": ["RJ"],
  "organizationIds": []
}
```

The schema MUST be validated by application code.

Arbitrary user-provided SQL or query expressions are forbidden.

---

# 27. Interest Matching

Interest processing occurs after relevant synchronization jobs.

```text
sync procurements
       │
       ▼
new/changed entities
       │
       ▼
process interests
       │
       ▼
InterestMatch
       │
       ▼
RadarEvent
```

The system SHOULD process only records introduced or materially changed since the previous processing checkpoint.

It SHOULD NOT repeatedly scan the complete procurement history for every Interest.

Matches MUST be idempotent.

A uniqueness rule should prevent:

```text
same interest
+
same entity
+
same matching event
```

from generating duplicate Radar entries.

---

# 28. Radar Architecture

Radar is a persistent event inbox.

Example event types:

```text
interest_match
favorite_updated
procurement_result_published
contract_expiring
```

Conceptual schema:

```text
radar_events

id
user_id
event_type

entity_type
entity_id

interest_id nullable
favorite_id nullable

created_at
seen_at

metadata jsonb
```

`metadata` stores presentation-supporting event information, not the canonical entity itself.

The UI always resolves canonical data from the appropriate entity tables.

---

# 29. Historical Data Strategy

Pregoeiros distinguishes three concepts:

### Current state

The latest normalized representation of an entity.

Example:

```text
procurements
```

### Observation

An externally observed fact such as a practiced price.

Example:

```text
price_observations
```

### Change history

A record that an entity materially changed over time.

Example future tables:

```text
procurement_events
procurement_snapshots
```

The application SHOULD NOT create daily snapshots for unchanged entities.

Where snapshots are introduced, content hashing can prevent duplicate state storage.

---

# 30. Analytics Architecture

Analytics queries run primarily against PostgreSQL.

Example:

```text
Browser
   │
   ▼
/historico/precos
   │
   ▼
HistoryService
   │
   ▼
PriceRepository
   │
   ▼
SELECT
  percentile_cont(...),
  avg(...),
  min(...),
  max(...),
  count(...)
FROM ...
```

Large datasets SHOULD NOT be loaded into Node.js merely to calculate aggregates.

PostgreSQL should calculate:

* counts;
* sums;
* averages;
* percentiles;
* grouping;
* ranking;
* time buckets.

Application code transforms query results into view models.

---

# 31. Derived Metrics

Pregoeiros may calculate derived metrics including:

* mean price;
* median price;
* minimum;
* maximum;
* quartiles;
* result counts;
* supplier counts;
* buyer counts;
* time-series aggregations.

Derived metrics MUST be distinguishable from fields supplied directly by Compras.gov.br.

Terminology MUST accurately reflect the underlying unit.

For example, the application must not label:

```text
37 procurement item results
```

as:

```text
37 licitações vencidas
```

unless the underlying data actually establishes that relationship.

---

# 32. Synchronization Architecture

Synchronization is responsible for maintaining the local representation of upstream data.

Initial jobs:

```text
sync_catalog
sync_procurements
sync_procurement_results
sync_prices
sync_suppliers
sync_contracts
sync_arps
process_interests
```

Jobs MUST be:

* idempotent;
* restartable;
* observable;
* bounded;
* safe to execute repeatedly.

---

# 33. Sync Run State

Every job execution is recorded.

Conceptual schema:

```text
sync_runs

id
job
status

started_at
finished_at

records_read
records_created
records_updated

pages_processed

error_code
error_message
```

Possible states:

```text
running
succeeded
failed
partial
```

---

# 34. Sync Checkpoints

Incremental jobs require checkpoints.

Conceptually:

```text
sync_checkpoints

job
cursor
updated_at
```

The cursor may represent:

* timestamp;
* upstream page;
* upstream identifier;
* compound position.

Checkpoint semantics depend on the corresponding API endpoint.

A checkpoint MUST only advance after the associated data has been safely persisted.

---

# 35. Transactions and Idempotency

Each synchronization batch SHOULD be transactional where practical.

Typical flow:

```text
fetch page
    │
    ▼
begin transaction
    │
    ├── upsert entities
    ├── update relationships
    ├── record changes
    └── update checkpoint
    │
    ▼
commit
```

If the transaction fails, the checkpoint must not move forward.

Upserts SHOULD rely on stable unique constraints such as:

```text
(source, source_id)
```

rather than application-side existence checks.

---

# 36. Scheduling

Pregoeiros does not require a dedicated queue infrastructure for the MVP.

Jobs may be invoked by:

* cron;
* Docker scheduler pattern;
* host scheduler;
* deployment platform scheduler.

Example schedule:

```text
03:00  sync_procurements
03:10  sync_procurement_results
03:20  sync_prices
03:30  sync_contracts
03:45  process_interests
```

Exact frequencies remain configuration.

The application MUST NOT depend on jobs executing at an exact second.

A missed job should be recoverable during the next execution.

---

# 37. Concurrent Job Protection

The system MUST prevent accidental concurrent execution of the same synchronization job.

PostgreSQL advisory locks are preferred initially.

Conceptually:

```text
job starts
    │
    ▼
pg_try_advisory_lock(job)
    │
    ├── false → another worker owns job → exit
    │
    └── true
           │
           ▼
         execute
           │
           ▼
       release lock
```

This avoids introducing Redis solely for distributed locks.

---

# 38. Bootstrap

Historical bootstrap is distinct from incremental synchronization.

```text
bootstrap
   │
   ├── historical procurements
   ├── results
   ├── prices
   ├── suppliers
   └── contracts
```

Bootstrap MUST be resumable.

It SHOULD operate in bounded batches.

Progress SHOULD be persisted.

Bootstrap and incremental synchronization SHOULD use the same normalization and persistence paths wherever possible.

We should not maintain two independent import implementations.

---

# 39. Data Freshness

Every major dataset should expose freshness metadata.

Example:

```text
Contratações
Atualizado há 14 minutos

Preços
Atualizado há 3 horas
```

The application should distinguish:

```text
fresh
stale
sync failed
never synchronized
```

An upstream outage should normally make data **stale**, not make the entire application unavailable.

---

# 40. Failure Model

Pregoeiros assumes Compras.gov.br can be temporarily:

* unavailable;
* slow;
* rate limited;
* inconsistent;
* partially unavailable.

Therefore:

```text
Compras.gov unavailable
        │
        ▼
sync fails / retries
        │
        ▼
existing PostgreSQL data remains available
        │
        ▼
UI displays freshness warning
```

The application MUST prefer degraded read availability over complete failure when local data exists.

---

# 41. UI Architecture

Reusable UI components live under:

```text
src/lib/components/
```

Suggested structure:

```text
components/
├── ui/
│   ├── Button.svelte
│   ├── Badge.svelte
│   ├── Input.svelte
│   ├── Select.svelte
│   ├── Dialog.svelte
│   ├── Drawer.svelte
│   ├── Tooltip.svelte
│   └── ...
│
├── layout/
│   ├── AppHeader.svelte
│   ├── AppSidebar.svelte
│   └── PageHeader.svelte
│
├── tables/
│   ├── DataTable.svelte
│   └── Pagination.svelte
│
└── charts/
```

Components SHOULD receive presentation-oriented data.

They SHOULD NOT know about repositories, source adapters, or upstream API DTOs.

---

# 42. Svelte 5 State

Svelte 5 runes should be used idiomatically for local interactive state.

Server data remains primarily controlled through SvelteKit loaders/actions.

Avoid creating a global client-side store for data already represented by:

* URL state;
* server data;
* database state.

Client state should focus on things such as:

* open/closed UI state;
* selected temporary rows;
* local input state;
* temporary visualization settings.

---

# 43. Styling

Tailwind CSS is the styling system.

MVP supports light theme only.

Primary palette:

```text
background       white
surface          slate-50
border           slate-200
text             slate-950
muted            slate-500 / slate-600

accent           slate-900
accent-foreground white
```

Semantic colors MAY use appropriate Tailwind palettes:

```text
success     emerald
warning     amber
error       red
info        blue
```

The design should prioritize:

* density without clutter;
* readable tables;
* clear hierarchy;
* restrained use of color;
* strong filtering UX;
* accessible contrast.

---

# 44. Icons

Iconify is the icon abstraction.

Icons MUST NOT encode essential information without accessible text or labels.

Common concepts include:

```text
search
filter
star
bookmark
building
package
history
chart
file
download
refresh
settings
external-link
```

A consistent icon collection SHOULD be selected rather than mixing unrelated visual styles throughout the application.

---

# 45. Charts

Charts are supporting components, not the primary interface.

They are appropriate for:

* price history;
* volume over time;
* supplier distribution;
* buyer distribution.

Every chart SHOULD have an accessible tabular or textual representation where practical.

Analytics pages should prioritize exact values and tables when the question is better answered numerically.

---

# 46. Authentication and Users

Authentication is not required to validate the initial data-exploration architecture.

However, Favorites, Interests, and Radar are user-specific concepts.

Therefore application records SHOULD include a `user_id` boundary even if the first self-hosted version operates with a single implicit user.

This allows later migration to:

```text
single-user
    ↓
authenticated multi-user
```

without redesigning the persistence model.

The authentication provider itself is outside the scope of this architecture version.

---

# 47. Security Boundaries

The browser MUST NOT receive:

* database credentials;
* upstream secrets;
* internal synchronization credentials;
* unrestricted database interfaces.

Server-side inputs MUST be validated.

All database queries MUST be parameterized.

Interest definitions MUST use a constrained schema rather than arbitrary query expressions.

External strings rendered in the UI MUST be treated as untrusted data.

Exports MUST apply the same authorization boundaries as web views once multi-user authentication exists.

---

# 48. Configuration

Configuration comes from environment variables.

Examples:

```text
DATABASE_URL

COMPRAS_GOV_BASE_URL

SYNC_ENABLED
SYNC_CRON

LOG_LEVEL
```

Defaults may exist for non-sensitive configuration.

Secrets MUST NOT be committed to the repository.

A `.env.example` MAY document required variables without real credentials.

---

# 49. Docker Architecture

Expected repository-level files:

```text
Dockerfile
docker-compose.yml
.env.example
```

Conceptually:

```yaml
services:
  app:
    build: .
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

The PostgreSQL volume MUST survive application container replacement.

---

# 50. Database Migrations

Schema changes MUST be migration-driven.

Migrations execute before application code depends on the new schema.

Runtime request handlers MUST NOT contain implicit schema creation logic.

Deployment sequence:

```text
build
  ↓
database available
  ↓
run migrations
  ↓
start application
```

Migrations should be version controlled and reviewable.

---

# 51. Health Checks

Expose:

```text
/api/health
```

The endpoint should distinguish at minimum:

```text
application
database
```

Compras.gov.br availability SHOULD NOT determine whether the main application health check reports the local application as unavailable.

External source health may be exposed separately.

Example conceptual response:

```json
{
  "status": "ok",
  "database": "ok",
  "sources": {
    "comprasgov": "degraded"
  }
}
```

---

# 52. Observability

Server logs SHOULD be structured.

HTTP integration logs SHOULD contain:

```text
source
endpoint
duration
status
attempt
```

Synchronization logs SHOULD contain:

```text
job
run_id
duration
pages
records_read
records_created
records_updated
retries
status
```

Sensitive query parameters and credentials MUST be redacted.

---

# 53. Export Architecture

Important result sets should support:

```text
CSV
JSON
```

Small exports may be generated directly during the request.

Large exports SHOULD be streamed.

Exports MUST execute filtering on the server.

The browser must not download an entire unfiltered dataset and construct a filtered CSV locally.

---

# 54. Performance Principles

Prefer:

```text
SQL filtering
SQL aggregation
server pagination
SSR
incremental synchronization
```

Avoid:

```text
fetch everything
       ↓
send everything to browser
       ↓
filter in JavaScript
```

Expensive analytics queries should be measured before introducing caching or materialized views.

Materialized views MAY be introduced later for proven high-cost analytical queries.

---

# 55. Testing Strategy

## Unit tests

Test:

* normalizers;
* domain transformations;
* interest matching;
* derived metrics;
* validation;
* upstream error handling.

## Integration tests

Use a real disposable PostgreSQL database.

Test:

* repositories;
* migrations;
* constraints;
* synchronization idempotency;
* transactions;
* checkpoints.

## Source adapter tests

Use recorded/synthetic upstream fixtures.

Test:

* DTO parsing;
* pagination;
* malformed responses;
* errors;
* retries.

Tests MUST NOT require the production Compras.gov.br service to be available.

## End-to-end tests

Cover critical workflows:

```text
search product
     ↓
view product
     ↓
favorite product
```

and:

```text
create interest
     ↓
sync matching procurement
     ↓
interest match created
     ↓
Radar event appears
```

---

# 56. Suggested Source Tree

```text
pregoeiros/
│
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── tables/
│   │   │   └── charts/
│   │   │
│   │   ├── domain/
│   │   │   ├── catalog.ts
│   │   │   ├── procurement.ts
│   │   │   ├── supplier.ts
│   │   │   ├── contract.ts
│   │   │   ├── price.ts
│   │   │   ├── favorite.ts
│   │   │   └── interest.ts
│   │   │
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   ├── schema/
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   ├── sources/
│   │   │   │   └── comprasgov/
│   │   │   │
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── jobs/
│   │   │
│   │   └── utils/
│   │
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── contratacoes/
│   │   ├── produtos/
│   │   ├── fornecedores/
│   │   ├── contratos/
│   │   ├── precos/
│   │   ├── historico/
│   │   ├── favoritos/
│   │   ├── interesses/
│   │   ├── radar/
│   │   ├── settings/
│   │   └── api/
│   │
│   └── app.css
│
├── tests/
│   ├── fixtures/
│   │   └── comprasgov/
│   ├── integration/
│   └── e2e/
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

---

# 57. Dependency Direction

Dependencies should point inward toward application concepts:

```text
                   UI
                    │
                    ▼
              Routes / Actions
                    │
                    ▼
                 Services
                ↙        ↘
       Repositories      Sources
            │               │
            ▼               ▼
       PostgreSQL      Compras.gov
```

Forbidden dependencies include:

```text
domain → Svelte component

repository → Svelte route

source adapter → UI

Svelte component → database

Svelte component → Compras.gov
```

This boundary is more important than strict adherence to a named architectural pattern.

---

# 58. Data Flow Example — Product Page

Request:

```text
GET /produtos/:id
```

Flow:

```text
Browser
   │
   ▼
+page.server.ts
   │
   ▼
CatalogService.getProduct()
   │
   ├──► CatalogRepository
   │         │
   │         ▼
   │     catalog_items
   │
   ├──► PriceRepository
   │         │
   │         ▼
   │   price_observations
   │
   └──► ProcurementRepository
             │
             ▼
      procurement_items
```

The route returns a product page view model.

No Compras.gov request is required during a normal page view if synchronized data exists.

---

# 59. Data Flow Example — Synchronization

```text
scheduler
    │
    ▼
sync_procurements
    │
    ▼
ComprasGovProcurementSource
    │
    ▼
DTO[]
    │
    ▼
normalizeProcurement()
    │
    ▼
Procurement[]
    │
    ▼
ProcurementRepository.upsertBatch()
    │
    ▼
PostgreSQL
    │
    ▼
process relevant interests
    │
    ▼
Radar events
```

This is the primary ingestion pipeline.

---

# 60. Data Flow Example — Historical Price Analysis

```text
GET /historico/precos
        │
        ▼
HistoryService
        │
        ▼
PriceRepository.aggregate()
        │
        ▼
PostgreSQL
        │
        ├── count
        ├── avg
        ├── median
        ├── min/max
        └── time buckets
        │
        ▼
PriceHistoryViewModel
        │
        ▼
Svelte page
```

No large raw dataset needs to pass through the browser.

---

# 61. Architectural Decision: Local Read Model

Pregoeiros adopts a **local read model** rather than acting primarily as a live proxy.

That means:

```text
Compras.gov
     │
     │ asynchronous synchronization
     ▼
PostgreSQL
     │
     │ normal web requests
     ▼
Pregoeiros
```

This is a foundational architectural decision.

Benefits include:

* historical analysis;
* fast filtering;
* cross-entity joins;
* Radar;
* Interests;
* resilience to upstream downtime;
* lower upstream request volume;
* reproducible analytics.

The trade-off is that Pregoeiros data may lag behind the upstream source.

The UI MUST therefore expose data freshness.

---

# 62. Architectural Decision: Modular Monolith

Pregoeiros starts as a modular monolith.

Reasons:

* one product;
* one primary database;
* shared domain;
* small operational footprint;
* substantial transactional relationships;
* no demonstrated independent scaling requirements.

Modules are boundaries in source code, not network services.

If a background ingestion workload later requires independent scaling, jobs may be extracted without changing the domain model.

---

# 63. Architectural Decision: PostgreSQL Before Additional Infrastructure

PostgreSQL should initially provide:

* persistence;
* analytics;
* full-text search;
* locking;
* transactions;
* uniqueness/idempotency;
* job checkpoints.

We explicitly avoid introducing separate systems for these concerns until PostgreSQL becomes a measured bottleneck.

Potential future infrastructure:

```text
Redis
queue system
search engine
object storage
analytical warehouse
```

requires an ADR and a demonstrated requirement.

---

# 64. Architectural Decision: Source-Agnostic Domain

Although Compras.gov.br is the initial primary source, the core domain must not be named after it.

Use:

```text
Procurement
Supplier
CatalogItem
Contract
```

rather than:

```text
ComprasGovProcurement
ComprasGovSupplier
```

outside the source adapter.

This permits future integration with sources such as Portal CP or other procurement datasets.

---

# 65. Architectural Decision: Historical Truth vs Current Truth

Pregoeiros must not assume that the current API response is sufficient for every historical question.

The architecture distinguishes:

```text
current normalized entity
historical observations
recorded changes
```

This is particularly important for:

* prices;
* procurement status;
* results;
* contract lifecycle;
* Radar notifications.

Historical claims shown to users must be based on persisted observations/results rather than reconstructed assumptions wherever possible.

---

# 66. Evolution Path

The architecture intentionally provides several expansion points.

### Additional sources

```text
sources/
├── comprasgov/
└── portalcp/
```

### Authentication

Introduce an authentication provider while preserving `user_id` ownership boundaries.

### Job workers

Move:

```text
src/lib/server/jobs/
```

to a separate worker process if ingestion becomes computationally or operationally expensive.

### Search

Move selected search workloads to a dedicated engine if PostgreSQL becomes insufficient.

### Analytics

Introduce materialized views or a dedicated analytical store only when query volume/data size requires it.

These are evolution paths, not MVP requirements.

---

# 67. Architecture Constraints for MVP

The MVP MUST satisfy the following constraints:

1. Svelte 5 + SvelteKit.
2. TypeScript.
3. Tailwind CSS.
4. Light theme.
5. `slate-900` as primary accent.
6. Iconify for icons.
7. PostgreSQL persistence.
8. PostgreSQL available through Docker.
9. Server-side Compras.gov integration.
10. No direct browser → Compras.gov requests.
11. Migration-driven schema.
12. Idempotent synchronization.
13. Persistent sync state.
14. Provenance on imported records.
15. Server-side pagination.
16. SSR by default.
17. URL-driven search/filter state.
18. Favorites persisted in PostgreSQL.
19. Source/domain DTO separation.
20. No Redis, Elasticsearch, or microservices without demonstrated need.

---

# 68. MVP Architecture Scope

The first implementation should prioritize the vertical path:

```text
Compras.gov
      ↓
source adapter
      ↓
sync
      ↓
PostgreSQL
      ↓
service
      ↓
SvelteKit
      ↓
browser
```

for a small number of domains first:

```text
Catalog
Procurements
Procurement Items
Procurement Results
Prices
Suppliers
Favorites
```

A successful first milestone is not having every route.

A successful first milestone is having **one complete architectural slice** working correctly.

Recommended first slice:

```text
CATMAT
   ↓
catalog sync
   ↓
catalog_items
   ↓
/produtos
   ↓
/produtos/:id
   ↓
favorite
```

Then:

```text
Procurements
      ↓
Items
      ↓
Results
      ↓
Suppliers
```

Then:

```text
Prices
   ↓
Historical analytics
```

Then:

```text
Interests
   ↓
Radar
```

This reduces the risk of building a large schema and source adapter layer before validating the architecture end-to-end.

---

# 69. Architecture Quality Attributes

The following qualities guide implementation decisions.

**Maintainability:** boundaries should be understandable without extensive framework knowledge.

**Reliability:** synchronization failures must not corrupt checkpoints or existing data.

**Performance:** filtering and analytics should happen near the data.

**Resilience:** upstream downtime should degrade freshness rather than disable local reads.

**Traceability:** imported records should retain provenance.

**Testability:** source adapters, repositories, services, and UI should be independently testable.

**Portability:** Docker-based deployment should work without cloud-specific infrastructure.

**Accessibility:** web interfaces should use semantic HTML and accessible interactions.

**Simplicity:** infrastructure should be added only when a demonstrated problem requires it.

---

# 70. Open Architecture Decisions

The following decisions should be captured as ADRs during implementation:

**ADR-001 — PostgreSQL access library**
Choose between Drizzle, Kysely, or another SQL-oriented approach.

**ADR-002 — Migration tooling**
Select the migration mechanism consistent with ADR-001.

**ADR-003 — Compras.gov response validation**
Determine whether runtime schema validation is required globally or only at critical boundaries.

**ADR-004 — Job execution mechanism**
Determine the initial cron/container mechanism used to invoke background jobs.

**ADR-005 — Internal identifier format**
UUID, UUIDv7, or database-generated identifiers.

**ADR-006 — Interest filter representation**
Normalized relational model versus constrained JSONB.

**ADR-007 — Authentication**
Determine whether the initial deployment is single-user and when multi-user authentication enters scope.

**ADR-008 — Chart library**
Select a Svelte-compatible visualization library only when the first analytical visualization is implemented.

---

# 71. Guiding Principle

The central architectural principle of Pregoeiros is:

> **Pregoeiros owns the user experience, domain model, historical record, and analytical model. Compras.gov.br is a source of authoritative public procurement data, not the application's internal architecture.**

Consequently:

```text
API changes
    │
    ▼
source adapter changes
    │
    ╳
domain/UI should remain stable
```

The success of this architecture should be measured by how well it isolates external complexity while allowing the product to answer increasingly sophisticated procurement questions from a coherent local data model.

---

# 72. Summary

Pregoeiros is implemented as a **SvelteKit modular monolith backed by PostgreSQL**.

The application periodically ingests data from Compras.gov.br through isolated source adapters. Data is normalized into an application-owned model and persisted locally.

SvelteKit serves predominantly from PostgreSQL rather than proxying upstream requests.

PostgreSQL provides:

* the read model;
* historical persistence;
* analytics;
* synchronization state;
* Favorites;
* Interests;
* Radar;
* transactional guarantees.

Background synchronization keeps this model current while preserving application availability during upstream failures.

The architecture deliberately avoids premature distributed infrastructure and establishes clean extraction points for workers, search, additional data sources, authentication, and analytical infrastructure if future scale requires them.

The intended progression is:

```text
           Compras.gov.br
                  │
               ingest
                  │
                  ▼
             PostgreSQL
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
    Explore     Monitor    Analyze
       │          │          │
       └──────────┼──────────┘
                  ▼
              Pregoeiros
```

