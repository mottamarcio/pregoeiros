<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		/** Always required: every input must have an associated accessible label (KNOW-009 §42). */
		label: string;
		/** Visually hides the label while keeping it in the accessibility tree. */
		hideLabel?: boolean;
		/** KNOW-009 §43: explains consequence/format, not a repeat of the label. */
		helperText?: string;
		error?: string;
		value?: string | number;
	}

	let id = $props.id();
	let {
		label,
		hideLabel = false,
		helperText,
		error,
		value = $bindable(''),
		class: className,
		...rest
	}: Props = $props();

	const helperId = `${id}-helper`;
	const errorId = `${id}-error`;
</script>

<div class="flex flex-col gap-1">
	<label for={id} class={hideLabel ? 'sr-only' : 'text-[11px] font-medium text-slate-600'}>
		{label}
	</label>
	<input
		{id}
		bind:value
		class="h-9 rounded-lg border px-3 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400
			{error ? 'border-red-300' : 'border-slate-200'}
			focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50 {className ?? ''}"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? errorId : helperText ? helperId : undefined}
		{...rest}
	/>
	{#if error}
		<p id={errorId} class="text-[10px] text-red-600">{error}</p>
	{:else if helperText}
		<p id={helperId} class="text-[10px] text-slate-400">{helperText}</p>
	{/if}
</div>
