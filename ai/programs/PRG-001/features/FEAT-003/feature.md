---
id: FEAT-003
type: feature
status: draft
parent: PRG-001
---

# FEAT-003

## Capability

Let a user browse and inspect the CATMAT/CATSER catalog (Produtos e
Serviços) as a single unified interface, including each product's observed
price history and statistics.

## User Value

Answers "o que está sendo comprado?" and "quanto o governo vem pagando por
esse produto?" directly — the entry point for a user who starts from a
product rather than a specific procurement.

## Scope

- `/produtos` listing: unified CATMAT (materials) and CATSER (services)
  catalog with a type filter (Todos/Materiais/Serviços), server-side
  pagination, and product cards showing code, type, description, and
  median observed price.
- `/produtos/[id]` detail: tabs Visão geral | Preços | Contratações |
  Fornecedores; price history section with mediana, mínimo, máximo, and
  observation count, explicitly labeled as Pregoeiros-derived statistics
  (never implied to be an official Compras.gov.br figure unless it
  genuinely is one).
- Favoritar action on both listing and detail (wired to FEAT-007's
  favorite mechanism once available; a disabled/stub button is acceptable
  if sequenced before FEAT-007).
- URL-driven filter/type state (`/produtos?tipo=material`, etc.).

## Non-Goals

- "Criar Interesse" action — Interesses are out of Program scope.
- Full historical charts/comparisons across periods — that belongs to the
  future Histórico Program (v0.5); this Feature shows current observed
  statistics only, not multi-period trend analysis.
- Procurement or supplier detail content beyond what's needed to link out
  from the product's own tabs (those pages are FEAT-004/FEAT-005).

## Constraints

- Every displayed statistic must distinguish source-derived values (e.g. a
  unit price from a specific homologated result) from Pregoeiros-calculated
  ones (e.g. "Mediana calculada") — never label a calculated statistic as
  official unless the source defines it that way.
- CATMAT/CATSER codes must render in JetBrains Mono and must not be
  truncated without the full value remaining available via tooltip/copy.
- Reads exclusively from PostgreSQL (via FEAT-002's repositories) — never a
  live Compras.gov.br call on page render.
- Must implement loading, empty, error, stale, and success states.

## Relevant Knowledge

[[KNOW-006]] (Produtos routes/UI structure), [[KNOW-008]] (derived
statistics rules, price trend legend), [[KNOW-009]] (product card/typography
specs), [[KNOW-010]] (terminology precision, freshness display).

## Open Questions

- None specific to this Feature beyond the Program-level ADRs already
  tracked in PRG-001 and FEAT-001/FEAT-002.
