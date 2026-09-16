<script lang="ts">
	import Icon from '@iconify/svelte';
	import { lucideIcon } from './lucide';

	interface Props {
		name: string;
		width?: number | string;
		height?: number | string;
		class?: string;
	}

	let { name, width = 16, height = 16, class: className }: Props = $props();
</script>

<Icon icon={lucideIcon(name)} {width} {height} class={className} />
