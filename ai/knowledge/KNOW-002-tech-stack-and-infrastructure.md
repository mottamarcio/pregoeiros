---
id: KNOW-002
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
---

# KNOW-002

## Summary

Pregoeiros is built as a single SvelteKit application (web + server-side
layer) backed by PostgreSQL, containerized with Docker/Docker Compose. No
separate backend service, queue infrastructure, or search engine is planned
for the initial (MVP) architecture.

## Known Facts

- Application stack: **Svelte 5** (idiomatic, using runes where it makes
  sense), **SvelteKit**, **TypeScript**, **Tailwind CSS**, **Iconify**.
- SvelteKit handles both the web application and the server-side layer
  (pages/layouts, server routes/actions, services) — no separate Go or other
  backend is planned initially, to avoid unneeded operational complexity.
- **PostgreSQL** is the sole persistence layer, run in Docker for development
  and self-hosted deployments. In dev, SvelteKit MAY run on the host while
  only PostgreSQL runs in Docker, for better DX; in production/self-hosted,
  both may be containerized.
- Explicit non-goals for the initial architecture: microservices, Kubernetes,
  event streaming, Redis, Elasticsearch, a separate Go backend, native mobile
  app, real-time bidding, procurement submission workflows, supplier scoring/
  automated risk classification, ML infrastructure, and a complete replica of
  every Compras.gov.br dataset.
- Docker repo structure: `docker-compose.yml`, `Dockerfile`, `.env.example`.
  Compose services: `app` (depends on `postgres`, ideally with
  `condition: service_healthy`) and `postgres` (image `postgres`, volume
  `postgres_data:/var/lib/postgresql/data` that MUST survive app container
  replacement).
- Configuration is via environment variables: `DATABASE_URL`,
  `COMPRAS_GOV_BASE_URL`, `SYNC_ENABLED`, `SYNC_CRON`, `LOG_LEVEL`. Secrets
  MUST NOT be committed to the repository; `.env.example` may document
  required variables without real credentials.
- Persistence/DB access library (Drizzle, Kysely, or direct typed SQL) is
  explicitly left as an implementation-level decision (ADR-001), but the
  chosen approach SHOULD keep SQL visible/expressive because Pregoeiros is
  expected to become increasingly analytics-heavy; an ORM that encourages
  loading large object graphs into memory should be avoided for analytics.
- Additional infrastructure (Redis, queue system, dedicated search engine,
  object storage, analytical warehouse) requires an ADR and a demonstrated
  requirement before being introduced — not part of MVP.

## Constraints

- No Redis/BullMQ, Elasticsearch/Meilisearch, or microservices without
  demonstrated need (explicit MVP architecture constraint).
- Every upstream (Compras.gov.br) request must go through the server; the
  browser must never talk to Compras.gov.br directly (see [[KNOW-003]]).
- Migrations must be part of the application from the first schema; runtime
  request handlers must never implicitly create schema ("if table doesn't
  exist, CREATE TABLE...") (see [[KNOW-004]]).

## Unknowns

- Final choice between Drizzle/Kysely/direct SQL (ADR-001) is undecided.
- Migration tooling (ADR-002) is undecided, pending ADR-001.
- Exact deployment platform/scheduler for background jobs beyond "cron /
  Docker scheduler pattern / host scheduler / deployment platform scheduler"
  is unspecified (ADR-004, see [[KNOW-005]]).

## Conflicts

None — PRD and Architecture Spec agree on stack, infra, and non-goals.

## Provenance

- Stack and infra diagrams: `ai/raw/product-requirements-specification.md` §3, §27.
- Non-goals, database/infra section, ADR framing: `ai/raw/architecture-specification.md` §3–4, §49, §70 (ADR-001, ADR-002, ADR-004).

## Related Topics

[[KNOW-003]], [[KNOW-004]], [[KNOW-005]], [[KNOW-011]]
