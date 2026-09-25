---
id: KNOW-018
type: knowledge
status: active
sources:
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-018 — Deployment, Runtime and Configuration

## Summary

v1 runs as a Docker Compose stack with a SvelteKit (adapter-node) web container
and a PostgreSQL 16 container; the collection cron can run inside the Node
process. Configuration is via environment variables.

## Known Facts

- **Containers:**

  | Container | Technology | Responsibility |
  |---|---|---|
  | `web` | SvelteKit 2 (adapter-node) | SSR, routes, internal API, UI |
  | `db` | PostgreSQL 16 (Docker) | Persistence |
  | `cron` | Node process in the same service **or** sidecar container | Triggers sync at 03:15 and 15:15 |
  | `compras-gov` | Public HTTPS | External source |

- In v1 the cron can run **inside** the Node process (`node-cron`, or a systemd timer calling `npm run job:sync`) to avoid extra orchestration. Separate the worker only when collection time competes with requests.
- Runtime: `web → node build/index.js` (adapter-node); `db → postgres:16-alpine`.
- **Docker Compose (as written in the Technical Spec; adjusted by D-27/D-28 below):** service `db` (`postgres:16-alpine`, user/password/db `pregoeiros`, port `5432:5432`, volume `pgdata`, healthcheck `pg_isready -U pregoeiros` every 5 s); service `app` (`build: .`, `env_file: .env`, port `5173:5173`, depends on `db` healthy).
- **Environment variables:**
  ```
  DATABASE_URL=postgres://pregoeiros:pregoeiros@db:5432/pregoeiros
  COMPRAS_GOV_BASE_URL=https://dadosabertos.compras.gov.br
  COMPRAS_GOV_PAGE_SIZE=100
  COMPRAS_GOV_MAX_PAGES_PER_MODULE=50
  CRON_TZ=America/Sao_Paulo
  SYNC_CRON=15 3,15 * * *
  ENABLE_CRON=true
  AUTH_DISABLED=false
  PUBLIC_APP_NAME=Pregoeiros
  ```
- Nothing prefixed `PUBLIC_` may contain a database URL.
- Secrets are read in `$lib/server/env.ts`.
- **Healthcheck:** `GET /api/health` checks Postgres and the latest `sync_runs` (contract in [[KNOW-022]]).
- Migrations versioned in `src/lib/server/db/migrations`; `pg_trgm` created in the initial migration.
- A test compose file `compose.test.yml` provides a test Postgres for repository integration tests.
- **Decision D-27 — service names:** Compose services are **`web`** + **`db`** (plus `cron` if it ever becomes a sidecar).
- **Decision D-28 — port and run mode:** the default Compose runs the production build, `node build/index.js`, on port **3000** (adapter-node default). Development runs `vite dev` locally on port 5173 against the Compose `db`, or via a separate `compose.dev.yml`.

## Constraints

- `ENABLE_CRON=true` on only **one** replica (cron in-process must not run on multiple replicas).
- `AUTH_DISABLED=true` is allowed only in development.

## Unknowns

- Production hosting target (VM, PaaS, Kubernetes) — only "Docker Compose (dev/prod simples)" is stated.
- Backup/restore strategy for PostgreSQL — not mentioned.
- TLS termination / reverse proxy — not mentioned.
- Whether a separate `node build/job.js` entrypoint is built (needed for cron option B, see [[KNOW-021]]).

## Conflicts

- None remaining. Service names resolved by D-27; app port/run mode resolved by D-28.

## Provenance

- Containers, in-process cron, runtime, variables, healthcheck, migrations: `ai/raw/02-ARCHITECTURAL_SPECS.md` §3.2, §8.
- Env vars, compose, `PUBLIC_` rule, `pg_trgm` migration, `ENABLE_CRON` single replica, `AUTH_DISABLED`, `compose.test.yml`: `ai/raw/03-TECHNICAL_SPECS.md` §1, §5.2, §8, §10.2, §13, §14.
- Decisions D-27, D-28: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-014]] architecture
- [[KNOW-021]] scheduled data collection
- [[KNOW-023]] authentication and security
