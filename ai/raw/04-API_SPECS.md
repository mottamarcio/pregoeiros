# API Specs — Pregoeiros

**Versão:** 1.0  
Este documento cobre duas superfícies:

1. **API externa consumida** — Dados Abertos Compras.gov.br  
2. **API interna exposta** pelo SvelteKit (rotas `src/routes/api` + form actions)

Swagger oficial: [https://dadosabertos.compras.gov.br/swagger-ui/index.html](https://dadosabertos.compras.gov.br/swagger-ui/index.html)  
OpenAPI: `https://dadosabertos.compras.gov.br/v3/api-docs`  
Manual: portal de compras / manuais de dados abertos.

---

## 1. API externa — Compras.gov.br

### 1.1 Características comuns

| Item | Valor |
|---|---|
| Base URL | `https://dadosabertos.compras.gov.br` |
| Protocolo | HTTPS, REST, JSON |
| Auth | Nenhuma (dados abertos) |
| Métodos usados | GET |
| Paginação | `pagina` (default 1), `tamanhoPagina` (default 10, máx. 500 na maior parte dos módulos) |
| Envelope | `{ resultado, totalRegistros, totalPaginas, paginasRestantes }` |
| Fuso / datas | ISO-8601 nos campos `dataHoraAtualizacao`; datas de negócio em `YYYY-MM-DD` |
| Limites práticos | alguns endpoints de contrato exigem órgão + janela ≤ 365 dias |

O Pregoeiros **nunca** chama esses endpoints do browser.

### 1.2 Módulos relevantes para a v1

Prioridade P0 — necessários para a PoC:

| Módulo | Uso no produto |
|---|---|
| `modulo-contratacoes` | Fila, oportunidades, ficha, radar (novas + resultados) |
| `modulo-contratos` | Contratos a vencer 30/60/90 |
| `modulo-material` | Resolução CATMAT do catálogo monitorado |
| `modulo-fornecedor` | Enriquecer CNPJ de vencedores |
| `modulo-pesquisa-preco` | Complemento de preços praticados (se o recorte de resultados 14.133 for curto) |

Prioridade P1:

| Módulo | Uso |
|---|---|
| `modulo-servico` | CATSER quando o nicho for serviço |
| `modulo-legado` | Pregão / licitação / dispensa pré-14.133 se o time quiser histórico longo |
| `modulo-uasg` | Nome amigável da UASG |
| `modulo-ocds` | Export interoperável (não usado na UI v1) |

---

## 2. Contratações — Lei 14.133/2021 (P0)

Base: `/modulo-contratacoes`

### 2.1 Listar contratações

`GET /modulo-contratacoes/1_consultarContratacoes_PNCP_14133`

| Parâmetro | Tipo | Obrigatório | Uso Pregoeiros |
|---|---|---|---|
| pagina | int | não | paginação do job |
| tamanhoPagina | int | não | 100–500 |
| unidadeOrgaoCodigoUnidade | string | não | UASG |
| codigoOrgao | string | não | filtro de alerta por órgão |
| orgaoEntidadeCnpj | string | não | — |
| dataPublicacaoPncpInicial | date | não | janela do job |
| dataPublicacaoPncpFinal | date | não | janela do job |
| codigoModalidade | string | não | Pregão, Dispensa, Concorrência |
| unidadeOrgaoUfSigla | string | não | UF da PoC |
| unidadeOrgaoCodigoIbge | string | não | — |
| dataAualizacaoPncp | date | não | incremental (**typo oficial do campo**) |
| amparoLegalCodigoPncp | string | não | — |
| contratacaoExcluida | bool | não | ignorar excluídas |

**Mapeamento UI:** objeto, órgão, UF, modalidade, valor estimado, situação, processo, UASG, datas de prazo quando presentes no DTO.

### 2.2 Contratação por ID

`GET /modulo-contratacoes/1.1_consultarContratacoes_PNCP_14133_Id`

| Parâmetro | Notas |
|---|---|
| tipo | `idCompra` **ou** `numeroControlePNCPCompra` |
| codigo | valor correspondente |
| dataAtualizacaoPncp | opcional |

Usado na ficha quando o job gravou só o cabeçalho e o usuário abre o detalhe (lazy fill) — ou sempre no upsert.

### 2.3 Itens da contratação

`GET /modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133`

Filtros úteis: `codItemCatalogo`, `codigoGrupo`, `codigoClasse`, `materialOuServico`, `unidadeOrgaoCodigoUnidade`, `orgaoEntidadeCnpj`, `situacaoCompraItem`, `temResultado`, `dataInclusaoPncpInicial/Final`, `dataAtualizacaoPncp`.

Detalhe: `2.1_consultarItensContratacoes_PNCP_14133_Id` (`tipo` + `codigo` + `idCompraItem`).

**Mapeamento UI:** tabela “Itens e Lotes Específicos Deste Edital” (CATMAT, descrição, qtd, unitário estimado, total, adequação).

### 2.4 Resultados homologados de itens

`GET /modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133`

Filtros úteis: `niFornecedor`, `valorUnitarioHomologadoInicial/Final`, `dataResultadoPncpInicial/Final`, órgão/UASG.

Detalhe: `3.1_consultarResultadoItensContratacoes_PNCP_14133_Id`.

**Mapeamento UI:** preços praticados, ranking de fornecedores, eventos de radar `resultado`, histórico.

---

## 3. Contratos (P0)

Base: `/modulo-contratos`

### 3.1 Listar contratos

`GET /modulo-contratos/1_consultarContratos`

Parâmetros frequentes: `codigoOrgao`, `codigoUnidadeGestora`, `numeroContrato`, `codigoModalidadeCompra`, `niFornecedor`, `dataVigenciaInicialMin/Max`, `pagina`, `tamanhoPagina`.

Observação operacional (documentada por clientes da API): vários recortes **exigem órgão + janela ≤ 365 dias**. O job deve fatiar por órgão monitorado ou por faixas de data.

### 3.2 Contratos por fim de vigência

`GET /modulo-contratos/1.2_consultarContratos_FimVigencia`

Parâmetros-chave: `dataVigenciaFinalMin`, `dataVigenciaFinalMax`.

**Mapeamento UI:** cards 30/60/90 dias + tabela.

Três consultas (ou uma janela de 90 dias com classificação local):

- 30d: hoje → hoje+30
- 60d: hoje → hoje+60 (UI pode subtrair o bucket 30)
- 90d: hoje → hoje+90

### 3.3 Contrato por ID

`GET /modulo-contratos/1.1_consultarContratos_Id`  
`tipo`: `idCompra` | `numeroControlePncpContrato`

### 3.4 Itens de contrato

`GET /modulo-contratos/2_consultarContratosItem`  
`GET /modulo-contratos/2.1_consultarContratosItem_Id`

Usado para saber se o contrato que vence é do nicho (TI, hospitalar, climatização).

---

## 4. Catálogo CATMAT (P0 seletivo)

Base: `/modulo-material`

| Endpoint | Função |
|---|---|
| `/modulo-material/1_consultarGrupoMaterial` | grupos |
| `/modulo-material/2_consultarClasseMaterial` | classes |
| `/modulo-material/3_consultarPdmMaterial` | PDM |
| `/modulo-material/4_consultarItemMaterial` | item (código, descrição, NCM, status) |
| `/modulo-material/6_consultarMaterialUnidadeFornecimento` | unidade |
| `/modulo-material/7_consultarMaterialCaracteristicas` | características |

Na v1 **não** espelhar 281 mil especificações. Materializar apenas:

- itens citados em alertas;
- itens que apareceram em contratações coletadas;
- os 3–N produtos do catálogo operacional da empresa (PoC: 482910, 439120, 392102, 192834).

CATSER (`modulo-servico`) segue o mesmo padrão se o nicho incluir serviço.

---

## 5. Fornecedores (P0 leve)

`GET /modulo-fornecedor/1_consultarFornecedor`

Parâmetros: `cnpj`, `cpf`, `naturezaJuridicaId`, `porteEmpresaId`, `codigoCnae`, `ativo`, paginação.

Uso: hidratar razão social / porte quando o resultado de item só traz `niFornecedor`.

O ranking da tela “Concorrentes” é **agregação local** de `award_items`, não um campo pronto da API.

---

## 6. Pesquisa de preços (P1)

Módulo `modulo-pesquisa-preco` (DTOs `FtPesqPrecoCompraMaterial*` no Swagger).

Usar quando a série de homologações 14.133 de um CATMAT for curta. O service de stats deve marcar a **fonte** (`resultado_14133` vs `pesquisa_preco`) para não misturar sem aviso na UI.

---

## 7. Legado SIASG (P1)

Base: `/modulo-legado`

Exemplos documentados no manual:

- `2_consultarItemLicitacao`
- `6_consultarCompraItensSemLicitacao` (exige ano do aviso em alguns fluxos)
- consultas de pregão / licitação (`TbVwPregao`, `TbVwLicitacao`)

Só entrar no coletor se o histórico de 24 meses dos produtos-alvo não estiver coberto pelo módulo 14.133.

---

## 8. Estratégia de coleta (contrato de integração)

```
para cada módulo P0:
  gravar source_heartbeats.last_attempt_at
  tentar página 1..MAX
  upsert por chave natural
  gravar raw_payload jsonb (opcional, primeiros 90 dias — útil para retificação)
  last_success_at se nenhuma página falhou
```

**Detecção de retificação:** hash canônico (objeto + prazo + lista de itens + valor). Se o hash mudou e o `id_compra` já existia → `radar_events.type = retificacao`.

**Backoff:** se `totalPaginas` for absurdo ou a API responder HTML de erro, abortar o módulo e marcar `degraded`.

---

## 9. API interna — Pregoeiros

Todas as rotas abaixo são same-origin. JSON UTF-8. Erros no formato:

```json
{ "error": { "code": "VALIDATION", "message": "UF inválida" } }
```

Códigos HTTP: 200, 201, 204, 400, 401, 404, 409, 429, 503.

### 9.1 Saúde e fontes

#### `GET /api/health`

```json
{
  "app": "ok",
  "database": "ok",
  "lastSync": {
    "finishedAt": "2026-09-25T03:15:00-03:00",
    "status": "success"
  }
}
```

503 se o banco estiver fora. A API governo **não** derruba o health.

#### `GET /api/sources`

Alimenta o modal da PoC.

```json
{
  "modules": [
    {
      "key": "contratacoes",
      "label": "Editais & Contratações Abertas",
      "status": "ok",
      "lastSuccessAt": "2026-09-25T11:34:00-03:00",
      "detail": "1.482 oportunidades ativas"
    }
  ],
  "note": "Compras.gov.br federal & adesões sob a Lei nº 14.133/21."
}
```

#### `POST /api/sync`

Dispara coleta incremental (botão “Atualizar Fontes”).  
Auth: admin.  
Lock advisory: se já houver job, 409 `{ "error": { "code": "SYNC_IN_PROGRESS" } }`.

Resposta 202:

```json
{ "syncRunId": "uuid", "status": "queued" }
```

### 9.2 Busca global

#### `GET /api/search?q=`

Mínimo 2 caracteres. Agrupa como a PoC:

```json
{
  "procurements": [{ "id": "...", "objeto": "...", "comprador": "...", "prazoProposta": "..." }],
  "products":     [{ "id": "...", "nome": "...", "catmat": "482910", "mediana": 5480 }],
  "suppliers":    [{ "id": "...", "nome": "...", "cnpj": "...", "resultados": 432 }]
}
```

### 9.3 Export

#### `GET /api/export/oportunidades.csv`  
#### `GET /api/export/historico.json`

Respeitam os mesmos filtros da querystring da página de origem.

---

## 10. Form actions (mutações da PoC)

Preferir actions a REST para a UI. Endpoints REST só se um cliente futuro precisar.

| Action | Página | Campos | Efeito |
|---|---|---|---|
| `setDecision` | ficha / fila | `procurementId`, `decision=go\|analisando\|nogo` | persiste triagem; GO cria favorito |
| `createAlert` | modal alerta | `name`, `product`, `uf`, `buyer` | cria alerta + evento de radar “alerta ativado” |
| `deleteAlert` | `/alertas` | `id` | remove regra |
| `toggleFavorite` | várias | `type`, `targetId` | upsert/delete |
| `markEventSeen` | `/radar` | `id` | `seen=true` |
| `markAllRadarSeen` | `/radar` | — | todos do tenant |
| `selectProduct` | `/produtos` | via query `?produto=` | não é mutation |

Validação Zod em todas as actions. Mensagens de toast em pt-BR (textos da PoC).

---

## 11. Querystrings das páginas (contrato UI ↔ server)

### `/oportunidades`

`q`, `uf`, `triagem`, `segmento`, `modalidade`, `situacao`, `page`

`q` aceita `-token` de exclusão.

### `/radar`

`tab=all|unread|contratacao|retificacao|resultado`

### `/salvos`

`tipo=all|contratacao|produto|fornecedor`

### `/produtos`

`produto=<id interno ou catmat>`

Deep-link da ficha: `/editais/[id]` e também `/?edital=[id]` para o modal sobre a fila.

---

## 12. Versionamento

- API governo: paths já versionados no próprio nome (`1_`, `1.1_`, `2_`). Wrappers em `endpoints.ts` centralizam isso.
- API interna: sem `/v1` na v1 (YAGNI). Breaking change exige bump consciente e nota no changelog.

---

## 13. Exemplos de chamada (coletor)

```bash
curl -sS -H 'Accept: application/json' -H 'User-Agent: Pregoeiros/1.0' \
  'https://dadosabertos.compras.gov.br/modulo-contratacoes/1_consultarContratacoes_PNCP_14133?pagina=1&tamanhoPagina=100&unidadeOrgaoUfSigla=RJ&dataPublicacaoPncpInicial=2026-09-01&dataPublicacaoPncpFinal=2026-09-25'
```

```bash
curl -sS -H 'Accept: application/json' \
  'https://dadosabertos.compras.gov.br/modulo-contratos/1.2_consultarContratos_FimVigencia?pagina=1&tamanhoPagina=100&dataVigenciaFinalMin=2026-09-25&dataVigenciaFinalMax=2026-12-24'
```

O mapper deve tolerar campos nulos — a API pública é irregular entre modalidades.
