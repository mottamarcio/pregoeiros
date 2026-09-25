---
id: KNOW-024
type: knowledge
status: active
sources:
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-024 — Data Model Conventions, Tenancy, Integrity and Upserts

## Summary

The PostgreSQL 16 model separates a **mirrored public dataset** (logically
read-only, re-collectable) from **product data** (triage, alerts, favorites)
so re-collection never erases analyst decisions. This topic holds the
cross-cutting conventions: keys, types, tenancy, enums, foreign-key policies,
migrations and the upsert contract.

## Known Facts

- **Conventions:**

  | Topic | Rule |
  |---|---|
  | Internal PK | `uuid` default `gen_random_uuid()` |
  | Official key | own columns (`id_compra`, `numero_controle_pncp`, `catmat`, `cnpj`) with UNIQUE |
  | Timestamps | `timestamptz` |
  | Money | `numeric(18,2)` |
  | Search text | persisted `*_normalizado` column, written with the single `normalizeSearch` function (D-10) |
  | Raw payload | optional `jsonb raw` — useful for amendment diff |
  | Soft delete | only on product entities (`alerts.deleted_at`) |
  | Tenant | `tenant_id uuid` on product tables (v1: a single seeded tenant; repositories must filter by the session tenant — D-21) |
  | Names | `snake_case` in SQL; camelCase in TypeScript |

- Enums are **native PostgreSQL** enums: `triage_status`, `urgency_level` (gains `sem_prazo`, D-04), `procurement_situation` (`recebendo_propostas`, `em_disputa`, `homologado`, `cancelado`, `excluido`, `outro`), `radar_event_type`, `favorite_type`, `catalog_kind` (`material`, `servico`), `sync_status`, `source_status`. (Values of the others are recorded in their feature topics.)
- **Logical diagram:** `tenants` → `users`, `alerts`, `favorites`, `triage_decisions` → `procurements`, `radar_events` → `procurements`, `watched_products` → `catalog_items`; `procurements` ← `procurement_items` → `catalog_items`; `award_items` → `suppliers`, `catalog_items`; `contracts` → `contract_items` → `suppliers`; standalone `sync_runs`, `source_heartbeats`, `sync_cursors`.
- **Official IDs are never invented** (business rule 1); internal UUIDs and official IDs are never mixed.
- **Upsert** by official natural key: `id_compra` / `numero_controle_pncp` for procurements; **`(procurement_id, numero_item)`** for items, with `id_compra_item` UNIQUE when present (D-36; `id_item` in the architecture text is a typo).
- **Upsert example (procurements):** `INSERT … ON CONFLICT (id_compra) WHERE id_compra IS NOT NULL DO UPDATE SET objeto, objeto_normalizado, content_hash, last_seen_at = now(), raw`. If `content_hash` changed on UPDATE, the service emits a `retificacao` radar event.
- UNIQUE on official IDs accepts NULLs (two NULLs don't collide in Postgres); therefore `id_compra` and `numero_controle_pncp` are **separate** UNIQUE constraints, and the upsert uses `COALESCE` on the available key.
- **FK policy:** `ON DELETE CASCADE` only from a notice to its items/derived events (including `radar_events.procurement_id`, D-38); historical `award_items` are never deleted with the header — `award_items.procurement_id` **and** `award_items.procurement_item_id` use `ON DELETE SET NULL` (D-35).
- **Migrations:** versioned (Drizzle or SQL in `src/lib/server/db/migrations`); every migration is backward-compatible within the same major.
- Price statistics are not materialized in v1; supplier aggregates may be an optional materialized view.
- PoC → table mapping: queue fields → `procurements`; GO/Pendente badge → `triage_decisions.status`; "4 pendentes"/"2 urgentes" → aggregates of `v_triage_queue`; sheet items → `procurement_items`; habilitation checklist → `procurement_requirements` or empty; active alerts → `alerts`; "7 novos" → `alerts.new_matches`; radar → `radar_events`; products/median → `watched_products` + query on `award_items`; competitors → `suppliers` + `supplier_stats`; contracts 30/60/90 → `contracts.vigencia_fim`; favorites → `favorites`; last collection → `sync_runs`; sources operating → `source_heartbeats`.
- **Decision D-21 — tenancy in v1:** `tenant_id` stays on product tables from v1 with a single tenant; every repository filters by `tenant_id` from the session (`event.locals`); no RLS in v1. The future extension is "real multi-client support (SSO, billing, RLS)".

## Constraints

- Re-collection must never erase product data (decisions, alerts, favorites, seen flags).
- Soft delete only for product entities.
- Migrations must stay backward-compatible within a major version.

## Unknowns

- How "`COALESCE` on the available key" works in practice, given `ON CONFLICT` targets a single constraint — the upsert path for rows with only `numero_controle_pncp` is not defined.
- How to deduplicate a procurement first seen with one official key and later with the other.

## Conflicts

- None remaining. `award_items` FK resolved by D-35; natural key naming resolved by D-36; tenancy timing resolved by D-21.

## Provenance

- Conventions, enums, diagram, integrity, upsert, PoC mapping: `ai/raw/05-DATA_MODEL_SPECS.md` intro, §1, §2, §3, §12, §13, §14.
- Upsert by natural key, stats not materialized: `ai/raw/02-ARCHITECTURAL_SPECS.md` §7.
- Official IDs never invented: `ai/raw/01-PRD.md` §6.1.
- Decisions D-04, D-10, D-21, D-35, D-36, D-38: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-025]] public mirror schema
- [[KNOW-026]] product data schema
- [[KNOW-027]] retention policy
- [[KNOW-021]] sync tables
