import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const base = process.env.UPDATES_TEST_BASE === '/' ? '/' : '/Theandril/';
export default defineConfig({
  testDir: '../../../tests/gameplay', testMatch: 'updates.spec.ts', workers: 1,
  timeout: 30000, outputDir: base === '/' ? './frontend-evidence/root-browser' : './frontend-evidence/browser',
  use: { baseURL: `http://127.0.0.1:5196${base}`, viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium' } },
  webServer: { command: `pnpm exec vite --host 127.0.0.1 --port 5196 --strictPort --base ${base}`,
    cwd: resolve('apps/web'), url: `http://127.0.0.1:5196${base}`, reuseExistingServer: false },
});
