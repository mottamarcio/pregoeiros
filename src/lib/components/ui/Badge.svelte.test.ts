import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Badge', () => {
	it('renders pill shape, padding, and 10px text per KNOW-009 §50', async () => {
		const screen = render(Badge, { children: text('4 não vistos') });
		const badge = screen.getByText('4 não vistos').element().parentElement!;
		expect(badge.className).toContain('rounded-full');
		expect(badge.className).toContain('px-2');
		expect(badge.className).toContain('text-2xs');
	});

	it('neutral variant matches the "Regra Ativa" style triple', async () => {
		const screen = render(Badge, { variant: 'neutral', children: text('Regra Ativa') });
		const badge = screen.getByText('Regra Ativa').element().parentElement!;
		expect(badge.className).toContain('bg-slate-100');
		expect(badge.className).toContain('text-slate-700');
		expect(badge.className).toContain('border-slate-200');
	});

	it('success variant matches the "Resultado Homologado" style triple', async () => {
		const screen = render(Badge, { variant: 'success', children: text('Resultado Homologado') });
		const badge = screen.getByText('Resultado Homologado').element().parentElement!;
		expect(badge.className).toContain('bg-emerald-50');
		expect(badge.className).toContain('text-emerald-700');
		expect(badge.className).toContain('border-emerald-200');
	});

	it('info variant matches the "Publicada" style triple', async () => {
		const screen = render(Badge, { variant: 'info', children: text('Publicada') });
		const badge = screen.getByText('Publicada').element().parentElement!;
		expect(badge.className).toContain('bg-blue-50');
		expect(badge.className).toContain('text-blue-700');
		expect(badge.className).toContain('border-blue-200');
	});
});
