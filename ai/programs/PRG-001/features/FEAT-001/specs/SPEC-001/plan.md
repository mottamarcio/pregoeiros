---
type: plan
for: SPEC-001
status: draft
---

# Implementation Plan

## Summary

Scaffold the SvelteKit 2 / Svelte 5 application at the repository root with
the official `sv` CLI (TypeScript, adapter-node, ESLint, Prettier, Vitest,
Playwright), then adapt the output to the agreed structure and toolchain:

- Node 24 LTS pin (D-42);
- two Vitest projects (`unit`, `integration`);
- Playwright on Chromium only (D-43);
- an automated negative build check proving that `$lib/server` cannot reach client code;
- a single GitHub Actions workflow that runs every gate on push/PR to `dev` and `main`.

No application behavior, database or styling is introduced here. Those are
SPEC-002 and SPEC-003.

## Repository Context

- The repository is greenfield for application code: it contains only `README.md`, `LICENSE`, `.gitignore` (Node template + `/misterspec`), `ai/` (misterspec artifacts), `.claude/` (skills) and `.misterspec/` (tool config; `cache/` currently untracked). No `package.json`, `src/` or CI exists.
- Local environment: Node **v24.14.0** and npm 11.9 via nvm; Node 22 is not installed. D-42 moved the project to Node 24, so no install is needed.
- Current registry versions (2026-09-25):
  - `@sveltejs/kit` 2.70.x, `svelte` 5.57.x, `@sveltejs/adapter-node` 5.5.x;
  - `vitest` 5.0.x, `@playwright/test` 1.63.x;
  - `eslint` 10.x, `eslint-plugin-svelte` 3.23.x, `prettier-plugin-svelte` 4.1.x;
  - `typescript` 7.0.x (see Risks);
  - `sv` CLI 0.17.x.
- The remote is GitHub (`mottamarcio/pregoeiros`), so GitHub Actions is available.

## Requirement Coverage

- **R1 → Project structure:**
  - `sv create` produces `src/`, `src/routes/`, `src/lib/` and `static/`;
  - add `src/lib/server/` (tracked with `.gitkeep`) and `tests/unit/`, `tests/integration/`, `tests/e2e/`, each with a smoke test;
  - no `src/controllers/` or `src/pages/` are created;
  - a unit test (`tests/unit/structure.test.ts`) asserts the required directories exist and the forbidden ones do not.
- **R2 → Runtime and package manager pinning:**
  - `package.json` sets `"engines": { "node": ">=24 <25" }`, and `.nvmrc` contains `24`; `engine-strict` is **not** enabled, so other versions warn rather than fail (per the Edge Case);
  - npm is the only package manager, and `package-lock.json` is committed;
  - `svelte.config.js` uses `@sveltejs/adapter-node`;
  - CI reads the version from `.nvmrc`.
- **R3 → TypeScript strict:**
  - `tsconfig.json` extends `./.svelte-kit/tsconfig.json` and sets `"strict": true` explicitly (plus `noUncheckedIndexedAccess`, see Assumptions);
  - `npm run check` = `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` and exits 0 with 0 errors.
- **R4 → Server-module privacy enforced at build:**
  - SvelteKit natively refuses `$lib/server` imports in the client graph; it is verified automatically by `scripts/verify-server-privacy.mjs` (`npm run check:privacy`);
  - the script creates a temporary probe module `src/lib/server/__privacy_probe__.ts` and, in turn, two fixture routes under `src/routes/__privacy_check__/`: (a) a `+page.svelte` with a **static** import of the probe; (b) a universal `+page.ts` with a **dynamic** `import('$lib/server/__privacy_probe__')`;
  - for each fixture it runs `vite build`, asserts a non-zero exit and SvelteKit's "Cannot import $lib/server/… into code that runs in the browser" message, and removes all temporary files in a `finally` block;
  - it exits non-zero if either fixture builds successfully;
  - leftovers are git-ignored as a safety net.
