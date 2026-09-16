# PRD — Pregoeiros

**Produto:** Pregoeiros
**Tipo:** Aplicação web para exploração e inteligência sobre compras públicas
**Frontend/Backend:** Svelte 5 + SvelteKit
**UI:** Tailwind CSS, light theme
**Accent:** `slate-900`
**Ícones:** Iconify
**Banco:** PostgreSQL
**Infra local:** Docker / Docker Compose
**Fonte inicial:** API de Dados Abertos do Compras.gov.br
**Status:** Draft

## 1. Visão

**Pregoeiros** é uma aplicação web para pesquisar, acompanhar e analisar compras públicas brasileiras.

O sistema transforma os dados públicos disponibilizados pelo Compras.gov.br em uma experiência orientada às perguntas reais do usuário:

```text
O que está sendo comprado?
        ↓
Quem está comprando?
        ↓
Quanto estão pagando?
        ↓
Quem está vencendo/fornecendo?
        ↓
O que aconteceu historicamente?
        ↓
Quais oportunidades me interessam agora?
```

A aplicação se organiza em três pilares:

```text
                  PREGOEIROS
                       │
          ┌────────────┼────────────┐
          │            │            │
       EXPLORAR     ACOMPANHAR    ANALISAR
          │            │            │
    Contratações    Favoritos     Histórico
    Produtos        Interesses    Preços
    Fornecedores    Radar         Fornecedores
    Contratos       Novidades     Compradores
```

A API do Compras.gov.br possui módulos de contratações, resultados de itens, CATMAT/CATSER, preços praticados, fornecedores, contratos, ARPs e dados legados, que formarão a base dessas funcionalidades.

## 2. Objetivo do produto

Pregoeiros não deve ser um frontend para Swagger.

O usuário não deveria precisar conhecer endpoints, parâmetros ou códigos internos da API para responder perguntas como:

> Quais órgãos estão comprando notebooks no Rio de Janeiro?

> Quanto o governo vem pagando por esse produto?

> Quais fornecedores aparecem nos resultados dessas contratações?

> Quais produtos essa empresa fornece?

> Existem novas contratações relacionadas aos produtos que acompanho?

> Quais contratos estão próximos do fim?

> Como os preços desse produto evoluíram nos últimos 24 meses?

O sistema deverá resolver essas perguntas através de navegação, pesquisa, filtros e visualizações.

---

# 3. Stack

## Aplicação

```text
Svelte 5
SvelteKit
TypeScript
Tailwind CSS
Iconify
```

Usar Svelte 5 idiomático, incluindo runes onde fizer sentido.

SvelteKit será responsável tanto pela aplicação web quanto pela camada server-side:

```text
Browser
   │
   ▼
SvelteKit
   │
   ├── pages/layouts
   ├── server routes/actions
   ├── services
   │
   ├── Compras.gov API
   │
   └── PostgreSQL
```

Não criaria inicialmente um backend Go separado. Seria complexidade operacional sem uma necessidade concreta.

## Persistência

PostgreSQL dentro do ambiente Docker.

```text
┌ Docker Compose ──────────────────┐
│                                 │
│  ┌────────────┐  ┌───────────┐  │
│  │ Pregoeiros │─►│ PostgreSQL│  │
│  │ SvelteKit  │  │           │  │
│  └────────────┘  └───────────┘  │
│          │                      │
└──────────┼──────────────────────┘
           │
           ▼
      Compras.gov.br
```

Em desenvolvimento, SvelteKit poderá ser executado fora do container se isso melhorar DX, mantendo somente PostgreSQL no Docker.

Em produção/self-hosted, ambos poderão ser containerizados.

---

# 4. Design system

Pregoeiros utilizará exclusivamente **light theme no MVP**.

A direção visual será sóbria e orientada a dados, evitando aparência excessivamente “governamental” ou de dashboard corporativo genérico.

### Cores

Base:

```text
background      white
surface         slate-50
border          slate-200
text            slate-950
text-muted      slate-500/600
accent          slate-900
accent-contrast white
```

Cores semânticas podem ser usadas para status:

```text
success    emerald
warning    amber
danger     red
info       blue
```

`slate-900` permanece o accent principal.

### Componentes fundamentais

Criar uma pequena biblioteca interna:

```text
Button
IconButton
Input
Select
Combobox
Badge
Card
Table
Pagination
Tabs
Dialog
Drawer
Dropdown
Tooltip
EmptyState
Skeleton
Alert
Stat
DateRangePicker
```

Não criar abstrações prematuramente. Um componente entra na biblioteca quando realmente é reutilizado.

