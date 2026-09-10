# Theandril compendium evidence

## Delivered

`/updates/compendium/` is a query-routed world compendium with an overview, 24 culture pages and unit detail pages. It consumes generated data only; it does not duplicate game numbers by hand.

## Data contract

- Generator: `scripts/build-compendium.ts`
- Regenerate: `pnpm tsx scripts/build-compendium.ts`
- Committed projection: `apps/web/src/updates/compendium/data.json` (**265,934 bytes**, below the 600 KB budget)
- Drift guard: `apps/web/src/updates/compendium/data.test.ts`
- Sources: `packages/content/src/index.ts`, mapgen biome names, and `apps/web/public/art/catalog.json`.
- The projection strips catalog output to the required frame, atlas, native size and provenance-provider fields.

## Art and presentation

`Sprite` uses atlas PNG CSS background positioning, first idle southeast frame where available, `image-rendering: pixelated`, 2× native sizing, accessible role/label text and catalog-provider title attributes. The UI has direct evidence links to the published art catalog.

Culture pages show crest/banner/badge, profile, ecology, recruitment weights, every currently exported unit, role sprites and settlement stages. Missing specialist culture-map poses are labelled **Shared battle sprite**. The current authoritative package exports **13**, not 14, unit definitions; the page deliberately displays 13 rather than fabricating another unit.

## Evidence

- `screens/compendium-1440.png`: desktop overview.
- `screens/compendium-390-130.png`: 390px / 130% unit gallery.
- Screenshot inspection found no clipping or horizontal overflow in the narrow gallery. Culture art and atlas sprites are visible; sparse generic categories truthfully show missing-sprite placeholders rather than invented artwork.

## Checks

- Data Vitest: 1 passed.
- Compendium Playwright journey: 1 passed.
- Scoped ESLint: passed.
- Full `pnpm typecheck` was attempted but is blocked by existing errors in `apps/web/src/updates/changelog.ts`, `lore.tsx`, and `lore.test.ts`, none from this compendium slice.
- Required production build was attempted but is blocked before compendium compilation by a missing concurrent-worktree file: `apps/web/src/updates/dispatches.tsx` referenced by `updates/dispatches/index.html`.

## Integration

Do not alter the real Pages Playwright config in this slice. Parent integration should add `tests/gameplay/compendium.spec.ts` to its `testMatch` when the concurrently-owned dispatches entry is available. The temporary, isolated compendium config is retained here for reproducible local evidence.
