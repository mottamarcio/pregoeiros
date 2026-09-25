---
id: SPEC-003
type: spec
status: draft
parent: FEAT-001
depends_on: [SPEC-001]
supersedes: []
---

# SPEC-003 — App Shell, Navigation and Global Interactions

## Intent

Deliver the PoC-parity application shell every page lives in:

- design tokens and fonts;
- header and grouped sidebar with pluggable counters;
- responsive drawer;
- the mandatory source citation;
- global keyboard shortcuts;
- toast and modal primitives;
- the error page;
- pt-BR formatting utilities.

It meets WCAG 2.1 AA in a light theme.

## Requirements

### R1 — Design tokens and typography

Tailwind v4 declares, in `@theme`:

- a `brand` color scale equal to the slate values — 50 `#f8fafc`, 100 `#f1f5f9`, 200 `#e2e8f0`, 300 `#cbd5e1`, 400 `#94a3b8`, 500 `#64748b`, 600 `#475569`, 700 `#334155`, 800 `#1e293b`, 900 `#0f172a`, 950 `#020617`;
- `--font-sans` = Inter;
- `--font-mono` = JetBrains Mono.

The document uses `lang="pt-BR"` and a `slate-50` body background. Only a light theme exists.

### R2 — Build-time icons

Icons come from the Lucide set via `unplugin-icons` (`@iconify-json/lucide`), compiled at build time. Loading any page makes no network request to `api.iconify.design` or any other icon CDN.

### R3 — Single layout

The root `+layout.svelte` renders header, sidebar and main content for every route; no route duplicates the shell. Chrome data comes from `+layout.server.ts` through `data`, never from global client stores.

### R4 — Sidebar navigation

The sidebar shows, in this order and with these pt-BR labels:

- Top: "Fila de Triagem" (`/`), "Alertas & Radar" (`/radar`).
- Group "Oportunidades & Mercado": "Oportunidades (Editais)" (`/oportunidades`), "Produtos & Serviços" (`/produtos`), "Concorrentes & Vencedores" (`/fornecedores`), "Contratos a Vencer" (`/contratos`).
- Group "Acompanhamento & Decisão": "Alertas Salvos" (`/alertas`), "Em Disputa / Salvos" (`/salvos`).
- Group "Inteligência de Preços": "Preços Praticados" (`/precos`), "Histórico Observado" (`/historico`).

The item matching the current path is visually active and carries `aria-current="page"`. *Assumption: until a Feature delivers its route, the link resolves to the standard 404 page (no placeholder pages).*

### R5 — Pluggable counters

`+layout.server.ts` gathers sidebar and header counters from a registry of counter providers, each keyed by nav item or header slot. A slot without a registered provider renders no badge — not "0" and not an error. A provider that throws is logged, and its badge is hidden without breaking the page.

### R6 — Header

The header shows:

- the brand "Pregoeiros" with subtitle "Triagem de Editais";
- a global-search trigger showing the `⌘K` hint;
- a "last collection" slot;
- a radar badge slot.

Slots with no provider (the values come from FEAT-003 and FEAT-006) are hidden.

### R7 — Source citation

The sidebar footer always shows a "Fontes Coletadas" block containing the text "Compras.gov.br — federal e adesões (Lei 14.133/21)". The text comes from one exported constant that the sources modal (FEAT-003) also uses. No UI string contains "Estaduais" or "Cobertura: Nacional" (D-01).

### R8 — Responsive drawer

- At viewports narrower than Tailwind's `lg` breakpoint (1024 px), the sidebar is hidden, and a menu button opens it as a drawer over a backdrop.
- Clicking the backdrop, activating a nav link, or pressing Escape closes the drawer.
- At `lg` and above, the sidebar is always visible and the menu button is not rendered.

### R9 — Global keyboard shortcuts

- `⌘K` (macOS) or `Ctrl+K` focuses and selects the global-search input, preventing the browser default.
- `/` does the same only when focus is not in an `input`, `textarea`, `select` or `contenteditable` element.
- `Escape` closes the topmost open layer (modal, drawer or dropdown).

### R10 — Toast

`toast(message)` shows a notification at the bottom-right with `role="status"` and `aria-live="polite"`. It disappears after 3 seconds. A new toast replaces the one currently shown. *Assumption: single toast, as in the PoC.*

