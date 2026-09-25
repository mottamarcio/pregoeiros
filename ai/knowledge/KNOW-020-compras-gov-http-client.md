---
id: KNOW-020
type: knowledge
status: active
sources:
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-020 — Compras.gov.br HTTP Client and Mappers

## Summary

A server-only HTTP client (`$lib/server/integrations/compras-gov/client.ts`)
wraps the public API with timeouts, retries, pagination, a per-run page cap and
an identifiable User-Agent; mappers translate unstable upstream DTOs into
domain types.

## Known Facts

- Location: `$lib/server/integrations/compras-gov/` — `client.ts` (HTTP + retry + timeout), `types.ts` (upstream DTOs), `mappers.ts` (DTO → domain), `endpoints.ts` (versioned paths).
- Base `https://dadosabertos.compras.gov.br` (env `COMPRAS_GOV_BASE_URL`); GET only; `Accept: application/json`.
- Timeout 20–30 s per page.
- Exponential retry (3×) on 429 / 502 / 503 / 504 and timeouts.
- Pagination: `pagina` + `tamanhoPagina` (use 100–500; upstream cap 500; env default `COMPRAS_GOV_PAGE_SIZE=100`).
- Envelope type: `GovPage<T> = { resultado: T[]; totalRegistros: number; totalPaginas: number; paginasRestantes: number }`.
- Per-run safety cap: N pages per module (config `COMPRAS_GOV_MAX_PAGES_PER_MODULE=50`). Exceeding it marks `sync_runs` as `partial`.
- User-Agent: `Pregoeiros/1.0 (+contato-da-empresa)`.
- **No authentication** — the public API needs no token; if it ever does, the secret lives in `env.ts`.
- Mappers isolate unstable upstream names (e.g. `dataAualizacaoPncp` with the official typo) and must tolerate null fields. Parameter names follow each endpoint's OpenAPI spelling, checked by a contract test (D-30, see [[KNOW-019]]).
- **Backoff/abort:** if `totalPaginas` is absurd or the API returns an HTML error page, abort the module and mark it `degraded`.
- Timeout and page ceiling protect against government API hangs (security/resilience requirement).
- Integration tests use a mock server (MSW or JSON fixtures recorded from Swagger).
- Integrations may do HTTP + DTO mapping, but may not write triage decisions.
- The mapper "DTO governo → domínio" is a pure function covered by unit tests first.

## Constraints

- Never imported by client code.
- Only GET requests.

## Unknowns

- What threshold defines an "absurd" `totalPaginas`.
- The real contact to use in the User-Agent (`+contato-da-empresa` is a placeholder).
- Exact timeout value within 20–30 s and backoff base delay.

## Conflicts

- None identified.

## Provenance

- Client behavior, envelope, cap, UA, no-auth, mappers: `ai/raw/03-TECHNICAL_SPECS.md` §4, §10.1, §10.2, §13.
- Folder and responsibilities, timeout/page ceiling: `ai/raw/02-ARCHITECTURAL_SPECS.md` §4, §6, §10.
- Backoff rule and null tolerance: `ai/raw/04-API_SPECS.md` §8, §13.
- Decisions D-30: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-019]] endpoints
- [[KNOW-021]] collection jobs
- [[KNOW-028]] testing strategy
