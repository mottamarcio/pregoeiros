---
id: FEAT-003
type: feature
status: draft
parent: PRG-001
---

# FEAT-003 — Public Data Collection and Source Integrity

## Capability

Keeping a local mirror of Compras.gov.br open data current and trustworthy:

- a server-only HTTP client;
- a scheduler with incremental jobs;
- one collector per upstream module;
- upserts by official keys;
- amendment detection by content hash;
- run and heartbeat tracking;
- manual sync;
- health and source-status endpoints;
- data retention purge.

## User Value

Every other capability works on real, fresh data. Users always see when data
was last collected and whether each source is operating. When the government
API is down, work continues on the last collected base.

## Scope

- **HTTP client** (`$lib/server/integrations/compras-gov/`):
  - GET only, JSON, timeout, exponential retry (3×) on 429/502/503/504/timeout;
  - pagination with a per-module page cap, identifiable User-Agent;
  - abort and mark `degraded` on an absurd page count or an HTML error;
  - `endpoints.ts` with parameter names exactly as in the OpenAPI (D-30);
  - null-tolerant mappers from DTO to domain.
- **Public mirror schema** (Drizzle): `procurements`, `procurement_items`, `award_items` (with `codigo_orgao`, `uasg`), `suppliers`, `contracts`, `contract_items`, `catalog_items`, with their indexes and the D-09 / D-35 / D-36 / D-37 rules.
- **Collectors:**
  - procurements (Lei 14.133), their items, and awarded results;
  - contracts by end of term (today → +120 days, D-14) and contract items;
  - selective CATMAT catalog (D-31);
  - supplier hydration from `modulo-fornecedor`;
  - the price-research complement (P1, delivered with FEAT-008's F3 timing, D-29).
- **Normalization at write time:** `*_normalizado` columns written with the shared `normalizeSearch` (D-10); `itens_texto_normalizado` maintained on upsert.
- **Amendment detection:** canonical hash (objeto + prazo + items + valor + attachment metadata when available, D-18). When the hash changes on an existing notice, a `retificacao` radar event is emitted. Awards emit `resultado` events.
- **Alert matching hook:** after each run, newly persisted/updated notices are handed to the alert matcher (service owned by FEAT-006).
- **Orchestration:**
  - `full-incremental` at 03:15 and 15:15 America/Sao_Paulo;
  - weekly Sunday 04:00 catalog + purge job;
  - `node-cron` started only when `ENABLE_CRON=true`;
  - `pg_advisory_lock` so runs never overlap;
  - `sync_runs`, `source_heartbeats` and `sync_cursors`;
  - a failing module never blocks the others (`partial` run).
- **Endpoints and UI:**
  - `POST /api/sync` (admin; 202, or 409 `SYNC_IN_PROGRESS`; rate-limited);
  - `GET /api/sources`;
  - `GET /api/health` (503 only when the DB is down);
  - the sources modal with the status mapping (D-32) and the "Última Coleta" header value;
  - the "Atualizar Fontes" button.
- **Retention purge** per the v1 policy (including D-14 contracts and D-39 deleted alerts).
- Structured JSON logs per run and module.

## Non-Goals

- Screens that consume the data (FEAT-004…FEAT-010).
- The alert-matching rules themselves (FEAT-006) and the radar inbox UI (FEAT-006).
- Legacy pre-14.133 modules, OCDS, PNCP, the full catalog dump, a dedicated worker/queue.

## Constraints

- Constitution:
  - the browser never calls upstream; read-only GET within upstream limits;
  - collection runs outside the request path, with a single scheduler instance;
  - public tables are never truncated;
  - re-collection never erases product data;
  - official IDs are never invented;
  - one failing module never blocks the others;
  - freshness is always visible;
  - outbound calls have timeouts and page caps.
- Decisions D-09, D-10, D-13, D-14, D-18, D-29–D-33, D-35–D-37, D-39.
- Integrations only fetch and map; jobs only orchestrate; business rules stay in services.

## Relevant Knowledge

- [[KNOW-019]] upstream endpoints
- [[KNOW-020]] HTTP client and mappers
- [[KNOW-021]] scheduled collection and source integrity
- [[KNOW-024]] data model conventions and upserts
- [[KNOW-025]] public mirror schema
- [[KNOW-027]] retention policy
- [[KNOW-022]] `/api/sync`, `/api/sources`, `/api/health`
- [[KNOW-029]] observability

## Open Questions

- Upstream field names for proposal deadline, delivery place, payment conditions and PDF URL; whether attachments are exposed at all (affects D-18). ([[KNOW-019]])
- How `segmento` is derived; mapping of upstream `situacao` to the enum, and which values count as "active". ([[KNOW-006]], [[KNOW-025]], [[KNOW-027]])
- Upsert and deduplication when a notice arrives with only one of the two official keys. ([[KNOW-024]])
- CNPJ normalization, and how awards link to `suppliers`. ([[KNOW-025]])
- Incremental window strategy (fixed 7–15 days vs. adaptive via cursors); "absurd" page threshold; exact timeout/backoff values; User-Agent contact; upstream rate limits. ([[KNOW-019]], [[KNOW-020]], [[KNOW-021]])
- Lazy fill via the detail endpoint on demand vs. always at upsert. ([[KNOW-005]])
- Slicing contract collection to satisfy the órgão + 365-day constraint. ([[KNOW-021]])
- Which awards emit `resultado` radar events (all vs. alert/favorite-linked). ([[KNOW-012]])
- Mapping of the sources-modal rows to heartbeat modules; synchronous vs. queued `/api/sync`; rate-limit thresholds; separate job entrypoint. ([[KNOW-021]], [[KNOW-022]], [[KNOW-018]])
- Retention for favorites, items, suppliers and catalog; effect of purging a notice on its product data. ([[KNOW-027]])
