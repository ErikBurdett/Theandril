# Frontend journal implementation — evidence and limits

## Outcome

Implemented **Theandril Dispatches**, a public developer journal with an asymmetric featured story, single-spine archive, full-text/topic discovery, refresh-safe query permalinks, chaptered reader, source notes, selected 1.0 gate/scope ledger, documentation shelf and contributor handoff. It loads React only: the browser journeys observed **no simulation workers**.

Three substantive public entries are retained as typed data, newest reviewed work first:

1. **A campaign worth keeping** — R17 morale/save integrity, defending contingents, pending-assault correction, unchanged rule-16 history and the remaining review boundary.
2. **Keeping the whole record** — the retained R02 archive, durability corrections, prefix verification and all-store GC proof costs.
3. **Twenty-four ways to keep a hearth** — playable cultural identity, ecology, current art and the boundary between lore and runtime.

No overall 1.0 approval, invented release date, progress percentage, full magic/multiplayer claim or new game-rule implementation is implied. The content explicitly distinguishes the 753-test and 125,150-command checkpoint evidence from tests run for this journal. It does not add overlapping suites, relabel historical failures, rerun the 114,244-record/1,496-battle archive, or retry blocked AI/contact/supplemental probes.

## Real verification

| Command / scope | Actual result |
| --- | --- |
| `pnpm exec vitest run apps/web/src/updates --maxWorkers=1` | **12/12 tests, five files**, exit 0. [Log](final-vitest.log). Covers content, normalized filter behavior, URL resolution, image hashes/bounds/budget, cross-references, publication state, real pinned Git paths and checkpoint boundaries. |
| `pnpm exec tsc --noEmit` | Full repository typecheck exit 0. [Log](final-typecheck.log). This is a typecheck, not a full game test run. |
| `pnpm exec eslint apps/web/src/updates tests/gameplay/updates.spec.ts docs/development/dispatches/frontend-playwright.config.ts docs/development/dispatches/frontend-production.config.ts` | Scoped lint exit 0. [Log](final-lint.log). |
| `pnpm exec playwright test --config docs/development/dispatches/frontend-playwright.config.ts --reporter=line` | The then-current **nine journeys passed** on the Vite `/Theandril/` dev base, exit 0. [Log](29-final-browser.log). The subsequent contrast journey is included in both final runs below. |
| `pnpm --filter @theandril/web exec vite build --base /Theandril/ --outDir /home/telephoneheater/Work/Theandril-release/docs/development/dispatches/frontend-build/dist/Theandril` | Actual MPA production build exit 0. Uses the parent's real Vite input; changes no Vite config. [Log](33-production-build.log). |
| `pnpm exec playwright test --config docs/development/dispatches/frontend-production.config.ts --reporter=line` | **10/10 journeys passed** against built files served by plain Python HTTP, **no SPA fallback**, at `/Theandril/updates/`. [Log](34-production-browser.log). |
| `UPDATES_TEST_BASE=/ pnpm exec playwright test --config docs/development/dispatches/frontend-playwright.config.ts --reporter=line` | **The same 10/10 journeys passed** on the root development base. These are not 20 unique scenarios. [Log](35-root-browser.log). |
| `git diff --check -- <owned journal paths>` | Exit 0, scoped to this work, not an all-artifact freshness sweep. |

Browser harnesses used `/usr/bin/chromium`; no browser install was necessary. Typecheck/lint were rerun after the final harness configuration edits. Tests exercise 1440×1000 and 1366×768 desktop, plus 390×844 at 100%/130% root text with reduced motion. They cover deep-link refresh, search/filter intersection and reset, query persistence, unknown-ID recovery, keyboard skip navigation, image modal focus/Escape/return, actual decoded images, source links, horizontal overflow and browser/HTTP asset errors. No forced clicks, skipped assertions, retries or relaxed timeouts were used.

The built journal entry loads separate updates CSS/JS and shared React, not the game bundle. Build output is isolated beneath the ignored `frontend-build/dist/`; no parent dist was overwritten. The inherited Zod annotation and main-game chunk-size warnings remain. The out-of-root isolated output warning is expected. The first foreground build command was rejected by the terminal's server/watch classifier before execution; the same bounded build ran as a tracked background process and was awaited to exit 0. This was a tooling launch issue, not a failed application build.

The Python static server and Vite test servers are Playwright-owned and stopped. A final scoped `ss` check found **5196 free**. User 5173 was not touched. No commit, push, merge, deployment, new art production, external provider call or sibling-repository modification occurred.

## TDD record — do not infer outcomes from provisional filenames

Tests preceded their feature slices. The logs retain real failing assertions:

