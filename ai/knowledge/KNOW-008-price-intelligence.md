---
id: KNOW-008
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-008 — Price Intelligence (Products & Practiced Prices)

## Summary

The Products & Prices page (`/produtos`, alias `/precos`) lets the company
select an item from its operational catalog (linked to CATMAT/CATSER) and see
statistics computed **only over awarded results in the local base**, within an
explicit time window and with a minimum sample size, plus a simple trend chart
and the latest awards.

## Known Facts

- Operational catalog = items the company monitors, linked to CATMAT/CATSER (`watched_products` → `catalog_items`).
- On selecting an item, show: median, weighted mean, standard deviation, observed min/max, N observations, N distinct suppliers.
- Simple historical series (chart) and a table of latest awards (órgão, adjudicated supplier, quantity, unit price, award date).
- Actions: save product (favorite), create alert for the item.
- **Stats rule** (business rule 6): computed only over awards in the local base, with an explicit window (e.g. 24 months) and a minimum N to display the median.
- `PriceStatsService` over `award_items`:
  - default window 24 months;
  - median via `percentile_cont(0.5)`;
  - weighted mean (D-11): `sum(valor_unitario × quantidade) / sum(quantidade)` over rows with `quantidade > 0`; if no row in the sample has a quantity, fall back to the simple mean and the UI flags "média simples";
  - sample standard deviation (`stddev_samp`);
  - min/max with órgão and context (warranty, on-site) if the item text provides it (`award_items.contexto`);
  - display only if `n >= 5` (configurable); below that the UI says **"amostra insuficiente"**;
  - **D-02:** at `n >= 30` the UI shows a "amostra robusta" badge; this is the same threshold used by the product metric "catalog items with ≥ 30 observations" — the two thresholds are intentionally distinct;
  - **D-12:** N = number of **awarded items** (rows of `award_items`) in the window, with a secondary display "em X compras distintas".
- Stats are **not materialized** in v1 (YAGNI); computed by aggregate query, with short cache (5–15 min) if needed. Preferably via a SQL function in `PriceStatsService`.
- Index `award_items (catmat, homologado_em)` supports the query.
- `priceStats(sample)` is a pure function with unit tests first.
- The PoC chart is a simple SVG (homologation line + dashed "Mediana Móvel"); Chart.js is not required in v1. Component `$lib/components/charts/PriceTrendSvg.svelte`.
- `modulo-pesquisa-preco` (P1) supplements prices when the 14.133 award series for a CATMAT is short; the stats service must tag the **source** (`resultado_14133` vs `pesquisa_preco`) so they are not mixed silently in the UI.
- Route `/precos` redirects to `/produtos`; product selection via query `?produto=<internal id or catmat>` (not a mutation).
- PoC labels: "Catálogo de Produtos & Análise de Preços Praticados", "Mediana Calculada — Mais representativa que a média", "Média Ponderada", "Menor/Maior Preço Observado", "Observações Coletadas", "Base: últimos 24 meses (N itens homologados)", "Fonte: Dados Compras.gov.br".
- Acceptance: the median of a CATMAT is shown with N and window visible.

## Constraints

- Never present computed stats as an "official government price" (see [[KNOW-003]]).
- The window and N must be visible alongside the median.

## Unknowns

- How the "Mediana Móvel" (moving median) line in the PoC chart is computed (window, bucket size) — not specified.
- Whether stats are filtered by UF/órgão or only by CATMAT — the SQL example filters only by `catmat` and date.
- How `contexto` (warranty, on-site) is extracted from item text.
- Unit normalization across awards (e.g. unit vs box) — not addressed.

## Conflicts

- None remaining. Resolved by decisions:
  - weighted mean vs. `avg` example → D-11 (the Data Model SQL example must be corrected at implementation);
  - unit of N (purchases vs items) → D-12;
  - n ≥ 5 vs. ≥ 30 → D-02.

## Provenance

- Page scope and stats rule: `ai/raw/01-PRD.md` §4.4, §6.6, §10.5.
- Not materialized, cache: `ai/raw/02-ARCHITECTURAL_SPECS.md` §7.
- `PriceStatsService` details, SVG chart, TDD: `ai/raw/03-TECHNICAL_SPECS.md` §7, §10.1.
- Pesquisa de preço source tagging, `?produto=`: `ai/raw/04-API_SPECS.md` §6, §10, §11.
- Stats SQL, index: `ai/raw/05-DATA_MODEL_SPECS.md` §5.3, §8.3.
- PoC labels and chart: `ai/raw/pregoeiros.html` (view-produtos, `selectProduct`).
- Decisions D-02, D-11, D-12: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-025]] `award_items` / `catalog_items`
- [[KNOW-026]] `watched_products`
- [[KNOW-019]] `modulo-pesquisa-preco`, `modulo-material`
- [[KNOW-030]] PoC anchor products and sample values