### R11 — Modal shell

A reusable modal component renders `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing at its title. It traps focus while open, closes on Escape and on its close button, and returns focus to the element that opened it.

### R12 — Error page

`+error.svelte` renders inside the shell in pt-BR. 404 shows "Página não encontrada" with a link to "Fila de Triagem"; any other status shows a generic pt-BR message and the status code. No stack trace or internal error detail is ever rendered.

### R13 — pt-BR formatting utilities

Pure, unit-tested functions:

- `formatCurrency(1840000)` → `R$ 1.840.000,00`;
- `formatDate` → `28/09/2026`;
- `formatDateTime` → `28/09/2026 às 10:00`.

Dates and times are rendered in `America/Sao_Paulo` regardless of the server or browser timezone.

### R14 — Accessibility baseline (WCAG 2.1 AA)

An automated axe-core scan in Playwright reports zero WCAG 2.1 A/AA violations for the shell at desktop and mobile widths. Every icon-only button has an accessible name (`aria-label`). All shell interactions are operable by keyboard alone.

## Acceptance Scenarios

- **Given** any page at desktop width, **when** it loads, **then** header, the grouped sidebar with the exact labels and order of R4, and the source citation are visible.
- **Given** the user is on `/oportunidades`, **when** the sidebar renders, **then** "Oportunidades (Editais)" is active with `aria-current="page"` and no other item is.
- **Given** no counter provider is registered, **when** the layout renders, **then** no badge is shown for any nav item or header slot.
- **Given** a registered provider that throws, **when** the layout renders, **then** the page still renders, that badge is hidden, and an error is logged.
- **Given** focus is on the page body, **when** the user presses `/`, **then** the global-search input receives focus. **Given** focus is inside a text input, **when** `/` is pressed, **then** the character is typed and focus does not move.
- **Given** an open modal launched from a button, **when** the user presses Escape, **then** the modal closes and focus returns to that button.
- **Given** a 390 px wide viewport, **when** the user taps the menu button, **then** the drawer opens with a backdrop; **when** the backdrop is tapped, **then** it closes.
- **Given** a request to an unknown path, **when** it renders, **then** the 404 page shows "Página não encontrada" inside the shell with a link to the queue.
- **Given** the shell at desktop and mobile widths, **when** the axe scan runs, **then** it reports zero WCAG 2.1 AA violations.
- **Given** a page load with network logging, **when** it completes, **then** no request targets an icon CDN.

## Edge Cases

- Both a modal and the drawer open: Escape closes only the topmost (the modal).
- `⌘K` pressed while a modal is open: the modal stays open; the search input focuses only if it is not inert behind the modal. *Assumption: the modal's focus trap takes precedence; the shortcut is ignored while a modal is open.*
- Rapid successive toasts: only the latest is visible; its 3-second timer restarts.
- Very long sidebar labels or counts (e.g. "1.482") must not break the layout at 320 px width.
- `formatCurrency` for negative values, `0` and `null`: `null` renders "—"; `0` renders `R$ 0,00`.
- `formatDateTime` near midnight in UTC must still render the correct São Paulo calendar day.

## Constraints

- Constitution: pt-BR UI; keyboard-operable interactions; labelled icon-only controls; server data through `load`; the source is always cited; no coverage claims.
- Decisions D-01, D-26a, D-26c, D-41.
- Project owner decisions (2026-09-25): citation in the sidebar footer and sources modal; light theme only; Tailwind default breakpoints with the drawer below `lg`; WCAG 2.1 AA target.

## Non-Goals

- The content of any page (FEAT-004…FEAT-010).
- The global-search behavior and results (FEAT-005); this Spec provides only the input and its focus shortcut.
- The values of the counters, the last collection or the radar badge (their Features register providers).
- The sources modal content (FEAT-003).
- Dark mode.

## Unresolved Questions

- None.

## Sources

- [[KNOW-017]] design system, shell, keyboard, accessibility
- [[KNOW-003]] source citation and forbidden claims
- [[KNOW-015]] single layout, `load` over stores, formatting conventions
- [[KNOW-029]] accessibility NFR
- [[KNOW-030]] PoC shell reference
- `ai/raw/06-DECISOES.md` D-01, D-26, D-41
