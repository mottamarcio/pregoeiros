---
id: KNOW-022
type: knowledge
status: active
sources:
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-022 — Internal API, Form Actions, Querystrings and Exports

## Summary

Pregoeiros exposes a small same-origin JSON API under `src/routes/api` (health,
sources, sync, search, export) and uses SvelteKit form actions for all UI
mutations. Page state is encoded in querystrings that form the UI ↔ server
contract.

## Known Facts

- All routes are same-origin; JSON UTF-8. Error format: `{ "error": { "code": "VALIDATION", "message": "UF inválida" } }`.
- HTTP codes in use: 200, 201, **202** (added by D-33, used by `POST /api/sync`), 204, 400, 401, 404, 409, 429, 503.
- **`GET /api/health`** → `{ app: "ok", database: "ok", lastSync: { finishedAt, status } }`; 503 if the database is down; the government API does **not** bring health down.
- **`GET /api/sources`** → `{ modules: [{ key, label, status, lastSuccessAt, detail }], note }` (example key `contratacoes`, label "Editais & Contratações Abertas", detail "1.482 oportunidades ativas", note "Compras.gov.br federal & adesões sob a Lei nº 14.133/21."). Feeds the sources modal. Route file `src/routes/api/sources/+server.ts` (D-23).
- **`POST /api/sync`** — triggers incremental collection ("Atualizar Fontes" button). Auth: admin. Advisory lock: if a job is running → 409 `{ error: { code: "SYNC_IN_PROGRESS" } }`. Success → `{ syncRunId, status: "queued" }` with status 202. Rate-limited to avoid loop-triggering.
- **`GET /api/search?q=`** — see [[KNOW-007]].
- **Exports:** `GET /api/export/oportunidades.csv` and `GET /api/export/historico.json`; they honor the same querystring filters as the source page. Generated server-side by `ExportService`, downloaded via `Content-Disposition`. CSV columns: prazo, objeto, órgão, UF, valor, triagem, processo, UASG; **UTF-8 with BOM** for pt-BR Excel. JSON history: ranking + window and source metadata. Route file (D-34): `src/routes/api/export/[entity].[format]/+server.ts` with param matchers — `entity` ∈ {`oportunidades`, `historico`}, `format` ∈ {`csv`, `json`}.
- **Form actions** (preferred over REST for the UI; REST only if a future client needs it; Zod validation on all actions; pt-BR toasts from PoC copy):

  | Action | Page | Fields | Effect |
  |---|---|---|---|
  | `setDecision` | sheet / queue | `procurementId`, `decision=go\|analisando\|nogo` | persists triage; GO creates favorite (`origin='triage'`, D-05) |
  | `createAlert` | alert modal | `name`, `product`, `uf`, `buyer` | creates alert + "alerta ativado" radar event |
  | `deleteAlert` | `/alertas` | `id` | soft-deletes the rule (`deleted_at`, D-39) |
  | `toggleFavorite` | several | `type`, `targetId` | upsert/delete |
  | `markEventSeen` | `/radar` | `id` | `seen=true` |
  | `markAllRadarSeen` | `/radar` | — | all of the tenant |
  | `selectProduct` | `/produtos` | via `?produto=` | not a mutation |

- **Querystrings:** `/oportunidades`: `q` (accepts `-token`), `uf`, `triagem`, `segmento`, `modalidade`, `situacao`, `orgao` (D-16), `page`; `/radar`: `tab=all|unread|contratacao|retificacao|resultado`; `/salvos`: `tipo=all|contratacao|produto|fornecedor`; `/produtos`: `produto=<internal id or catmat>`.
- **Deep links** to the sheet: `/editais/[id]` and `/?edital=[id]` (modal over the queue).
- **Versioning:** no `/v1` prefix in v1 (YAGNI); breaking changes require a conscious bump and a changelog note.

## Constraints

- Mutations go through form actions with Zod validation.
- The internal API must never proxy direct browser calls to Compras.gov.br.

## Unknowns

- Whether `POST /api/sync` runs the job synchronously or enqueues it (response says `queued` but there is no queue in v1).
- Pagination format of `/api/search` and exports (limits, max rows).
- Whether `/api/health` requires authentication.

## Conflicts

- None remaining. 202 status resolved by D-33; missing `/api/sources` route resolved by D-23; export path shape resolved by D-34.

## Provenance

- API surface, error format, codes, health/sources/sync/search/export, actions, querystrings, versioning: `ai/raw/04-API_SPECS.md` §9–§12.
- Export generation, CSV columns, BOM: `ai/raw/03-TECHNICAL_SPECS.md` §9.
- Route tree, rate limit on `/api/sync`: `ai/raw/02-ARCHITECTURAL_SPECS.md` §4, §10.
- Export requirement (CSV and JSON server-generated): `ai/raw/01-PRD.md` §5.
- Decisions D-05, D-16, D-23, D-33, D-34, D-39: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-015]] load vs action vs API conventions
- [[KNOW-021]] sync job and lock
- [[KNOW-023]] auth for admin endpoints
