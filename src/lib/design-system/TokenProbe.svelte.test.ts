import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '../../app.css';
import TokenProbe from './TokenProbe.svelte';

describe('design tokens (src/app.css @theme)', () => {
	it('font-sans resolves to Inter', async () => {
		const screen = render(TokenProbe);
		const el = screen.getByTestId('font-sans').element() as HTMLElement;
		expect(getComputedStyle(el).fontFamily).toContain('Inter');
	});

	it('font-mono resolves to JetBrains Mono', async () => {
		const screen = render(TokenProbe);
		const el = screen.getByTestId('font-mono').element() as HTMLElement;
		expect(getComputedStyle(el).fontFamily).toContain('JetBrains Mono');
	});

	it('text-2xs resolves to 10px (microcopy)', async () => {
		const screen = render(TokenProbe);
		const el = screen.getByTestId('text-2xs').element() as HTMLElement;
		expect(getComputedStyle(el).fontSize).toBe('10px');
	});

	it('text-meta resolves to 11px (metadata)', async () => {
		const screen = render(TokenProbe);
		const el = screen.getByTestId('text-meta').element() as HTMLElement;
		expect(getComputedStyle(el).fontSize).toBe('11px');
	});

	it('rounded-badge resolves to 6px (within the documented 4-6px badge range)', async () => {
		const screen = render(TokenProbe);
		const el = screen.getByTestId('radius-badge').element() as HTMLElement;
		expect(getComputedStyle(el).borderRadius).toBe('6px');
	});

	it('the default Tailwind scale already matches KNOW-009 without overrides', async () => {
		const screen = render(TokenProbe);
		// text-xs/sm/lg/xl/2xl and rounded-lg/xl/full are Tailwind v4
		// defaults already matching KNOW-009 — spot-check one of each
		// family via a throwaway probe element.
		const probe = document.createElement('div');
		probe.className = 'text-xs rounded-lg';
		document.body.appendChild(probe);
		const style = getComputedStyle(probe);
		expect(style.fontSize).toBe('12px');
		expect(style.borderRadius).toBe('8px');
		document.body.removeChild(probe);
		expect(screen.container).toBeTruthy();
	});
});
