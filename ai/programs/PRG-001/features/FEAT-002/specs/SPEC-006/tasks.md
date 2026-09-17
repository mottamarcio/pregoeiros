---
type: tasks
for: SPEC-006
---

# Tasks

## TASK-001 — Add `zod` dependency

- [x] Done

**Requirements:** prerequisite for SPEC-006:R4, R5 (SourceValidationError
carries Zod issue data).
**Depends on:** none.
**Scope:** `package.json` / `package-lock.json` — add `zod` as a
production dependency.
**Verify:** `npm install` succeeds; `import { z } from 'zod'` resolves
with no TypeScript error in a throwaway file, then remove the
throwaway file.

**Evidence:** `npm install --save zod` added `zod@^4.6.5`. Verified via
a throwaway `src/__zod-import-check.ts` importing `{ z }` and building
a trivial schema; `npm run check` → `0 ERRORS 0 WARNINGS` (465 files).
Throwaway file deleted afterward. **Note for TASK-003/006:** installed
version is **Zod v4**, not v3 — v4 changed some API surface (e.g.
top-level `z.email()` instead of `.string().email()`) but `safeParse`,
which this Spec's requirements depend on, is unchanged between v3 and
v4; flagged so later Tasks don't assume v3-era API docs.

## TASK-002 — Implement `retry.ts` (`isRetryable`, `computeBackoffDelay`) + tests

- [x] Done

**Requirements:** SPEC-006:R2 — exact constraint: "retries only for: a
network-level connection reset, a timeout abort ..., and HTTP
responses with status 429, 502, 503, or 504. Any other HTTP status
(specifically including 400 and 404) returns false" and "exponential
(`baseDelayMs * 2^attempt`) with random jitter, floored at
`retryAfterMs` when the failing response included a `Retry-After`
header".
**Depends on:** none (pure functions; operates on primitive outcome
signals — an HTTP status number or a `'network-error' | 'timeout'`
sentinel — not on the error classes from TASK-003, to avoid a
circular/artificial dependency between the two modules).
**Scope:** `src/lib/server/http/retry.ts` and its test file.
**Verify:** `npx vitest run src/lib/server/http/retry.test.ts` —
`isRetryable` returns `true` for connection-reset/timeout/429/502/503/504
and `false` for every other status including 400 and 404;
`computeBackoffDelay` grows exponentially across attempts, includes
jitter (asserted via range, not exact equality), and never returns a
value below a given `retryAfterMs` floor when one is supplied.

**Evidence:** Implemented `RetryOutcome` (`{kind:'status',status}` |
`{kind:'network-error'}` | `{kind:'timeout'}`), `isRetryable()` (true
for network-error/timeout and status ∈ {429,502,503,504}, false
otherwise — verified explicitly for 400/404 plus 401/403/422/500/501),
and `computeBackoffDelay(attempt, {baseDelayMs, retryAfterMs})`
(exponential `baseDelayMs * 2^attempt` plus 0–50% jitter, floored at
`retryAfterMs` when supplied). `npx vitest run
src/lib/server/http/retry.test.ts` → **7 tests, all passed** (exponential
growth across attempts, jitter bounded within [exponential, 1.5×
exponential] across 50 samples with more than one distinct value
observed, `retryAfterMs` floor honored, no floor applied when absent).
Full suite re-run: `npm run test` → 23 files / 107 tests + both static
checks, all passing.

## TASK-003 — Implement `errors.ts` (`SourceError`, `SourceRequestError`, `SourceValidationError`) + tests

- [x] Done

**Requirements:** SPEC-006:R5 — exact constraint: both error classes
"extend a common `SourceError` base carrying `source: string`,
`endpoint: string`, `status?: number`, `attempt: number`, and
`durationMs: number`"; prerequisite for R4 (`SourceValidationError`
carries Zod issues).
**Depends on:** TASK-001 (needs `zod`'s issue type for
`SourceValidationError`).
**Scope:** `src/lib/server/http/errors.ts` and its test file.
**Verify:** `npx vitest run src/lib/server/http/errors.test.ts` —
constructing either subclass without `source`/`endpoint`/`attempt`/
`durationMs` is a TypeScript compile error (asserted via a `// @ts-expect-error`
fixture in the test file, not a runtime check); `SourceValidationError`
exposes the Zod issues it was constructed with; both subclasses are
`instanceof SourceError` and distinguishable from each other via
`instanceof`.