### Iconografia

Iconify.

Os ícones devem complementar texto, não substituir labels importantes.

Exemplos conceituais:

```text
search
star
bookmark
building
package
history
chart-line
file-text
refresh
filter
download
external-link
```

---

# 5. Estrutura de navegação

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ Pregoeiros                              Buscar...       ⚙    │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│ Visão geral   │                                              │
│ Radar         │                                              │
│               │                                              │
│ EXPLORAR      │              Conteúdo                        │
│ Contratações  │                                              │
│ Produtos      │                                              │
│ Fornecedores  │                                              │
│ Contratos     │                                              │
│ Atas          │                                              │
│               │                                              │
│ ACOMPANHAR    │                                              │
│ Favoritos     │                                              │
│ Interesses    │                                              │
│               │                                              │
│ ANALISAR      │                                              │
│ Histórico     │                                              │
│ Preços        │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

A sidebar deve poder ser recolhida em telas menores.

Mobile utilizará navegação adaptada, não simplesmente uma sidebar espremida.

---

# 6. Dashboard

Rota:

```text
/
```

A home deve responder rapidamente:

> O que aconteceu desde a última vez que entrei?

Exemplo:

```text
Pregoeiros

Boa tarde

─────────────────────────────────────────────────────

Radar

  12   novas contratações
   4   interesses com novidades
   3   favoritos atualizados

─────────────────────────────────────────────────────

Seus interesses

Notebooks · RJ                              7 novos
Material hospitalar · SP                   3 novos
Ar condicionado                            2 novos

─────────────────────────────────────────────────────

Atividade recente

Nova contratação relacionada a "Notebooks"
Resultado publicado em contratação favoritada
Contrato acompanhado próximo do fim

─────────────────────────────────────────────────────

Última sincronização
Hoje, 03:15 · 2.381 registros atualizados
```

O dashboard não deve virar uma coleção arbitrária de gráficos.

Ele prioriza **informação acionável**.

---

# 7. Busca global

Elemento importante do produto.

Disponível no header:

```text
⌕ Buscar produtos, fornecedores, contratações...
```

A busca poderá retornar resultados agrupados:

```text
"notebook"

PRODUTOS
Notebook 14 polegadas             CATMAT ...
Notebook ultrafino                CATMAT ...

CONTRATAÇÕES
Aquisição de notebooks...         Ministério...
Aquisição de equipamentos...      Prefeitura...

FORNECEDORES
Notebook Comércio Ltda            CNPJ ...
```

Posteriormente pode ganhar atalho:

```text
Ctrl/Cmd + K
```

com command palette.

---

# 8. Produtos e serviços

Rota:

```text
/produtos
/produtos/[id]
```

CATMAT e CATSER devem aparecer sob uma interface única.

Filtros poderão permitir:

```text
Todos
Materiais
Serviços
```

Página de produto:

```text
← Produtos

Notebook

CATMAT XXXXX
Material

☆ Favoritar          + Criar interesse

─────────────────────────────────────────────────────

Visão geral | Preços | Contratações | Fornecedores

Histórico de preços

       ┌───────────────────────────────────────
 R$    │                 ╭──
       │       ╭────╮   ╭╯
       │───╮───╯    ╰───╯
       └───────────────────────────────────────
        Jan                         Set

Mediana             R$ ...
Mínimo              R$ ...
Máximo              R$ ...
Observações         327

Contratações recentes
...
```

---

# 9. Preços praticados

O módulo oficial de preços praticados será a fonte primária dessa feature.

Rota:

```text
/precos
```

Filtros:

```text
Produto/serviço
Período
UF
Órgão
Quantidade
```

Quando suportado pelos dados.

Estatísticas calculadas pelo Pregoeiros:

```text
mediana
média
mínimo
máximo
quartis
número de observações
```

A UI deve distinguir explicitamente **dados provenientes da API** de **estatísticas derivadas pelo Pregoeiros**.

---

# 10. Contratações

Rotas:

```text
/contratacoes
/contratacoes/[id]
```

Listagem:

```text
Contratações                                  [Filtros]

Buscar por objeto...

UF        Modalidade       Período       Situação

──────────────────────────────────────────────────────────

Objeto                         Comprador        Data
Aquisição de notebooks         Órgão A          ...
Material hospitalar            Órgão B          ...
...
```

Detalhe:

```text
Aquisição de equipamentos de informática

Órgão ...
UASG ...
Processo ...
Situação ...

☆ Favoritar

[Resumo] [Itens] [Resultados] [Histórico]

Objeto
...

Itens
42

Valor
...
```

