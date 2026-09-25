---
type: tasks
for: SPEC-001
---

# Tasks

## TASK-001 — Scaffold the SvelteKit app and merge it into the repository

- [x] Done

Serves: SPEC-001:R1, SPEC-001:R7
Depends on: none
Scope: repository root — `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.d.ts`, `src/lib/index.ts`, `src/lib/server/.gitkeep`, `src/routes/`, `static/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`, `.gitignore`
Verify: `npm install && npm run build` exits 0; `ls src/lib/server tests/unit tests/integration tests/e2e static` succeeds; `test ! -e src/controllers && test ! -e src/pages`; `git status` shows `ai/`, `.claude/`, `.misterspec/`, `README.md`, `LICENSE` unmodified

Note: current SvelteKit (2.70) no longer generates a standalone `svelte.config.js` — the `sv add sveltekit-adapter=adapter:node` add-on wires the adapter directly into `vite.config.ts` via the `sveltekit({ adapter: adapter() })` plugin call, and `npm run build` prints "Using @sveltejs/adapter-node", confirming R2's intent ("The build uses `@sveltejs/adapter-node`") is met without that file existing. No `svelte.config.js` was created; `vite.config.ts` is the source of truth for adapter config from here on.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:35:58Z
Evidence-Command: bash -c "npm install && npm run build && ls src/lib/server tests/unit tests/integration tests/e2e static >/dev/null && test ! -e src/controllers && test ! -e src/pages"
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:e1cb354b31b5189eac62708a383bc240e1b4b4d55d76e1301b1fd7cc42039564
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-001-20260925T183606Z.log

Run `npx sv create` in a temporary directory (minimal template, TypeScript, npm; add-ons eslint, prettier, vitest, playwright; adapter node; **no** Tailwind — that belongs to SPEC-003). Copy the result to the repository root without overwriting `ai/`, `.claude/`, `.misterspec/`, `README.md` or `LICENSE`; merge the generated `.gitignore` entries (`.svelte-kit/`, `build/`, `test-results/`, `playwright-report/`) into the existing one. Create `src/lib/server/` (with `.gitkeep`) and the `tests/unit/`, `tests/integration/`, `tests/e2e/` folders. Requirement text: "No `src/controllers/` or `src/pages/` directory exists."

## TASK-002 — Pin Node 24 LTS, npm lockfile and adapter-node

- [x] Done

