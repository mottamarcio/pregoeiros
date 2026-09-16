<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { focusTrap } from '$lib/actions/useFocusTrap';
	import IconButton from './IconButton.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		side?: 'left' | 'right';
		title?: string;
		children: Snippet;
	}

	let { open, onClose, side = 'left', title, children }: Props = $props();

	const sideClass = { left: 'left-0', right: 'right-0' } as const;
	const flyX = $derived(side === 'left' ? -256 : 256);
</script>

{#if open}
	<!--
		KNOW-010 §138 z-index model: mobile backdrop (10) sits below the
		drawer panel itself (20, the sidebar's own tier), as two fixed
		siblings rather than nesting the panel inside the backdrop.
	-->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-10 bg-slate-900/40"
		transition:fade={{ duration: 150 }}
		onclick={onClose}
	></div>

	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'drawer-title' : undefined}
		class="fixed top-0 {sideClass[side]} z-20 h-full w-64 overflow-y-auto border-slate-200 bg-white shadow-xl
			{side === 'left' ? 'border-r' : 'border-l'}"
		transition:fly={{ x: flyX, duration: 200 }}
		use:focusTrap={{ onClose }}
	>
		<div class="flex items-center justify-between border-b border-slate-200 p-4">
			{#if title}
				<h2 id="drawer-title" class="text-lg font-bold text-slate-950">{title}</h2>
			{:else}
				<span></span>
			{/if}
			<IconButton icon="x" label="Fechar" onclick={onClose} />
		</div>
		<div class="p-4">
			{@render children()}
		</div>
	</div>
{/if}
