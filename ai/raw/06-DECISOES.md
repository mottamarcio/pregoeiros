# Registro de Decisões — Pregoeiros

**Versão:** 1.0  
**Data:** 2026-09-25  
**Status:** Aprovado  
**Escopo:** Resolve os conflitos entre `01-PRD.md`, `02-ARCHITECTURAL_SPECS.md`, `03-TECHNICAL_SPECS.md`, `04-API_SPECS.md`, `05-DATA_MODEL_SPECS.md` e a PoC `pregoeiros.html`.

**Precedência:** quando este documento diverge dos documentos 01–05 ou da PoC, **este documento prevalece**. Os documentos 01–05 permanecem inalterados; as decisões abaixo os complementam.

**Princípio geral:** a PoC é referência de **UX**, não de regra de negócio. Quando a PoC diverge das specs, as specs (e este registro) prevalecem, e o seed de desenvolvimento é corrigido.

---

## A. Produto e linguagem

### D-01 — Cobertura da base
Toda a UI usa “Compras.gov.br — federal e adesões (Lei 14.133/21)”. Os rótulos “Base Federal e Estaduais”, “compras federais e estaduais” e “Cobertura: Nacional” da PoC **não** são usados em produção. O PNCP permanece como extensão futura.

### D-02 — Limiares de amostra de preço
São dois conceitos distintos:
- **n ≥ 5** (configurável): piso para exibir a mediana; abaixo disso a UI mostra “amostra insuficiente”.
- **n ≥ 30**: selo “amostra robusta” na UI; é o mesmo limiar usado pela métrica de produto “itens de catálogo com ≥ 30 observações”.

## B. Triagem

### D-03 — Contador “Propostas até 48h”
Conta **apenas** editais com urgência `critico` (prazo ≤ agora + 48h, calculado em horas). O destaque visual continua para ambos os níveis: vermelho para `critico`, âmbar para `urgente`. Os cenários BDD devem usar dados coerentes com essa regra.

### D-04 — `encerrado` e prazo nulo
- `encerrado` = `situacao` ∈ (`homologado`, `cancelado`, `excluido`) **ou** `prazo_proposta_em` ≤ agora.
- Novo valor no enum `urgency_level`: **`sem_prazo`**, aplicado quando `prazo_proposta_em` é NULL e o edital não está encerrado. Vai para o fim da fila com o selo “Prazo não informado na base”.
- Ordem de avaliação: `encerrado` → `sem_prazo` → `critico` (≤ 48h) → `urgente` (≤ 3 dias) → `normal`.
- A view `v_triage_queue` deve refletir essa regra.

### D-05 — GO cria favorito
- A decisão GO faz upsert idempotente de um favorito do tipo `contratacao`.
- A tabela `favorites` ganha a coluna `origin` (`manual` | `triage`, default `manual`); o favorito criado pelo GO tem `origin = 'triage'`.
- Se a decisão mudar de GO para outro estado, só o favorito com `origin = 'triage'` é removido; favoritos manuais permanecem.
- A PoC, que não cria o favorito, está desatualizada nesse ponto.

### D-06 — Nome da tabela de triagem
A tabela chama-se **`triage_decisions`** (Data Model). A menção a `procurement_triage` na arquitetura é um erro de texto.

## C. Ficha do edital

### D-07 — ID oficial
A ficha exibe `numero_controle_pncp` (ou `id_compra`, se só esse existir) vindo do upstream. Se nenhum existir, o campo é ocultado. **Nunca** se monta um ID a partir de UASG + processo.

### D-08 — Adequação na PoC / CATMAT 401928
A regra de adequação prevalece. No seed de dev, cada item recebe um CATMAT distinto, e itens fora dos produtos monitorados aparecem como `verificar`.

## D. Busca

### D-09 — Coluna normalizada de fornecedores
A coluna chama-se **`razao_social_normalizada`** (espelha `razao_social`, no padrão `objeto` → `objeto_normalizado`).

### D-10 — Forma de normalização
Uma única definição, em uma única função TypeScript (`normalizeSearch` em `$lib/utils/normalize-search.ts`): minúsculas → NFD → remoção de diacríticos (U+0300–U+036F) → trim → colapso de espaços. A mesma função é usada para gravar as colunas `*_normalizado` e para montar consultas. Sem `unaccent` no Postgres.

