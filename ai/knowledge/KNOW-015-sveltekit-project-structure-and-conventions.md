---
id: KNOW-015
type: knowledge
status: active
sources:
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-015 — SvelteKit Project Structure and Coding Conventions

## Summary

The target folder layout (SvelteKit 2 conventions), what goes where, what is
forbidden, and the Svelte 5 / SvelteKit / naming conventions code must follow.

## Known Facts

- **Folder conventions:** everything reusable in `src/lib`; secrets and I/O in `src/lib/server` (alias `$lib/server` blocked on the client); routes describe URLs, not fat controllers; single-route components may be colocated next to `+page.svelte`; layout components (header, sidebar, modal shell) in `$lib/components`; Svelte 5 runes on the client, `load` and actions on the server.
- **Target tree (abridged):**
  - Root: `docs/` (the five spec docs), `docker-compose.yml`, `Dockerfile`, `.env.example`, `package.json`, `svelte.config.js`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `playwright.config.ts`, `vitest.config.ts`, `static/favicon.svg`, `tests/{unit,integration,e2e}`.
  - `src/`: `app.html`, `app.css`, `app.d.ts`, `hooks.server.ts`, `hooks.client.ts`, optional `instrumentations.server.ts`, `params/uasg.ts` (matcher if needed).
  - `src/lib/components/`: `layout/{AppHeader,AppSidebar,MobileBackdrop}.svelte`, `ui/` (buttons, badges, toast, kbd), `search/GlobalSearch.svelte`, `triage/{TriageQueue,DecisionBanner}.svelte`, `procurement/ProcurementDetailModal.svelte`, `charts/PriceTrendSvg.svelte`.
  - `src/lib/`: `icons.ts` (Iconify wrappers), `types/{domain,api}.ts`, `utils/{money,normalize-search,exclusion-query,urgency}.ts`.
  - `src/lib/server/`: `env.ts`; `db/{client,schema,migrate}.ts` + `db/migrations/` (D-22); `repositories/{procurement,item,supplier,contract,alert,favorite,radar,catalog,sync}-repository.ts`; `services/{triage-service,alert-matcher,price-stats,search-service,export-service}.ts`; `integrations/compras-gov/{client,types,mappers,endpoints}.ts`; `jobs/{scheduler,sync-contratacoes,sync-resultados,sync-contratos,sync-catalogo,heartbeat}.ts`.
  - `src/routes/`: `+layout.svelte` (shell), `+layout.server.ts` (sidebar counters), `+error.svelte`, `+page.svelte`/`+page.server.ts` (triage queue), and `oportunidades/`, `produtos/`, `precos/` (server-only redirect → `/produtos`), `fornecedores/`, `contratos/`, `radar/`, `alertas/`, `salvos/`, `historico/`, `editais/[id]/` (full-page sheet), `api/{search,sync,sources,health}/+server.ts` and `api/export/[entity].[format]/+server.ts` (`sources` added by D-23; export route shape by D-34).
- **Rationale:** SvelteKit docs place server code in `src/lib/server` and block client import; flat routes mirror PoC navigation; `+page.server.ts` loads data, components don't run SQL; jobs live outside `routes/` because they are not HTTP; root `tests/` follows `sv create` + Playwright.
- **Do NOT:** create `src/controllers` or Next-style `src/pages`; import `$lib/server/*` in `.svelte` outside `+page.server`/`+server`; put the Compras.gov.br client in `src/lib`; use global stores for server data that already comes from `load`; duplicate layout per view (one `+layout.svelte` with sidebar).
- **Svelte 5 rules:** `$props()` instead of `export let`; `$state`/`$derived` on the client, server data via `data`; decision events via **form actions** (progressive enhancement) + `enhance`; modals controlled by query (`?edital=`) or local UI store — prefer query for deep-linking; Svelte 5 snippets for repeated table rows.
- **Load vs Action vs API:** render page with data → `+page.server.ts` `load`; mutations (GO/NO-GO, create alert, mark seen) → `actions` in `+page.server.ts`; global search / export / health / sync trigger → `src/routes/api/**/+server.ts`; chrome data (sidebar badges) → `+layout.server.ts`.
- **Module privacy:** any `src/lib/server` file imported on the client must fail the build; CI runs `svelte-check`.
- **Code conventions:** functions and files in English, UI copy in pt-BR; dates persisted as `timestamptz` and displayed pt-BR (`28/09/2026 às 10:00`); money `numeric(18,2)` + `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`; internal IDs UUID, official IDs in their own columns, never mixed; comments only where upstream is ambiguous (field typos, 365-day contract window). SQL uses `snake_case`, TypeScript uses camelCase.
- Drizzle is the data-access layer (D-26b), so `db/schema.ts` is the canonical schema and migrations are generated into `db/migrations/`.

## Constraints

- `$lib/server` must never be reachable from client code.
- No global stores duplicating `load` data.

## Unknowns

- None remaining (data-access choice resolved by D-26b).

## Conflicts

- None remaining. Migrations folder resolved by D-22; missing `/api/sources` route resolved by D-23.

## Provenance

- Conventions, tree, rationale, do-nots: `ai/raw/02-ARCHITECTURAL_SPECS.md` §4, §4.1, §4.2, §8.
- Svelte 5 rules, load/action/API table, module privacy, code conventions: `ai/raw/03-TECHNICAL_SPECS.md` §2, §3.1, §3.3, §15.
- SQL naming and migrations: `ai/raw/05-DATA_MODEL_SPECS.md` §1, §13.
- Decisions D-22, D-23, D-26b, D-34: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-014]] architecture layers
- [[KNOW-016]] tech stack
- [[KNOW-022]] internal API and form actions
