import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Select from './Select.svelte';

const ufOptions = [
	{ value: '', label: 'Todas as UFs' },
	{ value: 'RJ', label: 'Rio de Janeiro' },
	{ value: 'SP', label: 'São Paulo' }
];

describe('Select', () => {
	it('has an accessible label associated via for/id', async () => {
		const screen = render(Select, { label: 'UF', options: ufOptions });
		const select = screen.getByRole('combobox', { name: 'UF' });
		await expect.element(select).toBeInTheDocument();
	});

	it('renders every option with its label', async () => {
		const screen = render(Select, { label: 'UF', options: ufOptions });
		const select = screen.getByRole('combobox', { name: 'UF' }).element() as HTMLSelectElement;
		const labels = Array.from(select.options).map((o) => o.textContent);
		expect(labels).toEqual(['Todas as UFs', 'Rio de Janeiro', 'São Paulo']);
	});

	it('is a native <select> element, per KNOW-009 §44', async () => {
		const screen = render(Select, { label: 'Modalidade', options: ufOptions });
		const select = screen.getByRole('combobox', { name: 'Modalidade' }).element();
		expect(select.tagName).toBe('SELECT');
	});

	it('renders the documented visual classes matching Input', async () => {
		const screen = render(Select, { label: 'UF', options: ufOptions });
		const select = screen.getByRole('combobox', { name: 'UF' });
		await expect.element(select).toHaveClass(/border-slate-200/);
		await expect.element(select).toHaveClass(/focus:border-slate-900/);
	});
});
