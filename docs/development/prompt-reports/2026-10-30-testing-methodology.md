# Testing methodology cut to proportionate verification — 2026-10-30

## Prompt

"Our tests are becoming way too heavy for this project. stop them and then
let's re-evaluate the testing methodology as you are way over testing", then
"let's begin fixing and refining the testing methodology for this game - the
current tests are way too many, way too heavy, and eat too many resources when
they run."

## Delivered

Development process only; nothing a player sees changed.

- The browser suite is split into two Playwright projects over one tree:
  `gameplay` (202 ordinary journeys, 79 files) and `scale` (50 journeys tagged
  `@scale` in 27 files: content sweeps, hundred-army and forty-hearth empires,
  Huge maps, render budgets, the whole-campaign chronicle journey). The scale
  project is about a third of a full run's worker time and most of its load
  failures, and now runs on demand (`pnpm test:scale`).
- `docs/TESTING.md` is the canonical guide. A slice is verified by typecheck,
  lint, the unit project, the build and whichever of the campaigns project,
  pacing and covering journeys the change touches, under five minutes for a
  rule change. The complete browser suites are checkpoint runs the owner agrees
  to, two workers, quiet machine, load failures recorded once and not rerun to
  green. Deploys are proven by the live readback, now documented in
  `docs/DEPLOYMENT.md`.
- `.gitignore` refuses Playwright traces and raw trace parts under
  `docs/development/`, closing the path that produced the 586 MB e103a72 commit.

## Changed

- Test infrastructure: `playwright.config.ts` (two projects; keeps the
  `chromiumLaunchOptions` import from the Playwright reliability work),
  `package.json` scripts `test:gameplay`, `test:scale`, `test:gameplay:all`,
  `.gitignore`.
- Specs: thirty `test(` calls across 27 files under `tests/gameplay/` gain
  `{ tag: '@scale' }`; no title, assertion or timeout changed.
- Docs: `docs/TESTING.md` (new), `AGENTS.md` Testing section, `README.md`
  verification commands, `docs/DEPLOYMENT.md` (Pages suite is a checkpoint
  check; new "Proving a deploy" section), `docs/updates/CONTRIBUTING.md`,
  `docs/IMPLEMENTATION_STATUS.md` top entry.
- Evidence: `docs/development/2026-10-30-testing-methodology/`.

## Verified

- `tsc --noEmit` and ESLint over the config, runtime helper and all gameplay
  specs pass ([log](../2026-10-30-testing-methodology/typecheck-lint.log)).
- `--list` totals: gameplay 202 in 79 files, scale 50 in 27 files, both 252 in
  84 files, the pre-split total; a spec path without `--project` lists each
  test once ([log](../2026-10-30-testing-methodology/playwright-list.log)).
- Four ordinary journeys from three specs pass under the gameplay project in
  16.8 s ([log](../2026-10-30-testing-methodology/browser-smoke.log)). No
  complete suite was run; that is the point of the change.
- Measurements behind the split come from the retained full run of 2026-10-29:
  6,157 s of worker time over 252 journeys, of which the tagged journeys are
  1,777 s.

## Left open

- Consolidating the faction-roster sweep (eighteen founding journeys, 621 s)
  into a content unit test plus one founding journey, and similar for the art
  cohort sweeps. Owner's call; no journey was removed.
- The 52 `trace.zip` archives (about 405 MB) committed in earlier packets, and
  the e103a72 history purge: both owner decisions.
- `tests/production` (34 files, 36 journeys) was left whole as a checkpoint
  suite; thirteen of its files mirror gameplay specs and could be thinned.
- The reactive interception slice (rules/save 43) is verified under the new
  policy and still uncommitted in this checkout.
- Publication: none. The local branch state is recorded in the commit that
  carries this report.
