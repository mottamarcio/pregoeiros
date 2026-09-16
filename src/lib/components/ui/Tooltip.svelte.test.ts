import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Tooltip from './Tooltip.svelte';

const triggerButton = () =>
	createRawSnippet<[{ describedBy: string }]>((describedByFn) => ({
		render: () => `<button aria-describedby="${describedByFn().describedBy}">CNPJ 01.076...</button>`,
		setup: () => {}
	}));

describe('Tooltip', () => {
	it('is hidden until the trigger is hovered/focused', async () => {
		const screen = render(Tooltip, { text: 'CNPJ completo: 01.076.218/0001-65', trigger: triggerButton() });
		expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();
	});

	it('shows the full text on focus, linked via aria-describedby', async () => {
		const screen = render(Tooltip, { text: 'CNPJ completo: 01.076.218/0001-65', trigger: triggerButton() });
		const trigger = screen.container.querySelector('button')!;
		trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await new Promise((r) => setTimeout(r, 0));

		const tooltip = screen.container.querySelector('[role="tooltip"]');
		expect(tooltip).toBeTruthy();
		expect(tooltip?.textContent?.trim()).toBe('CNPJ completo: 01.076.218/0001-65');
		expect(trigger.getAttribute('aria-describedby')).toBe(tooltip?.id);
	});

	it('hides again on blur', async () => {
		const screen = render(Tooltip, { text: 'texto completo', trigger: triggerButton() });
		const wrapper = screen.container.querySelector('span')!;
		const trigger = screen.container.querySelector('button')!;

		trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await new Promise((r) => setTimeout(r, 0));
		expect(screen.container.querySelector('[role="tooltip"]')).toBeTruthy();

		wrapper.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
		await new Promise((r) => setTimeout(r, 0));
		expect(screen.container.querySelector('[role="tooltip"]')).toBeNull();
	});
});
