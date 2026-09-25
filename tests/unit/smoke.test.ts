import { describe, expect, it } from 'vitest';

// Confirms the `unit` Vitest project is wired up and runs. Real unit tests
// for pure domain functions (SPEC-001 R6) replace/join this file as those
// functions are implemented in later Specs.
describe('unit test runner', () => {
	it('runs unit tests in a Node environment', () => {
		expect(typeof window).toBe('undefined');
		expect(1 + 1).toBe(2);
	});
});
