import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import EmptyState from './EmptyState.svelte';

describe('EmptyState', () => {
	it('renders the title centered with the documented slate-400/12px style', async () => {
		const screen = render(EmptyState, { title: 'Nenhuma contratação encontrada.' });
		const el = screen.getByText('Nenhuma contratação encontrada.').element().parentElement!;
		expect(el.className).toContain('text-center');
		expect(el.className).toContain('text-slate-400');
		expect(el.className).toContain('text-xs');
	});

	it('renders an optional description explaining why it might be empty', async () => {
		const screen = render(EmptyState, {
			title: 'Nenhuma contratação encontrada.',
			description: 'Tente remover alguns filtros ou alterar o período pesquisado.'
		});
		await expect
			.element(screen.getByText('Tente remover alguns filtros ou alterar o período pesquisado.'))
			.toBeInTheDocument();
	});

	it('renders an optional recovery action', async () => {
		const action = createRawSnippet(() => ({ render: () => `<button>Limpar filtros</button>` }));
		const screen = render(EmptyState, { title: 'Nenhuma contratação encontrada.', action });
		await expect.element(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
	});
});
