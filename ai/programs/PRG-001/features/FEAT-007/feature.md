---
id: FEAT-007
type: feature
status: draft
parent: PRG-001
---

# FEAT-007 — Favorites / Em Disputa

## Capability

Marking and unmarking notices, catalog items and suppliers as favorites, and
the "Em Disputa / Salvos" page listing them by type — including the notices
automatically saved when decided GO.

## User Value

The team keeps one place for what it is actively disputing and what it
tracks strategically (key products, competitors). Acceptance criterion 3 —
a GO notice appears in "Em Disputa / Salvos" — is met here.

## Scope

- `favorites` table:
  - `type`, exactly one target FK, `origin` (`manual` | `triage`, D-05);
  - partial UNIQUE indexes per type on `(tenant_id, target)` (D-20);
  - tenant-scoped.
- `toggleFavorite` form action (`type`, `targetId`) with idempotent upsert/delete, usable from the triage sheet, products page and competitors page.
- A favorite service API used by FEAT-004 to upsert/remove the `origin='triage'` favorite on GO changes.
- `/salvos` page:
  - `tipo=all|contratacao|produto|fornecedor` querystring filter;
  - entries with title, code and label ("Marcado para Disputar (GO)", "Item Estratégico", "Concorrente Monitorado");
  - "Ficha do Edital" link for notices; removal.
- Favorites count in the sidebar.

## Non-Goals

- The GO decision itself (FEAT-004).
- Notes or collaboration on favorites beyond the existing `note` field.

## Constraints

- Constitution: product data is tenant-scoped and survives re-collection; a favorite references exactly one target.
- Decisions D-05, D-20.

## Relevant Knowledge

- [[KNOW-013]] favorites and saved items
- [[KNOW-026]] `favorites` table
- [[KNOW-004]] GO → favorite flow

## Open Questions

- Whether the `note` field is editable in v1 UI (Knowledge defines the column but no UI for it).
- Retention of favorites whose target notice is purged. ([[KNOW-027]])
