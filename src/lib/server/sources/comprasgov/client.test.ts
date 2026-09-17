import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('$env/dynamic/private', () => ({
	env: { COMPRAS_GOV_BASE_URL: 'https://compras.dados.gov.br/' }
}));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('comprasgovClient', () => {
	it('is configured with source "comprasgov" and the base URL from COMPRAS_GOV_BASE_URL', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) => {
				expect(url).toContain('https://compras.dados.gov.br/');
				return new Response(JSON.stringify({ ok: true }), { status: 200 });
			})
		);

		const { comprasgovClient } = await import('./client');
		const result = await comprasgovClient.request({ endpoint: 'catalog', schema: z.object({ ok: z.boolean() }) });

		expect(result).toEqual({ ok: true });
	});

	it('errors produced through comprasgovClient carry source: "comprasgov"', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('not found', { status: 404 }))
		);

		const { comprasgovClient } = await import('./client');

		await expect(
			comprasgovClient.request({ endpoint: 'catalog', schema: z.unknown() })
		).rejects.toMatchObject({ source: 'comprasgov', kind: 'http-status', status: 404 });
	});

	it('a validation failure through comprasgovClient also carries source: "comprasgov"', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ nope: true }), { status: 200 }))
		);

		const { comprasgovClient } = await import('./client');

		await expect(
			comprasgovClient.request({ endpoint: 'catalog', schema: z.object({ ok: z.boolean() }) })
		).rejects.toMatchObject({ source: 'comprasgov' });
	});
});
