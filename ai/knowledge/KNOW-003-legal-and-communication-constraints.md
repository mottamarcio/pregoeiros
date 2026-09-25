---
id: KNOW-003
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-003 — Legal, Terminology and Communication Constraints

## Summary

Rules governing how Pregoeiros talks about the public data it shows: the legal
basis for the data, the mandatory source citation, forbidden claims, and the
terminological rigor that separates observed facts from derived metrics.

## Known Facts

- The data is public, under the LAI (Lei de Acesso à Informação) and MGI's open-data policy.
- The UI must cite the source: **"Dados Abertos Compras.gov.br (Lei 14.133/21)"**.
- The PoC sidebar and sources modal show the note "Compras.gov.br federal & adesões sob a Lei nº 14.133/21."
- The Competitors view carries a **mandatory disclaimer** (from the PoC): "Rigor terminológico do Pregoeiros: A métrica exibida reflete resultados homologados observáveis na base consultada do Compras.gov.br (Lei 14.133/21). Não representa o faturamento total da empresa em outros portais ou contratos sigilosos."
- PoC wording distinguishes derived metrics explicitly: "Mediana Calculada", "Estatísticas Calculadas na Base Consultada", "Resultados Observados", "Histórico Observado".
- Expiring contracts are presented as **signals** ("Sinais de antecipação"), not certainty of a new tender.
- PoC CNPJs are illustrative; in production only CNPJs coming from the API are valid.
- **Decision D-01 — coverage wording:** the whole UI uses "Compras.gov.br — federal e adesões (Lei 14.133/21)". The PoC labels "Base Federal e Estaduais", "compras federais e estaduais" and "Cobertura: Nacional" are **not** used in production. PNCP remains a future extension.
- **Precedence:** `ai/raw/06-DECISOES.md` prevails over documents 01–05 and the PoC where they diverge; the PoC is a UX reference, not a source of business rules.

## Constraints

- Avoid language implying: "garantia de vitória" (guaranteed win), "preço oficial do governo" (official government price), or "cobertura nacional completa" (complete national coverage).
- Expiring contracts must never be described as certain to produce a new pregão.
- Competitor metrics must never be presented as total revenue.
- Official IDs (`idCompra`, `numeroControlePNCP`, UASG, processo) are never invented (see [[KNOW-024]]).

## Unknowns

- Exact placement/format of the mandatory source citation in the production UI (footer, header, per-view) is not specified.

## Conflicts

- None remaining. Coverage wording resolved by D-01.

## Provenance

- Legal basis, citation text, forbidden language, contracts-as-signals: `ai/raw/01-PRD.md` §8.
- Disclaimer text and PoC labels: `ai/raw/pregoeiros.html` (view-fornecedores, sidebar, modalSyncStatus, view-historico, view-contratos).
- Illustrative CNPJs: `ai/raw/05-DATA_MODEL_SPECS.md` §10.
- Decisions D-01 and the precedence rule: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-001]] product principles (rigorous terminology)
- [[KNOW-009]] competitors and observed history
- [[KNOW-010]] expiring contracts
