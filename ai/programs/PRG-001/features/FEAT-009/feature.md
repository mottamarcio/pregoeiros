---
id: FEAT-009
type: feature
status: draft
parent: PRG-001
---

# FEAT-009 — Competitors and Observed History

## Capability

Profiles of companies with observable awarded results (Competitors &
Winners) and the Observed History view with aggregate KPIs, a supplier
ranking, and JSON export — all computed by local aggregation of awards.

## User Value

The commercial team knows who wins in its niche, how often, for how much and
with how many buyers, framed honestly as observed awards rather than revenue.
The history can be exported for further analysis.

## Scope

- `/fornecedores`:
  - supplier cards with awarded items, total awarded value, main family and distinct buyers (by `codigo_orgao`, D-13);
  - search by normalized name or CNPJ;
  - follow/unfollow via FEAT-007;
  - the mandatory disclaimer.
- `/historico`:
  - KPIs: awarded items in the window, suppliers with ≥ 1 award, distinct buyers and buying units (UASG) as separate metrics (D-13);
  - ranking by awarded items and value.
- `supplier_stats` aggregation (materialized view refreshed after the results job, or a live query while volume is small).
- JSON export `GET /api/export/historico.json` via `api/export/[entity].[format]` (D-34): the ranking plus window and source metadata.
- Copy without national-coverage claims (D-01).

## Non-Goals

- Supplier data collection and CNPJ hydration (FEAT-003).
- Estimating competitors' total revenue or market share.

## Constraints

- Constitution: competitor figures are observed awarded results, never revenue; the source is cited; no national-coverage claim.
- Decisions D-01, D-13, D-34.

## Relevant Knowledge

- [[KNOW-009]] competitors and observed history
- [[KNOW-003]] disclaimer and wording
- [[KNOW-025]] `award_items`, `suppliers`
- [[KNOW-022]] export endpoint

## Open Questions

- How "principal família" is computed. ([[KNOW-009]])
- Time window of the history KPIs (PoC 12 months vs. stats 24 months vs. retention 36 months). ([[KNOW-009]])
- Ranking order when item count and value disagree. ([[KNOW-009]])
