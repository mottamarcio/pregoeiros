import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createHttpClient } from './httpClient';
import { SourceRequestError, SourceValidationError } from './errors';

const config = { source: 'comprasgov', baseUrl: 'https://example.test/' };

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('createHttpClient — core request loop (TASK-004)', () => {
	it('resolves with the parsed JSON body on a successful response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ hello: 'world' }), { status: 200 }))
		);

		const client = createHttpClient(config);
		const result = await client.request({ endpoint: '/catalog', schema: z.unknown() });

		expect(result).toEqual({ hello: 'world' });
	});

	it('throws a SourceRequestError with kind "timeout" when the request exceeds its timeout, without an unhandled rejection', async () => {
		// A fetch that never resolves on its own, but does honor the
		// AbortSignal it's given — same contract the real undici fetch
		// implementation follows.
		vi.stubGlobal(
			'fetch',
			vi.fn((_url: string, init?: RequestInit) => {
				return new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						reject(init.signal!.reason);
					});
				});
			})
		);

		const client = createHttpClient(config);

		// maxRetries: 0 — this test is scoped to "a single timeout produces
		// a well-formed error" (TASK-004); retry-of-a-timeout is exercised
		// by TASK-005's own tests. Without this, the default retry policy
		// (3 retries, real backoff) would make this real-timer test take
		// several seconds and risk exceeding the test timeout.
		await expect(
			client.request({ endpoint: '/catalog', schema: z.unknown(), timeoutMs: 20, maxRetries: 0 })
		).rejects.toMatchObject({
			constructor: SourceRequestError,
			kind: 'timeout',
			source: 'comprasgov',
			endpoint: '/catalog'
		});
	});

	it('aborts and rejects when the caller-supplied AbortSignal fires, independent of the timeout', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((_url: string, init?: RequestInit) => {
				return new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						reject(init.signal!.reason);
					});
				});
			})
		);

		const client = createHttpClient(config);
		const controller = new AbortController();
		const promise = client.request({ endpoint: '/catalog', schema: z.unknown(), signal: controller.signal, timeoutMs: 60_000 });

		queueMicrotask(() => controller.abort());

		await expect(promise).rejects.toMatchObject({
			constructor: SourceRequestError,
			source: 'comprasgov',
			endpoint: '/catalog'
		});
	});

	it('throws a SourceRequestError with the response status for a non-2xx response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('not found', { status: 404 }))
		);

		const client = createHttpClient(config);

		await expect(client.request({ endpoint: '/catalog', schema: z.unknown() })).rejects.toMatchObject({
			constructor: SourceRequestError,
			kind: 'http-status',
			status: 404
		});
	});

	it('every SourceRequestError carries populated source/endpoint/attempt/durationMs metadata', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('err', { status: 503 }))
		);

		const client = createHttpClient(config);
		let caught: SourceRequestError | undefined;
		try {
			await client.request({ endpoint: '/prices', schema: z.unknown(), maxRetries: 0 });
		} catch (err) {
			caught = err as SourceRequestError;
		}

		expect(caught).toBeInstanceOf(SourceRequestError);
		expect(caught?.source).toBe('comprasgov');
		expect(caught?.endpoint).toBe('/prices');
		expect(caught?.attempt).toBe(1);
		expect(caught?.durationMs).toBeGreaterThanOrEqual(0);
	});
});

