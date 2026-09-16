import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Skeleton from './Skeleton.svelte';

describe('Skeleton', () => {
	it('applies bg-slate-100, rounded, and animate-pulse — no heavy shimmer', async () => {
		const screen = render(Skeleton);
		const el = screen.container.querySelector('[role="presentation"]')!;
		expect(el.className).toContain('bg-slate-100');
		expect(el.className).toContain('rounded');
		expect(el.className).toContain('animate-pulse');
	});

	it('is hidden from assistive technology (decorative placeholder)', async () => {
		const screen = render(Skeleton);
		const el = screen.container.querySelector('[role="presentation"]')!;
		expect(el.getAttribute('aria-hidden')).toBe('true');
	});

	it('accepts custom width/height', async () => {
		const screen = render(Skeleton, { width: '120px', height: '2rem' });
		const el = screen.container.querySelector('[role="presentation"]') as HTMLElement;
		expect(el.style.width).toBe('120px');
		expect(el.style.height).toBe('2rem');
	});
});
