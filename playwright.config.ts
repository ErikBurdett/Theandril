import { defineConfig } from '@playwright/test';
import { chromiumLaunchOptions } from './scripts/playwright-runtime';

/** One suite, two projects. `gameplay` holds the ordinary player journeys that a
 * change's covering specs come from. `scale` holds the journeys tagged @scale:
 * sweeps over every culture, biome or improvement, hundred-army and forty-hearth
 * empires, Huge maps, whole generated campaigns and measured render budgets.
 * They are a third of a full run and most of its load failures, so they run on
 * demand (`pnpm test:scale`) rather than with every `pnpm test:gameplay`.
 * A spec path given without `--project` still runs each of its tests exactly
 * once, under whichever project claims it. See docs/TESTING.md. */
const scale = /@scale/;

export default defineConfig({
  testDir: './tests/gameplay', fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: chromiumLaunchOptions },
  projects: [
    { name: 'gameplay', grepInvert: scale },
    { name: 'scale', grep: scale },
  ],
  webServer: { command: 'npm exec -- vite --host 127.0.0.1 --port 4173 --strictPort', cwd: './apps/web', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
