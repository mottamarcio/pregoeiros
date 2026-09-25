---
id: KNOW-009
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-009 — Competitors & Winners and Observed History

## Summary

Two analysis views built from **local aggregation of awarded results**
(`award_items`): Competitors & Winners (`/fornecedores`) profiles companies with
observable awards, and Observed History (`/historico`) shows aggregate KPIs and
a supplier ranking exportable as JSON.

## Known Facts

- **Competitors (`/fornecedores`):**
  - Companies with observable awarded results.
  - Metrics: awarded items, total awarded value in the base, main family, distinct buyers (órgãos).
  - Mandatory disclaimer (see [[KNOW-003]]).
  - Favorite (follow) a competitor.
  - PoC: supplier search by name (normalized) or CNPJ; cards show "Itens Homologados", "Total Homologado", "Família Principal … em N órgãos distintos"; star toggles monitoring.
- **Observed History (`/historico`):**
  - Volume of adjudications in the base (aggregate KPIs).
  - Supplier ranking by items and awarded value.
  - JSON export of the slice (ranking + window and source metadata).
  - PoC KPIs: "Resultados Observados — Homologados nos últimos 12 meses", "Fornecedores Registrados — Ao menos 1 item adjudicado", "Órgãos Compradores — N UASGs". Ranking columns: position & razão social, CNPJ, awarded items, total awarded value, main family.
- The competitor ranking is a **local aggregation of `award_items`**, not a ready-made API field.
- `modulo-fornecedor/1_consultarFornecedor` is used only to hydrate razão social / size (porte) when an award only carries `niFornecedor`.
- Optional materialized view `supplier_stats` (by `supplier_cnpj`): `itens_homologados = count(*)`, `valor_total_homologado = coalesce(sum(valor_total),0)`, `orgaos_distintos = count(DISTINCT codigo_orgao)` (D-13; the Data Model text uses `orgao_nome`); refreshed at the end of the results job — or a live query while N is small (YAGNI).
- Suppliers come from `suppliers` + `supplier_stats`.
- **Decision D-13 — buyer identity:** "órgãos distintos" counts `codigo_orgao`; UASG is a separate metric ("unidades compradoras"). `award_items` gains `codigo_orgao` and `uasg` columns (see [[KNOW-025]]).
- History copy follows D-01: no "Cobertura: Nacional" label (see [[KNOW-003]]).

## Constraints

- Metrics must be framed as observable awarded results in the consulted base, never total revenue.

## Unknowns

- How "principal família" (main family) is computed — no field or aggregation is defined for it.
- The window of the history KPIs: the PoC says "últimos 12 meses" while award retention is 36 months and stats use 24 months; no window is specified for `/historico`.
- Sort order of the ranking when items and value disagree (PoC ranks by item count).

## Conflicts

- None remaining. Coverage label resolved by D-01; buyer identity resolved by D-13.

## Provenance

- Views and metrics: `ai/raw/01-PRD.md` §4.5, §4.10.
- Local aggregation, fornecedor hydration: `ai/raw/04-API_SPECS.md` §5.
- `supplier_stats`, mapping: `ai/raw/05-DATA_MODEL_SPECS.md` §5.4, §12.
- PoC labels, KPIs, supplier cards: `ai/raw/pregoeiros.html` (view-fornecedores, view-historico, `renderSuppliers`, `filterSuppliers`).
- Decisions D-01, D-13: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-003]] disclaimer and coverage wording
- [[KNOW-013]] favorites (fornecedor)
- [[KNOW-022]] JSON export endpoint
- [[KNOW-025]] `award_items` and `suppliers`
