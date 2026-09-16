# Pregoeiros — UI/UX Specification

**Status:** Draft
**Version:** 1.0
**Product:** Pregoeiros
**Application language:** Brazilian Portuguese (`pt-BR`)
**Specification language:** English
**Target implementation:** Svelte 5 / SvelteKit 5 / Tailwind CSS / Iconify
**Theme:** Light only
**Primary accent:** Slate 900

---

# 1. Purpose

This document defines the visual language, interaction patterns, component behavior, responsive rules, content standards, and UX principles for **Pregoeiros**.

Pregoeiros is a data-dense web application for exploring, monitoring, and analyzing Brazilian public procurement information.

The UI should feel closer to a professional research and intelligence tool than to a government portal or conventional dashboard.

The experience must prioritize:

* clarity;
* information density;
* traceability;
* precise terminology;
* fast navigation;
* efficient filtering;
* scanability;
* restrained visual hierarchy;
* confidence in data provenance and freshness.

The application UI is written in Brazilian Portuguese.

---

# 2. Design Principles

## 2.1 Data first

The interface exists to expose information, not decorate it.

Tables, filters, values, identifiers, dates, status, provenance, and analytical context receive visual priority.

Decorative illustrations should generally be avoided.

---

## 2.2 Dense, but not cramped

Pregoeiros is intended for repeated professional use.

The UI should expose more information per viewport than a consumer application while maintaining enough spacing to distinguish groups.

Typical text sizes range from 10px to 14px.

Large typography should be reserved for:

* page titles;
* primary KPIs;
* important monetary values.

---

## 2.3 Neutral by default

Slate is the dominant visual language.

Color communicates meaning rather than decoration.

The interface should mostly consist of:

* white;
* slate-50;
* slate-100;
* slate-200;
* slate-500;
* slate-700;
* slate-900/950.

Emerald, blue, amber, and red are semantic colors.

---

# 3. Visual Identity

The visual identity is intentionally understated.

Pregoeiros should communicate:

* precision;
* technical competence;
* reliability;
* analytical depth.

It should not resemble:

* a marketing website;
* a colorful SaaS dashboard;
* a banking app;
* a government website;
* a generic admin template.

---

# 4. Color System

## 4.1 Primary Slate Palette

| Token       | Value     | Primary usage                     |
| ----------- | --------- | --------------------------------- |
| `slate-50`  | `#f8fafc` | Secondary surfaces                |
| `slate-100` | `#f1f5f9` | Hover backgrounds, badges         |
| `slate-200` | `#e2e8f0` | Borders                           |
| `slate-300` | `#cbd5e1` | Strong borders / disabled states  |
| `slate-400` | `#94a3b8` | Tertiary text                     |
| `slate-500` | `#64748b` | Secondary text                    |
| `slate-600` | `#475569` | Navigation and secondary controls |
| `slate-700` | `#334155` | Strong secondary text             |
| `slate-800` | `#1e293b` | Primary button hover              |
| `slate-900` | `#0f172a` | Primary accent                    |
| `slate-950` | `#020617` | Highest-emphasis text             |

---

# 5. Semantic Colors

Semantic colors must be used sparingly.

## Success / positive state

Use Emerald.

Typical tokens:

* `emerald-50`
* `emerald-100`
* `emerald-500`
* `emerald-600`
* `emerald-700`
* `emerald-800`

Examples:

**"Resultado Homologado"**

**"Conectado"**

**"OK"**

**"4 não vistos"**

**"7 novos"**

---

## Information / active procurement

Use Blue.

Typical examples:

**"Publicada"**

New procurement activity may also use blue.

---

## Attention

Use Amber.

Examples:

**"Vencimento em 60 dias"**

Informational warnings and terminology notices may use:

* `amber-50` background;
* `amber-200` border;
* `amber-900` text.

---

## Critical / urgent

Use Red.

Examples:

**"Vencimento em 30 dias"**

Destructive hover states may also use red.

Red should not be used for ordinary emphasis.

---

# 6. Backgrounds

Primary application background:

`white`

Secondary surfaces:

`slate-50`

The application should avoid large tinted areas.

A typical hierarchy is:

```text
Page
└── white
    ├── card → white
    ├── analytical region → slate-50
    ├── table header → slate-50
    └── sidebar → slate-50
```

---

# 7. Selection

Browser text selection should use:

```text
background: slate-900
text: white
```

---

# 8. Typography

## Primary Typeface

**Inter**

Usage:

* navigation;
* headings;
* labels;
* descriptions;
* buttons;
* forms;
* tables.

Font weights:

* 400 — normal
* 500 — medium
* 600 — semibold
* 700 — bold

---

# 9. Monospace Typeface

**JetBrains Mono**

Use for machine-oriented or highly structured information:

* CNPJ;
* UASG;
* CATMAT;
* CATSER;
* process numbers;
* contract numbers;
* dates when displayed as metadata;
* monetary values in tables;
* counts;
* IDs;
* synchronization statistics.

Example:

```text
CATMAT 482910
UASG 090028
01.076.218/0001-65
R$ 5.480,00
```

Do not use monospace for ordinary prose.

---

# 10. Type Scale

## Display / KPI

24px / `text-2xl`

Weight: 700.

Examples:

```text
12.483
R$ 142.800.000,00
87
```

---

## Dashboard title

24px / `text-2xl`

Weight: 700.

Copy:

**"Pregoeiros"**

---

## Standard page title

20px / `text-xl`

Weight: 700.

Examples:

**"Contratações"**

**"Fornecedores"**

**"Radar"**

**"Favoritos"**

---

## Detail title

18px / `text-lg`

Weight: 700.

---

## Card heading

14px / `text-sm`

Weight: 600–700.

---

## Standard UI text

12px / `text-xs`.

This is the default size for:

* buttons;
* table cells;
* filters;
* card content;
* navigation.

---

## Metadata

11px.

Use for:

* secondary values;
* timestamps;
* helper copy;
* supporting descriptions.

---

## Microcopy

10px.

Use for:

* table headings;
* category labels;
* codes;
* tiny badges;
* tertiary metadata.

Microcopy must remain readable and should never carry critical information alone.

---

# 11. Text Colors

Primary:

`text-slate-900`

Maximum emphasis:

`text-slate-950`

Secondary:

`text-slate-600`

Muted:

`text-slate-500`

Tertiary metadata:

`text-slate-400`

Avoid using pure black.

---

# 12. Spacing System

Use Tailwind's 4px spacing scale as the base.

Core spacing values:

