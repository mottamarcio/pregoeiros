<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import LucideIcon from '$lib/icons/LucideIcon.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/**
		 * 'notice' is KNOW-009 §75's terminology/coverage caveat pattern
		 * (amber-50/amber-200/amber-900 + info icon, "informational, not
		 * an error") — distinct from 'info', which uses the semantic blue
		 * used elsewhere (e.g. "Publicada").
		 */
		variant?: 'info' | 'notice' | 'success' | 'danger';
		children: Snippet;
	}

	let { variant = 'notice', class: className, children, ...rest }: Props = $props();

	const variants = {
		info: { classes: 'bg-blue-50 border-blue-200 text-blue-900', icon: 'info' },
		notice: { classes: 'bg-amber-50 border-amber-200 text-amber-900', icon: 'info' },
		success: { classes: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: 'circle-check' },
		danger: { classes: 'bg-red-50 border-red-200 text-red-900', icon: 'circle-x' }
	} as const;

	const config = $derived(variants[variant]);
</script>

<div
	role="status"
	class="flex items-start gap-2 rounded-xl border p-4 text-xs {config.classes} {className ?? ''}"
	{...rest}
>
	<LucideIcon name={config.icon} width={16} height={16} class="mt-0.5 shrink-0" />
	<div>{@render children()}</div>
</div>
