import type { z } from 'zod';

/** SPEC-006:R5 — every structured error carries this observability metadata. */
export interface SourceErrorInfo {
	source: string;
	endpoint: string;
	status?: number;
	attempt: number;
	durationMs: number;
}

/** Common base for every error this HTTP client throws. */
export class SourceError extends Error {
	readonly source: string;
	readonly endpoint: string;
	readonly status?: number;
	readonly attempt: number;
	readonly durationMs: number;

	constructor(message: string, info: SourceErrorInfo) {
		super(message);
		this.name = 'SourceError';
		this.source = info.source;
		this.endpoint = info.endpoint;
		this.status = info.status;
		this.attempt = info.attempt;
		this.durationMs = info.durationMs;
	}
}

export type SourceRequestErrorKind = 'network-error' | 'timeout' | 'http-status';

/** A request-level failure: network error, timeout, or a non-2xx HTTP response. */
export class SourceRequestError extends SourceError {
	readonly kind: SourceRequestErrorKind;

	constructor(message: string, info: SourceErrorInfo & { kind: SourceRequestErrorKind }) {
		super(message, info);
		this.name = 'SourceRequestError';
		this.kind = info.kind;
	}
}

/** SPEC-006:R4 — a response that failed Zod schema validation. */
export class SourceValidationError extends SourceError {
	readonly issues: z.core.$ZodIssue[];

	constructor(message: string, info: SourceErrorInfo & { issues: z.core.$ZodIssue[] }) {
		super(message, info);
		this.name = 'SourceValidationError';
		this.issues = info.issues;
	}
}
