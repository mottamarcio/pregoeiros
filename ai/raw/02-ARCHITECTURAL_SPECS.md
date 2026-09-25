# Architectural Specs — Pregoeiros

**Versão:** 1.0  
**Stack alvo:** Svelte 5 + SvelteKit 2 + Tailwind CSS + Iconify + PostgreSQL (Docker)  
**Princípios:** SOLID, KISS, DRY, YAGNI, TDD, BDD

---

## 1. Objetivos da arquitetura

1. Reproduzir a UX da PoC sem acoplar a UI à API do governo.
2. Isolar código de servidor (`$lib/server`) para que secrets, SQL e o cliente HTTP do Compras.gov.br **nunca** vazem para o bundle do browser.
3. Permitir que a aplicação continue útil com a última base coletada (resiliência).
4. Manter a estrutura de pastas alinhada à documentação oficial do SvelteKit 2 e às convenções da comunidade (`src/lib`, `src/lib/server`, rotas com prefixo `+`, colocation só quando o artefato é exclusivo da rota).

---

## 2. Estilo arquitetural

Arquitetura em **camadas + ports and adapters**, sem over-engineering.

```
[Browser / Svelte 5]
        │  load() / form actions / fetch /api/*
        ▼
[SvelteKit routes]          ← HTTP, cookies, validação de input
        │
        ▼
[Application services]      ← casos de uso (triagem, match de alerta, stats)
        │
   ┌────┴────┐
   ▼         ▼
[Repositories]   [Jobs / Collectors]
   │                 │
   ▼                 ▼
[PostgreSQL]    [Compras.gov.br HTTP]
```

- **UI** não conhece endpoints do governo.
- **Services** não conhecem `fetch` cru nem SQL cru.
- **Repositories** falam SQL (via driver) e devolvem tipos de domínio.
- **Collectors** falam HTTP com a API pública e gravam via repositories.
- **Jobs** orquestram collectors + heartbeat de fontes.

Isso atende SOLID sem criar um “hexágono” de 20 pastas na v1 (YAGNI).

### 2.1 Como cada princípio se manifesta

| Princípio | Aplicação concreta |
|---|---|
| **S**ingle Responsibility | Um collector por módulo da API; um service por agregado (triagem, alerta, preço). |
| **O**pen/Closed | Novo módulo de coleta = novo adapter em `integrations/compras-gov`, sem alterar a fila. |
| **L**iskov | Repositórios expõem interfaces TypeScript estáveis; fake em testes substitui o real. |
| **I**nterface Segregation | `ProcurementRepository` não inclui métodos de cron; `SyncJob` não renderiza HTML. |
| **D**ependency Inversion | Services dependem de interfaces, não de `postgres.js` ou `fetch`. |
| **KISS** | Sem message broker na v1. Cron + tabela `sync_runs` basta. |
| **DRY** | Normalização de busca, money pt-BR e parser de exclusão `-termo` em um único módulo. |
| **YAGNI** | Sem Kafka, sem Elasticsearch, sem multi-região, sem ML. Índices Postgres + `pg_trgm`. |
| **TDD** | Funções puras (match de alerta, urgência, exclusão lexical, stats) nascem com teste unitário. |
| **BDD** | Jornadas em linguagem de negócio: “dado um alerta de notebooks no RJ, quando chegar contratação compatível, então surge evento não visto no radar”. |

---

## 3. Contexto e containers (C4 leve)

### 3.1 Contexto

```
Analista comercial ──► Pregoeiros (Web)
                           │
                           ├── PostgreSQL (estado interno + cache da base pública)
                           └── API Dados Abertos Compras.gov.br (somente leitura, sem auth)
```

### 3.2 Containers

| Container | Tecnologia | Responsabilidade |
|---|---|---|
| `web` | SvelteKit 2 (adapter-node) | SSR, rotas, API interna, UI |
| `db` | PostgreSQL 16 (Docker) | Persistência |
| `cron` | processo Node no mesmo serviço **ou** container sidecar | Dispara sync 03:15 e 15:15 |
| `compras-gov` | HTTPS público | Fonte externa |

Na v1 o cron pode rodar **dentro** do processo Node (`node-cron` ou systemd timer chamando `npm run job:sync`) para evitar orquestração extra. Docker Compose sobe `web` + `db`. Separar o worker só quando o tempo de coleta competir com requests (YAGNI agora, ponto de extensão depois).

---

## 4. Estrutura de pastas (SvelteKit 2)

Convenções seguidas:

