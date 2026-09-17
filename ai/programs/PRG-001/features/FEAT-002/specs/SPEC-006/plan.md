---
type: plan
for: SPEC-006
status: draft
---

# Implementation Plan

## Summary

No server-side code exists in the repository yet — SPEC-001 (FEAT-001)
built only the client-side design system. This Plan introduces the
first `src/lib/server/` code: a generic, source-agnostic HTTP client
(`createHttpClient`) implementing timeouts, bounded/selective retries
with backoff+jitter, `Retry-After` handling, and Zod-based response
validation, plus a thin Compras.gov.br-specific client built on top of
it. Every dataset-specific source adapter in FEAT-002
(SPEC-008–SPEC-012) will call through this one client rather than
each reimplementing HTTP behavior.

## Repository Context

- Confirmed via direct inspection: `src/lib/` currently contains only
  `actions/`, `assets/`, `components/`, `design-system/`, and `icons/`
  — no `server/` directory exists yet.
- `package.json` has no HTTP client library, no schema-validation
  library (no `zod`), and no `COMPRAS_GOV_BASE_URL` environment
  variable wired up anywhere (SvelteKit's `$env/dynamic/private` isn't
  used yet).
- `internal context SPEC-006 --intent planning` succeeded and returned
  the Constitution plus this Spec's own requirements — no `depends_on`
  Specs to reconcile (SPEC-006 has none).

## Requirement Coverage

- **R1 (cancellation + timeout)** → `createHttpClient`'s `request()`
  combines the caller's own `AbortSignal` (if provided) with an
  internally created `AbortSignal.timeout(timeoutMs)` via
  `AbortSignal.any([...])` (Node 20+/modern browsers), so either the
  caller aborting or the timeout elapsing aborts the underlying
  `fetch`. A timeout abort is caught and re-thrown as a
  `SourceRequestError` with `kind: 'timeout'`, never left as an
  unhandled `AbortError`.
- **R2 (bounded, selective retries)** → `retry.ts`'s `isRetryable(err)`
  returns true only for: a network-level connection reset, a timeout
  abort (`kind: 'timeout'`), and HTTP responses with status 429, 502,
  503, or 504. Any other HTTP status (specifically including 400 and
  404) returns false. The client's retry loop calls
  `computeBackoffDelay(attempt, retryAfterMs)` — exponential
  (`baseDelayMs * 2^attempt`) with random jitter, floored at
  `retryAfterMs` when the failing response included a `Retry-After`
  header — and stops after a configurable `maxRetries` (default 3,
  i.e. 4 total attempts).
- **R3 (no invented rate limit)** → the client applies no proactive
  request-rate ceiling or token bucket of its own; the only throttling
  is the reactive backoff triggered by R2's retry path on an actual
  429/`Retry-After`. No fixed "requests per second" configuration
  exists to accidentally invent a limit Compras.gov.br never
  documented.
- **R4 (runtime validation before normalization)** → `request<T>()`
  accepts a required `schema: ZodType<T>` parameter. After a
  successful HTTP response, the client JSON-parses the body then calls
  `schema.safeParse(json)`. On failure, it throws a
  `SourceValidationError` (distinct class from `SourceRequestError`)
  carrying the Zod issues; only on success does `request()` return the
  validated, typed value to the caller. A source adapter (SPEC-008+)
  therefore cannot see an unvalidated payload — validation is not
  optional per call site.
- **R5 (structured errors with observability metadata)** → both
  `SourceRequestError` and `SourceValidationError` extend a common
  `SourceError` base carrying `source: string`, `endpoint: string`,
  `status?: number`, `attempt: number`, and `durationMs: number`,
  populated by the client at each throw site (including inside the
  retry loop, so a final error reflects the last attempt's metadata,
  not the first).

## Architecture

```text
src/lib/server/
├── http/
│   ├── httpClient.ts    createHttpClient(), request<T>()
│   ├── retry.ts         isRetryable(), computeBackoffDelay()
│   └── errors.ts        SourceError, SourceRequestError, SourceValidationError
└── sources/
    └── comprasgov/
        └── client.ts    comprasgovClient = createHttpClient({ baseUrl: env.COMPRAS_GOV_BASE_URL, source: 'comprasgov' })
```

