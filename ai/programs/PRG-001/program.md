---
id: PRG-001
type: program
status: draft
---

# PRG-001

## Problem

Brazilian public procurement data published by Compras.gov.br is only
accessible today through raw API endpoints, parameters, and internal codes.
There is no product that lets a person answer real procurement questions —
what is being bought, who is buying it, how much is being paid, who is
supplying it — without first understanding the upstream API's shape. Nothing
in the current codebase (a clean repository with only raw specs and a
Knowledge base so far) proves that a normalized, queryable local
representation of this data, served through a usable web interface, is
actually achievable end-to-end.

## Users and Stakeholders

- **Primary user**: a person researching Brazilian federal/state public
  procurement (e.g. someone tracking what agencies are buying, at what
  price, from which suppliers) who needs to explore this data without
  Swagger/API knowledge (KNOW-001).
- No additional personas, business stakeholders, or authentication/tenancy
  model are defined yet; the architecture explicitly allows a single
  implicit user for this stage while reserving a `user_id` boundary for
  later multi-user support (KNOW-004).

## Desired Outcome

A working, self-hostable SvelteKit + PostgreSQL web application that proves
the "local read model" architecture end-to-end: it ingests a focused subset
of Compras.gov.br data (CATMAT/CATSER catalog, procurements, procurement
items, procurement results, suppliers, practiced prices) into a normalized
PostgreSQL schema through idempotent background sync jobs, and serves the
**Explorar** pillar (Produtos e Serviços, Contratações, Fornecedores,
Preços Praticados) plus a minimal Favoritos capability through server-
rendered pages — matching the documented design system and content rules.
This corresponds to the "MVP — Explorar" phase named in the roadmap
(KNOW-011) and to the "one complete architectural slice" milestone described
in the architecture spec (KNOW-003).

## Scope

- Application shell: global header, sidebar navigation (Explorar group at
  minimum), global search entry point, light-theme design system per
  KNOW-009 (KNOW-002, KNOW-009, KNOW-010).
- Docker/Docker Compose setup running the SvelteKit app and PostgreSQL, with
  environment-variable configuration and migration-driven schema (KNOW-002,
  KNOW-004).
- Source adapter and normalization pipeline for the Compras.gov.br modules
  needed by this scope: CATMAT/CATSER, procurements, procurement items,
  procurement results, suppliers, practiced prices (KNOW-003, KNOW-005).
- Initial background synchronization jobs (catalog, procurements, results,
  prices, suppliers) with `sync_runs` tracking and provenance on every
  imported record (KNOW-004, KNOW-005).
- **Explorar** pages: Produtos e Serviços (`/produtos`, `/produtos/[id]`)
  including basic price statistics; Contratações (`/contratacoes`,
  `/contratacoes/[id]`); Fornecedores (`/fornecedores`,
  `/fornecedores/[id]`); Preços Praticados (`/precos`) (KNOW-006, KNOW-008).
- Favoritos (`/favoritos`) for products, suppliers, and procurements —
  the minimal "Acompanhar" capability needed to validate the favorite flow
  end-to-end, without Interesses or Radar (KNOW-007).
- Cross-cutting UX baseline: server-side pagination, URL-driven filter
  state, CSV/JSON export on key tables, and the required loading/empty/
  error/stale/success states (KNOW-004, KNOW-010).

## Non-Goals

- Interesses and Radar (monitoring rules and the event inbox) — planned for
  v0.2 (KNOW-007, KNOW-011).
- Contratos (contract lifecycle/expiration tracking) and ARPs — v0.2
  (KNOW-006, KNOW-011).
- Full Histórico module (historical fornecedores/produtos/compradores
  analytics, charts, comparisons, legacy data, snapshots/events) — v0.5
  (KNOW-008, KNOW-011).
- Multi-user authentication — deferred; only the `user_id` boundary is
  reserved at the data layer (KNOW-004, ADR-007 remains open).
- Dark theme, density-mode switching, dedicated search infrastructure
  (Elasticsearch/Meilisearch), and any infrastructure beyond PostgreSQL/
  SvelteKit — explicitly out of scope until a demonstrated need exists
  (KNOW-002, KNOW-003, KNOW-009).
