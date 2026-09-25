---
id: FEAT-008
type: feature
status: draft
parent: PRG-001
---

# FEAT-008 — Price Intelligence

## Capability

The Products & Practiced Prices page:

- the company's monitored catalog items (CATMAT/CATSER);
- per-item statistics computed from locally stored awarded results within an explicit window and a minimum sample;
- a simple trend chart and the latest awards.

## User Value

The pricer bases proposals on observed awarded prices — median, weighted
mean, spread, min/max with context, and N with its window — instead of gut
feeling. This covers acceptance criterion 5.

## Scope

- `/produtos` (and `/precos` redirect) with `?produto=<internal id or catmat>` selection:
  - catalog cards with the computed median;
  - detail with median (`percentile_cont(0.5)`), weighted mean (D-11), sample standard deviation, min/max with órgão and context, and N;
  - N counts awarded items, shown with "em X compras distintas" (D-12);
  - window (default 24 months) and N always visible;
  - "amostra insuficiente" below n = 5; "amostra robusta" at n ≥ 30 (D-02).
- `PriceStatsService` / `priceStats(sample)`: pure, unit-tested, not materialized, optional short cache (5–15 min).
- Trend chart as simple SVG (`PriceTrendSvg.svelte`) and the latest-awards table.
- Source tagging: `resultado_14133` vs `pesquisa_preco`, never mixed without a label. The price-research complement is P1, delivered in F3 (D-29).
- `watched_products` usage for the catalog list; actions "Salvar Produto" (favorite via FEAT-007) and "Criar Alerta para este Item" (via FEAT-006).

## Non-Goals

- Collecting awards or catalog entries (FEAT-003).
- Presenting any value as an "official government price".
- Predictive pricing or ML.

## Constraints

- Constitution:
  - stats come only from local awards, with window and N visible;
  - no median below the minimum sample;
  - sources are labeled;
  - derived metrics are distinguished from observations;
  - exact decimals for money.
- Decisions D-02, D-11, D-12, D-29.

## Relevant Knowledge

- [[KNOW-008]] price intelligence
- [[KNOW-025]] `award_items`, `catalog_items`
- [[KNOW-026]] `watched_products`
- [[KNOW-003]] terminology constraints

## Open Questions

- How the moving-median line is computed (window, bucket). ([[KNOW-008]])
- Whether statistics can be filtered by UF/órgão or only by CATMAT. ([[KNOW-008]])
- How `contexto` (warranty, on-site) is extracted from item text. ([[KNOW-008]])
- Unit normalization across awards (unit vs. box). ([[KNOW-008]])
- How monitored products are added/removed in production (niche onboarding). ([[KNOW-001]])
