import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';
import development from './frontend-playwright.config';

/** A plain static server deliberately has no SPA history fallback. */
export default defineConfig({
  ...development,
  use: { ...development.use, baseURL: 'http://127.0.0.1:5196/Theandril/' },
  outputDir: './frontend-evidence/production-browser',
  webServer: {
    cwd: resolve('.'),
    command: 'python -m http.server 5196 --bind 127.0.0.1 --directory docs/development/dispatches/frontend-build/dist',
    url: 'http://127.0.0.1:5196/Theandril/updates/',
    reuseExistingServer: false,
  },
});
