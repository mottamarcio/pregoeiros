<script lang="ts">
	import { fly } from 'svelte/transition';
	import LucideIcon from '$lib/icons/LucideIcon.svelte';
	import { toastStore } from './toastStore.svelte';
</script>

<!--
	KNOW-009 §100: bottom-right on desktop, bottom with safe horizontal
	margin on mobile; slate-900 bg, white text, 12px radius, shadow-lg.
-->
<div
	aria-live="polite"
	aria-atomic="true"
	class="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
>
	{#each toastStore.toasts as toast (toast.id)}
		<div
			role="status"
			transition:fly={{ y: 12, duration: 150 }}
			class="pointer-events-auto flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-lg"
		>
			<LucideIcon
				name={toast.variant === 'error' ? 'circle-x' : 'circle-check'}
				width={16}
				height={16}
				class={toast.variant === 'error' ? 'text-red-400' : 'text-emerald-400'}
			/>
			<span>{toast.message}</span>
			<button
				type="button"
				aria-label="Fechar notificação"
				class="ml-1 text-slate-400 hover:text-white"
				onclick={() => toastStore.dismiss(toast.id)}
			>
				<LucideIcon name="x" width={14} height={14} />
			</button>
		</div>
	{/each}
</div>
