---
type: plan
for: SPEC-001
status: draft
---

# Implementation Plan

## Summary

The repository currently contains no application code — only raw specs,
the `ai/` planning tree, and the `misterspec` binary. This Plan therefore
covers both bootstrapping the SvelteKit/TypeScript/Tailwind project itself
and implementing SPEC-001's design tokens and initial shared component
library on top of it, since the tokens/components cannot exist without a
project to hold them. Tokens are expressed as Tailwind theme configuration
plus a small set of CSS custom properties for the handful of values Tailwind
utilities alone don't cleanly express (e.g. semantic radius/shadow names).
Components are plain Svelte 5 components under `src/lib/components/ui/`,
styled entirely with Tailwind utility classes driven by those tokens — no
CSS-in-JS, no separate theming engine.

## Repository Context

- Confirmed via direct inspection (`internal context` could not run — see
  Risks) that the repository root contains no `package.json`, no `src/`,
  no `svelte.config.js`, and no Tailwind configuration. `ai/`, `.claude/`,
  `.misterspec/`, `misterspec`, `LICENSE`, `README.md`, `.gitignore` are the
  only entries.
- There is therefore no existing component, token, or styling convention to
  reconcile with — this Plan establishes the first ones.
- SPEC-001 has no `depends_on` and is a valid starting point for
  implementation ordering within FEAT-001, but in practice it produces the
  project scaffold that SPEC-002 (Docker), SPEC-003 (migrations), SPEC-004
  (app shell), and SPEC-005 (health check) will all assume exists.

## Requirement Coverage

- **R1 (color tokens match documented palette)** → Tailwind's built-in
  `slate` palette already matches KNOW-009's documented hex values
  (`slate-900: #0f172a`, etc.), so no custom color scale is needed for
  slate. Semantic tokens (success/info/warning/danger) map directly to
  Tailwind's `emerald`/`blue`/`amber`/`red` scales — used directly, not
  aliased, since Tailwind's own names are already the semantic names used
  in Knowledge. A small set of purpose-named CSS custom properties
  (`--color-bg`, `--color-surface`, `--color-border`, `--color-text`,
  `--color-text-strong`, `--color-text-muted`, `--color-text-tertiary`,
  `--color-accent`, `--color-accent-hover`) is defined in `src/app.css`
  per KNOW-009 §140, for the few places (e.g. focus rings, selection color)
  where a token name is clearer than a raw utility. Components consume
  Tailwind utility classes (`bg-slate-900`, `text-slate-600`, etc.)
  directly for everything else, per KNOW-009's own guidance not to
  duplicate Tailwind with dozens of tokens.
- **R2 (typography matches type scale)** → `tailwind.config` extends
  `fontFamily` with `sans: ['Inter', ...]` and `mono: ['"JetBrains Mono"',
  ...]`, and extends `fontSize` with the documented steps not already
  covered by Tailwind defaults (`2xs: 10px` for microcopy, an explicit
  `11px` step for metadata). Inter and JetBrains Mono are self-hosted
  (bundled as static font files, not a runtime Google Fonts request) to
  keep the app fully functional offline/self-hosted, consistent with the
  project's local-read-model philosophy. `font-mono` is applied only to
  the documented structured-data contexts (IDs, codes, monetary/table
  values) — enforced by code review convention plus the component-level
  test in Test Strategy, not by a runtime mechanism.
- **R3 (spacing/radius/border tokens)** → Tailwind's default spacing scale
  already is the 4px scale KNOW-009 documents, so no override is needed.
  `borderRadius` is extended with named steps matching KNOW-009 (`badge:
  4–6px`, default `lg: 8px`, `xl: 12px`, `full` for pills — `lg`/`xl`/`full`
  already exist in Tailwind and are used directly; only the small-badge
  radius gets a named addition). Border colors use `border-slate-200`
  default, `hover:border-slate-300`, and a `selected` state expressed as a
  component prop/class (`border-slate-900`) rather than a new token.
- **R4 (initial shared component set exists and is reused)** → each listed
  component (`Button`, `IconButton`, `Input`, `Select`, `Badge`,
  `StatusBadge`, `Card`, `DataTable`, `Pagination`, `Tabs`, `Dialog`,
  `Drawer`, `Tooltip`, `EmptyState`, `Skeleton`, `Alert`, `Toast`) is
  implemented once under `src/lib/components/ui/` and exported from a
  single `src/lib/components/ui/index.ts` barrel, so every future Feature
  imports from one place instead of reaching into individual files
  inconsistently.
