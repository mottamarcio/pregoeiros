---
id: KNOW-012
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-012 — Radar of Events (`/radar`)

## Summary

The Radar is an event inbox: new matching procurements, amendments
(retificações) and awarded results. Events are immutable except for their
`seen` flag, filterable by persistent tabs, and surface unread counts in the
header and sidebar.

## Known Facts

- Event kinds: new compatible procurement, retificação, awarded result. Enum `radar_event_type`: `contratacao`, `retificacao`, `resultado`, `sistema`.
- Tabs with persistent state: Todos / Não vistos / Oportunidades / Retificações / Resultados. Querystring `tab=all|unread|contratacao|retificacao|resultado`.
- Mark one or all as seen (actions `markEventSeen` with `id` → `seen=true`; `markAllRadarSeen` → all events of the tenant).
- Unread badge in the header and sidebar; the header badge is hidden when there are no unread events (PoC).
- **Retificação rule** (business rule 8): a change of object, deadline, attachment or item in an already-persisted notice generates a radar event of type `retificacao` (detection mechanism in [[KNOW-021]]).
- Radar events are **immutable**; only the `seen` flag changes.
- Event fields: `type`, optional `procurement_id`, optional `alert_id`, `title`, `subtitle`, `detail`, `seen` (default false), `created_at`. Index `(tenant_id, seen, created_at DESC)`.
- Awarded results produce `resultado` events (upstream module `3_consultarResultadoItensContratacoes`).
- PoC event card: unread dot, title, relative time ("há 23 minutos"), subtitle, mono detail; "Ver Edital" button when linked to a procurement; "Marcar visto" button when unseen. Marking seen keeps the active tab.
- PoC page title "Radar de Eventos & Alertas" — "Novas contratações compatíveis com seus nichos, retificações e resultados". Empty state: "Nenhum alerta registrado com o filtro selecionado." Mark-all toast: "Todos os alertas foram marcados como vistos."
- The dashboard's "Retificações e Alterações Observadas" feed shows amendment summaries (e.g. "Retificação nº 1 no Edital de Notebooks … Não houve prorrogação de prazo").
- Unread counts in the header, sidebar and dashboard are always derived from data (D-19; PoC numbers are illustrative).

## Constraints

- Only `seen` may be updated on a radar event.

## Unknowns

- How to describe *what* changed in a retificação event (the PoC shows human-readable summaries like "Anexo III retificado"; the hash-based detection only knows that something changed).
- Whether "Resposta aos Esclarecimentos" (shown in the PoC dashboard feed) is a distinct event kind — no enum value covers it.
- Whether `resultado` events are emitted for all awards or only for notices linked to alerts/favorites.

## Conflicts

- None remaining. Retificação triggers vs. hash inputs resolved by D-18 (attachment metadata included in the hash when upstream provides it — see [[KNOW-021]]); PoC unread counts resolved by D-19.

## Provenance

- Radar view and retificação rule: `ai/raw/01-PRD.md` §4.7, §6.8.
- Immutability: `ai/raw/02-ARCHITECTURAL_SPECS.md` §7.
- Actions and querystring: `ai/raw/04-API_SPECS.md` §10, §11.
- Enum, table, index: `ai/raw/05-DATA_MODEL_SPECS.md` §3, §6.3.
- PoC behavior and copy: `ai/raw/pregoeiros.html` (view-radar, `renderRadar`, `markEventSeen`, `markAllRadarRead`, `renderDashboardSupportingSections`).
- Decisions D-18, D-19: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-011]] alerts and matching
- [[KNOW-021]] retificação detection in the collection job
- [[KNOW-026]] `radar_events` table
- [[KNOW-027]] radar retention (90 days)
