// Static check for SPEC-001:R5 — Pregoeiros is light-theme only, with no
// dark-mode code path. This scans src/ for any `dark:`-prefixed Tailwind
// utility class, which would silently introduce dark-mode styling since
// Tailwind's `darkMode` is left unconfigured (defaults to reacting to the
// OS color scheme via `prefers-color-scheme`).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url));
const SCANNED_EXTENSIONS = new Set(['.svelte', '.ts', '.js']);
const DARK_CLASS_PATTERN = /(^|["'`\s])dark:[a-zA-Z0-9[\]/-]+/g;

/** @param {string} dir @returns {string[]} */
function collectFiles(dir) {
	const entries = readdirSync(dir);
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			files.push(...collectFiles(fullPath));
		} else if (SCANNED_EXTENSIONS.has(extname(entry))) {
			files.push(fullPath);
		}
	}
	return files;
}

const files = collectFiles(SRC_DIR);
/** @type {{file: string, line: number, match: string}[]} */
const violations = [];

for (const file of files) {
	const content = readFileSync(file, 'utf-8');
	const lines = content.split('\n');
	lines.forEach((line, index) => {
		const matches = line.match(DARK_CLASS_PATTERN);
		if (matches) {
			for (const match of matches) {
				violations.push({ file, line: index + 1, match: match.trim() });
			}
		}
	});
}

if (violations.length > 0) {
	console.error(`Found ${violations.length} dark:-prefixed Tailwind class(es) — SPEC-001:R5 forbids a dark-mode code path:\n`);
	for (const v of violations) {
		console.error(`  ${v.file}:${v.line} — "${v.match}"`);
	}
	process.exit(1);
} else {
	console.log(`OK: scanned ${files.length} files under src/, found no dark:-prefixed classes.`);
}
