---
id: KNOW-009
type: knowledge
status: active
sources:
  - path: ai/raw/uiux-specification.md
    fingerprint: sha256:b408cfa091b5c325182f3ecfdd59f7973fe7b8f8c6a5cc3dae6e7b2d305bbf54
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:45d65300ce5243505c8fc1b0330848f4a33ace6aced788b7221f8643e6cfc791
---

# KNOW-009

## Summary

Pregoeiros' visual identity is a light-only, slate-dominant, data-dense
"professional research/intelligence tool" aesthetic — explicitly not a
government portal, colorful SaaS dashboard, or banking app. `slate-900` is
the single primary accent; semantic color (emerald/blue/amber/red) is used
sparingly and only to communicate state.

## Known Facts

- **Theme**: light theme only for the MVP (`Theme: Light only` in the UI/UX
  spec header). Desired characteristics: compact, precise, quiet, analytical,
  professional, data-dense, fast, trustworthy. Undesired: colorful, playful,
  marketing-heavy, oversized, decorative, "card-everything",
  animation-heavy, generic SaaS.
- **Core visual formula**: white canvas + slate structure + slate-900 actions
  + thin borders + compact typography + monospace data + sparse semantic
  color + dense tables + clear provenance.
- **Primary slate palette** (with hex and usage): slate-50 `#f8fafc`
  secondary surfaces; slate-100 `#f1f5f9` hover/badges; slate-200 `#e2e8f0`
  borders; slate-300 `#cbd5e1` strong borders/disabled; slate-400 `#94a3b8`
  tertiary text; slate-500 `#64748b` secondary text; slate-600 `#475569`
  nav/secondary controls; slate-700 `#334155` strong secondary text;
  slate-800 `#1e293b` primary button hover; slate-900 `#0f172a` primary
  accent; slate-950 `#020617` highest-emphasis text. Base tokens (PRD/arch
  spec, consistent with UI/UX spec): background white, surface slate-50,
  border slate-200, text slate-950/900, text-muted slate-500/600, accent
  slate-900, accent-contrast/foreground white.
- **Semantic colors** (used sparingly): success/positive = Emerald (e.g.
  "Resultado Homologado", "Conectado", "OK", unread/new counters);
  information/active = Blue (e.g. "Publicada", new procurement activity);
  attention = Amber (e.g. "Vencimento em 60 dias", terminology/info
  notices — amber-50 bg / amber-200 border / amber-900 text); critical =
  Red (e.g. "Vencimento em 30 dias", destructive hover) — red must not be
  used for ordinary emphasis.
- **Typography**: primary typeface Inter (weights 400/500/600/700) for
  navigation, headings, labels, forms, tables. Monospace typeface JetBrains
  Mono for machine-oriented/structured data: CNPJ, UASG, CATMAT, CATSER,
  process numbers, contract numbers, metadata dates, monetary values in
  tables, counts, IDs, sync statistics — never for ordinary prose.
- **Type scale**: Display/KPI and Dashboard title 24px/bold (`text-2xl`);
  standard page title 20px/bold (`text-xl`); detail title 18px/bold
  (`text-lg`); card heading 14px/600–700 (`text-sm`); standard UI text 12px
  (`text-xs`, default for buttons/table cells/filters/nav); metadata 11px;
  microcopy 10px (table headings, category labels, codes, tiny badges — must
  remain readable, never carry critical info alone). Typical body text sizes
  range 10–14px generally.
- **Text colors**: primary `text-slate-900`; max emphasis `text-slate-950`;
  secondary `text-slate-600`; muted `text-slate-500`; tertiary metadata
  `text-slate-400`. Avoid pure black.
- **Spacing**: Tailwind 4px scale as base (1=4px micro gaps … 8=32px page
  sections). Page padding: 16px mobile, 24px small desktop/tablet, 32px
  large desktop (`p-4 sm:p-6 lg:p-8`). Content width: standard analytical
  pages max-w-6xl (1152px); focused workflow pages max-w-5xl (1024px),
  horizontally centered.
- **Radius**: small badge 4–6px; standard control 8px (`rounded-lg` —
  inputs, buttons, selects, nav items, small cards); container/card 12px
  (`rounded-xl` — panels, analytical cards, modals); pills full radius
  (statuses, counts, notifications).
- **Borders/shadows**: default border 1px solid slate-200; hover slate-300;
  selected data card slate-900. Borders provide most separation; shadows are
  secondary (`shadow-xs` standard controls/cards, `shadow-xl` modal,
  `shadow-2xl` large detail modal) — no large shadows on ordinary cards.
