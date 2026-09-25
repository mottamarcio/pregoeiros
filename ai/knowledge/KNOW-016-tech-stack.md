---
id: KNOW-016
type: knowledge
status: active
sources:
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
  - path: ai/raw/07-DECISOES.md
    fingerprint: sha256:1ec28917fc00f20b87000eafdd6aa440339832b11756a8d3755ef0e1b823f1e8
---

# KNOW-016 — Technology Stack

## Summary

Svelte 5 + SvelteKit 2 + TypeScript strict + Tailwind + Iconify on the front;
Node 24 LTS (D-42) with adapter-node on the server; PostgreSQL 16 in Docker for
persistence; Zod for validation; Vitest and Playwright for tests.

## Known Facts

| Layer | Choice | Reason given |
|---|---|---|
| UI | Svelte 5 (runes) | Explicit reactivity; PoC is monolithic HTML+JS today |
| Meta-framework | SvelteKit 2 | SSR, `load`, form actions, `$lib/server` |
| Language | TypeScript 5 strict | Government API contracts are wide; type the internal domain |
| CSS | Tailwind CSS 4 (or 3) | PoC already uses Tailwind; accent slate-900 |
| Icons | Iconify (`iconify-icon` web component or `@iconify/svelte`) | PoC uses `lucide:*` via Iconify |
| Font | Inter + JetBrains Mono (Google Fonts) | Visual parity with PoC |
| Database | PostgreSQL 16 in Docker | Relational, validity windows, `pg_trgm`, JSONB for raw payload |
| Data access | Drizzle ORM **or** `postgres.js` + typed SQL | Preference: Drizzle for migrations and types; KISS if team prefers raw SQL |
| Internal HTTP | native `fetch` on the server | No axios |
| Validation | Zod | Querystring, actions, job DTOs |
| Unit tests | Vitest | Aligned with Vite |
| Component tests | Vitest + Testing Library (Svelte) | — |
| BDD / E2E | Playwright with light Gherkin (`describe` in pt-BR) or `playwright-bdd` | PoC journeys |
| Runtime | **Node 24 LTS** (D-42; the Technical Spec says Node 22) + `@sveltejs/adapter-node` | Cron in the same process initially |
| Containers | Docker Compose | `web` + `db` (names per D-27) |

- Scheduling library: `node-cron` (option A), inside the Node process.
- PostgreSQL extensions: `pgcrypto` (or `uuid-ossp`) and `pg_trgm` (no `citext`, per D-24).
- Architecture header: "Svelte 5 + SvelteKit 2 + Tailwind CSS + Iconify + PostgreSQL (Docker)"; principles SOLID, KISS, DRY, YAGNI, TDD, BDD.
- Optional instrumentation file `instrumentations.server.ts`; no APM required in v1.
- **Decision D-26 — stack choices:**
  - D-26a: **Tailwind CSS v4** (tokens declared in `@theme` in CSS).
  - D-26b: **Drizzle ORM** for schema, migrations and types.
  - D-26c: icons via **`unplugin-icons` + `@iconify-json/lucide`** — still the Iconify/Lucide set, but compiled at build time, SSR-friendly, no runtime calls to the Iconify API.
  - D-26d: E2E with **plain Playwright**, test titles in pt-BR Dado/Quando/Então (no `playwright-bdd`).
- Authentication: minimal session implementation (D-25, details in [[KNOW-023]]).
- `users.email` is `text` with a `lower(email)` unique index, so no `citext` extension is needed (D-24).
- **Decision D-42 — Node.js version:** Node 24 LTS in development, CI and the production image (`engines.node` `>=24 <25`, `.nvmrc` `24`). Rationale: Node 22 reaches end of life on 2027-04-30, shortly after the planned v1 delivery.

## Constraints

- No axios; use native `fetch`.
- No Chart.js required in v1 (simple SVG).
- No message broker, Elasticsearch or ML libraries in v1.

## Unknowns

- None remaining. Tailwind, data access, icons and BDD flavor resolved by D-26a–d; auth library resolved by D-25.

## Conflicts

- None remaining. The `citext` inconsistency was resolved by D-24 (plain `text` + `lower()` unique index).

## Provenance

- Stack table, fetch/no-axios, Zod, test tooling, runtime, Chart.js: `ai/raw/03-TECHNICAL_SPECS.md` §1, §5.2, §7.
- Architecture stack header and principles, YAGNI exclusions: `ai/raw/02-ARCHITECTURAL_SPECS.md` header, §2.1, §9.
- Extensions and `citext`: `ai/raw/05-DATA_MODEL_SPECS.md` header, §4.
- Decisions D-24, D-25, D-26: `ai/raw/06-DECISOES.md`.
- Decision D-42: `ai/raw/07-DECISOES.md`.

## Related Topics

- [[KNOW-015]] project structure
- [[KNOW-017]] UI design system
- [[KNOW-018]] deployment
- [[KNOW-028]] testing strategy
