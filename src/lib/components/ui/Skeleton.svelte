<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width?: string;
		height?: string;
	}

	let { width = '100%', height = '1rem', class: className, ...rest }: Props = $props();
</script>

<!-- KNOW-009 §104–105: loading placeholder — no heavy shimmer effects. -->
<div
	class="animate-pulse rounded bg-slate-100 {className ?? ''}"
	style="width: {width}; height: {height};"
	role="presentation"
	aria-hidden="true"
	{...rest}
></div>
