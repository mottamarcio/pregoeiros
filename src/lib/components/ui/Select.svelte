<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Option {
		value: string;
		label: string;
	}

	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		/** Always required: every select must have an associated accessible label (KNOW-009 §42). */
		label: string;
		hideLabel?: boolean;
		helperText?: string;
		options: Option[];
		value?: string;
	}

	let id = $props.id();
	let {
		label,
		hideLabel = false,
		helperText,
		options,
		value = $bindable(''),
		class: className,
		...rest
	}: Props = $props();

	const helperId = `${id}-helper`;
</script>

<div class="flex flex-col gap-1">
	<label for={id} class={hideLabel ? 'sr-only' : 'text-[11px] font-medium text-slate-600'}>
		{label}
	</label>
	<!--
		Per KNOW-009 §44: "Do not create a custom select unless native
		behavior proves insufficient." This wraps the native <select>
		visually, not behaviorally.
	-->
	<select
		{id}
		bind:value
		class="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none
			focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50 {className ?? ''}"
		aria-describedby={helperText ? helperId : undefined}
		{...rest}
	>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	{#if helperText}
		<p id={helperId} class="text-[10px] text-slate-400">{helperText}</p>
	{/if}
</div>
