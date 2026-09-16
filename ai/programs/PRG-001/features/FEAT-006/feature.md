---
id: FEAT-006
type: feature
status: draft
parent: PRG-001
---

# FEAT-006

## Capability

Let a user query the practiced-prices dataset (preços praticados) with
product/period/UF/órgão/quantity filters and see Pregoeiros-calculated
statistics (mediana, média, mínimo, máximo, quartis, observation count)
clearly separated from the source data they're derived from.

## User Value

Directly answers "quanto o governo vem pagando por esse produto?" as a
dedicated, filterable analytical view, independent of browsing to a single
product's page first.

## Scope

- `/precos` page: filters for Produto/serviço, Período, UF, Órgão,
  Quantidade (applied only when supported by the underlying data).
- Computed statistics (mediana, média, mínimo, máximo, quartis, número de
  observações), calculated in PostgreSQL (aggregate SQL), never in
  application memory over a full result set.
- Explicit, consistent visual/textual separation between "dado da API" and
  "estatística derivada pelo Pregoeiros" everywhere both appear on this
  page.
- URL-driven filter state.

## Non-Goals

- Multi-period trend charts and comparisons across 6/12/24-month presets —
  that level of historical analytics belongs to the future Histórico
  Program (v0.5); this Feature covers the current/period-filtered
  statistical view only.
- Export beyond what's already covered generically (CSV/JSON on this page
  is in scope as a standard table capability, not a distinct concern).

## Constraints

- PostgreSQL performs all aggregation (`percentile_cont`, `avg`, `min`,
  `max`, `count`, grouping) — the app must never load raw observations into
  Node.js merely to compute these.
- Every displayed statistic must state its label precisely (e.g. "Preço
  Mediano", "Mediana calculada") and must never be presented as an
  official/source figure unless it genuinely is one.
- Must implement loading, empty, error, stale, and success states.

## Relevant Knowledge

[[KNOW-008]] (Preços Praticados scope, derived statistics rules, analytics
architecture), [[KNOW-004]] (PostgreSQL-side aggregation constraint),
[[KNOW-010]] (terminology precision).

## Open Questions

- None specific to this Feature beyond the Program-level ADRs already
  tracked in PRG-001 and FEAT-001/FEAT-002.