| Token | px | Typical use              |
| ----- | -: | ------------------------ |
| `1`   |  4 | micro gaps               |
| `1.5` |  6 | icon/text gap            |
| `2`   |  8 | compact spacing          |
| `2.5` | 10 | compact item padding     |
| `3`   | 12 | controls / table spacing |
| `3.5` | 14 | filter containers        |
| `4`   | 16 | standard layout spacing  |
| `5`   | 20 | cards                    |
| `6`   | 24 | major groups             |
| `8`   | 32 | page sections            |

---

# 13. Page Padding

Main content:

Mobile:

```text
16px
```

Small desktop/tablet:

```text
24px
```

Large desktop:

```text
32px
```

Equivalent:

```text
p-4 sm:p-6 lg:p-8
```

---

# 14. Content Width

Standard analytical pages:

```text
max-width: 1152px
```

Equivalent:

`max-w-6xl`

Focused workflow pages:

```text
max-width: 1024px
```

Equivalent:

`max-w-5xl`

Content remains horizontally centered.

---

# 15. Border Radius

## Small badge

4–6px.

## Standard control

8px / `rounded-lg`.

Used for:

* inputs;
* buttons;
* selects;
* nav items;
* small cards.

## Container/card

12px / `rounded-xl`.

Used for:

* panels;
* analytical cards;
* modals;
* major content containers.

## Pills

Full radius.

Used for:

* statuses;
* counts;
* notifications.

---

# 16. Borders

Default border:

```text
1px solid slate-200
```

Hover:

```text
slate-300
```

Selected data card:

```text
slate-900
```

Borders should provide most component separation.

Shadows are secondary.

---

# 17. Shadows

Use shadows sparingly.

Standard controls/cards:

`shadow-xs`

Modal:

`shadow-xl`

Large detail modal:

`shadow-2xl`

Do not use large shadows for ordinary cards.

---

# 18. Icons

Icon provider:

**Iconify**

Preferred collection:

**Lucide**

Default sizes:

* micro: 14px
* standard: 16px
* navigation: 16px
* header action: 18px
* modal icon: 18px
* major icon: 20px

Icons must not replace text when the action would otherwise be ambiguous.

Icon-only controls require accessible labels/tooltips.

---

# 19. Application Shell

Desktop structure:

```text
┌───────────────────────────────────────────────┐
│ Global Header — 56px                         │
├──────────────┬────────────────────────────────┤
│ Sidebar      │                                │
│ 256px        │ Main content                   │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

---

# 20. Global Header

Height:

56px.

Background:

white.

Bottom border:

slate-200.

Behavior:

sticky at top.

Horizontal padding:

16px.

Z-index must remain above normal content.

---

# 21. Brand

Brand mark:

32 × 32px.

Background:

`slate-900`

Foreground:

white.

Radius:

8px.

Icon:

`lucide:layers`

Brand name:

**"Pregoeiros"**

Font:

Inter Bold, 16px.

Adjacent source badge:

**"Compras.gov"**

Style:

* 11px;
* slate-500;
* slate-100 background;
* slate-200 border.

Hide source badge on very narrow screens.

---

# 22. Global Search

Desktop search maximum width:

576px.

Placeholder:

**"Buscar produtos, fornecedores, contratações... (Pressione / ou ⌘K)"**

Background:

`slate-50`

Border:

`slate-200`

Radius:

8px.

Height should visually correspond to approximately 32px.

Search icon:

left aligned.

Keyboard hint:

right aligned.

Focus state:

* white background;
* `slate-900` border;
* 1px `slate-900` focus ring.

Keyboard shortcuts:

```text
/       focus search
⌘K      focus search on macOS
Ctrl+K  focus search on Windows/Linux
```

Pressing Enter performs the search.

---

# 23. Header Actions

Header actions are icon buttons approximately 32–36px square.

Examples:

Radar:

`lucide:bell`

System status:

`lucide:settings-2`

Hover:

```text
bg-slate-100
text-slate-900
```

Default:

```text
text-slate-600
```

---

# 24. Radar Notification Dot

Unread Radar events should produce a notification dot.

Size:

10px.

Color:

`emerald-600`.

White 2px ring separates the dot from the icon.

When there are no unread events, the dot disappears.

---

# 25. Synchronization Indicator

Visible on large screens.

Example:

**"Sync: Hoje, 03:15 | 2.381 lidos"**

Container:

* slate-50 background;
* slate-200 border;
* 8px radius;
* 12px text.

Live/healthy indicator:

8px emerald dot.

Structured numbers use JetBrains Mono.

---

# 26. Sidebar

Desktop width:

256px.

Background:

`slate-50`

Right border:

`slate-200`

Internal padding:

12px.

Major navigation groups separated vertically by 24px.

---

# 27. Sidebar Information Architecture

Navigation must follow this hierarchy.

### Primary

**"Visão geral"**

**"Radar"**

### Explorar

**"Contratações"**

**"Produtos & Serviços"**

**"Fornecedores"**

**"Contratos & Vigências"**

### Acompanhar

**"Favoritos"**

**"Interesses"**

### Analisar

**"Histórico Observado"**

**"Preços Praticados"**

The distinction between these pillars is important.

**Explorar** means finding public procurement information.

**Acompanhar** means persistent user-selected monitoring.

**Analisar** means historical or derived analysis.

---

# 28. Navigation Group Labels

Copy:

**"EXPLORAR"**

**"ACOMPANHAR"**

**"ANALISAR"**

Style:

* 10px;
* semibold;
* uppercase;
* increased letter spacing;
* slate-400.

---

# 29. Sidebar Navigation Item

Default:

```text
height ≈ 32px
padding-x 12px
padding-y 8px
radius 8px