- Advanced analytics, materialized views, large-export streaming
  infrastructure, and production-grade observability — v1.0 (KNOW-011).

## Constraints

All Constitution invariants apply (`ai/memory/constitution.md`); the ones
most load-bearing for this Program:

- Fixed stack: Svelte 5, SvelteKit, TypeScript, Tailwind CSS, Iconify,
  PostgreSQL in Docker — no separate backend service.
- All Compras.gov.br communication happens server-side only; the browser
  never calls it directly.
- Database access isolated behind repositories; schema changes are
  migration-driven; every imported record carries `source`, `source_id`,
  `fetched_at` provenance.
- Background sync jobs must be idempotent and restartable; a checkpoint
  never advances before its batch is durably persisted.
- Light theme only, `slate-900` primary accent, WCAG 2.2 AA target, all
  user-facing copy in `pt-BR` with Brazilian currency/date/number
  formatting.
- Observed (source) data and Pregoeiros-derived statistics must remain
  visually and textually distinguishable everywhere both appear.
- Every behavior change must be covered by tests (TDD/BDD preferred).

## Success Criteria

- A person can, without any API knowledge, search or navigate to a product,
  a procurement, or a supplier and see normalized, correctly attributed data
  sourced from Compras.gov.br via PostgreSQL, not a live upstream call.
- The recommended first architectural slice works end-to-end: CATMAT sync →
  `catalog_items` → `/produtos` → `/produtos/:id` → favorite a product
  (KNOW-003) — followed by the equivalent slice for Procurements → Items →
  Results → Suppliers, and then Prices.
- Sync jobs for catalog, procurements, results, prices, and suppliers run
  idempotently and record their outcome in `sync_runs`; re-running a job
  does not duplicate or corrupt data.
- Listing pages (Contratações, Produtos, Fornecedores) use server-side
  pagination and URL-driven filters, and support CSV/JSON export honoring
  active filters.
- Every implemented screen visibly handles loading, empty, error, stale, and
  success states, per KNOW-010.
- The UI visually matches the documented design system (palette, typography,
  spacing, component set) closely enough to satisfy the acceptance criteria
  in KNOW-010/KNOW-009.
- `misterspec internal validate` reports zero structural findings for this
  Program and everything decomposed from it.

## Relevant Knowledge

[[KNOW-001]] (vision/pillars), [[KNOW-002]] (stack/infra), [[KNOW-003]]
(architecture model, local read model, recommended build order), [[KNOW-004]]
(data model/persistence), [[KNOW-005]] (sync/background jobs), [[KNOW-006]]
(Explore features), [[KNOW-007]] (Favoritos definition, scoped down for this
Program), [[KNOW-008]] (Preços Praticados basics; full Histórico deferred),
[[KNOW-009]] (design system), [[KNOW-010]] (UX patterns/content rules),
[[KNOW-011]] (roadmap phasing — this Program corresponds to "MVP —
Explorar").

## Open Questions

- ADR-001/ADR-002 (PostgreSQL access library and migration tooling) are
  unresolved and block starting the data layer (KNOW-002, KNOW-011).
- ADR-005 (internal identifier format: UUID vs UUIDv7 vs DB-generated) is
  unresolved and affects schema design for every table in scope
  (KNOW-004, KNOW-011).
- ADR-003 (whether Compras.gov.br response validation is required globally
  or only at critical boundaries) is unresolved and affects the source
  adapter design (KNOW-003, KNOW-011).
- ADR-004 (exact job execution/scheduling mechanism) is unresolved and
  affects how sync jobs are invoked in Docker (KNOW-005, KNOW-011).
- The PRD explicitly recommends producing a PostgreSQL schema + SvelteKit
  route map + Compras.gov endpoint-to-table-to-feature matrix before writing
  code (KNOW-011) — this has not yet been produced and should likely happen
  during Feature/Spec/Plan decomposition of this Program.
- Minor unresolved Knowledge conflict: whether Favoritos includes a
  dedicated "Contratos" tab is inconsistent between the PRD and UI/UX spec
  (KNOW-007) — moot for this Program since Contratos favoriting itself is
  out of scope until Contratos ships (v0.2), but should be revisited then.
