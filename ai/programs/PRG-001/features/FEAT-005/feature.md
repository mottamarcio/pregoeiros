---
id: FEAT-005
type: feature
status: draft
parent: PRG-001
---

# FEAT-005 — Opportunity Search

## Capability

Finding procurements and related entities:

- the `/oportunidades` listing with structural filters and accent-insensitive text search with `-token` exclusion;
- the global ⌘K command palette across notices, catalog products and suppliers;
- CSV export of the filtered opportunities.

## User Value

Analysts explore beyond the queue — by UF, buyer, segment, modality or status
— and cut noise such as `-servico`, then jump straight to the triage sheet.
Anyone reaches any notice, product or competitor in a few keystrokes, and
filtered lists can be taken to Excel.

## Scope

- **Search module** (single definition, pure, unit-tested): `normalizeSearch` (D-10) and `parseExclusionQuery` (positive tokens AND, any negative token excludes).
- **`/oportunidades`:**
  - Zod-validated querystring `q`, `uf`, `triagem`, `segmento`, `modalidade`, `situacao`, `orgao` (D-16), `page`;
  - `SearchService.parse` → `ProcurementRepository.search` using `pg_trgm` on `objeto_normalizado` / `itens_texto_normalizado`, with structural filters as columns;
  - table with deadline, objeto + processo/UASG, órgão, UF, value, triage badge, "Ficha do Edital";
  - result count, clear filters, empty state.
- **Global search:**
  - `GET /api/search?q=` (≥ 2 chars) returning grouped `procurements` / `products` / `suppliers`;
  - `GlobalSearch.svelte` palette with 200 ms debounce, opening the sheet / product / supplier.
- **CSV export:**
  - `GET /api/export/oportunidades.csv` via `api/export/[entity].[format]` (D-34), honoring the same filters;
  - server-generated, UTF-8 with BOM;
  - columns: prazo, objeto, órgão, UF, valor, triagem, processo, UASG.

## Non-Goals

- The triage sheet and decisions (FEAT-004).
- JSON history export (FEAT-009).
- Full-text search engines or `websearch_to_tsvector` (future extension); quoted-phrase operators unless decided.

## Constraints

- Constitution: one normalization definition; pure domain rules born with unit tests; the browser uses only internal endpoints; CSV UTF-8 with BOM.
- Decisions D-10, D-16, D-34.
- p95 < 300 ms for indexed searches.

## Relevant Knowledge

- [[KNOW-006]] opportunities listing and filters
- [[KNOW-007]] search normalization and global search
- [[KNOW-022]] querystrings, `/api/search`, exports
- [[KNOW-029]] performance targets

## Open Questions

- Default sort order of the listing; full list of modalidades to offer as filters. ([[KNOW-006]])
- Whether search supports quoted phrases or other operators; ranking of results. ([[KNOW-007]])
- Limits for `/api/search` results and CSV export size/pagination. ([[KNOW-022]])
- The source of filter options (static lists vs. distinct values from the base) — not specified in Knowledge.
