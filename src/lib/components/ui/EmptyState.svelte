<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** What happened — e.g. "Nenhuma contratação encontrada." */
		title: string;
		/** Why it might be empty / what the user can do — e.g. "Tente remover alguns filtros..." */
		description?: string;
		/** A recovery action, e.g. a "Limpar filtros" Button. */
		action?: Snippet;
	}

	let { title, description, action, class: className, ...rest }: Props = $props();
</script>

<!--
	KNOW-009 §54/106: empty states answer what happened, why it might be
	empty, and what the user can do — centered, 12px, slate-400 text,
	~32px vertical padding, rendered inside the normal
	table/container structure to avoid layout jumps.
-->
<div class="flex flex-col items-center gap-1 py-8 text-center text-xs text-slate-400 {className ?? ''}" {...rest}>
	<p>{title}</p>
	{#if description}
		<p>{description}</p>
	{/if}
	{#if action}
		<div class="mt-2">
			{@render action()}
		</div>
	{/if}
</div>
