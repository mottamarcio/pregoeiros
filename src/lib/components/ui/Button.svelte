<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import LucideIcon from '$lib/icons/LucideIcon.svelte';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
		icon?: string;
		iconPosition?: 'left' | 'right';
		loading?: boolean;
		loadingText?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		icon,
		iconPosition = 'left',
		loading = false,
		loadingText,
		disabled = false,
		type = 'button',
		class: className,
		children,
		...rest
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium ' +
		'transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1';

	const variants = {
		primary: 'bg-slate-900 text-white hover:bg-slate-800 px-3 py-2',
		secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-2',
		tertiary: 'bg-transparent text-slate-600 hover:text-slate-900 px-1 py-1',
		destructive:
			'bg-white text-slate-600 border border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 px-3 py-2'
	} as const;

	const isDisabled = $derived(disabled || loading);
</script>

<button
	{type}
	class="{base} {variants[variant]} {className ?? ''}"
	disabled={isDisabled}
	aria-busy={loading}
	{...rest}
>
	{#if loading}
		<LucideIcon name="loader-circle" width={14} height={14} class="animate-spin" />
		{loadingText ?? ''}
	{:else}
		{#if icon && iconPosition === 'left'}
			<LucideIcon name={icon} width={14} height={14} />
		{/if}
		{@render children()}
		{#if icon && iconPosition === 'right'}
			<LucideIcon name={icon} width={14} height={14} />
		{/if}
	{/if}
</button>
