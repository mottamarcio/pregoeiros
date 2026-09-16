---
id: FEAT-004
type: feature
status: draft
parent: PRG-001
---

# FEAT-004

## Capability

Let a user search, filter, and inspect procurement processes
(contratações) under Lei nº 14.133/2021, including their items and
homologated results.

## User Value

Answers "quem está comprando?" and lets a user go from a procurement to its
items, results, and the suppliers who were awarded — the core
transaction-level exploration surface of the product.

## Scope

- `/contratacoes` listing: free-text search over objeto/UASG/comprador,
  filters (UF, Modalidade, Período, Situação), server-side pagination,
  table columns (Objeto e Processo, Comprador/Órgão, UF, Modalidade, Valor
  Estimado, Situação, Ação), and CSV export honoring active filters.
- `/contratacoes/[id]` detail (large modal or dedicated page, per KNOW-006
  sizing): Órgão, UASG, Processo, Situação, Favoritar action, and tabs
  Itens e Lotes | Resultados Homologados | Histórico de Alterações (the
  last tab may show only current + observed changes captured so far — no
  full change-history engine is required by this Program).
- Procurement items table (Item, CATMAT/Descrição, Qtd, Valor Unit.
  Estimado, Valor Total) and homologated results table (Órgão Comprador,
  Fornecedor Vencedor, Qtd, Valor Unitário, Data Homologação) inside the
  detail view.
- URL-driven filter/search/page state.

## Non-Goals

- Contratos (contract lifecycle/vigência tracking) — a separate concept
  and out of Program scope (v0.2).
- Interest-rule creation or Radar event generation from procurement
  changes — out of Program scope.
- ARP-related procurement data — out of Program scope.

## Constraints

- Must never imply a supplier "won" a process merely by appearing in it —
  only effectively homologated/observed results justify that language.
- UASG and process number render as tertiary monospace metadata, not as
  the primary row/page identifier — objeto title remains the strongest
  visual element.
- Reads exclusively from PostgreSQL (via FEAT-002's repositories/sync
  data), never a live Compras.gov.br call on page render.
- Must implement loading, empty, error, stale, and success states; large
  exports must be filtered server-side, never downloaded unfiltered and
  filtered client-side.

## Relevant Knowledge

[[KNOW-006]] (Contratações routes/UI structure), [[KNOW-004]] (pagination/
export architecture), [[KNOW-010]] (terminology precision, export UX).

## Open Questions

- Whether "Histórico de Alterações" in the detail modal requires any actual
  change-tracking (vs. showing only current state) is not fully settled —
  KNOW-008 notes the app "should not create daily snapshots for unchanged
  entities," which suggests this tab may need to gracefully handle having
  no recorded change history yet. Should be resolved at Spec level.
