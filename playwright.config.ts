import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/gameplay', fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm exec -- vite --host 127.0.0.1 --port 4173 --strictPort', cwd: './apps/web', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
