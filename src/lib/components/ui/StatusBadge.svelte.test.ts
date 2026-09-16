import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge', () => {
	it('renders the documented copy and info variant for "published"', async () => {
		const screen = render(StatusBadge, { status: 'published' });
		const el = screen.getByText('Publicada').element();
		expect(el.className).toContain('bg-blue-50');
	});

	it('renders the documented copy and success variant for "result-homologated"', async () => {
		const screen = render(StatusBadge, { status: 'result-homologated' });
		const el = screen.getByText('Resultado Homologado').element();
		expect(el.className).toContain('bg-emerald-50');
	});

	it('renders the documented copy and neutral variant for "active-rule"', async () => {
		const screen = render(StatusBadge, { status: 'active-rule' });
		const el = screen.getByText('Regra Ativa').element();
		expect(el.className).toContain('bg-slate-100');
	});

	it('allows overriding the default copy while keeping the status variant', async () => {
		const screen = render(StatusBadge, { status: 'published', label: 'Publicado hoje' });
		const el = screen.getByText('Publicado hoje').element();
		expect(el.className).toContain('bg-blue-50');
	});
});
