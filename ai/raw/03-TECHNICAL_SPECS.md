# Technical Specs — Pregoeiros

**Versão:** 1.0  
**Alvo de implementação:** Svelte 5 / SvelteKit 2

---

## 1. Stack

| Camada | Escolha | Motivo |
|---|---|---|
| UI | Svelte 5 (runes) | Reatividade explícita; PoC hoje é HTML+JS monolítico |
| Meta-framework | SvelteKit 2 | SSR, `load`, form actions, `$lib/server` |
| Linguagem | TypeScript 5 strict | Contratos com a API governo são largos; tipar o domínio interno |
| CSS | Tailwind CSS 4 (ou 3) | PoC já usa Tailwind; accent **slate-900** |
| Ícones | Iconify (`iconify-icon` web component ou `@iconify/svelte`) | PoC usa `lucide:*` via Iconify |
| Fonte | Inter + JetBrains Mono (Google Fonts) | Paridade visual com a PoC |
| Banco | PostgreSQL 16 em Docker | Relacional, janelas de vigência, `pg_trgm`, JSONB para payload cru |
| Acesso a dados | Drizzle ORM **ou** `postgres.js` + SQL tipado | Preferência: Drizzle para migrations e tipos; KISS se o time preferir SQL cru |
| HTTP interno | `fetch` nativo no server | Sem axios |
| Validação | Zod | Querystring, actions, DTOs de job |
| Testes unitários | Vitest | Alinhado ao Vite |
| Testes de componente | Vitest + Testing Library (Svelte) | — |
| BDD / E2E | Playwright com Gherkin leve (`describe` em pt-BR) ou `playwright-bdd` | Jornadas da PoC |
| Runtime | Node 22 LTS + `@sveltejs/adapter-node` | Cron no mesmo processo no início |
| Containers | Docker Compose | `app` + `postgres` |

### 1.1 Dependências de UI (paridade PoC)

- `tailwindcss`, plugin forms se necessário.
- Accent e tokens:

```js
// tailwind.config
theme.extend.colors.brand = {
  50:'#f8fafc', 100:'#f1f5f9', 200:'#e2e8f0', 300:'#cbd5e1',
  400:'#94a3b8', 500:'#64748b', 600:'#475569', 700:'#334155',
  800:'#1e293b', 900:'#0f172a', 950:'#020617'
}
fontFamily: { sans: ['Inter','sans-serif'], mono: ['JetBrains Mono','monospace'] }
```

- Botões primários: `bg-slate-900 hover:bg-slate-800 text-white`.
- Superfície: branco + bordas `slate-200` + sidebar `slate-50`.
- Estados: GO `emerald`, análise `amber`, NO-GO `red`, urgente `red`.

---

## 2. Convenções Svelte 5

```svelte
<script lang="ts">
  import type { Procurement } from '$lib/types/domain';

  let { data }: { data: { queue: Procurement[] } } = $props();
  let filter = $state<'all' | 'pendente' | 'go'>('all');
  let visible = $derived(
    filter === 'all' ? data.queue : data.queue.filter((p) => p.decisao === filter)
  );
</script>
```

Regras:

- `$props()` no lugar de `export let`.
- `$state` / `$derived` no client; dados de servidor entram por `data`.
- Eventos de decisão via **form actions** (progressive enhancement) + `enhance`.
- Modais controlados por query `?edital=` ou store local de UI — preferir query para deep-link da ficha.
- Snippets Svelte 5 para linhas de tabela repetidas.

---

## 3. Convenções SvelteKit 2

### 3.1 Load vs Action vs API

| Necessidade | Mecanismo |
|---|---|
| Renderizar página com dados | `+page.server.ts` `load` |
| Mutação (GO/NO-GO, criar alerta, marcar visto) | `actions` no `+page.server.ts` |
| Busca global / export / health / trigger sync | `src/routes/api/**/+server.ts` |
| Dados do chrome (badges sidebar) | `+layout.server.ts` |

### 3.2 Formato de `load`

```ts
export const load = async ({ url, locals }) => {
  const parsed = opportunityQuerySchema.parse(Object.fromEntries(url.searchParams));
  return { items: await searchProcurements(parsed), total: ... };
};
```

Filtros da PoC viram search params: `q`, `uf`, `triagem`, `segmento`, `modalidade`, `situacao`. Recarregar com `goto` + `invalidateAll` ou `applyAction`.

