---
id: KNOW-002
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-002 — Personas, Product Metrics, Roadmap and v1 Acceptance

## Summary

Who the product serves, how its success is measured, the suggested phased
delivery (F0–F5), and the concrete criteria under which v1 is accepted as a
real product rather than a mocked PoC.

## Known Facts

- **Personas:**

  | Persona | Main need | Success criterion |
  |---|---|---|
  | Commercial procurement analyst (Analista comercial de licitações) | Triage 20–80 notices/week without opening each PDF | Prioritized queue; GO/NO-GO in ≤ 2 minutes per notice |
  | Pricer / estimator (Precificador / orçamentista) | Know median, min and max awarded prices of an item | CATMAT sheet with computed statistics and samples |
  | Commercial director | See what is in dispute and what expires in 30/60/90 days | Dashboard + expiring contracts |
  | Data operator (internal) | Know whether today's collection ran | Sources modal + job logs |

- **Product metrics:**
  - % of pending notices with deadline < 3 days and no decision.
  - Median time pending → GO/NO-GO.
  - Active alerts with at least 1 match in the last 7 days.
  - Success rate of collection jobs over the last 14 runs.
  - Catalog items with ≥ 30 price observations.
- **Suggested roadmap:**

  | Phase | Delivery |
  |---|---|
  | F0 | SvelteKit skeleton, Docker Postgres, PoC layout, seeds |
  | F1 | Procurement + items collector, triage sheet, queue, decision |
  | F2 | Alerts, radar, global search, favorites |
  | F3 | Practiced prices, suppliers, history |
  | F4 | Expiring contracts + cron 2×/day + sources modal |
  | F5 | Exports, BDD journey tests, hardening |

- **v1 acceptance criteria** — accepted when an analyst can, **without mocked data**:
  1. See in the queue at least the open procurements of the configured niche.
  2. Open the sheet and see **the items of that specific notice**, not a generic catalog.
  3. Mark GO and find the notice under "Em Disputa / Salvos".
  4. Create the alert "Notebooks no RJ" and receive a Radar event after the next collection.
  5. Query the median of a CATMAT with N and window visible.
  6. List contracts whose term ends within 30/60/90 days.
  7. Confirm in the modal that the 03:15 (or 15:15) collection ran.

## Constraints

- Acceptance explicitly requires real (non-mocked) data.

## Unknowns

- No numeric targets are given for the product metrics (e.g. acceptable % of undecided urgent notices).
- The roadmap is labeled "suggested"; no dates or durations are given.

## Conflicts

- None remaining. The 30-observation metric vs. the display floor of 5 was resolved by D-02 (recorded in [[KNOW-008]]): they are distinct thresholds.

## Provenance

- Personas: `ai/raw/01-PRD.md` §2.
- Metrics: `ai/raw/01-PRD.md` §7.
- Roadmap: `ai/raw/01-PRD.md` §9.
- Acceptance criteria: `ai/raw/01-PRD.md` §10.
- Decisions D-02: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-001]] product vision and scope
- [[KNOW-028]] testing strategy (BDD journeys)
