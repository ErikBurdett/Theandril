# The second landmark catalogue and its events (rules/save 57) — 2026-10-31

Design: [ADR 0087](../../architecture/0087-landmarks-ii.md).

## What changed

- `packages/content/src/landmarks.ts`: twelve more kinds from rules 57 —
  the Sunken Court, the Warden Tower, the Whale Road, the Ash Vineyard, the
  Singing Bog, the Ironwood Stand, the Lantern Reef, the Hermit Cells, the
  Old Ford, the Glass Lens, the Drum Hill, the Wreck Strand — twenty-four in
  all. `events.ts`: six more events of the old places (a hermit at the old
  place, stone-robbers and the bare place they leave, a market at the
  stones, travellers' tales, fire at the old place); fifty-seven templates;
  the rules 56 pack (`7cad9f6e`) is frozen.
- `packages/sim/src/landmarks.ts`: placement read for a rules version,
  cached per world and rules (`landmarks(world, rules)`, `landmarkAt`,
  `LANDMARK_RULES`); the yield, the observation and the `landmark`
  condition read the campaign's rules. `save.ts`: save 57,
  `PRE_LANDMARKS_II_CONTENT_HASH`, the v56 schema and branch, v54 and v55
  envelopes re-sealed under the new pack; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen hash, twenty-four kinds, fifty-seven
  events, ten landmark events; the older seals read with their own
  catalogue), the landmark test (a rules 56 reading keeps to the first
  twelve kinds and is cached; the full catalogue places a new kind on one of
  two standard seeds; the observation under rules 56), version pins, the
  enclosed-basin ferry scenario re-seeded to 55 with the reason in its
  comment, the chronicle pin moved and attributed.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,348 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **382 / 329 / 195**, Attunement / Prosperity / Attunement; one refused survey order on Standard at turn 71, the recorded same-batch race ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 366 / 322, Long 299 / 251, Standard 215 / 179, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 366, chronicle Epic 439, Long 302, Standard 203, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: landmarks (two), hearth events | 3 passed in 8 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed, the pin moved 56 → 54 and attributed ([log](browser-chronicles.log), [attribution](chronicle-expectation.md), [replay](chronicle-replay.txt)) |

## Known limits

- The enclosed-basin ferry scenario (`enclosed-sea.test.ts`) is seed-specific
  by nature and moves whenever the world's content changes what its tiny map
  yields: seed 74 under rules 56, seed 55 from rules 57, as under rules 53.
- Landmarks still have no reward, intelligence or faction interaction beyond
  their yield and their events; the AI does not seek them.