- Tudo reutilizável em `src/lib`.
- Segredos e I/O em `src/lib/server` (alias `$lib/server` bloqueado no client).
- Rotas descrevem URL, não “controllers gordos”.
- Componentes usados em uma única rota podem ser colocados ao lado do `+page.svelte`.
- Componentes de layout (header, sidebar, modal shell) ficam em `$lib/components`.
- Runes Svelte 5 (`$state`, `$derived`, `$props`, `$effect`) no client; `load` e actions no server.

```
pregoeiros/
├── docs/
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURAL_SPECS.md
│   ├── 03-TECHNICAL_SPECS.md
│   ├── 04-API_SPECS.md
│   └── 05-DATA_MODEL_SPECS.md
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
├── vitest.config.ts
├── static/
│   └── favicon.svg
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── src/
    ├── app.html
    ├── app.css
    ├── app.d.ts
    ├── hooks.server.ts
    ├── hooks.client.ts
    ├── instrumentations.server.ts          # opcional
    ├── params/
    │   └── uasg.ts                         # matcher se necessário
    ├── lib/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AppHeader.svelte
    │   │   │   ├── AppSidebar.svelte
    │   │   │   └── MobileBackdrop.svelte
    │   │   ├── ui/                         # botões, badges, toast, kbd
    │   │   ├── search/
    │   │   │   └── GlobalSearch.svelte
    │   │   ├── triage/
    │   │   │   ├── TriageQueue.svelte
    │   │   │   └── DecisionBanner.svelte
    │   │   ├── procurement/
    │   │   │   └── ProcurementDetailModal.svelte
    │   │   └── charts/
    │   │       └── PriceTrendSvg.svelte
    │   ├── icons.ts                        # wrappers Iconify
    │   ├── types/
    │   │   ├── domain.ts
    │   │   └── api.ts
    │   ├── utils/
    │   │   ├── money.ts
    │   │   ├── normalize-search.ts
    │   │   ├── exclusion-query.ts
    │   │   └── urgency.ts
    │   └── server/
    │       ├── env.ts
    │       ├── db/
    │       │   ├── client.ts               # postgres.js ou drizzle
    │       │   ├── schema.ts
    │       │   └── migrate.ts
    │       ├── repositories/
    │       │   ├── procurement-repository.ts
    │       │   ├── item-repository.ts
    │       │   ├── supplier-repository.ts
    │       │   ├── contract-repository.ts
    │       │   ├── alert-repository.ts
    │       │   ├── favorite-repository.ts
    │       │   ├── radar-repository.ts
    │       │   ├── catalog-repository.ts
    │       │   └── sync-repository.ts
    │       ├── services/
    │       │   ├── triage-service.ts
    │       │   ├── alert-matcher.ts
    │       │   ├── price-stats.ts
    │       │   ├── search-service.ts
    │       │   └── export-service.ts
    │       ├── integrations/
    │       │   └── compras-gov/
    │       │       ├── client.ts           # HTTP + retry + timeout
    │       │       ├── types.ts            # DTOs upstream
    │       │       ├── mappers.ts          # DTO → domínio
    │       │       └── endpoints.ts        # paths versionados
    │       └── jobs/
    │           ├── scheduler.ts
    │           ├── sync-contratacoes.ts
    │           ├── sync-resultados.ts
    │           ├── sync-contratos.ts
    │           ├── sync-catalogo.ts
    │           └── heartbeat.ts
    └── routes/
        ├── +layout.svelte                  # shell: header + sidebar
        ├── +layout.server.ts               # contadores da sidebar
        ├── +error.svelte
        ├── +page.svelte                    # Fila de Triagem
        ├── +page.server.ts
        ├── oportunidades/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── produtos/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── precos/
        │   └── +page.server.ts             # redirect → /produtos
        ├── fornecedores/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── contratos/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── radar/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── alertas/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── salvos/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── historico/
        │   ├── +page.svelte
        │   └── +page.server.ts
        ├── editais/
        │   └── [id]/
        │       ├── +page.svelte            # ficha full-page (acessível)
        │       └── +page.server.ts
        └── api/
            ├── search/+server.ts
            ├── sync/+server.ts             # POST autenticado (interno)
            ├── export/[entity]/+server.ts
            └── health/+server.ts
```

### 4.1 Por que essa árvore

- A documentação oficial do SvelteKit coloca código de servidor em `src/lib/server` e impede import no client.
- Rotas planas (`/oportunidades`, `/radar`) espelham a navegação da PoC e evitam over-nesting.
- `+page.server.ts` carrega dados; componentes não fazem SQL.
- Jobs ficam fora de `routes/` porque não são HTTP.
- `tests/` na raiz é o padrão `sv create` + Playwright.

