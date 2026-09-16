import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import IconButton from './IconButton.svelte';

describe('IconButton', () => {
	it('exposes an accessible name via the required label prop', async () => {
		const screen = render(IconButton, { icon: 'bell', label: 'Radar' });
		const btn = screen.getByRole('button', { name: 'Radar' });
		await expect.element(btn).toBeInTheDocument();
	});

	it('renders the given icon as an SVG', async () => {
		const screen = render(IconButton, { icon: 'settings-2', label: 'Configurações' });
		const btn = screen.getByRole('button', { name: 'Configurações' });
		const svg = btn.element().querySelector('svg');
		expect(svg).toBeTruthy();
	});

	it('uses the default (non-destructive) hover treatment by default', async () => {
		const screen = render(IconButton, { icon: 'menu', label: 'Abrir menu' });
		const btn = screen.getByRole('button', { name: 'Abrir menu' });
		await expect.element(btn).toHaveClass(/hover:bg-slate-100/);
	});

	it('uses a red hover treatment for the destructive variant, not red by default', async () => {
		const screen = render(IconButton, {
			icon: 'trash-2',
			label: 'Remover favorito',
			variant: 'destructive'
		});
		const btn = screen.getByRole('button', { name: 'Remover favorito' });
		await expect.element(btn).toHaveClass(/text-slate-400/);
		await expect.element(btn).toHaveClass(/hover:text-red-600/);
	});

	it('is disabled when disabled is true', async () => {
		const screen = render(IconButton, { icon: 'bell', label: 'Radar', disabled: true });
		const btn = screen.getByRole('button', { name: 'Radar' });
		await expect.element(btn).toBeDisabled();
	});

	it('meets the ~32px minimum visual target', async () => {
		const screen = render(IconButton, { icon: 'bell', label: 'Radar' });
		const btn = screen.getByRole('button', { name: 'Radar' });
		await expect.element(btn).toHaveClass(/h-8/);
		await expect.element(btn).toHaveClass(/w-8/);
	});
});