## E. Preços

### D-11 — Média ponderada
`media_ponderada = sum(valor_unitario × quantidade) / sum(quantidade)`, sobre linhas com `quantidade > 0`. Se nenhuma linha da amostra tiver quantidade, usa-se a média simples e a UI sinaliza “média simples”. O SQL de exemplo do Data Model (`avg`) deve ser corrigido na implementação.

### D-12 — Unidade do N
N = número de **itens homologados** (linhas de `award_items`) na janela. Exibição secundária: “em X compras distintas”.

## F. Concorrentes

### D-13 — Identidade do órgão comprador
- “Órgãos distintos” conta `codigo_orgao`.
- A UASG é uma métrica própria (“unidades compradoras”).
- `award_items` ganha as colunas `codigo_orgao` e `uasg`; `supplier_stats` passa a usar `count(DISTINCT codigo_orgao)`.

## G. Contratos

### D-14 — Janelas de contratos
- UI: baldes de 30 / 60 / 90 dias.
- Coleta: `vigencia_fim` de hoje até hoje + 120 dias (a folga mantém o balde de 90 estável entre coletas).
- Retenção: apaga contratos com `vigencia_fim` < hoje − 30 dias. **Não** há limite superior de retenção.

## H. Alertas

### D-15 — Seed de alerta inconsistente
O alerta seed “Material Hospitalar em SP” passa a ser **“Material Hospitalar — Ministério da Saúde”**, com UF “Todos” e comprador Ministério da Saúde - DLOG, casando corretamente com o edital p-2 (DF).

### D-16 — Atalho “Triar oportunidades”
O atalho aplica os **três** critérios do alerta: produto, UF e órgão. `/oportunidades` ganha o filtro e o parâmetro de querystring **`orgao`**.

### D-17 — Granularidade do match
O match é avaliado **por edital**, agregando seus itens. Gera no máximo 1 linha em `alert_matches` e 1 `radar_event` por par (alerta, edital), de forma idempotente pela PK `(alert_id, procurement_id)`. `new_matches` só incrementa quando o match é inserido pela primeira vez.

## I. Radar e retificação

### D-18 — Hash de retificação
Hash canônico = objeto + prazo + lista de itens + valor + **metadados de anexos** (nome e URL, ordenados), quando o upstream os fornecer. Campos voláteis (ex.: `dataAtualizacao*`) ficam de fora. Se a API não expuser anexos, a limitação é registrada e a regra 8 vale apenas para os demais campos.

### D-19 — Contadores da PoC
Todo contador em produção é derivado dos dados. Os números fixos da PoC (“12 novos”, “2 urgentes”, 87/143/211, KPIs do histórico) são ilustrativos.

## J. Favoritos

### D-20 — Modelo de favoritos
Favoritos são identificados por FK (nunca por texto de título/código). Um índice UNIQUE parcial por tipo garante o toggle idempotente:
- `(tenant_id, procurement_id)` WHERE `type = 'contratacao'`
- `(tenant_id, catalog_item_id)` WHERE `type = 'produto'`
- `(tenant_id, supplier_id)` WHERE `type = 'fornecedor'`

## K. Arquitetura

### D-21 — Tenancy na v1
- `tenant_id` permanece nas tabelas de produto desde a v1, com **um único tenant**.
- Todo repositório filtra obrigatoriamente por `tenant_id` obtido da sessão (`event.locals`). **Sem RLS** na v1.
- A extensão futura passa a se chamar “multi-cliente real (SSO, billing, RLS)”.

### D-22 — Pasta de migrations
Migrations versionadas em **`src/lib/server/db/migrations/`**, que passa a constar na árvore de pastas.

### D-23 — Rota `/api/sources`
Adicionar **`src/routes/api/sources/+server.ts`** à árvore.

## L. Stack

### D-24 — E-mail de usuário
`users.email` é `text`, normalizado para minúsculas via Zod, com índice único em `(tenant_id, lower(email))`. Sem a extensão `citext`.

### D-25 — Autenticação
Implementação mínima de sessão em `hooks.server.ts`, seguindo o guia do Lucia (o que o `sv add lucia` gera): cookie httpOnly, tabela de sessões no Postgres, senha com **Argon2id**. Sem dependência da biblioteca Lucia (descontinuada) nem de Auth.js.

