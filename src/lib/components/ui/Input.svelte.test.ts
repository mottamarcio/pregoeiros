import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Input from './Input.svelte';

describe('Input', () => {
	it('has an accessible label associated via for/id', async () => {
		const screen = render(Input, { label: 'Buscar por objeto' });
		const input = screen.getByRole('textbox', { name: 'Buscar por objeto' });
		await expect.element(input).toBeInTheDocument();
	});

	it('renders the default border state and switches to slate-900 on focus', async () => {
		const screen = render(Input, { label: 'UASG' });
		const input = screen.getByRole('textbox', { name: 'UASG' });
		await expect.element(input).toHaveClass(/border-slate-200/);
		await expect.element(input).toHaveClass(/focus:border-slate-900/);
	});

	it('renders helper text explaining consequence/format, associated via aria-describedby', async () => {
		const screen = render(Input, {
			label: 'Nome do Interesse',
			helperText: 'Rótulo que aparecerá no seu dashboard e nos alertas do Radar'
		});
		const input = screen.getByRole('textbox', { name: 'Nome do Interesse' });
		const describedBy = input.element().getAttribute('aria-describedby');
		expect(describedBy).toBeTruthy();
		const helper = document.getElementById(describedBy!);
		expect(helper?.textContent).toContain('Rótulo que aparecerá');
	});

	it('renders an error state with aria-invalid and an associated error message', async () => {
		const screen = render(Input, { label: 'CNPJ', error: 'CNPJ inválido' });
		const input = screen.getByRole('textbox', { name: 'CNPJ' });
		await expect.element(input).toHaveAttribute('aria-invalid', 'true');
		const describedBy = input.element().getAttribute('aria-describedby');
		const errorEl = document.getElementById(describedBy!);
		expect(errorEl?.textContent).toBe('CNPJ inválido');
	});

	it('can visually hide the label while keeping it accessible', async () => {
		const screen = render(Input, { label: 'Buscar', hideLabel: true });
		const input = screen.getByRole('textbox', { name: 'Buscar' });
		await expect.element(input).toBeInTheDocument();
		const label = screen.container.querySelector('label');
		expect(label?.className).toContain('sr-only');
	});
});
