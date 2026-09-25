import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173',
		port: 4173
	},
	use: {
		baseURL: 'http://localhost:4173'
	},
	// Chromium only (D-43): the app is used internally by a single company;
	// one engine keeps CI fast. Other engines can be added later without
	// rework.
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
