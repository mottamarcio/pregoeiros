<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import LucideIcon from '$lib/icons/LucideIcon.svelte';

	interface Props extends HTMLButtonAttributes {
		/** Lucide icon name (e.g. "bell", "settings-2"). */
		icon: string;
		/** Required: icon-only controls must expose an accessible name. */
		label: string;
		size?: 'micro' | 'standard' | 'header';
		variant?: 'default' | 'destructive';
	}

	let {
		icon,
		label,
		size = 'standard',
		variant = 'default',
		disabled = false,
		type = 'button',
		class: className,
		...rest
	}: Props = $props();

	// KNOW-009 §18/§23/§37: icon sizes (14/16/18px) and a minimum ~32px
	// touch target, expanded toward 40-44px is a caller concern via class.
	const iconSizes = { micro: 14, standard: 16, header: 18 } as const;

	const base =
		'inline-flex items-center justify-center rounded-lg transition-colors ' +
		'disabled:cursor-not-allowed disabled:opacity-50 ' +
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1';

	const variants = {
		default: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
		destructive: 'text-slate-400 hover:text-red-600'
	} as const;

	const sizeClass = 'h-8 w-8'; // ~32px minimum visual target
</script>

<button
	{type}
	class="{base} {variants[variant]} {sizeClass} {className ?? ''}"
	{disabled}
	aria-label={label}
	title={label}
	{...rest}
>
	<LucideIcon name={icon} width={iconSizes[size]} height={iconSizes[size]} />
</button>