text 12px medium
text-slate-600
```

Icon:

16px slate-500.

Hover:

```text
bg-slate-100
text-slate-900
```

Selected:

```text
bg-white
border-slate-200
text-slate-900
shadow-xs
```

---

# 30. Sidebar Counters

Examples:

**"12 novos"**

**"3"**

Unread Radar counter:

* emerald-100 background;
* emerald-800 text;
* pill shape;
* 10px semibold.

Simple numeric counters:

* JetBrains Mono;
* 10px;
* slate-400.

---

# 31. Sidebar Data Status

At the bottom of the sidebar, display local data availability.

Title:

**"PostgreSQL Cache"**

Healthy state:

**"Conectado"**

Supporting copy:

**"Índices Lei 14.133/21 sincronizados. Próximo job às 03:00."**

This panel uses:

* white outer region;
* slate-50 card;
* slate-200 border;
* 10–11px text.

---

# 32. Mobile Navigation

Below the `md` breakpoint, the sidebar becomes an off-canvas drawer.

The header displays:

`lucide:menu`

Opening the drawer reveals a backdrop:

```text
slate-900 / 40%
```

Selecting any navigation item closes the drawer.

The drawer should also close when:

* the backdrop is clicked;
* Escape is pressed where appropriate.

---

# 33. Page Header Pattern

Most pages use:

```text
Title                      Actions
Description
────────────────────────────────
```

Bottom padding:

16–20px.

Bottom border:

slate-200.

Standard title:

20px / bold / slate-950.

Description:

12px / slate-500.

Dashboard uses a larger 24px title.

---

# 34. Primary Button

Use for the dominant action in a context.

Examples:

**"Novo Interesse"**

**"Criar Novo Interesse"**

**"Criar Interesse"**

**"Salvar Interesse"**

Visual specification:

```text
background: slate-900
hover: slate-800
text: white
font-size: 12px
font-weight: 500
border-radius: 8px
padding: 8px 12px
```

Buttons may contain a 14px icon with a 6px gap.

---

# 35. Secondary Button

Example:

**"Sincronizar"**

**"Exportar CSV"**

**"Marcar todos como vistos"**

Style:

```text
background: white
border: slate-200
text: slate-700
hover background: slate-50
radius: 8px
```

---

# 36. Tertiary Button

Text-oriented action.

Examples:

**"Gerenciar"**

**"Limpar filtros"**

**"Ver resultados"**

Style:

* transparent background;
* 11–12px;
* slate-500/600.

Hover:

`slate-900`.

Underline may appear for link-like actions.

---

# 37. Icon Button

Use for:

* close;
* favorite;
* delete;
* menu;
* system status.

Minimum visual target should be approximately 32px.

Important mobile touch targets SHOULD be expanded toward 40–44px even if the icon itself remains 16–18px.

---

# 38. Destructive Action

Delete/remove actions should not appear red by default.

Default:

`text-slate-400`

Hover:

`text-red-600`

Examples:

* remove favorite;
* delete Interest.

Destructive confirmation SHOULD be introduced for actions that cannot be trivially restored.

---

# 39. Button Disabled State

Disabled controls:

```text
opacity: 50–60%
cursor: not-allowed
```

No hover effect.

Primary disabled button should remain recognizable as primary but visibly inactive.

---

# 40. Loading Button

During asynchronous action:

1. preserve button width;
2. replace or precede icon with spinner;
3. disable repeated clicks.

Recommended copy examples:

**"Salvando..."**

**"Sincronizando..."**

**"Exportando..."**

---

# 41. Inputs

Default:

```text
height: ~32–36px
padding-x: 12px
padding-y: 6–8px
text: 12px
background: white
border: slate-200
radius: 8px
```

Focus:

```text
border: slate-900
outline: none
```

Global search additionally uses a subtle focus ring.

---

# 42. Labels

Form label:

11–12px.

Weight:

500.

Color:

`slate-600` or `slate-700`.

Spacing below:

4px.

---

# 43. Helper Text

10px.

Color:

`slate-400`.

Example:

**"Rótulo que aparecerá no seu dashboard e nos alertas do Radar"**

Helper text should explain consequence or expected format rather than repeat the label.

---

# 44. Select Controls

Selects visually match text inputs.

Examples:

**"Todas as UFs"**

**"Todas"**

**"Brasil (Todas)"**

**"Todos os órgãos"**

Do not create a custom select unless native behavior proves insufficient.

---

# 45. Filter Panel

Complex filters should be grouped inside:

```text
bg-slate-50
border-slate-200
rounded-xl
padding 14–16px
```

Fields use a responsive grid.

Desktop procurement filter layout:

4 columns.

Mobile:

1 column.

Example fields:

**"Buscar por objeto / UASG"**

**"UF (Unidade da Federação)"**

**"Modalidade"**

**"Situação"**

---

# 46. Filter Result Footer

Filter panels may include a bottom row separated by a subtle border.

Left:

**"Exibindo 6 contratações"**

Right:

**"Limpar filtros"**

The result count should update immediately when filters change.

---

# 47. Cards

Default card:

```text
background: white
border: slate-200
radius: 12px
padding: 16–20px
```

Cards should not automatically have shadows.

Hoverable cards may change border from `slate-200` to `slate-300/400`.

---

# 48. Selected Card

For selectable product cards:

```text
border: slate-900
background: slate-50 / 50%
```

Unselected:

```text
border: slate-200
background: white
```

Hover:

`border-slate-400`.

---

# 49. KPI Cards

KPI card:

* slate-50 background;
* slate-200 border;
* 12px radius;
* 16px padding.

Label:

12px / slate-500.

Value:

24px / bold / monospace / slate-950.

Supporting text:

11px / slate-400.

---

# 50. Status Badges

Badges should generally use:

```text
padding-x: 8px
padding-y: 2px
font-size: 10px
border-radius: full
```

### Published

Copy:

**"Publicada"**

Style:

```text
blue-50
blue-700
blue-200 border
```

### Completed

Copy:

**"Resultado Homologado"**

Style:

```text
emerald-50
emerald-700
emerald-200 border
```

### Active rule

Copy:

**"Regra Ativa"**

Style:

```text
slate-100
slate-700
slate-200 border
```

---

# 51. Tables

Tables are a first-class UI pattern.

Default table:

12px text.

Header:

```text
background: slate-50
text: slate-500
font-size: 10px
font-weight: 500
uppercase
letter-spacing: increased
```

Header vertical padding:

10–12px.

Cell horizontal padding:

12–16px.

Rows separated by:

`slate-100`.

Hover:

`slate-50/80`.

---

# 52. Table Numeric Alignment

Amounts and counts SHOULD use JetBrains Mono.

Amounts should usually align consistently within the same table.

Right alignment is preferred when the table is primarily analytical.

IDs may remain left aligned.

---

# 53. Table Overflow

Tables wider than the viewport must use horizontal scrolling.

Never shrink columns until data becomes unreadable.

On small screens, high-value tables MAY be transformed into cards when this improves comprehension.

---

# 54. Empty Table State

Example:

**"Nenhuma contratação encontrada com os filtros selecionados."**

Style:

* centered;
* 12px;
* slate-400;
* approximately 32px vertical padding.

The empty state should appear inside the normal table/container structure whenever possible to avoid layout jumps.

---

# 55. Dashboard

Dashboard title:

**"Pregoeiros"**

Subtitle:

**"Exploração e inteligência sobre contratações públicas federais e estaduais"**

Primary actions:

**"Novo Interesse"**

**"Sincronizar"**

---

# 56. Dashboard Radar Summary

Panel title:

**"Radar de Acompanhamento"**

Link:

**"Ver todos os eventos"**

Summary cards:

**"12 novas contratações hoje"**

**"4 interesses com novidades"**

**"3 favoritos atualizados"**

The middle metric may use Emerald emphasis.

The other metrics remain neutral.

---

# 57. Dashboard Monitored Interests

Section:

**"Seus interesses monitorados"**

Action:

**"Gerenciar"**

Interest item example:

```text
Notebooks · RJ
Notebook 14'' Core i7 · RJ
7 novos
```

Each interest is clickable and opens Contratações with corresponding filters applied.

---

# 58. Recent Activity

Section:

**"Atividade recente na base"**

Metadata label:

**"Eventos observados"**

Activity rows use:

* 28px circular icon container;
* event title;
* description;
* timestamp.

Example:

**"Nova contratação compatível com "Notebooks · RJ""**

**"TRF 2ª Região publicou Pregão Eletrônico nº 42/2026"**

**"Hoje, há 23 minutos"**

---

# 59. Activity Colors

New procurement:

Blue.

Successful result:

Emerald.

Expiration/time-sensitive event:

Amber.

These colors appear mainly in the icon container, not across the entire row.

---

# 60. Direct Question Cards

Section heading:

**"RESPOSTAS DIRETAS ÀS PERGUNTAS REAIS"**

Examples:

**"Quais órgãos estão comprando notebooks no RJ?"**

Supporting text:

**"Filtro: CATMAT 482910 + UF: RJ"**

---

**"Quanto o governo vem pagando por monitores 27''?"**

Supporting text:

**"Estatísticas derivadas: Mediana & Quartis"**

---

**"Quais contratos de TI estão próximos do fim?"**

Supporting text:

**"Vigência nos próximos 30-90 dias"**

Cards should behave like shortcuts into real filtered views rather than static marketing content.

---

# 61. Contratações Page

Title:

**"Contratações"**

Subtitle:

**"Editais, dispensas e pregões sob a Lei nº 14.133/2021"**

Action:

**"Exportar CSV"**

Filter placeholder:

**"Ex: notebooks, limpeza, licença..."**

---

# 62. Procurement Table

Columns:

**"Objeto e Processo"**

**"Comprador / Órgão"**

**"UF"**

**"Modalidade"**

**"Valor Estimado"**

**"Situação"**

**"Ação"**

Row action:

**"Ver Detalhes"**

Object title should be the strongest element in each row.

UASG and process number appear underneath as tertiary monospace metadata.

---

# 63. Procurement Detail

Desktop procurement details may open in a large modal.

Maximum width:

approximately 768px.

Maximum height:

90vh.

The content body scrolls independently.

Header background:

slate-50.

Example title:

**"Aquisição de equipamentos de tecnologia da informação"**

Metadata:

**"Órgão: Tribunal Regional Federal da 2ª Região"**

**"UASG: 090028"**

---

# 64. Procurement Detail Tabs

Tabs:

**"Itens e Lotes"**

**"Resultados Homologados"**

**"Histórico de Alterações"**

Active:

```text
text-slate-900
border-bottom: 2px slate-900
```

Inactive:

`text-slate-400`.

Hover:

`text-slate-700`.

---

# 65. Procurement Detail Summary

Summary cards:

**"Processo SEI"**

**"Modalidade"**

**"Valor Total Estimado"**

**"Total de Itens"**

Values use monospace where appropriate.

---

# 66. Procurement Items Table

Section:

**"Itens da Contratação"**

Columns:

**"Item"**

**"CATMAT / Descrição"**

**"Qtd"**

**"Valor Unit. Estimado"**

**"Valor Total"**

CATMAT appears as tertiary monospace metadata beneath the item description.

---

# 67. Products & Services

Title:

**"Produtos e Serviços (CATMAT / CATSER)"**

Subtitle:

**"Catálogo padronizado, preços praticados e análise estatística de compras governamentais"**

Source badge:

**"Fonte: API Compras.gov + Derivações"**

Source and derived data should always be clearly distinguishable.

---

# 68. Product Cards

Product cards display:

1. CATMAT/CATSER code;
2. type;
3. description;
4. median price.

Example:

```text
CATMAT 482910                     Material

