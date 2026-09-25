---
id: SPEC-001
type: spec
status: draft
parent: FEAT-001
depends_on: []
supersedes: []
---

# SPEC-001 — Project Scaffold, Toolchain and Quality Gates

## Intent

Establish the SvelteKit 2 / Svelte 5 project skeleton, its toolchain and the
automated quality gates (type checking, lint, tests, build, server-module
privacy) that run locally and on every push/PR in GitHub Actions. Every other
Spec builds on this.

## Requirements

### R1 — Project structure

The repository contains a SvelteKit 2 app with Svelte 5 whose layout follows the agreed conventions:

- `src/lib/` (shared code) and `src/lib/server/` (server-only code);
- `src/routes/`;
- `static/`;
- `tests/unit/`, `tests/integration/` and `tests/e2e/`.

No `src/controllers/` or `src/pages/` directory exists.

### R2 — Runtime and package manager pinning

The project declares Node 24 LTS (`engines.node` `>=24 <25` in `package.json` and `.nvmrc` = `24`, D-42), uses npm, and commits `package-lock.json`. The build uses `@sveltejs/adapter-node`.

### R3 — TypeScript strict

`tsconfig.json` enables `strict: true`, and `npm run check` (`svelte-check`) exits with 0 errors on a clean checkout.

### R4 — Server-module privacy is enforced at build time

Importing any module under `src/lib/server/` (alias `$lib/server`) from client-reachable code — a `.svelte` component or a universal `+page.ts`/`+layout.ts` — makes `npm run build` fail.

### R5 — Lint and formatting

`npm run lint` (ESLint with the Svelte and TypeScript plugins, plus a Prettier check) exits 0 on a clean checkout, and `npm run format` rewrites files to the Prettier style. *Assumption: ESLint + Prettier as scaffolded by `sv create`; the sources name no linter.*

### R6 — Test runners

- `npm run test:unit` runs Vitest over `tests/unit` and colocated `*.test.ts`.
- `npm run test:integration` runs Vitest over `tests/integration`.
- `npm run test:e2e` runs Playwright over `tests/e2e`, with test titles in pt-BR Dado/Quando/Então (D-26d), on Chromium only (D-43).
- Each runner has at least one passing smoke test.
- `npm run test` runs unit and integration tests.

### R7 — Standard scripts

`package.json` exposes at least `dev`, `build`, `preview`, `check`, `lint`, `format`, `test`, `test:unit`, `test:integration` and `test:e2e`. Each exits 0 on a clean checkout, except `dev`/`preview`, which start a server.

### R8 — Continuous integration on GitHub Actions

A workflow under `.github/workflows/` triggers on push and pull request to `dev` and `main`, and runs:

1. `npm ci`;
2. lint;
3. check;
4. unit tests;
5. integration tests, against a PostgreSQL 16 service container;
6. E2E tests;
7. build.

The run fails if any step fails.

## Acceptance Scenarios

- **Given** a clean clone on Node 24, **when** `npm ci && npm run lint && npm run check && npm run test && npm run build` is executed, **then** every command exits 0.
- **Given** a `.svelte` component that imports `$lib/server/env`, **when** `npm run build` runs, **then** the build fails with SvelteKit's server-only import error.
- **Given** a push to `dev`, **when** the CI workflow runs, **then** the lint, check, unit, integration, e2e and build jobs execute and the run is green.
- **Given** a pull request introducing a TypeScript error, **when** CI runs, **then** the `check` step fails and the run is red.
- **Given** the E2E smoke test, **when** `npm run test:e2e` runs, **then** Playwright starts the app and the smoke test passes.

## Edge Cases

- A dynamic `import('$lib/server/…')` in client code must also fail the build, not only static imports.
- Running with a Node version other than 24 must emit the npm `engines` warning; CI must use Node 24 explicitly.
- CI must not require secrets to pass (the public government API is never called by tests; see FEAT-003 test strategy).

## Constraints

- Constitution: SOLID/DRY/KISS/YAGNI; TDD/BDD; server-only modules never reachable from the client.
- Decisions D-26a–D-26d (Tailwind v4, Drizzle, unplugin-icons, plain Playwright), D-22 (migrations folder, created in SPEC-002).
- Code, files and identifiers in English; UI copy in pt-BR.

## Non-Goals

- Visual design, layout and components (SPEC-003).
- Database, Docker and environment configuration (SPEC-002).
- Deployment pipelines and production hosting (FEAT-001 open question).

## Unresolved Questions

- None.

## Sources

- [[KNOW-015]] structure, module privacy, `svelte-check` in CI
- [[KNOW-016]] stack and tooling
- [[KNOW-028]] test layers and folders
- `ai/raw/06-DECISOES.md` D-22, D-26
- `ai/raw/07-DECISOES.md` D-42 (Node 24 LTS), D-43 (Chromium-only E2E)
- Project owner decision (2026-09-25): CI on GitHub Actions
