---
id: KNOW-019
type: knowledge
status: active
sources:
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-019 — Compras.gov.br Dados Abertos API: Modules and Endpoints

## Summary

The external data source is the public, unauthenticated Compras.gov.br Open
Data REST API. This topic catalogs the modules and endpoints Pregoeiros
consumes, their priorities (P0/P1), key parameters, and how each maps to
product features.

## Known Facts

- **Common characteristics:** base URL `https://dadosabertos.compras.gov.br`; HTTPS, REST, JSON; no auth; GET only; pagination `pagina` (default 1) and `tamanhoPagina` (default 10, max 500 in most modules); envelope `{ resultado, totalRegistros, totalPaginas, paginasRestantes }`; `dataHoraAtualizacao` fields are ISO-8601, business dates are `YYYY-MM-DD`; some contract endpoints require órgão + window ≤ 365 days.
- References: Swagger `https://dadosabertos.compras.gov.br/swagger-ui/index.html`; OpenAPI `https://dadosabertos.compras.gov.br/v3/api-docs`; open-data manuals on the purchases portal.
- Pregoeiros **never** calls these endpoints from the browser.
- **P0 modules:** `modulo-contratacoes` (queue, opportunities, sheet, radar), `modulo-contratos` (expiring contracts), `modulo-material` (CATMAT resolution for the monitored catalog), `modulo-fornecedor` (enrich winners' CNPJ).
- **P1 modules:** `modulo-pesquisa-preco` (price complement when the 14.133 results series is short — P1 per D-29, delivered in F3, not required for v1 acceptance), `modulo-servico` (CATSER when the niche is services), `modulo-legado` (pre-14.133 pregão/licitação/dispensa for long history), `modulo-uasg` (friendly UASG name), `modulo-ocds` (interoperable export, not used in v1 UI).
- **Contratações (Lei 14.133):**
  - `GET /modulo-contratacoes/1_consultarContratacoes_PNCP_14133` — params: `pagina`, `tamanhoPagina` (100–500), `unidadeOrgaoCodigoUnidade` (UASG), `codigoOrgao`, `orgaoEntidadeCnpj`, `dataPublicacaoPncpInicial/Final` (job window), `codigoModalidade`, `unidadeOrgaoUfSigla`, `unidadeOrgaoCodigoIbge`, `dataAualizacaoPncp` (incremental; **official typo in the field name**), `amparoLegalCodigoPncp`, `contratacaoExcluida` (ignore deleted). Maps to objeto, órgão, UF, modalidade, estimated value, situação, processo, UASG, deadline dates when present.
  - `GET /modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id` — `tipo` (`idCompra` or `numeroControlePNCPCompra`), `codigo`, optional `dataAtualizacaoPncp`.
  - `GET /modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133` — filters `codItemCatalogo`, `codigoGrupo`, `codigoClasse`, `materialOuServico`, `unidadeOrgaoCodigoUnidade`, `orgaoEntidadeCnpj`, `situacaoCompraItem`, `temResultado`, `dataInclusaoPncpInicial/Final`, `dataAtualizacaoPncp`. Detail `2.1_…_Id` (`tipo` + `codigo` + `idCompraItem`).
  - `GET /modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133` — filters `niFornecedor`, `valorUnitarioHomologadoInicial/Final`, `dataResultadoPncpInicial/Final`, órgão/UASG. Detail `3.1_…_Id`. Feeds practiced prices, supplier ranking, `resultado` radar events, history.
- **Contratos:**
  - `GET /modulo-contratos/1_consultarContratos` — `codigoOrgao`, `codigoUnidadeGestora`, `numeroContrato`, `codigoModalidadeCompra`, `niFornecedor`, `dataVigenciaInicialMin/Max`, pagination. Several slices **require órgão + window ≤ 365 days**; the job must slice by monitored órgão or date ranges.
  - `GET /modulo-contratos/1.2_consultarContratos_FimVigencia` — `dataVigenciaFinalMin/Max`.
  - `GET /modulo-contratos/1.1_consultarContratos_Id` — `tipo`: `idCompra` | `numeroControlePncpContrato`.
  - `GET /modulo-contratos/2_consultarContratosItem`, `2.1_consultarContratosItem_Id`.
- **CATMAT (`modulo-material`):** `1_consultarGrupoMaterial` (groups), `2_consultarClasseMaterial` (classes), `3_consultarPdmMaterial` (PDM), `4_consultarItemMaterial` (item: code, description, NCM, status), `6_consultarMaterialUnidadeFornecimento` (unit), `7_consultarMaterialCaracteristicas` (characteristics). CATSER (`modulo-servico`) follows the same pattern.
- **Fornecedor:** `GET /modulo-fornecedor/1_consultarFornecedor` — `cnpj`, `cpf`, `naturezaJuridicaId`, `porteEmpresaId`, `codigoCnae`, `ativo`, pagination.
- **Pesquisa de preço (P1 section):** `modulo-pesquisa-preco`, DTOs `FtPesqPrecoCompraMaterial*` in Swagger.
- **Legado SIASG (P1):** `/modulo-legado` — e.g. `2_consultarItemLicitacao`, `6_consultarCompraItensSemLicitacao` (requires notice year in some flows), pregão/licitação queries (`TbVwPregao`, `TbVwLicitacao`). Only used if 24-month history of target products is not covered by 14.133.
- **Catalog materialization in v1:** do **not** mirror the 281k specifications. Materialize only items cited in alerts, items that appeared in collected procurements, and the company's operational catalog products (PoC: 482910, 439120, 392102, 192834).
- Endpoint versions are embedded in path names (`1_`, `1.1_`, `2_`); wrappers in `endpoints.ts` centralize them.
- **Decision D-30 — parameter spelling:** `endpoints.ts` declares each parameter exactly as spelled in each endpoint's OpenAPI definition (e.g. `dataAualizacaoPncp` on the list endpoint, `dataAtualizacaoPncp` elsewhere); in F1 a contract test checks names against `https://dadosabertos.compras.gov.br/v3/api-docs`.
- The public API is irregular across modalidades; mappers must tolerate null fields.
- Example: `…/1_consultarContratacoes_PNCP_14133?pagina=1&tamanhoPagina=100&unidadeOrgaoUfSigla=RJ&dataPublicacaoPncpInicial=2026-09-01&dataPublicacaoPncpFinal=2026-09-25`.

## Constraints

- GET only, never from the browser.
- Contract queries must respect the ≤ 365-day window + órgão requirement.
- No full CATMAT mirror in v1.

## Unknowns

- Exact upstream response field names for proposal deadline, delivery place, payment conditions, PDF URL — the spec says "when present in the DTO" without naming fields.
- The rate limits of the public API — only "429" retries are mentioned.
- Coverage of state/municipal purchases in this API (PRD non-goal notes that uncovered entities are out of scope; architecture mentions PNCP for state coverage as a future extension).

## Conflicts

- None remaining. Pesquisa-de-preço priority resolved by D-29 (P1); parameter spelling resolved by D-30; catalog scope vs. the PoC's "281.000 especificações" resolved by D-31 (see [[KNOW-021]]).

## Provenance

- All endpoint/module facts: `ai/raw/04-API_SPECS.md` §1–§7, §12, §13.
- Typo mention, `endpoints.ts`: `ai/raw/03-TECHNICAL_SPECS.md` §4, §5.3.
- Incremental by `dataAtualizacaoPncp`: `ai/raw/01-PRD.md` §4.13.
- Decisions D-29, D-30, D-31: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-020]] HTTP client behavior
- [[KNOW-021]] collection strategy
- [[KNOW-025]] mirror schema
