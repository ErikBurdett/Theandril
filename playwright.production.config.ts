import { defineConfig } from '@playwright/test';

/** Smoke the actual built bundle, with no development mutation/inspection hooks. */
export default defineConfig({
  testDir: './tests/production', workers: 1, timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4174', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm exec -- vite preview --host 127.0.0.1 --port 4174 --strictPort', cwd: './apps/web',
    url: 'http://127.0.0.1:4174', reuseExistingServer: false,
  },
});
