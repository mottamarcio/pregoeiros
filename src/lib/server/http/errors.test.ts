import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SourceError, SourceRequestError, SourceValidationError } from './errors';

const baseInfo = { source: 'comprasgov', endpoint: '/catalog', attempt: 1, durationMs: 42 };

describe('SourceError family', () => {
	it('SourceRequestError carries the required metadata and is a SourceError', () => {
		const err = new SourceRequestError('timed out', { ...baseInfo, kind: 'timeout' });
		expect(err).toBeInstanceOf(SourceError);
		expect(err).toBeInstanceOf(SourceRequestError);
		expect(err.source).toBe('comprasgov');
		expect(err.endpoint).toBe('/catalog');
		expect(err.attempt).toBe(1);
		expect(err.durationMs).toBe(42);
		expect(err.kind).toBe('timeout');
	});

	it('SourceValidationError carries the required metadata plus Zod issues, and is a SourceError', () => {
		const schema = z.object({ ok: z.boolean() });
		const result = schema.safeParse({ ok: 'not-a-boolean' });
		expect(result.success).toBe(false);
		if (result.success) throw new Error('expected validation failure');

		const err = new SourceValidationError('invalid response shape', {
			...baseInfo,
			issues: result.error.issues
		});
		expect(err).toBeInstanceOf(SourceError);
		expect(err).toBeInstanceOf(SourceValidationError);
		expect(err.issues.length).toBeGreaterThan(0);
		expect(err.issues[0].path).toContain('ok');
	});

	it('SourceRequestError and SourceValidationError are distinguishable via instanceof', () => {
		const requestErr = new SourceRequestError('x', { ...baseInfo, kind: 'network-error' });
		const validationErr = new SourceValidationError('y', { ...baseInfo, issues: [] });

		expect(requestErr instanceof SourceValidationError).toBe(false);
		expect(validationErr instanceof SourceRequestError).toBe(false);
	});

	it('optionally carries an HTTP status', () => {
		const err = new SourceRequestError('bad status', { ...baseInfo, status: 503, kind: 'http-status' });
		expect(err.status).toBe(503);
	});

});

// Type-only fixture (never invoked at runtime): proves the required
// metadata fields on SourceErrorInfo are enforced at compile time, not
// just by convention.
function _typeCheckSourceErrorRequiresFullMetadata() {
	// @ts-expect-error — attempt and durationMs are required by SourceErrorInfo
	new SourceRequestError('x', { source: 'comprasgov', endpoint: '/catalog', kind: 'timeout' });
}
void _typeCheckSourceErrorRequiresFullMetadata;