- **R5 → Lint and formatting:**
  - ESLint flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte` and `eslint-config-prettier`; Prettier with `prettier-plugin-svelte`;
  - `npm run lint` = `prettier --check . && eslint .`; `npm run format` = `prettier --write .`;
  - `.prettierignore` / ESLint ignores exclude `ai/`, `.claude/`, `.misterspec/`, `build/`, `.svelte-kit/` and `package-lock.json`, so misterspec artifacts are never reformatted.
- **R6 → Test runners:**
  - Vitest with two `projects` in `vite.config.ts`:
    - `unit`: `tests/unit/**/*.test.ts` + `src/**/*.test.ts`, node environment;
    - `integration`: `tests/integration/**/*.test.ts`, node environment, sequential.
  - Playwright (`playwright.config.ts`): `testDir: tests/e2e`, a single `chromium` project (D-43), `webServer` = `npm run build && npm run preview -- --port 4173`, `baseURL` `http://localhost:4173`;
  - smoke tests: `tests/unit/smoke.test.ts`, `tests/integration/smoke.test.ts` and `tests/e2e/smoke.test.ts` (the last titled in pt-BR Dado/Quando/Então, loads `/` and expects a successful response);
  - scripts: `test:unit` = `vitest run --project unit`; `test:integration` = `vitest run --project integration`; `test` = `vitest run`; `test:e2e` = `playwright test`.
- **R7 → Standard scripts:** `dev`, `build`, `preview`, `check`, `check:privacy`, `lint`, `format`, `test`, `test:unit`, `test:integration`, `test:e2e`. A minimal `src/routes/+page.svelte` placeholder exists so `build`/`preview`/e2e have a page; FEAT-004 later replaces it.
- **R8 → GitHub Actions CI:**
  - `.github/workflows/ci.yml`, triggered on `push` and `pull_request` for branches `dev` and `main`, with `permissions: contents: read` and `concurrency` cancelling superseded runs;
  - one job on `ubuntu-latest` with a `postgres:16-alpine` service (healthcheck `pg_isready`, `DATABASE_URL` exported for later Specs);
  - steps, in order:
    1. checkout;
    2. `actions/setup-node` with `node-version-file: .nvmrc` and npm cache;
    3. `npm ci`;
    4. `npm run lint`;
    5. `npm run check`;
    6. `npm run test:unit`;
    7. `npm run test:integration`;
    8. `npx playwright install --with-deps chromium`;
    9. `npm run test:e2e`;
    10. `npm run build`;
    11. `npm run check:privacy`.
  - any failing step fails the run.

## Architecture

No runtime architecture is introduced. The toolchain is layered as:

```
sv scaffold (SvelteKit 2 + Svelte 5 + TS + adapter-node)
  ├─ static checks: prettier → eslint → svelte-check
  ├─ tests: vitest[unit] · vitest[integration] · playwright[chromium]
  ├─ build: vite build (adapter-node)
  └─ guard: verify-server-privacy (negative builds)
CI (GitHub Actions) = the same npm scripts, in the same order
```

CI calls only npm scripts, never bespoke commands, so local and CI behavior stay identical.

## Components Affected

New files and directories (none modified except `.gitignore` and `README.md`):

