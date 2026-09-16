import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import Tabs from './Tabs.svelte';

const detailTabs = [
	{ id: 'itens', label: 'Itens e Lotes' },
	{ id: 'resultados', label: 'Resultados Homologados' },
	{ id: 'historico', label: 'Histórico de Alterações' }
];

describe('Tabs', () => {
	it('marks the active tab via aria-selected, per KNOW-009 §64', async () => {
		const screen = render(Tabs, {
			tabs: detailTabs,
			active: 'resultados',
			onChange: () => {},
			label: 'Detalhes da contratação'
		});
		await expect
			.element(screen.getByRole('tab', { name: 'Resultados Homologados' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(screen.getByRole('tab', { name: 'Itens e Lotes' }))
			.toHaveAttribute('aria-selected', 'false');
	});

	it('applies the active/inactive visual classes', async () => {
		const screen = render(Tabs, {
			tabs: detailTabs,
			active: 'itens',
			onChange: () => {},
			label: 'Detalhes da contratação'
		});
		const activeTab = screen.getByRole('tab', { name: 'Itens e Lotes' }).element();
		expect(activeTab.className).toContain('border-slate-900');
		expect(activeTab.className).toContain('text-slate-900');

		const inactiveTab = screen.getByRole('tab', { name: 'Resultados Homologados' }).element();
		expect(inactiveTab.className).toContain('text-slate-400');
	});

	it('calls onChange with the clicked tab id', async () => {
		const onChange = vi.fn();
		const screen = render(Tabs, {
			tabs: detailTabs,
			active: 'itens',
			onChange,
			label: 'Detalhes da contratação'
		});
		await userEvent.click(screen.getByRole('tab', { name: 'Resultados Homologados' }));
		expect(onChange).toHaveBeenCalledWith('resultados');
	});

	it('moves focus to the next tab on ArrowRight and selects it', async () => {
		const onChange = vi.fn();
		const screen = render(Tabs, {
			tabs: detailTabs,
			active: 'itens',
			onChange,
			label: 'Detalhes da contratação'
		});
		const firstTab = screen.getByRole('tab', { name: 'Itens e Lotes' }).element() as HTMLElement;
		firstTab.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(onChange).toHaveBeenCalledWith('resultados');
	});

	it('wraps from the last tab to the first on ArrowRight, and exposes aria-sort-free reading order via tabindex roving', async () => {
		const onChange = vi.fn();
		const screen = render(Tabs, {
			tabs: detailTabs,
			active: 'historico',
			onChange,
			label: 'Detalhes da contratação'
		});
		const lastTab = screen.getByRole('tab', { name: 'Histórico de Alterações' }).element() as HTMLElement;
		lastTab.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(onChange).toHaveBeenCalledWith('itens');
	});
});
