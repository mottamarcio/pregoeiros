import type { z } from 'zod';
import { SourceRequestError, SourceValidationError } from './errors';
import { computeBackoffDelay, isRetryable, type RetryOutcome } from './retry';

export interface HttpClientConfig {
	source: string;
	baseUrl: string;
	/** Default per-request timeout; individual requests may override it. */
	defaultTimeoutMs?: number;
	/** SPEC-006 Plan default: 3 (4 total attempts). */
	maxRetries?: number;
	/** SPEC-006 Plan default: 300ms. */
	baseDelayMs?: number;
}

export interface HttpRequestInit {
	/** Path relative to the client's baseUrl; also used as error metadata. */
	endpoint: string;
	method?: string;
	query?: Record<string, string | number | boolean | undefined>;
	headers?: Record<string, string>;
	/** Caller-supplied cancellation, combined with the internal timeout. */
	signal?: AbortSignal;
	timeoutMs?: number;
	maxRetries?: number;
	baseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry-After may be delay-seconds or an HTTP-date; returns undefined if unparseable. */
function parseRetryAfterMs(header: string | null): number | undefined {
	if (!header) return undefined;
	const seconds = Number(header);
	if (!Number.isNaN(seconds)) return seconds * 1000;
	const dateMs = Date.parse(header);
	if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
	return undefined;
}

function buildUrl(baseUrl: string, endpoint: string, query?: HttpRequestInit['query']): string {
	const url = new URL(endpoint, baseUrl);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined) url.searchParams.set(key, String(value));
		}
	}
	return url.toString();
}

export function createHttpClient(config: HttpClientConfig) {
	const defaultTimeoutMs = config.defaultTimeoutMs ?? 10_000;

	/**
	 * SPEC-006:R1 — combines the caller's own AbortSignal (if provided)
	 * with an internally created timeout signal, so either aborts the
	 * underlying fetch. A timeout abort is re-thrown as a
	 * SourceRequestError with kind: 'timeout', never left unhandled.
	 */
	async function requestOnce(req: HttpRequestInit, attempt: number): Promise<Response> {
		const timeoutMs = req.timeoutMs ?? defaultTimeoutMs;
		const timeoutSignal = AbortSignal.timeout(timeoutMs);
		const signal = req.signal ? AbortSignal.any([req.signal, timeoutSignal]) : timeoutSignal;

		const url = buildUrl(config.baseUrl, req.endpoint, req.query);
		const start = performance.now();

		let response: Response;
		try {
			response = await fetch(url, {
				method: req.method ?? 'GET',
				headers: req.headers,
				signal
			});
		} catch {
			const durationMs = performance.now() - start;
			if (signal.aborted) {
				const reason = signal.reason;
				const isTimeout = reason instanceof DOMException && reason.name === 'TimeoutError';
				throw new SourceRequestError(isTimeout ? 'Request timed out' : 'Request aborted', {
					source: config.source,
					endpoint: req.endpoint,
					attempt,
					durationMs,
					kind: isTimeout ? 'timeout' : 'network-error'
				});
			}
			throw new SourceRequestError('Network error', {
				source: config.source,
				endpoint: req.endpoint,
				attempt,
				durationMs,
				kind: 'network-error'
			});
		}

		return response;
	}

	/**
	 * SPEC-006:R2/R3 — retries only network-error/timeout/429/502/503/504
	 * outcomes (via retry.ts's isRetryable), with exponential backoff +
	 * jitter floored at any Retry-After header, up to maxRetries. No
	 * proactive rate limiting is applied beyond this reactive backoff.
	 *
	 * SPEC-006:R4 — the required `schema` validates the parsed JSON body
	 * before it is ever returned to the caller; a mismatch throws
	 * SourceValidationError and is never retried (a malformed body isn't
	 * a transient failure).
	 */
	async function request<T>(req: HttpRequestInit & { schema: z.ZodType<T> }): Promise<T> {
		const maxRetries = req.maxRetries ?? config.maxRetries ?? 3;
		const baseDelayMs = req.baseDelayMs ?? config.baseDelayMs ?? 300;

		let attempt = 1;
		for (;;) {
			const start = performance.now();

			let response: Response;
			try {
				response = await requestOnce(req, attempt);
			} catch (err) {
				// A caller-initiated cancellation is never retried, regardless
				// of how it was classified — retrying an explicit cancellation
				// would be wrong even though a bare 'network-error' kind is
				// otherwise always retryable.
				const callerAborted = req.signal?.aborted ?? false;
				if (!callerAborted && err instanceof SourceRequestError && err.kind !== 'http-status') {
					const outcome: RetryOutcome = { kind: err.kind };
					if (attempt <= maxRetries && isRetryable(outcome)) {
						await sleep(computeBackoffDelay(attempt, { baseDelayMs }));
						attempt++;
						continue;
					}
				}
				throw err;
			}

			const durationMs = performance.now() - start;

			if (!response.ok) {
				const outcome: RetryOutcome = { kind: 'status', status: response.status };
				if (attempt <= maxRetries && isRetryable(outcome)) {
					const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'));
					await sleep(computeBackoffDelay(attempt, { baseDelayMs, retryAfterMs }));
					attempt++;
					continue;
				}
				throw new SourceRequestError(`Upstream responded with HTTP ${response.status}`, {
					source: config.source,
					endpoint: req.endpoint,
					status: response.status,
					attempt,
					durationMs,
					kind: 'http-status'
				});
			}

			let json: unknown;
			try {
				json = await response.json();
			} catch (parseErr) {
				throw new SourceValidationError('Response body is not valid JSON', {
					source: config.source,
					endpoint: req.endpoint,
					attempt,
					durationMs,
					issues: [
						{
							code: 'custom',
							path: [],
							message: parseErr instanceof Error ? parseErr.message : 'Invalid JSON'
						}
					]
				});
			}

			const parsed = req.schema.safeParse(json);
			if (!parsed.success) {
				throw new SourceValidationError('Response failed schema validation', {
					source: config.source,
					endpoint: req.endpoint,
					attempt,
					durationMs,
					issues: parsed.error.issues
				});
			}
			return parsed.data;
		}
	}

	return { request };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
