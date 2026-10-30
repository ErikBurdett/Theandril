# Testing methodology — October 30, 2026

The owner stopped a verification cycle that had spent about an hour of browser
time on a fifty-line rule change and asked for the methodology to be cut. This
packet records what was measured, what changed and what was verified.

## Measured

From the full gameplay run retained in
[2026-10-29-reactive-interception/gameplay-full.log](../2026-10-29-reactive-interception/gameplay-full.log),
252 journeys in 84 files, four workers, under a load average of about fifteen:

| | Journeys | Worker time |
| --- | --- | --- |
| Whole suite | 252 | 6,157 s (24.9 min wall) |
| Journeys now tagged `@scale` | 50 | 1,777 s |
| Remaining ordinary journeys | 202 | 4,380 s |

The single heaviest file was `faction-roster.spec.ts` at 621 s, eighteen
parametrised founding journeys plus two twenty-four-seat ones. The unit project
is not the problem: 2,309 tests in 285 files run in 27 s wall
(`apps/web/src/worker-queries.test.ts` is the heaviest file at 24 s of test
time). The campaigns project runs in 20 s.

## Changed

- `playwright.config.ts` now defines two projects over `tests/gameplay`:
  `gameplay` (`grepInvert: /@scale/`) and `scale` (`grep: /@scale/`). It keeps
  the shared `chromiumLaunchOptions` runtime helper from the Playwright
  reliability work.
- Thirty `test(` calls in 27 spec files carry `{ tag: '@scale' }`: every-culture,
  every-biome and every-improvement sweeps, hundred-army, forty-hearth and
  thirty-two-town empires, Huge maps, the four render-budget journeys and the
  whole-campaign chronicle journey. Titles are unchanged.
- `package.json`: `test:gameplay` runs the ordinary project, `test:scale` the
  scale project, `test:gameplay:all` both.
- `.gitignore` refuses `trace.zip`, `*.trace`, `*.network`, `*.jpeg`, `*.webm`
  and `resources/` under `docs/development/`.
- `docs/TESTING.md` is the canonical guide; `AGENTS.md`, `README.md`,
  `docs/DEPLOYMENT.md` and `docs/updates/CONTRIBUTING.md` point at it. The
  complete browser suites are checkpoint runs, not per-change or per-deploy
  gates.

## Verified

- [typecheck-lint.log](typecheck-lint.log): `tsc --noEmit` and ESLint over the
  config, runtime helper and every gameplay spec pass.
- [playwright-list.log](playwright-list.log): `pnpm test:gameplay --list` 202
  tests in 79 files; `pnpm test:scale --list` 50 tests in 27 files;
  `pnpm test:gameplay:all --list` 252 tests in 84 files, the same total as
  before the split. A spec path without `--project` lists each of its tests
  once.
- [browser-smoke.log](browser-smoke.log): four ordinary journeys from three
  specs pass under the `gameplay` project in 16.8 s against the warm
  development server; `browser-results/` holds their screenshots only.

## Not done

- No journey was deleted or consolidated. The faction-roster sweep is the first
  candidate for consolidation into a content unit test plus one founding
  journey; that is the owner's call.
- The 52 `trace.zip` archives (about 405 MB) committed in earlier packets stay
  in the tree; removing them is an owner decision, as is purging the e103a72
  history.
- `tests/production` (34 files) was not split; it is a checkpoint suite as a
  whole.
