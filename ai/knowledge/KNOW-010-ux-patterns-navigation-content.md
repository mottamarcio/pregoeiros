---
id: KNOW-010
type: knowledge
status: active
sources:
  - path: ai/raw/uiux-specification.md
    fingerprint: sha256:b408cfa091b5c325182f3ecfdd59f7973fe7b8f8c6a5cc3dae6e7b2d305bbf54
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:45d65300ce5243505c8fc1b0330848f4a33ace6aced788b7221f8643e6cfc791
---

# KNOW-010

## Summary

Cross-cutting UX rules for Pregoeiros: navigation IA, URL-driven state,
loading/empty/error/stale states, formatting/terminology precision, and
accessibility. The unifying theme is that the UI must never claim more
certainty, coverage, or freshness than the underlying data actually supports.

## Known Facts

- **Navigation IA**: sidebar groups are Primary (Visão geral, Radar),
  EXPLORAR (Contratações, Produtos & Serviços, Fornecedores, Contratos &
  Vigências), ACOMPANHAR (Favoritos, Interesses), ANALISAR (Histórico
  Observado, Preços Praticados). Group label style: 10px semibold uppercase,
  increased letter spacing, slate-400. Nav item: ~32px height, 12px
  padding-x, 8px padding-y, 8px radius, 12px medium text slate-600, 16px
  slate-500 icon; hover bg-slate-100/text-slate-900; selected
  bg-white/border-slate-200/text-slate-900/shadow-xs. Sidebar bottom shows
  "PostgreSQL Cache" status card ("Conectado" when healthy, e.g. "Índices Lei
  14.133/21 sincronizados. Próximo job às 03:00."). Below `md` breakpoint the
  sidebar becomes an off-canvas drawer (slate-900/40% backdrop; closes on
  item select, backdrop click, or Escape).
- **URL as state**: shareable filters/search/sort/page/date-range/selected
  analytical dimension MUST live in the URL, e.g.
  `/contratacoes?uf=RJ&produto=123&pagina=2` and
  `/historico/precos?produto=123&desde=2025-01-01&ate=2026-09-16`. This
  enables refresh, bookmarking, sharing, back/forward, reproducible URLs.
  Ephemeral UI state (e.g. a drawer being open) stays client-side, not in the
  URL.
- **Pagination**: server-side always; the browser must never receive
  thousands of records to filter locally. Standard page size 20–50
  records/page. Footer pattern: "Exibindo 1–25 de 1.482" +
  "[Anterior] Página 1 de 60 [Próxima]"; current page must not rely on color
  alone.
- **Export**: important tables support CSV and JSON export; large exports
  should be server-side/streamed; exports MUST apply the currently active
  filters (never let the browser download an unfiltered dataset and filter
  client-side) and, once multi-user auth exists, the same authorization
  boundaries as web views. Toast after starting: "Exportação iniciada com os
  filtros ativos." Avoid unnecessary modal confirmation for immediate
  downloads.
- **SSR strategy**: SvelteKit SSR is the default; listing/detail pages must
  deliver useful HTML on first request. Client-side fetching is reserved for
  autocomplete, pagination, interactive filters, favorite toggles, interest
  editing, marking Radar events read, and analytical visualizations —
  Pregoeiros should not become an SPA by default. A `+page.server.ts`
  should only validate URL params, call a service, and return a view model —
  never contain raw SQL, upstream HTTP calls, sync logic, or substantial
  business rules (see [[KNOW-003]]).
- **UI states discipline**: every screen must explicitly handle loading,
  empty, error, partial data, stale data, and success — "especially important
  because estamos espelhando uma fonte externa" (PRD). No full-page spinner
  for ordinary navigation; prefer skeleton rows (tables), skeleton blocks
  (cards), inline spinners (buttons), skeleton values/chart areas
  (analytics), and direct SSR rendering on initial load. Skeleton styling:
  `bg-slate-100 rounded animate-pulse`, no heavy shimmer effects. Example
  stale-data pattern: "Dados atualizados há 6 horas" + "A última
  sincronização falhou. Os dados abaixo continuam disponíveis, mas podem
  estar desatualizados." + actions "[Ver detalhes] [Tentar novamente]" — far
  preferable to hiding the error or taking the whole page down.
- **Empty states** must answer: what happened, why it might be empty, what
  the user can do (e.g. "Nenhuma contratação encontrada." + "Tente remover
  alguns filtros ou alterar o período pesquisado." + action "Limpar
  filtros").
- **Error states**: recoverable fetch error → "Não foi possível carregar
  estes dados." + "Tentar novamente"; stale-data scenario →
  "Os dados exibidos podem estar desatualizados." + "Última sincronização
  bem-sucedida: hoje às 03:15." Persistent/actionable errors use an inline
  alert, not an auto-dismissing toast.
- **Toasts**: bottom-right desktop, bottom with safe margin on mobile;
  slate-900 bg, white text, 12px radius, shadow-lg, 10×16px padding, default
  emerald success icon, ~3s duration. Error toast uses a red-600 icon
  (slate-900 bg remains acceptable). Copy is factual and punctuation-
  consistent, avoiding unnecessary exclamation marks (e.g. "Produto
  adicionado aos favoritos.", "Regra 'Notebooks · RJ' criada com sucesso.").
- **Confirmation UX**: skip confirmation for easily reversible actions (mark
  Radar event seen, favorite, unfavorite); require it for actions like
  deleting an Interest with accumulated matches or destructive configuration
  changes (see [[KNOW-007]]).
- **Data freshness** is a product-level concept, not just diagnostics.
  Compact patterns: "Dados atualizados há 14 min" / if stale "Dados
  possivelmente desatualizados · última sincronização há 9 h" (amber only
  when staleness is meaningful). Human-readable freshness phrasing generally:
  "Atualizado há 12 minutos", "Atualizado há 3 horas", "Atualizado ontem",
  with exact timestamp available via tooltip/detail.
- **Formatting rules (pt-BR)**: currency locale `pt-BR`/`BRL`, e.g.
  "R$ 5.480,00"; large currency may abbreviate in compact KPIs (e.g.
  "R$ 142,8 mi") but the full value must stay accessible via tooltip/detail;
  dates as `DD/MM/YYYY` (e.g. "12/09/2026"), with human-relative variants
  ("há 23 minutos", "ontem") for activity feeds, and combined date+time for
  precision ("16/09/2026 às 03:15"); numbers use Brazilian grouping/decimal
  (e.g. "12.483", "5.480,30") — never mix English and Brazilian number
  formatting. Identifiers (CNPJ, UASG, CATMAT) should not be truncated
  unless necessary, and if truncated the full value must be available via
  tooltip/copy.
- **Content voice**: concise, factual, technical without unnecessary jargon,
  neutral, precise — e.g. prefer "3 favoritos atualizados" over "Temos
  novidades incríveis em seus favoritos!", and "Nenhuma contratação
  encontrada." over "Ops! Parece que não encontramos nada por aqui."
  Pregoeiros is a professional tool, not a consumer app.
- **Terminology precision / observed vs derived data** is treated as
  fundamental: source-derived factual data (e.g. "Valor unitário
  homologado: R$ 5.120,00") must be visually/textually distinguishable from
  Pregoeiros-derived metrics (e.g. "Mediana calculada: R$ 5.480,00"); derived
  analytics should identify metric, period, and observation count where
  useful. The UI must not convert correlation into certainty — e.g. avoid
  "Oportunidades imediatas de novo edital" or "Em fase de planejamento pelos
  órgãos" for expiring contracts; prefer factual phrasing like "Contratos
  com vigência próxima do encerramento" / "Vencimento entre 31 e 60 dias"
  unless the underlying data actually establishes the stronger claim.
- **Favorites vs Interests messaging**: "Acompanhe uma entidade específica."
  (Favoritos) vs. "Acompanhe novas ocorrências que correspondam a uma
  regra." (Interesses) — this distinction must appear in empty states and
  creation flows (see [[KNOW-007]]).
- **Accessibility target**: WCAG 2.2 AA. Requirements include semantic HTML,
  visible keyboard focus (slate-900 outline/ring, 1–2px offset), correct
  form labels, accessible button names, adequate contrast, keyboard-operable
  navigation, modal focus trapping + focus restoration on close, Escape to
  close modals/drawers, and screen-reader announcements for important async
  feedback. Global keyboard shortcuts: `/` and `Ctrl/⌘+K` focus search,
  `Esc` closes modal/drawer; custom shortcuts must not interfere with typing
  in inputs. Never communicate state through color alone (e.g. "● Publicada"
  not just "●"); expiration status must include text, not just a color dot.
- **Responsive rules**: breakpoints follow Tailwind defaults — `<sm` mobile,
  `sm` expanded mobile/small tablet, `md` sidebar switches drawer→persistent,
  `lg` large-screen metadata (e.g. sync status) becomes visible. Page action
  buttons wrap below titles on mobile rather than compressing into the same
  row. Mobile filters collapse to one column and stay inline/stacked for the
  initial version (not a drawer yet). Tables use horizontal scroll on
  moderately wide layouts, or convert to cards for highly interactive entity
  listings on small screens — but table text must never shrink below 10px to
  force-fit, and columns must never shrink until data becomes unreadable.
- **Search UX**: global search results are conceptually grouped by entity
  type (Contratações / Produtos e Serviços / Fornecedores / Contratos); if it
  currently just redirects to procurement search, the placeholder/UI must
  not imply broader coverage than it has (see [[KNOW-006]]).
- **Z-index model**: normal content 0, mobile backdrop 10, sidebar 20,
  sticky header 30, dropdown/popover 40, modal/toast 50 — avoid arbitrary
  high values.

- **Dashboard** (`/`) — the home screen must answer "O que aconteceu desde a
  última vez que entrei?" quickly, and must prioritize actionable
  information rather than becoming an arbitrary collection of charts. Title
  "Pregoeiros" (24px dashboard title, larger than the standard 20px page
  title); subtitle "Exploração e inteligência sobre contratações públicas
  federais e estaduais"; primary actions "Novo Interesse" and "Sincronizar".
  Sections: **Radar de Acompanhamento** summary (e.g. "12 novas contratações
  hoje", "4 interesses com novidades" — may use emerald emphasis on the
  middle metric, others neutral — link "Ver todos os eventos"); **Seus
  interesses monitorados** (clickable rows that open Contratações
  pre-filtered, action "Gerenciar"); **Atividade recente na base**
  ("Eventos observados" rows with a 28px circular icon container, title,
  description, timestamp — icon color: blue = new procurement, emerald =
  successful result, amber = expiration/time-sensitive event, applied only
  to the icon container, not the whole row); and optionally "RESPOSTAS
  DIRETAS ÀS PERGUNTAS REAIS" shortcut cards (e.g. "Quais órgãos estão
  comprando notebooks no RJ?" → "Filtro: CATMAT 482910 + UF: RJ") that must
  behave as real filtered-view shortcuts, not static marketing content.
  Footer example shows last sync info: "Última sincronização — Hoje, 03:15 ·
  2.381 registros atualizados."
- **Data ingestion status modal** — title "Estado da Ingestão de Dados";
  intro "Pipeline de ingestão incremental com armazenamento persistente em
  PostgreSQL e processamento idempotente."; lists datasets (e.g.
  "Contratações (Lei 14.133)", "Resultados de Itens & Homologações", "Preços
  Praticados", "CATMAT / CATSER (Catálogo)") each with last update, record
  count, and health state ("OK" when healthy). A related "Estratégia de
  Resiliência" notice explains in plain language that Pregoeiros keeps
  showing already-synced data if Compras.gov is temporarily unavailable,
  avoiding infrastructure jargon for end users.

## Constraints

- Every screen must implement all six UI states (loading, empty, error,
  partial, stale, success) — not optional polish.
- Derived vs observed data must always be visually distinguishable; this is
  called "fundamental," not a nice-to-have.
- Application language is Brazilian Portuguese (`pt-BR`) throughout the
  product surface; the specification itself is written in English.

## Unknowns

- No stated behavior for how filters persist across sessions beyond the URL
  (e.g. no mention of saved views beyond Interests).

## Conflicts

None identified within this topic's sources.

## Provenance

- UI states discipline, freshness, terminology precision principle:
  `ai/raw/product-requirements-specification.md` §9, §11, §17, §30.
- SSR/route boundaries, health/freshness architecture:
  `ai/raw/architecture-specification.md` §20–24, §39, §51.
- Navigation IA, states, formatting, accessibility, responsive rules, content
  voice, terminology: `ai/raw/uiux-specification.md` §19–33, §100–139, §142, §145.
- Confirming interactive prototype: `ai/raw/pregoeiros.html`.

## Related Topics

[[KNOW-003]], [[KNOW-006]], [[KNOW-007]], [[KNOW-008]], [[KNOW-009]]
