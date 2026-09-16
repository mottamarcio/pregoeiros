import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import Drawer from './Drawer.svelte';

const nav = () => createRawSnippet(() => ({ render: () => `<nav>Navegação</nav>` }));

describe('Drawer', () => {
	it('renders nothing when closed', async () => {
		const screen = render(Drawer, { open: false, onClose: () => {}, children: nav() });
		expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
	});

	it('renders as a modal dialog when open, on the left by default', async () => {
		const screen = render(Drawer, { open: true, onClose: () => {}, children: nav() });
		const drawer = screen.getByRole('dialog');
		await expect.element(drawer).toBeInTheDocument();
		await expect.element(drawer).toHaveAttribute('aria-modal', 'true');
		await expect.element(drawer).toHaveClass(/left-0/);
	});

	it('renders on the right when side="right"', async () => {
		const screen = render(Drawer, { open: true, onClose: () => {}, side: 'right', children: nav() });
		const drawer = screen.getByRole('dialog');
		await expect.element(drawer).toHaveClass(/right-0/);
	});

	it('calls onClose when the backdrop is clicked', async () => {
		// Native dispatch, not a real Playwright click — see the same note
		// in Dialog.svelte.test.ts (the drawer panel can occlude the
		// backdrop at the point Playwright would otherwise click).
		const onClose = vi.fn();
		const screen = render(Drawer, { open: true, onClose, children: nav() });
		const backdrop = screen.container.querySelector('.bg-slate-900\\/40') as HTMLElement;
		backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('calls onClose when Escape is pressed', async () => {
		const onClose = vi.fn();
		render(Drawer, { open: true, onClose, children: nav() });
		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('calls onClose when the close button is clicked (selecting a nav item closes the drawer the same way)', async () => {
		const onClose = vi.fn();
		const screen = render(Drawer, { open: true, onClose, children: nav() });
		await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
