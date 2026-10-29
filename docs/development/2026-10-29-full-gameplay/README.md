# Complete browser suites before publication — 2026-10-29

The complete `tests/gameplay` suite had not been run end to end since late
September; recent checkpoints ran `tests/production` and hand-picked gameplay
journeys. Before publishing rules 38–39 both suites were run in full.

## Results

| Run | Result |
| --- | --- |
| `pnpm test:production` on the rebuilt bundle | 59 passed ([log](../2026-10-29-full-production/production.log), [build](../2026-10-29-full-production/build.log)) |
| `pnpm test:gameplay`, first complete run (concurrent with the production suite) | 242 passed, 6 failed ([log](gameplay.log); failure screenshots under [results](results/)) |
| the six failures alone | 4 pass; `geography-performance` and `patrols.spec.ts:88` fail again ([log](gameplay-rerun.log)) |
| those two on the unchanged `4bf5d4c` code (temporary stash) | both fail identically: pre-existing drift, not regressions from this work |
| after the corrections below: geography, chronicles, next-action and group-postings journeys | 7 of 8 pass ([log](gameplay-rerun3.log)); the hundred-army group-posting journey timed out while the unit suite ran beside it and passes alone with its sibling ([log](gameplay-rerun4.log)) |
| `pnpm test` (unit, campaigns, repository), concurrent with browser reruns | 2,543 of 2,546 pass ([log](tests-full.log)); the three 20-second timeouts (generated contact, Git-history changelog, art factory) pass alone ([log](tests-isolated.log)); all 2,546 distinct tests have passing results |
| final `pnpm test:unit` and `pnpm lint` after the corrections | 2,293 tests / 281 files pass ([log](tests-unit-final.log)); lint passes ([log](lint-final.log)) |

## Corrections

- `tests/gameplay/patrols.spec.ts:88` chose posting destination `495` by cell;
  since the posting-targets change of 2026-10-24 the control offers only the
  army's current position and owned hearths. The journey now chooses "Where it
  stands", which is the same hex, and every later assertion is unchanged.
- `tests/gameplay/geography-performance.spec.ts` selects an army from the
  registry during an AI watch. The registry's browse, filter, sort and select
  controls had been locked by the same flag that locks orders, so in AI watch
  nothing could be inspected. `RealmRegistry` and `RealmRoster` now take
  `inspectBusy` (real pending work, battles and captures) separately from
  `busy` (orders), and the app passes it; group order controls stay locked in
  watch. A registry unit test covers both locks. The shared `openRegistry`
  helper no longer clicks a tab that is already selected.
- `tests/gameplay/chronicles.spec.ts` and `faction-roster.spec.ts` corrections
  are recorded in the Attunement and seam-study packets.

Four of the six first-run failures (a saved tactical round, Huge art rendering,
the twenty-versus-twenty battlefield and a partly refused charter group) were
45-second timeouts under concurrent load and pass alone; no assertion, timeout
or runtime changed for them.
