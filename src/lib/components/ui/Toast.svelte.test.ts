import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { flushSync } from 'svelte';
import Toast from './Toast.svelte';
import { toastStore } from './toastStore.svelte';

describe('Toast', () => {
	beforeEach(() => {
		// Drain any toast left over from a previous test.
		for (const t of [...toastStore.toasts]) toastStore.dismiss(t.id);
	});

	it('renders a toast added to the shared store', async () => {
		const screen = render(Toast);
		toastStore.add('Produto adicionado aos favoritos.');
		flushSync();

		await expect.element(screen.getByText('Produto adicionado aos favoritos.')).toBeInTheDocument();
		await expect.element(screen.getByRole('status')).toBeInTheDocument();
	});

	// Toast removal plays a 150ms outro transition (svelte/transition
	// `fly`), which keeps the element in the DOM briefly after it leaves
	// the store — real time (not fake-timer-advanceable), since it runs
	// via the Web Animations API. Tests that assert removal wait past it.
	const OUTRO_TRANSITION_BUFFER_MS = 250;
	const waitPastTransition = () => new Promise((r) => setTimeout(r, OUTRO_TRANSITION_BUFFER_MS));

	it('auto-dismisses after ~3 seconds', async () => {
		vi.useFakeTimers();
		const screen = render(Toast);
		toastStore.add('Regra "Notebooks · RJ" criada com sucesso.');
		flushSync();
		expect(screen.container.textContent).toContain('Regra "Notebooks · RJ" criada com sucesso.');

		vi.advanceTimersByTime(3000);
		flushSync();
		// Switch back to real timers so the outro transition (driven by
		// the browser's own animation clock) can actually elapse.
		vi.useRealTimers();
		await waitPastTransition();

		expect(screen.container.textContent).not.toContain('Regra "Notebooks · RJ" criada com sucesso.');
	});

	it('can be dismissed manually before the timeout elapses', async () => {
		const screen = render(Toast);
		toastStore.add('Favorito removido.');
		flushSync();

		await userEvent.click(screen.getByRole('button', { name: 'Fechar notificação' }));
		await waitPastTransition();

		expect(screen.container.textContent).not.toContain('Favorito removido.');
	});

	it('shows a distinct icon color for the error variant', async () => {
		const screen = render(Toast);
		toastStore.add('Não foi possível concluir a sincronização.', { variant: 'error' });
		flushSync();

		const icon = screen.container.querySelector('.text-red-400');
		expect(icon).toBeTruthy();
	});

	it('announces toasts via aria-live for screen readers', async () => {
		const screen = render(Toast);
		const region = screen.container.querySelector('[aria-live="polite"]');
		expect(region).toBeTruthy();
	});
});
