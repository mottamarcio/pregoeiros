import { getIconData, type IconifyIcon } from '@iconify/utils';
import lucideIconSet from '@iconify-json/lucide/icons.json' with { type: 'json' };
import type { IconifyJSON } from '@iconify/types';

const iconSet = lucideIconSet as IconifyJSON;
const cache = new Map<string, IconifyIcon>();

/**
 * Resolves a Lucide icon's raw data from the bundled `@iconify-json/lucide`
 * collection — never fetched from the Iconify API at runtime.
 */
export function lucideIcon(name: string): IconifyIcon {
	const cached = cache.get(name);
	if (cached) return cached;

	const data = getIconData(iconSet, name);
	if (!data) {
		throw new Error(`Unknown Lucide icon: "${name}"`);
	}

	cache.set(name, data);
	return data;
}