- `package.json`, `package-lock.json`, `.nvmrc`, `.npmrc` (only if needed; no `engine-strict`)
- `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `playwright.config.ts`
- `src/app.html`, `src/app.d.ts`, `src/routes/+page.svelte` (placeholder), `src/lib/index.ts`, `src/lib/server/.gitkeep`
- `static/favicon.svg` (sv default, replaced later if needed)
- `tests/unit/smoke.test.ts`, `tests/unit/structure.test.ts`, `tests/integration/smoke.test.ts`, `tests/e2e/smoke.test.ts`
- `scripts/verify-server-privacy.mjs`
- `.github/workflows/ci.yml`
- `.gitignore`: merge sv entries (`.svelte-kit/`, `build/`, `test-results/`, `playwright-report/`), plus the privacy-probe paths as a safety net
- `README.md`: a short "Desenvolvimento" section (Node 24, npm scripts)

## Data Changes

None. The CI Postgres service is provisioned but unused until SPEC-002.

## API Changes

None.

## Integration Changes

- New CI integration with GitHub Actions (`.github/workflows/ci.yml`). It needs no repository secrets.
- No calls to Compras.gov.br or any external API from tests.

## Implementation Sequence

1. Run `npx sv create` in a temporary directory: minimal template, TypeScript, npm; add-ons eslint, prettier, vitest, playwright; adapter node. Copy the result into the repository root, keeping the existing `README.md`/`LICENSE` and merging `.gitignore`.
2. Pin Node 24 (`engines`, `.nvmrc`); run `npm install` to produce `package-lock.json`.
3. Set `strict` in `tsconfig.json`; confirm `npm run check` is clean.
4. Configure lint/format with ignores for `ai/`, `.claude/`, `.misterspec/`; run `npm run format` once; confirm `npm run lint` is clean.
5. Create the `tests/` tree; configure the Vitest `unit`/`integration` projects; add the unit, structure and integration smoke tests.
6. Configure Playwright (Chromium only, preview web server); add the pt-BR e2e smoke test; add the placeholder home page.
7. Write `scripts/verify-server-privacy.mjs` and the `check:privacy` script; confirm it passes (both fixtures fail to build) and leaves the tree clean (`git status`).
8. Add `.github/workflows/ci.yml`; validate the YAML locally (e.g. `actionlint` if available), then confirm a green run on push to `dev` (after the user authorizes the push).
9. Update `README.md` with the development commands.

## Test Strategy

| Requirement | Verification |
|---|---|
| R1 | `tests/unit/structure.test.ts` asserts the required dirs exist and the forbidden ones are absent |
| R2 | unit test reads `package.json`/`.nvmrc` (engines `>=24 <25`, `.nvmrc` = 24, adapter-node in `svelte.config.js`); CI `npm ci` fails without the lockfile |
| R3 | `npm run check` in CI (0 errors); unit test asserts `strict: true` in `tsconfig.json` |
| R4 | `npm run check:privacy` in CI: both negative builds must fail with SvelteKit's server-import error |
| R5 | `npm run lint` in CI |
| R6 | the three smoke tests run in their respective runners in CI |
| R7 | CI invokes each script; unit test asserts that the script names exist in `package.json` |
| R8 | the first push to `dev` produces a green run; a deliberate TS error on a throwaway branch makes the run red (manual one-time verification) |

## Risks

- **TypeScript 7.0 compatibility.** npm's latest TypeScript is 7.0.x (the native compiler). `svelte-check` / `svelte2tsx` and `typescript-eslint` may not support it yet. Mitigation: use the TypeScript version `sv create` pins, falling back to the latest 5.x/6.x that `svelte-check` supports, recorded exactly in `package.json`. R3 only requires strict mode and a clean check, not a specific major.
- **Scaffolding into a non-empty repository.** `sv create` targets empty directories. Mitigation: scaffold into a temp dir and copy, never overwriting `ai/`, `.claude/`, `.misterspec/`, `README.md` or `LICENSE`.
- **The privacy script mutates the working tree** while it runs. A concurrent `npm run dev` could pick up the fixtures, and an interrupted run could leave files behind. Mitigation: unique `__privacy_check__` names, cleanup in `finally` plus signal handlers, and git-ignore entries as a safety net; run it only in CI and on demand.
- **SvelteKit error text may change** between versions and break the message assertion. Mitigation: assert on a stable fragment ("$lib/server") plus the non-zero exit, not on the full sentence.
- **Vitest 5 / ESLint 10 major versions** may differ from `sv` add-on templates. Mitigation: accept `sv`'s pinned versions first and upgrade only with green gates.
- **Prettier over the whole repo** could rewrite misterspec Markdown. Mitigation: `.prettierignore` covers `ai/`, `.claude/`, `.misterspec/`.
- **CI minutes:** E2E runs a production build, and the privacy check runs two more builds. This is acceptable for v1; the Chromium-only choice (D-43) limits the cost.
- **Downstream dependency:** SPEC-002's Docker image must use `node:24-alpine` to stay consistent with D-42.

## Assumptions

- Tailwind CSS, fonts and `unplugin-icons` are added by SPEC-003, not here, to keep Spec boundaries clean. `sv create` is run without the Tailwind add-on.
- `noUncheckedIndexedAccess` is enabled in addition to `strict`. It is a low-cost safety default for an app parsing irregular upstream data, and it does not conflict with R3.
- The placeholder `src/routes/+page.svelte` is temporary; FEAT-004 replaces it with the triage queue.
- The CI Postgres service is declared now so that SPEC-002's integration tests need no workflow change.
- Verifying R8 requires pushing to GitHub, which happens only when the project owner authorizes it; until then, the workflow is validated statically.
- The negative-build approach for R4 and Chromium-only E2E were chosen by the project owner on 2026-09-25 (Chromium recorded as D-43).
