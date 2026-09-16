<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Changes border on hover (slate-200 → slate-300/400) — KNOW-009 §47. */
		hoverable?: boolean;
		/** Selected data card: slate-900 border, slate-50/50% background — KNOW-009 §48. */
		selected?: boolean;
		children: Snippet;
	}

	let { hoverable = false, selected = false, class: className, children, ...rest }: Props = $props();
</script>

<div
	class="rounded-xl border p-5
		{selected ? 'border-slate-900 bg-slate-50/50' : 'border-slate-200 bg-white'}
		{hoverable && !selected ? 'hover:border-slate-400' : ''} {className ?? ''}"
	{...rest}
>
	{@render children()}
</div>
