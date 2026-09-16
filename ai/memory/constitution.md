---
type: constitution
status: active
schema_version: 1
---

# Pregoeiros — Constitution

Durable, non-negotiable invariants for Pregoeiros, distilled from the
project's Knowledge base (`ai/knowledge/KNOW-001` … `KNOW-011`). This
document states rules that must hold for the life of the project — not
preferences, not current implementation choices, not anything reasonably
expected to change. Ordinary facts remain in Knowledge.

## Product Invariants

- Pregoeiros MUST NOT be a thin proxy or visual wrapper around the
  Compras.gov.br Swagger API. It owns a normalized domain model and answers
  real user questions through navigation, search, filters, and
  visualizations — never by exposing raw upstream endpoints/parameters.
- Product copy and UI MUST NOT imply a stronger factual claim than the
  underlying data supports (e.g., a supplier's presence in a process is never
  presented as a win; a result count is never relabeled as a stronger claim
  than what it measures; expiring contracts are never presented as
  guaranteeing a future procurement).
- Source-derived (observed) data and Pregoeiros-calculated (derived) data
  MUST always be visually and textually distinguishable, wherever both
  appear together.
- **Favoritos** (follow one specific entity) and **Interesses** (a persisted
  matching rule that watches for new occurrences) are permanently distinct
  concepts and MUST NOT be conflated in UI, data model, or product language.
- **Radar** is exclusively the event stream produced by monitored entities
  and rules (Favoritos + Interesses) — it MUST NOT become a generic
  notification center for unrelated events.
- All user-facing product copy MUST be Brazilian Portuguese (`pt-BR`).

## Architecture Invariants

- All external (Compras.gov.br) API communication MUST happen server-side.
  The browser MUST NEVER call Compras.gov.br, or any other external data
  source, directly.
- Upstream API schemas MUST NEVER become the application's domain model.
  Source DTOs are normalized into source-agnostic domain entities (e.g.
  `Procurement`, `Supplier`, `CatalogItem`) before they reach the rest of the
  application; upstream naming/shape differences terminate at the source
  adapter.
- Pregoeiros follows a **local read model**: ordinary web requests are
  served from PostgreSQL, not proxied live against the upstream API.
  Synchronization into PostgreSQL happens asynchronously in the background.
- Dependency direction points inward only: UI → routes/actions → services →
  {repositories, source adapters} → {PostgreSQL, external APIs}. A Svelte
  component MUST NEVER access the database or an external API directly; a
  route MUST NEVER access a repository directly, bypassing services.
- Database access MUST be isolated behind a repository layer. Routes and
  components MUST NEVER contain raw or arbitrary SQL.
- Background synchronization jobs MUST be idempotent, restartable, and safe
  to execute repeatedly. A synchronization checkpoint MUST NEVER advance
  before the corresponding batch of data has been durably persisted.
- Bootstrap (historical backfill) and incremental synchronization MUST share
  the same normalization and persistence code paths — the system MUST NEVER
  maintain two independent import implementations.
- Additional infrastructure (a message queue, a dedicated search engine, a
  separate backend service, microservices) MUST NOT be introduced without a
  demonstrated, measured need. PostgreSQL and SvelteKit's own capabilities
  must be exhausted first.

## Security Invariants

- The browser MUST NEVER receive database credentials, upstream API
  secrets, internal synchronization credentials, or an unrestricted database
  interface.
- All database queries MUST be parameterized.
- All server-side inputs MUST be validated.
- Interest (and any other user-defined query/filter) definitions MUST use a
  constrained, application-validated schema. Arbitrary user-provided SQL or
  query expressions are forbidden.
- Secrets MUST NEVER be committed to the repository.
- External/upstream strings rendered in the UI MUST be treated as untrusted
  data.
- Data exports MUST apply the same authorization boundaries as the
  equivalent web views once multi-user authentication exists.

## Data Invariants

- Every record imported from an external source MUST retain provenance: at
  minimum `source`, `source_id`, and `fetched_at`.
- The pair `(source, source_id)` MUST be unique wherever the upstream entity
  provides a stable identifier.
- Internal database identifiers MUST remain independent from, and never be
  coupled to, upstream/external identifier formats.
- Schema changes MUST be migration-driven. Runtime request handlers MUST
  NEVER implicitly create or alter schema.
- Fields required for filtering, joining, sorting, analytics, or application
  behavior MUST be modeled as proper columns/relationships. PostgreSQL MUST
  NEVER become an indiscriminate JSON archive for raw upstream payloads.
- Aggregation and analytical computation belongs in PostgreSQL. The
  application MUST NEVER load large result sets into application memory
  merely to compute aggregates that PostgreSQL can compute directly.
- Records tied to per-user concepts (Favorites, Interests, Radar events)
  MUST carry a `user_id` boundary, even while the deployment operates with a
  single implicit user.

## Integration Invariants

- Every upstream HTTP request MUST support cancellation (`AbortSignal`),
  timeouts, structured errors, and bounded retries with observability
  metadata.
- Retries MUST occur only for transient failures (connection reset,
  appropriate timeouts, HTTP 429/502/503/504), MUST use exponential backoff
  with jitter, and MUST respect a `Retry-After` header when present.
  Ordinary client errors (HTTP 400, 404) MUST NEVER be retried.
- The application MUST NEVER assume an upstream rate limit that is not
  actually documented by the source.
- The application MUST prefer degraded read availability over complete
  failure whenever local data already exists. An upstream outage makes data
  stale — it MUST NEVER make the entire application unavailable.

## Quality Requirements

- Code MUST follow SOLID, DRY, KISS, and YAGNI: no speculative abstraction,
  no duplicated logic, no unnecessary complexity ahead of a demonstrated
  need.
- Every change to behavior MUST be covered by tests. Prefer writing the
  test first (TDD) and specifying behavior through concrete scenarios before
  implementation (BDD).
- A reusable UI component enters the shared component library only once it
  is actually reused by more than one call site — no premature abstraction
  of one-off UI.
- The same semantic action MUST always use the same shared component (e.g.
  every primary action uses the same `Button` variant; every favorite toggle
  uses the same `FavoriteButton`; every entity status uses the same
  `StatusBadge`) rather than reimplementing the pattern per route.

## Compatibility Requirements

- The application stack is fixed to: Svelte 5, SvelteKit, TypeScript,
  Tailwind CSS, and Iconify for the frontend/server-side layer, and
  PostgreSQL (running in Docker for development and self-hosted deployment)
  as the sole persistence layer. No separate backend service is part of the
  initial architecture.
- The MVP is light-theme only, with `slate-900` as the fixed primary accent
  color.
- The UI targets WCAG 2.2 AA accessibility: full keyboard operability, visible
  focus states, accessible form labels and button names, modal focus
  trapping with focus restoration, and state that is never communicated by
  color alone.
- All numeric, currency, and date formatting follows `pt-BR` conventions
  (Brazilian grouping/decimal separators, `DD/MM/YYYY` dates, BRL currency
  formatting).

---

*This Constitution is distilled from the project's Knowledge base. It
records invariants only — see `ai/knowledge/` for the full body of
supporting facts, context, and open questions.*
