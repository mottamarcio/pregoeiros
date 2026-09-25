---
id: FEAT-004
type: feature
status: draft
parent: PRG-001
---

# FEAT-004 — Triage Queue and Decisions

## Capability

The home page's prioritized work queue of open opportunities, the per-notice
triage sheet, and the persisted, auditable GO / Em Análise / NO-GO decision.

## User Value

The commercial analyst decides in about two minutes per notice whether to
bid, with deadline urgency, item fit and value in front of them. Every
decision is recorded and findable later. This covers acceptance criteria 1–3.

## Scope

- **Queue (`/`):**
  - counters: pending decisions, proposals within 48h (critico only, D-03), GO in preparation, alerts with news (value supplied by FEAT-006);
  - prioritized list (deadline, UF, UASG, processo, value, decision badge), paginated (50 rows);
  - filters Todas / Apenas Pendentes / Decididas (GO);
  - shortcuts to create an alert and refresh sources;
  - side panels for active alerts and observed amendments (data from FEAT-006);
  - scenario search cards.
- **Urgency classification** (`classifyUrgency`, pure and unit-tested): `encerrado` → `sem_prazo` → `critico` (≤ 48h) → `urgente` (≤ 3 days) → `normal`, per D-04. The `v_triage_queue` view reflects it.
- **Triage sheet**, both as the `/editais/[id]` full page and as the `/?edital=[id]` modal:
  - objeto, órgão, UASG, processo, UF, segmento, situação;
  - deadline + countdown; delivery place and deadline; payment conditions ("Não informado na base" when absent);
  - estimated value and modalidade;
  - that notice's own items with derived fit (`compativel` / `verificar` against monitored products; not persisted);
  - habilitation checklist when available;
  - official links and PDF; official ID only from upstream (D-07).
- **Decision:**
  - `setDecision` form action with Zod → `triage_decisions` (tenant-scoped);
  - GO upserts a favorite with `origin='triage'`, and leaving GO removes only that favorite (D-05; storage owned by FEAT-007);
  - pt-BR toasts, and the decision badge in the queue and listing.
- `procurement_requirements` table and the checklist display.

## Non-Goals

- The opportunities listing, filters and global search (FEAT-005).
- Collecting notices and items (FEAT-003).
- Alert and radar management (FEAT-006); favorites page (FEAT-007).

## Constraints

- Constitution:
  - the queue is the home page, and every relevant notice has an explicit decision state;
  - official IDs are never invented;
  - product data is tenant-scoped and survives re-collection;
  - the sheet shows only that notice's items.
- Decisions D-03, D-04, D-05, D-06, D-07, D-08.
- Queue SSR under 1.5 s.

## Relevant Knowledge

- [[KNOW-004]] triage queue and decisions
- [[KNOW-005]] triage sheet
- [[KNOW-026]] `triage_decisions`, `procurement_requirements`, `watched_products`
- [[KNOW-013]] favorites (GO → favorite)
- [[KNOW-029]] performance targets

## Open Questions

- Whether NO-GO requires a reason; whether a decision can return to `pendente`; any expiry for "Em Análise". ([[KNOW-004]], [[KNOW-001]])
- How the decision audit (who/when) is displayed. ([[KNOW-004]])
- Habilitation checklist extraction, how `ok_sugerido` is set, and whether requirements are tenant data. ([[KNOW-005]], [[KNOW-026]])
- Default ordering of the queue beyond deadline priority (tie-breakers such as value or fit). ([[KNOW-006]])
