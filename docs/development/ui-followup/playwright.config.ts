import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const evidence = resolve(import.meta.dirname, process.env.UI_FOLLOWUP_EVIDENCE ?? './artifacts');
export default defineConfig({
  name: 'ui-followup-5193',
  testDir: '../../../tests/gameplay', fullyParallel: false, workers: 1, timeout: 90000,
  outputDir: evidence,
  reporter: [['list'], ['json', { outputFile: resolve(evidence, 'results.json') }]],
  use: {
    baseURL: 'http://127.0.0.1:5193', viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium',
      args: ['--enable-unsafe-swiftshader'],
    },
  },
});
