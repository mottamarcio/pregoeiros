---
id: SPEC-006
type: spec
status: draft
parent: FEAT-002
depends_on: []
supersedes: []
---

# SPEC-006

## Intent

Provide the single shared HTTP client abstraction every Compras.gov.br
source adapter uses, so timeout/retry/error/validation behavior is
implemented once and is uniform across every upstream endpoint, rather
than reimplemented per dataset.

## Requirements

### R1 — Every upstream request supports cancellation and a timeout

Every request issued through the client accepts an `AbortSignal` and a
per-request timeout. A request that exceeds its timeout is aborted and
surfaces as a structured timeout error, not an unhandled rejection or a
hang.

### R2 — Retries are bounded and limited to transient failures

The client retries a failed request only for: connection reset, a
timeout where retry is appropriate, and HTTP 429, 502, 503, 504. It
NEVER retries HTTP 400 or 404 (or any other 4xx client error).
Retries use exponential backoff with jitter and are bounded by a
configurable maximum attempt count. If the response includes a
`Retry-After` header, the client waits at least that long before its
next attempt.

### R3 — The client never invents an upstream rate limit

The client applies no fixed request-rate ceiling that Compras.gov.br
itself does not document. Its only self-imposed throttling is the
backoff triggered by an actual 429/`Retry-After` response.

### R4 — Every response is runtime-validated before normalization

Every response the client returns to a caller has been validated
against a schema describing that endpoint's expected shape (e.g. via
Zod) before the caller (a normalizer) ever sees it. A response that
fails validation is surfaced as a structured, typed validation error —
distinct from a network/HTTP error — and is never passed through to
normalization as if it were valid.

### R5 — Errors are structured and carry observability metadata

Every error the client surfaces (timeout, network, HTTP status, or
validation) is a typed error object carrying at minimum: the source
name, the endpoint, the HTTP status (when applicable), the attempt
number, and the duration of the failed attempt.

## Acceptance Scenarios

- **Given** an upstream endpoint returns HTTP 503, **when** the client
  requests it, **then** the client retries with exponential backoff up
  to the configured maximum, and the caller receives either an
  eventual success or a structured error after retries are exhausted.
- **Given** an upstream endpoint returns HTTP 404, **when** the client
  requests it, **then** the client does not retry and immediately
  surfaces a structured error to the caller.
- **Given** an upstream response includes `Retry-After: 5`, **when**
  the client's next retry attempt would otherwise fire sooner,
  **then** it waits at least 5 seconds before retrying.
- **Given** a request exceeds its configured timeout, **when** the
  timeout elapses, **then** the in-flight request is aborted and a
  structured timeout error is returned — the caller is never left
  waiting indefinitely.
- **Given** an upstream endpoint returns a response that does not match
  its expected schema (e.g. a renamed or missing field), **when** the
  client validates it, **then** it returns a structured validation
  error and does not forward the malformed payload to a normalizer.

## Edge Cases

- A response passes HTTP-level success (200) but the body is not valid
  JSON — this is a validation failure (R4), not silently treated as an
  empty/default value.
- Multiple retry-eligible failures in a row exhaust the maximum
  attempt count — the client surfaces the last structured error, not a
  generic "retries exhausted" message with no diagnostic detail.
- `Retry-After` is present but implausibly large (e.g. hours) — the
  client respects it as documented (KNOW-003: "respect it where
  practical") but this Spec does not mandate an upper bound; a Plan may
  choose to cap it defensively.

## Constraints

- All Compras.gov.br communication happens server-side only (Constitution
  Architecture Invariant) — this client is never imported into
  browser-executed code.
- The client must not assume an undocumented rate limit (Constitution
  Integration Invariant).
- Must be covered by tests using recorded/synthetic fixtures; must not
  require the live Compras.gov.br service to run (FEAT-002 Constraints).

## Non-Goals

- Endpoint-specific DTOs, normalization, or business logic for any
  dataset — those belong to SPEC-008 (Catalog), SPEC-009 (Suppliers),
  SPEC-010 (Procurements), SPEC-011 (Results), SPEC-012 (Prices).
- Job scheduling, checkpoints, or sync-run tracking — that is SPEC-007.
- Response caching beyond what the local-read-model architecture already
  provides via PostgreSQL (KNOW-003) — no separate HTTP cache layer.

## Unresolved Questions

None — R4's runtime-validation-on-every-DTO approach resolves ADR-003
for this Program (user-confirmed).

## Sources

[[KNOW-003]] (HTTP client rules, retry/backoff/Retry-After behavior,
no invented rate limit), Constitution `Integration Invariants` and
`Architecture Invariants`.
