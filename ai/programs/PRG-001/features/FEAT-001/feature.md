---
id: FEAT-001
type: feature
status: draft
parent: PRG-001
---

# FEAT-001

## Capability

Provide the runnable application shell and self-hosting foundation every
other Feature in PRG-001 builds on: the SvelteKit application skeleton,
its design-system component library and light theme, the PostgreSQL/Docker
environment with migration-driven schema, and the navigation/global-search
shell.

## User Value

Without this Feature, no other Explorar page can render, be styled
consistently, be navigated to, or run against a real database. It gives
every subsequent Feature a consistent shell (header, sidebar, search) and a
consistent visual language, and gives operators a `docker compose up`-able
environment with schema migrations instead of ad-hoc setup.

## Scope

- SvelteKit 5 (TypeScript, Tailwind CSS, Iconify) project skeleton with the
  route/library structure implied by the architecture spec
  (`src/lib/components`, `src/lib/domain`, `src/lib/server/{sources,
  repositories,services,jobs,db}`, `src/routes`).
- Design-system foundation: color tokens, typography (Inter + JetBrains
  Mono), spacing/radius scale, the initial shared component set (Button,
  IconButton, Input, Select, Badge/StatusBadge, Card, Table/DataTable,
  Pagination, Tabs, Dialog/Modal, Drawer, Tooltip, EmptyState, Skeleton,
  Alert/InlineAlert, Toast) per KNOW-009 — built only as far as the other
  MVP Features actually need them (no premature component creation).
- Application shell: 56px global header with brand mark, global search
  input (non-functional stub acceptable if search itself isn't built yet),
  56px header actions area; 256px sidebar with Explorar navigation group
  and "PostgreSQL Cache" status panel; mobile off-canvas drawer behavior.
- PostgreSQL running in Docker via `docker-compose.yml`, with
  `DATABASE_URL`/`COMPRAS_GOV_BASE_URL`/`SYNC_ENABLED`/`SYNC_CRON`/
  `LOG_LEVEL` environment configuration and a `.env.example`.
- Migration tooling and the initial schema migration(s) covering the tables
  needed by this Program (`organizations`, `catalog_items`, `suppliers`,
  `procurements`, `procurement_items`, `procurement_results`,
  `price_observations`, `favorites`, `sync_runs`, `sync_checkpoints`).
- `/api/health` endpoint distinguishing application and database status.

## Non-Goals

- Any Explorar page's actual data-driven content (Produtos, Contratações,
  Fornecedores, Preços) — those are separate Features (FEAT-003–FEAT-006).
- Favoritos, Interesses, Radar, Contratos, Histórico navigation
  entries/routes — out of Program scope (see PRG-001 Non-Goals).
- A functioning global search backend — only the shell/UI slot is in scope
  here; wiring it to real search results belongs to whichever Feature(s)
  implement searchable entities.
- Authentication — no login flow; single implicit user only.

## Constraints

- Must follow the Constitution's fixed stack (Svelte 5, SvelteKit,
  TypeScript, Tailwind, Iconify, PostgreSQL/Docker, no separate backend).
- Schema changes must be migration-driven from the very first schema;
  runtime handlers must never implicitly create schema.
- Light theme only, `slate-900` primary accent; WCAG 2.2 AA target for
  every shell element (focus states, semantic HTML, keyboard operability).
- A shared component is added to the library only once genuinely reused —
  do not scaffold the full component list speculatively.

## Relevant Knowledge

[[KNOW-002]] (stack, Docker, configuration), [[KNOW-003]] (layering,
source tree, dependency direction), [[KNOW-004]] (migration-driven schema,
health endpoint), [[KNOW-009]] (design system tokens/components/shell),
[[KNOW-010]] (navigation IA, responsive shell behavior).

## Open Questions

- ADR-001/ADR-002 (PostgreSQL access library and migration tooling) must be
  resolved before this Feature's schema/migration work can start
  (carried over from PRG-001 Open Questions).
- ADR-005 (internal identifier format) affects the initial migration's
  primary-key strategy and must be resolved here or treated as a blocking
  decision for this Feature specifically.
