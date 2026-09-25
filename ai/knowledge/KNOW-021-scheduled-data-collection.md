---
id: KNOW-021
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

# KNOW-021 — Scheduled Data Collection, Source Health and Amendment Detection

## Summary

Public data is collected by scheduled jobs twice a day (03:15 and 15:15
America/Sao_Paulo) plus a weekly catalog job. Each run is recorded in
`sync_runs`, per-module health in `source_heartbeats`, and progress in
`sync_cursors`. Failures degrade gracefully: other modules continue and the UI
keeps serving the last collected base. Changes to already-persisted notices are
detected by content hash and emitted as `retificacao` radar events.

## Known Facts

- **Schedule (America/Sao_Paulo):**

  | Time | Job | Slice |
  |---|---|---|
  | 03:15 | `full-incremental` | procurements + items + results (7–15 day update window) + contracts ending 0–120 days + heartbeat |
  | 15:15 | `full-incremental` | same |
  | Sunday 04:00 | `catalogo-catmat` | **selective** refresh (D-31): items cited in alerts, monitored products, and items seen in collected procurements — never the 281k dump |

  Cron expression `SYNC_CRON=15 3,15 * * *`, `CRON_TZ=America/Sao_Paulo`.
- Incremental by `dataAtualizacaoPncp` / validity window / publication date.
- **Steps of `full-incremental`:**
  1. Insert `sync_runs` (status `running`).
  2. Procurements (Lei 14.133) via `1_consultarContratacoes_PNCP_14133` using `dataPublicacaoPncpInicial/Final` **or** `dataAualizacaoPncp`.
  3. Items via `2_consultarItensContratacoes_PNCP_14133` per new/updated `idCompra` (or window).
  4. Results via `3_consultarResultadoItensContratacoes_PNCP_14133`.
  5. Hash diff → `retificacao` events.
  6. Alert matcher (`AlertMatcher.processNew(ids)`).
  7. Contracts via `1.2_consultarContratos_FimVigencia`, windows 30/60/90/120.
  8. Heartbeats per module.
  9. Close `sync_runs` with counts; status `success | partial | failed`.
- If one module fails, the others continue (`partial`). The UI reads `source_heartbeats` and shows "Operando / Degradado".
- **Per-module collection contract:** record `source_heartbeats.last_attempt_at`; try pages 1..MAX; upsert by natural key; store `raw_payload` jsonb (optional, first 90 days — useful for amendments); set `last_success_at` if no page failed.
- **Amendment (retificação) detection (D-18):** canonical hash of objeto + prazo + item list + valor + **attachment metadata** (name and URL, sorted) when upstream provides it; volatile fields (e.g. `dataAtualizacao*`) are excluded. If the API exposes no attachments, the limitation is recorded and rule 8 applies to the other fields only. If the hash changed and the `id_compra` already existed → `radar_events.type = retificacao`. Stored in `procurements.content_hash`; the service emits the event when `content_hash` changes on UPDATE.
- **Degradation:** total failure of a module → heartbeat `down`, UI shows "Degradado", old data remains. Never truncate public tables in the incremental job.
- **Implementation options:** A (v1, KISS) `node-cron` started in `hooks.server.ts` only if `ENABLE_CRON=true` (one replica); B a `cron` container calling `node build/job.js sync`; C `ofelia` / host crontab.
- **Lock:** `pg_advisory_lock` so the 03:15 run and a manual trigger don't overlap. A manual trigger while running returns 409 `SYNC_IN_PROGRESS` (see [[KNOW-022]]).
- **Tables:**
  - `sync_runs`: `id`, `trigger` (`cron` | `manual`), `status` (`sync_status`: running/success/partial/failed), `started_at`, `finished_at`, `pages_fetched`, `upserts`, `error_summary`.
  - `source_heartbeats`: `module` PK (`contratacoes | resultados | contratos | catalogo | precos`), `status` (`source_status`: ok/degraded/down), `last_attempt_at`, `last_success_at`, `records_hint` (e.g. "1.482 oportunidades ativas").
  - `sync_cursors`: `module` PK, `last_window_start`, `last_window_end`, `last_id`.
