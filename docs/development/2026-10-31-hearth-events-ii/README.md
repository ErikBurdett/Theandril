# Hearth events II: the second catalogue (rules/save 47) — 2026-10-31

Design: [ADR 0077](../../architecture/0077-hearth-events-second-catalogue.md).

## What changed

- `packages/content/src/events.ts`: `SECOND_BATCH` (sixteen templates,
  `sinceRules: 47`), six new conditions, optional `ashglass` and `garrison`
  effect keys, `HEARTH_EVENT_EFFECT_KEYS`, `hearthEventEffect`; validation
  refuses a rules 46 template carrying a rules 47 effect. `contentPackHash`
  seals the catalogue by rules version (`events` is the catalogue, or `false`).
- `packages/sim/src/hearth-events.ts`: the new conditions; ashglass moves the
  realm's stockpile and is blocked when short; garrison hardens or thins every
  land company quartered at the hearth within its ranks;
  `assertHearthEventsWithin` refuses sealing a later catalogue's pending event
  under an older version. `save.ts`: save 47, `PRE_EVENTS_II_CONTENT_HASH`
  `8a737501`, v46 envelopes load unchanged; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `packages/ai/src/hearth-events.ts`: ashglass and garrison in the valuation.
- `tests/gameplay/chronicles.spec.ts`: the pinned victory turn is 56
  ([attribution](chronicle-expectation.md)).
- Tests: `packages/sim/src/hearth-events.test.ts` (conditions from state;
  drill and fever on a quartered company; ashglass paid in and out, blocked
  when short; a second-catalogue event refused as v46, a first-catalogue one
  sealed and loaded; rules 46 never draws the second catalogue),
  `packages/content/src/content.test.ts` (frozen `8a737501`, counts by
  version, the no-rules-47-effect rule), version pins in `attunement.test.ts`.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,330 tests / 288 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **388 / 313 / 216**, all Prosperity; one refused survey order on Epic at turn 130 (recorded) ([log](pacing-after.log), [json](pacing-after.json)) |
| proxies | Epic 344, chronicle Epic 401, Long 300, Standard 194, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth-events, attunement, diplomacy | 8 passed in 16 s ([log](browser-covering.log)) |
| `@scale` chronicles journey, alone | first run failed at the pinned turn (55 → 56), attributed headlessly ([note](chronicle-expectation.md), [replay](chronicle-replay.txt)); 1 passed in 23 s with the pin at 56 ([log](browser-chronicles.log)) |

## Known limits

- Twenty-four templates against a target of one hundred and fifty; no epochs,
  escalation or crises.
- The refused survey mission on Epic turn 130 is a pre-existing same-batch
  race, exposed by the changed course and not fixed here.
- Pacing is measured on the headline seed only.
