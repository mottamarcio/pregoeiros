import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DataTable from './DataTable.svelte';

interface Procurement {
	id: string;
	objeto: string;
	valorEstimado: string;
}

const columns = [
	{ key: 'objeto', label: 'Objeto e Processo' },
	{ key: 'valorEstimado', label: 'Valor Estimado', align: 'right' as const, mono: true }
];

const rows: Procurement[] = [
	{ id: '1', objeto: 'Aquisição de notebooks', valorEstimado: 'R$ 100.000,00' },
	{ id: '2', objeto: 'Material hospitalar', valorEstimado: 'R$ 50.000,00' }
];

describe('DataTable', () => {
	it('renders the documented header style (slate-50, uppercase, 10px)', async () => {
		const screen = render(DataTable, {
			columns,
			rows,
			getRowKey: (r) => (r as Procurement).id,
			emptyTitle: 'Nenhum registro encontrado.'
		});
		const header = screen.container.querySelector('thead tr')!;
		expect(header.className).toContain('bg-slate-50');
		const th = header.querySelector('th')!;
		expect(th.className).toContain('uppercase');
		expect(th.className).toContain('text-2xs');
	});

	it('renders one row per data item, using the caller-provided row key', async () => {
		const screen = render(DataTable, {
			columns,
			rows,
			getRowKey: (r) => (r as Procurement).id,
			emptyTitle: 'Nenhum registro encontrado.'
		});
		const bodyRows = screen.container.querySelectorAll('tbody tr');
		expect(bodyRows.length).toBe(2);
		await expect.element(screen.getByText('Aquisição de notebooks')).toBeInTheDocument();
	});

	it('right-aligns and mono-formats analytical columns per KNOW-009 §52', async () => {
		const screen = render(DataTable, {
			columns,
			rows,
			getRowKey: (r) => (r as Procurement).id,
			emptyTitle: 'Nenhum registro encontrado.'
		});
		const cell = screen.getByText('R$ 100.000,00').element();
		expect(cell.className).toContain('text-right');
		expect(cell.className).toContain('font-mono');
	});

	it('shows the empty state instead of an empty <tbody> with no explanation', async () => {
		const screen = render(DataTable, {
			columns,
			rows: [],
			getRowKey: (r) => (r as Procurement).id,
			emptyTitle: 'Nenhuma contratação encontrada.',
			emptyDescription: 'Tente remover alguns filtros.'
		});
		await expect.element(screen.getByText('Nenhuma contratação encontrada.')).toBeInTheDocument();
		expect(screen.container.querySelectorAll('tbody tr').length).toBe(0);
	});

	it('wraps the table in a horizontally scrollable container (KNOW-009 §53)', async () => {
		const screen = render(DataTable, {
			columns,
			rows,
			getRowKey: (r) => (r as Procurement).id,
			emptyTitle: 'Nenhum registro encontrado.'
		});
		expect(screen.container.querySelector('.overflow-x-auto')).toBeTruthy();
	});
});
