import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Alert from './Alert.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Alert', () => {
	it('renders the "notice" (terminology/coverage caveat) style from KNOW-009 §75', async () => {
		const screen = render(Alert, { variant: 'notice', children: text('Sobre esta métrica...') });
		const alert = screen.getByRole('status').element();
		expect(alert.className).toContain('bg-amber-50');
		expect(alert.className).toContain('border-amber-200');
		expect(alert.className).toContain('text-amber-900');
	});

	it('always renders an icon, never color-only (KNOW-009 §122)', async () => {
		const screen = render(Alert, { variant: 'danger', children: text('Erro.') });
		const alert = screen.getByRole('status').element();
		expect(alert.querySelector('svg')).toBeTruthy();
	});

	it('renders the info variant distinctly from notice (blue, not amber)', async () => {
		const screen = render(Alert, { variant: 'info', children: text('Publicada.') });
		const alert = screen.getByRole('status').element();
		expect(alert.className).toContain('bg-blue-50');
	});

	it('renders the success variant', async () => {
		const screen = render(Alert, { variant: 'success', children: text('Concluído.') });
		const alert = screen.getByRole('status').element();
		expect(alert.className).toContain('bg-emerald-50');
	});
});
