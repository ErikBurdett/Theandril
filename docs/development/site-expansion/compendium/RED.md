# RED evidence

## Data projection

Command: `pnpm exec vitest run apps/web/src/updates/compendium/data.test.ts`

Observed failure before implementation: `Cannot find module '../../../../../scripts/build-compendium'`. The test required a build-time projection and committed data contract before the generator existed.

## Browser journey

Command: `VITE_BASE_PATH=/Theandril/ pnpm build && PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm exec playwright test --config docs/development/site-expansion/compendium/playwright.config.ts`

Observed failure before the page implementation: Vite could not build because the concurrent worktree was missing `apps/web/src/updates/dispatches.tsx`. This is outside the compendium-owned paths. The compendium Playwright test was then exercised against an agent-owned Vite development server after implementation.
