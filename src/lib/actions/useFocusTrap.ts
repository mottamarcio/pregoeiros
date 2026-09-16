import type { Action } from 'svelte/action';

export interface FocusTrapOptions {
	/** Called when Escape is pressed while focus is trapped. */
	onClose?: () => void;
}

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

function getFocusable(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
		(el) => el.offsetParent !== null || el === document.activeElement
	);
}

/**
 * Traps Tab/Shift+Tab cycling within `node`, calls `onClose` on Escape,
 * moves initial focus into the container, and restores focus to whatever
 * was focused before the trap engaged once it is destroyed.
 *
 * Shared by `Dialog` and `Drawer` (KNOW-009 §91; Constitution WCAG 2.2 AA
 * — modal focus trapping with focus restoration).
 */
export const focusTrap: Action<HTMLElement, FocusTrapOptions | undefined> = (node, options = {}) => {
	let opts = options;
	const previouslyFocused = document.activeElement as HTMLElement | null;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			opts.onClose?.();
			return;
		}
		if (event.key !== 'Tab') return;

		const focusable = getFocusable(node);
		if (focusable.length === 0) {
			event.preventDefault();
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	const initialFocusable = getFocusable(node);
	(initialFocusable[0] ?? node).focus();

	node.addEventListener('keydown', handleKeydown);

	return {
		update(newOptions) {
			opts = newOptions ?? {};
		},
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
			previouslyFocused?.focus();
		}
	};
};