Notebook 14'' Core i7 16GB
512GB SSD

Mediana:                  R$ 5.480,00
```

Avoid the label **"Mediana Oficial"** unless the source truly defines it as an official statistic.

Preferred product copy:

**"Mediana observada"**

or:

**"Mediana calculada"**

depending on implementation.

---

# 69. Product Detail Actions

Actions:

**"Favoritar"**

**"Criar Interesse"**

Favorite icon:

`lucide:star`.

Favorited state:

Amber star.

Creating an Interest opens the Interest modal pre-populated with the current product.

---

# 70. Derived Statistics

Section:

**"ESTATÍSTICAS DERIVADAS PELO PREGOEIROS"**

Supporting text example:

**"Base: últimos 24 meses (142 compras homologadas)"**

Metrics:

**"Preço Mediano"**

**"Média Calculada"**

**"Preço Mínimo"**

**"Preço Máximo"**

**"Observações Registradas"**

Use precise terminology.

Do not imply a metric came directly from Compras.gov when Pregoeiros calculated it.

---

# 71. Statistical Values

Values:

16px / bold / monospace.

Supporting metadata:

10px.

Example:

```text
Preço Mediano
R$ 5.480,00
142 observações no período
```

Avoid qualitative claims such as **"Mais robusto que a média"** in the final production UI unless they materially help the user understand the statistic.

Prefer factual explanatory copy.

---

# 72. Price Trend

Title:

**"Tendência Histórica de Preços Praticados"**

Legend:

**"Preço Homologado (R$)"**

**"Mediana Móvel"**

Primary series:

slate-900.

Reference/median series:

emerald-500.

Charts must include:

* time axis;
* value axis;
* tooltip;
* accessible data representation;
* period selector when supported.

---

# 73. Recent Product Results

Section:

**"Últimos Resultados de Itens Homologados"**

Columns:

**"Órgão Comprador"**

**"Fornecedor Vencedor"**

**"Qtd"**

**"Valor Unitário"**

**"Data Homologação"**

Currency and quantity should use monospace.

---

# 74. Fornecedores Page

Title:

**"Fornecedores"**

Subtitle:

**"Empresas com resultados homologados observáveis nos dados abertos do Compras.gov.br"**

Search placeholder:

**"Filtrar por Razão Social ou CNPJ..."**

---

# 75. Terminology Notice

The supplier view should prominently preserve the source/coverage caveat.

Recommended copy:

**"Sobre esta métrica: os valores exibidos refletem resultados homologados observáveis na base importada pelo Pregoeiros e podem não representar a totalidade das contratações públicas."**

Use:

* amber-50 background;
* amber-200 border;
* amber-900 text;
* info icon.

This is informational, not an error.

---

# 76. Supplier Card

Card displays:

* company name;
* CNPJ;
* favorite action;
* observed results;
* observed awarded value;
* primary supply category;
* number of distinct buyers.

Labels:

**"Resultados observados"**

**"Valor adjudicado observado"**

**"Principal fornecimento"**

Avoid presenting observed counts as an absolute measure of all government procurement activity.

---

# 77. Contracts & Expiration

Title:

**"Contratos & Próximos Vencimentos"**

Recommended subtitle:

**"Acompanhamento de vigências contratuais e identificação de contratos próximos do encerramento"**

Avoid stating that an expiring contract necessarily predicts a new procurement.

Expiration is an observable fact; future procurement is not guaranteed.

---

# 78. Contract Expiration KPI

30 days:

Red.

Copy:

**"Vencimento em 30 dias"**

Supporting copy:

**"Contratos com fim de vigência próximo"**

60 days:

Amber.

Copy:

**"Vencimento em 60 dias"**

90 days:

Slate.

Copy:

**"Vencimento em 90 dias"**

---

# 79. Contract Table

Columns:

**"Contrato / Número"**

**"Órgão Contratante"**

**"Fornecedor"**

**"Fim de Vigência"**

**"Valor Total"**

**"Status de Alerta"**

Status examples:

**"Vencendo em < 30 dias"**

**"Vencendo em < 60 dias"**

**"Vencendo em < 90 dias"**

---

# 80. Radar

Title:

**"Radar"**

Unread badge:

**"4 não vistos"**

Subtitle:

**"Caixa de entrada inteligente: novas contratações, homologações e contratos relevantes"**

Primary utility action:

**"Marcar todos como vistos"**

---

# 81. Radar Filters

Tabs:

**"Todos"**

**"Apenas não vistos"**

**"Contratações"**

**"Resultados"**

Active tab:

* slate-900;
* 2px slate-900 bottom border.

Inactive:

* slate-500;
* hover slate-900.

---

# 82. Radar Event

Unread event:

* slate-50/50 background;
* slate-300 border;
* subtle shadow;
* 8px emerald dot.

Read event:

* white;
* slate-200 border;
* outlined slate dot.

Structure:

```text
●  Nova contratação publicada              • há 23 minutos
   Corresponde ao interesse "Notebooks · RJ"
   TRF 2ª Região — Pregão Eletrônico 42/2026

                                      [Marcar visto]
