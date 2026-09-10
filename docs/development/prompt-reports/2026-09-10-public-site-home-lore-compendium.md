# Prompt report — 2026-09-10 — Public site: home, change ledger, lore library, compendium

## Prompt
"In Theandril port the lore library, show all units and assets available to each faction, and expand the /updates with new pages, a home page, and a compendium of the world of Theandril. On the home page should be a feed of detailed changes for each commit to master. This will also be the main website for the game." Plus a standing instruction: after each prompt, write a local development report.

## Delivered (live at https://erikburdett.github.io/Theandril/updates/)
- **Home** `/updates/` — hero, latest dispatch with image, doorways to Dispatches / Lore / Compendium, Road-to-1.0 strip, and **the change ledger**: every first-parent commit to `master` (date, short SHA → GitHub, subject, author, files/±lines, area chips, full body, optional authored notes from `docs/updates/changelog/<sha>.md`), first 8 shown, "Show N older", `?commit=<sha>` permalinks. Regenerated from full Git history in the Pages workflow before every build.
- **Dispatches** moved to `/updates/dispatches/` (permalinks `?dispatch=` moved with it) inside the shared shell.
- **Lore library** `/updates/lore/` — Book of Broken Roads (11 chapters + appendix in `order`), Foundations, Faction Bible (with culture anchors and the ecology table), Cohort notes. Rendered from `docs/lore/*.md` verbatim via `scripts/build-lore.ts` (wikilinks, callouts, tables); search across all text; prev/next; refresh-safe `?book=&chapter=`.
- **Compendium** `/updates/compendium/` — 24 cultures (crest/banner/badge, motto, profile, ecology, recruitment weights with the "preference only" disclosure), all 13 units with exact stats/prerequisites, buildings, improvements & features, resources, creatures, terrain yields, characters & missions, magic (lore-only powers labelled). Sprites are CSS-cut from the published atlases; per-culture page shows every unit in that culture's art or an honest "shared battle sprite"; unit page shows all 24 culture variants. `?culture=`/`?unit=` accept short or full IDs; each culture links to its faction-bible section.
- Shared shell (`SiteShell`, `site.ts`) with Hearth & Card materials; five independent HTML entries (no SPA fallback needed on Pages).

## Changed
- Site: `apps/web/updates/{,dispatches,lore,compendium}/index.html`, `apps/web/src/updates/**` (SiteShell, site, Home, Illustration, dispatches/lore/compendium entries + CSS, changelog, cross-links, compendium-routes, generated `lore/library.json`, `compendium/data.json`, `changelog/feed.json`).
- Generators: `scripts/build-{lore,compendium,changelog}.ts`; `package.json` scripts `site:build-data`, `changelog:build`.
- Build/CI: `apps/web/vite.config.ts` (5 entries), `.github/workflows/pages.yml` (regenerate feed before build), `playwright.pages.config.ts` (collects home/lore/compendium journeys).
- Tests: 14 site Vitest files; Playwright `tests/gameplay/{home,lore,compendium,updates}.spec.ts`, `tests/production/developer-navigation.spec.ts`.
- Docs: `docs/updates/CHANGELOG_FEED.md`, `docs/updates/changelog/`, `AGENTS.md` (prompt-report rule), this report convention (`docs/development/prompt-reports/`).
- Evidence: `docs/development/site-expansion/**` (RED/GREEN logs per workstream, screens, reviews).

## Verified
- Typecheck, lint, content:validate clean. Site Vitest **40/40** (`site-vitest.log`); full serial suite **1706/1706** (`full-tests.json`, run before the last two small fixes; affected files re-run green).
- Pages Playwright **20/20** locally (`pages-final.json`) and **20/20 against the live site** (`live-pages.json`), incl. 390px @130% no-overflow on every page.
- Independent review: original FAIL on two logic errors retained (`review/site-original.verdict.json`), bounded fixes with RED/GREEN, delta PASS (`review/site-final.verdict.json`); no security findings (markdown renderer escapes HTML, http(s)-only links).
- Pixels inspected by me on all ten page/viewport screens (`parent-screens/`) and on the live site (`~/.hermes/artifacts/theandril-site-0643cc8-*-live.png`).
- Published: `master` `4790331 → 8f30d2d → 0643cc8`; Pages run 34437705669 success; deployment 6364677771.
- User checkout `/home/telephoneheater/Work/Theandril` fast-forwarded to `0643cc8`, clean, 0/0 vs origin.

## Not done / blocked / caveats
- First deploy of `8f30d2d` failed the Pages gate: the committed change feed was generated with my global `diff.algorithm=histogram` and 7-char `%h`; CI's clone used myers and 8-char abbreviations. Fixed in `0643cc8` by pinning the algorithm/abbreviation/renames/CRLF in the generator (failure log retained: `review/pages-first-deployment-failure.log`).
- Compendium has no sprites for missions, magic entries, natural features and the four rules-15 units per culture — the catalog has none; shown as labelled placeholders, not invented art.
- Committed `feed.json` necessarily lags one commit behind HEAD (a commit can't contain its own hash); the deployed site is always current because CI regenerates it.
- Verify-campaign CI on `0643cc8` not awaited here; on the previous commit it was red on the same four long-form timeouts (unchanged, not bypassed).
- Not a 1.0 release; no gameplay rules changed.

## Follow-ups
- Author `docs/updates/changelog/<sha>.md` notes for `8f30d2d`/`0643cc8` (the ledger shows their commit bodies today).
- A dispatch for the site launch itself.
- Decide on the CI timeout policy for the long-form campaign tests.
