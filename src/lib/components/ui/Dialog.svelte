<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { focusTrap } from '$lib/actions/useFocusTrap';
	import IconButton from './IconButton.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		title?: string;
		/** 'large' matches the Procurement Detail Modal pattern (KNOW-009 §63/§92: ~768px, 90vh). */
		size?: 'default' | 'large';
		children: Snippet;
		footer?: Snippet;
	}

	let { open, onClose, title, size = 'default', children, footer }: Props = $props();

	const maxWidth = { default: 'max-w-md', large: 'max-w-3xl' } as const;
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="absolute inset-0 bg-slate-900/40" transition:fade={{ duration: 150 }} onclick={onClose}></div>

		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'dialog-title' : undefined}
			class="relative flex max-h-[90vh] w-full {maxWidth[
				size
			]} flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
			transition:scale={{ duration: 150, start: 0.97 }}
			use:focusTrap={{ onClose }}
		>
			<!-- KNOW-009 §91: close icon is always available, regardless of title. -->
			<div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5">
				{#if title}
					<h2 id="dialog-title" class="text-lg font-bold text-slate-950">{title}</h2>
				{:else}
					<span></span>
				{/if}
				<IconButton icon="x" label="Fechar" onclick={onClose} />
			</div>

			<div class="flex-1 overflow-y-auto p-5">
				{@render children()}
			</div>

			{#if footer}
				<div class="border-t border-slate-200 bg-slate-50 p-5">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