```

---

# 83. Radar Empty State

Copy:

**"Nenhum evento no Radar com o filtro selecionado."**

Use a slate-50 panel with centered slate-400 text.

For an entirely new account, a more instructive empty state should be used:

**"Seu Radar ainda está vazio."**

**"Crie um Interesse ou adicione entidades aos Favoritos para acompanhar novidades."**

Primary action:

**"Criar Interesse"**

---

# 84. Favorites

Title:

**"Favoritos"**

Subtitle:

**"Entidades específicas — contratações, produtos e fornecedores — que você decidiu acompanhar"**

Tabs:

**"Todos"**

**"Produtos"**

**"Fornecedores"**

**"Contratações"**

---

# 85. Favorite Tabs

Selected:

```text
bg-slate-900
text-white
```

Inactive:

```text
bg-slate-100
text-slate-600
hover:bg-slate-200
```

Radius:

8px.

---

# 86. Favorite Row

Each row displays:

* amber star;
* entity title;
* entity type;
* code;
* remove action.

Example:

```text
★  Notebook 14'' Core i7 16GB SSD
   PRODUTO • CATMAT 482910
```

Remove action:

trash icon.

Tooltip:

**"Remover favorito"**

---

# 87. Favorites Empty State

Category empty state:

**"Nenhum favorito encontrado nesta categoria."**

Global empty state:

**"Você ainda não adicionou favoritos."**

Supporting copy:

**"Favorite produtos, fornecedores ou contratações para encontrá-los rapidamente e acompanhar alterações."**

---

# 88. Interests

Page title:

**"Regras de Interesse"**

Subtitle:

**"Regras automatizadas de acompanhamento que geram eventos no Radar"**

Primary action:

**"Criar Novo Interesse"**

---

# 89. Interest Card

Badge:

**"Regra Ativa"**

Example:

**"Notebooks · RJ"**

Details:

**"Produto:"**

**"UF:"**

**"Comprador:"**

Activity:

**"7 contratações novas"**

Action:

**"Ver resultados"**

---

# 90. Create Interest Modal

Title:

**"Criar Regra de Interesse"**

Icon:

`lucide:bookmark-plus`.

Maximum width:

512px.

Fields:

### Nome do Interesse

Placeholder:

**"Ex: Notebooks no RJ, Tomógrafos SP"**

Helper:

**"Rótulo que aparecerá no seu dashboard e nos alertas do Radar"**

### Produto / Serviço (CATMAT / CATSER)

Product selector.

### UF (Opcional)

Default:

**"Brasil (Todas)"**

### Comprador

Default:

**"Todos os órgãos"**

Footer actions:

**"Cancelar"**

**"Salvar Interesse"**

---

# 91. Modal Pattern

Backdrop:

```text
slate-900 / 40%
```

Container:

* white;
* slate-200 border;
* rounded-xl;
* shadow-xl.

Standard padding:

20px.

Header/footer borders:

slate-200.

Animation:

approximately 150ms fade/scale.

Escape closes non-destructive modals.

Close icon is always available.

Focus must be trapped inside the modal.

Focus returns to the triggering element after closing.

---

# 92. Procurement Detail Modal

Larger than standard modal.

Maximum width:

768px.

Maximum height:

90vh.

Header:

slate-50.

Body:

white, independently scrollable.

Footer:

slate-50.

Footer includes source/entity ID and:

**"Fechar"**

---

# 93. Data Ingestion Status Modal

Title:

**"Estado da Ingestão de Dados"**

Intro:

**"Pipeline de ingestão incremental com armazenamento persistente em PostgreSQL e processamento idempotente."**

Datasets may include:

**"Contratações (Lei 14.133)"**

**"Resultados de Itens & Homologações"**

**"Preços Praticados"**

**"CATMAT / CATSER (Catálogo)"**

Each row shows:

* dataset;
* last update;
* record count;
* health state.

Healthy:

**"OK"**

---

# 94. Freshness Language

Use human-readable freshness.

Examples:

**"Atualizado há 12 minutos"**

**"Atualizado há 3 horas"**

**"Atualizado ontem"**

Where precision is useful, expose exact timestamp in tooltip/detail.

---

# 95. Resilience Notice

Section title:

**"Estratégia de Resiliência"**

Recommended copy:

**"Se a API do Compras.gov estiver temporariamente indisponível, o Pregoeiros continuará exibindo os dados já sincronizados e informará quando a base estiver desatualizada."**

Avoid infrastructure jargon when communicating ordinary status to end users.

---

# 96. Historical Analytics

Title:

**"Histórico Observado & Analytics"**

A more Portuguese-focused production alternative is:

**"Histórico Observado & Análises"**

Subtitle:

**"Análise multidimensional agregada de resultados de itens e compras públicas"**

Export:

**"Exportar Dataset JSON"**

Recommended production wording:

**"Exportar JSON"**

---

# 97. Historical KPIs

Examples:

**"Resultados Observados"**

**"Fornecedores com Resultados"**

**"Órgãos Compradores Ativos"**

Supporting text must specify scope.

Example:

**"Homologados nos últimos 12 meses"**

Never display a historical aggregate without enough context to understand its period and dataset.

---

# 98. Historical Supplier Analysis

Recommended heading:

**"Fornecedores por Volume de Resultados Homologados"**

Supporting text:

**"Itens adjudicados com sucesso no período selecionado"**

Columns:

**"Posição & Razão Social"**

**"CNPJ"**

**"Resultados Homologados"**

**"Valor Total Observado"**

**"Principal Categoria"**

The word **"observado"** should be used whenever coverage is constrained by imported datasets.

---

# 99. Ranking Presentation

Where the application displays an ordered analytical table, position is presented neutrally:

```text
#1
#2
#3
```

The UI should describe what is being sorted.

Example:

**"Ordenado por quantidade de itens homologados no período"**

Avoid ambiguous labels such as:

**"Melhores fornecedores"**

The ordering reflects a metric, not a quality judgment.

---

# 100. Toasts

Toast position:

bottom-right desktop.

Mobile:

bottom with safe horizontal margin.

Visual:

```text
background: slate-900
text: white
radius: 12px
shadow-lg
padding: 10px 16px
```

Default icon:

Emerald success/check icon.

Display duration:

approximately 3 seconds.

---

# 101. Toast Copy

Success examples:

**"Produto adicionado aos favoritos."**

**"Favorito removido."**

**"Regra "Notebooks · RJ" criada com sucesso."**

**"Todos os eventos do Radar foram marcados como vistos."**

**"Exportação iniciada com os filtros ativos."**

Use punctuation consistently.

Avoid unnecessary exclamation marks.

---

# 102. Synchronization Feedback

Start:

**"Sincronização iniciada."**

Optional supporting text:

**"Buscando atualizações no Compras.gov..."**

Completion:

**"Sincronização concluída."**

Supporting information may say:

**"2.381 registros processados."**

Do not imply that all records were changed when they were merely read or processed.

---

# 103. Error Toast

Use:

* red-600 icon;
* slate-900 toast background remains acceptable.

Example:

**"Não foi possível concluir a sincronização."**

Supporting text if shown:

**"Os dados já armazenados continuam disponíveis."**

Persistent or actionable errors should use an inline alert instead of disappearing after three seconds.

---

# 104. Loading States

The application should not use a full-page spinner for ordinary navigation.

Preferred patterns:

### Tables

Skeleton rows.

### Cards

Skeleton blocks preserving card dimensions.

### Button operation

Inline spinner.

### Analytics

Skeleton values/chart area.

### Initial SSR

Render server data directly whenever possible.

---

# 105. Skeleton Styling

Use:

```text
bg-slate-100
rounded
animate-pulse
```

Avoid highly animated shimmer effects.

---

# 106. Empty States

Empty states should answer:

1. what happened?
2. why might it be empty?
3. what can the user do?

Example:

**"Nenhuma contratação encontrada."**

**"Tente remover alguns filtros ou alterar o período pesquisado."**

Action:

**"Limpar filtros"**

---

# 107. Error States

Recoverable fetch error:

**"Não foi possível carregar estes dados."**

Action:

**"Tentar novamente"**

Stale-data scenario:

**"Os dados exibidos podem estar desatualizados."**

Supporting copy:

**"Última sincronização bem-sucedida: hoje às 03:15."**

---

# 108. Formatting Rules

## Currency

Locale:

`pt-BR`

Currency:

`BRL`

Example:

**"R$ 5.480,00"**

---

## Large currency

Use full values where practical in tables.

For compact KPI displays, abbreviations MAY be used:

**"R$ 142,8 mi"**

The full value must remain accessible via tooltip/detail.

---

## Dates

Standard UI:

`DD/MM/YYYY`

Example:

**"12/09/2026"**

Human-relative dates may be used for activity:

**"há 23 minutos"**

**"há 2 horas"**

**"ontem"**

---

## Date + exact time

Example:

**"16/09/2026 às 03:15"**

---

# 109. Numbers

Use Brazilian grouping:

```text
12.483
281.000
```

Decimal:

```text
5.480,30
```

Do not mix English and Brazilian number formatting.

---

# 110. Identifiers

Do not truncate identifiers unless necessary.

Examples:

```text
CNPJ 01.076.218/0001-65
UASG 090028
CATMAT 482910
```

If truncated visually, the complete value must be available through tooltip/copy.

---

# 111. Content Voice

Product copy should be:

* concise;
* factual;
* technical without unnecessary jargon;
* neutral;
* precise.

Prefer:

**"3 favoritos atualizados"**

over:

**"Temos novidades incríveis em seus favoritos!"**

Prefer:

**"Nenhuma contratação encontrada."**

over:

**"Ops! Parece que não encontramos nada por aqui."**

Pregoeiros is a professional tool.

---

# 112. Terminology

Preferred terminology:

**Contratação**

**Pregão Eletrônico**

**Dispensa**

**Fornecedor**

**Órgão comprador**

**Resultado homologado**

**Item homologado**

**Valor estimado**

**Valor adjudicado**

**Preço praticado**

**Observação**

**Favorito**

**Interesse**

**Radar**

**Histórico observado**

**Sincronização**

---

# 113. Observed vs Derived Data

This distinction is fundamental.

### Source-derived factual data

Example:

**"Valor unitário homologado: R$ 5.120,00"**

### Pregoeiros-derived metric

Example:

**"Mediana calculada: R$ 5.480,00"**

Derived analytics should explicitly identify:

* metric;
* period;
* observation count when useful.

---

# 114. Avoid Unsupported Implications

The UI must not transform correlation into certainty.

Avoid:

**"Oportunidades imediatas de novo edital"**

for expiring contracts.

Prefer:

**"Contratos com vigência próxima do encerramento"**

Avoid:

**"Em fase de planejamento pelos órgãos"**

unless actual planning data establishes this.

Prefer:

**"Vencimento entre 31 e 60 dias"**

The UI should distinguish facts from analytical interpretation.

---

# 115. Responsive Breakpoints

Use Tailwind defaults unless implementation requirements justify otherwise.

Primary behavioral breakpoints:

### `< sm`

Mobile.

### `sm`

Expanded mobile/small tablet.

### `md`

Sidebar switches from drawer to persistent navigation.

### `lg`

Large-screen metadata such as sync status becomes visible.

---

# 116. Responsive Grid Rules

Three-column KPI:

```text
1 column mobile
3 columns sm+
```

Product catalog:

```text
1 column mobile
3 columns md+
```

Supplier cards:

```text
1 column mobile
2 columns md+
```

Interest cards:

```text
1 column mobile
2 columns md+
```

---

# 117. Mobile Page Headers

Actions should wrap below titles rather than compress.

Example:

```text
Contratações
Editais, dispensas e pregões...

