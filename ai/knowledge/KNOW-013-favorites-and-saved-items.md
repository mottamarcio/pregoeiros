---
id: KNOW-013
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-013 — Favorites / In Dispute (`/salvos`)

## Summary

The "Em Disputa / Salvos" view gathers everything the company marked: notices
(including those decided GO), catalog items and suppliers, filterable by type
and removable.

## Known Facts

- Marked entities: notices (editais), catalog items, suppliers.
- Filter by type + removal. Querystring `tipo=all|contratacao|produto|fornecedor`.
- Enum `favorite_type`: `contratacao`, `produto`, `fornecedor`.
- Action `toggleFavorite` (fields `type`, `targetId`) → upsert/delete; used from several pages.
- Table `favorites`: `type`, one of `procurement_id` / `catalog_item_id` / `supplier_id`, `title`, `code`, `note`, `created_at`. Check: **exactly one FK filled according to `type`**.
- Acceptance: mark GO and find the notice in "Em Disputa / Salvos".
- PoC page title "Editais Salvos & Entidades Acompanhadas" — "Oportunidades que você selecionou para triagem, concorrentes ou itens estratégicos". Tabs: "Todos", "Editais / Oportunidades", "Itens de Catálogo", "Fornecedores". Each entry shows title, code (e.g. "Pregão 42/2026 • R$ 1.840.000", "CATMAT 482910", "CNPJ …") and a label ("Marcado para Disputar (GO)", "Item Estratégico", "Concorrente Monitorado"); notices have a "Ficha do Edital" button; a trash icon removes.
- The sidebar shows the favorites count.
- **Decision D-20 — favorite identity:** favorites are identified by FK, never by title/code text. Partial UNIQUE indexes make the toggle idempotent: `(tenant_id, procurement_id) WHERE type='contratacao'`, `(tenant_id, catalog_item_id) WHERE type='produto'`, `(tenant_id, supplier_id) WHERE type='fornecedor'`.
- **Decision D-05 — origin:** `favorites.origin` (`manual` | `triage`, default `manual`); GO creates a favorite with `origin='triage'`, and leaving GO removes only that one (flow in [[KNOW-004]]).

## Constraints

- A favorite references exactly one target entity.

## Unknowns

- None remaining (GO→NO-GO behavior resolved by D-05; duplicate prevention resolved by D-20).

## Conflicts

- None remaining. PoC ad-hoc text matching superseded by the FK model (D-20).

## Provenance

- View scope: `ai/raw/01-PRD.md` §4.9, §10.3.
- Action and querystring: `ai/raw/04-API_SPECS.md` §10, §11.
- Enum, table, check: `ai/raw/05-DATA_MODEL_SPECS.md` §3, §6.4.
- PoC copy and behavior: `ai/raw/pregoeiros.html` (view-favoritos, `renderFavorites`, `toggleFavoriteSupplier`, `toggleActiveProductFavorite`).
- Decisions D-05, D-20: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-004]] GO decision creates a favorite
- [[KNOW-026]] `favorites` table
