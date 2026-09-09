import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
export default defineConfig({
  testDir: '../../../tests/gameplay', fullyParallel: false, workers: 1, timeout: 90000,
  outputDir: process.env.HERMES_UI_EVIDENCE ?? './artifacts',
  // List-only reporters discard passing in-memory JSON attachments. Keep the
  // exact observations and network/page evidence for parent integration review.
  reporter: [['list'], ['json', { outputFile: resolve(import.meta.dirname, process.env.HERMES_UI_EVIDENCE ?? './artifacts', 'results.json') }]],
  use: { baseURL: 'http://127.0.0.1:5192', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium', args: ['--enable-unsafe-swiftshader'] } },
});
