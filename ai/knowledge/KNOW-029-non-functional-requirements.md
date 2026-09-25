---
id: KNOW-029
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
---

# KNOW-029 — Non-Functional Requirements: Performance, Availability, Observability

## Summary

v1 targets fast SSR of the queue, sub-300 ms indexed search, availability
independent of the government API, and lightweight observability via
structured JSON logs and the `sync_runs` table.

## Known Facts

- **NFR table (v1 targets):**

  | Area | v1 target |
  |---|---|
  | UI language | pt-BR |
  | Queue open time | < 1.5 s SSR + hydration on a typical connection |
  | Opportunity search (local base) | p95 < 300 ms for indexed slices |
  | App availability | independent of the government API at query time |
  | Security | secrets server-only; RLS / simple tenant isolation |
  | Accessibility | keyboard (⌘K, Escape, `/`), slate contrast, icon labels |
  | Observability | structured log per job + counters of collected pages |
  | Export | CSV and JSON generated server-side |

- **Performance practices:** queue SSR limited to 50 rows + pagination; indexes listed in the Data Model; `+layout.server.ts` fetches only cheap aggregates (counts); global search debounce 200 ms, min 2 chars; collection outside the request path.
- **Observability:** JSON logs with `request_id`, `route`, `sync_run_id`, `module`, `pages_fetched`, `upserts`; `sync_runs` is the source of the "Fontes Consultadas" modal; no mandatory APM in v1 — stdout + Postgres suffice.
- **Resilience:** if the government API is down, the last collected base stays queryable; `/api/health` does not fail because of the government API.
- Price stats may use a short cache (5–15 min) if needed.

## Constraints

- No APM dependency in v1.
- Collection must never run in the request path.

## Unknowns

- What a "typical connection" is for the 1.5 s target.
- Data volume assumptions for the p95 < 300 ms target.
- Log retention/aggregation destination beyond stdout.

## Conflicts

- None identified.

## Provenance

- NFR table: `ai/raw/01-PRD.md` §5.
- Observability: `ai/raw/02-ARCHITECTURAL_SPECS.md` §9.
- Performance practices: `ai/raw/03-TECHNICAL_SPECS.md` §11.

## Related Topics

- [[KNOW-017]] accessibility details
- [[KNOW-021]] collection jobs and `sync_runs`
- [[KNOW-023]] security
