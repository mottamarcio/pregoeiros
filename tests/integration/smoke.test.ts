import { describe, expect, it } from 'vitest';

// Confirms the `integration` Vitest project is wired up, runs separately
// from `unit`, and executes its files sequentially. Real integration tests
// (e.g. against the test PostgreSQL database) are added starting with
// SPEC-002, which introduces the database client and test database.
describe('integration test runner', () => {
	it('runs integration tests in a Node environment', () => {
		expect(typeof window).toBe('undefined');
		expect(1 + 1).toBe(2);
	});
});
