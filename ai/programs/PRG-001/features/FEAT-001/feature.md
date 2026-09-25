---
id: FEAT-001
type: feature
status: draft
parent: PRG-001
---

# FEAT-001 — Foundation and App Shell

## Capability

A runnable SvelteKit 2 / Svelte 5 application with its project structure,
database baseline, tooling and the PoC-parity app shell (header, grouped
sidebar, modal/toast primitives, global keyboard shortcuts). Every other
Feature plugs into this foundation.

## User Value

Gives every user the familiar PoC navigation and look in a real, deployable
application. Gives the team a consistent, tested base (structure, schema
migrations, dev seed, CI checks), so capability Features can be delivered
independently.

## Scope

- Project scaffolding per the agreed structure:
  - `src/lib`, `src/lib/server`, routes, `tests/{unit,integration,e2e}`;
  - TypeScript strict, Tailwind v4 with the slate `brand` tokens and Inter / JetBrains Mono;
  - `unplugin-icons` + Lucide.
- Docker Compose with `web` + `db` (PostgreSQL 16): the production build runs on port 3000; local `vite dev` runs on 5173 against `db`.
- Drizzle setup: `db/client.ts`, `db/schema.ts`, `db/migrations/`. The initial migration creates the extensions (`pgcrypto`, `pg_trgm`) and the enums.
- Shared utilities: pt-BR money/date formatting (`money.ts`), environment loading (`$lib/server/env.ts`) with the `PUBLIC_` rule.
- App shell:
  - root `+layout.svelte` with header (brand, global search slot, last-collection slot, radar badge slot) and the grouped sidebar with counters, fed by `+layout.server.ts`;
  - mobile sidebar with backdrop;
  - toast, modal shell, `+error.svelte`.
- Global keyboard handling: ⌘K / Ctrl+K and `/` focus search; Escape closes modals and dropdowns. Icon-only buttons carry accessible labels.
- Mandatory source citation ("Compras.gov.br — federal e adesões (Lei 14.133/21)") in the shell.
- Dev seed reproducing the PoC dataset with the D-08 / D-15 / D-40 corrections. The production seed creates only the tenant, the admin user and the initial monitored products.
- Quality gates: Vitest and Playwright configured; CI runs `svelte-check`, lint and tests; a build fails if `$lib/server` is imported by client code.

## Non-Goals

- Any feature page content (queue, radar, prices, …) — owned by FEAT-004…FEAT-010.
- Authentication and users (FEAT-002).
- Data collection (FEAT-003).
- Production hosting, TLS and backups beyond the Compose definition (open question).

## Constraints

- Constitution: server-only secrets and modules, pt-BR UI, accessibility (keyboard + labelled icons), SOLID/DRY/KISS/YAGNI, TDD/BDD.
- Decisions D-01, D-22, D-26a–c, D-27, D-28, D-40, D-41.
- One `+layout.svelte` for the whole app; no per-view layout duplication. Server data reaches the UI through `load`, never duplicated into global stores.

## Relevant Knowledge

- [[KNOW-015]] project structure and conventions
- [[KNOW-016]] tech stack
- [[KNOW-017]] UI design system and accessibility
- [[KNOW-018]] deployment and configuration
- [[KNOW-024]] data model conventions
- [[KNOW-030]] PoC reference and seed data
- [[KNOW-003]] source citation

## Open Questions

- Production hosting target, TLS / reverse proxy, PostgreSQL backup/restore. ([[KNOW-018]])
- Placement and format of the mandatory source citation (footer, header, per view). ([[KNOW-003]])
- Dark mode, responsive breakpoints, WCAG target level. ([[KNOW-017]])
- CI provider and pipeline stages. ([[KNOW-028]])
- Whether the dev seed includes the PoC's requirements, historical bids and chart points. ([[KNOW-030]])
