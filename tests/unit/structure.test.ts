import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// SPEC-001:R1 — Project structure.
const root = process.cwd();

const REQUIRED_DIRS = [
	'src/lib',
	'src/lib/server',
	'src/routes',
	'static',
	'tests/unit',
	'tests/integration',
	'tests/e2e'
];

const FORBIDDEN_DIRS = ['src/controllers', 'src/pages'];

describe('project structure (SPEC-001:R1)', () => {
	it.each(REQUIRED_DIRS)('%s exists', (dir) => {
		expect(existsSync(path.join(root, dir)), `expected ${dir} to exist`).toBe(true);
	});

	it.each(FORBIDDEN_DIRS)('%s does not exist', (dir) => {
		expect(existsSync(path.join(root, dir)), `expected ${dir} to be absent`).toBe(false);
	});
});