[Exportar CSV]
```

Do not force page action buttons into the same row on narrow screens.

---

# 118. Mobile Filters

Filter grid collapses to one column.

Filters may later be moved into a drawer if filter complexity increases substantially.

For the initial version, inline stacked filters are preferred because they remain visible and understandable.

---

# 119. Mobile Tables

For moderately wide tables:

horizontal scrolling.

For highly interactive entity listings:

card representation may be preferable.

Never reduce table text below 10px to force fit.

---

# 120. Accessibility

Target:

WCAG 2.2 AA.

Requirements:

* semantic HTML;
* visible keyboard focus;
* correct form labels;
* accessible button names;
* adequate contrast;
* keyboard-operable navigation;
* modal focus trapping;
* Escape support;
* focus restoration;
* screen-reader announcements for important asynchronous feedback.

---

# 121. Focus Style

Interactive controls must have a visible focus state.

Recommended:

```text
outline/ring: slate-900
ring offset: 1–2px where appropriate
```

Do not remove browser focus visibility without replacement.

---

# 122. Color Independence

Never communicate state only through color.

Bad:

```text
●
```

Better:

```text
● Publicada
```

Expiration status must include text.

Radar unread status should combine visual treatment with accessible state semantics.

---

# 123. Keyboard Navigation

Supported global shortcuts:

```text
/           Search
Ctrl/⌘ + K  Search
Esc         Close modal/drawer
```

Tab order must follow visual reading order.

Custom keyboard shortcuts must not interfere with typing in inputs.

---

# 124. Tooltips

Use tooltips for:

* icon-only controls;
* truncated values;
* unfamiliar abbreviations;
* exact timestamps behind relative dates.

Do not hide essential information exclusively inside a tooltip.

---

# 125. Hover Behavior

Hover transitions:

approximately 150–200ms.

Use mostly:

`transition-colors`

or simple `transition`.

Avoid scaling cards/buttons on hover.

The UI should remain visually stable.

---

# 126. Motion

Motion should be functional.

Permitted:

* modal fade/scale;
* drawer slide;
* toast slide/fade;
* subtle spinner;
* skeleton pulse.

Avoid:

* bouncing;
* large transforms;
* decorative entrance animations;
* parallax.

Respect `prefers-reduced-motion`.

---

# 127. Search UX

Global search should eventually support multiple entity types.

Results should be grouped conceptually:

```text
Contratações
Produtos e Serviços
Fornecedores
Contratos
```

When global search simply redirects to procurement search, the UI must not imply that it already searches all entity types.

The placeholder should evolve with actual capability.

---

# 128. Favorites vs Interests

The UI must reinforce the conceptual distinction.

### Favoritos

**"Acompanhe uma entidade específica."**

Examples:

* one procurement;
* one supplier;
* one product.

### Interesses

**"Acompanhe novas ocorrências que correspondam a uma regra."**

Example:

```text
Produto: Notebook
UF: RJ
Comprador: Todos
```

This distinction should appear in empty states and creation flows.

---

# 129. Radar Mental Model

Radar is not a generic notification center.

It is the event stream produced by monitored entities and rules.

Conceptually:

```text
Favorito ───────┐
                ├──► mudança relevante ───► Radar
