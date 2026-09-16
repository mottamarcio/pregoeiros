<script lang="ts">
	import Button from './Button.svelte';
	import { createRawSnippet } from 'svelte';

	interface Props {
		page: number;
		totalItems: number;
		pageSize: number;
		onPageChange: (page: number) => void;
	}

	let { page, totalItems, pageSize, onPageChange }: Props = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const rangeStart = $derived(totalItems === 0 ? 0 : (page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(page * pageSize, totalItems));

	// KNOW-010 §109 / Constitution: numeric formatting follows pt-BR
	// grouping (e.g. "1.482", not "1482").
	const formatter = new Intl.NumberFormat('pt-BR');
	const format = (n: number) => formatter.format(n);

	const anteriorLabel = createRawSnippet(() => ({ render: () => '<span>Anterior</span>' }));
	const proximaLabel = createRawSnippet(() => ({ render: () => '<span>Próxima</span>' }));
</script>

<!-- KNOW-010 §133: pagination footer pattern; current page never relies on color alone. -->
<div class="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
	<span class="font-mono">Exibindo {format(rangeStart)}–{format(rangeEnd)} de {format(totalItems)}</span>

	<div class="flex items-center gap-3">
		<Button
			variant="secondary"
			disabled={page <= 1}
			onclick={() => onPageChange(page - 1)}
			children={anteriorLabel}
		/>
		<span>Página {page} de {totalPages}</span>
		<Button
			variant="secondary"
			disabled={page >= totalPages}
			onclick={() => onPageChange(page + 1)}
			children={proximaLabel}
		/>
	</div>
</div>