describe('createHttpClient — retry with backoff (TASK-005)', () => {
	it('retries a 503 and succeeds on the next attempt', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('err', { status: 503 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = createHttpClient(config);
		const promise = client.request({ endpoint: '/catalog', schema: z.unknown(), baseDelayMs: 10 });

		await vi.advanceTimersByTimeAsync(1000);
		const result = await promise;

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it('does not retry a 404 — exactly one attempt, immediate error', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response('nope', { status: 404 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = createHttpClient(config);
		await expect(client.request({ endpoint: '/catalog', schema: z.unknown() })).rejects.toMatchObject({
			kind: 'http-status',
			status: 404
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('honors a Retry-After header as a floor on the backoff delay', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response('err', { status: 503, headers: { 'Retry-After': '5' } }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = createHttpClient(config);
		const promise = client.request({ endpoint: '/catalog', schema: z.unknown(), baseDelayMs: 1 });

		// Just under 5s: the second attempt must not have happened yet.
		await vi.advanceTimersByTimeAsync(4900);
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// Past 5s: the retry should now have fired.
		await vi.advanceTimersByTimeAsync(200);
		const result = await promise;
		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it('exhausts maxRetries and surfaces the last attempt error, with total attempts = maxRetries + 1', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValue(new Response('err', { status: 503 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = createHttpClient(config);
		const promise = client.request({ endpoint: '/catalog', schema: z.unknown(), maxRetries: 3, baseDelayMs: 5 });
		const assertion = expect(promise).rejects.toMatchObject({ kind: 'http-status', status: 503, attempt: 4 });

		await vi.advanceTimersByTimeAsync(60_000);
		await assertion;

		expect(fetchMock).toHaveBeenCalledTimes(4);
		vi.useRealTimers();
	});

	it('applies no proactive rate limiting — the first attempt fires immediately, with no delay before it', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = createHttpClient(config);
		const start = performance.now();
		await client.request({ endpoint: '/catalog', schema: z.unknown() });
		const elapsed = performance.now() - start;

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(elapsed).toBeLessThan(50);
	});
});

describe('createHttpClient — schema validation (TASK-006)', () => {
	const catalogItemSchema = z.object({ id: z.string(), description: z.string() });

	it('resolves with the parsed, typed value when the body matches the schema', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ id: 'abc', description: 'Notebook' }), { status: 200 }))
		);

		const client = createHttpClient(config);
		const result = await client.request({ endpoint: '/catalog', schema: catalogItemSchema });

		expect(result).toEqual({ id: 'abc', description: 'Notebook' });
	});

	it('throws SourceValidationError (not SourceRequestError) when the body fails the schema', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ id: 'abc' }), { status: 200 })) // missing `description`
		);

		const client = createHttpClient(config);

		await expect(client.request({ endpoint: '/catalog', schema: catalogItemSchema })).rejects.toBeInstanceOf(
			SourceValidationError
		);
	});

	it('does not retry a validation failure — exactly one fetch call', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const client = createHttpClient(config);
		await expect(client.request({ endpoint: '/catalog', schema: catalogItemSchema, maxRetries: 3 })).rejects.toBeInstanceOf(
			SourceValidationError
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('a SourceValidationError carries the real Zod issues and required metadata', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ id: 'abc' }), { status: 200 }))
		);

		const client = createHttpClient(config);
		let caught: SourceValidationError | undefined;
		try {
			await client.request({ endpoint: '/catalog', schema: catalogItemSchema });
		} catch (err) {
			caught = err as SourceValidationError;
		}

		expect(caught).toBeInstanceOf(SourceValidationError);
		expect(caught?.issues.length).toBeGreaterThan(0);
		expect(caught?.issues.some((i) => i.path.includes('description'))).toBe(true);
		expect(caught?.source).toBe('comprasgov');
		expect(caught?.endpoint).toBe('/catalog');
	});

	it('throws SourceValidationError (not a raw SyntaxError) when the response body is not valid JSON (TASK-008)', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('not-json{{{', { status: 200 }))
		);

		const client = createHttpClient(config);
		let caught: unknown;
		try {
			await client.request({ endpoint: '/catalog', schema: catalogItemSchema });
		} catch (err) {
			caught = err;
		}

		expect(caught).toBeInstanceOf(SourceValidationError);
		const validationErr = caught as SourceValidationError;
		expect(validationErr.source).toBe('comprasgov');
		expect(validationErr.endpoint).toBe('/catalog');
		expect(validationErr.attempt).toBe(1);
		expect(validationErr.durationMs).toBeGreaterThanOrEqual(0);
		expect(validationErr.issues.length).toBeGreaterThan(0);
	});
});

// Type-only fixture (never invoked at runtime): omitting `schema` at a
// call site is a TypeScript compile error.
function _typeCheckSchemaIsRequired() {
	const client = createHttpClient(config);
	// @ts-expect-error — `schema` is required by request<T>()
	client.request({ endpoint: '/catalog' });
}
void _typeCheckSchemaIsRequired;
