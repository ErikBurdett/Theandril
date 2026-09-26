# Edition 08 publication verification

Implementation source: `3ed4a6c456c3e4130fddf35b44dfdf51034cc269`.
The article, current library and image provenance pin that exact checkpoint.
These publication checks include two additional editorial contract tests; they
overlap the source checkpoint's checks and are not additive totals.

- **1,904/1,904 tests across 237 files pass**, 55.37 seconds with four local workers: [publication-tests.log](publication-tests.log).
- **30/30 local production Pages journeys pass**, 44.5 seconds: [publication-pages.log](publication-pages.log). This includes the actual built game and its workers, new template journey, historical charter/posting journeys, assets, journal navigation, all four article viewport/text-scale cases, roadmap, lore and compendium.
- Whole-project typecheck and lint pass; Pages-subpath production build passes. Logs are retained alongside this report. Existing content/art validation passed for the implementation; no game content or artwork changed in publication.
- Initial publication typecheck caught TS2367 in the new roadmap test's comparison against an impossible member of its narrowed status union. [The original failure](publication-typecheck-initial.log) is retained. The assertion now checks that every gate has an allowed open status. Final typecheck passes; [all nine roadmap checks pass again](publication-roadmap-recheck.log) and scoped lint passes. No assertion or timeout was weakened.

The existing seven articles and twelve prior imagery records/bytes remain
unchanged. The new exact controls PNG is 81,322 bytes; thirteen public images
total **3,118,774 bytes**, below the unchanged three-MiB budget. There are still
23 roadmap items (six completed, thirteen in progress, four pending) and fifteen
open release gates. The catalogue's current delivered/remaining bullet counts
are editorial bookkeeping, not a fixed-scope completion percentage.

[Independent factual and visual review](publication-review.md) compares source
links and retained pixels. [Four viewport records](publication-layout/provenance.json)
retain exact reader, chapter, illustration and layout evidence: 1440×1000,
1366×768, 390×844, and 390×844 at 130% text. The complete temporary Pages artifact
directory is retained locally in the ignored verification cache; these focused
copies and the all-scenario log are committed.

GitHub deployment and live checks follow publication and are recorded separately.
No workflow, game rule, campaign save version, AI policy or pace price changes.
