---
id: PRG-001
type: program
status: draft
---

# PRG-001 — Pregoeiros v1: from PoC to production

## Problem

Supplier companies that bid in Brazilian public procurement lose deadlines
and margin because:

- procurement notices and their amendments are scattered across portals;
- a notice's textual object rarely maps to the company's niche CATMAT/CATSER codes;
- reference prices are estimated by gut feeling instead of from observed awarded prices;
- contracts about to expire (a signal of a new tender) never enter the sales funnel;
- the GO/NO-GO decision is neither recorded nor auditable.

Today the solution exists only as a single-file HTML proof of concept with
mock data. No real data is collected and no decision is persisted, so the
product cannot be used in daily commercial work.

## Users and Stakeholders

- **Commercial procurement analyst** — primary user. Triages 20–80 notices per week and decides GO / Em Análise / NO-GO.
- **Pricer / estimator** — needs the median, minimum and maximum awarded prices of an item, with a visible sample size.
- **Commercial director** — needs to see what is in dispute and which contracts expire in 30/60/90 days.
- **Internal data operator (admin)** — needs to know whether each collection ran and to trigger a manual sync.
- **Project owner** — approves decisions on every open question (see Constraints).
- **External data provider** — Compras.gov.br Dados Abertos (read-only, no relationship beyond public API use).

## Desired Outcome

A production SvelteKit + PostgreSQL application, running on Docker Compose,
that reproduces the PoC's experience with **real data** collected twice a day
from Compras.gov.br. With it, an analyst can triage the company's niche
opportunities from a prioritized queue, record auditable decisions, receive
radar events from niche alerts, consult observed prices and competitors, and
anticipate expiring contracts. It keeps working from the last collected data
whenever the government API is unavailable.

## Scope

In scope for v1, delivered along the suggested roadmap phases (F0–F5). Each
capability below is decomposed into Features by `/mister-features`.

- **Foundation (F0):** SvelteKit 2 / Svelte 5 skeleton, Docker Compose (`web` + `db`), PostgreSQL schema and migrations, the PoC layout (app shell, sidebar, header), dev seed with the D-decision corrections, and authentication with the `analista`/`admin` roles.
- **Procurement collection and triage (F1):**
  - collectors for procurements, items and awarded results (Lei 14.133), with incremental windows and upserts by official key;
  - triage queue with urgency classification;
  - opportunities listing with filters and `-token` exclusion;
  - the per-notice triage sheet;
  - persisted GO / Em Análise / NO-GO decisions.
- **Monitoring (F2):** niche alerts and per-notice matching, radar of events (new matches, amendments detected by hash, results), global ⌘K search, favorites / "Em Disputa".
- **Market intelligence (F3):** practiced prices (statistics over local awards, window + N visible, source tagging including the P1 price-research complement), competitors & winners, observed history.
- **Anticipation and operations (F4):**
  - expiring contracts (30/60/90 buckets; collection up to +120 days);
  - the 03:15 and 15:15 schedule plus the weekly selective catalog job;
  - sync runs, source heartbeats and the sources modal;
  - manual sync with locking;
  - health endpoint.
- **Delivery hardening (F5):** server-generated CSV/JSON exports, the 8–12 E2E journeys, data retention purge, performance and accessibility targets.

## Non-Goals

- Publishing notices, or submitting proposals (Comprasnet / PNCP remain the official channels).
- Predictive "win score" or any ML.
- Coverage of states/municipalities not present in the Compras.gov.br base; PNCP integration for state coverage.
- Claiming competitors' total revenue; only observable awarded results.
- Real multi-client operation (multiple companies, corporate SSO, billing, RLS) — v1 runs a single tenant.
- Mirroring the full CATMAT/CATSER catalog (281k specifications).
- Pre-14.133 legacy history (`modulo-legado`), `modulo-ocds` export, and a dedicated worker/queue, message broker, Elasticsearch or APM.
- Managing the supplier company's own contracts.

## Constraints

- Every invariant in the Constitution (`ai/memory/constitution.md`) applies. The most binding for this Program:
  - the browser never calls Compras.gov.br;
  - strict layering;
  - official IDs are never invented;
  - re-collection never erases product data;
  - the app stays usable when upstream is down;
  - forbidden claims (guaranteed win, official price, national coverage);
  - TDD/BDD and SOLID/DRY/KISS/YAGNI.
- Approved decisions D-01…D-41 (`ai/raw/06-DECISOES.md`) prevail over the original specs and the PoC.
- **No inference under doubt:** every open question below, and any new ambiguity found during decomposition, must be put to the project owner as alternatives with the best one marked "recomendada" before being decided.
- The stack is fixed: Svelte 5, SvelteKit 2 with adapter-node, TypeScript strict, Tailwind v4, Drizzle, PostgreSQL 16, Zod, Vitest, Playwright, and Node 24 LTS (D-42, `ai/raw/07-DECISOES.md`).
- UI copy in pt-BR; code in English.
- Collection runs 03:15 and 15:15 America/Sao_Paulo, with a single scheduler instance.

## Success Criteria

v1 is accepted when an analyst can, **with no mocked data**:

1. See in the queue at least the open procurements of the configured niche.
2. Open a notice's sheet and see **that notice's own items**, not a generic catalog.
3. Mark GO and find the notice under "Em Disputa / Salvos".
4. Create the alert "Notebooks no RJ" and receive a Radar event after the next collection.
5. Query the median of a CATMAT with N and time window visible.
6. List contracts whose term ends within 30 / 60 / 90 days.
7. Confirm in the sources modal that the 03:15 (or 15:15) collection ran.

