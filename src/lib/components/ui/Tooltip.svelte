<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The tooltip's text content — e.g. an accessible label, full untruncated value, or exact timestamp (KNOW-009 §124). */
		text: string;
		trigger: Snippet<[{ describedBy: string }]>;
	}

	let { text, trigger }: Props = $props();
	let id = $props.id();
	let open = $state(false);
</script>

<!--
	KNOW-009 §124: tooltips are for icon-only controls, truncated values,
	unfamiliar abbreviations, and exact timestamps behind relative dates —
	never the sole carrier of essential information.

	The real interactive semantics live on the caller-provided trigger
	content; this wrapper only listens for hover/focus bubbling from it
	to control tooltip visibility, so it intentionally carries no role.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="relative inline-flex"
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
	onfocusin={() => (open = true)}
	onfocusout={() => (open = false)}
>
	{@render trigger({ describedBy: id })}
	{#if open}
		<span
			id={id}
			role="tooltip"
			class="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 -translate-x-1/2 rounded-md
				bg-slate-900 px-2 py-1 text-2xs whitespace-nowrap text-white shadow-xs"
		>
			{text}
		</span>
	{/if}
</span>
