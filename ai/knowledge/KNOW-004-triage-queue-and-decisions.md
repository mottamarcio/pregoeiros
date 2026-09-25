---
id: KNOW-004
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-004 — Triage Queue, Triage Decisions and Urgency

## Summary

The home page (`/`) is the **Fila de Triagem Comercial**: a prioritized list of
open opportunities where each notice carries an explicit triage decision
(`pendente | analisando | go | nogo`) and an urgency level derived from the
proposal deadline. This topic covers the queue, the decision lifecycle, and the
urgency classification.

## Known Facts

- **Queue view (`/`):**
  - Counters: pending decisions, proposals due within 48h, GO in preparation, alerts with news.
  - Prioritized list of open opportunities showing deadline, UF, UASG, processo, value and decision badge.
  - Filters: Todas / Apenas Pendentes / Decididas (GO).
  - Shortcuts: create alert; "Atualizar Fontes" (triggers incremental sync or checks status).
  - Side panels: "Alertas Ativos de Nicho" and a feed of observed retificações.
  - Scenario search cards: "notebooks no RJ" (CATMAT 482910 + UF RJ with open deadlines), "preço de monitores 27''", "contratos de TI vencendo" (30–90 days).
  - PoC subtitle: "Identifique rapidamente em quais editais vale a pena disputar antes do encerramento das propostas".
- **Triage states:** `pendente`, `analisando`, `go`, `nogo` (PostgreSQL enum `triage_status`). If no decision row exists, the UI treats the notice as `pendente`.
- **PoC decision labels:** pendente → "Aguardando Triagem"; go → "GO (Disputar)" / "Participando (GO) - Proposta em Elaboração"; analisando → "Em Análise" / "Em Análise Técnica / Comercial"; nogo → "Descartado" / "Descartado (NO-GO)".
- **PoC toast messages:** GO → "Edital marcado para disputar (GO)! Movido para propostas prioritárias."; analisando → "Edital colocado em análise pela equipe técnica."; nogo → "Edital descartado (NO-GO)."
- **Decision flow** (`POST action setDecision`): `TriageService.set(id, go|analisando|nogo)` → persists to **`triage_decisions`** (D-06; `procurement_triage` in the architecture text is a typo) → **if GO, idempotent upsert of a favorite of type `contratacao` with `origin = 'triage'`** → toast via flash/data.
- **Decision D-05 — GO ↔ favorite:** when a decision changes from GO to another state, only the favorite with `origin = 'triage'` is removed; manual favorites stay. The PoC (which creates no favorite on GO) is outdated on this point.
- **Decision D-03 — "Propostas até 48h" counter:** counts **only** `critico` notices (deadline ≤ now + 48h). Visual highlight covers both levels: red for `critico`, amber for `urgente`.
- A triage decision may carry a `motivo` (PoC field `motivoDescarte`, e.g. "Edital concluído").
- Triage decisions are stored separately from the public mirror so they survive re-import (see [[KNOW-026]]).
- **Urgency rule** (business rule 4, refined by D-04): evaluated in order — `encerrado` if `situacao` ∈ (`homologado`, `cancelado`, `excluido`) **or** `prazo_proposta_em` ≤ now; `sem_prazo` if `prazo_proposta_em` is NULL; `critico` if deadline ≤ now + 48h (computed in hours); `urgente` if ≤ 3 days; otherwise `normal`. Enum `urgency_level` = `critico`, `urgente`, `normal`, `encerrado`, **`sem_prazo`** (new value, D-04). `sem_prazo` notices go to the end of the queue with the badge "Prazo não informado na base".
- **`v_triage_queue` view** (as written in the Data Model; must be updated to the D-04 rule above) computes: `decisao = coalesce(td.status, 'pendente')`; `urgencia` = `encerrado` when `prazo_proposta_em` is NULL or ≤ now(), `critico` when ≤ now()+2 days, `urgente` when ≤ now()+3 days, else `normal`; `dias_restantes = greatest(0, ceil(seconds_remaining / 86400))`.
- Tenant scoping of the queue follows D-21: repositories filter by `tenant_id` taken from the session (see [[KNOW-024]]).

## Constraints

- The home page must be the triage queue, not a dashboard.
- Every relevant notice must have an explicit decision state.
- `classifyUrgency(diasRestantes)` is a pure function born with a unit test (TDD).

## Unknowns

- Whether a NO-GO requires a mandatory `motivo`, and whether decisions can be reverted to `pendente` — not specified.
- Which user and timestamp are shown for audits (`decided_by`, `decided_at` exist in the schema but the UI for auditing is not described), although the problem statement requires the decision to be auditable.

## Conflicts

- None remaining. Resolved by decisions:
  - counter definition → D-03;
  - `encerrado` / NULL deadline → D-04 (new `sem_prazo` level);
  - GO → favorite → D-05;
  - table name → D-06 (`triage_decisions`).

## Provenance

- Queue view, principles, urgency rule: `ai/raw/01-PRD.md` §3, §4.1, §6.4.
- Decision flow: `ai/raw/02-ARCHITECTURAL_SPECS.md` §5.2.
- Enums, default `pendente`, `v_triage_queue`: `ai/raw/05-DATA_MODEL_SPECS.md` §3, §6.1, §8.1.
- Labels, toasts, counters, urgency highlight, scenario cards: `ai/raw/pregoeiros.html` (view-dashboard, `renderDashboardTriage`, `setProcurementTriageDecision`, `updateDecisionButtonsUI`, `presetQuery`).
- Decisions D-03, D-04, D-05, D-06, D-21: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-005]] procurement triage sheet
- [[KNOW-013]] favorites (GO → favorite)
- [[KNOW-022]] `setDecision` form action
- [[KNOW-026]] `triage_decisions` table
- [[KNOW-029]] performance targets for the queue
