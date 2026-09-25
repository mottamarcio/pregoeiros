---
id: KNOW-006
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-006 — Opportunities Listing and Filters (`/oportunidades`)

## Summary

The Opportunities page lists procurements (Lei 14.133/21 and equivalent
modalities present in the base) in a filterable table, exportable to CSV, from
which the analyst opens the triage sheet.

## Known Facts

- Table of procurements under Lei 14.133/21 and equivalent modalities in the base. PoC title "Oportunidades em Disputa" — "Editais publicados, dispensas e pregões sob a Lei Federal nº 14.133/2021".
- **Filters:** free text with `-termo` exclusion; delivery UF; triage decision; segment/family; modalidade; situação; **órgão** (added by D-16 so alert shortcuts can apply all three alert criteria).
- PoC filter options:
  - UF: RJ, SP, DF, MG, RS (+ "Todas as UFs").
  - Triage: Pendente de Triagem, GO (Vamos Disputar), Em Análise, NO-GO (Descartado).
  - Segment: Tecnologia da Informação & Computadores, Material Médico & Hospitalar, Climatização & Refrigeração.
  - Modalidade: Pregão Eletrônico, Dispensa de Licitação, Concorrência.
  - Situação: Recebendo Propostas (Aberta), Resultado Homologado.
- PoC table columns: Prazo de Proposta (with "Restam N dias" / "Homologado"), Objeto e Itens do Edital (with processo and UASG), Órgão Comprador, UF, Valor Estimado, Triagem badge (GO / Análise / NO-GO / Pendente), Ação ("Ficha do Edital").
- PoC shows "Exibindo N oportunidades" and a "Limpar filtros de busca" action; empty state: "Nenhuma oportunidade encontrada com os filtros selecionados. Tente ajustar os termos de pesquisa."
- In the PoC, free-text search covers objeto, comprador, processo, UASG and the descriptions + CATMAT codes of the notice's items.
- **Read flow:** `GET /oportunidades` → `+page.server.ts` validates the querystring → `SearchService.parse(q)` (tokens + exclusions) → `ProcurementRepository.search()` → `+page.svelte` renders the table.
- Filters become search params: `q`, `uf`, `triagem`, `segmento`, `modalidade`, `situacao`, `orgao` (D-16) (plus `page`), validated with a Zod schema (`opportunityQuerySchema`) in `load`; reload via `goto` + `invalidateAll` or `applyAction`.
- Structural filters (UF, modalidade, situação, decisão) are columns, not full-text search.
- CSV export available from this page (see [[KNOW-022]]).

## Constraints

- Applying an alert's "Triar oportunidades" shortcut must reset filters first, not inherit stale state (see [[KNOW-011]]).

## Unknowns

- How `segmento` (TI | Saude | Climatizacao | …) is derived from upstream data — the upstream API has no such field; the mapping is not specified.
- The mapping from upstream `situacao` values to the `procurement_situation` enum is not specified beyond keeping `situacao_raw`.
- Full list of modalidades beyond the three shown in the PoC.
- Default sort order of the table.

## Conflicts

- None identified.

## Provenance

- Page scope and filters: `ai/raw/01-PRD.md` §4.2.
- Read flow: `ai/raw/02-ARCHITECTURAL_SPECS.md` §5.1.
- Search params, Zod, reload mechanisms, structural filters as columns: `ai/raw/03-TECHNICAL_SPECS.md` §3.2, §6.
- Filter options, columns, labels, searchable fields: `ai/raw/pregoeiros.html` (view-contratacoes, `filterProcurements`, `renderProcurements`).
- Decisions D-16: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-007]] search normalization and exclusion tokens
- [[KNOW-005]] triage sheet
- [[KNOW-022]] querystring contract and CSV export
