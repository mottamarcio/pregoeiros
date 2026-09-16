---
id: KNOW-008
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
  - path: ai/raw/uiux-specification.md
    fingerprint: sha256:b408cfa091b5c325182f3ecfdd59f7973fe7b8f8c6a5cc3dae6e7b2d305bbf54
---

# KNOW-008

## Summary

"Analisar" covers Histórico and Preços Praticados — Pregoeiros' analytical
surfaces. Aggregation runs in PostgreSQL (never in Node.js over full result
sets), and every derived statistic must be clearly and explicitly
distinguished from data supplied directly by Compras.gov.br.

## Known Facts

- **Preços Praticados** — route `/precos`. The official "preços praticados"
  API module is the primary source for this feature. Filters: Produto/
  serviço, Período, UF, Órgão, Quantidade (when supported by the data).
  Pregoeiros calculates: mediana, média, mínimo, máximo, quartis, número de
  observações. The UI must explicitly distinguish API-supplied data from
  Pregoeiros-derived statistics.
- **Histórico** — route `/historico`. Described as one of the main analytical
  areas. Tabs: Fornecedores, Produtos, Compradores, Preços, Contratações.
  Global filters: Período, UF, Produto/serviço, Comprador. Example metrics
  shown: resultados observados, fornecedores (count), compradores (count),
  and a ranked fornecedor table (resultados, valor). Explicit rule: must NOT
  use language like "empresa que mais ganha licitação" when the real metric
  is item-result count — see terminology rules in [[KNOW-010]].
- **Analytics architecture**: queries run primarily against PostgreSQL, e.g.
  `/historico/precos → HistoryService → PriceRepository →
  SELECT percentile_cont(...), avg(...), min(...), max(...), count(...) FROM
  ...`. Large datasets must NOT be loaded into Node.js merely to calculate
  aggregates; PostgreSQL should calculate counts, sums, averages,
  percentiles, grouping, ranking, and time buckets. Application code only
  transforms query results into view models.
- **Derived metrics** the app may calculate: mean price, median price,
  minimum, maximum, quartiles, result counts, supplier counts, buyer counts,
  time-series aggregations. Derived metrics MUST be distinguishable from
  fields supplied directly by Compras.gov.br, and terminology must accurately
  reflect the underlying unit (e.g. never relabel "37 procurement item
  results" as "37 licitações vencidas" unless the data actually establishes
  that relationship).
- **Historical data strategy** distinguishes three concepts: current state
  (latest normalized entity, e.g. `procurements`), observation (an
  externally observed fact, e.g. `price_observations`), and change history
  (a record that an entity materially changed, future tables
  `procurement_events`/`procurement_snapshots`). The app should NOT create
  daily snapshots for unchanged entities; content hashing can prevent
  duplicate state storage once snapshots are introduced.
- **UI content rules for Analyze pages**: page title "Histórico Observado &
  Analytics" per the POC, with a recommended production alternative
  "Histórico Observado & Análises" (avoid mixing Portuguese with English
  "Analytics" in production copy). Subtitle: "Análise multidimensional
  agregada de resultados de itens e compras públicas." Export action label
  should be "Exportar JSON" (not "Exportar Dataset JSON", which was POC-only
  wording). Historical KPI examples: "Resultados Observados", "Fornecedores
  com Resultados", "Órgãos Compradores Ativos" — supporting text must always
  specify scope/period, e.g. "Homologados nos últimos 12 meses"; never show a
  historical aggregate without enough context to understand its period and
  dataset.
- **Historical supplier ranking presentation**: recommended heading
  "Fornecedores por Volume de Resultados Homologados"; supporting text
  "Itens adjudicados com sucesso no período selecionado"; columns Posição &
  Razão Social, CNPJ, Resultados Homologados, Valor Total Observado,
  Principal Categoria. The word "observado" should be used whenever coverage
  is constrained by the imported dataset. Ranked position is shown neutrally
  (#1, #2, #3) with an explicit sort description, e.g. "Ordenado por
  quantidade de itens homologados no período" — avoid ambiguous labels like
  "Melhores fornecedores" since ordering reflects a metric, not a quality
  judgment.
- **Product price trend chart**: title "Tendência Histórica de Preços
  Praticados"; legend "Preço Homologado (R$)" (primary series, slate-900) and
  "Mediana Móvel" (reference series, emerald-500); must include a time axis,
  value axis, tooltip, accessible data representation, and a period selector
  when supported. Period presets for historical product analytical filters:
  "6 meses", "12 meses", "24 meses", "Personalizado".
  Every chart should have an accessible tabular/textual representation where
  practical; analytics pages should prioritize exact values/tables when the
  question is better answered numerically (see [[KNOW-009]] for chart role
  in the design system).
- Recommended copy for statistical labels: "Preço Mediano" (not "Preço
  Mediana"); "Mediana calculada" or "Mediana observada" (not "Mediana
  Oficial", unless the source truly defines it as official). Avoid
  qualitative claims such as "Mais robusto que a média" unless they
  materially help the user understand the statistic — prefer factual
  explanatory copy.

## Constraints

- Aggregation belongs in PostgreSQL, not application memory (see [[KNOW-004]]).
- Every derived metric display must show metric, period, and (where useful)
  observation count.
- Never imply a Pregoeiros-calculated statistic is an official/source value.

## Unknowns

- No explicit chart library is chosen — ADR-008 selects a Svelte-compatible
  visualization library only once the first analytical visualization is
  implemented.
- Exact SQL/view design for the Histórico tabs is not specified beyond the
  general PostgreSQL-aggregation principle.

## Conflicts

None identified — PRD, architecture spec, and UI/UX spec agree on the
observed-vs-derived distinction and on keeping aggregation in PostgreSQL.

## Provenance

- Preços/Histórico product requirements: `ai/raw/product-requirements-specification.md` §9, §12.
- Analytics architecture, derived metrics, historical data strategy:
  `ai/raw/architecture-specification.md` §29–31.
- UI copy, chart legend/rules, period presets, terminology corrections:
  `ai/raw/uiux-specification.md` §70–73, §96–99, §113, §135, §142.

## Related Topics

[[KNOW-004]], [[KNOW-006]], [[KNOW-009]], [[KNOW-010]]
