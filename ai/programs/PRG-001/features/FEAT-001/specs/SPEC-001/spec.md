---
id: SPEC-001
type: spec
status: draft
parent: FEAT-001
depends_on: []
supersedes: []
---

# SPEC-001

## Intent

Establish the design-system foundation (color tokens, typography, spacing/
radius scale, and the initial shared component set) that every other Spec
in this Program builds its UI on, so no page implements bespoke styling or
duplicates a component that should be shared.

## Requirements

### R1 — Color tokens are centrally defined and match the documented palette

The application defines centralized color tokens for background (white),
surface (slate-50), border (slate-200), text (slate-900/950), muted text
(slate-500/600), tertiary text (slate-400), and accent (slate-900, with
slate-800 hover), plus semantic tokens for success (emerald), info (blue),
warning (amber), and danger (red). No component hardcodes a raw Tailwind
color class where a token exists.

### R2 — Typography matches the documented type scale

Inter is loaded and used for navigation, headings, labels, forms, and
tables at the documented sizes (24px display/KPI and dashboard title, 20px
standard page title, 18px detail title, 14px card heading, 12px standard UI
text, 11px metadata, 10px microcopy). JetBrains Mono is loaded and used
exclusively for machine-oriented/structured values (IDs, codes, monetary
values in tables, counts) — never for ordinary prose.

### R3 — Spacing, radius, and border tokens match the documented scale

Spacing follows Tailwind's 4px scale. Border radius follows: 4–6px small
badges, 8px standard controls (`rounded-lg`), 12px containers/cards
(`rounded-xl`), full radius pills. Default border is 1px solid slate-200,
hover slate-300, selected slate-900.

### R4 — Initial shared component set exists and is reused, not duplicated

At minimum, `Button` (primary/secondary/tertiary/destructive variants),
`IconButton`, `Input`, `Select`, `Badge`/`StatusBadge`, `Card`,
`Table`/`DataTable`, `Pagination`, `Tabs`, `Dialog`/`Modal`, `Drawer`,
`Tooltip`, `EmptyState`, `Skeleton`, `Alert`/`InlineAlert`, and `Toast`
exist as components under `src/lib/components/ui/`. Every call site that
needs one of these UI patterns uses the shared component — none reimplement
the pattern with ad-hoc markup/classes.

### R5 — Light theme only, `slate-900` accent, no dark-mode code path

The application renders correctly and exclusively in light theme. No
dark-mode media query, toggle, or token override exists in this scope.

## Acceptance Scenarios

- **Given** a developer inspects any two buttons of the same variant
  anywhere in the app, **when** comparing their markup, **then** both
  render via the same `Button` component with identical token-driven
  styling (no divergent hand-rolled classes).
- **Given** a table displaying a monetary value or an ID, **when** the
  value renders, **then** it uses the JetBrains Mono token/class, and
  ordinary prose elsewhere does not.
- **Given** the browser or OS is set to dark mode, **when** Pregoeiros
  loads, **then** it still renders with the light palette (background
  white, accent slate-900) — never adapting to a dark scheme.
- **Given** a developer needs a new one-off visual pattern, **when** it is
  only used once, **then** it is implemented inline rather than added to
  the shared component library (component library only grows on genuine
  reuse).

## Edge Cases

- A page needs a UI pattern not yet in the shared set (e.g. a
  `DateRangePicker` or `Combobox`) — only build it when a concrete
  consuming Spec actually requires it; do not pre-build the full component
  list speculatively (KNOW-009).
- Long CATMAT/CNPJ/UASG values in monospace must not overflow their
  container — truncation is acceptable visually only if the full value
  remains available via tooltip/copy (per KNOW-010), which this Spec's
  components must support as a prop/pattern.

## Constraints

- `slate-900` MUST be the primary accent; this is a Constitution invariant,
  not a preference.
- WCAG 2.2 AA applies to every shared component: visible keyboard focus
  (slate-900 ring), accessible names for icon-only controls, adequate
  contrast.
- Motion is limited to functional transitions only (modal fade/scale,
  drawer slide, toast slide/fade, spinner, skeleton pulse) at ~150–200ms;
  `prefers-reduced-motion` must be respected.

## Non-Goals

- Domain-specific components (`FavoriteButton`, `InterestCard`,
  `RadarEvent`, `FreshnessIndicator`, `ProcurementDetailModal`,
  `SyncStatusModal`) — built by the Specs that actually need them
  (FEAT-003 through FEAT-007), not here.
- Dark theme support of any kind.
- A configurable density mode (comfortable/compact) — one fixed compact
  density only.

## Unresolved Questions

None — this Spec's requirements are fully grounded in KNOW-009 and the
Constitution.

## Sources

[[KNOW-009]] (color system, typography, spacing, radius, component naming,
motion rules), Constitution `Compatibility Requirements` (light theme,
`slate-900` accent, WCAG 2.2 AA) and `Quality Requirements` (component
reuse threshold, one-component-per-semantic-action).
