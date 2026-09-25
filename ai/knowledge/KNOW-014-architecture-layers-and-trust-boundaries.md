---
id: KNOW-014
type: knowledge
status: active
sources:
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-014 — Architecture: Layers, Principles and Trust Boundaries

## Summary

Pregoeiros uses a **layered + ports-and-adapters** architecture without
over-engineering: SvelteKit routes → application services → repositories
(PostgreSQL) and jobs/collectors (Compras.gov.br HTTP). The UI never talks to the
government API; the app keeps serving the last collected base when upstream is
down.

## Known Facts

- **Architecture goals:**
  1. Reproduce the PoC UX without coupling the UI to the government API.
  2. Isolate server code (`$lib/server`) so secrets, SQL and the Compras.gov.br HTTP client **never** leak into the browser bundle.
  3. Keep the app useful with the last collected base (resilience).
  4. Keep folder structure aligned with official SvelteKit 2 docs and community conventions.
- **Layers:** Browser/Svelte 5 → (load / form actions / fetch `/api/*`) → SvelteKit routes (HTTP, cookies, input validation) → Application services (use cases: triage, alert match, stats) → Repositories → PostgreSQL; and Jobs/Collectors → Compras.gov.br HTTP.
  - UI does not know government endpoints.
  - Services know neither raw `fetch` nor raw SQL.
  - Repositories speak SQL (via driver) and return domain types.
  - Collectors speak HTTP to the public API and write via repositories.
  - Jobs orchestrate collectors + source heartbeats.
- **Principles applied:** SRP (one collector per API module; one service per aggregate — triage, alert, price); OCP (a new collection module = a new adapter in `integrations/compras-gov`, without touching the queue); LSP (repositories expose stable TypeScript interfaces; fakes replace real ones in tests); ISP (`ProcurementRepository` has no cron methods; `SyncJob` doesn't render HTML); DIP (services depend on interfaces, not `postgres.js` or `fetch`); KISS (no message broker; cron + `sync_runs` table); DRY (single module for search normalization, pt-BR money and `-termo` parser); YAGNI (no Kafka, Elasticsearch, multi-region or ML; Postgres indexes + `pg_trgm`); TDD and BDD.
- **Context:** commercial analyst → Pregoeiros (Web) → PostgreSQL (internal state + cache of the public base) and Compras.gov.br Dados Abertos API (read-only, no auth).
- **Trust boundaries:**

  | Zone | May | May not |
  |---|---|---|
  | Svelte client | render, filter already-loaded UI, ⌘K against `/api/search` | see `DATABASE_URL`, call Compras.gov.br directly |
  | `+page.server` / `+server` | validate input, call services | mix SQL with markup |
  | Repositories | SQL | alert-match rules |
  | Integrations | HTTP + DTO mapping | write triage decisions |
  | Jobs | orchestrate | answer user requests |

- **Data consistency:** hybrid model — local copy of the public base + product tables (triage, alerts). Public mirror data is logically read-only; product data is separate so re-collection never erases analyst decisions.
- **Source of truth:** external — Compras.gov.br Dados Abertos (official IDs never invented); internal — triage decisions, alerts, favorites, read events belong to Pregoeiros.
- **Conscious extensions (not now):** dedicated worker + queue (when collection exceeds ~10 min); complementary PNCP reads (`pncp.gov.br/api/consulta`) if state coverage becomes a requirement; `websearch_to_tsvector` full-text if `pg_trgm` is insufficient; real multi-client support (SSO, billing, RLS) — renamed by D-21, since `tenant_id` already exists on product tables in v1. The `integrations/` folder already isolates the extension point.

## Constraints

- The Compras.gov.br client must never be placed in `src/lib` outside `server` (it would ship to the browser).
- Services depend on interfaces; repositories must not hold business rules.
- No message broker, Kafka, Elasticsearch, multi-region or ML in v1.

## Unknowns

- The exact interface signatures of repositories/services are not specified beyond names.

## Conflicts

- None remaining. Multi-tenancy timing resolved by D-21 (single tenant with `tenant_id` from v1, repository-level filtering, no RLS in v1 — see [[KNOW-024]]).

## Provenance

- Goals, layers, principles, context, trust boundaries, consistency, extensions: `ai/raw/02-ARCHITECTURAL_SPECS.md` §1, §2, §3.1, §6, §7, §11.
- Sources of truth: `ai/raw/01-PRD.md` §6.1–6.2.
- Public mirror vs product data separation: `ai/raw/05-DATA_MODEL_SPECS.md` intro.
- Decisions D-21: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-015]] SvelteKit project structure
- [[KNOW-018]] containers and deployment
- [[KNOW-020]] Compras.gov.br HTTP client
- [[KNOW-021]] collection jobs
