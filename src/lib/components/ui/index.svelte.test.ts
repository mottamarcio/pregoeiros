import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import * as ui from './index';

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('ui barrel (src/lib/components/ui/index.ts)', () => {
	it('exports every component built in TASK-006 through TASK-014', () => {
		const expectedExports = [
			'Button',
			'IconButton',
			'Input',
			'Select',
			'Badge',
			'StatusBadge',
			'Card',
			'Tooltip',
			'EmptyState',
			'Skeleton',
			'Alert',
			'DataTable',
			'Pagination',
			'Tabs',
			'Dialog',
			'Drawer',
			'Toast',
			'toastStore'
		];

		for (const name of expectedExports) {
			expect(ui, `missing export: ${name}`).toHaveProperty(name);
			expect((ui as Record<string, unknown>)[name], `${name} export is falsy`).toBeTruthy();
		}
	});

	it('a component imported solely from the barrel actually renders', async () => {
		const screen = render(ui.Button, { variant: 'primary', children: label('Salvar') });
		await expect.element(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
	});

	it('the toastStore exported from the barrel is the same live singleton', () => {
		expect(ui.toastStore.toasts).toEqual([]);
		const id = ui.toastStore.add('teste');
		expect(ui.toastStore.toasts.some((t) => t.id === id)).toBe(true);
		ui.toastStore.dismiss(id);
	});
});
