import { defineConfig } from '@playwright/test';

const base = process.env.VITE_BASE_PATH ?? '/Theandril/';
const origin = 'http://127.0.0.1:4175';

/** Exercise the actual Pages build, including its worker, CSS and approved art.
 * The optional live URL runs these same UI-only checks after publication. */
export default defineConfig({
  testDir: './tests', testMatch: ['**/production/**/*.spec.ts', '**/gameplay/updates.spec.ts', '**/gameplay/home.spec.ts', '**/gameplay/roadmap.spec.ts', '**/gameplay/lore.spec.ts', '**/gameplay/compendium.spec.ts'],
  workers: 1, timeout: 45_000,
  use: {
    baseURL: process.env.PAGES_SMOKE_URL ?? `${origin}${base}`,
    viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: process.env.PAGES_SMOKE_URL ? undefined : {
    command: 'npm exec -- vite preview --host 127.0.0.1 --port 4175 --strictPort', cwd: './apps/web',
    env: { VITE_BASE_PATH: base }, url: `${origin}${base}`, reuseExistingServer: false,
  },
});