### 3.3 Privacidade de módulos

Qualquer arquivo sob `src/lib/server` que for importado no client deve falhar o build. CI roda `svelte-check`.

---

## 4. Cliente HTTP Compras.gov.br

Arquivo: `$lib/server/integrations/compras-gov/client.ts`

Comportamento:

- Base: `https://dadosabertos.compras.gov.br`
- Somente GET.
- `Accept: application/json`.
- Timeout 20–30 s por página.
- Retry exponencial (3x) em 429/502/503/504 e timeout.
- Paginação: `pagina` (default 1) + `tamanhoPagina` (usar 100–500; teto upstream 500).
- Envelope típico:

```ts
type GovPage<T> = {
  resultado: T[];
  totalRegistros: number;
  totalPaginas: number;
  paginasRestantes: number;
};
```

- Teto de segurança por execução: N páginas por módulo (config). Se estourar, `sync_runs` fica `partial`.
- User-Agent identificável: `Pregoeiros/1.0 (+contato-da-empresa)`.
- **Não autenticar.** A API pública não exige token; se no futuro exigir, o secret fica em `env.ts`.

Mapeadores isolam nomes instáveis do upstream (`dataAualizacaoPncp` com typo oficial, etc.).

---

## 5. Jobs / Cron

### 5.1 Agenda

| Horário (America/Sao_Paulo) | Job | Recorte |
|---|---|---|
| 03:15 | `full-incremental` | Contratações + itens + resultados (janela 7–15 dias de atualização) + contratos vigência 0–120 dias + heartbeat |
| 15:15 | `full-incremental` | Idem |
| Domingo 04:00 | `catalogo-catmat` | Grupos/classes/itens CATMAT tocados pelos alertas (não dump de 281k na v1) |

A PoC exibe “Última Coleta: Hoje, 03:15”. O header lê `sync_runs.finished_at` mais recente com status `success` ou `partial`.

### 5.2 Implementação

Opção A (v1, KISS): `node-cron` iniciado em `hooks.server.ts` **somente se** `ENABLE_CRON=true` (um réplica).  
Opção B: container `cron` chama `node build/job.js sync`.  
Opção C: `ofelia` / crontab do host.

Lock: `pg_advisory_lock` para não sobrepor 03:15 e um trigger manual.

### 5.3 Passos de um `full-incremental`

1. Inserir `sync_runs`.
2. Contratações Lei 14.133: `modulo-contratacoes/1_consultarContratacoes_PNCP_14133` com `dataPublicacaoPncpInicial/Final` **ou** `dataAualizacaoPncp`.
3. Itens: `2_consultarItensContratacoes_PNCP_14133` por `idCompra` novo/atualizado (ou janela).
4. Resultados: `3_consultarResultadoItensContratacoes_PNCP_14133`.
5. Diff de hash → eventos `retificacao`.
6. Matcher de alertas.
7. Contratos: `1.2_consultarContratos_FimVigencia` janelas 30/60/90/120.
8. Heartbeats por módulo.
9. Fechar `sync_runs` com contagens.

### 5.4 Degradação

- Falha total de um módulo: heartbeat `down`, UI mostra “Degradado”, dados antigos permanecem.
- Nunca truncar tabelas públicas no job incremental.

---

## 6. Busca e normalização

Reaproveitar a PoC:

```ts
normalizeSearch(str) =
  lowerCase + NFD + remove diacríticos + trim

parseQuery("notebook -servico RJ")
  → include: ["notebook", "rj"]
  → exclude: ["servico"]
```

Índice: `pg_trgm` em `objeto_normalizado`, `itens_texto_normalizado`, `razao_social_normalizada`.  
Filtros estruturais (UF, modalidade, situação, decisão) são colunas, não FTS.

---

## 7. Estatísticas de preço

`PriceStatsService` sobre `award_items` (homologações):

- Janela default: 24 meses.
- Mediana: `percentile_cont(0.5)`.
- Média ponderada por quantidade quando houver.
- Desvio padrão amostral.
- Min/max com órgão e contexto (garantia, on-site) se o texto do item trouxer.
- Só exibir se `n >= 5` (configurável). Abaixo disso, UI diz “amostra insuficiente”.

Gráfico da PoC pode continuar SVG simples (não obrigar Chart.js na v1).

---

## 8. Autenticação (v1)

