---
id: KNOW-007
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

# KNOW-007 — Search Normalization, Lexical Exclusion and Global Search

## Summary

Text search throughout Pregoeiros is accent-insensitive and case-insensitive,
supports `-token` exclusions, and is backed by `pg_trgm` indexes on persisted
normalized columns. A global command palette (⌘K / `/`) searches notices,
catalog products and suppliers in grouped results.

## Known Facts

- **Normalization (D-10):** a single definition in a single TypeScript function, `normalizeSearch` (`$lib/utils/normalize-search.ts`): lowercase → NFD → strip diacritics (U+0300–U+036F) → trim → collapse whitespace. The same function is used both to write the `*_normalizado` columns and to build queries. No Postgres `unaccent`. (The PoC version lacks only the whitespace collapse.)
- **Exclusion rule** (business rule 7): tokens prefixed with `-` are AND-NOT after NFD + lowercase normalization. Example: `parseQuery("notebook -servico RJ")` → include `["notebook","rj"]`, exclude `["servico"]`.
- PoC semantics: split on spaces; a token starting with `-` and longer than 1 char is negative; **all** positive tokens must appear (AND) and **any** negative token excludes the row.
- Principle: `-serviço` removes noise (maintenance, continuous services, etc.).
- Normalization, pt-BR money formatting and the `-termo` parser live in a **single module** (DRY): `$lib/utils/normalize-search.ts`, `$lib/utils/exclusion-query.ts`, `$lib/utils/money.ts`.
- **Indexes:** `pg_trgm` on `objeto_normalizado`, `itens_texto_normalizado`, `razao_social_normalizada` (canonical name per D-09). Normalized text is persisted in `*_normalizado` columns.
- `procurements.itens_texto_normalizado` aggregates item text for notice search; updated by trigger or in the service upsert.
- **Global search (⌘K / `/`):** palette grouped into Editais, Produtos (CATMAT), Fornecedores; accent normalization.
- PoC global search: minimum 2 characters; returns up to 3 notices (matching objeto/UASG/processo), 2 products (nome/CATMAT) and 2 suppliers (nome/CNPJ); empty state "Nenhum resultado encontrado para …".
- `GET /api/search?q=` — minimum 2 characters; response groups `procurements` (`id, objeto, comprador, prazoProposta`), `products` (`id, nome, catmat, mediana`), `suppliers` (`id, nome, cnpj, resultados`).
- Client debounce 200 ms, minimum 2 characters.
- The client calls `/api/search` for ⌘K; it never calls Compras.gov.br.

## Constraints

- `normalizeSearch` and `parseExclusionQuery` are pure functions with unit tests first (TDD).
- No Elasticsearch in v1 (YAGNI); Postgres indexes + `pg_trgm`.

## Unknowns

- Whether quoted phrases or other operators are supported — only `-token` is defined.
- Ranking/ordering of search results is not specified.

## Conflicts

- None remaining. Index column name resolved by D-09 (`razao_social_normalizada`); normalization form resolved by D-10.

## Provenance

- Exclusion principle and rule, global search: `ai/raw/01-PRD.md` §3.6, §4.11, §6.7.
- DRY single module, no Elasticsearch, `pg_trgm`: `ai/raw/02-ARCHITECTURAL_SPECS.md` §2.1, §4 (utils).
- Normalization function, parseQuery example, index list, debounce: `ai/raw/03-TECHNICAL_SPECS.md` §6, §10.1, §11.
- `/api/search` contract: `ai/raw/04-API_SPECS.md` §9.2.
- Normalized columns and indexes: `ai/raw/05-DATA_MODEL_SPECS.md` §1, §5.1, §5.2, §5.4.
- PoC behavior: `ai/raw/pregoeiros.html` (`normalizeSearch`, `filterProcurements`, `handleGlobalSearch`).
- Decisions D-09, D-10: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-006]] opportunities listing
- [[KNOW-017]] keyboard shortcuts
- [[KNOW-025]] normalized columns in the public mirror