### D-26 — Escolhas de stack
- **D-26a:** Tailwind CSS **v4** (tokens em `@theme` no CSS).
- **D-26b:** **Drizzle ORM** para schema, migrations e tipos.
- **D-26c:** Ícones via **`unplugin-icons` + `@iconify-json/lucide`** (compilados no build, SSR, sem chamada à API do Iconify em runtime).
- **D-26d:** E2E com **Playwright puro**, títulos Dado/Quando/Então em pt-BR (sem `playwright-bdd`).

## M. Deploy

### D-27 — Nomes dos serviços
Serviços do Compose: **`web`** + **`db`** (e `cron`, se um dia virar sidecar).

### D-28 — Porta e modo de execução
- O Compose padrão roda o build de produção: `node build/index.js` na porta **3000** (padrão do adapter-node).
- Desenvolvimento: `vite dev` local na porta 5173 contra o `db` do Compose, ou um `compose.dev.yml` separado.

## N. API externa e coleta

### D-29 — Prioridade de `modulo-pesquisa-preco`
**P1**, entregue na fase F3, usado só quando a série 14.133 for curta. Não é necessário para o aceite da v1. O heartbeat `precos` fica inativo até lá.

### D-30 — Grafia de `dataAualizacaoPncp` / `dataAtualizacaoPncp`
`endpoints.ts` declara cada parâmetro exatamente como está no OpenAPI de cada endpoint. Na F1, um teste de contrato confere os nomes contra `https://dadosabertos.compras.gov.br/v3/api-docs`.

### D-31 — Escopo do catálogo
O refresh semanal (domingo 04:00) é **seletivo**: itens citados em alertas, produtos monitorados e itens vistos em contratações coletadas. O modal de fontes mostra a quantidade de itens materializados, não “281.000 especificações”.

### D-32 — Status das fontes
| `source_status` | Rótulo na UI | Condição |
|---|---|---|
| `ok` | Operando | última execução do módulo com sucesso e último sucesso há ≤ 24h |
| `degraded` | Degradado | última execução parcial/abortada, **ou** último sucesso há > 24h |
| `down` | Indisponível | falha total na última execução **e** nenhum sucesso nas últimas 48h |

## O. API interna

### D-33 — Código HTTP 202
202 entra na lista de códigos HTTP da API interna (usado por `POST /api/sync`).

### D-34 — Rota de exportação
URLs públicas `/api/export/oportunidades.csv` e `/api/export/historico.json`, implementadas em `src/routes/api/export/[entity].[format]/+server.ts` com param matchers: `entity` ∈ {`oportunidades`, `historico`}, `format` ∈ {`csv`, `json`}.

## P. Modelo de dados

### D-35 — FK de `award_items`
`award_items.procurement_id` e `award_items.procurement_item_id` usam `ON DELETE SET NULL`.

### D-36 — Chave natural dos itens
A chave natural de `procurement_items` é `(procurement_id, numero_item)`; `id_compra_item` é UNIQUE quando presente. A menção a `id_item` na arquitetura é um erro de texto.

### D-37 — Ligações do diagrama lógico
O diagrama é corrigido:
- `award_items` referencia o catálogo apenas pela coluna texto `catmat` (sem FK, pois o catálogo é seletivo).
- O fornecedor fica no nível de `contracts` (`supplier_cnpj`), não em `contract_items`.

### D-38 — Cascata em `radar_events`
`radar_events.procurement_id` usa `ON DELETE CASCADE`.

### D-39 — Exclusão de alertas
`deleteAlert` faz **soft delete** (`deleted_at`). O matcher ignora alertas excluídos; `alert_matches` é mantido para auditoria. O purge semanal remove definitivamente alertas com `deleted_at` há mais de 90 dias.

### D-40 — Seed de produtos
O seed de dev tem **4** produtos monitorados (482910, 439120, 392102, 192834). O 192834 é necessário para a adequação do item 1 do edital p-2 e para o alerta de material hospitalar.

### D-41 — Acessibilidade
A produção segue a regra de `aria-label` em todo botão só com ícone. A PoC não é referência de acessibilidade.