Interesse ──────┘
```

The UI should preserve this relationship.

Radar events should identify why the event appeared whenever possible.

Example:

**"Corresponde ao interesse "Notebooks · RJ""**

---

# 130. Data Freshness UX

Freshness is a product-level concept, not merely system diagnostics.

Relevant pages should expose when data was last synchronized.

Possible compact representation:

**"Dados atualizados há 14 min"**

If stale:

**"Dados possivelmente desatualizados · última sincronização há 9 h"**

Use Amber only when staleness is meaningful.

---

# 131. Export UX

Export actions should include format explicitly.

Examples:

**"Exportar CSV"**

**"Exportar JSON"**

Exports inherit active filters.

After activation:

**"Exportação iniciada com os filtros ativos."**

For immediate downloads, avoid unnecessary modal confirmation.

---

# 132. Confirmation UX

Do not request confirmation for easily reversible actions:

* mark Radar event seen;
* favorite;
* unfavorite.

Consider confirmation for:

* deleting an Interest with accumulated matches;
* destructive configuration changes.

Confirmation title example:

**"Excluir regra de interesse?"**

Body:

**"O monitoramento será interrompido. Os eventos já registrados no Radar não serão removidos."**

Actions:

**"Cancelar"**

**"Excluir Interesse"**

Destructive action uses red.

---

# 133. Pagination

Listing pages should eventually use server-side pagination.

Footer pattern:

```text
Exibindo 1–25 de 1.482

[Anterior]  Página 1 de 60  [Próxima]
```

Copy:

**"Anterior"**

**"Próxima"**

Current page should not rely on color alone.

---

# 134. Sorting

Sortable table headers should indicate direction.

Example:

**"Valor Estimado ↓"**

Use an Iconify chevron when appropriate.

Screen readers should receive `aria-sort`.

Default ordering should be documented per view.

---

# 135. Product Analytical Filters

Historical product views should support:

* period;
* UF;
* buyer;
* supplier where relevant.

Period presets:

**"6 meses"**

**"12 meses"**

**"24 meses"**

**"Personalizado"**

Active period uses the same selected-tab visual language.

---

# 136. Information Density Modes

The initial release has one density level.

Do not implement comfortable/compact density settings prematurely.

The default density is intentionally compact.

Tables use approximately 40px rows depending on content.

---

# 137. Scrollbars

Desktop custom scrollbar:

width/height:

6px.

Track:

`slate-100`.

Thumb:

`slate-300`.

Hover:

`slate-400`.

Radius:

full.

Native scrollbar behavior should remain functional.

---

# 138. Z-Index Model

Recommended hierarchy:

```text
normal content      0
mobile backdrop    10
sidebar            20
sticky header      30
dropdown/popover   40
modal/toast        50
```

Avoid arbitrary high z-index values.

---

# 139. Component Naming

Suggested Svelte components:

```text
AppHeader
AppSidebar
PageHeader
GlobalSearch

