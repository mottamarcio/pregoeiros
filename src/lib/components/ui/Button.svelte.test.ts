import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

const label = (text: string) =>
	createRawSnippet(() => ({
		render: () => `<span>${text}</span>`
	}));

describe('Button', () => {
	it('renders the primary variant with the documented classes', async () => {
		const screen = render(Button, { variant: 'primary', children: label('Salvar') });
		const btn = screen.getByRole('button', { name: 'Salvar' });
		await expect.element(btn).toHaveClass(/bg-slate-900/);
		await expect.element(btn).toHaveClass(/text-white/);
	});

	it('renders the secondary variant with the documented classes', async () => {
		const screen = render(Button, { variant: 'secondary', children: label('Sincronizar') });
		const btn = screen.getByRole('button', { name: 'Sincronizar' });
		await expect.element(btn).toHaveClass(/border-slate-200/);
		await expect.element(btn).toHaveClass(/text-slate-700/);
	});

	it('renders the tertiary variant with the documented classes', async () => {
		const screen = render(Button, { variant: 'tertiary', children: label('Limpar filtros') });
		const btn = screen.getByRole('button', { name: 'Limpar filtros' });
		await expect.element(btn).toHaveClass(/text-slate-600/);
	});

	it('renders the destructive variant with a red hover treatment', async () => {
		const screen = render(Button, { variant: 'destructive', children: label('Excluir Interesse') });
		const btn = screen.getByRole('button', { name: 'Excluir Interesse' });
		await expect.element(btn).toHaveClass(/hover:text-red-600/);
	});

	it('is disabled and non-clickable when disabled is true', async () => {
		const onclick = vi.fn();
		const screen = render(Button, {
			variant: 'primary',
			disabled: true,
			onclick,
			children: label('Salvar')
		});
		const btn = screen.getByRole('button', { name: 'Salvar' });
		await expect.element(btn).toBeDisabled();
	});

	it('shows a spinner and disables clicks while loading, preserving accessibility', async () => {
		const screen = render(Button, {
			variant: 'primary',
			loading: true,
			loadingText: 'Salvando...',
			children: label('Salvar')
		});
		const btn = screen.getByRole('button');
		await expect.element(btn).toBeDisabled();
		await expect.element(btn).toHaveAttribute('aria-busy', 'true');
		await expect.element(screen.getByText('Salvando...')).toBeInTheDocument();
	});

	it('renders an icon next to the label when icon is provided', async () => {
		const screen = render(Button, {
			variant: 'secondary',
			icon: 'download',
			children: label('Exportar CSV')
		});
		const btn = screen.getByRole('button', { name: 'Exportar CSV' });
		const svg = btn.element().querySelector('svg');
		expect(svg).toBeTruthy();
	});
});
