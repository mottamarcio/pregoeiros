import { describe, expect, it } from 'vitest';
import { computeBackoffDelay, isRetryable } from './retry';

describe('isRetryable', () => {
	it('returns true for network-error and timeout outcomes', () => {
		expect(isRetryable({ kind: 'network-error' })).toBe(true);
		expect(isRetryable({ kind: 'timeout' })).toBe(true);
	});

	it('returns true for status 429, 502, 503, 504', () => {
		for (const status of [429, 502, 503, 504]) {
			expect(isRetryable({ kind: 'status', status }), `status ${status}`).toBe(true);
		}
	});

	it('returns false for 400 and 404, and every other status', () => {
		for (const status of [400, 404, 401, 403, 422, 500, 501]) {
			expect(isRetryable({ kind: 'status', status }), `status ${status}`).toBe(false);
		}
	});
});

describe('computeBackoffDelay', () => {
	it('grows exponentially across attempts', () => {
		// Compare the minimum possible delay per attempt (no jitter) to
		// isolate exponential growth from the random component.
		const base = 100;
		const minAttempt0 = base * 2 ** 0;
		const minAttempt1 = base * 2 ** 1;
		const minAttempt2 = base * 2 ** 2;
		expect(minAttempt1).toBeGreaterThan(minAttempt0);
		expect(minAttempt2).toBeGreaterThan(minAttempt1);

		// The actual function's output attempt-over-attempt lower bound
		// should reflect the same growth (jitter only adds on top).
		const delay0 = computeBackoffDelay(0, { baseDelayMs: base });
		const delay2 = computeBackoffDelay(2, { baseDelayMs: base });
		expect(delay0).toBeGreaterThanOrEqual(minAttempt0);
		expect(delay0).toBeLessThan(minAttempt0 * 1.5 + 1);
		expect(delay2).toBeGreaterThanOrEqual(minAttempt2);
		expect(delay2).toBeLessThan(minAttempt2 * 1.5 + 1);
	});

	it('includes jitter within a bounded range (0 to 50% of the exponential value)', () => {
		const base = 1000;
		const attempt = 3;
		const exponential = base * 2 ** attempt;
		const samples = Array.from({ length: 50 }, () => computeBackoffDelay(attempt, { baseDelayMs: base }));

		for (const delay of samples) {
			expect(delay).toBeGreaterThanOrEqual(exponential);
			expect(delay).toBeLessThanOrEqual(exponential * 1.5);
		}
		// With 50 samples, jitter should produce more than one distinct value.
		expect(new Set(samples).size).toBeGreaterThan(1);
	});

	it('never returns a value below a supplied retryAfterMs floor', () => {
		// Even with a tiny base delay, a large Retry-After must win.
		const delay = computeBackoffDelay(0, { baseDelayMs: 10, retryAfterMs: 5000 });
		expect(delay).toBeGreaterThanOrEqual(5000);
	});

	it('does not apply a floor when retryAfterMs is not supplied', () => {
		const base = 50;
		const delay = computeBackoffDelay(0, { baseDelayMs: base });
		expect(delay).toBeLessThan(1000);
	});
});
