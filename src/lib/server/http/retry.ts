/**
 * Classifies whether a failed request outcome is worth retrying, and
 * computes the delay before the next attempt. Deliberately decoupled
 * from `errors.ts` — operates on primitive outcome signals rather than
 * `SourceError` instances, so `httpClient.ts` can classify an outcome
 * before it decides whether to throw at all.
 */

export type RetryOutcome =
	| { kind: 'status'; status: number }
	| { kind: 'network-error' }
	| { kind: 'timeout' };

/** HTTP statuses SPEC-006:R2 explicitly allows retrying. */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

/**
 * SPEC-006:R2 — retries only for: a network-level connection reset, a
 * timeout abort, and HTTP 429/502/503/504. Never retries HTTP 400,
 * 404, or any other status.
 */
export function isRetryable(outcome: RetryOutcome): boolean {
	if (outcome.kind === 'network-error' || outcome.kind === 'timeout') {
		return true;
	}
	return RETRYABLE_STATUSES.has(outcome.status);
}

export interface BackoffOptions {
	/** Base delay in ms before exponential growth; default 300ms. */
	baseDelayMs?: number;
	/** Floor imposed by an upstream `Retry-After` header, in ms. */
	retryAfterMs?: number;
}

/**
 * SPEC-006:R2 — exponential (`baseDelayMs * 2^attempt`) with random
 * jitter, floored at `retryAfterMs` when the failing response included
 * a `Retry-After` header.
 */
export function computeBackoffDelay(attempt: number, options: BackoffOptions = {}): number {
	const baseDelayMs = options.baseDelayMs ?? 300;
	const exponential = baseDelayMs * 2 ** attempt;
	const jitter = Math.random() * exponential * 0.5;
	const delay = exponential + jitter;

	if (options.retryAfterMs !== undefined) {
		return Math.max(delay, options.retryAfterMs);
	}
	return delay;
}
