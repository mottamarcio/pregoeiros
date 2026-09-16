import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Card from './Card.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Card', () => {
	it('renders the default border/radius/padding', async () => {
		const screen = render(Card, { children: text('conteúdo') });
		const card = screen.getByText('conteúdo').element().parentElement!;
		expect(card.className).toContain('rounded-xl');
		expect(card.className).toContain('border-slate-200');
		expect(card.className).toContain('p-5');
	});

	it('applies the selected style (slate-900 border, tinted background)', async () => {
		const screen = render(Card, { selected: true, children: text('conteúdo') });
		const card = screen.getByText('conteúdo').element().parentElement!;
		expect(card.className).toContain('border-slate-900');
		expect(card.className).toContain('bg-slate-50/50');
	});

	it('adds a hover treatment only when hoverable and not selected', async () => {
		const screen = render(Card, { hoverable: true, children: text('conteúdo') });
		const card = screen.getByText('conteúdo').element().parentElement!;
		expect(card.className).toContain('hover:border-slate-400');
	});
});
