import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import Pagination from './Pagination.svelte';

describe('Pagination', () => {
	it('renders the documented "Exibindo X–Y de Z" / "Página N de M" pattern', async () => {
		const screen = render(Pagination, {
			page: 1,
			totalItems: 1482,
			pageSize: 25,
			onPageChange: () => {}
		});
		await expect.element(screen.getByText('Exibindo 1–25 de 1.482')).toBeInTheDocument();
		await expect.element(screen.getByText('Página 1 de 60')).toBeInTheDocument();
	});

	it('disables "Anterior" on the first page', async () => {
		const screen = render(Pagination, { page: 1, totalItems: 100, pageSize: 25, onPageChange: () => {} });
		await expect.element(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
		await expect.element(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled();
	});

	it('disables "Próxima" on the last page', async () => {
		const screen = render(Pagination, { page: 4, totalItems: 100, pageSize: 25, onPageChange: () => {} });
		await expect.element(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
	});

	it('calls onPageChange with the next/previous page number', async () => {
		const onPageChange = vi.fn();
		const screen = render(Pagination, { page: 2, totalItems: 100, pageSize: 25, onPageChange });

		await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
		expect(onPageChange).toHaveBeenCalledWith(3);

		await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
		expect(onPageChange).toHaveBeenCalledWith(1);
	});

	it('the current page is conveyed as text, not color alone (KNOW-010 §133)', async () => {
		const screen = render(Pagination, { page: 3, totalItems: 100, pageSize: 25, onPageChange: () => {} });
		await expect.element(screen.getByText('Página 3 de 4')).toBeInTheDocument();
	});
});