- **R5 (light theme only, no dark-mode path)** → Tailwind's `darkMode`
  config option is left unset (Tailwind defaults to `media`, which would
  auto-apply `dark:` variants under a dark OS scheme); to make the "no
  dark-mode path" invariant enforceable rather than just unconfigured, the
  Plan additionally forbids any `dark:`-prefixed utility class anywhere in
  the codebase, checked by the CI/test step described in Test Strategy.

## Architecture

- Standard SvelteKit project layout per KNOW-003's suggested source tree,
  scoped to what SPEC-001 needs right now:
  ```text
  src/
  ├── lib/
  │   └── components/
  │       └── ui/
  │           ├── Button.svelte
  │           ├── IconButton.svelte
  │           ├── Input.svelte
  │           ├── Select.svelte
  │           ├── Badge.svelte
  │           ├── StatusBadge.svelte
  │           ├── Card.svelte
  │           ├── DataTable.svelte
  │           ├── Pagination.svelte
  │           ├── Tabs.svelte
  │           ├── Dialog.svelte
  │           ├── Drawer.svelte
  │           ├── Tooltip.svelte
  │           ├── EmptyState.svelte
  │           ├── Skeleton.svelte
  │           ├── Alert.svelte
  │           ├── Toast.svelte
  │           └── index.ts
  ├── app.css
  ├── app.html
  └── routes/
      └── +page.svelte   (placeholder, superseded by SPEC-004)
  static/
  └── fonts/             (self-hosted Inter, JetBrains Mono)
  tailwind.config.ts
  svelte.config.js
  vite.config.ts
  package.json
  ```
- Tokens live in two places by design, not by accident: Tailwind
  `theme.extend` for anything Tailwind's own utility system can express
  (colors, spacing, radius, fonts, font sizes), and a short `:root` block
  in `app.css` only for the handful of semantic aliases named in R1 —
  avoiding a parallel token system that duplicates Tailwind.
