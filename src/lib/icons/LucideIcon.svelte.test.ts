import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LucideIcon from './LucideIcon.svelte';
import { lucideIcon } from './lucide';

describe('LucideIcon', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// If the icon were fetched from the Iconify API at runtime, this
		// spy would be called — bundled/offline icons must never call it.
		fetchSpy = vi.spyOn(globalThis, 'fetch');
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it('renders a bundled Lucide icon as SVG with no network request', async () => {
		const screen = render(LucideIcon, { name: 'layers' });

		const svg = screen.container.querySelector('svg');
		expect(svg).toBeTruthy();
		expect(svg?.innerHTML).toContain('<g');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('resolves icon data synchronously from the bundled collection', () => {
		const data = lucideIcon('layers');
		expect(data.body).toContain('<g');
		expect(data.width).toBe(24);
		expect(data.height).toBe(24);
	});

	it('throws for an unknown icon name instead of silently rendering nothing', () => {
		expect(() => lucideIcon('this-icon-does-not-exist')).toThrow();
	});
});