### 4.2 O que **não** fazer

- Não criar `src/controllers` nem `src/pages` estilo Next Pages Router.
- Não importar `$lib/server/*` em `.svelte` sem `+page.server` / `+server`.
- Não colocar o cliente Compras.gov.br em `src/lib` (iria para o browser).
- Não usar stores globais para dados de servidor que já vêm de `load`.
- Não duplicar o layout em cada view — um `+layout.svelte` com sidebar resolve a PoC.

---

## 5. Fluxos principais

### 5.1 Leitura (consulta do analista)

```
GET /oportunidades
  → +page.server.ts valida querystring
  → SearchService.parse(q)           # tokens + exclusões
  → ProcurementRepository.search()
  → +page.svelte renderiza tabela
```

### 5.2 Decisão de triagem

```
POST action setDecision
  → TriageService.set(id, go|analisando|nogo)
  → persiste procurement_triage
  → se GO, upsert favorite tipo contratacao
  → toast via flash / data
```

### 5.3 Coleta agendada

```
03:15 / 15:15 America/Sao_Paulo
  → scheduler abre sync_runs (status=running)
  → sync-contratacoes (janela incremental)
  → sync-itens + sync-resultados
  → AlertMatcher.processNew(ids)
  → detecta retificações (hash de payload)
  → sync-contratos (fim de vigência 0–120 dias)
  → heartbeat por módulo
  → sync_runs.status = success|partial|failed
```

Se um módulo falhar, os demais seguem (`partial`). A UI lê `source_heartbeats` e mostra “Operando / Degradado”.

### 5.4 Match de alerta

```
novo item persistido
  → para cada alerta ativo
      se CATMAT/texto casa AND UF casa AND órgão casa
        incrementa new_matches
        cria radar_event (tipo contratacao, seen=false)
```

---

## 6. Fronteiras de confiança

| Zona | Pode | Não pode |
|---|---|---|
| Client Svelte | renderizar, filtrar UI já carregada, ⌘K contra `/api/search` | ver `DATABASE_URL`, chamar Compras.gov.br direto |
| `+page.server` / `+server` | validar input, chamar services | SQL misturado com markup |
| Repositories | SQL | regras de match de alerta |
| Integrations | HTTP + mapear DTO | gravar decisão de triagem |
| Jobs | orquestrar | responder request de usuário |

---

## 7. Dados e consistência

- Modelo **híbrido**: cópia local da base pública + tabelas de produto (triagem, alertas).
- Upsert pela chave natural oficial (`id_compra` / `numero_controle_pncp` + `id_item`).
- Eventos de radar são imutáveis; só o flag `seen` muda.
- Estatísticas de preço **não** são materializadas na v1 (YAGNI). Calculadas por query agregada com cache curto (5–15 min) se necessário.

---

## 8. Deploy e runtime

```
Docker Compose (dev/prod simples)
  web   → node build/index.js   (adapter-node)
  db    → postgres:16-alpine
```

- Variáveis: `DATABASE_URL`, `COMPRAS_GOV_BASE_URL`, `CRON_TZ=America/Sao_Paulo`, `SYNC_CRON=15 3,15 * * *`.
- Healthcheck: `GET /api/health` verifica Postgres e último `sync_runs`.
- Migrations versionadas em `src/lib/server/db/migrations`.

---

## 9. Observabilidade

- Log JSON: `request_id`, `route`, `sync_run_id`, `module`, `pages_fetched`, `upserts`.
- Tabela `sync_runs` é a fonte do modal “Fontes Consultadas”.
- Sem APM obrigatório na v1; stdout + Postgres bastam.

---

## 10. Segurança (mínimo viável)

- App interna (v1): autenticação simples (credencial da empresa) via Lucia/Auth.js ou session SvelteKit — detalhada no Technical Spec.
- Rate limit em `/api/sync` para não disparar coleta em loop.
- Prepared statements em 100% do SQL.
- Timeout e teto de páginas no client HTTP (proteção contra hang da API governo).

---

## 11. Extensões conscientes (não implementar agora)

- Worker dedicado + fila (quando a coleta passar de ~10 min).
- Leitura complementar do PNCP (`pncp.gov.br/api/consulta`) se a cobertura estadual for requisito.
- Full-text `websearch_to_tsvector` se `pg_trgm` não aguentar.
- Multi-tenant com `tenant_id` em todas as tabelas de produto.

A pasta `integrations/` já isola o ponto de extensão.
