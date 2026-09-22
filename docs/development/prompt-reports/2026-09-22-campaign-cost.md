# Campaign cost, test restructuring and design audit — 2026-09-22

## Prompt

“check out the new project tracker and look at Theandril there and continue development
towards 1.0. Also look at how we can simplify the code, efficiency, and improve and give
more depth to the gameplay all at once while keeping a very complex 4x game at scale
while easy to learn and play”, followed by “Also look into how we can optimize the
tests, i think there are maybe too many and taking too long”.

## Delivered

- **The DHARMA tracker's top Theandril item (ACT-18 / DH-015, M0) is advanced locally.**
  The default suite now passes twice in a row with Epic archive at 42–43 s against its
  60 s budget. The untouched original Epic test also passes, at 48.5 s. Before this
  work it took 57.7–66.5 s.
- **Faster turns, with exactly the same results:**
  - Naval AI route planning no longer repeats searches that cannot succeed.
  - End-of-turn seals skip re-validating remembered land and finished battle reports.
  - AI planners share one cell index.
  - Nine generated campaigns produce identical orders, turn seals and save bytes.
- **A faster test suite:** 47 s instead of 81 s wall, with no loss of coverage.
  `pnpm test:unit` gives a fast development loop; `pnpm test` still runs everything.
- **A design audit** for simplification, efficiency and gameplay depth, with spot-checked
  findings and three recommended next slices.

## Changed

- **Simulation:**
  - `packages/sim/src/movement.ts`: `createRoutePreviewer`.
  - `save.ts`: remembered-land fast path, cached sealed reports.
  - `battle-record.ts`: new sealing module.
  - `warfare.ts`: seal on record.
  - `simulation.ts`: typed explored sort.
  - `index.ts`: export.
- **AI:**
  - `packages/ai/src/naval.ts`: route previewer.
  - `observation-index.ts`: new shared cell index, used by `index.ts`, `navigation.ts`,
    `expansion.ts` and `sea-knowledge.ts`.
- **Tests:**
  - `tests/headless/chronicle-victory.test.ts`: the second replay is replaced by an
    identity proof.
  - `packages/ai/src/pacing*.test.ts` and `testing/pacing-campaign.ts`: split into
    parallel files.
  - `contact.test.ts`: light contact probes.
  - `apps/web/src/updates/changelog.test.ts`: one shared git feed build.
  - `packages/sim/src/individual-campaign.test.ts`: forges a detached copy of the
    sealed report.
  - New: `route-previewer.test.ts`, `canonical-history.test.ts`.
- **Pre-existing browser failures:**
  - `apps/web/src/updates/lore.tsx`: keyed text fragments.
  - `tests/gameplay/campaign-menu.spec.ts`: the menu's real keyboard order after
    `9243b09` added the Developer updates link.
- **Tooling:** `vitest.config.ts` defines the `unit`, `campaigns` and `repository`
  projects. `package.json` adds `test:unit`, `test:campaigns` and `test:repository`.
- **Documentation:**
  - `docs/development/2026-09-22-campaign-cost/`: evidence and design audit.
  - `docs/IMPLEMENTATION_STATUS.md`.
  - `docs/1.0-DEVELOPMENT.md`: M0 note.
  - The draft packet continuation note.
  - This report and its index entry.
- **Tracker:** ACT-18 and DH-015 local progress and history only.

## Verified

- Typecheck, lint, content validation (hash `b79c78ed`) and the production build pass.
- **Full suite:** 1,966/1,966 twice, in 46.6 s and 47.3 s. With the original Epic
  test file it is 1,966/1,966 in 52.9 s.
  [Summaries](../2026-09-22-campaign-cost/suite/full-suite-summaries.json).
- **Equivalence:** nine campaigns and 125,026 commands are identical to the
  pre-change candidate. [Result](../2026-09-22-campaign-cost/equivalence/result.txt).
- **Sequential A/B:** archive Epic went from 23.7 s to 17.4 s and pacing Epic seed 74
  from 31.2 s to 25.2 s. [Raw](../2026-09-22-campaign-cost/timing/sequential-ab.txt).
- **Browser:** the full Chromium gameplay suite passed 180/182. The two failures also
  fail identically on the pre-change baseline:
  - A lore React key bug, now fixed.
  - A stale keyboard-order assertion, now updated to the menu's real order.
  After the fixes, the affected journeys pass 4/4, the public-site journeys 18/18 and the
  Pages production smoke 27/27. [Details](../2026-09-22-campaign-cost/suite/browser-gameplay.txt).

## Not done / caveats

- **No commit, push, deployment or hosted run.** The last hosted Verify campaign was
  2.4–3.3× slower per test than local runs, so the hosted 60 s and 20 s budgets for
  Epic archive, Epic pacing and Huge/32 contact are still at risk. **ACT-18, DH-015, M0
  and all fifteen gates remain open.**
- The Epic archive test was modified: one redundant replay was replaced by an exact
  identity proof. The original file also passes locally, and both results are
  recorded.
- The design audit is planning input only. None of its gameplay mechanics are
  implemented.
- Running the gameplay suite rewrites three committed `docs/performance` JSON files.
  They were restored. The tests should write to their output directory instead.
- Playwright's pinned Chromium build is not installed on this machine. The browser run
  used the cached headless shell build 1234 through the config's
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Follow-ups

1. Decide how hosted CI runs the `campaigns` project, for example as a separate job or
   shard. Then run an authorized hosted Verify campaign.
2. Worker publication: replace the full hash that runs after every click with a
   revision token (see the design audit).
3. M1: client contracts, grievance/reputation (G2) and the victory registry (G1),
   following the audit's recommended slices.
