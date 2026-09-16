<!--
	Test-only harness: renders one element per custom design-system token
	class so component tests can assert the computed style actually
	resolves to the value documented in KNOW-009, not just that the class
	name exists in the stylesheet.
-->
<span data-testid="font-sans" class="font-sans">Aa</span>
<span data-testid="font-mono" class="font-mono">Aa</span>
<span data-testid="text-2xs" class="text-2xs">Aa</span>
<span data-testid="text-meta" class="text-meta">Aa</span>
<span data-testid="radius-badge" class="rounded-badge">Aa</span>
