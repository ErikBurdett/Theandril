# Lore library evidence

## Files

- `scripts/build-lore.ts` is the deterministic bounded Markdown-to-typed-JSON generator.
- `apps/web/src/updates/lore/library.json` is its committed generated output (14 documents: 11 Broken Roads chapters/appendix and three reference volumes).
- `apps/web/src/updates/lore.tsx` and `lore.css` render the shelf, reader, search, source links, headings, callouts, lists, tables, wikilinks, and chapter navigation in `SiteShell`.
- `apps/web/src/updates/lore.test.ts` asserts committed JSON equals a fresh in-memory generation.
- `tests/gameplay/lore.spec.ts` is the browser journey.

## Generated-content contract

Regenerate after source Markdown changes:

```sh
pnpm exec tsx scripts/build-lore.ts
```

The parser is deliberately bounded to source constructs used here: Obsidian frontmatter, headings, paragraphs, blockquotes, `[!note]` callouts, ordered/unordered lists, pipe tables, emphasis, strong text, inline code, wikilinks and Markdown links. It preserves source wording as typed text rather than hand-copying lore into the UI.

## Verification

- RED: `RED.log` records the missing-generator import failure before implementation.
- GREEN: `GREEN.log` records generator creation and 1 passing generation-contract Vitest test.
- `pnpm typecheck`: passed.
- `pnpm exec vitest run apps/web/src/updates/lore.test.ts --maxWorkers=1`: 1 passed.
- `VITE_BASE_PATH=/Theandril/ pnpm build`: passed; Vite emitted `updates/lore/index.html` and lore assets. Rollup retained pre-existing dependency/chunk-size warnings.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm exec playwright test --config docs/development/site-expansion/lore/playwright.config.ts --reporter=line`: 1 passed. It covers the four-volume shelf, chapter navigation, wikilink navigation, refresh, Chapter VI phrase search, 390px/130% overflow, and browser console errors.
- Scoped lint of all owned new code: passed.
- The requested broad lint command fails only in pre-existing, non-owned `Journal.tsx` and `compendium.tsx` (13 existing errors); no owned lore file is reported.

## Screenshots

- `screens/desktop-1440.png`: inspected; aligned two-column shelf, no clipping/overflow.
- `screens/mobile-390-130.png`: inspected; text wraps inside the parchment panel, no horizontal overflow.

## Limits

The static entry remains JavaScript-dependent like the existing Updates pages. Relative Markdown links resolve to source-pinned GitHub blobs; only known Broken Roads wikilinks become reader URLs. The visual reader deliberately uses no illustrations or invented art.
