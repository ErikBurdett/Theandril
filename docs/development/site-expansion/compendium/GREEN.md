# GREEN evidence

- `pnpm tsx scripts/build-compendium.ts` regenerated `apps/web/src/updates/compendium/data.json`.
- `pnpm exec vitest run apps/web/src/updates/compendium/data.test.ts`: **1 passed**.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm exec playwright test --config docs/development/site-expansion/compendium/playwright.config.ts`: **1 passed**.
- `pnpm exec eslint apps/web/src/updates/compendium.tsx apps/web/src/updates/compendium/data.test.ts tests/gameplay/compendium.spec.ts scripts/build-compendium.ts`: passed.

The Playwright journey verifies 24 culture cards, culture routing and refresh, all 13 units currently exported by the authoritative package, atlas response and rendered sprite geometry, exact Oath guard industry cost (24), search filtering, 390px at 130% without horizontal overflow, and no browser console/page errors.