O módulo da API possui consultas de contratações, itens e resultados de itens sob a Lei 14.133/2021.

---

# 11. Fornecedores

Rotas:

```text
/fornecedores
/fornecedores/[id]
```

Página:

```text
ACME Tecnologia Ltda.

CNPJ XX.XXX.XXX/XXXX-XX

☆ Favoritar

[Visão geral] [Resultados] [Produtos] [Compradores] [Histórico]

──────────────────────────────────────────────────

Resultados observados       ...
Valor observado             ...
Produtos                    ...
Compradores                 ...

Principais produtos

Produto                     Resultados
Notebook                    ...
Monitor                     ...
...
```

Pregoeiros deve ser rigoroso com a terminologia.

A presença de um fornecedor em um processo não significa vitória. Rankings devem usar resultados efetivamente observáveis nos dados.

---

# 12. Histórico

Rota:

```text
/historico
```

Esta será uma das principais áreas analíticas.

Tabs:

```text
Fornecedores
Produtos
Compradores
Preços
Contratações
```

Filtros globais:

```text
Período
UF
Produto/serviço
Comprador
```

Exemplo:

```text
Histórico / Fornecedores

Período: últimos 12 meses
Produto: Notebook
UF: Brasil

────────────────────────────────────────────────────

Resultados observados       12.483
Fornecedores                    418
Compradores                     731

────────────────────────────────────────────────────

Fornecedor                   Resultados      Valor
Empresa A                         ...          ...
Empresa B                         ...          ...
Empresa C                         ...          ...
```

Não usar linguagem como “empresa que mais ganha licitação” quando a métrica real for quantidade de resultados de itens.

---

# 13. Favoritos

Rota:

```text
/favoritos
```

Suportar inicialmente:

```text
Contratação
Produto/serviço
Fornecedor
Contrato
```

Favoritar significa:

> quero acompanhar especificamente esta entidade.

O botão deverá aparecer nas páginas correspondentes:

```text
☆ Favoritar
```

passando para:

```text
★ Favorito
```

A página agrega todos:

```text
Favoritos

[Todos] [Contratações] [Produtos] [Fornecedores] [Contratos]

★ Notebook
  Produto · CATMAT ...

★ ACME Tecnologia
  Fornecedor

★ Aquisição de equipamentos...
  Contratação
```

---

# 14. Interesses

Rota:

```text
/interesses
```

Um Interesse é uma **regra de acompanhamento**, não uma entidade.

Exemplo:

```text
Novo interesse

Nome
[ Notebooks RJ                         ]

Produto
[ Notebook — CATMAT XXXXX              ]

UF
[ RJ                                   ]

Comprador
[ Todos                              ▾ ]

                         [Criar interesse]
```

Persistência conceitual:

```text
interest
interest_filters
interest_last_checked_at
interest_matches
interest_match_seen_at
```

Isso permite distinguir:

```text
resultado conhecido
resultado novo
resultado já visualizado
```

---

# 15. Radar

Rota:

```text
/radar
```

O Radar é a caixa de entrada do Pregoeiros.

```text
Radar                                    12 não vistos

Hoje

● Nova contratação
  corresponde a "Notebooks RJ"
  há 23 minutos

● Novo resultado
  em uma contratação favoritada
  há 2 horas

Ontem

○ Nova contratação
  corresponde a "Material hospitalar"
```

Filtros:

```text
Todos
Não vistos
Contratações
Resultados
Contratos
```

O usuário poderá marcar eventos como vistos.

---

# 16. Contratos

Rotas:

```text
/contratos
/contratos/[id]
```

A API disponibiliza consultas de contratos, detalhes, itens e fim de vigência.

Isso permite uma visão:

```text
Contratos vencendo

Próximos
30 dias    87
60 dias   143
90 dias   211
```

Essa funcionalidade poderá posteriormente alimentar Interesses/Radar.

---

# 17. Histórico e sincronização

PostgreSQL terá dois papéis:

**cache operacional** e **base analítica histórica**.

A aplicação não deverá consultar toda a API a cada page load.

Fluxo:

```text
                 Compras.gov
                      │
                      │ sync
                      ▼
                 PostgreSQL
                 ▲         │
                 │         ▼
             background   SvelteKit
                 │         │
                 └─────────┘
                           │
                           ▼
                         Browser
```

O usuário consulta predominantemente PostgreSQL.

Isso torna páginas analíticas rápidas e reduz dependência da disponibilidade/latência da API externa.

---

# 18. Jobs

A antiga ideia de:

```text
pregoeiros sync
```

