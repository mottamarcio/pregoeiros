import { env } from '$env/dynamic/private';
import { createHttpClient } from '$lib/server/http/httpClient';

/**
 * Pre-configured HTTP client for the Compras.gov.br Open Data API.
 * Endpoint-specific modules (catalog, procurements, suppliers, results,
 * prices — SPEC-008–SPEC-012) call `.request()` on this instance with
 * their own Zod schema per endpoint.
 */
export const comprasgovClient = createHttpClient({
	source: 'comprasgov',
	baseUrl: env.COMPRAS_GOV_BASE_URL ?? ''
});
