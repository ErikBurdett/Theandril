# The crises' own events (rules/save 54) — 2026-10-31

Design: [ADR 0084](../../architecture/0084-crisis-events.md).

## What changed

- `packages/content/src/events.ts`: the `crisis` condition and the `crisis`
  field; six templates from rules 54 — the last of the grain, a toll at our
  own gate, the clerks fall sick, the cistern cracks, a run on the market,
  ash in the fields; validation pairs the condition and the crisis and
  refuses either before rules 54. Fifty-one templates; the rules 53 pack
  (`d50775cf`) is frozen.
- `packages/sim/src/hearth-events.ts`: `offerCrisisEvents` (every realm with
  a free slot, first eligible hearth, the crisis named, a `.crisis` id);
  the `crisis` condition is never drawn. `crises.ts`: the crisis offers its
  event as it begins. `save.ts`: save 54, `PRE_CRISIS_EVENTS_CONTENT_HASH`,
  the v53 schema and branch; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `packages/ai/src/index.ts`: the shelter is issued first in the batch.
- Tests: the content tests (frozen hash, counts, pairing), the crisis test
  (the first crisis's event offered to every realm with a hearth; the slot
  it takes keeps the second crisis's event away; the offer in the
  observation), the hearth-event tests (never drawn; the lapse test waits
  past a crisis offer), the AI crisis test (shelter first), a second journey
  in `tests/gameplay/crises.spec.ts` (answer the Grey Winter's event from
  Realm affairs under shelter; the coin and the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,346 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **408 / 275 / 215**, all Attunement, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 344 / 313, Long 308 / 246, Standard 211 / 176, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 353, chronicle Epic 448, Long 323, Standard 204, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [crisis-event-probe.ts](crisis-event-probe.ts), Epic and Long headline | the Toll Wars' event offered to all twelve realms on turn 26 and the Tremors' on 41 ([epic](crisis-event-probe-epic.txt), [long](crisis-event-probe-long.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: crises (two, one new), hearth events | 3 passed in 7 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin moved 53 → 56 and attributed ([log](browser-chronicles.log), [attribution](chronicle-expectation.md), [replay](chronicle-replay.txt)) |

## The drawn version, measured and replaced

With the six templates eligible for the ordinary draw while their crisis
stood (weight five), the headline measured 423 / 331 / 209 while the other
seeds were identical to rules 53 to the turn: no crisis event was ever
offered on either headline course (a window of four to six turns rarely
holds a draw), and the templates' presence in the eligible set re-rolled
the draws inside the windows. The shipped design offers the event as the
crisis comes; the drawn version is recorded here only.

## Known limits

- One event per crisis, offered once to each realm; a realm already
  answering an event misses it. No chain follows a crisis event.
- The Long headline courses lie under their target (275 / 308 / 246) and
  the Epic courses spread 313–408 across the three seeds; the crises'
  events move a course either way.
