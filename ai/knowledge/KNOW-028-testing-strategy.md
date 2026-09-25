---
id: KNOW-028
type: knowledge
status: active
sources:
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
  - path: ai/raw/07-DECISOES.md
    fingerprint: sha256:1ec28917fc00f20b87000eafdd6aa440339832b11756a8d3755ef0e1b823f1e8
---

# KNOW-028 — Testing Strategy (TDD, Integration, BDD)

## Summary

Tests are built inside-out: pure domain functions first with unit tests (TDD),
then integration contracts for the HTTP client and repositories, then 8–12 BDD
end-to-end journeys mirroring the PoC.

## Known Facts

- **TDD (inside-out), no I/O first:**
  - `normalizeSearch`, `parseExclusionQuery`
  - `classifyUrgency(diasRestantes)`
  - `matchesAlert(alerta, edital, itens)`
  - `priceStats(sample)`
  - upstream DTO → domain mapper
- **Integration contracts:**
  - HTTP client against a mock server (MSW or JSON fixture recorded from Swagger).
  - Repositories against a test Postgres (`docker compose -f compose.test.yml`).
- **BDD journeys (Playwright), example scenarios:**
  1. Given 4 pending notices and 2 with deadline ≤ 48h, when the analyst opens the Triage Queue, then counters show "4 editais" and "2 urgentes". (Per D-03 the fixture must contain exactly 2 `critico` notices — deadline ≤ 48h.)
  2. Given the TRF2 notice with 3 CATMAT items, when the analyst opens the Triage Sheet, then the table lists exactly those 3 items.
  3. Given alert "Notebooks no RJ", when the job persists a notebook procurement in RJ, then the Radar shows 1 unseen `contratacao` event.
  4. Given the sheet is open, when the analyst clicks GO, then the badge becomes "Participando (GO)" and the item appears in Salvos.
- BDD style: journeys in business language (architecture example: "dado um alerta de notebooks no RJ, quando chegar contratação compatível, então surge evento não visto no radar").
- **v1 target:** high coverage on pure functions + 8–12 PoC E2E journeys. Do **not** chase 100% line coverage on visual components.
- Repository fakes (LSP) substitute real repositories in service tests.
- Tooling: Vitest (unit), Vitest + Testing Library Svelte (components), **plain Playwright** (E2E) with test titles in pt-BR Dado/Quando/Então, no `playwright-bdd` (D-26d) — see [[KNOW-016]].
- Test folders: `tests/unit`, `tests/integration`, `tests/e2e`.
- CI runs `svelte-check` (module privacy).
- F1 includes a contract test checking upstream parameter names against the Compras.gov.br OpenAPI (D-30).
- **Decision D-43 — E2E browsers:** Playwright E2E runs on **Chromium only**, locally and in CI.

## Constraints

- Pure functions (alert match, urgency, lexical exclusion, stats) must be born with unit tests.

## Unknowns

- The full list of the 8–12 E2E journeys (only 4 examples are given).
- Whether E2E runs against seeded PoC data or recorded upstream fixtures.
- CI provider and pipeline stages beyond `svelte-check`.

## Conflicts

- None remaining. The BDD scenario's counter definition is fixed by D-03.

## Provenance

- TDD list, integration contracts, BDD scenarios, coverage target: `ai/raw/03-TECHNICAL_SPECS.md` §10.
- TDD/BDD principles, LSP fakes, tests folder: `ai/raw/02-ARCHITECTURAL_SPECS.md` §2.1, §4.
- `svelte-check` in CI: `ai/raw/03-TECHNICAL_SPECS.md` §3.3.
- Decisions D-03, D-26d, D-30: `ai/raw/06-DECISOES.md`.
- Decision D-43: `ai/raw/07-DECISOES.md`.

## Related Topics

- [[KNOW-002]] acceptance criteria
- [[KNOW-016]] tech stack
