---
type: tasks
for: SPEC-001
---

# Tasks

## TASK-001 — Bootstrap SvelteKit + TypeScript project scaffold

- [x] Done

**Requirements:** prerequisite for SPEC-001:R1–R5 (no project exists yet;
this Task creates the scaffold every requirement's implementation lives
in — see Plan `Repository Context`).
**Depends on:** none.
**Scope:** `package.json`, `svelte.config.js`, `vite.config.ts`,
`tsconfig.json`, `src/app.html`, `src/routes/+page.svelte` (placeholder,
superseded by SPEC-004).
**Verify:** `npm run dev` starts without error; `npm run check`
(svelte-check) passes with zero errors.

**Evidence:** Scaffolded via `sv create . --template minimal --types ts
--no-add-ons` (SvelteKit 2, Svelte 5, TypeScript, Vite). `npm install`
succeeded (57 packages). `npm run check` → `COMPLETED 166 FILES 0 ERRORS
0 WARNINGS 0 FILES_WITH_PROBLEMS`. `npm run dev -- --port 5180` started
in ~1.8s and served `HTTP 200` on `GET /`. Note: `sv create` initially
overwrote the pre-existing `.gitignore` and `README.md` with its own
generic boilerplate (outside this Task's stated scope) — both were
restored, merging the SvelteKit-specific ignore entries into the
original `.gitignore` and appending a short "Developing"/"Building"
section to the original `README.md` rather than replacing its content.
`.misterspec/cache/` (a local SQLite tool cache, unrelated to this Task)
was also added to `.gitignore` since it appeared untracked after running
misterspec commands.

## TASK-002 — Add Tailwind CSS integration

- [x] Done

**Requirements:** prerequisite for SPEC-001:R1, R3.
**Depends on:** TASK-001.
**Scope:** `tailwind.config.ts`, PostCSS/Vite Tailwind wiring, Tailwind
`@layer` directives added to `src/app.css`.
**Verify:** a throwaway element using a Tailwind utility class (e.g.
`bg-slate-900`) renders with the expected computed style in `npm run
build` output / dev server.

**Evidence:** Added via `sv add tailwindcss="plugins:none" --no-install
--no-git-check`. This installed **Tailwind CSS v4** (`tailwindcss` +
`@tailwindcss/vite`), which configures via the `@tailwindcss/vite` Vite
plugin and a CSS `@import 'tailwindcss';` entrypoint — there is no
`tailwind.config.ts` file in v4 (theme customization happens via CSS
`@theme` directives instead). The scaffolder generated the stylesheet at
`src/routes/layout.css`; moved it to `src/app.css` and updated
`src/routes/+layout.svelte`'s import to match the Plan's documented file
layout (`ai/programs/PRG-001/features/FEAT-001/specs/SPEC-001/plan.md`
`Architecture`). Verified by temporarily adding `class="bg-slate-900
text-white"` to `src/routes/+page.svelte`, running `npm run build`, and
confirming the compiled CSS
(`.svelte-kit/output/client/_app/immutable/assets/0.*.css`) contains
`.bg-slate-900{background-color:var(--color-slate-900)}` — Tailwind's
built-in slate-900 matches KNOW-009's documented value. Reverted the
temporary class afterward (page content belongs to SPEC-004, not this
Task). `npm run check` → 0 errors/warnings after the change.

**Note for TASK-004:** the Plan assumed a `tailwind.config.ts`
`theme.extend`-based approach; Tailwind v4 (installed here) configures
tokens via `@theme { ... }` in CSS instead. TASK-004 should use the v4
`@theme` syntax in `src/app.css`, not a JS config file — flagged as a
Plan-vs-actual-tooling discrepancy, not a scope change to this Task.

## TASK-003 — Add Iconify + bundled Lucide icon set

- [x] Done

**Requirements:** prerequisite for SPEC-001:R4 (icon-bearing components:
`IconButton`, `Tooltip`, `Alert`).
**Depends on:** TASK-001.
**Scope:** `@iconify/svelte` + `@iconify-json/lucide` added as
dependencies; one smoke-test component rendering `lucide:layers`.
**Verify:** `vitest run` on the smoke test confirms the icon renders with
no network request (bundled, not CDN-fetched).

**Evidence:** Added `@iconify/svelte`, `@iconify-json/lucide`, and
`@iconify/utils` as dependencies. `@iconify/svelte`'s `Icon` component
fetches from the Iconify API by default when given a string name, so to
satisfy "bundled, not CDN-fetched" a small wrapper was added:
`src/lib/icons/lucide.ts` (`lucideIcon(name)` — resolves an icon's raw
data synchronously from the bundled `@iconify-json/lucide` collection
via `@iconify/utils`'s `getIconData`, with an in-memory cache and a
thrown error for an unknown name) and `src/lib/icons/LucideIcon.svelte`
(passes the resolved data object to `<Icon icon={...} />`, which never
triggers a network fetch when `icon` is an object rather than a string).
Test infrastructure did not exist yet and TASK list has no dedicated
Task for it, so it was added here as a minimal necessary step for this
Task's own stated verification (`vitest run`): `sv add
vitest="usages:unit,component"` (installs **`vitest` +
`vitest-browser-svelte` + `@vitest/browser-playwright`**, configuring
two Vitest projects — a Chromium-based "client" project for
`*.svelte.test.ts` component tests, and a Node "server" project for
plain `*.test.ts`), plus `npx playwright install chromium
chromium-headless-shell` to fetch the browser binaries (no `--with-deps`
system package install, since that requires root and wasn't available
in this environment — flagged in Attention). Test file
`src/lib/icons/LucideIcon.svelte.test.ts` renders `LucideIcon` with
`name="layers"`, asserts an `<svg>` with real path content is produced,
and asserts `globalThis.fetch` (spied) is never called during render;
a second test asserts `lucideIcon('layers')` resolves synchronously with
the expected 24×24 bundled data; a third asserts an unknown icon name
throws rather than silently rendering nothing. `npm run test` →
**3 test files, 5 tests, all passed**. `npm run check` → 0 errors/
warnings (318 files).

**Note for TASK-006+:** component tests use **`vitest-browser-svelte`**
(real Chromium via Playwright), not `@testing-library/svelte` + jsdom as
the Plan's Assumptions predicted — this is the tooling `sv add vitest`
scaffolds for Svelte 5 and is followed for consistency. Flagged as
another Plan-vs-actual-tooling discrepancy (alongside the Tailwind v4
note on TASK-002), not a scope change.

## TASK-004 — Configure Tailwind theme tokens (fonts, font sizes, radius, shadow)

- [x] Done

**Requirements:** SPEC-001:R1, R2, R3.
**Depends on:** TASK-002.
**Scope:** `tailwind.config.ts` `theme.extend`: `fontFamily`
(`sans`: Inter, `mono`: JetBrains Mono), `fontSize` steps (10/11px
additions), `borderRadius` steps (small-badge 4–6px alongside existing
`lg`/`xl`/`full`), `boxShadow.xs` addition. `darkMode` left unconfigured
per Plan `Architecture`.
**Verify:** `vitest run` against a config-loading test that imports the
resolved Tailwind config and asserts the expected `fontFamily`,
`fontSize`, `borderRadius`, and `boxShadow` keys are present with the
documented values.

**Evidence:** Implemented as an `@theme { ... }` block in `src/app.css`
(Tailwind v4 has no `tailwind.config.ts` — see the note left on
TASK-002). Investigated Tailwind v4's actual default theme
(`node_modules/tailwindcss/theme.css`) before adding anything, and found
most of R1–R3 already satisfied without overrides:
`text-xs/sm/lg/xl/2xl` are 12/14/18/20/24px — an exact match for
KNOW-009 §10's type scale — and `rounded-lg/xl` are 8px/12px, an exact
match for KNOW-009 §15's standard-control/container radii, with
`rounded-full` already covering pills. `shadow-xs`/`shadow-xl`/
`shadow-2xl` also already exist by default in v4, matching KNOW-009 §17
— so the Plan's flagged risk about needing a custom `shadow-xs` utility
(written under a v3 assumption) turned out to be moot; no `boxShadow`
addition was needed. Only two real additions were required: `--text-2xs`
(10px, microcopy) and `--text-meta` (11px, metadata) for the two steps
below Tailwind's default scale, and `--radius-badge` (6px) for the
small-badge radius. `fontFamily` tokens (`--font-sans: 'Inter', ...`,
`--font-mono: 'JetBrains Mono', ...`) were added; actual font files are
TASK-005's scope. Since Tailwind v4 has no JS config to load and assert
against, verification used the Plan's alternative method instead
("a rendered test component's computed class list"): added
`src/lib/design-system/TokenProbe.svelte` (a test-only harness rendering
one element per new token class) and
`src/lib/design-system/TokenProbe.svelte.test.ts`, asserting via
`getComputedStyle` that `font-sans`→`Inter`, `font-mono`→`JetBrains
Mono`, `text-2xs`→`10px`, `text-meta`→`11px`, `rounded-badge`→`6px`, and
spot-checking one already-default class from each family
(`text-xs`→`12px`, `rounded-lg`→`8px`). `npm run test` → **4 test
files, 11 tests, all passed**. `npm run check` → 0 errors/warnings
(320 files).

## TASK-005 — Self-host fonts and write base `app.css` (font-face, color tokens, base styles)

- [x] Done

**Requirements:** SPEC-001:R1, R2.
**Depends on:** TASK-004.
**Scope:** `static/fonts/` (Inter, JetBrains Mono font files),
`@font-face` declarations and `:root` semantic color custom properties
(`--color-bg`, `--color-surface`, `--color-border`, `--color-text`,
`--color-text-strong`, `--color-text-muted`, `--color-text-tertiary`,
`--color-accent`, `--color-accent-hover`) in `src/app.css`, base `body`
styles (white background, slate-900 text, slate-900/white text
selection).
**Verify:** a rendered smoke-test component using `font-sans` and
`font-mono` classes resolves to Inter and JetBrains Mono respectively
(assert via computed style in a jsdom/Testing Library test); no
network font request occurs.

**Evidence:** Rather than manually fetching raw Inter/JetBrains Mono
font binaries into `static/fonts/`, used
**`@fontsource-variable/inter`** and **`@fontsource-variable/jetbrains-
mono`** (npm packages bundling each font's `.woff2` files plus their own
`@font-face` CSS, resolved and served by Vite like any other bundled
asset — no `static/fonts/` directory needed, no Google Fonts runtime
request). Both packages ship their font under a `"... Variable"` family
name (`Inter Variable`, `JetBrains Mono Variable`), so `--font-sans`/
`--font-mono` in `src/app.css` were updated to list the actual loaded
family first, falling back to the plain name and generic fonts
afterward — the visual result is still Inter/JetBrains Mono as
documented. Added the `:root` semantic color custom properties from the
Task's own list (mapped to the matching Tailwind v4 `--color-slate-*`/
`--color-white` variables, not hardcoded hex, so they stay in sync with
the palette), base `body` styles (white background, slate-900 text,
`font-sans`), and an `::selection` rule (slate-900 background, white
text) per KNOW-009 §7. Verification adapted to this project's actual
test stack (`vitest-browser-svelte` + real Chromium, not jsdom — see
the note on TASK-003): added `src/app.svelte.test.ts`, which (1)
compares `document.body`'s computed background/text color against
reference elements carrying the raw `bg-white`/`text-slate-900`
classes (Tailwind v4 reports computed colors as `oklch(...)`, so this
avoids a fragile hardcoded color-space string), (2) confirms a
`::selection` style rule exists, (3) walks `document.styleSheets` for
`CSSFontFaceRule`s and confirms both `Inter Variable` and `JetBrains
Mono Variable` are declared, and (4) asserts none of those rules' `src`
reference `fonts.googleapis.com`/`fonts.gstatic.com` or any absolute
`http(s)://` URL — i.e. fonts are genuinely bundled, not fetched from a
CDN. `npm run test` → **5 test files, 15 tests, all passed**. `npm run
check` → 0 errors/warnings (321 files). `npm run build` → succeeded
(the `adapter-auto` "could not detect a supported production
environment" notice is expected and unrelated — no deploy target is
configured yet).

## TASK-006 — Implement `Button` and `IconButton` components (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005, TASK-003.
**Scope:** `src/lib/components/ui/Button.svelte`,
`src/lib/components/ui/IconButton.svelte`, and their Vitest +
`@testing-library/svelte` tests.
**Verify:** `vitest run src/lib/components/ui/Button.test.ts
src/lib/components/ui/IconButton.test.ts` — asserts each variant
(primary/secondary/tertiary/destructive) renders its documented
classes, and every `IconButton` instance exposes an accessible name
(`aria-label` or equivalent).

**Evidence:** Implemented `Button.svelte` (variants `primary` —
`bg-slate-900`/hover `slate-800`/white text; `secondary` — white bg,
`slate-200` border, `slate-700` text, hover `slate-50`; `tertiary` —
transparent, `slate-600`, hover `slate-900`; `destructive` — white bg
by default with a red border/bg/text hover treatment, since KNOW-009
doesn't fully specify a `Button` destructive variant beyond the
icon-only pattern in §38 — a documented judgment call, not a cited
spec) with `disabled` (KNOW-009 §39: 50% opacity, no hover, `disabled`
attribute) and `loading` states (KNOW-009 §40: spinner via
`LucideIcon name="loader-circle" class="animate-spin"`, preserved
button semantics, `aria-busy`, clicks blocked via `disabled`), and
optional `icon`/`iconPosition` using the `LucideIcon` wrapper from
TASK-003 (so icons stay bundled, never fetched). Implemented
`IconButton.svelte` with a **required** `label` prop mapped to
`aria-label`/`title` (KNOW-009 §18/§37: icon-only controls need an
accessible name), a `~32px` (`h-8 w-8`) minimum target, `default` vs
`destructive` variants (destructive: `text-slate-400` default →
`hover:text-red-600`, matching KNOW-010 §38 — never red by default).
Tests use `vitest-browser-svelte`'s `getByRole('button', { name })`
(accessible-name-based queries, doubling as an accessibility check) and
`toHaveClass`/`toBeDisabled` assertions — 7 tests for `Button`, 6 for
`IconButton`. `npm run test` → **7 test files, 28 tests, all passed**.
`npm run check` → 0 errors/warnings (325 files).

## TASK-007 — Implement `Input` and `Select` components (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005.
**Scope:** `src/lib/components/ui/Input.svelte`,
`src/lib/components/ui/Select.svelte`, and tests.
**Verify:** `vitest run src/lib/components/ui/Input.test.ts
src/lib/components/ui/Select.test.ts` — default/focus states render
documented border/ring classes; both have associated accessible labels.

**Evidence:** Implemented `Input.svelte` and `Select.svelte`, both
requiring a `label` prop (no accessible-label escape hatch besides an
explicit `hideLabel` that keeps the `<label>` in the DOM via `sr-only`
rather than removing it — KNOW-009 §42 documents label styling but
Knowledge doesn't explicitly mandate always-visible labels, so a
visually-hidden option was added as a judgment call for dense filter
bars). Both use Svelte 5's `$props.id()` to generate a stable id and
associate `<label for>` with the control. `Input` supports `helperText`
(§43, `text-[10px] text-slate-400`, wired via `aria-describedby`) and an
`error` state (`aria-invalid="true"`, red helper text replacing the
normal helper, also via `aria-describedby`). `Select` deliberately wraps
a **native** `<select>` rather than building a custom listbox, per
KNOW-009 §44 ("Do not create a custom select unless native behavior
proves insufficient"), taking an `options: {value, label}[]` prop. Both
share the documented input visual spec (height ~36px via `h-9`,
`px-3 py-1.5`, `text-xs`, `border-slate-200` default →
`focus:border-slate-900`, no default outline). Tests query by accessible
role/name (`getByRole('textbox'|'combobox', { name })`), which fails if
the label association is broken, plus explicit checks that
`aria-describedby` points at a real, matching helper/error element.
`npm run test` → **9 test files, 37 tests, all passed**. `npm run
check` → 0 errors/warnings (329 files).

## TASK-008 — Implement `Badge` and `StatusBadge` components (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005.
**Scope:** `src/lib/components/ui/Badge.svelte`,
`src/lib/components/ui/StatusBadge.svelte`, and tests.
**Verify:** `vitest run src/lib/components/ui/Badge.test.ts
src/lib/components/ui/StatusBadge.test.ts` — pill radius/padding/
font-size classes match KNOW-009 §50 examples.

**Evidence:** Implemented `Badge.svelte` as the generic pill primitive
(`rounded-full`, `px-2 py-0.5`, `text-2xs` — the 10px microcopy token
from TASK-004) with five variants (`neutral`/`success`/`info`/`warning`/
`danger`), each the documented `bg-*-50`/`text-*-700`/`border-*-200`
triple for slate/emerald/blue/amber/red respectively (`warning`/`danger`
extrapolated from the same pattern KNOW-009 gives for `success`/`info`,
since §50 only spells out those two named examples explicitly — flagged
as a judgment call, not a cited value). Implemented `StatusBadge.svelte`
on top of `Badge` as the semantic wrapper the Constitution's "same
semantic action → same component" rule calls for: a `statusMap` keyed by
`'published' | 'result-homologated' | 'active-rule'`, each mapped to its
exact documented copy ("Publicada", "Resultado Homologado", "Regra
Ativa") and variant, with an optional `label` override for screens that
need different wording while keeping the status's variant. Tests assert
on the actual rendered classes for each variant/status combination, not
just that the component renders. One early test-authoring mistake was
caught by the tests themselves: `StatusBadge`'s text is a plain string
child (not a wrapping snippet like `Badge`'s test harness uses), so
`getByText(...).element().parentElement` pointed one level too high;
fixed to assert on `getByText(...).element()` directly once the
`StatusBadge` tests failed for the right reason (missing classes on the
wrong element, not a real component bug) — corrected before recording
this evidence. `npm run test` → **11 test files, 45 tests, all
passed**. `npm run check` → 0 errors/warnings (333 files).

## TASK-009 — Implement `Card`, `Tooltip`, `EmptyState`, `Skeleton`, `Alert` components (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005, TASK-003.
**Scope:** the five listed `.svelte` files under
`src/lib/components/ui/` and their tests.
**Verify:** `vitest run` on each component's test file — `Card` renders
documented border/radius/padding; `Skeleton` applies
`bg-slate-100 rounded animate-pulse`; `Tooltip`/`Alert` icon usage is
accessible (not color-only).

**Evidence:** Implemented all five. `Card` — `rounded-xl`, `p-5`
(20px), default `border-slate-200`/white bg, `selected` (slate-900
border + `slate-50/50%` bg) and `hoverable` (→`hover:border-slate-400`,
only when not selected) props. `Tooltip` — a slot-based trigger pattern
(`trigger` snippet receives a generated `describedBy` id to wire onto
the caller's own interactive element) showing/hiding on hover **and**
focus (not hover-only, since keyboard users must be able to trigger it),
`role="tooltip"`, `z-40` per the documented dropdown/popover z-index
tier (KNOW-010 §138). `EmptyState` — `title` (required), optional
`description`, optional `action` snippet, centered/`text-xs`/
`text-slate-400`/`py-8`. `Skeleton` — `bg-slate-100 rounded
animate-pulse`, `role="presentation"` + `aria-hidden="true"` (decorative,
not real content), configurable `width`/`height`. `Alert` — four
variants; `notice` reproduces KNOW-009 §75's exact terminology/coverage
caveat style (`amber-50`/`amber-200`/`amber-900` + info icon,
"informational, not an error") as distinct from a semantic `info`
variant (blue, matching "Publicada"'s color); every variant always
renders an icon via `LucideIcon`, never relying on background color
alone (KNOW-009 §122). One compiler a11y warning surfaced during `npm
run test` (`Tooltip`'s wrapper `<span>` has hover/focus handlers with no
ARIA role) — resolved with a documented `svelte-ignore
a11y_no_static_element_interactions`, since the wrapper is intentionally
non-interactive (the real semantics live on the caller-provided trigger
content; the wrapper only relays hover/focus bubbling to control
visibility), not silently suppressed without explanation. `npm run
test` → **16 test files, 61 tests, all passed**, zero warnings. `npm
run check` → 0 errors/warnings (343 files).

## TASK-010 — Implement shared focus-trap utility (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4 (supports Dialog/Drawer accessibility per
Plan `Architecture`; ties to Constitution WCAG 2.2 AA requirement).
**Depends on:** TASK-001.
**Scope:** `src/lib/actions/useFocusTrap.ts` (or equivalent Svelte
action/utility).
**Verify:** `vitest run src/lib/actions/useFocusTrap.test.ts` — Tab/
Shift+Tab cycles focus within the trapped container, Escape triggers
the provided close callback, and focus returns to the element active
before the trap was engaged.

**Evidence:** Implemented `focusTrap` as a standard Svelte `Action<
HTMLElement, FocusTrapOptions>` (`use:focusTrap={{ onClose }}`), matching
the Plan's `Architecture` section exactly. On mount: captures
`document.activeElement` (to restore later), computes the container's
focusable elements (anchors-with-href, non-disabled buttons/inputs/
selects/textareas, explicit non-negative `tabindex`, visible via
`offsetParent`), and moves initial focus to the first one. A `keydown`
listener on the container handles `Escape` (calls `onClose`) and `Tab`/
`Shift+Tab` (wraps from last→first / first→last at the boundaries,
`preventDefault`-ing the browser's default tab order). On `destroy`:
removes the listener and refocuses whatever was active before the trap
engaged. Tests exercise the action directly against real DOM nodes it
creates in a live browser (no Svelte component needed, since this is a
plain action) — assert initial focus moves in, Tab wraps last→first,
Shift+Tab wraps first→last, Escape invokes `onClose` exactly once, and
destroying the trap restores focus to the original element. `npm run
test` → **17 test files, 66 tests, all passed**. `npm run check` → 0
errors/warnings (345 files).

## TASK-011 — Implement `Dialog` and `Drawer` components (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-010, TASK-005.
**Scope:** `src/lib/components/ui/Dialog.svelte`,
`src/lib/components/ui/Drawer.svelte`, and tests, both using
`useFocusTrap` from TASK-010.
**Verify:** `vitest run src/lib/components/ui/Dialog.test.ts
src/lib/components/ui/Drawer.test.ts` — focus trapped while open,
Escape closes, focus restored to the triggering element on close.

**Evidence:** Implemented `Dialog.svelte` (`role="dialog"`,
`aria-modal="true"`, `aria-labelledby` when a title is given, white
container, `slate-200` border, `rounded-xl`, `shadow-xl`, 20px (`p-5`)
padding, `slate-900/40%` backdrop, ~150ms fade/scale transitions, a
close icon that is **always** rendered regardless of `title` per
KNOW-009 §91, `size="large"` variant at `max-w-3xl`/`max-h-[90vh]` for
the Procurement Detail Modal pattern from §63/§92) and `Drawer.svelte`
(same backdrop/focus-trap/Escape pattern, `left`/`right` `side` prop,
256px width, slide-in via `fly`, KNOW-010 §138's z-index tiers applied
literally — backdrop `z-10`, panel `z-20`, as two fixed siblings rather
than nested, matching "mobile backdrop 10 / sidebar 20"). Both attach
`use:focusTrap={{ onClose }}` from TASK-010, so Escape-to-close, initial
focus, Tab cycling, and focus restoration all come from the shared,
already-tested utility rather than being reimplemented.

Two real issues surfaced during verification and were fixed, not
worked around: (1) a Svelte compiler warning
(`state_referenced_locally`) in `Drawer.svelte` — `flyX` was computed
from the `side` prop at top-level script scope, capturing only its
initial value; changed to `$derived`. (2) The "backdrop click closes"
tests initially timed out — a real Playwright click targets the
element's visual center, which for the backdrop is occluded by the
centered panel sitting on top of it; switched those two tests to
dispatch a native `MouseEvent('click')` directly at the backdrop element
(still exercises the real `onclick` handler, just without Playwright's
actionability/visibility resolution getting in the way of a location
that's legitimately covered by other content). Also switched
`@vitest/browser/context`'s `userEvent` import to `vitest/browser` after
a deprecation warning appeared during the first test run. `npm run
test` → **19 test files, 79 tests, all passed**, zero warnings. `npm
run check` → 0 errors/warnings (349 files).

## TASK-012 — Implement `DataTable` and `Pagination` components (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005.
**Scope:** `src/lib/components/ui/DataTable.svelte`,
`src/lib/components/ui/Pagination.svelte`, and tests.
**Verify:** `vitest run src/lib/components/ui/DataTable.test.ts
src/lib/components/ui/Pagination.test.ts` — header styling
(slate-50/slate-500/10px/uppercase) and row separator classes match
KNOW-009 §51; current page in `Pagination` is indicated by more than
color alone.

**Evidence:** Implemented `DataTable.svelte` as a Svelte 5 generic
component (`<script lang="ts" generics="T">`), taking `columns`
(`key`, `label`, optional `align`/`mono`/`render`), `rows: T[]`, and a
`getRowKey` function — header row `bg-slate-50`/`text-slate-500`/
`text-2xs` (the 10px token)/`uppercase`; body rows separated by
`border-slate-100` with `hover:bg-slate-50/80`; analytical columns
right-aligned + `font-mono` per column config (KNOW-009 §52); wrapped
in `overflow-x-auto` (§53); an empty `rows` array renders the shared
`EmptyState` component (from TASK-009) instead of a bare empty
`<tbody>`, reusing that component rather than duplicating its copy/
layout rules. Implemented `Pagination.svelte` with the documented
"Exibindo X–Y de Z" / "[Anterior] Página N de M [Próxima]" footer
pattern, using the shared `Button` (secondary variant) for both
controls rather than bespoke buttons, disabled at the first/last page
boundaries. Two real defects surfaced during verification and were
fixed in the component, not the tests: (1) `Pagination` rendered raw
JS numbers (`1482`) instead of `pt-BR`-grouped values (`1.482`) —
KNOW-010 §109 and the Constitution's formatting requirement — fixed
with `Intl.NumberFormat('pt-BR')`; (2) a test that rendered `Pagination`
twice in one `it` block (first-page and last-page states) caused
`getByRole` to match two "Próxima" buttons across both un-cleaned-up
renders — split into two separate tests so each gets its own isolated
render; (3) `svelte-check` failed on the `DataTable` test file because
TypeScript can't infer a generic Svelte component's type parameter from
a plain `.ts` call site — fixed by typing `getRowKey`'s parameter as
`unknown` and casting inside (`(r) => (r as Procurement).id`) rather
than loosening the component's own generic typing. `npm run test` →
**21 test files, 89 tests, all passed**. `npm run check` → 0 errors/
warnings (353 files).

## TASK-013 — Implement `Tabs` component (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005.
**Scope:** `src/lib/components/ui/Tabs.svelte` and its test.
**Verify:** `vitest run src/lib/components/ui/Tabs.test.ts` — active
tab uses `aria-selected`, keyboard arrow navigation moves focus between
tabs.

**Evidence:** Implemented `Tabs.svelte` as a WAI-ARIA `tablist`/`tab`
pattern (`role="tablist"` with a required accessible `label`, one
`role="tab"` button per entry) using KNOW-009 §64's exact active/
inactive styling (active: `border-slate-900 text-slate-900`; inactive:
transparent border, `text-slate-400`, `hover:text-slate-700` — the
Procurement Detail Tabs pattern; noted as the standardized style even
though a couple of other documented tab contexts, e.g. Radar filters
§81, use slightly different inactive shades, a judgment call to
standardize on one component). Uses the **automatic-activation**
roving-tabindex model: only the active tab is in the normal Tab order
(`tabindex=0`), all others are `tabindex=-1`; `ArrowRight`/`ArrowLeft`
move focus to the next/previous tab and immediately select it (wrapping
at both ends), `Home`/`End` jump to the first/last tab — a `aria-
selected` attribute always reflects the caller's `active` prop, which
the caller updates via the required `onChange` callback (the component
holds no internal selection state, keeping it a controlled component
like `Pagination`). Tests cover `aria-selected` correctness, visual
class assignment, click-to-select, and keyboard arrow navigation
(including wrap-around from the last tab back to the first). `npm run
test` → **22 test files, 94 tests, all passed**. `npm run check` → 0
errors/warnings (355 files).

## TASK-014 — Implement `Toast` store and component (+ tests)

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-005.
**Scope:** `src/lib/components/ui/toastStore.ts` (add/dismiss API),
`src/lib/components/ui/Toast.svelte`, and tests.
**Verify:** `vitest run src/lib/components/ui/Toast.test.ts` — using
fake timers, a toast auto-dismisses after ~3s and can also be dismissed
manually before then.

**Evidence:** Implemented `toastStore` (`add(message, {variant,
durationMs})` / `dismiss(id)`) as a Svelte-5-runes-based singleton
store — a plain object exposing a `get toasts()` accessor over a
module-level `$state` array, the documented "universal reactivity"
pattern, rather than pulling in a third-party toast library (no
demonstrated need). **File named `toastStore.svelte.ts`, not
`toastStore.ts`** as the Task's scope literally states — Svelte 5
requires the `.svelte.ts` extension for any module using runes
(`$state`) outside a `.svelte` file; `toastStore.ts` would fail to
compile. Documented here as a necessary naming-convention correction,
not a scope change. `Toast.svelte` renders the queue bottom-right on
desktop / bottom-with-margin on mobile (`sm:` breakpoint), `slate-900`
bg, white text, `rounded-xl`, `shadow-lg`, a variant-colored icon
(emerald check / red circle-x, KNOW-009 §103), a manual dismiss button,
and `aria-live="polite"` + `role="status"` per toast for screen-reader
announcements. Auto-dismiss uses a real `setTimeout` (default 3000ms)
scheduled in the store, not the component.

A real bug surfaced during verification: the first versions of the
auto-dismiss and manual-dismiss tests asserted the toast was gone from
the DOM immediately after triggering removal, but `Toast.svelte` plays
a 150ms `svelte/transition` `fly` **outro** transition on removal (driven
by the Web Animations API, not advanceable by `vi.useFakeTimers()`), so
the element is still present for that window — a real race, not a test
artifact. Fixed by waiting past the transition (switching back to real
timers before waiting, in the fake-timer test) before asserting
absence, rather than removing the transition or weakening the
assertion. `npm run test` → **23 test files, 99 tests, all passed**.
`npm run check` → 0 errors/warnings (358 files).

## TASK-015 — Add `src/lib/components/ui/index.ts` barrel export

- [x] Done

**Requirements:** SPEC-001:R4.
**Depends on:** TASK-006, TASK-007, TASK-008, TASK-009, TASK-011,
TASK-012, TASK-013, TASK-014.
**Scope:** `src/lib/components/ui/index.ts` re-exporting every
component built in TASK-006–TASK-014.
**Verify:** a consumer test file imports every component solely from
`$lib/components/ui` (the barrel) and type-checks/builds successfully.

**Evidence:** Added `src/lib/components/ui/index.ts` re-exporting all
16 UI components (`Button`, `IconButton`, `Input`, `Select`, `Badge`,
`StatusBadge`, `Card`, `Tooltip`, `EmptyState`, `Skeleton`, `Alert`,
`DataTable`, `Pagination`, `Tabs`, `Dialog`, `Drawer`, `Toast`) plus
`toastStore`, as named exports. Added
`src/lib/components/ui/index.svelte.test.ts` which imports everything
via `import * as ui from './index'` and (1) asserts every expected name
is present and truthy — this would fail if a future component were
added to the folder but forgotten in the barrel, or if an export were
renamed and broke silently; (2) actually **renders** `ui.Button`
end-to-end, sourced solely from the barrel import, confirming the
re-export is a real runtime binding and not just a type-only pass-through;
(3) confirms `ui.toastStore` is the same live singleton instance other
modules would import directly (mutating it through the barrel import is
visible immediately). `npm run test` → **24 test files, 102 tests, all
passed**. `npm run check` → 0 errors/warnings (360 files) — confirming
the barrel, including the generic `DataTable` re-export, type-checks
cleanly. `npm run build` → succeeded end-to-end (production bundle, not
just `check`/`test`), satisfying the Task's own "type-checks/builds
successfully" verification wording literally.

## TASK-016 — Add static check forbidding `dark:`-prefixed Tailwind classes

- [x] Done

**Requirements:** SPEC-001:R5.
**Depends on:** TASK-002.
**Scope:** a small Node/Vitest script scanning `src/` for any
`dark:`-prefixed class usage, wired into the test/CI run.
**Verify:** the script fails if a `dark:` class is introduced anywhere
in `src/`, and passes against the tree as of TASK-015.

**Evidence:** Added `scripts/check-no-dark-classes.mjs` — a plain Node
script (no test-framework dependency, since it doesn't need one) that
recursively scans `src/**/*.{svelte,ts,js}` for a `dark:`-prefixed
Tailwind class token, printing every `file:line` match and exiting
non-zero if any are found. Wired into `package.json` as
`check:no-dark-classes`, appended to the composite `test` script
(`test:unit && check:no-dark-classes`) so it always runs alongside the
Vitest suite. **Verified the check actually catches violations, not
just that it passes on a clean tree**: added a temporary fixture file
containing `class="bg-white dark:bg-slate-900"`, ran the script,
confirmed it reported the exact file/line and exited with code 1, then
deleted the fixture. Re-ran against the real tree: `OK: scanned 53
files under src/, found no dark:-prefixed classes.` `npm run test` →
Vitest suite (24 files, 102 tests) passes, then the new check passes,
in one composite command.

## TASK-017 — Add static check for `font-mono` usage in structured-data contexts

- [x] Done

**Requirements:** SPEC-001:R2.
**Depends on:** TASK-005.
**Scope:** a lint script/rule flagging monospace-formatted values (IDs,
codes, monetary/table values) rendered without the `font-mono` class,
and flagging `font-mono` used on ordinary prose text nodes where
feasible to detect statically.
**Verify:** the script runs cleanly against the component set from
TASK-006–TASK-014.

**Evidence:** Added `scripts/check-font-mono-usage.mjs`, explicitly
scoped as a best-effort convention aid rather than a general proof
(statically verifying "is this value structured data" is undecidable in
general — documented as such in the script's own header comment). Two
concrete, testable heuristics: (1) a literal value matching a known
structured-data pattern (currency `R$ ...`, CNPJ `NN.NNN.NNN/NNNN-NN`)
found in a `.svelte` template must have `font-mono` somewhere in a
200-character window around it, else it's flagged; (2) an element
carrying `font-mono` whose own static text content looks like ordinary
prose (4+ alphabetic words, no digits) is flagged as a likely misuse.
Wired into `package.json` as `check:font-mono-usage`, appended to the
composite `test` script after `check:no-dark-classes`. **Verified both
heuristics actually catch violations, not just that they pass on a
clean tree**: one fixture with a bare `R$ 5.480,00` (no `font-mono`)
correctly flagged as heuristic (1); a second fixture with `font-mono`
wrapped around ordinary prose correctly flagged as heuristic (2); both
fixtures deleted after confirming. Re-ran against the real component
set from TASK-006–TASK-015: `OK: no likely font-mono misuse detected`.
`npm run test` → Vitest suite, then both static checks, all pass in one
composite command.

## TASK-018 — Manual visual QA pass against KNOW-009 documented examples

- [x] Done

**Requirements:** SPEC-001:R1, R2, R3 (visual conformity to the design
system — not mechanically testable).
**Depends on:** TASK-015.
**Scope:** side-by-side visual comparison of each rendered component
(via a temporary preview route or Storybook-like harness) against the
concrete examples in KNOW-009 (palette, type scale, spacing, radius,
shadows).
**Verify:** a sign-off checklist, one line per component, confirming
visual match — not an automated test; recorded as the completion
evidence for this Task.

**Evidence:** Built a temporary route (`src/routes/__visual-qa__/
+page.svelte`) rendering one instance of every component from the
barrel with representative KNOW-009 example props/copy, started the dev
server, and used Playwright (a throwaway script, not committed) to
capture real screenshots — full page, plus Dialog/Drawer/Toast opened —
which were then visually inspected directly (not just asserted
programmatically). One visual discrepancy initially looked real (the
`tertiary` Button variant appeared to have the same white/bordered box
as `secondary`/`destructive` in the screenshot) — cross-checked against
actual `getComputedStyle()` output rather than trusting the screenshot
alone, which confirmed `border: 0px`, transparent background, and
`4px` padding exactly as coded; the apparent border was a screenshot/
zoom artifact from tight button spacing, not a real bug. The DataTable
header's `slate-50` background (visually very subtle against white) was
similarly confirmed via computed style
(`oklch(0.984 0.003 247.858)`, Tailwind's real slate-50) rather than
eyeballed. Sign-off checklist (all confirmed matching KNOW-009):

- Button (primary/secondary/tertiary/destructive, disabled, loading, with icon) — matches §34–40.
- IconButton (default + destructive hover) — matches §37–38.
- Input (default, helper text, error, hidden label) — matches §41–43.
- Select (native, styled to match Input) — matches §44.
- Badge / StatusBadge (info/success/neutral/warning) — matches §50.
- Card (default, selected, hoverable) — matches §47–48.
- Tooltip (trigger + hover/focus reveal) — matches §124.
- EmptyState (title + description, centered) — matches §54/§106.
- Skeleton (pulse, slate-100) — matches §104–105.
- Alert (notice/info/success/danger, always with icon) — matches §75/§122.
- DataTable (header style, row separators, mono/right-aligned column) — matches §51–52.
- Pagination (Exibindo X–Y de Z / Página N de M, pt-BR grouping) — matches KNOW-010 §133.
- Tabs (active underline, inactive color) — matches §64.
- Dialog (backdrop, header/footer, close icon, focus trap) — matches §63/§91–92.
- Drawer (off-canvas, backdrop, close icon) — matches §32/§91.
- Toast (bottom-right, slate-900/white, variant icon) — matches §100–101.

Temporary preview route and Playwright script were deleted after the
review (not part of any Spec's scope); re-ran `npm run test` (24 files,
102 tests, both static checks) and `npm run check` (0 errors/warnings,
360 files) afterward to confirm the cleanup left the tree exactly as
TASK-017 left it.