- `01-content-red.log` → `02-content-green.log`: absent R17 content failed the required title/status contract, then passed.
- `03-culture-red.log` → `04-culture-green.log`: missing cultural baseline, then sourced story.
- `05-archive-red.log` → `06-archive-green.log`: missing bounded-archive disclosure, then complete record/cost story.
- `07-filter-red.log` → `08-filter-green.log`: absent full-text/topic filter, then real filtering.
- `09-navigation-red.log` → `10-navigation-green.log`: absent permanent URL behavior, then round-trip navigation.
- `11-browser-red.log` → `17-browser-green.log`: missing public journal heading, then actual MPA reader/deep-link flow.
- `12-media-red.log` → `13-media-green.log`: absent provenance/image set, then selected originals.
- `14-crop-red.log` → `15-crop-green.log`: a real crop exceeded source width (`1095 > 890`); corrected within bounds. Pixel review also rejected an unhelpful first culture crop. The final derivatives were inspected, not just hashed.
- `18-search-red.log` → `19-search-green.log`: missing searchbox, then archive discovery with refresh/reset.
- `20-ledger-red.log` → `21-ledger-green.log`: missing scope/library surface, then real gate/source/contributor links.
- `22-dialog-red.log` → `23-dialog-green.log`: missing keyboard image inspector, then native modal behavior.
- `24-publication-red.log` → `25-publication-green.log`: missing explicit public state and work ordering, then checked revision-pinned catalog.
- `32-icon-red.log` → final unit/build/browser logs: caught the missing base-safe favicon. The final HTML reuses the existing reviewed ornament WebP via Vite’s `%BASE_URL%`; no root `/favicon.ico` request remains. Final browser journeys also fail on HTTP asset errors.
- `26-readable-red.log`: **three failures**, all measured 10.88px captions below the 14px requirement. The revised caption styles pass the same assertions in all final browser runs.

`16-browser-green.log` is **a failed intermediate run despite its provisional filename**: Vite warned about importing JSON from `public/`, and an exact accessible-name assertion included a decorative arrow. Source-side metadata plus a byte-equality test and an aria-hidden arrow corrected these. `27-readable-green.log` is also **a failed intermediate run**: its new keyboard test issued Tab before the destination React heading had rendered. `28-keyboard-wait.log` verifies the corrected test synchronization; no product focus workaround or weakened assertion was added. Later final runs pass. Initial missing-module discovery was handled inside RED tests so their failures were assertions, not unresolved imports; final tests use direct imports.

## Visual findings and real captures

The final **production** run retains **24 PNG captures**, plus layout/image/worker evidence and computed contrast measurements. Canonical screenshot root:

`production-browser/updates-readable-journal-at-{1440px-and-100,1366px-and-100,390px-and-100,390px-and-130}-text/`

Each of the four viewports retains `explore-top.png`, `explore-full.png`, `no-results.png`, `reader-top.png`, `reader-chapter.png` and `battle-illustration.png`. See the exact filenames/hashes in [artifact-manifest.json](artifact-manifest.json).

Directly inspected final built desktop opener, 390px/130% no-results/reset, the final narrow reader chapter, the real battle figure, and earlier whole-archive/scope composition:

- One strong serif headline beside actual cropped game imagery, rather than equal-weight dashboard cards. Archive entries have an editorial sequence and thin rules; no fake dates.
- Existing Hearth & Card walnut is darkened with a multiply wash. Original parchment is visible at the perimeter; an opaque writing wash keeps texture out of text. The supplied materials are reused by URL, not copied. No gradient or font CDN is added.
- Captions are now at least 14px; body uses deliberate local system sans with Georgia hierarchy. Dense technical notes remain ordinary chapter text, not a wall of tiny badges.
- Real images decode at both deployment bases. Their captions identify retained built-game or authored gallery fixtures, not organic campaign proof. Tactical soldiers are visible in the final figure; the source image is small and intentionally enlarged with nearest sampling.
- 390px/130% text wraps normally without horizontal overflow. Navigation and headline take more vertical space at enlarged text; the image is consequently further down the phone page. Nothing is clipped to force an above-the-fold composition.
- Seven conservative computed text/surface contrast checks pass **4.5:1**; the minimum measured bound is **4.647553270643061:1**. The bound accounts for translucent paper over black/white and multiply-darkened wood. This is not an exhaustive WCAG/assistive-technology audit.

The reference scout's guidance was read and applied to concrete issues (small captions, quiet material wash, chronological archive), not used to replace a working design. NMS reference captures remain outside deployed assets. No Hearth adaptation character, card rule or lore interpretation was imported into main-game canon.

## Image provenance and payload

Four optimized lossless screenshot crops total **147,904 bytes**. The 3MiB runtime-image budget passes. All source-relative paths, original and derived SHA-256s, literal crops, no-resize declarations, encoder details, alt text and captions are retained in `apps/web/public/updates/provenance.json`; `src/updates/media.json` is byte-identical metadata for Vite imports. Three existing shared material URLs are documented separately, with their hashes and no copy/transform claim.

Original source and crop pixels were inspected. Early incorrect crops were replaced, not called approved. The final culture crop preserves the three city subjects but also retains a small original map-compass fragment; it is a screenshot crop, not newly repainted art. The overview is expressly historical generator illustration, not the archive campaign's map. Existing art/license records remain authoritative; code licensing is not a blanket open-art license.

## Integration and remaining limits

The parent owns Vite inputs, game links, root scripts/docs, CI, full game gates and deployment. This frontend's only additional `docs/updates/` files are `STRUCTURE.md` and `prepare-images.py`; `CONTRIBUTING.md` and `TEMPLATE.md` are the parent's files and are linked, not modified. Published GitHub source objects are pinned; representative review-summary and faction-bible URLs returned HTTP 200, and every pinned evidence/image/library path exists at its exact Git revision in the Vitest check. The new authoring links on `master` depend on parent publication and are not claimed already live.

This is a first complete public journal, not a CMS, private preview service or full release certificate. Draft work stays in non-imported Markdown/branches. No comments, analytics, account system or server dependency is added. Firefox/WebKit, screen-reader sessions and every possible text/zoom setting were not exercised. Historical game evidence remains historical. Full AI integration, storage performance/durability certification and 1.0 signoff stay open exactly as the source record states.