- Header "Última Coleta: Hoje, 03:15" reads the most recent `sync_runs.finished_at` with status `success` or `partial`.
- **Source integrity modal (PRD 4.12):** last check per module (procurements, results, prices, catalog); traffic light Operando / Degradado / Indisponível; continuity text — the last collected base keeps serving the UI. Fed by `GET /api/sources` and the `sync_runs` table.
- PoC modal "Fontes Consultadas & Frescor da Base" rows: "Editais & Contratações Abertas", "Resultados & Homologações de Itens", "Base Histórica de Preços Praticados", "Catálogo Padronizado CATMAT / CATSER", each with "Última checagem" + record hint; closing note "Garantia de Frescor e Continuidade".
- Architecture flow also lists: sync-contratos covering validity end 0–120 days; heartbeat per module.
- Weekly purge job (can be the Sunday cron) — see [[KNOW-027]].
- Collection is kept out of the request path.
- Operator persona needs to know whether today's collection ran; `admin` can trigger manual sync and see logs.
- **Decision D-31 — catalog in the sources modal:** the modal shows the number of **materialized** catalog items, not "281.000 especificações".
- **Decision D-32 — source status mapping:**

  | `source_status` | UI label | Condition |
  |---|---|---|
  | `ok` | Operando | last module run succeeded and last success ≤ 24h ago |
  | `degraded` | Degradado | last run partial/aborted, **or** last success > 24h ago |
  | `down` | Indisponível | total failure in the last run **and** no success in the last 48h |

- **Decision D-29:** the `precos` heartbeat stays inactive until `modulo-pesquisa-preco` is delivered (P1, F3).
- Contract collection window follows D-14: `vigencia_fim` from today to today + 120 days (see [[KNOW-010]]).

## Constraints

- Never truncate public tables in incremental jobs.
- Only one scheduler instance (single replica with `ENABLE_CRON=true`).
- Jobs orchestrate; they never answer user requests.

## Unknowns

- How the 7–15 day incremental window is chosen per run (fixed? adaptive via `sync_cursors`?).
- How contract collection is sliced to satisfy the "órgão + ≤ 365 days" constraint when using `1.2_consultarContratos_FimVigencia` (whether that endpoint requires órgão is not stated).
- Mapping between the 4 PoC modal rows / PRD modules and the 5 heartbeat modules (contracts has no row in the PoC modal).

## Conflicts

- None remaining. Resolved by decisions:
  - catalog refresh scope → D-31 (selective);
  - retificação hash inputs → D-18 (attachments included when available);
  - contract windows → D-14;
  - degraded vs. down semantics → D-32.

## Provenance

- Schedule and incremental keys, integrity modal: `ai/raw/01-PRD.md` §4.12, §4.13.
- Flow, partial status, heartbeat UI: `ai/raw/02-ARCHITECTURAL_SPECS.md` §5.3, §6, §9.
- Schedule table, steps, options, lock, degradation, header source: `ai/raw/03-TECHNICAL_SPECS.md` §5, §11.
- Collection contract, hash, backoff: `ai/raw/04-API_SPECS.md` §8.
- Tables, header query, content_hash: `ai/raw/05-DATA_MODEL_SPECS.md` §3, §5.1, §7, §14.
- PoC modal copy: `ai/raw/pregoeiros.html` (modalSyncStatus).
- Decisions D-14, D-18, D-29, D-31, D-32: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-019]] endpoints
- [[KNOW-020]] HTTP client
- [[KNOW-011]] alert matcher
- [[KNOW-012]] radar events
- [[KNOW-022]] `/api/sync`, `/api/sources`, `/api/health`
