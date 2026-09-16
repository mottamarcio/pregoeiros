<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Badge from './Badge.svelte';

	/**
	 * Known application statuses with their documented copy and variant
	 * (KNOW-009 §50). Every status badge in the app SHOULD go through
	 * this component rather than a bespoke Badge, per the Constitution's
	 * "same semantic action → same shared component" rule.
	 */
	const statusMap = {
		published: { label: 'Publicada', variant: 'info' },
		'result-homologated': { label: 'Resultado Homologado', variant: 'success' },
		'active-rule': { label: 'Regra Ativa', variant: 'neutral' }
	} as const;

	type Status = keyof typeof statusMap;

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		status: Status;
		/** Overrides the default copy for this status, if a screen needs different wording. */
		label?: string;
	}

	let { status, label, class: className, ...rest }: Props = $props();

	const config = $derived(statusMap[status]);
</script>

<Badge variant={config.variant} class={className} {...rest}>
	{label ?? config.label}
</Badge>