`http/` is deliberately source-agnostic (not nested under `sources/
comprasgov/`), even though Compras.gov.br is the only source today —
KNOW-003's own architecture reserves room for a future `sources/
portalcp/` adapter, and a shared, reusable HTTP layer is what makes
that later addition cheap. `sources/comprasgov/client.ts` is a thin
pre-configured instance (base URL from
`$env/dynamic/private.COMPRAS_GOV_BASE_URL`, `source: 'comprasgov'`
baked into every error) that SPEC-008–SPEC-012's endpoint modules
import and call `.request(...)` on, passing their own Zod schema per
endpoint.

## Components Affected

All new — no existing file is modified. New files: `src/lib/server/
http/httpClient.ts`, `src/lib/server/http/retry.ts`, `src/lib/server/
http/errors.ts`, `src/lib/server/sources/comprasgov/client.ts`, plus
one test file per module.

## Data Changes

None. This Spec makes no database changes.

## API Changes

None. This Spec adds no SvelteKit routes; it is purely an outbound
HTTP client used server-side by future sync jobs.

## Integration Changes

- New dependency: `zod`, for R4's runtime response validation.
- New environment variable consumed: `COMPRAS_GOV_BASE_URL` (already
  named in KNOW-002's documented configuration list; not previously
  wired into any code).

## Implementation Sequence

1. Add `zod` as a dependency.
2. Implement `src/lib/server/http/errors.ts`: `SourceError` base class
   and its two subclasses, each requiring `source`/`endpoint`/
   `attempt`/`durationMs` (and `status` where applicable) at
   construction — no error can be thrown without this metadata.
3. Implement `src/lib/server/http/retry.ts`: `isRetryable()` and
   `computeBackoffDelay()` as pure functions (no I/O), so they're
   directly unit-testable without mocking `fetch`.
4. Implement `src/lib/server/http/httpClient.ts`: `createHttpClient()`
   composing the above — request loop, timeout/abort composition,
   retry-with-backoff, JSON parsing, Zod validation, structured error
   throwing.
5. Implement `src/lib/server/sources/comprasgov/client.ts`: the
   pre-configured instance reading `COMPRAS_GOV_BASE_URL` from
   `$env/dynamic/private`.
6. Write tests alongside each module (steps 2–5), per the
   Constitution's test-first preference — not deferred to the end.

## Test Strategy

- All tests run in Vitest's existing "server" project (Node
  environment, `src/**/*.{test,spec}.{js,ts}` excluding
  `*.svelte.test.ts` — see SPEC-001's test infrastructure), since this
  is server-only code with no DOM/browser involvement.
- `retry.ts` is tested directly as pure functions: `isRetryable()`
  against each status code in R2's allow/deny lists; `computeBackoffDelay()`
  for exponential growth, jitter bounds, and the `Retry-After` floor.
- `httpClient.ts` is tested by stubbing `globalThis.fetch`
  (`vi.stubGlobal('fetch', vi.fn(...))`) to simulate: a 503 followed by
  a 200 (asserts retry + eventual success + correct attempt count in
  the final result's metadata), a 404 (asserts zero retries), a
  response with `Retry-After: 5` followed by a retryable status
  (asserts the backoff delay honors it, using fake timers), a request
  that never resolves before the timeout (asserts abort + a
  `SourceRequestError` with `kind: 'timeout'`, using fake timers so the
  test doesn't actually wait out the real timeout), and a response body
  that fails Zod validation (asserts `SourceValidationError`, and that
  `fetch` is not called again — a validation failure is not retried,
  since R2 only lists network/HTTP-status conditions as retryable).
- `comprasgov/client.ts` is tested by asserting it constructs a
  `createHttpClient` instance with `source: 'comprasgov'` and the
  configured base URL, using a stubbed `$env/dynamic/private` module
  (SvelteKit's standard pattern for testing env-dependent code).

## Risks

- The real Compras.gov.br API's actual error/response conventions
  (exact status codes used, whether `Retry-After` is ever actually
  sent) are unconfirmed in this environment — R2/R5's behavior is
  implemented per KNOW-003's documented rules, not verified against
  live traffic. SPEC-008's own Unresolved Question already flags a
  related concern (incremental-fetch support); this Plan does not
  resolve that either.
- `AbortSignal.any()` requires Node 20.3+ (or a modern browser, though
  this code only ever runs server-side). If the deployment target ends
  up pinned to an older Node version, this composition approach would
  need a manual fallback (listening on both signals and calling a
  shared `AbortController.abort()`); flagged here rather than silently
  assumed compatible.

## Assumptions

- Native `fetch` (Node's built-in `undici`-backed implementation, or
  the browser's for tests that happen to run under the "client"
  project — though this module is server-only) is used directly,
  rather than adding an HTTP client library (`axios`, `ky`, `got`) —
  consistent with the project's minimal-dependency stance, and `fetch`
  already supports `AbortSignal` natively.
- Retry/backoff logic (`retry.ts`) is hand-rolled rather than adding a
  library (`p-retry`, `cockatiel`) — the specific rules in R2 (an exact
  status allow-list, a `Retry-After` floor) are simple enough to
  implement directly and precisely, and a library would add a
  dependency to work around a ~40-line function.
- `zod` is the schema-validation library, per the user's own decision
  when resolving ADR-003 ("ex: Zod").
- Default retry budget is `maxRetries: 3` (4 total attempts) with a
  base backoff of 300ms — a reasonable default not otherwise dictated
  by Knowledge; callers (SPEC-008+) may override per endpoint if a
  concrete need arises later.