And the following non-functional targets hold:

- Queue opens in < 1.5 s (SSR + hydration).
- Indexed opportunity search has p95 < 300 ms.
- The app remains queryable while the government API is down.
- Keyboard shortcuts ⌘K / `/` / Escape work, and icon-only buttons are labelled.
- Pure domain rules have unit tests, and 8–12 E2E journeys pass.

## Relevant Knowledge

- Product and rules: [[KNOW-001]], [[KNOW-002]], [[KNOW-003]]
- Triage and notices: [[KNOW-004]], [[KNOW-005]], [[KNOW-006]], [[KNOW-007]]
- Monitoring: [[KNOW-011]], [[KNOW-012]], [[KNOW-013]]
- Market intelligence: [[KNOW-008]], [[KNOW-009]], [[KNOW-010]]
- Architecture and stack: [[KNOW-014]], [[KNOW-015]], [[KNOW-016]], [[KNOW-017]], [[KNOW-018]]
- Integration and collection: [[KNOW-019]], [[KNOW-020]], [[KNOW-021]]
- API, security, data: [[KNOW-022]], [[KNOW-023]], [[KNOW-024]], [[KNOW-025]], [[KNOW-026]], [[KNOW-027]]
- Quality and reference: [[KNOW-028]], [[KNOW-029]], [[KNOW-030]]

## Open Questions

Each question is to be decided with the project owner (alternatives + "recomendada") no later than the phase noted, and recorded in a decision record.

**Foundation / cross-cutting (F0)**
- Production hosting target, TLS/reverse proxy, and PostgreSQL backup/restore strategy. ([[KNOW-018]])
- User management (creating users, resetting passwords) and password policy. ([[KNOW-023]])
- CSRF protections beyond SvelteKit defaults; whether `/api/health` requires authentication. ([[KNOW-022]], [[KNOW-023]])
- Initial niche configuration in production beyond seeding monitored products (onboarding). ([[KNOW-001]])
- Whether the dev seed includes the PoC's requirements, historical bids and chart points. ([[KNOW-030]])
- Placement of the mandatory source citation in the UI. ([[KNOW-003]])
- Dark mode, responsive breakpoints, WCAG target level. ([[KNOW-017]])
- CI provider and pipeline stages. ([[KNOW-028]])

**Collection and triage (F1)**
- Upstream field names for proposal deadline, delivery place, payment conditions and PDF URL. ([[KNOW-005]], [[KNOW-019]])
- How `segmento` is derived, and how upstream `situacao` maps to the enum (incl. which values count as "active"). ([[KNOW-006]], [[KNOW-025]], [[KNOW-027]])
- Upsert and deduplication when a procurement is seen with only one of the two official keys. ([[KNOW-024]])
- CNPJ normalization, and how awards link to suppliers. ([[KNOW-025]])
- Incremental window strategy (fixed 7–15 days vs. adaptive via cursors), the threshold for an "absurd" page count, timeouts/backoff values, User-Agent contact, and upstream rate limits. ([[KNOW-019]], [[KNOW-020]], [[KNOW-021]])
- Lazy fill via the detail endpoint on demand vs. always at upsert. ([[KNOW-005]])
- Habilitation checklist extraction and how `ok_sugerido` is set; tenant ownership of `procurement_requirements`. ([[KNOW-005]], [[KNOW-026]])
- Triage details:
  - whether NO-GO requires a reason;
  - whether a decision can return to `pendente`;
  - the audit display (who/when);
  - any "Em Análise" expiry.
  ([[KNOW-001]], [[KNOW-004]])
- Default sort, full modalidade list, search operators and result ranking. ([[KNOW-006]], [[KNOW-007]])

**Monitoring (F2)**
- Buyer vs. sphere in alerts: how a sphere maps to órgão codes. ([[KNOW-011]])
- Text matching semantics without CATMAT; `new_matches` reset; matching against existing notices at alert creation; event type for "alerta ativado". ([[KNOW-011]])
- Describing *what* changed in an amendment; "Resposta aos Esclarecimentos" as an event kind; which awards emit `resultado` events. ([[KNOW-012]])
- `radar_events.alert_id` delete policy after soft-deleted alerts are purged. ([[KNOW-026]])

**Market intelligence (F3)**
- Moving-median computation; whether stats filter by UF/órgão; extraction of `contexto`; unit normalization across awards. ([[KNOW-008]])
- "Principal família" computation, history KPI window, ranking order. ([[KNOW-009]])

**Anticipation and operations (F4)**
- Cumulative vs. exclusive 30/60/90 buckets; niche filtering of contracts; slicing contract collection for the órgão + 365-day constraint. ([[KNOW-010]], [[KNOW-021]])
- Mapping of the sources-modal rows to the heartbeat modules; synchronous vs. queued `/api/sync`; rate-limit thresholds. ([[KNOW-021]], [[KNOW-022]], [[KNOW-023]])
- Build of a separate job entrypoint (cron option B). ([[KNOW-018]])

**Hardening (F5)**
- Full list of the 8–12 E2E journeys and their data source (seed vs. recorded fixtures). ([[KNOW-028]])
- Export/search pagination limits; retention for favorites, items, suppliers, catalog; effect of purging a notice on its product data. ([[KNOW-022]], [[KNOW-027]])
- Numeric targets for product metrics; the "typical connection" and data-volume assumptions behind the performance targets; log retention. ([[KNOW-002]], [[KNOW-029]])
