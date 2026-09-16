---
id: KNOW-007
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
  - path: ai/raw/uiux-specification.md
    fingerprint: sha256:b408cfa091b5c325182f3ecfdd59f7973fe7b8f8c6a5cc3dae6e7b2d305bbf54
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:45d65300ce5243505c8fc1b0330848f4a33ace6aced788b7221f8643e6cfc791
---

# KNOW-007

## Summary

"Acompanhar" consists of three tightly related but conceptually distinct
concepts: **Favoritos** (follow one specific entity), **Interesses**
(persisted matching rules that watch for new occurrences), and **Radar**
(the resulting event inbox). The product and UI specs are emphatic that this
three-way distinction must never blur.

## Known Facts

- **Favoritos** — route `/favoritos`. Supported entity types: procurement
  (contratação), product/service (catalog_item), supplier, contract. A
  Favorite means "quero acompanhar especificamente esta entidade" /
  "Acompanhe uma entidade específica." Favorite button toggles ☆ Favoritar →
  ★ Favorito. Conceptual schema: `favorites(id, user_id, entity_type,
  entity_id, created_at)`. The application service MUST validate that the
  referenced entity exists. Page aggregates all favorites with tabs
  Todos/Contratações/Produtos/Fornecedores/Contratos (PRD) or
  Todos/Produtos/Fornecedores/Contratações (UI/UX spec — Contratos tab not
  listed there). Row shows amber star, entity title, entity type badge, code,
  and a remove action (trash icon, tooltip "Remover favorito"). Empty states:
  category-level "Nenhum favorito encontrado nesta categoria."; global
  "Você ainda não adicionou favoritos." with supporting copy about
  favoriting to track changes.
- **Interesses** — route `/interesses`. An Interest is explicitly "uma regra
  de acompanhamento, não uma entidade" / "Acompanhe novas ocorrências que
  correspondam a uma regra." Creation fields: Nome (placeholder "Ex:
  Notebooks no RJ, Tomógrafos SP", helper "Rótulo que aparecerá no seu
  dashboard e nos alertas do Radar"), Produto/Serviço (CATMAT/CATSER
  selector), UF (optional, default "Brasil (Todas)"), Comprador (default
  "Todos os órgãos"). Conceptual persistence: `interest, interest_filters,
  interest_last_checked_at, interest_matches, interest_match_seen_at` (PRD)
  / `interests(id, user_id, name, enabled, created_at, updated_at,
  last_processed_at)` plus a filters representation (architecture spec) —
  this distinguishes "resultado conhecido" / "resultado novo" / "resultado
  já visualizado". Filter schema MUST be validated by application code;
  arbitrary user-provided SQL/query expressions are forbidden (constrained
  relational fields or constrained JSONB only — final representation is
  ADR-006, see [[KNOW-004]]). UI page title "Regras de Interesse"; subtitle
  "Regras automatizadas de acompanhamento que geram eventos no Radar";
  primary action "Criar Novo Interesse" opening a modal titled "Criar Regra
  de Interesse" (icon `lucide:bookmark-plus`, max-width 512px) with footer
  actions "Cancelar" / "Salvar Interesse". Interest cards show a "Regra
  Ativa" badge, name (e.g. "Notebooks · RJ"), Produto/UF/Comprador details,
  match activity count ("7 contratações novas"), and a "Ver resultados"
  action.
- **Radar** — route `/radar`. Explicitly "a caixa de entrada do Pregoeiros" /
  not a generic notification center — "It is the event stream produced by
  monitored entities and rules": Favorito + Interesse → mudança relevante →
  Radar. Radar events should identify why they appeared, e.g. "Corresponde
  ao interesse 'Notebooks · RJ'". Filters: Todos / Não vistos /
  Contratações / Resultados / Contratos (PRD) or Todos / Apenas não vistos /
  Contratações / Resultados (UI/UX spec). Users can mark events as seen,
  including a bulk "Marcar todos como vistos" action. Example event types
  (architecture spec): `interest_match, favorite_updated,
  procurement_result_published, contract_expiring`. Conceptual schema:
  `radar_events(id, user_id, event_type, entity_type, entity_id, interest_id
  nullable, favorite_id nullable, created_at, seen_at, metadata jsonb)` —
  `metadata` stores presentation-supporting info only; the UI always resolves
  canonical data from the actual entity tables, never trusts `metadata` as
  the source of truth. Unread event styling: slate-50/50 background,
  slate-300 border, subtle shadow, 8px emerald dot; read event: white
  background, slate-200 border, outlined slate dot. Empty states: filtered
  "Nenhum evento no Radar com o filtro selecionado."; brand-new account
  "Seu Radar ainda está vazio." + "Crie um Interesse ou adicione entidades
  aos Favoritos para acompanhar novidades." with primary action "Criar
  Interesse".
- **Interest matching pipeline** (architecture spec, ties Interesses to
  sync): sync procurements → new/changed entities → process interests →
  InterestMatch → RadarEvent. Must process only records changed since the
  last checkpoint, and matches must be idempotent (uniqueness on interest +
  entity + matching event) — see [[KNOW-005]].
- Deleting an Interest with accumulated matches warrants a confirmation
  dialog: title "Excluir regra de interesse?", body "O monitoramento será
  interrompido. Os eventos já registrados no Radar não serão removidos.",
  actions "Cancelar" / "Excluir Interesse" (destructive, red). Marking a
  Radar event seen, favoriting, and unfavoriting are reversible and require
  NO confirmation.

## Constraints

- Favorite behavior must never be mixed with Interest behavior — they are
  deliberately distinct concepts, and the UI (empty states, creation flows)
  must reinforce the distinction.
- Radar `metadata` is presentation-only; canonical entity data must always be
  resolved from entity tables, not trusted from the event payload.
- Interest filters must use a constrained/validated schema — never arbitrary
  user SQL.

## Unknowns

- ADR-006 (Interest filter representation: normalized relational vs
  constrained JSONB) remains open.
- Whether Favoritos includes a "Contratos" tab is inconsistent between PRD
  and UI/UX spec (see Conflicts).

## Conflicts

- PRD §13 lists Favoritos tabs as Todos/Contratações/Produtos/Fornecedores/
  Contratos; UI/UX spec §84 lists Todos/Produtos/Fornecedores/Contratações
  (no separate Contratos tab), even though both agree Contract is a
  supported favoritable entity type. This should be resolved during feature
  spec/design — likely the UI/UX spec's list is simply incomplete rather than
  an intentional scope cut, since Contract remains a listed favoritable
  entity type in both documents.

## Provenance

- Favoritos, Interesses, Radar product definitions and schemas: `ai/raw/product-requirements-specification.md` §13–15.
- Interests/Radar architecture, matching pipeline, schemas:
  `ai/raw/architecture-specification.md` §25–28.
- UI copy, empty states, confirmation flows, mental model:
  `ai/raw/uiux-specification.md` §80–90, §128–129, §132.
- Confirming interactive prototype: `ai/raw/pregoeiros.html` (state.favorites,
  state.radarEvents, `formCreateInterest`, `modalCreateInterest`,
  `radarEventFeed`, `favoritesList`, `interestsGrid`).

## Related Topics

[[KNOW-004]], [[KNOW-005]], [[KNOW-006]], [[KNOW-010]]
