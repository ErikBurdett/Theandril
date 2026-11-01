# The fifth hearth-event catalogue (rules/save 73) — 2026-11-01

Design: [ADR 0104](../../architecture/0104-hearth-events-v.md).

## What changed

- `packages/content/src/events.ts`: fifteen templates from rules 73 across
  the conditions and the ages, one a chain whose default turns the envoy
  away; one hundred and five templates; the rules 69–72 pack (`d1205eae`)
  is frozen.
- `packages/sim/src/save.ts`: save 73, `PRE_EVENTS_V_CONTENT_HASH`, the v72
  schema and branch (a v72 envelope may not name a rules 73 template), the
  v69 through v71 branches reading the frozen pack; version plumbing in
  `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen seal, counts, one chain, every rules 73
  default free of a follow-up), the sim version pins and the frozen seals
  of the rules 69–72 tests, the epochs test's list of age-gated events, a
  fourth journey in `tests/gameplay/hearth-events.spec.ts` answering the
  horse fair.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,377 tests / 308 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **375 / 317 / 207**, all Prosperity, 0 refused orders (Epic 388 → 375, Long 296 → 317, Standard 198 → 207 against rules 72: the larger catalogue redraws every fortune) ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic **367 / 321**, Long 290 / 266, Standard 187 / 198, 0 refused orders; Epic seed 20260906 returns to the band at 367 and seed 20260907 drops to 321 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 403, chronicle Epic 422, Long 367, Standard 209, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth events (four, one new) | 4 passed in 15 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 25 s, the pin at 56 unmoved: [the replay](chronicle-replay.txt) shows the Reedbound Council’s turn-40 draw landing on another template under the larger catalogue (command 536 of 916), and both catalogues still ending the campaign on 56 ([log](browser-chronicles.log)) |

## What the tests found first

The hearth-event lapse test expected no pending event after a lapse; under
the larger catalogue the same turn draws a fresh fortune for another hearth,
which the lapse never forbade. The test now checks that the lapsed event is
gone and that whatever remains was drawn that turn.

## Known limits

- One hundred and five templates against the scope's one hundred and fifty.
