---
id: FEAT-007
type: feature
status: draft
parent: PRG-001
---

# FEAT-007

## Capability

Let a user mark a specific product, procurement, or supplier as a Favorite
and manage the resulting list — the minimal "Acompanhar" capability needed
to validate the favorite flow end-to-end for this Program.

## User Value

Lets a user say "quero acompanhar especificamente esta entidade" and find
those entities again quickly from one place, without needing a rule-based
Interest.

## Scope

- `favorites` persistence: `id, user_id, entity_type, entity_id,
  created_at`, with `entity_type` limited to `catalog_item`, `procurement`,
  `supplier` for this Program (`contract` deferred until Contratos ships).
  Service-layer validation that the referenced entity actually exists.
- Favoritar/★ toggle control embedded on FEAT-003 (produto), FEAT-004
  (contratação), and FEAT-005 (fornecedor) pages.
- `/favoritos` page: tabs Todos/Produtos/Fornecedores/Contratações, row
  showing entity title, type, code, and a remove action; category and
  global empty states per KNOW-007/KNOW-010.
- Toast feedback on favorite/unfavorite actions.

## Non-Goals

- Interesses (rule-based monitoring) and Radar (event inbox) — explicitly
  out of Program scope; this Feature must not blur the Favoritos/Interesses
  distinction even though only Favoritos ships now.
- A dedicated "Contratos" favorites tab/entity type — deferred until
  Contratos itself is in scope (v0.2); note the unresolved PRD/UI-spec
  conflict on this point from KNOW-007.

## Constraints

- Favoriting/unfavoriting are reversible actions and must never require
  confirmation.
- The favorite toggle must be the same shared `FavoriteButton` component
  everywhere it appears (Produtos, Contratações, Fornecedores) — never a
  bespoke implementation per page.
- Must validate entity existence server-side before persisting a favorite.

## Relevant Knowledge

[[KNOW-007]] (Favoritos definition, schema, UI), [[KNOW-009]]
(`FavoriteButton` component consistency rule), [[KNOW-010]] (Favoritos vs.
Interesses messaging, toast copy conventions).

## Open Questions

- Whether to include a `Contratos` tab placeholder now (disabled) or omit
  it entirely until Contratos ships — left to Spec-level decision, carrying
  forward the KNOW-007 PRD/UI-spec inconsistency noted at the Program
  level.
