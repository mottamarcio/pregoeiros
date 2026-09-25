---
id: KNOW-011
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

# KNOW-011 — Niche Alerts and Alert Matching

## Summary

Alerts (called "Interesses" in the PoC code) are saved rules — name + item/CATMAT
+ UF + buyer/sphere — that match newly collected procurements. Each match
increments a counter and produces an unseen Radar event.

## Known Facts

- **Saved alerts page (`/alertas`):** rules composed of name + item/CATMAT + UF + órgão/esfera; count of new matches; shortcut "Triar oportunidades" applies filters **without inheriting dirty state**.
- PoC create-alert modal fields: "Nome do Alerta Comercial" (label shown in the queue and Radar), "Catálogo Padronizado (CATMAT / CATSER)" (dropdown of catalog items), "UF de Entrega" (Brasil – Todas / RJ / SP / DF / MG), "Esfera / Comprador" (Todos os órgãos / Poder Judiciário (TRF) / Ministérios (Executivo) / Forças Armadas).
- An alert can also be created from a product on the Products page ("Criar Alerta para este Item").
- **Match rule** (business rule 3): a notice matches an alert if item/CATMAT (or normalized object text) **AND** UF (unless "Todos") **AND** órgão (unless "Todos") coincide.
- **Match flow:** new item persisted → for each active alert: if CATMAT/text matches AND UF matches AND órgão matches → increment `new_matches` and create `radar_event` (type `contratacao`, `seen=false`).
- The matcher runs in the collection job after procurements/items/results sync (`AlertMatcher.processNew(ids)`).
- `matchesAlert(alerta, edital, itens)` is a pure function with unit tests first.
- `alert-matcher.ts` is an application service; repositories must not contain match rules.
- Form actions: `createAlert` (fields `name, product, uf, buyer`) creates the alert + an "alerta ativado" radar event; `deleteAlert` (`id`) removes the rule.
- Storage: `alerts` (`product_query`, `catmat`, `uf` NULL = Todos, `buyer` NULL = Todos, `new_matches`, soft delete `deleted_at`) and `alert_matches` (PK `alert_id, procurement_id`) for match audit.
- **Decision D-16 — "Triar oportunidades" shortcut:** navigates to Opportunities, resets filters, then applies **all three** alert criteria — product, UF and órgão (via the new `orgao` filter/querystring). The PoC version, which ignores the buyer, is outdated.
- **Decision D-17 — match granularity:** matching is evaluated **per notice**, aggregating its items; at most 1 `alert_matches` row and 1 `radar_event` per (alert, notice), idempotent via PK `(alert_id, procurement_id)`; `new_matches` increments only when the match row is first inserted.
- **Decision D-39 — alert deletion:** `deleteAlert` soft-deletes (`deleted_at`); the matcher ignores deleted alerts; `alert_matches` is kept for audit (purge details in [[KNOW-026]]).
- The upstream `codigoOrgao` parameter is noted as usable for an alert's órgão filter.
- BDD example: given alert "Notebooks no RJ", when the job persists a notebook procurement in RJ, then the Radar shows 1 unseen `contratacao` event.
- Acceptance: create alert "Notebooks no RJ" and receive a Radar event after the next collection.

## Constraints

- Match rules live in the service layer, not in repositories or SQL-only logic.

## Unknowns

- **Buyer vs. sphere.** The rule says "órgão", the PoC form offers spheres ("Poder Judiciário (TRF)", "Ministérios", "Forças Armadas"), and the schema stores free-text `buyer`. How a sphere maps to concrete órgãos/codes is not specified.
- Text matching semantics when CATMAT is absent ("texto normalizado do objeto") — substring, token AND, trigram similarity? Not specified.
- When/how `new_matches` is reset (on viewing? on "Triar oportunidades"?) — not specified.
- Whether an alert is matched against procurements already in the base at creation time (the PoC seeds `newMatches: 1` on creation).
- Which radar event type the "alerta ativado" event uses — the PoC uses `contratacao`; the enum also has `sistema`.

## Conflicts

- None remaining. Resolved by decisions:
  - PoC seed alert UF mismatch → D-15 (seed fix recorded in [[KNOW-030]]);
  - shortcut ignoring buyer → D-16;
  - match granularity → D-17.

## Provenance

- Alerts page and match rule: `ai/raw/01-PRD.md` §4.8, §6.3, §10.4.
- Match flow, service responsibilities: `ai/raw/02-ARCHITECTURAL_SPECS.md` §2.1, §5.3, §5.4, §6.
- TDD and BDD: `ai/raw/03-TECHNICAL_SPECS.md` §10.1, §10.3.
- Actions, `codigoOrgao`: `ai/raw/04-API_SPECS.md` §2.1, §10.
- Tables: `ai/raw/05-DATA_MODEL_SPECS.md` §6.2.
- PoC modal, shortcut, seed alerts: `ai/raw/pregoeiros.html` (modalCreateInterest, `handleSaveInterest`, `filterProcurementsByInterest`, `state.interests`, `state.radarEvents`).
- Decisions D-15, D-16, D-17, D-39: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-012]] radar events
- [[KNOW-021]] collection job (matcher step)
- [[KNOW-026]] `alerts` / `alert_matches`
