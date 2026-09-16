import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { createRawSnippet } from 'svelte';
import Dialog from './Dialog.svelte';

const body = () => createRawSnippet(() => ({ render: () => `<p>Conteúdo do modal</p>` }));

describe('Dialog', () => {
	it('renders nothing when closed', async () => {
		const screen = render(Dialog, { open: false, onClose: () => {}, children: body() });
		expect(screen.container.querySelector('[role="dialog"]')).toBeNull();
	});

	it('renders as a labelled, modal dialog when open', async () => {
		const screen = render(Dialog, {
			open: true,
			onClose: () => {},
			title: 'Criar Regra de Interesse',
			children: body()
		});
		const dialog = screen.getByRole('dialog');
		await expect.element(dialog).toBeInTheDocument();
		await expect.element(dialog).toHaveAttribute('aria-modal', 'true');
		await expect.element(screen.getByText('Criar Regra de Interesse')).toBeInTheDocument();
	});

	it('always renders a close button, even without a title', async () => {
		const screen = render(Dialog, { open: true, onClose: () => {}, children: body() });
		await expect.element(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
	});

	it('calls onClose when the close button is clicked', async () => {
		const onClose = vi.fn();
		const screen = render(Dialog, { open: true, onClose, children: body() });
		await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('calls onClose when the backdrop is clicked', async () => {
		// A real Playwright click is occluded by the centered panel sitting
		// on top of the backdrop at viewport-center, so this dispatches a
		// native click directly at the backdrop element instead of relying
		// on Playwright's actionability/visibility resolution.
		const onClose = vi.fn();
		const screen = render(Dialog, { open: true, onClose, children: body() });
		const backdrop = screen.container.querySelector('.bg-slate-900\\/40') as HTMLElement;
		backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('calls onClose when Escape is pressed (via the shared focus trap)', async () => {
		const onClose = vi.fn();
		render(Dialog, { open: true, onClose, children: body() });
		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('traps focus inside the dialog', async () => {
		const screen = render(Dialog, {
			open: true,
			onClose: () => {},
			title: 'Título',
			children: body()
		});
		const dialog = screen.getByRole('dialog').element();
		expect(dialog.contains(document.activeElement)).toBe(true);
	});
});
