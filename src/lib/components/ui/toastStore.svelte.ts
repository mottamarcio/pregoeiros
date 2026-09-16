export interface Toast {
	id: number;
	message: string;
	variant: 'success' | 'error';
}

const DEFAULT_DURATION_MS = 3000;

let nextId = 1;
let toasts = $state<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function dismiss(id: number) {
	toasts = toasts.filter((t) => t.id !== id);
	const timer = timers.get(id);
	if (timer) {
		clearTimeout(timer);
		timers.delete(id);
	}
}

function add(message: string, options: { variant?: Toast['variant']; durationMs?: number } = {}) {
	const id = nextId++;
	const variant = options.variant ?? 'success';
	toasts = [...toasts, { id, message, variant }];

	const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
	timers.set(
		id,
		setTimeout(() => dismiss(id), durationMs)
	);

	return id;
}

/**
 * Shared toast queue (KNOW-009 §100–103). A Svelte store built on runes
 * rather than a third-party toast library — no demonstrated need for
 * one yet.
 */
export const toastStore = {
	get toasts() {
		return toasts;
	},
	add,
	dismiss
};
