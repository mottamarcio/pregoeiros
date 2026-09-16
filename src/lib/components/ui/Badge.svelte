<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: 'neutral' | 'success' | 'info' | 'warning' | 'danger';
		children: Snippet;
	}

	let { variant = 'neutral', class: className, children, ...rest }: Props = $props();

	// KNOW-009 §50: pill radius, 8px/2px padding, 10px text, and the
	// documented bg/text/border triple per semantic color.
	const variants = {
		neutral: 'bg-slate-100 text-slate-700 border-slate-200',
		success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		info: 'bg-blue-50 text-blue-700 border-blue-200',
		warning: 'bg-amber-50 text-amber-700 border-amber-200',
		danger: 'bg-red-50 text-red-700 border-red-200'
	} as const;
</script>

<span
	class="inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium {variants[
		variant
	]} {className ?? ''}"
	{...rest}
>
	{@render children()}
</span>
