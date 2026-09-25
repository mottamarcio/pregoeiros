---
id: FEAT-006
type: feature
status: draft
parent: PRG-001
---

# FEAT-006 — Niche Alerts and Radar

## Capability

Saved niche alert rules (item/CATMAT + UF + órgão), per-notice matching of
newly collected procurements against them, and the Radar inbox of events
(new matching opportunities, amendments, awarded results) with seen/unseen
state.

## User Value

The company is told when something relevant to its niche appears or changes,
instead of polling portals. Unread counts and the radar tabs make sure no
opportunity or amendment is missed. This covers acceptance criterion 4.

## Scope

- **Alerts (`/alertas`):**
  - list with new-match counts;
  - create modal (name, CATMAT/catalog item, UF, buyer), also reachable from the queue and from a product;
  - `createAlert` (with an "alerta ativado" radar event) and `deleteAlert` (soft delete, D-39) form actions with Zod;
  - "Triar oportunidades" shortcut resetting filters and applying product + UF + órgão (D-16).
- **Matching:**
  - `matchesAlert(alerta, edital, itens)`, pure and unit-tested: CATMAT/normalized text AND UF (unless "Todos") AND órgão (unless "Todos");
  - `AlertMatcher.processNew(ids)`, invoked by the collection job (FEAT-003);
  - per notice: at most one `alert_matches` row and one radar event per (alert, notice); `new_matches` increments only on first insert (D-17);
  - deleted alerts are ignored.
- **Radar (`/radar`):**
  - tabs `all | unread | contratacao | retificacao | resultado` as persistent querystring state;
  - event cards with a link to the sheet;
  - `markEventSeen` / `markAllRadarSeen` actions;
  - events are immutable except `seen`.
- **Badges and panels:** unread counts in the header, sidebar and queue counter; the "Alertas Ativos de Nicho" and "Retificações e Alterações Observadas" panels on the queue. All counts are derived from data (D-19).
- `alerts`, `alert_matches` and `radar_events` tables (tenant-scoped, cascades per D-38).

## Non-Goals

- Detecting amendments and awards in collected data (FEAT-003 emits those events).
- Email, push or other notification channels (not in Knowledge).
- Favorites (FEAT-007).

## Constraints

- Constitution: match rules live in the service layer; radar events are immutable except `seen`; product data is tenant-scoped; pure rules born with unit tests.
- Decisions D-15, D-16, D-17, D-19, D-38, D-39.

## Relevant Knowledge

- [[KNOW-011]] alerts and matching
- [[KNOW-012]] radar events
- [[KNOW-026]] `alerts`, `alert_matches`, `radar_events`
- [[KNOW-021]] collection job hook
- [[KNOW-007]] normalization used by text matching

## Open Questions

- Buyer vs. sphere: how "Poder Judiciário (TRF)", "Ministérios", "Forças Armadas" map to órgão codes, or whether alerts take concrete órgãos only. ([[KNOW-011]])
- Text-matching semantics when CATMAT is absent (substring, all tokens, trigram similarity). ([[KNOW-011]])
- When `new_matches` resets; whether a new alert is matched against notices already in the base; the event type of "alerta ativado" (`contratacao` vs `sistema`). ([[KNOW-011]])
- How an amendment event describes *what* changed; whether "Resposta aos Esclarecimentos" is its own event kind. ([[KNOW-012]])
- Delete policy for `radar_events.alert_id` when soft-deleted alerts are purged. ([[KNOW-026]])
