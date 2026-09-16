---
id: KNOW-006
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/uiux-specification.md
    fingerprint: sha256:b408cfa091b5c325182f3ecfdd59f7973fe7b8f8c6a5cc3dae6e7b2d305bbf54
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:45d65300ce5243505c8fc1b0330848f4a33ace6aced788b7221f8643e6cfc791
---

# KNOW-006

## Summary

"Explorar" covers the read/search surfaces of Pregoeiros: Produtos e
Serviços (CATMAT/CATSER), Contratações, Fornecedores, and Contratos. Each has
a listing route and a detail route/modal, consistent filter patterns, and
strict rules about presenting only effectively observed data.

## Known Facts

- **Produtos/Serviços** — routes `/produtos`, `/produtos/[id]`. CATMAT
  (materials) and CATSER (services) appear under one unified interface, with
  a type filter (Todos/Materiais/Serviços). Product detail page has tabs
  Visão geral | Preços | Contratações | Fornecedores, and shows a price
  history chart with mediana/mínimo/máximo/observações. Page title pattern:
  "Produtos e Serviços (CATMAT / CATSER)"; subtitle: "Catálogo padronizado,
  preços praticados e análise estatística de compras governamentais"; source
  badge "Fonte: API Compras.gov + Derivações". Product cards show CATMAT/
  CATSER code, type, description, and median price; actions "Favoritar" and
  "Criar Interesse" (opens Interest modal pre-populated with the product).
- **Contratações** — routes `/contratacoes`, `/contratacoes/[id]`. Title
  "Contratações"; subtitle "Editais, dispensas e pregões sob a Lei nº
  14.133/2021". List filters: UF, Modalidade, Período, Situação, plus a free
  text search over objeto ("Ex: notebooks, limpeza, licença..."). Table
  columns: Objeto e Processo, Comprador/Órgão, UF, Modalidade, Valor
  Estimado, Situação, Ação ("Ver Detalhes"). UASG and process number render
  as tertiary monospace metadata under the object title. Detail view (large
  modal, max-width ≈768px, max-height 90vh, independently scrolling body)
  shows Órgão, UASG, Processo, Situação, a Favoritar action, and tabs Itens e
  Lotes | Resultados Homologados | Histórico de Alterações. The underlying
  Compras.gov API module covers procurement, item, and item-result queries
  under Lei 14.133/2021.
- **Fornecedores** — routes `/fornecedores`, `/fornecedores/[id]`. Title
  "Fornecedores"; subtitle "Empresas com resultados homologados observáveis
  nos dados abertos do Compras.gov.br"; search placeholder "Filtrar por Razão
  Social ou CNPJ...". Detail page tabs: Visão geral | Resultados | Produtos |
  Compradores | Histórico, showing resultados observados, valor observado,
  produtos, compradores, and a top-products table. A prominent amber
  terminology notice must appear: "Sobre esta métrica: os valores exibidos
  refletem resultados homologados observáveis na base importada pelo
  Pregoeiros e podem não representar a totalidade das contratações
  públicas." Supplier cards show company name, CNPJ, favorite action,
  observed results ("Resultados observados"), observed awarded value ("Valor
  adjudicado observado"), primary supply category ("Principal
  fornecimento"), and distinct-buyer count — counts must never be presented
  as an absolute measure of all government procurement activity.
- **Contratos** — routes `/contratos`, `/contratos/[id]`. The Compras.gov API
  exposes contract, detail, item, and end-of-term (vigência) queries, enabling
  an "expiring contracts" view with buckets at 30/60/90 days. Recommended
  title "Contratos & Próximos Vencimentos"; recommended subtitle
  "Acompanhamento de vigências contratuais e identificação de contratos
  próximos do encerramento." Table columns: Contrato/Número, Órgão
  Contratante, Fornecedor, Fim de Vigência, Valor Total, Status de Alerta.
  KPI severity mapping: 30 days = red ("Vencimento em 30 dias"), 60 days =
  amber ("Vencimento em 60 dias"), 90 days = slate/neutral ("Vencimento em 90
  dias"). This feature may later feed Interesses/Radar (PRD §16).
- Rigorous terminology rule applies across Explore: a supplier's presence in
  a process does not mean it won; rankings/labels must reflect effectively
  observable results, not assumed wins (see [[KNOW-010]]).
- A working interactive HTML prototype (`ai/raw/pregoeiros.html`) implements
  client-side mock versions of all four Explore views (dashboard,
  contratacoes, produtos, fornecedores, contratos) plus filtering logic,
  confirming the same field/column names and view IDs as the UI/UX spec (no
  new facts beyond confirming feasibility of the interaction model with mock
  data).

## Constraints

- Do not imply a global search already covers all entity types if it
  currently only redirects to procurement search — the placeholder text
  must evolve with actual capability (see [[KNOW-010]]).
- Avoid stating that an expiring contract necessarily predicts a new
  procurement — expiration is an observable fact, future procurement is not
  guaranteed.
- CATMAT/CATSER and other identifiers must not be truncated unless
  necessary; if truncated visually, the full value must remain available via
  tooltip/copy.

## Unknowns

- No explicit pagination page-size default is stated per-page beyond the
  general 20–50 records/page guidance (see [[KNOW-004]], [[KNOW-010]]).
- ARPs (price registries) are mentioned as an upstream API module and as a
  v0.2 roadmap item but have no dedicated route/page spec yet.

## Conflicts

None identified between PRD, UI/UX spec, and the HTML prototype for Explore
features — the prototype is a visual/interactive confirmation of the same
spec, not an independent source of new requirements.

## Provenance

- Routes, filters, page structure: `ai/raw/product-requirements-specification.md` §8, §10, §11, §16.
- Copy, labels, badges, terminology notices, layout details: `ai/raw/uiux-specification.md` §61–79.
- Confirming interactive prototype: `ai/raw/pregoeiros.html` (view containers
  `view-contratacoes`, `view-produtos`, `view-fornecedores`, `view-contratos`
  and associated render/filter functions).

## Related Topics

[[KNOW-001]], [[KNOW-004]], [[KNOW-007]], [[KNOW-008]], [[KNOW-010]]