Button
IconButton
Badge
StatusBadge
Input
Select
Tooltip
Tabs

Card
MetricCard
DataTable
Pagination

FilterPanel
EmptyState
InlineAlert
Toast

FavoriteButton
InterestCard
RadarEvent
FreshnessIndicator

Modal
ConfirmDialog
ProcurementDetailModal
SyncStatusModal
```

---

# 140. Design Tokens

Implementation should centralize semantic tokens where Tailwind utilities alone become repetitive.

Conceptually:

```text
--color-bg             white
--color-surface        slate-50
--color-border         slate-200

--color-text           slate-900
--color-text-strong    slate-950
--color-text-muted     slate-500
--color-text-tertiary  slate-400

--color-accent         slate-900
--color-accent-hover   slate-800

--radius-control       8px
--radius-container     12px
```

Do not create dozens of custom tokens that merely duplicate Tailwind.

---

# 141. Component Consistency Rules

The same semantic action must use the same component.

Examples:

All normal primary actions → `Button variant="primary"`.

All favorites → `FavoriteButton`.

All entity statuses → `StatusBadge`.

All page headings → `PageHeader`.

All empty collections → `EmptyState`.

Avoid reproducing long Tailwind class strings independently throughout route components.

---

# 142. Production Copy Corrections from the POC

The POC provides the visual baseline, but several phrases should be tightened before production.

Prefer:

**"Preço Mediano"**

instead of:

**"Preço Mediana"**

Prefer:

**"Mediana calculada"**

instead of:

**"Mediana Oficial"**

unless officially supplied by the source.

Prefer:

**"Contratos com vigência próxima do encerramento"**

instead of:

**"Oportunidades imediatas de novo edital"**

Prefer:

**"Vencimento entre 31 e 60 dias"**

instead of:

**"Em fase de planejamento pelos órgãos"**

unless planning data exists.

Prefer:

**"Histórico Observado & Análises"**

over mixing Portuguese with **"Analytics"** in the final user-facing product.

Prefer:

**"Exportar JSON"**

over:

**"Exportar Dataset JSON"**

---

# 143. Desktop Reference Layout

Target desktop composition:

```text
┌───────────────────────────────────────────────────────────────┐
│ [P] Pregoeiros   [ Buscar...                 ⌘K ]  Sync  ◉ ⚙ │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ Visão geral   │  Page title                     [Actions]     │
│ Radar      4  │  Supporting description                       │
│               │  ──────────────────────────────────────────   │
│ EXPLORAR      │                                               │
│ Contratações  │  Filters / metrics                            │
│ Produtos      │                                               │
│ Fornecedores  │  ┌─────────────────────────────────────────┐  │
│ Contratos     │  │                                         │  │
│               │  │       Primary page content              │  │
│ ACOMPANHAR    │  │                                         │  │
│ Favoritos     │  └─────────────────────────────────────────┘  │
│ Interesses    │                                               │
│               │                                               │
│ ANALISAR      │                                               │
│ Histórico     │                                               │
│ Preços        │                                               │
│               │                                               │
│ ┌───────────┐ │                                               │
│ │ DB status │ │                                               │
│ └───────────┘ │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

---

# 144. Mobile Reference Layout

```text
┌──────────────────────────────┐
│ ☰  Pregoeiros            ◉ ⚙ │
├──────────────────────────────┤
│                              │
│ Contratações                 │
│ Editais, dispensas...        │
│                              │
│ [Exportar CSV]               │
│                              │
│ ┌──────────────────────────┐ │
│ │ Buscar                   │ │
│ │ UF                       │ │
│ │ Modalidade               │ │
│ │ Situação                 │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Procurement result      │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

Global search may be exposed as a dedicated mobile search action or full-width field below the header once implemented.

---

# 145. UX Acceptance Criteria

A production implementation satisfies this specification when:

1. the interface uses Inter as its primary typeface;
2. structured identifiers and values consistently use JetBrains Mono;
3. `slate-900` is the primary accent;
4. the application is light-theme-first;
5. primary content remains within `max-w-5xl` or `max-w-6xl`;
6. desktop uses a 256px sidebar and 56px header;
7. navigation is grouped into Explore, Monitor, and Analyze concepts;
8. mobile navigation becomes an off-canvas drawer;
9. buttons consistently use primary, secondary, tertiary, icon, and destructive patterns;
10. forms have visible labels and focus states;
11. tables preserve information density without sacrificing readability;
12. semantic colors represent states rather than decoration;
13. Favorites and Interests remain distinct concepts;
14. Radar clearly communicates why events exist;
15. observed and derived data are explicitly distinguishable;
16. data freshness is visible where relevant;
17. empty, loading, stale, and error states are implemented;
18. the application can be fully operated by keyboard;
19. modal focus behavior is accessible;
20. the UI does not make analytical claims stronger than the underlying data supports;
21. all user-facing product copy is Brazilian Portuguese;
22. numeric, currency, and date formatting follow `pt-BR`;
23. responsive layouts remain usable without shrinking text below acceptable sizes;
24. Iconify/Lucide icons are used consistently;
25. component styles are centralized rather than copied throughout Svelte routes.

---

# 146. Final Design Direction

Pregoeiros should feel like a **public-procurement intelligence workstation**.

The desired visual characteristics are:

```text
compact
precise
quiet
analytical
professional
data-dense
fast
trustworthy
```

The undesired characteristics are:

```text
colorful
playful
marketing-heavy
oversized
decorative
card-everything
animation-heavy
generic SaaS
```

The core visual formula is:

```text
White canvas
+ Slate structure
+ Slate-900 actions
+ Thin borders
+ Compact typography
+ Monospace data
+ Sparse semantic color
+ Dense tables
+ Clear provenance
```

The core UX formula is:

```text
Explore
   ↓
Understand
   ↓
Favorite or create Interest
   ↓
Radar observes changes
   ↓
Historical data accumulates
   ↓
Analyze
```

This relationship should remain visible throughout the product.

Pregoeiros is not simply a viewer for Compras.gov data.

Its interface should progressively transform public procurement records into an environment where users can **explore what exists, monitor what matters, and analyze what has happened**, while always preserving the distinction between source data, observed history, and metrics derived by Pregoeiros.

