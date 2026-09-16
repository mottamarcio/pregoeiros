// Best-effort static check for SPEC-001:R2 — KNOW-009 §9 requires
// JetBrains Mono (`font-mono`) for machine-oriented/structured values
// (CNPJ, UASG, CATMAT, monetary values, counts, IDs) and forbids it for
// ordinary prose. Statically proving this in general is undecidable, so
// this checks two concrete, well-defined heuristics rather than claiming
// full coverage:
//
//   1. A literal value matching a known structured-data pattern (currency,
//      CNPJ) appearing in a .svelte template MUST be inside an element
//      that carries the `font-mono` class somewhere in its own class list.
//   2. An element carrying `font-mono` whose own static text content looks
//      like ordinary Portuguese prose (several alphabetic words, no digits)
//      is flagged as a likely misuse of the monospace token.
//
// False negatives are expected (dynamic/interpolated values aren't
// pattern-matched); this is a convention aid, not a proof.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url));

const STRUCTURED_VALUE_PATTERNS = [
	{ name: 'currency (R$)', pattern: /R\$\s?\d[\d.,]*/g },
	{ name: 'CNPJ', pattern: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g }
];

const TAG_WITH_CLASS_PATTERN = /<(\w[\w.-]*)\b([^>]*?)>([^<]*)<\/\1>/g;
const CLASS_ATTR_PATTERN = /class(?::\w+)?="([^"]*)"/;
const PROSE_PATTERN = /^[A-Za-zÀ-ÿ]+(\s+[A-Za-zÀ-ÿ]+){3,}$/; // 4+ alphabetic words, no digits

/** @param {string} dir @returns {string[]} */
function collectSvelteFiles(dir) {
	const entries = readdirSync(dir);
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			files.push(...collectSvelteFiles(fullPath));
		} else if (extname(entry) === '.svelte') {
			files.push(fullPath);
		}
	}
	return files;
}

/** @type {{file: string, kind: string, detail: string}[]} */
const violations = [];

for (const file of collectSvelteFiles(SRC_DIR)) {
	const content = readFileSync(file, 'utf-8');

	for (const { name, pattern } of STRUCTURED_VALUE_PATTERNS) {
		for (const match of content.matchAll(pattern)) {
			// Look at a window of text around the match for a nearby
			// `font-mono` class — a lightweight proxy for "is this value
			// inside a font-mono element" without a full HTML/AST parse.
			const windowStart = Math.max(0, match.index - 200);
			const window = content.slice(windowStart, match.index + match[0].length + 20);
			if (!window.includes('font-mono')) {
				violations.push({
					file,
					kind: 'missing font-mono',
					detail: `${name} value "${match[0]}" has no nearby font-mono class`
				});
			}
		}
	}

	for (const tagMatch of content.matchAll(TAG_WITH_CLASS_PATTERN)) {
		const [, , attrs, text] = tagMatch;
		const classMatch = attrs.match(CLASS_ATTR_PATTERN);
		if (!classMatch) continue;
		const classes = classMatch[1];
		if (!classes.includes('font-mono')) continue;

		const trimmed = text.trim();
		if (PROSE_PATTERN.test(trimmed)) {
			violations.push({
				file,
				kind: 'font-mono on prose',
				detail: `font-mono applied to prose-looking text: "${trimmed}"`
			});
		}
	}
}

if (violations.length > 0) {
	console.error(`Found ${violations.length} likely font-mono usage issue(s) (KNOW-009 §9):\n`);
	for (const v of violations) {
		console.error(`  ${v.file} — [${v.kind}] ${v.detail}`);
	}
	process.exit(1);
} else {
	console.log('OK: no likely font-mono misuse detected (structured values near font-mono, no font-mono on prose).');
}