**Evidence:** Implemented `SourceError` (base, carrying `source`,
`endpoint`, `status?`, `attempt`, `durationMs`), `SourceRequestError`
(adds `kind: 'network-error' | 'timeout' | 'http-status'`), and
`SourceValidationError` (adds `issues: z.core.$ZodIssue[]`). The
`@ts-expect-error` fixture (`_typeCheckSourceErrorRequiresFullMetadata`,
never invoked at runtime — `void`-referenced only to avoid an unused-
function warning) was **verified to be a genuine suppression, not a
stale no-op**: temporarily removed it, confirmed `npm run check`
reported the exact expected TS error ("Type ... is missing the
following properties from type 'SourceErrorInfo': attempt,
durationMs"), then restored it and reconfirmed 0 errors. `npx vitest
run src/lib/server/http/errors.test.ts` → **4 tests, all passed**
(both subclasses `instanceof SourceError`, mutually distinguishable via
`instanceof`, `SourceValidationError` exposes real Zod issues from an
actual `safeParse` failure, optional `status` field works). `npm run
check` → 0 errors/warnings (468 files).

## TASK-004 — Implement `httpClient.ts` core request loop (timeout + cancellation) + tests

- [x] Done

**Requirements:** SPEC-006:R1 — exact constraint: "combines the
caller's own `AbortSignal` (if provided) with an internally created
`AbortSignal.timeout(timeoutMs)` via `AbortSignal.any([...])`", and "a
timeout abort is caught and re-thrown as a `SourceRequestError` with
`kind: 'timeout'`, never left as an unhandled `AbortError`"; R5 applies
to this throw site.
**Depends on:** TASK-003.
**Scope:** `src/lib/server/http/httpClient.ts` (initial version: single
attempt, no retry, no schema validation yet — those are TASK-005/006)
and its test file.
**Verify:** `npx vitest run src/lib/server/http/httpClient.test.ts` (with
`globalThis.fetch` stubbed) — a request that never resolves before
`timeoutMs` elapses (using fake timers) results in the underlying
`fetch` call's signal being aborted and the caller receiving a
`SourceRequestError` with `kind: 'timeout'` and populated
`source`/`endpoint`/`attempt`/`durationMs`, not an unhandled rejection;
a caller-supplied `AbortSignal` that fires independently of the timeout
also aborts the request.

**Evidence:** Implemented `createHttpClient(config)` → `{ request }`.
`requestOnce()` combines the caller's `AbortSignal` (if any) with
`AbortSignal.timeout(timeoutMs)` via `AbortSignal.any()`; on any
`fetch` rejection, it inspects the composed `signal.reason` — a
`DOMException` named `'TimeoutError'` means the internal timeout fired
(`kind: 'timeout'`), anything else means the caller's own signal fired
or a genuine network failure occurred (`kind: 'network-error'`) —
rather than trying to distinguish by inspecting the caught error's own
identity, since `fetch` implementations vary in how they surface an
abort. A non-2xx response throws `SourceRequestError` with
`kind: 'http-status'` and the real `status`. **Deviated from the Task's
literal "using fake timers" instruction**: `AbortSignal.timeout()` is
implemented at the platform/native level and is not reliably
interceptable by `vi.useFakeTimers()` (which patches JS-visible
`setTimeout`), so the timeout test instead uses a genuinely short real
timeout (20ms) against a `fetch` stub that only resolves/rejects when
its `AbortSignal` fires — deterministic and fast without depending on
fake-timer/native-timer interop. Documented here since it's a real
verification-method change, not silently substituted. `npx vitest run
src/lib/server/http/httpClient.test.ts` → **5 tests, all passed**:
success path returns parsed JSON; timeout produces `kind: 'timeout'`
with full metadata; caller-abort independently rejects the request;
404 produces `kind: 'http-status'` + `status: 404`; every error carries
populated `source`/`endpoint`/`attempt`/`durationMs` (R5). `npm run
check` → 0 errors/warnings (470 files).

## TASK-005 — Wire retry-with-backoff into `httpClient.ts`

- [x] Done

**Requirements:** SPEC-006:R2 (reuses TASK-002's `isRetryable`/
`computeBackoffDelay`), R3 — exact constraint: "the client applies no
proactive request-rate ceiling or token bucket of its own; the only
throttling is the reactive backoff triggered by R2's retry path"; R5
applies to this throw site. Also applies the Plan's stated default:
"`maxRetries: 3` (4 total attempts) with a base backoff of 300ms".
**Depends on:** TASK-004, TASK-002.
**Scope:** `src/lib/server/http/httpClient.ts` (extend the request loop
from TASK-004 to retry on a retryable outcome, up to `maxRetries`) and
its test file.
**Verify:** `npx vitest run src/lib/server/http/httpClient.test.ts` —
a stubbed `fetch` returning 503 then 200 results in exactly 2 calls and
a successful return with `attempt: 2` in awareness (not necessarily on
the success value itself, but observable via a spy/call count); a
stubbed `fetch` returning 404 results in exactly 1 call and an
immediate `SourceRequestError` (no retry); a response with
`Retry-After: 5` followed by a retryable status has its next retry
delayed by at least 5 real-equivalent seconds (asserted via fake
timers, not a real 5-second wait); exhausting `maxRetries` (3) surfaces
the last attempt's `SourceRequestError`, and no test asserts or relies
on any request-rate limiting behavior existing (confirming R3's
"nothing invented" by absence).

**Evidence:** Extended `request()`'s loop to catch a `SourceRequestError`
from `requestOnce` (network-error/timeout) or a non-ok `Response`,
classify it via `retry.ts`'s `isRetryable()`, and — if retryable and
`attempt <= maxRetries` (default 3, base delay default 300ms, per the
Plan) — `sleep(computeBackoffDelay(attempt, {baseDelayMs,
retryAfterMs}))` (with `retryAfterMs` parsed from a `Retry-After`
response header, supporting both delay-seconds and HTTP-date formats)
before incrementing `attempt` and looping again; otherwise the error is
thrown with the real final `attempt` count.

**A real correctness bug surfaced and was fixed, not worked around**:
the first test run showed the TASK-004 caller-abort test hanging for
the full 5000ms test timeout. Root cause: a caller-initiated
`AbortController.abort()` was classified by `requestOnce` as generic
`kind: 'network-error'` (no dedicated "client abort" kind exists), and
`isRetryable({kind:'network-error'})` is unconditionally `true` — so
the client was **retrying an explicit cancellation**, re-issuing
`fetch` against an already-permanently-aborted signal, which the test's
mock (reasonably) never resolves for an already-aborted call. Fixed in
`httpClient.ts`'s retry-catch branch: `req.signal?.aborted` is checked
first, and a caller-aborted request is never retried regardless of its
classified `kind` — cancellation must not be retried, only implicit
failures should be. A second failure followed from the first: the
timeout test (still using its pre-retry default of `maxRetries: 3`)
then genuinely retried a hanging request 4 times with real ~300–3600ms
backoff delays, exceeded the 5000ms test timeout, and its **orphaned
background execution kept running after Vitest moved to the next
test**, contaminating a later test's stubbed `fetch` with an extra
unexpected call (isolated and confirmed via a standalone debug script
before touching the real test). Fixed by adding `maxRetries: 0` to the
TASK-004 timeout test, since retry-of-a-timeout is TASK-005's own
concern and already covered by the 503 retry test. `npx vitest run
src/lib/server/http/httpClient.test.ts` → **10 tests, all passed**
(503→200 retry with exact call count; 404 never retried; `Retry-After:
5` genuinely delays the retry past 4900ms but not before; exhausting
`maxRetries=3` yields exactly 4 total attempts and surfaces
`attempt: 4`; first attempt fires with no artificial pre-delay). Full
suite re-run: `npm run test` → 25 files / 121 tests + both static
checks, all passing. `npm run check` → 0 errors/warnings (470 files).

## TASK-006 — Wire Zod schema validation into `httpClient.ts`

- [x] Done

**Requirements:** SPEC-006:R4 — exact constraint: "`request<T>()`
accepts a required `schema: ZodType<T>` parameter... calls
`schema.safeParse(json)`. On failure, it throws a
`SourceValidationError`... only on success does `request()` return the
validated, typed value to the caller"; R5 applies to this throw site.
**Depends on:** TASK-004, TASK-001.
**Scope:** `src/lib/server/http/httpClient.ts` (extend `request<T>()`
to accept the `schema` parameter and validate before returning) and its
test file.
**Verify:** `npx vitest run src/lib/server/http/httpClient.test.ts` —
a stubbed `fetch` returning a 200 with a body matching the given Zod
schema resolves with the parsed, typed value; a 200 with a body that
fails the schema throws `SourceValidationError` (not a
`SourceRequestError`) and does **not** trigger a retry (a validation
failure is absent from TASK-002's retryable-outcome list); omitting the
`schema` argument at a call site is a TypeScript compile error
(asserted via a `// @ts-expect-error` fixture).

**Evidence:** Changed `request()` to `request<T>(req: HttpRequestInit &
{ schema: z.ZodType<T> })`. After a successful (ok) response, the
parsed JSON is validated via `req.schema.safeParse(json)`; on failure,
throws `SourceValidationError` with the real Zod `issues` array and the
same `source`/`endpoint`/`attempt`/`durationMs` metadata every other
error carries; on success, returns `parsed.data` (the validated, typed
value) — nothing reaches the caller unvalidated. Adding the required
`schema` parameter broke every existing TASK-004/005 test call site at
compile time (confirmed via `npm run check` before fixing) — each was
updated with `schema: z.unknown()` (a permissive pass-through schema,
appropriate since those tests exercise retry/timeout/error behavior,
not validation), preserving their original intent. Added 4 new tests
plus a `@ts-expect-error` type-only fixture for the required-`schema`
constraint — **verified genuine, not stale**, the same way as TASK-003's
fixture: temporarily removed the suppression, confirmed `npm run check`
reported the exact expected "Property 'schema' is missing" error, then
restored it and reconfirmed 0 errors. `npx vitest run
src/lib/server/http/httpClient.test.ts` → **14 tests, all passed**
(valid body → typed value; invalid body → `SourceValidationError`
specifically, not `SourceRequestError`; exactly one `fetch` call even
with `maxRetries: 3` set, confirming validation failures are never
retried; real Zod issues present and metadata populated). Full suite:
`npm run test` → 25 files / 125 tests + both static checks, all
passing. `npm run check` → 0 errors/warnings (470 files).

## TASK-007 — Implement `sources/comprasgov/client.ts` pre-configured instance + tests

- [x] Done

**Requirements:** ties SPEC-006:R1–R5 together end-to-end through a
real (pre-configured) usage of `createHttpClient`, per the Plan's
`Architecture` section.
**Depends on:** TASK-005, TASK-006.
**Scope:** `src/lib/server/sources/comprasgov/client.ts` and its test
file.
**Verify:** `npx vitest run src/lib/server/sources/comprasgov/client.test.ts`
(stubbing `$env/dynamic/private` per SvelteKit's standard testing
pattern, and stubbing `fetch`) — the exported `comprasgovClient` is a
`createHttpClient` instance configured with `source: 'comprasgov'` and
a base URL read from `COMPRAS_GOV_BASE_URL`; a request made through it
that fails validation, retries, or times out produces errors carrying
`source: 'comprasgov'`, confirming the wiring is real, not just
type-compatible.

**Evidence:** Implemented `comprasgovClient = createHttpClient({
source: 'comprasgov', baseUrl: env.COMPRAS_GOV_BASE_URL ?? '' })`
reading from `$env/dynamic/private`, per KNOW-002's documented
`COMPRAS_GOV_BASE_URL` variable. Tests use `vi.mock('$env/dynamic/
private', () => ({ env: { COMPRAS_GOV_BASE_URL: '...' } }))` (Vitest's
standard hoisted-mock pattern; the module under test is dynamically
`import()`-ed inside each test, after the mock and the `fetch` stub are
both in place, so the mocked env value is actually the one
`createHttpClient` gets constructed with) — this is the SvelteKit
testing pattern referenced by the Task's own scope. `npx vitest run
src/lib/server/sources/comprasgov/client.test.ts` → **3 tests, all
passed** on the first run: a request through `comprasgovClient` hits a
URL containing the mocked base URL and resolves correctly; an HTTP-status
error and a schema-validation error produced through it both carry
`source: 'comprasgov'` — proving the end-to-end wiring (config →
`createHttpClient` → error metadata) is real, not just type-compatible.
This Task completes SPEC-006. Full suite: `npm run test` → 26 files /
128 tests + both static checks, all passing. `npm run check` → 0
errors/warnings (472 files).

## TASK-008 — Wrap malformed-JSON response bodies as `SourceValidationError`

- [x] Done

**Serves:** SPEC-006:R4 — exact constraint (Spec Edge Cases): "A
response passes HTTP-level success (200) but the body is not valid
JSON — this is a validation failure (R4), not silently treated as an
empty/default value." Also touches R5 (every error the client
constructs must carry `source`/`endpoint`/`attempt`/`durationMs`).
**Depends on:** TASK-006 (extends the same code path).
**Origin:** `/mister-analyze` finding (implementation incomplete) —
`validation.md`'s R4 section. Evidence: a throwaway test posting a 200
response with body `"not-json{{{"` through `request()` produced an
unwrapped `SyntaxError` (`instanceof SourceValidationError === false`,
no metadata fields), because `await response.json()` in
`httpClient.ts`'s `request()` sits outside any try/catch.
**Scope:** `src/lib/server/http/httpClient.ts` (wrap the `response.json()`
call in a try/catch; on a parse failure, throw `SourceValidationError`
with a descriptive message/synthetic issue and full
`source`/`endpoint`/`attempt`/`durationMs` metadata, instead of letting
the native `SyntaxError` propagate) and a regression test in
`httpClient.test.ts`.
**Verify:** `npx vitest run src/lib/server/http/httpClient.test.ts` —
a stubbed `fetch` returning a 200 response with a non-JSON body (e.g.
`"not-json{{{"`) results in `client.request(...)` rejecting with a
`SourceValidationError` (not a raw `SyntaxError`), carrying populated
`source`/`endpoint`/`attempt`/`durationMs`; existing tests continue to
pass unchanged.

**Evidence:** Wrapped `await response.json()` in `request()` with a
try/catch; on a parse failure, throws `SourceValidationError` with a
synthetic `$ZodIssue` (`code: 'custom'`, `path: []`, `message`: the
native parse error's message) and the same `source`/`endpoint`/
`attempt`/`durationMs` metadata every other error path already
provides — the native `SyntaxError` never escapes `request()`
unwrapped. Added a regression test posting a 200 response with body
`"not-json{{{"`: asserts the rejection `instanceof
SourceValidationError` (not a raw `SyntaxError`) with all four metadata
fields populated and at least one issue present — the exact scenario
`validation.md`'s R4 finding described as broken. `npx vitest run
src/lib/server/http/httpClient.test.ts` → **15 tests, all passed**
(14 pre-existing + this one new). Full suite: `npm run test` → 26
files / 129 tests + both static checks, all passing. `npm run check` →
0 errors/warnings (472 files).