vira um **background job**.

Teremos inicialmente:

```text
sync-catalog
sync-procurements
sync-results
sync-prices
sync-suppliers
sync-contracts
process-interests
```

Não colocaria Redis/BullMQ no MVP.

Começaria com jobs idempotentes acionados pelo próprio ambiente/container, com estado registrado no PostgreSQL.

Cron:

```text
03:00  sync incremental
03:30  process interests
```

A frequência exata deverá ser configurável.

---

# 19. Estado da sincronização

Tabela:

```text
sync_runs

id
job
started_at
finished_at
status
records_read
records_created
records_updated
cursor
error
```

Admin/status poderá mostrar:

```text
Dados

Contratações
Atualizado há 12 minutos          ✓

Resultados
Atualizado há 14 minutos          ✓

Preços
Atualizado há 3 horas             ✓

CATMAT/CATSER
Atualizado ontem                  ✓
```

---

# 20. PostgreSQL

Modelo inicial conceitual:

```text
catalog_items
organizations
suppliers

procurements
procurement_items
procurement_results

contracts
contract_items

price_observations

favorites

interests
interest_filters
interest_matches

radar_events

sync_runs
```

Registros importados devem preservar:

```text
source
source_id
source_updated_at
fetched_at
```

e, quando justificável, parte do payload original em `jsonb`.

Evitar, entretanto, transformar PostgreSQL em depósito indiscriminado de JSON da API.

Campos importantes para filtros/joins/analytics devem ser normalizados.

---

# 21. Índices

Desde o início:

```sql
procurements(source_id)
procurements(published_at)

procurement_items(catalog_item_id)
procurement_results(supplier_id)

price_observations(catalog_item_id, observed_at)

contracts(end_date)

favorites(entity_type, entity_id)

interest_matches(interest_id, discovered_at)
```

Busca textual provavelmente justificará PostgreSQL full-text/trigram posteriormente.

Eu evitaria Elasticsearch/Meilisearch no MVP.

Postgres consegue nos levar bastante longe.

---

# 22. Estrutura SvelteKit

Algo nessa linha:

```text
src/
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── tables/
│   │   └── layout/
│   │
│   ├── server/
│   │   ├── comprasgov/
│   │   ├── db/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── jobs/
│   │
│   ├── domain/
│   └── utils/
│
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   │
│   ├── contratacoes/
│   ├── produtos/
│   ├── fornecedores/
│   ├── contratos/
│   ├── precos/
│   ├── historico/
│   ├── favoritos/
│   ├── interesses/
│   ├── radar/
│   └── settings/
│
└── app.css
```

Separação importante:

```text
route
  ↓
service
  ↓
repository
  ↓
Postgres

service
  ↓
comprasgov adapter
```

Um `+page.server.ts` não deve virar o lugar onde fazemos SQL, chamamos APIs e implementamos regras de negócio ao mesmo tempo.

---

# 23. SSR e carregamento

SvelteKit SSR por padrão.

Páginas de listagem/detail devem entregar HTML útil já no primeiro request.

Usar client-side fetching para:

* filtros sem navegação completa quando melhorar UX;
* paginação;
* autocomplete;
* atualizações incrementais;
* componentes analíticos pesados.

Evitar transformar uma aplicação SvelteKit em SPA sem necessidade.

---

# 24. URL como estado

Filtros relevantes devem estar na URL:

```text
/contratacoes?uf=RJ&produto=123&pagina=2
```

e:

```text
/historico/precos?produto=123&desde=2025-01-01&ate=2026-09-16
```

Isso permite:

* refresh;
* bookmark;
* compartilhamento;
* back/forward;
* URLs reproduzíveis.

Estado efêmero de UI não precisa estar na URL.

---

# 25. Paginação

Server-side.

Não enviar 10 mil registros ao browser para depois filtrar.

Padrão:

```text
20–50 registros/página
```

Analytics pode utilizar queries agregadas diretamente no PostgreSQL.

---

# 26. Exportação

Tabelas importantes terão:

```text
Exportar
  CSV
  JSON
```

Exportação grande deverá ser server-side/streaming quando necessário.

Filtros ativos devem ser aplicados ao arquivo.

Exemplo:

```text
Histórico de preços
Produto: Notebook
UF: RJ
2025–2026

[Exportar CSV]
```

---

# 27. Docker

Estrutura:

