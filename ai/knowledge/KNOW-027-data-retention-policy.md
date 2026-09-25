---
id: KNOW-027
type: knowledge
status: active
sources:
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-027 — Data Retention Policy (v1)

## Summary

v1 keeps only the data windows the product needs, purged by a weekly job.

## Known Facts

| Data | v1 policy |
|---|---|
| open `procurements` | while `situacao` is active + 180 days |
| `award_items` | 36 months (24-month stats + margin) |
| `contracts` | delete when `vigencia_fim` < today − 30 days; **no upper bound** (D-14; the Data Model's "≤ today+180d" bound is dropped because the collector never fetches beyond +120 days) |
| `radar_events` | 90 days |
| `raw jsonb` | 90 days, then set to NULL (savings) |
| `sync_runs` | 180 days |
| soft-deleted `alerts` | hard-deleted 90 days after `deleted_at` (D-39) |

- A weekly purge job runs (it can be the Sunday cron).
- The collection contract stores `raw_payload` jsonb optionally for the first 90 days, useful for amendment detection.

## Constraints

- Purging `raw` must not break amendment detection, which relies on `content_hash` (persisted separately).

## Unknowns

- Whether purging a procurement also purges its `triage_decisions`, `favorites` and `alert_matches` (cascade rules exist for some — see [[KNOW-026]]) — the effect on product data (e.g. a GO decision for an old notice) is not discussed.
- Which `situacao` values count as "active".
- Retention for `favorites`, `procurement_items`, `suppliers`, `catalog_items` — not stated (deleted `alerts` resolved by D-39).

## Conflicts

- None remaining. Contract retention vs. collection window resolved by D-14.

## Provenance

- Retention table and purge job: `ai/raw/05-DATA_MODEL_SPECS.md` §11.
- Raw payload first 90 days: `ai/raw/04-API_SPECS.md` §8.
- Decisions D-14, D-39: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-021]] scheduled collection (Sunday job)
- [[KNOW-024]] data model conventions
