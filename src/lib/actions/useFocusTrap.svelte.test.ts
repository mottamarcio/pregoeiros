import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { focusTrap } from './useFocusTrap';

function buildTrapContainer() {
	const container = document.createElement('div');
	container.innerHTML = `
		<button id="first">First</button>
		<button id="middle">Middle</button>
		<button id="last">Last</button>
	`;
	document.body.appendChild(container);
	return container;
}

describe('focusTrap action', () => {
	let outsideButton: HTMLButtonElement;

	beforeEach(() => {
		outsideButton = document.createElement('button');
		outsideButton.textContent = 'Opens the trap';
		document.body.appendChild(outsideButton);
	});

	afterEach(() => {
		outsideButton.remove();
	});

	it('moves initial focus into the container', () => {
		outsideButton.focus();
		const container = buildTrapContainer();
		focusTrap(container);

		expect(document.activeElement?.id).toBe('first');
		container.remove();
	});

	it('wraps Tab from the last element back to the first', () => {
		const container = buildTrapContainer();
		focusTrap(container);

		const last = container.querySelector<HTMLElement>('#last')!;
		last.focus();
		last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));

		expect(document.activeElement?.id).toBe('first');
		container.remove();
	});

	it('wraps Shift+Tab from the first element back to the last', () => {
		const container = buildTrapContainer();
		focusTrap(container);

		const first = container.querySelector<HTMLElement>('#first')!;
		first.focus();
		first.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
		);

		expect(document.activeElement?.id).toBe('last');
		container.remove();
	});

	it('calls onClose when Escape is pressed', () => {
		const onClose = vi.fn();
		const container = buildTrapContainer();
		focusTrap(container, { onClose });

		container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		expect(onClose).toHaveBeenCalledOnce();
		container.remove();
	});

	it('restores focus to the previously focused element on destroy', () => {
		outsideButton.focus();
		expect(document.activeElement).toBe(outsideButton);

		const container = buildTrapContainer();
		const trap = focusTrap(container);
		expect(document.activeElement).not.toBe(outsideButton);

		trap?.destroy?.();
		container.remove();

		expect(document.activeElement).toBe(outsideButton);
	});
});
