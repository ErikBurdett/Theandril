# Testing

What to run for a change, what runs only at a checkpoint, and why the browser
suite is split. CI proves only that the project builds; every deeper check runs
on the development machine, and most of them are cheap. The browser journeys are
the expensive part, and they are not a per-change gate.

## Tiers

| Tier | Command | Measured cost | Runs |
| --- | --- | --- | --- |
| Static | `pnpm typecheck`, `pnpm lint` | about two minutes | every change |
| Unit | `pnpm test:unit` | 2,309 tests in 285 files, under 30 s wall | every change |
| Campaigns | `pnpm test:campaigns` | 57 generated AI campaigns, about 20 s | any rules, AI or content change |
| Repository | `pnpm test:repository` | art factory, art pipeline, change feed | art or site-data changes |
| Build | `pnpm build` | about a minute | every change, before commit |
| Pacing | `pnpm measure:pacing` | about 90 s per run | a rules or AI change that could move how a campaign ends; judged on the headline twelve-realm campaign only |
| Covering journeys | `pnpm test:gameplay tests/gameplay/<spec>.spec.ts …` | seconds to a minute per spec | a player-facing change: the specs that exercise the changed behaviour, plus a new or extended journey when the behaviour is new |
| Ordinary journeys | `pnpm test:gameplay` | 203 journeys in 80 files, about 70 worker-minutes | batch checkpoints only |
| Scale journeys | `pnpm test:scale` | 32 journeys in 27 files, about 20 worker-minutes | on demand and at batch checkpoints |
| Production bundle | `pnpm build && pnpm test:production` | 36 journeys against the built bundle | before a release checkpoint, not per deploy |
| Pages build | `VITE_BASE_PATH=/Theandril/ pnpm build && pnpm exec playwright test --config playwright.pages.config.ts` | the multi-page site and its worker | before a release checkpoint; the live-URL form after a publication when a page-level change shipped |

The worker-minute figures were measured on 2026-10-29 under heavy shared load
and are an upper bound; a quiet machine runs the same journeys roughly a third
faster. `pnpm test:gameplay:all` runs both browser projects together.

## Per change

A slice is verified when typecheck, lint, the unit project and the build pass,
plus whichever of the campaigns project, pacing and covering journeys the change
touches. For a rule change of a few dozen lines that is under five minutes of
machine time. A deploy is proven by the live readback in
[DEPLOYMENT.md](DEPLOYMENT.md) (`scripts/verify-pages.mjs`), which checks the
served bundle and the roadmap against the release expectations; it does not
need a browser suite.

Do not run a complete browser suite to verify a slice or a deploy. Do not rerun
a suite to turn a load failure green. Never raise a timeout or weaken an
assertion to pass.

## Batch checkpoints

A full run of the ordinary journeys, the scale journeys or the production suite
happens when the owner agrees to a checkpoint, typically at the end of a batch of
slices or before a public dispatch. One suite at a time, two workers, on a quiet
machine: load average under about four, no other Playwright run on the host
(`ps -eo args | grep playwright/test`), several gigabytes free, the development
server already warm on port 4173. Run with `--output=<packet>/browser-results`
so results land in the evidence packet rather than the shared `test-results/`.

A journey that fails there with a timeout, `ERR_INSUFFICIENT_RESOURCES`, a
crashed headless shell or a dialog that never opened, and then passes alone, is
recorded in the packet once as a load failure. It is not a defect and not a
reason to rerun the suite. Chromium core dumps show up in `coredumpctl list`;
see the Playwright reliability packet under `docs/development/` for the shared
`/tmp` quota that caused a run of them.

## The scale project

`playwright.config.ts` defines two projects over one suite. The `scale` project
takes every test tagged `@scale`; the `gameplay` project takes the rest. A spec
path given without `--project` still runs each of its tests exactly once.

A journey is tagged `@scale` when it is one of:

- a sweep over every culture, biome, hull or improvement (the faction roster,
  faction art cohorts, naval art, biome variation, terrain art, tile footprints);
- a synthetic hundred-army or forty-hearth empire, or a thirty-two-town one
  (group movement, postings, charters, templates, selection groups, registry
  paging, production sequences, defense theaters, patrols);
- a Huge map or a measured render budget (the four performance journeys, Huge
  pans and overviews);
- a whole generated campaign played in the browser (chronicles).

Tag with the Playwright details argument, which keeps the title intact:

```ts
test('a hundred armies receive one group posting …', { tag: '@scale' }, async ({ page }) => {
```

These are an eighth of the journeys and a fifth of the run, and they produce
most of the load failures because each imports a large campaign and drives a
long loop. They still matter: run `pnpm test:scale` when the renderer, map geometry,
registry paging, batch orders or art coverage change, and at a checkpoint.

## Evidence packets

A packet under `docs/development/<date>-<slug>/` keeps the logs of what ran,
the journey's own screenshots, and any failure screenshot or `error-context.md`
worth reading. It never keeps `trace.zip` or raw trace parts (`*.trace`,
`*.network`, `*.jpeg`, `*.webm`, `resources/`); `.gitignore` now refuses them
under `docs/development/`. Stage a packet explicitly (`git add
docs/development/<packet>`) and read `git show --stat` before pushing. The 52
trace archives (about 405 MB) that earlier packets had committed were removed
from the tree on 2026-10-30; they remain in history.

## Writing tests

- A rule change gets its unit or property test in `packages/sim`, next to the
  rule. That is where determinism, save compatibility and replay are proven.
- A browser journey exists for the player-facing seam: the control, the text
  the player reads, the save that restores it. One campaign import and one
  save/load per journey is usually enough; extend an existing case before
  adding a file.
- Coverage of content (every culture, every biome) belongs in a unit test over
  the content tables with one representative browser journey, not in a
  parametrised browser sweep. The faction roster spec is the worked example:
  eighteen founding journeys (ten minutes) became one founding journey for a
  witness culture plus profile, ecology and rationale checks inside the
  existing all-cultures sweep (fifteen seconds for the file).
- Keep the forty-five-second journey timeout; a journey that needs longer is
  doing too much.