Serves: SPEC-001:R2
Depends on: TASK-001
Scope: `package.json` (`engines`), `.nvmrc`, `package-lock.json`, `.npmrc`
Verify: `node -p "require('./package.json').engines.node"` prints `>=24 <25`; `cat .nvmrc` prints `24`; `grep adapter-node vite.config.ts` matches (see TASK-001's note — adapter config lives in `vite.config.ts`, not `svelte.config.js`); `rm -rf node_modules && npm ci` exits 0; no `engine-strict=true` in any `.npmrc`

Constraint (quoted): "The project declares Node 24 LTS (`engines.node` `>=24 <25` in `package.json` and `.nvmrc` = `24`, D-42), uses npm, and commits `package-lock.json`. The build uses `@sveltejs/adapter-node`." Do not enable `engine-strict` — other Node versions must only warn (Edge Case). The sv-generated `.npmrc` shipped with `engine-strict=true`; it was removed so the file no longer exists.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:37:42Z
Evidence-Command: bash -c 'test "$(node -p "require(\"./package.json\").engines.node")" = ">=24 <25" && test "$(cat .nvmrc)" = "24" && grep -q adapter-node vite.config.ts && rm -rf node_modules && npm ci && ! find . -maxdepth 1 -iname ".npmrc" -exec grep -l engine-strict {} \; | grep -q .'
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:0de26faa711456a8a0d92ed93c535a3e24df149f2d6e125dab34f074b6d49eb7
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-002-20260925T183747Z.log

## TASK-003 — Enforce TypeScript strict mode and the `check` script

- [x] Done

Serves: SPEC-001:R3
Depends on: TASK-001
Scope: `tsconfig.json`, `package.json` (`check` script)
Verify: `npm run check` exits 0 and reports `0 errors`; `node -e "console.log(JSON.parse(require('fs').readFileSync('tsconfig.json','utf8')).compilerOptions.strict)"` prints `true`

Constraint (quoted): "`tsconfig.json` enables `strict: true`, and `npm run check` (`svelte-check`) exits with 0 errors on a clean checkout." Also enable `noUncheckedIndexedAccess` (Plan assumption). `check` = `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`. If the scaffolded TypeScript major is unsupported by `svelte-check`, pin the newest supported version (Plan risk).

`strict` and the `check` script already existed from `sv create`; this Task added `noUncheckedIndexedAccess`. `sv` pinned TypeScript `^6.0.3` (not the untested 7.0 native compiler), so `svelte-check` needed no version pin of its own.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:39:10Z
Evidence-Command: npm run check
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:0f07d757da97f937517196a7d7c0f7d3f6bb99ef37eef81a6c206c0252bf535f
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-003-20260925T183915Z.log

## TASK-004 — Configure ESLint + Prettier with misterspec paths ignored

- [x] Done

Serves: SPEC-001:R5
Depends on: TASK-001
Scope: `eslint.config.js`, `prettier.config.js`, `.prettierignore`, `package.json` (`lint`, `format` scripts)
Verify: `npm run format` then `npm run lint` exits 0; `git status` shows no change under `ai/`, `.claude/` or `.misterspec/` after `npm run format`

Flat ESLint config with `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`, `eslint-config-prettier`; Prettier with `prettier-plugin-svelte`. `lint` = `prettier --check . && eslint .`; `format` = `prettier --write .`. Ignore `ai/`, `.claude/`, `.misterspec/`, `build/`, `.svelte-kit/`, `package-lock.json` in both tools.

`sv create` already generated `eslint.config.js` (flat config, exactly this rule set), `prettier.config.js` (used in place of `.prettierrc` — same purpose, `prettier.config.js` is `sv`'s convention) and the `lint`/`format` scripts, and `.prettierignore` already excluded `package-lock.json`. `eslint.config.js`'s `includeIgnoreFile(gitignorePath)` only covers gitignored paths, and `ai/`, `.claude/`, `.misterspec/` are tracked in git (not gitignored), so this Task added an explicit `ignores: ['ai/**', '.claude/**', '.misterspec/**']` block to `eslint.config.js` and the same three paths to `.prettierignore`. Verified: `npm run format` touched only `README.md` (a harmless blank line after the heading); `ai/knowledge/KNOW-016-tech-stack.md`, `ai/programs/PRG-001/program.md` and `ai/raw/07-DECISOES.md` (md5-checked before/after) were untouched; `npm run lint` then passed clean.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:41:41Z
Evidence-Command: bash -c 'npm run format && npm run lint'
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:5cb009f4a33ac8a82a12acbeed0026fbfe4b601ecb285fe777b68b0ef2fedfa3
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-004-20260925T184147Z.log

## TASK-005 — Configure Vitest `unit` and `integration` projects with smoke tests

- [x] Done

Serves: SPEC-001:R6, SPEC-001:R7
Depends on: TASK-001
Scope: `vite.config.ts` (Vitest `projects`), `tests/unit/smoke.test.ts`, `tests/integration/smoke.test.ts`, `package.json` (`test`, `test:unit`, `test:integration` scripts)
Verify: `npm run test:unit` runs only the unit project and passes; `npm run test:integration` runs only the integration project and passes; `npm run test` runs both and passes

Projects: `unit` = `tests/unit/**/*.test.ts` + `src/**/*.test.ts` (node environment); `integration` = `tests/integration/**/*.test.ts` (node environment, sequential via `fileParallelism: false`, since it will share a test database starting with SPEC-002). Scripts: `test:unit` = `vitest run --project unit`, `test:integration` = `vitest run --project integration`, `test` = `vitest run`. Requirement text: "Each runner has at least one passing smoke test." The `tests/unit/.gitkeep` and `tests/integration/.gitkeep` placeholders from TASK-001 were removed now that real test files exist.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:43:43Z
Evidence-Command: npm run test
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:c4010de4905c8c92be20c0c2c1a0fa75d91c7b36600fa8c19151d0c5ee1f2a22
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-005-20260925T184345Z.log

## TASK-006 — Configure Playwright (Chromium only) with a placeholder page and pt-BR smoke test

- [x] Done

Serves: SPEC-001:R6, SPEC-001:R7
Depends on: TASK-001
Scope: `playwright.config.ts`, `src/routes/+page.svelte` (temporary placeholder), `tests/e2e/smoke.test.ts`, `package.json` (`test:e2e` script)
Verify: `npx playwright install chromium && npm run test:e2e` exits 0; the report lists only the `chromium` project; the smoke test title is pt-BR Dado/Quando/Então

Constraint (quoted): "`npm run test:e2e` runs Playwright over `tests/e2e`, with test titles in pt-BR Dado/Quando/Então (D-26d), on Chromium only (D-43)." Config: `testDir: 'tests/e2e'`, a single `chromium` project, `webServer` = `npm run build && npm run preview -- --port 4173`, `baseURL` `http://localhost:4173`. The placeholder home page is replaced by FEAT-004 later.

The `test:e2e` script was simplified to `playwright test` (browser install is a separate explicit step here and in CI's TASK-009, so it isn't re-downloaded on every run). The placeholder home page was written in pt-BR ("Pregoeiros" / "Fila de Triagem em construção.") rather than left as sv's English default, consistent with the pt-BR UI invariant even though it is temporary. Run output confirmed `1 passed` on `[chromium]` with the pt-BR Dado/Quando/Então title, and `playwright.config.ts` declares exactly one project (`chromium`).

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:50:53Z
Evidence-Command: npm run test:e2e
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:f9ec8924343ee87766f6356ef3e8fe8b9fe7f9f8fd1afd1c601c2049bef02b56
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-006-20260925T185102Z.log

## TASK-007 — Add the automated server-module privacy check

- [x] Done

Serves: SPEC-001:R4, SPEC-001:R7
Depends on: TASK-001
Scope: `scripts/verify-server-privacy.mjs`, `package.json` (`check:privacy` script), `.gitignore` (safety-net entries for `src/routes/__privacy_check__/` and `src/lib/server/__privacy_probe__.ts`)
Verify: `npm run check:privacy` exits 0, reporting that both fixtures (static import in `+page.svelte`, dynamic import in universal `+page.ts`) failed to build with an error mentioning `$lib/server`; afterwards `git status --porcelain` is empty; temporarily breaking the guard (e.g. importing a non-server module in the fixture) makes the script exit non-zero

Constraint (quoted): "Importing any module under `src/lib/server/` (alias `$lib/server`) from client-reachable code — a `.svelte` component or a universal `+page.ts`/`+layout.ts` — makes `npm run build` fail." Edge case (quoted): "A dynamic `import('$lib/server/…')` in client code must also fail the build, not only static imports." Create probe/fixtures, run `vite build` per fixture, assert non-zero exit + a message containing `$lib/server`, and always clean up in `finally` (and on SIGINT/SIGTERM).

`scripts/verify-server-privacy.mjs` writes `src/lib/server/__privacy_probe__.ts` plus, one at a time, a static-import fixture (`src/routes/__privacy_check__/static-import/+page.svelte`) and a dynamic-import fixture (`src/routes/__privacy_check__/dynamic-import/+page.ts`); runs `vite build --outDir <tmp dir> --logLevel warn` for each; asserts the build fails and the combined stdout+stderr mentions `$lib/server`; and removes every temporary file in a `finally` plus `SIGINT`/`SIGTERM` handlers. Verified: `npm run check:privacy` passed for both fixtures; `git status --porcelain` before vs. after the run was byte-for-byte identical (diff empty); a manually patched copy of the script pointing the probe at a plain `$lib/` path (not `$lib/server/`) correctly reported `FAILED` with "built successfully — $lib/server leaked" for both fixtures, confirming the script itself detects a broken guard rather than passing silently — the original script was restored (`diff` confirmed byte-identical) and re-verified passing afterward.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:53:41Z
Evidence-Command: npm run check:privacy
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:2655580484ecd378d9e58d8a485712f7a26c5702d888d05794914f1b8b7e24c1
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-007-20260925T185347Z.log

## TASK-008 — Add configuration/structure conformance unit tests

- [x] Done

Serves: SPEC-001:R1, SPEC-001:R2, SPEC-001:R3, SPEC-001:R7
Depends on: TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007
Scope: `tests/unit/structure.test.ts`, `tests/unit/project-config.test.ts`
Verify: `npm run test:unit` passes; deleting `tests/e2e/`, changing `.nvmrc` to `22`, setting `strict: false`, or removing the `check:privacy` script each makes the relevant test fail (spot-check locally, then revert)

Assert:

- the required dirs exist (`src/lib`, `src/lib/server`, `src/routes`, `static`, `tests/unit`, `tests/integration`, `tests/e2e`), and `src/controllers`/`src/pages` do not;
- `engines.node` is `>=24 <25` and `.nvmrc` is `24`;
- `svelte.config.js` uses `@sveltejs/adapter-node`;
- `tsconfig.json` has `strict: true`;
- `package.json` defines `dev`, `build`, `preview`, `check`, `check:privacy`, `lint`, `format`, `test`, `test:unit`, `test:integration`, `test:e2e`.

As with TASK-002/003, the `svelte.config.js` check reads `vite.config.ts` instead (adapter config lives there in this SvelteKit version — see TASK-001's note); `tsconfig.json` is parsed with `//` comments stripped, since it's JSONC, not plain JSON. All 25 assertions (2 test files plus the smoke test, 3 files total) pass. Each of the four spot-checks named in Verify was performed manually — moving `tests/e2e` aside, setting `.nvmrc` to `22`, setting `strict: false`, and deleting the `check:privacy` script — and each failed exactly the expected assertion; every file was restored and diffed byte-identical to its backup before re-confirming a clean `npm run test:unit` run.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T18:55:50Z
Evidence-Command: npm run test:unit
Evidence-GitRevision: 20214a7
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:7202e2e94f76be4be4c2b0735a3947470f7bf1f4fe2846dd72a9b65420f1f7a5
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-008-20260925T185552Z.log

## TASK-009 — Add the GitHub Actions CI workflow

- [x] Done

Serves: SPEC-001:R8
Depends on: TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
Scope: `.github/workflows/ci.yml`
Verify: the YAML parses and passes `actionlint` (if available; otherwise `npx --yes yaml-lint`-style parse check); running the listed npm scripts locally in the same order all exit 0; after the project owner authorizes a push to `dev`, the workflow run is green; a throwaway branch with a TypeScript error produces a red run at the `check` step (one-time manual verification)

Constraint (quoted): "A workflow under `.github/workflows/` triggers on push and pull request to `dev` and `main`, and runs: `npm ci`; lint; check; unit tests; integration tests, against a PostgreSQL 16 service container; E2E tests; build. The run fails if any step fails."

- The job runs on `ubuntu-latest` with a `postgres:16-alpine` service (healthcheck `pg_isready`, `DATABASE_URL` exported).
- Use `actions/setup-node` with `node-version-file: .nvmrc` and the npm cache.
- Steps in order:
  1. checkout;
  2. `npm ci`;
  3. `npm run lint`;
  4. `npm run check`;
  5. `npm run test:unit`;
  6. `npm run test:integration`;
  7. `npx playwright install --with-deps chromium`;
  8. `npm run test:e2e`;
  9. `npm run build`;
  10. `npm run check:privacy`.
- Set `permissions: contents: read` and a `concurrency` group that cancels superseded runs. No repository secrets.

The `'on':` key is written quoted, since unquoted `on:` parses as the boolean `true` under YAML 1.1 (PyYAML confirmed this both ways: unquoted top-level keys were `['name', True, ...]`; quoted, `['name', 'on', ...]`) — GitHub's own workflow parser special-cases the unquoted form correctly, but the quoted form removes the ambiguity outright. `actionlint` was not available in this environment, so verification fell back to a PyYAML parse (confirms syntactic validity and lists all 12 step names) plus a step-by-step local run of the exact CI sequence — `npm ci` (from a clean `node_modules` removal), `lint`, `check`, `test:unit`, `test:integration`, `test:e2e` (Chromium already installed from TASK-006), `build`, `check:privacy` — every step exited 0 in that order. A `DATABASE_URL` for the `postgres` service is exported at job level so SPEC-002's integration tests need no workflow change. The project owner authorized pushing and verifying live: after this commit was pushed to `dev`, run https://github.com/mottamarcio/pregoeiros/actions/runs/36177050276 went green — all 9 script steps (`npm ci` implicitly via Install dependencies, lint, check, unit, integration, Chromium install, e2e, build, check:privacy) succeeded. A throwaway branch (`ci-red-check-throwaway`) added one line with a deliberate type error (`export const deliberateTypeError: number = 'this is a string, not a number';`) to `src/lib/index.ts`; opened as PR #1 into `dev` (a plain branch push wouldn't trigger this workflow, which only listens on `dev`/`main`); run https://github.com/mottamarcio/pregoeiros/actions/runs/36177244710 failed exactly at the "Type check" step, with every later step correctly skipped. The PR was closed and the throwaway branch deleted (locally and on GitHub, remote-tracking ref pruned) immediately after.

Evidence-Result: pass
Evidence-Origin: declared
Evidence-By: mister-implement (GitHub Actions run 36177050276 green; run 36177244710 red at Type check, per project-owner-authorized push/PR)
Evidence-CapturedAt: 2026-09-25T19:04:50Z
Evidence-GitRevision: 37ae1ed
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:43778b7b2b94982b89025639909e763aafa90e5581b33d8ee304a45ce0816c1d

## TASK-010 — Document the development workflow in the README

- [x] Done

Serves: SPEC-001:R2, SPEC-001:R7
Depends on: TASK-009
Scope: `README.md`
Verify: `README.md` contains a "Desenvolvimento" section listing Node 24 (`nvm use`), `npm ci`, and every script from R7 with a one-line pt-BR description; the commands listed match `package.json` (checked by reading both)

Keep the existing project description; append the section in pt-BR.

Added a "Desenvolvimento" section (pt-BR) with the Node 24/`.nvmrc` prerequisite, `npm ci`, and a table of every script with a one-line description — the 10 required by R7 (`dev`, `build`, `preview`, `check`, `lint`, `format`, `test`, `test:unit`, `test:integration`, `test:e2e`) plus `check:privacy` (R4) and `check:watch` (a `check` variant) for completeness; the npm lifecycle `prepare` script is intentionally omitted (not user-invoked, not part of R7). Verified programmatically that all 10 R7 script names appear in the README, plus "Node 24" and "npm ci"; `npm run lint`, `npm run check` and `npm run test:unit` (25 tests) all still pass.

Evidence-Result: pass
Evidence-Origin: automated
Evidence-By: mister-implement
Evidence-CapturedAt: 2026-09-25T19:06:48Z
Evidence-Command: bash -c 'npm run lint && npm run check && npm run test:unit'
Evidence-GitRevision: 37ae1ed
Evidence-WorkingTree: dirty
Evidence-Fingerprint: sha256:feaa0e839bfc45e77687cb77d3b3437832bec79a258c7c7e7668f95a30e5f8f1
Evidence-Log: ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/evidence/TASK-010-20260925T190701Z.log
