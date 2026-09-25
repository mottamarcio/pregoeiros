---
id: KNOW-026
type: knowledge
status: active
sources:
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-026 — Product (Tenant) Data Schema

## Summary

Tables owned by Pregoeiros itself — platform (tenants, users) and tenant-scoped
product data (watched products, triage decisions, alerts, alert matches, radar
events, favorites, habilitation requirements). They survive re-collection of
the public mirror.

## Known Facts

- **`tenants`**: `id` uuid PK; `name` NOT NULL; `created_at`.
- **`users`**: described in [[KNOW-023]].
- **`watched_products`** (items the company tracks on the Products page): `id`; `tenant_id` NOT NULL FK; `catalog_item_id` NOT NULL FK → `catalog_items`; `sort_order` int default 0; `created_at`; UNIQUE `(tenant_id, catalog_item_id)`.
- **`triage_decisions`** (separate from the mirror to survive re-import): `id`; `tenant_id` NOT NULL FK; `procurement_id` NOT NULL FK ON DELETE CASCADE; `status` `triage_status` NOT NULL default `pendente`; `motivo`; `decided_by` FK → users; `decided_at`; `updated_at` default now(); UNIQUE `(tenant_id, procurement_id)`.
- **`alerts`**: `id`; `tenant_id` NOT NULL FK; `name` NOT NULL; `product_query` NOT NULL (name / CATMAT); `catmat`; `uf` (NULL = Todos); `buyer` (NULL = Todos); `new_matches` int NOT NULL default 0; `created_at`; `deleted_at`.
- **Decision D-39 — alert deletion:** soft delete via `deleted_at`; `alert_matches` rows are kept for audit; the weekly purge hard-deletes alerts whose `deleted_at` is older than 90 days (which then cascades to `alert_matches`).
- **`alert_matches`** (match audit): `alert_id` FK ON DELETE CASCADE; `procurement_id` FK ON DELETE CASCADE; `matched_at`; PK `(alert_id, procurement_id)`.
- **`radar_events`**: `id`; `tenant_id` NOT NULL FK; `type` `radar_event_type` NOT NULL; `procurement_id` FK `ON DELETE CASCADE` (D-38); `alert_id` FK; `title` NOT NULL; `subtitle`; `detail`; `seen` boolean NOT NULL default false; `created_at`. Index `radar_unread_idx (tenant_id, seen, created_at DESC)`.
- **`favorites`**: `id`; `tenant_id` NOT NULL FK; `type` `favorite_type` NOT NULL; `procurement_id`, `catalog_item_id`, `supplier_id` FKs; `title` NOT NULL; `code`; `note`; **`origin`** (`manual` | `triage`, default `manual` — D-05); `created_at`. Partial UNIQUE indexes per type on `(tenant_id, <target FK>)` (D-20, see [[KNOW-013]]).
- **`procurement_requirements`** (optional in v1): `id`; `procurement_id` NOT NULL FK ON DELETE CASCADE; `texto` NOT NULL; `ok_sugerido` boolean. May stay empty or receive manual per-segment rules if upstream doesn't structure requirements.
- **`v_triage_queue`** view joins `procurements` with `triage_decisions` (decision/urgency/days computation in [[KNOW-004]]).

## Constraints

- Product tables carry `tenant_id` (single seeded tenant in v1).

## Unknowns

- `procurement_requirements` has no `tenant_id` even though `ok_sugerido` may reflect a company-specific assessment; whether it is public-derived or tenant data is unclear.
- `alert_matches` has no `tenant_id` (inherits via `alert_id`).
- ON DELETE policy for `radar_events.alert_id` (only `procurement_id` was decided, D-38); with soft-deleted alerts purged after 90 days, a policy is needed for radar events still referencing them.

## Conflicts

- None remaining. Radar cascade resolved by D-38; alert soft vs. hard delete resolved by D-39.

## Provenance

- All tables and the view: `ai/raw/05-DATA_MODEL_SPECS.md` §4, §5.6, §6.1–§6.5, §8.1, §13.
- Decisions D-05, D-20, D-38, D-39: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-024]] conventions and integrity
- [[KNOW-004]] triage decisions
- [[KNOW-011]] alerts
- [[KNOW-012]] radar
- [[KNOW-013]] favorites
