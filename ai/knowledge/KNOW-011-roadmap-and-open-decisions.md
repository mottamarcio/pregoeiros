---
id: KNOW-011
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
---

# KNOW-011

## Summary

The PRD lays out a four-phase roadmap (MVP → v0.2 → v0.5 → v1.0), reframes
Pregoeiros as a CLI/TUI-to-web pivot with an early-backfill priority shift,
and names the concrete next technical step (schema + route map + endpoint
matrix). The architecture spec separately lists eight explicit open ADRs to
resolve during implementation.

## Known Facts

- **Roadmap — MVP ("Explorar")**: deliver the web app and prove the data
  model. Scope: SvelteKit 5, Tailwind, Iconify, PostgreSQL, Docker; layout +
  navigation; busca; CATMAT/CATSER; contratações; itens; resultados;
  fornecedores; preços praticados; favoritos; sync inicial; paginação;
  filtros; CSV/JSON export.
- **Roadmap — v0.2 ("Acompanhar")**: Interesses; Radar; sync incremental
  automático; novidades; contratos; ARPs; more complete
  fornecedor/produto pages; sync status UI.
- **Roadmap — v0.5 ("Inteligência histórica")**: bootstrap histórico;
  histórico de fornecedores/produtos/compradores/preços; gráficos;
  comparações; dados legados; snapshots/eventos; improved full-text search.
- **Roadmap — v1.0 ("Produto consolidado")**: stabilized data model,
  resilient jobs, mature migrations, advanced analytics, large exports,
  refined Radar, advanced Interesses, performance, observability,
  backup/restore, self-hosting documentation.
- **Conceptual pivot (PRD §33)**: the product was originally conceived as
  CLI/TUI → SQLite; it is now explicitly reframed as
  Compras.gov.br → ingestão → PostgreSQL (histórico, analytics, favoritos,
  interesses, radar) → SvelteKit → Pregoeiros (Explorar/Acompanhar/
  Analisar). The move to web is described as improving the fit for
  brainstormed features. This pivot is also why backfill/ingestion is
  recommended relatively early rather than deferred (see [[KNOW-005]]).
- **Stated next technical step** (explicit PRD recommendation, not yet
  executed): before writing code, transform the PRD into a PostgreSQL
  schema + SvelteKit route map + a matrix of {Compras.gov endpoint → table →
  page/feature}, in order to know precisely what to ingest for the MVP and
  avoid designing the database blind.
- **Open Architecture Decisions (ADRs)** to capture during implementation:
  ADR-001 PostgreSQL access library (Drizzle vs Kysely vs other SQL-oriented
  approach); ADR-002 migration tooling (consistent with ADR-001); ADR-003
  whether Compras.gov response validation is needed globally or only at
  critical boundaries; ADR-004 job execution mechanism (cron/container);
  ADR-005 internal identifier format (UUID/UUIDv7/DB-generated); ADR-006
  Interest filter representation (normalized relational vs constrained
  JSONB); ADR-007 authentication provider and timing of multi-user support;
  ADR-008 chart library, chosen only once the first analytical visualization
  is implemented.
- **Evolution path / expansion points** explicitly designed for but not part
  of MVP: additional source adapters (e.g. `sources/portalcp/`); introducing
  an authentication provider while preserving the `user_id` boundary; moving
  `src/lib/server/jobs/` to a separate worker process if ingestion becomes
  expensive; moving search to a dedicated engine if PostgreSQL search proves
  insufficient; introducing materialized views or a dedicated analytical
  store only when query volume/data size requires it.

## Constraints

- The next technical artifact expected before implementation begins is a
  PostgreSQL schema + SvelteKit route map + Compras.gov endpoint-to-table-to-
  feature matrix — not application code.
- Additional infrastructure evolution paths (separate workers, dedicated
  search, analytical store, additional sources) require a demonstrated need,
  consistent with [[KNOW-003]]'s "PostgreSQL before additional
  infrastructure" decision.

## Unknowns

- No target dates/timeframes are given for any roadmap phase (MVP/v0.2/v0.5/
  v1.0) — only functional scope per phase.
- All eight ADRs (ADR-001 through ADR-008) remain unresolved as of these raw
  sources.

## Conflicts

None identified.

## Provenance

- Roadmap phases and conceptual pivot: `ai/raw/product-requirements-specification.md` §32–33.
- Open ADRs and evolution path: `ai/raw/architecture-specification.md` §66, §70.

## Related Topics

[[KNOW-001]], [[KNOW-002]], [[KNOW-003]], [[KNOW-004]], [[KNOW-005]]
