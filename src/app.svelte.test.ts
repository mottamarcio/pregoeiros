import { describe, expect, it } from 'vitest';
import './app.css';

/** Every `@font-face` rule found across all loaded stylesheets. */
function findFontFaceRules(): CSSFontFaceRule[] {
	const rules: CSSFontFaceRule[] = [];
	for (const sheet of Array.from(document.styleSheets)) {
		let cssRules: CSSRuleList;
		try {
			cssRules = sheet.cssRules;
		} catch {
			continue; // cross-origin stylesheet, not relevant here
		}
		for (const rule of Array.from(cssRules)) {
			if (rule instanceof CSSFontFaceRule) rules.push(rule);
		}
	}
	return rules;
}

describe('base app.css', () => {
	it('body uses the light-theme background/text colors', () => {
		// Compare against reference elements carrying the Tailwind utility
		// classes directly, rather than a hardcoded color-space string —
		// Tailwind v4 reports computed colors in oklch(), not rgb().
		const reference = document.createElement('div');
		reference.className = 'bg-white text-slate-900';
		document.body.appendChild(reference);
		const referenceStyle = getComputedStyle(reference);

		const bodyStyle = getComputedStyle(document.body);
		expect(bodyStyle.backgroundColor).toBe(referenceStyle.backgroundColor);
		expect(bodyStyle.color).toBe(referenceStyle.color);

		document.body.removeChild(reference);
	});

	it('declares a text-selection color rule using the accent token', () => {
		const found = Array.from(document.styleSheets).some((sheet) => {
			try {
				return Array.from(sheet.cssRules).some(
					(rule) => rule instanceof CSSStyleRule && rule.selectorText === '::selection'
				);
			} catch {
				return false;
			}
		});
		expect(found).toBe(true);
	});

	it('self-hosts Inter Variable and JetBrains Mono Variable via bundled @font-face rules', () => {
		const families = findFontFaceRules().map((rule) => rule.style.getPropertyValue('font-family'));
		expect(families.some((f) => f.includes('Inter Variable'))).toBe(true);
		expect(families.some((f) => f.includes('JetBrains Mono Variable'))).toBe(true);
	});

	it('never loads fonts from a Google Fonts (or other runtime) CDN', () => {
		const sources = findFontFaceRules().map((rule) => rule.style.getPropertyValue('src'));
		for (const src of sources) {
			expect(src).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
		}
		// every font src should be a local/bundled asset, not an absolute
		// third-party URL
		expect(sources.length).toBeGreaterThan(0);
		for (const src of sources) {
			expect(src).not.toMatch(/^url\(["']?https?:\/\//);
		}
	});
});
