# Landmark events (rules/save 52) — 2026-10-31

Design: [ADR 0082](../../architecture/0082-landmark-events.md).

## What changed

- `packages/content/src/events.ts`: the `landmark` condition; six templates
  from rules 52 — pilgrims at the old place, relic hunters and the find it
  schedules, a keeper for the place, the stones moved, a festival at the old
  place; validation refuses the condition before rules 52. Forty-five
  templates in all; the rules 51 pack (`33f583e9`) is frozen.
- `packages/sim/src/hearth-events.ts`: the condition holds at a hearth whose
  own claimed land includes a landmark's hex. `save.ts`: save 52,
  `PRE_LANDMARK_EVENTS_CONTENT_HASH`, the v51 schema and branch (pack hash
  asserted, no pending event of later rules); version plumbing in
  `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen hash, counts, the validation), the
  hearth-event condition test (a landmark in and out of the hearth's land),
  version pins 51 → 52, and a second journey in
  `tests/gameplay/landmarks.spec.ts` (answer a landmark event from Realm
  affairs; the coin in the treasury and the answer in the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,342 tests / 292 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **394 / 356 / 216**, all Prosperity; one refused survey order on Long at turn 148, the recorded same-batch race ([log](pacing-after.log), [json](pacing-after.json)) |
| the Long headline under the frozen rules 51 pack, same code | 320, identical to the rules 51 measurement: the move to 356 is the re-rolled draws of the larger catalogue ([log](pacing-long-rules51.log), [json](pacing-long-rules51.json)) |
| seeds 20260906 and 20260907 | Epic 381 / 332, Long 260 / 284, Standard 197 / 201, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 326, chronicle Epic 420, Long 300, Standard 189, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [landmark-probe.ts](landmark-probe.ts), Long and Epic headline | Long: no paid claim by any AI realm in 356 turns, 12 of 24 landmarks held at the end, relic hunters, the find and pilgrims at the old place each offered once ([txt](landmark-probe-long.txt)); Epic: three paid claims in 394 turns, 14 of 24 held, relic hunters and the find once each ([txt](landmark-probe-epic.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: landmarks (two, one new), hearth events | 3 passed in 7 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 55 unmoved ([log](browser-chronicles.log)) |

## The AI claim planner, built and removed

A planner that claimed a landmark's hex outright ahead of improving worked
land and otherwise carried the border toward a landmark within three hexes
passed its unit tests and left every pacing figure above byte-identical,
because the probe shows AI realms almost never pay for a claim: their land
grows through commissions and ordinary growth. It was removed before
shipping; ADR 0082 records the design and the finding.

## Known limits

- Landmark events are rare (two or three per headline campaign) because few
  hearths hold a landmark; there is still no reward, intelligence or faction
  interaction beyond the events and the yield.
- The AI does not seek landmarks; the measured holding is ordinary growth.
- Forty-five templates against the scope's one hundred and fifty.
