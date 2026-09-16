---
id: FEAT-005
type: feature
status: draft
parent: PRG-001
---

# FEAT-005

## Capability

Let a user search, filter, and inspect suppliers (fornecedores), showing
their observed results, awarded value, and primary supply categories based
strictly on data actually imported into Pregoeiros.

## User Value

Answers "quem está vencendo/fornecendo?" and "quais produtos essa empresa
fornece?" — lets a user evaluate a specific company's track record within
the observed dataset.

## Scope

- `/fornecedores` listing: search by Razão Social or CNPJ, supplier cards
  showing company name, CNPJ, favorite action, observed results count,
  observed awarded value, primary supply category, distinct buyer count.
- `/fornecedores/[id]` detail: tabs Visão geral | Resultados | Produtos |
  Compradores | Histórico, with a top-products table (Produto, Resultados).
- Mandatory, prominent terminology/coverage notice on the supplier view
  (amber, info icon) clarifying that shown values reflect only homologated
  results observable in Pregoeiros' imported base and may not represent the
  totality of public procurement activity.
- URL-driven search/filter state.

## Non-Goals

- Any cross-supplier ranking/comparison beyond what's directly shown on a
  single supplier's own page — ranked, multi-supplier analytical tables
  belong to the future Histórico Program (v0.5).
- Interest-rule creation tied to suppliers — out of Program scope.

## Constraints

- Observed counts/values must never be presented as an absolute measure of
  a supplier's total government business — the coverage caveat must remain
  visible wherever these metrics appear.
- Reads exclusively from PostgreSQL (via FEAT-002's repositories), never a
  live Compras.gov.br call on page render.
- Must implement loading, empty, error, stale, and success states.

## Relevant Knowledge

[[KNOW-006]] (Fornecedores routes/UI structure and terminology notice),
[[KNOW-010]] (terminology precision, observed-vs-derived framing).

## Open Questions

- None specific to this Feature beyond the Program-level ADRs already
  tracked in PRG-001 and FEAT-001/FEAT-002.
