---
id: KNOW-005
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-005 — Procurement Triage Sheet (Ficha de Triagem)

## Summary

The **Ficha de Triagem do Edital** is the critical screen of the PoC: a detail
view of one notice with everything needed to decide GO / Em Análise / NO-GO,
including the items **of that specific notice**, their fit with the company's
catalog, and habilitation requirements.

## Known Facts

- The sheet must display:
  - objeto, órgão, UASG, processo, UF, segmento, situação;
  - proposal deadline + countdown ("Faltam N dias corridos" / "Encerrado");
  - delivery place and delivery deadline;
  - payment conditions;
  - total estimated value and modalidade;
  - table of items/lots **of that notice** (CATMAT, qty, unit price, total, fit/adequação);
  - habilitation checklist, extracted/normalized when available;
  - official links (Compras.gov.br / PNCP) and PDF download when a URL exists;
  - GO / Em Análise / NO-GO buttons persisted in the database.
- PoC section titles: "Itens e Lotes Específicos Deste Edital", "Exigências de Habilitação & Documentos Requeridos" (tagged "Lei 14.133/21"), "Documentação Oficial da Publicação" with "Ver no Compras.gov.br" and "Baixar Edital (PDF)".
- **Item fit rule (adequação)** — business rule 5: `compativel` if the item's CATMAT/CATSER is in the company's monitored set; otherwise `verificar`. UI labels "Compatível" / "Verificar".
- Fit is a **derived field, not persisted** in the public mirror; computed as `item.catmat IN (codes of watched_products joined to catalog_items for the tenant)`.
- Items come from `procurement_items WHERE procurement_id = …` (upstream `2_consultarItensContratacoes_PNCP_14133`).
- The checklist comes from `procurement_requirements` or is empty; each requirement has `texto` and `ok_sugerido`. When empty, the PoC shows: "Sem exigências especiais identificadas além da habilitação regular (CND, FGTS, Trabalhista)."
- `local_entrega`, `prazo_entrega_texto`, `condicoes_pagamento` may be NULL initially and filled from the detail endpoint (`1.1`) or a later parser; if upstream doesn't provide them, the UI shows **"Não informado na base"**.
- The detail endpoint `1.1_consultarContratacoes_PNCP_14133_Id` is used when the job stored only the header and the user opens the detail (lazy fill) — or always during upsert.
- The sheet is reachable both as a full-page accessible route and as a modal over the queue (deep links in [[KNOW-022]]); query-controlled modals are preferred for deep-linking.
- The PoC sheet shows the status badge (e.g. "Recebendo Propostas") and segment badge.
- **Decision D-07 — official ID:** the sheet shows `numero_controle_pncp` (or `id_compra` if only that exists) from upstream; if neither exists, the field is hidden. An ID is never built from UASG + processo.
- **Decision D-08 — fit in seed data:** the fit rule prevails; in the dev seed each item gets a distinct CATMAT, and items outside the monitored products appear as `verificar` (seed details in [[KNOW-030]]).

## Constraints

- The sheet must list the items of that notice, never a generic catalog (v1 acceptance criterion 2).
- Official IDs shown must come from upstream, never be constructed.

## Unknowns

- How the habilitation checklist is "extracted/normalized" — upstream does not structure it; the data model allows the table to stay empty or receive manual per-segment rules. No extraction approach is defined.
- How `ok_sugerido` is determined (the PoC shows some requirements as not-OK, e.g. 24h support channel).
- Whether the lazy fill via `1.1` happens on user request or always at upsert — both are offered as options.
- Source of the PDF URL (which upstream field) is not specified.

## Conflicts

- None remaining. PoC "ID Oficial" construction resolved by D-07; PoC item-fit inconsistency (CATMAT 401928) resolved by D-08.

## Provenance

- Required fields and buttons: `ai/raw/01-PRD.md` §4.3; fit rule: §6.5.
- Query-controlled modals: `ai/raw/03-TECHNICAL_SPECS.md` §2; full-page route: `ai/raw/02-ARCHITECTURAL_SPECS.md` §4.
- Lazy fill via `1.1`, item endpoint, deep links: `ai/raw/04-API_SPECS.md` §2.2, §2.3, §11.
- Nullable fields, "Não informado na base", derived fit, requirements table: `ai/raw/05-DATA_MODEL_SPECS.md` §5.1, §6.5, §9, §12.
- Labels, empty-checklist text, ID construction, item data: `ai/raw/pregoeiros.html` (`modalProcurementDetail`, `openProcurementDetail`, `state.procurements`).
- Decisions D-07, D-08: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-004]] triage decisions
- [[KNOW-025]] `procurements` / `procurement_items` schema
- [[KNOW-026]] `procurement_requirements`, `watched_products`
- [[KNOW-019]] upstream contratações endpoints
