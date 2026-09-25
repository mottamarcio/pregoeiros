import { expect, test } from '@playwright/test';

// Confirms the E2E runner, browser and web server are wired up correctly
// (SPEC-001 R6). Real user-journey tests (SPEC-001:R8's BDD scenarios)
// replace/join this file starting with FEAT-004.
test('Dado que o servidor da aplicação está no ar, quando o analista abre a página inicial, então a página carrega com sucesso', async ({
	page
}) => {
	const response = await page.goto('/');

	expect(response?.ok()).toBe(true);
});