```text
docker-compose.yml
Dockerfile

services:
  app:
    ...
    depends_on:
      - postgres

  postgres:
    image: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

Variáveis:

```text
DATABASE_URL
COMPRAS_GOV_BASE_URL
SYNC_ENABLED
SYNC_CRON
```

Secrets nunca entram no repository.

---

# 28. Migrations

Migrations devem fazer parte da aplicação desde o primeiro schema.

Nunca depender de:

```text
"se a tabela não existir, CREATE TABLE..."
```

durante requests.

Deploy:

```text
migration
    ↓
application start
```

A escolha da camada de acesso ao Postgres — Drizzle, Kysely ou SQL mais direto — pode ser tomada durante o design técnico. Para este produto, eu favoreceria algo que mantenha **SQL visível**, porque teremos consultas analíticas progressivamente sofisticadas.

---

# 29. Observabilidade

Logs estruturados server-side.

Principalmente para sync:

```text
job
duration
records_fetched
records_inserted
records_updated
pages
retries
errors
```

O histórico de `sync_runs` complementa logs.

Health endpoint:

```text
/api/health
```

deve verificar aplicação e banco, sem necessariamente tornar indisponibilidade momentânea do Compras.gov uma falha total do Pregoeiros.

---

# 30. Estados de UI

Todas as telas precisam explicitamente tratar:

```text
loading
empty
error
partial data
stale data
success
```

Especialmente importante porque estamos espelhando uma fonte externa.

Exemplo:

```text
Dados atualizados há 6 horas

A última sincronização falhou.
Os dados abaixo continuam disponíveis, mas podem estar desatualizados.

[Ver detalhes] [Tentar novamente]
```

É muito melhor do que esconder o erro ou deixar a página inteira indisponível.

---

# 31. Responsividade

Desktop é a experiência principal para analytics, mas mobile precisa ser funcional.

Tabelas complexas não devem simplesmente ganhar `overflow-x: scroll` em todos os lugares.

Quando adequado:

```text
Desktop → tabela
Mobile  → cards/lista
```

Filtros avançados podem abrir em drawer no mobile.

---

# 32. Roadmap revisado

### MVP — Explorar

Entregar a aplicação web e provar o modelo de dados:

```text
SvelteKit 5
Tailwind
Iconify
PostgreSQL
Docker

layout + navegação
busca
CATMAT/CATSER
contratações
itens
resultados
fornecedores
preços praticados

favoritos

sync inicial
paginação
filtros
CSV/JSON
```

### v0.2 — Acompanhar

```text
Interesses
Radar
sync incremental automático
novidades
contratos
ARPs
páginas mais completas de fornecedor/produto
estado de sincronização
```

### v0.5 — Inteligência histórica

```text
bootstrap histórico
histórico de fornecedores
histórico de produtos
histórico de compradores
histórico de preços
gráficos
comparações
dados legados
snapshots/eventos
busca textual aprimorada
```

### v1.0 — Produto consolidado

```text
modelo de dados estabilizado
jobs resilientes
migrations maduras
analytics avançados
exportações grandes
Radar refinado
Interesses avançados
performance
observabilidade
backup/restore
documentação de self-hosting
```

---

# 33. Mudança conceitual importante

A migração de CLI/TUI para web melhora bastante o encaixe das funcionalidades que surgiram durante o brainstorm.

Antes tínhamos:

```text
API → CLI/TUI
        ↓
      SQLite
```

Agora eu trataria Pregoeiros essencialmente como:

```text
              ┌────────────────────┐
              │   Compras.gov.br   │
              └─────────┬──────────┘
                        │
                     ingestão
                        │
                        ▼
              ┌────────────────────┐
              │     PostgreSQL     │
              │                    │
              │ histórico          │
              │ analytics          │
              │ favoritos          │
              │ interesses         │
              │ radar              │
              └─────────┬──────────┘
                        │
                     SvelteKit
                        │
                        ▼
              ┌────────────────────┐
              │     Pregoeiros     │
              │                    │
              │ Explorar           │
              │ Acompanhar         │
              │ Analisar           │
              └────────────────────┘
```

Isso também altera uma decisão anterior: **eu faria o backfill e o pipeline de ingestão relativamente cedo**, porque Histórico, Radar, Favoritos e Interesses ficam muito mais simples quando a aplicação controla uma representação normalizada dos dados no PostgreSQL, em vez de tentar montar cada tela consultando a API do Compras.gov.br em tempo real.

O próximo passo técnico que eu faria antes de começar o código seria transformar este PRD em um **schema PostgreSQL + mapa de rotas SvelteKit + matriz endpoint Compras.gov → tabela → página/feature**. Isso nos diria exatamente quais dados precisamos ingerir para o MVP e evitaria modelar o banco no escuro.

