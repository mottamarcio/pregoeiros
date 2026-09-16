<script lang="ts">
	interface Tab {
		id: string;
		label: string;
	}

	interface Props {
		tabs: Tab[];
		active: string;
		onChange: (id: string) => void;
		/** Accessible name for the tablist, e.g. "Detalhes da contratação". */
		label: string;
	}

	let { tabs, active, onChange, label }: Props = $props();

	// KNOW-009 §64: active = slate-900 text + 2px slate-900 bottom border;
	// inactive = slate-400, hover slate-700.
	function selectByIndex(index: number) {
		const tab = tabs[(index + tabs.length) % tabs.length];
		onChange(tab.id);
		requestAnimationFrame(() => {
			document.getElementById(`tab-${tab.id}`)?.focus();
		});
	}

	function handleKeydown(event: KeyboardEvent, currentIndex: number) {
		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				selectByIndex(currentIndex + 1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				selectByIndex(currentIndex - 1);
				break;
			case 'Home':
				event.preventDefault();
				selectByIndex(0);
				break;
			case 'End':
				event.preventDefault();
				selectByIndex(tabs.length - 1);
				break;
		}
	}
</script>

<div role="tablist" aria-label={label} class="flex gap-4 border-b border-slate-200">
	{#each tabs as tab, index (tab.id)}
		<button
			id="tab-{tab.id}"
			type="button"
			role="tab"
			aria-selected={tab.id === active}
			tabindex={tab.id === active ? 0 : -1}
			class="border-b-2 px-1 py-2 text-xs font-medium transition-colors
				{tab.id === active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}"
			onclick={() => onChange(tab.id)}
			onkeydown={(e) => handleKeydown(e, index)}
		>
			{tab.label}
		</button>
	{/each}
</div>
