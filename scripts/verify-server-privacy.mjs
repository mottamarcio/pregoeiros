#!/usr/bin/env node
// SPEC-001:R4 — Server-module privacy is enforced at build time.
//
// Proves that importing anything under `src/lib/server` from
// client-reachable code makes `npm run build` fail, both for a static
// import (in a `.svelte` component) and a dynamic import (in a universal
// `+page.ts`). It does this by temporarily writing a probe module and two
// fixture routes, running `vite build` once per fixture, and asserting each
// build fails with a message naming `$lib/server` — then removing every
// temporary file it created, even on error or interruption.
//
// Usage: node scripts/verify-server-privacy.mjs

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(root, 'node_modules', '.bin', 'vite');

const PROBE_PATH = path.join(root, 'src/lib/server/__privacy_probe__.ts');
const PROBE_SOURCE = "export const secret = 'server-only';\n";

const FIXTURES = [
	{
		name: 'static import in a .svelte component',
		files: {
			[path.join(root, 'src/routes/__privacy_check__/static-import/+page.svelte')]:
				'<script lang="ts">\n\timport { secret } from \'$lib/server/__privacy_probe__\';\n</script>\n\n<p>{secret}</p>\n'
		}
	},
	{
		name: 'dynamic import in a universal +page.ts',
		files: {
			[path.join(root, 'src/routes/__privacy_check__/dynamic-import/+page.ts')]:
				"export async function load() {\n\tconst { secret } = await import('$lib/server/__privacy_probe__');\n\treturn { secret };\n}\n"
		}
	}
];

/** Every path this script may create, for guaranteed cleanup. */
const allPaths = [
	PROBE_PATH,
	...FIXTURES.flatMap((fixture) => Object.keys(fixture.files)),
	path.join(root, 'src/routes/__privacy_check__')
];

function cleanup() {
	for (const p of allPaths) {
		rmSync(p, { recursive: true, force: true });
	}
}

function writeFiles(files) {
	for (const [filePath, contents] of Object.entries(files)) {
		mkdirSync(path.dirname(filePath), { recursive: true });
		writeFileSync(filePath, contents);
	}
}

/** Runs `vite build` in an isolated build directory and returns {failed, output}. */
function runBuild() {
	const outDir = mkdtempSync(path.join(tmpdir(), 'privacy-check-'));
	try {
		const output = execFileSync(viteBin, ['build', '--outDir', outDir, '--logLevel', 'warn'], {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		});
		return { failed: false, output };
	} catch (error) {
		const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
		return { failed: true, output };
	} finally {
		rmSync(outDir, { recursive: true, force: true });
	}
}

function main() {
	if (!existsSync(viteBin)) {
		console.error(`check:privacy: vite binary not found at ${viteBin}. Run npm install first.`);
		process.exitCode = 1;
		return;
	}

	writeFiles({ [PROBE_PATH]: PROBE_SOURCE });

	const failures = [];

	for (const fixture of FIXTURES) {
		writeFiles(fixture.files);
		const { failed, output } = runBuild();
		for (const filePath of Object.keys(fixture.files)) {
			rmSync(filePath, { recursive: true, force: true });
		}

		if (!failed) {
			failures.push(
				`"${fixture.name}" built successfully — $lib/server leaked into the client bundle.`
			);
			continue;
		}
		if (!output.includes('$lib/server')) {
			failures.push(
				`"${fixture.name}" failed to build, but the error did not mention $lib/server:\n${output}`
			);
			continue;
		}
		console.log(`ok: ${fixture.name} — build failed as expected, mentioning $lib/server.`);
	}

	if (failures.length > 0) {
		console.error('check:privacy: FAILED\n' + failures.join('\n\n'));
		process.exitCode = 1;
		return;
	}

	console.log('check:privacy: PASSED — $lib/server is not reachable from client-side code.');
}

let cleanedUp = false;
function cleanupOnce() {
	if (cleanedUp) return;
	cleanedUp = true;
	cleanup();
}

process.on('exit', cleanupOnce);
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => {
		cleanupOnce();
		process.exit(1);
	});
}

try {
	main();
} catch (error) {
	console.error('check:privacy: unexpected error', error);
	process.exitCode = 1;
}
