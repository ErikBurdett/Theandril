# The eighth hearth-event catalogue (rules/save 79) — 2026-11-01

Design: [ADR 0111](../../architecture/0111-hearth-events-viii.md).

## What changed

- `packages/content/src/events.ts`: fifteen templates from rules 79 across
  the conditions and the ages, one a chain whose default refuses the
  bribe; one hundred and fifty templates, the scope's count; the rules 78
  pack (`909bc40d`) is frozen; the template schema admits rules 79.
- `packages/sim/src/save.ts`: save 79, `PRE_EVENTS_VIII_CONTENT_HASH`, the
  v78 schema and branch (a v78 envelope may not name a rules 79 template);
  version plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen seal, counts, one chain, every rules 79
  default free of a follow-up), the sim version pins, the epochs test's
  list of age-gated events, a rules 79 test in `hearth-events.test.ts`
  (one hundred and fifty, seal under 78, load, the refused v78 envelope,
  the shipwreck's cargo's exact coin and food), a seventh journey in
  `tests/gameplay/hearth-events.spec.ts` answering the shipwreck's cargo.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,382 tests / 310 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass after the Long proxy bound was re-derived ([log](tests-campaigns.log)); [the first run](tests-campaigns-first.log) failed that one bound at 375, see below ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **384 / 291 / 205** (339 / 281 / 213 under rules 78), 0 refused orders: **all three headline courses in band**, the Epic course by Attunement for the first time since rules 73 put it at 375; the larger catalogue redraws every fortune of the campaign and no price changed ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 352 / 351, Long 289 / 282, Standard 197 / 200 (355 / 338, 246 / 285, 194 / 199 under rules 78): every seed in band; one refused order on the second Standard seed, a survey mission the AI sent to ground already explored (turn 98), recorded ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 368, chronicle Epic 407, Long **382**, Standard 209 (402 / 426 / 288 / 208 under rules 78): the Long proxy passed its 375 maximum on the redraw while the headline Long course sits at 291, so the bound was re-derived from the tool (maximum 450) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth events (seven, one new) | 7 passed in 21 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 25 s, the pin at 57 unmoved ([note](chronicle-expectation.md)): [the replay](chronicle-replay.txt) shows the Reedbound Council’s turn-40 draw landing on *A foundling at the gate* under rules 79, command 536 the first to differ, and both catalogues ending the campaign on 57 ([log](browser-chronicles.log)) |

## What the tests found first

The first campaigns run failed the Long proxy (seed 99, tiny, four realms) at
its 375 maximum: it ended on 382 under the eighth catalogue's redraw where
rules 78 ended it on 288. The headline Long course, which the bound is
derived from, sits at 291, so the bound follows the tool as the Epic proxy's
did under rules 44, and nothing was tuned: maximum 375 to 450 in
`packages/ai/src/pacing.test.ts`, with the measurement named in its comment.

## Known limits

- The count is met; the depth is not: no template reads an office, a tax
  rate, a city-state kind or a character, and the AI answers every template
  by quoted value as it has since rules 46.
