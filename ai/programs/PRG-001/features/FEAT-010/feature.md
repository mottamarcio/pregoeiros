---
id: FEAT-010
type: feature
status: draft
parent: PRG-001
---

# FEAT-010 — Expiring Contracts

## Capability

The Contratos a Vencer view: government contracts whose term ends within
30 / 60 / 90 days, presented as anticipation signals of a possible new
tender.

## User Value

The commercial director and analysts see upcoming renewals or new tenders
before they are published, and can prepare early. This covers acceptance
criterion 6.

## Scope

- `/contratos`:
  - 30 / 60 / 90-day counters;
  - table with contract number, órgão, current supplier, end of term, value and a time-remaining badge ("Vence em N dias", colored by bucket).
- Bucket classification computed in the query over `contracts.vigencia_fim` (data collected by FEAT-003 up to +120 days, D-14).
- Niche relevance using contract items (CATMAT) against the company's niche.
- Scenario entry point "contratos de TI vencendo" from the queue.
- Signal wording ("Sinais de antecipação"); never presented as certainty.

## Non-Goals

- Collecting contracts (FEAT-003).
- Managing the supplier company's own contracts.
- Predicting whether a new tender will happen.

## Constraints

- Constitution: expiring contracts are signals, never certainty; the source is cited.
- Decision D-14.

## Relevant Knowledge

- [[KNOW-010]] expiring contracts
- [[KNOW-025]] `contracts`, `contract_items`
- [[KNOW-003]] wording constraints

## Open Questions

- Whether the 30/60/90 buckets are cumulative or exclusive. ([[KNOW-010]])
- Whether the view lists all collected contracts or only those matching the niche via contract items (and how the niche is defined for contracts). ([[KNOW-010]])
