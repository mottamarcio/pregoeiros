---
id: KNOW-017
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-017 — UI Design System, App Shell and Accessibility

## Summary

The production UI must reach visual parity with the PoC: a slate-based Tailwind
palette, Inter + JetBrains Mono, Lucide icons via Iconify, a single app shell
(header + grouped sidebar), semantic status colors, and keyboard-first
interaction (⌘K, `/`, Escape).

## Known Facts

- **Tailwind tokens** (declared in `@theme` under Tailwind v4 per D-26a; the spec shows them in v3 `tailwind.config` form): `brand` colors = slate scale — 50 `#f8fafc`, 100 `#f1f5f9`, 200 `#e2e8f0`, 300 `#cbd5e1`, 400 `#94a3b8`, 500 `#64748b`, 600 `#475569`, 700 `#334155`, 800 `#1e293b`, 900 `#0f172a`, 950 `#020617`. `fontFamily.sans = ['Inter','sans-serif']`, `fontFamily.mono = ['JetBrains Mono','monospace']`.
- PoC loads Inter (400/500/600/700) and JetBrains Mono (400/500/600) from Google Fonts; `<html lang="pt-BR">` with `bg-slate-50 text-slate-900`.
- Primary buttons: `bg-slate-900 hover:bg-slate-800 text-white`. Surfaces: white + `slate-200` borders; sidebar `slate-50`.
- **Status colors:** GO `emerald`; análise `amber`; NO-GO `red`; urgent `red`. Radar unread dot emerald. Retificação feed dot amber.
- Numbers, codes, dates and money use the mono font in the PoC.
- Tailwind `forms` plugin "if necessary".
- **Icons:** Lucide set via Iconify (e.g. `lucide:clipboard-check`, `lucide:radar`, `lucide:bell`, `lucide:star`, `lucide:bookmark`, `lucide:refresh-cw`, `lucide:database`, `lucide:line-chart`, `lucide:trash-2`). Wrapped in `$lib/icons.ts`; delivered via `unplugin-icons` + `@iconify-json/lucide` (D-26c).
- **App shell (PoC):**
  - Header: brand "Pregoeiros — Triagem de Editais", global search with `⌘K` hint, "Última Coleta: Hoje, 03:15", source label (PoC "Base Federal e Estaduais" replaced per D-01 by "Compras.gov.br — federal e adesões"), radar badge.
  - Sidebar top: "Fila de Triagem" (N pendentes), "Alertas & Radar" (N novos).
  - Group "Oportunidades & Mercado": Oportunidades (Editais), Produtos & Serviços, Concorrentes & Vencedores, Contratos a Vencer.
  - Group "Acompanhamento & Decisão": Alertas Salvos (count), Em Disputa / Salvos (count).
  - Group "Inteligência de Preços": Preços Praticados, Histórico Observado.
  - Footer: "Fontes Coletadas — Operando" + source note; opens the sources modal.
  - Toast: bottom-right, `bg-slate-900` white text, auto-hides after 3 s.
- Sidebar counters come from `+layout.server.ts` (cheap aggregates only).
- **Keyboard & accessibility:**
  - `⌘K` / `Ctrl+K` focuses search; `/` also, if focus is not in an input.
  - `Escape` closes modals and dropdowns.
  - Mobile sidebar with backdrop.
  - `aria-label` on icon-only buttons.
  - Slate contrast; labels on icons.
- UI language pt-BR; dates shown as `28/09/2026 às 10:00`; money as BRL via `Intl.NumberFormat('pt-BR')`.
- Toast messages in pt-BR reuse PoC copy.
- **Decision D-41:** production follows the `aria-label` rule on every icon-only button; the PoC is not an accessibility reference.

## Constraints

- One `+layout.svelte` with sidebar; no per-view layout duplication.
- Keyboard shortcuts (⌘K, Escape, `/`) are an explicit NFR.

## Unknowns

- Dark mode — not mentioned anywhere.
- Responsive breakpoints beyond "mobile sidebar with backdrop".
- Specific WCAG target level — not stated.

## Conflicts

- None remaining. PoC accessibility gap resolved by D-41; header coverage label resolved by D-01.

## Provenance

- Accessibility NFR and pt-BR: `ai/raw/01-PRD.md` §5.
- Tokens, button/surface/state colors, keyboard, dates/money: `ai/raw/03-TECHNICAL_SPECS.md` §1.1, §11, §12, §15.
- Fonts, shell, sidebar groups, icons, toast, keyboard handler: `ai/raw/pregoeiros.html` (`<head>`, tailwind.config, header/aside markup, `showToast`, keydown listener).
- Decisions D-01, D-26a, D-26c, D-41: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-007]] global search
- [[KNOW-016]] tech stack
- [[KNOW-030]] PoC reference
