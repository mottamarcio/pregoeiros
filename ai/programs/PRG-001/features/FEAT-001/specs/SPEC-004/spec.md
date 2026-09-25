---
id: SPEC-004
type: spec
status: draft
parent: FEAT-001
depends_on: [SPEC-002]
supersedes: []
---

# SPEC-004 — Seed Mechanism

## Intent

Provide one idempotent, transactional seeding mechanism with `dev` and
`prod` profiles. Each Feature contributes seed modules for the tables it
owns, so the PoC dataset (with the D-decision corrections) can be rebuilt
for offline development. Production receives only its minimal bootstrap
data. This Spec defines the mechanism, not the data.

## Requirements

### R1 — Seed command and profiles

`npm run db:seed -- --profile=dev` and `npm run db:seed -- --profile=prod` run every seed module registered for that profile. An unknown or missing profile exits non-zero with a usage message.

### R2 — Module registry

A seed module declares:

- a unique `name`;
- the profiles it belongs to (`dev`, `prod` or both);
- the names of modules it depends on;
- a `run(tx)` function.

The runner executes modules in dependency order. A missing dependency or a cycle aborts before anything is written, with an error naming the modules involved.

### R3 — Idempotency

Seed modules write with upserts by natural key. Running the same profile twice in a row leaves exactly the same rows (count and content) as running it once.

### R4 — Transactional all-or-nothing

All modules of one run execute inside a single database transaction. If any module fails, the whole run rolls back, and the command exits non-zero naming the failing module.

### R5 — Dev profile is blocked in production

Running the `dev` profile when `NODE_ENV=production` exits non-zero without writing anything. The `prod` profile runs in any environment.

### R6 — Run summary

On success, the command prints one line per executed module with its name and the number of rows written, and exits 0.

### R7 — Programmatic use in tests

Integration tests can invoke the runner (whole profile or selected modules) against the test database without spawning the CLI.

### R8 — Empty registry is valid

With no modules registered for a profile (the state right after FEAT-001), running that profile succeeds, prints that nothing was seeded, and exits 0.

## Acceptance Scenarios

- **Given** modules `a` (dev) and `b` (dev, depends on `a`), **when** `--profile=dev` runs, **then** `a` executes before `b` and the summary lists both.
- **Given** a completed dev seed, **when** `--profile=dev` runs again, **then** every table touched has the same row count and content as before.
- **Given** module `b` throws, **when** `--profile=dev` runs, **then** rows written by `a` in this run are rolled back and the exit code is non-zero, naming `b`.
- **Given** `NODE_ENV=production`, **when** `--profile=dev` runs, **then** it exits non-zero and no row is written.
- **Given** modules `x` → `y` → `x` (cycle), **when** any profile runs, **then** it aborts before writing and names the cycle.
- **Given** no module registered, **when** `--profile=prod` runs, **then** it exits 0 reporting nothing to seed.

## Edge Cases

- A module registered for both profiles runs in each, still idempotently.
- A module depending on a module of another profile only (e.g. prod depends on dev-only): the runner reports it as a missing dependency for that profile.
- A seed run concurrent with an application write to the same row: upsert semantics apply; no lock beyond the transaction is required in v1.
- `--profile` passed twice or with different casing (`DEV`): profiles are case-sensitive; invalid values fail with the usage message.

## Constraints

- Constitution: official IDs are never invented in production data; tests cover every behavior; parameterized SQL.
- Contributing Features' dev data must reproduce the PoC with the D-08 (distinct CATMATs, correct fit), D-15 (hospital alert fixed) and D-40 (4 monitored products) corrections. Illustrative CNPJs and IDs are allowed in the `dev` profile only.
- Production bootstrap data (tenant, admin, initial monitored products) is contributed by FEAT-002 and FEAT-008 as `prod` modules.

## Non-Goals

- The seed data itself (contributed by each owning Feature).
- Resetting/dropping the database (`db:reset`) — not required by the sources.
- Anonymized or production-like bulk data generation.

## Unresolved Questions

- None.

## Sources

- [[KNOW-030]] PoC dataset, dev vs. prod seed policy, D-08/D-15/D-40
- [[KNOW-024]] upserts by natural key
- [[KNOW-023]] production seed contents
- `ai/raw/06-DECISOES.md` D-08, D-15, D-40
- Project owner decision (2026-09-25): mechanism in FEAT-001, data contributed per Feature (including PoC extras where tables exist)
