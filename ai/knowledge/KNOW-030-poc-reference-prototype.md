---
id: KNOW-030
type: knowledge
status: active
sources:
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-030 — PoC Reference Prototype and Seed Data

## Summary

`ai/raw/pregoeiros.html` is a single-file, client-only HTML/JS proof of concept
that defines the target UX. It uses in-memory mock data and simulated actions;
production must reproduce its experience with real data. Its dataset is also
the basis of the development seed.

## Known Facts

- **Nature:** one HTML file (~2,400 lines), Tailwind via CDN (`cdn.tailwindcss.com`), Iconify 3.1.1 via CDN, Google Fonts; all state in a JS `state` object; no persistence; no network calls.
- **Views (PoC id → production route):** `dashboard` → `/`; `contratacoes` → `/oportunidades`; `produtos` (also `precos`) → `/produtos` (`/precos` redirects); `fornecedores` → `/fornecedores`; `contratos` → `/contratos`; `radar` → `/radar`; `interesses` → `/alertas`; `favoritos` → `/salvos`; `historico` → `/historico`. Modals: procurement detail, create alert, sync status.
- **Simulated-only behaviors:** "Baixar Edital (PDF)" shows a toast; "Atualizar Fontes" shows toasts ("Verificando novas publicações no Compras.gov.br…" then "Base sincronizada com sucesso: 12 novas oportunidades detectadas."); export buttons only toast; several counters are hardcoded (e.g. "12 novos", "2 urgentes", contracts 87/143/211, history KPIs 12.483 / 418 / 731).
- **Mock dataset:**
  - 6 procurements: p-1 TRF 2ª Região notebooks (RJ, Pregão, R$ 1.840.000, deadline 28/09/2026 10:00, 3 days, pendente, 3 items, 4 requirements); p-2 Ministério da Saúde - DLOG hospital supplies (DF, R$ 8.900.000, 2 days, critico, pendente); p-3 SES/SP reagents (SP, Dispensa, homologated, nogo); p-4 Polícia Federal monitors (RJ, R$ 620.000, 7 days, **go**); p-5 Comando da Aeronáutica climatização (DF, Concorrência, R$ 1.250.000, 10 days, pendente); p-6 TJMG workstations (MG, homologated, nogo).
  - 3 products with stats: 482910 Notebook (median R$ 5.480, mean R$ 5.520,30, sd R$ 340, min R$ 4.790 TRF2/RJ, max R$ 6.320 on-site 36m, 327 obs, 58 suppliers); 439120 Monitor 27'' (median R$ 1.850, 184 obs, 34 suppliers); 392102 Split 18.000 BTUs (median R$ 3.290, 92 obs, 22 suppliers).
  - 4 suppliers (Positivo, Dell, ACME Soluções Hospitalares, TechSupply), 3 contracts (28/47/74 days remaining), 3 alerts, 4 radar events (3 unseen), 3 favorites.
  - The PoC's implied "today" is around 25/09/2026.
- **Dev seed:** reproduces the PoC's 6 notices, **4** monitored products (D-40: 482910, 439120, 392102, 192834), 4 suppliers, 3 contracts, 3 alerts and 4 radar events for offline development, **with the corrections below**. **Production seed** creates only tenant + admin + initial `watched_products`.
- **Anchor CATMAT codes:** 482910 Notebook 14'' Core i7 16GB 512GB SSD; 439120 Monitor 27'' IPS 4K; 392102 Ar-condicionado Split 18.000 BTUs; 192834 Material hospitalar descartável. These are also the operational catalog examples in the API spec.
- PoC CNPJs are illustrative.
- **Precedence:** the PoC is a UX reference, not a source of business rules; where it diverges from the specs, the specs and `06-DECISOES.md` prevail and the dev seed is corrected.
- **Dev-seed corrections:**
  - D-08: each item gets a distinct CATMAT (no reuse of 401928 across unrelated items); items outside the monitored products are `verificar`.
  - D-15: the seed alert "Material Hospitalar em SP" becomes **"Material Hospitalar — Ministério da Saúde"**, UF "Todos", buyer Ministério da Saúde - DLOG — matching notice p-2 (DF) correctly.
  - D-40: 192834 is a monitored product (needed for p-2 item 1 fit and the hospital alert).
- **D-19:** all production counters are derived from data; PoC hardcoded numbers are illustrative.
- **D-07:** the PoC's constructed "ID Oficial" is not carried to production.

## Constraints

- PoC numbers and labels are illustrative, not specifications; v1 acceptance requires real data.
- Mock-only behaviors (fabricated official ID, toasts instead of downloads/sync) must not be carried into production.

## Unknowns

- Whether the dev seed should include the PoC's `procurement_requirements`, historical bids and chart points.

## Conflicts

- None remaining. Seed vs. anchors resolved by D-40; PoC data inconsistencies resolved by D-08, D-15, D-19 (and D-01, D-07, D-12 in their topics); duplicate use of CATMAT 401928 resolved by D-08.

## Provenance

- Everything about the prototype's structure, data and behaviors: `ai/raw/pregoeiros.html` (`<head>`, markup sections, `state`, `navigate`, `triggerQuickSync`, `exportData`, `downloadEditalMock`).
- Seed policy and anchor codes: `ai/raw/05-DATA_MODEL_SPECS.md` §10.
- Operational catalog examples: `ai/raw/04-API_SPECS.md` §4.
- Decisions D-07, D-08, D-15, D-19, D-40, and the precedence rule: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-001]] product vision
- [[KNOW-017]] UI design system
- [[KNOW-008]] price intelligence