- `Dialog` and `Drawer` implement focus trapping and Escape-to-close
  internally (via a small shared `useFocusTrap` action/utility) so every
  consumer gets correct modal accessibility for free, rather than
  reimplementing it per usage site (this directly serves the Constitution's
  WCAG 2.2 AA requirement and SPEC-001's own accessibility constraint).
- `Toast` is backed by a small Svelte store (`toastStore` with
  `add`/`dismiss`) rather than a third-party toast library — no
  demonstrated need for one yet, consistent with the project's
  no-premature-infrastructure stance.

## Components Affected

All new — this is a greenfield Plan. No existing component is modified.
Files created: the 16 UI components and barrel file listed above, plus
`tailwind.config.ts`, `src/app.css`, `src/app.html`, base SvelteKit/Vite
config, and font assets under `static/fonts/`.

## Data Changes

None. This Spec has no database involvement.

## API Changes

None. This Spec introduces no server routes or endpoints.

## Integration Changes

- New dependency: `@iconify/svelte` for rendering icons, plus
  `@iconify-json/lucide` so the Lucide icon set is bundled at build time
  rather than fetched from a runtime CDN (keeps the self-hosted app fully
  functional offline, consistent with the project's overall philosophy
  even though Knowledge doesn't state this explicitly for icons — see
  Assumptions).
- New dev dependencies: Tailwind CSS and its PostCSS/Vite integration,
  Vitest, `@testing-library/svelte`, and `jsdom` for component tests.
- Self-hosted Inter and JetBrains Mono font files added under
  `static/fonts/` and referenced via `@font-face` in `app.css` (no Google
  Fonts runtime dependency).

## Implementation Sequence

1. Bootstrap the SvelteKit project (TypeScript template) at the repository
   root; add Tailwind CSS via its official Vite/SvelteKit integration.
2. Add `@iconify/svelte` + `@iconify-json/lucide`; verify one icon renders
   to confirm the bundled-icon path works before building components that
   depend on it.
3. Configure `tailwind.config.ts`: `fontFamily` (Inter/JetBrains Mono),
   extended `fontSize` steps, extended `borderRadius` steps, `boxShadow`
   additions (see Risks re: `shadow-xs`), and leave `darkMode` unset.
4. Write `src/app.css`: Tailwind layer imports, `@font-face` declarations,
   the `:root` semantic color custom properties from R1, base `body`
   styles (white background, `slate-900` text, `slate-900`/white text
   selection per KNOW-009 §7).
5. Implement primitive components first, since others compose them:
   `Button`, `IconButton`, `Input`, `Select`.
6. Implement layout/content primitives: `Badge`, `StatusBadge`, `Card`,
   `Tooltip`, `EmptyState`, `Skeleton`, `Alert`.
7. Implement structural/composite components: `DataTable`, `Pagination`,
   `Tabs`, `Dialog`, `Drawer`, `Toast` (including the focus-trap utility
   shared by `Dialog`/`Drawer`).
8. Add the `index.ts` barrel export.
9. Write component tests per Test Strategy alongside each component (not
   deferred to the end), per the Constitution's test-first preference.
10. Manual visual pass comparing rendered components against the KNOW-009
    examples (this step cannot be automated; recorded as a check-off, not
    a test).

## Test Strategy

- Unit/component tests via Vitest + `@testing-library/svelte` for every
  component in R4: variant rendering (e.g. `Button` primary/secondary/
  tertiary/destructive produce the documented classes/tokens), icon-only
  controls exposing an accessible name (`aria-label` or equivalent),
  `Dialog`/`Drawer` focus trapping and Escape-to-close behavior, `Toast`
  auto-dismiss timing (~3s) and manual dismiss.
- A repository-wide static check (a small Vitest/Node script or an ESLint
  rule) asserting no `dark:`-prefixed Tailwind class appears anywhere in
  `src/`, directly testing R5's "no dark-mode code path" requirement.
- A static check confirming every font-family declaration in component
  markup resolves to either the `sans` (Inter) or `mono` (JetBrains Mono)
  token — not an ad-hoc font stack — covering R2.
- Per the Constitution's Quality Requirements, tests are written alongside
  or before each component (steps 5–7 and 9 above happen together, not
  sequentially deferred).

## Risks

- `internal context SPEC-001 --intent planning` failed with
  `frontmatter not well-formed` against `ai/memory/constitution.md` (it
  has no leading `---` delimiter). This Plan proceeded using direct
  repository inspection instead, per this Skill's fallback rule, but the
  underlying issue should be fixed (add proper YAML frontmatter to
  `constitution.md`) so future `internal context` calls succeed — flagged
  here since fixing it is outside this Skill's write scope.
- This Plan bootstraps the SvelteKit project itself; SPEC-002 and
  SPEC-004's own Plans will assume this scaffold already exists even
  though that ordering isn't captured in the Spec dependency graph
  (`SPEC-001.depends_on = []`). Recommend implementing SPEC-001 before
  SPEC-002/SPEC-004 regardless of what `/create-tasks` orders them as.
- Tailwind's default utility set does not include a `shadow-xs` class in
  older major versions (only `shadow-sm` and up); implementers must add a
  custom `boxShadow.xs` entry to match KNOW-009's documented shadow scale.
- Bundling Lucide icons via `@iconify-json/lucide` pulls in the full icon
  JSON metadata at install time; if bundle size becomes a concern later, a
  more selective icon-loading approach (e.g. `unplugin-icons`) may replace
  this without changing the component API surface.

## Assumptions

- SvelteKit's standard TypeScript project template (`sv create` /
  `npm create svelte@latest`) is an acceptable bootstrap starting point;
  Knowledge specifies the stack (Svelte 5, SvelteKit, TypeScript, Tailwind,
  Iconify) but not a specific scaffolding tool.
- Fonts are self-hosted rather than loaded from Google Fonts at runtime, to
  match the project's general self-hosting/offline-resilience posture
  (KNOW-002, KNOW-003) — Knowledge does not state this explicitly for
  fonts, so this is a judgment call, not a cited requirement.
- Icons are bundled at build time rather than fetched from a runtime CDN,
  for the same self-hosting rationale — likewise a judgment call.
- Testing stack is Vitest + `@testing-library/svelte`, the conventional
  pairing for SvelteKit projects; Knowledge mandates TDD/BDD coverage but
  does not name a specific tool.
- No `package.json`/lockfile/package manager choice is dictated by
  Knowledge; this Plan assumes npm as the default, deferring to whatever
  `/implement` finds already configured if that changes before
  implementation begins.
