---
id: SPEC-004
type: spec
status: draft
parent: FEAT-001
depends_on: [SPEC-001]
supersedes: []
---

# SPEC-004

## Intent

Provide the persistent application shell — global header, sidebar
navigation, and responsive mobile behavior — that every page in this
Program renders inside, so navigation is consistent and every future page
only has to supply its own content.

## Requirements

### R1 — Global header renders per spec

A 56px sticky header renders with: brand mark (32×32px, slate-900 bg,
white `lucide:layers` icon, 8px radius) and brand name "Pregoeiros"; a
global search input slot (576px max width desktop, placeholder "Buscar
produtos, fornecedores, contratações... (Pressione / ou ⌘K)"); header
action icon buttons (~32–36px square). The header has a white background
and a slate-200 bottom border.

### R2 — Sidebar renders the documented navigation hierarchy

On desktop (`md` and above), a 256px sidebar (slate-50 background,
slate-200 right border) renders navigation groups in this order: Primary
(Visão geral, Radar), EXPLORAR (Contratações, Produtos & Serviços,
Fornecedores, Contratos & Vigências), ACOMPANHAR (Favoritos, Interesses),
ANALISAR (Histórico Observado, Preços Praticados). Group labels use the
documented 10px uppercase slate-400 style. Only routes actually
implemented by this Program are enabled links; routes not yet built
(Radar, Contratos & Vigências, Interesses, Histórico Observado) render as
visibly present but non-navigable/disabled entries, never as broken links.

### R3 — Active route is visually indicated

The sidebar item matching the current route renders in the documented
"selected" style (white background, slate-200 border, slate-900 text,
subtle shadow) distinct from the default and hover states.

### R4 — Mobile navigation becomes an off-canvas drawer

Below the `md` breakpoint, the sidebar is hidden by default and opened via
a header menu control (`lucide:menu`). Opening it shows a slate-900/40%
backdrop. The drawer closes when: a navigation item is selected, the
backdrop is clicked, or Escape is pressed.

### R5 — Sidebar data-status panel renders

The bottom of the sidebar shows a "PostgreSQL Cache" status card reflecting
actual database connectivity (e.g. "Conectado" when the app's DB connection
is healthy), styled per KNOW-010 (white outer region, slate-50 card,
slate-200 border, 10–11px text).

## Acceptance Scenarios

- **Given** a desktop viewport, **when** any implemented page loads,
  **then** the 56px header and 256px sidebar render with the current
  route's nav item visually marked as selected.
- **Given** a viewport narrower than the `md` breakpoint, **when** the page
  loads, **then** the sidebar is not visible until the menu control is
  tapped, at which point it slides in over a dimmed backdrop.
- **Given** the mobile drawer is open, **when** the user presses Escape or
  taps the backdrop, **then** the drawer closes.
- **Given** the database is reachable, **when** the sidebar status panel
  renders, **then** it shows "Conectado"; given the database is
  unreachable, it reflects a non-healthy state rather than falsely
  claiming connection.
- **Given** a sidebar entry for a route not yet implemented (e.g. Radar),
  **when** a user views the sidebar, **then** the entry is visibly present
  but does not navigate to a broken or missing page.

## Edge Cases

- Very narrow screens hide the "Compras.gov" source badge in the header
  per KNOW-009, without breaking header layout.
- Keyboard-only navigation must be able to open, navigate within, and close
  the mobile drawer without a mouse (Tab order, Enter/Space activation,
  Escape to close).

## Constraints

- Depends on SPEC-001 for every visual primitive used (colors, typography,
  spacing, `Button`/`IconButton`/`Drawer` components) — this Spec does not
  define new tokens.
- WCAG 2.2 AA: focus must be visible and trapped appropriately when the
  drawer is open; drawer close must restore focus to the triggering
  control.
- Global search shortcuts (`/`, `⌘K`/`Ctrl+K`) must not interfere with
  typing inside any input field.

## Non-Goals

- Actual global search results/behavior — only the input slot and focus
  shortcuts are in scope; wiring it to real search results is a concern of
  whichever Feature implements searchable entities.
- Radar unread badge logic, sync timestamp content, or any other
  data-driven sidebar content beyond the DB-connectivity status panel —
  those belong to the Features that own that data.

## Unresolved Questions

None — this Spec's requirements are fully grounded in KNOW-009/KNOW-010.

## Sources

[[KNOW-009]] (header/sidebar/brand/search visual spec), [[KNOW-010]]
(navigation IA, mobile drawer behavior, sidebar data status, keyboard
shortcuts, accessibility).
