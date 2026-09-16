<script lang="ts" generics="T">
	import EmptyState from './EmptyState.svelte';

	interface Column<Row> {
		key: string;
		label: string;
		/** IDs stay left-aligned; analytical amounts/counts are usually right-aligned (KNOW-009 §52). */
		align?: 'left' | 'right';
		/** Amounts and counts SHOULD use JetBrains Mono (KNOW-009 §52). */
		mono?: boolean;
		render?: (row: Row) => string;
	}

	interface Props {
		columns: Column<T>[];
		rows: T[];
		getRowKey: (row: T) => string | number;
		caption?: string;
		emptyTitle: string;
		emptyDescription?: string;
	}

	let { columns, rows, getRowKey, caption, emptyTitle, emptyDescription }: Props = $props();
</script>

<!-- KNOW-009 §53: horizontal scroll on overflow, never shrink columns to unreadable levels. -->
<div class="overflow-x-auto">
	<table class="w-full text-xs">
		{#if caption}
			<caption class="sr-only">{caption}</caption>
		{/if}
		<thead>
			<tr class="bg-slate-50">
				{#each columns as col (col.key)}
					<th
						scope="col"
						class="px-4 py-2.5 text-2xs font-medium tracking-wide text-slate-500 uppercase {col.align ===
						'right'
							? 'text-right'
							: 'text-left'}"
					>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (getRowKey(row))}
				<tr class="border-t border-slate-100 hover:bg-slate-50/80">
					{#each columns as col (col.key)}
						<td
							class="px-4 py-2.5 {col.align === 'right' ? 'text-right' : 'text-left'} {col.mono
								? 'font-mono'
								: ''}"
						>
							{col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if rows.length === 0}
		<EmptyState title={emptyTitle} description={emptyDescription} />
	{/if}
</div>