- **Icons**: provider Iconify, preferred collection Lucide. Sizes: micro
  14px, standard/navigation 16px, header action/modal icon 18px, major icon
  20px. Icons must not replace text where the action would be ambiguous;
  icon-only controls require accessible labels/tooltips.
- **Application shell**: 56px sticky global header (white bg, slate-200
  bottom border, 16px horizontal padding) + 256px sidebar (slate-50 bg,
  slate-200 right border, 12px internal padding, nav groups separated by
  24px) + main content area. Brand mark 32×32px, slate-900 bg, white
  icon (`lucide:layers`), 8px radius; brand name "Pregoeiros" Inter Bold
  16px; adjacent source badge "Compras.gov" (11px, slate-500 text,
  slate-100 bg, slate-200 border), hidden on very narrow screens.
- **Global search**: max width 576px desktop; placeholder "Buscar produtos,
  fornecedores, contratações... (Pressione / ou ⌘K)"; slate-50 bg,
  slate-200 border, 8px radius, ~32px height; focus state = white bg +
  slate-900 border + 1px slate-900 focus ring; shortcuts `/`, `⌘K`
  (macOS), `Ctrl+K` (Windows/Linux); Enter performs search.
- **Components/library** (converged from PRD's "small internal library" and
  UI/UX spec's suggested component names): Button, IconButton, Input,
  Select, Combobox, Badge/StatusBadge, Card/MetricCard, Table/DataTable,
  Pagination, Tabs, Dialog/Modal/ConfirmDialog, Drawer, Dropdown, Tooltip,
  EmptyState, Skeleton, Alert/InlineAlert, Stat, DateRangePicker, plus
  domain components AppHeader, AppSidebar, PageHeader, GlobalSearch,
  FilterPanel, FavoriteButton, InterestCard, RadarEvent,
  FreshnessIndicator, ProcurementDetailModal, SyncStatusModal, Toast. A
  component enters the library only once it is actually reused — no
  premature abstraction. The same semantic action must always use the same
  component (e.g. all primary actions → `Button variant="primary"`, all
  favorites → `FavoriteButton`, all statuses → `StatusBadge`).
- **Design tokens**: implementation should centralize semantic tokens (e.g.
  `--color-bg`, `--color-surface`, `--color-border`, `--color-text*`,
  `--color-accent*`, `--radius-control`, `--radius-container`) only where
  Tailwind utilities alone become repetitive — avoid dozens of custom tokens
  that just duplicate Tailwind.
- **Charts**: supporting components, not the primary interface; appropriate
  for price history, volume over time, supplier/buyer distribution. Every
  chart should have an accessible tabular/textual representation where
  practical (see [[KNOW-008]]).
- The interactive HTML prototype (`ai/raw/pregoeiros.html`) implements this
  palette/typography/spacing directly (Tailwind utility classes matching the
  documented tokens), serving as a working visual reference for the
  documented design system rather than introducing new visual rules.

## Constraints

- `slate-900` is the mandatory primary accent (also an MVP architecture
  constraint, see [[KNOW-002]]).
- No comfortable/compact density toggle in the initial release — density is
  fixed and intentionally compact (~40px table rows).
- Motion must be functional only: modal fade/scale, drawer slide, toast
  slide/fade, subtle spinner, skeleton pulse are permitted; bouncing, large
  transforms, decorative entrance animations, and parallax are not.
  `prefers-reduced-motion` must be respected. Hover transitions ~150–200ms,
  mostly `transition-colors`; avoid scaling cards/buttons on hover.

## Unknowns

- No explicit dark-theme plan exists — light-only is stated as an MVP scope
  decision without a stated timeline for a dark theme.

## Conflicts

None — PRD, architecture spec, and UI/UX spec agree on palette, accent, and
typography; the UI/UX spec is simply the more detailed elaboration.

## Provenance

- Base palette/component list: `ai/raw/product-requirements-specification.md` §4.
- Styling/icon MVP constraints: `ai/raw/architecture-specification.md` §43–45, §67.
- Full color system, typography, spacing, radius, shadows, icons, shell,
  component naming, tokens, motion: `ai/raw/uiux-specification.md` §2–21, §125–126, §136, §139–141, §146.
- Confirming interactive prototype: `ai/raw/pregoeiros.html`.

## Related Topics

[[KNOW-002]], [[KNOW-008]], [[KNOW-010]]