App de uso interno da empresa fornecedora.

- Sessão por cookie httpOnly (`sveltekit` + Lucia ou implementação mínima de `hooks.server.ts`).
- Roles: `analista`, `admin`.
- `admin` dispara sync manual e vê logs.
- Sem OAuth obrigatório.

Se o time quiser pular login no MVP local, `AUTH_DISABLED=true` apenas em desenvolvimento.

---

## 9. Exportações

- CSV de oportunidades: colunas da tabela da PoC (prazo, objeto, órgão, UF, valor, triagem, processo, UASG).
- JSON de histórico: ranking + metadados da janela e da fonte.
- Gerar no servidor (`ExportService`), download via `Content-Disposition`.
- Encoding UTF-8 com BOM no CSV para Excel pt-BR.

---

## 10. Qualidade e testes

### 10.1 TDD (dentro para fora)

Cobrir primeiro, sem I/O:

- `normalizeSearch`, `parseExclusionQuery`
- `classifyUrgency(diasRestantes)`
- `matchesAlert(alerta, edital, itens)`
- `priceStats(sample)`
- mapper DTO governo → domínio

### 10.2 Contratos de integração

- Client HTTP com servidor mock (MSW ou fixture JSON gravada do Swagger).
- Repository contra Postgres de teste (`docker compose -f compose.test.yml`).

### 10.3 BDD (jornadas da PoC)

Exemplos de cenários (Playwright):

```
Dado que existem 4 editais pendentes e 2 com prazo ≤ 48h
Quando o analista abre a Fila de Triagem
Então os contadores exibem "4 editais" e "2 urgentes"

Dado o edital do TRF2 com 3 itens CATMAT
Quando o analista abre a Ficha de Triagem
Então a tabela lista exatamente esses 3 itens

Dado um alerta "Notebooks no RJ"
Quando o job persiste uma contratação de notebook no RJ
Então o Radar mostra 1 evento não visto do tipo contratacao

Dado a ficha aberta
Quando o analista clica GO
Então o badge vira "Participando (GO)" e o item aparece em Salvos
```

Meta v1: cobertura alta nas funções puras + 8–12 jornadas E2E da PoC. Não perseguir 100% de linhas em componentes visuais.

---

## 11. Performance

- SSR da fila com limite 50 + paginação.
- Índices listados no Data Model.
- `+layout.server.ts` só busca agregados baratos (counts).
- Busca global debounce 200 ms, mínimo 2 caracteres (como a PoC).
- Coleta fora do request path.

---

## 12. Acessibilidade e teclado (paridade PoC)

- `⌘K` / `Ctrl+K` foca busca; `/` também, se o foco não estiver em input.
- `Escape` fecha modais e dropdown.
- Sidebar mobile com backdrop.
- Ícones com `aria-label` nos botões só-ícone.

---

## 13. Variáveis de ambiente

```
DATABASE_URL=postgres://pregoeiros:pregoeiros@db:5432/pregoeiros
COMPRAS_GOV_BASE_URL=https://dadosabertos.compras.gov.br
COMPRAS_GOV_PAGE_SIZE=100
COMPRAS_GOV_MAX_PAGES_PER_MODULE=50
CRON_TZ=America/Sao_Paulo
SYNC_CRON=15 3,15 * * *
ENABLE_CRON=true
AUTH_DISABLED=false
PUBLIC_APP_NAME=Pregoeiros
```

Nada com `PUBLIC_` deve conter URL de banco.

---

## 14. Docker Compose (dev)

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: pregoeiros
      POSTGRES_PASSWORD: pregoeiros
      POSTGRES_DB: pregoeiros
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pregoeiros"]
      interval: 5s
  app:
    build: .
    env_file: .env
    ports: ["5173:5173"]
    depends_on:
      db: { condition: service_healthy }
volumes:
  pgdata:
```

Extensão `pg_trgm` criada na migration inicial.

---

## 15. Padrões de código

- Funções e arquivos em inglês; copy da UI em pt-BR.
- Datas persistidas em `timestamptz`; exibidas `pt-BR` (`28/09/2026 às 10:00`).
- Dinheiro em `numeric(18,2)` + `Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`.
- IDs internos UUID; IDs oficiais em colunas próprias, nunca misturados.
- Comentários só onde o upstream é ambíguo (typos de campo, janela máxima de 365 dias em contratos).
