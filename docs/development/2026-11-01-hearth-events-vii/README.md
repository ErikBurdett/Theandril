# The seventh hearth-event catalogue (rules/save 78) — 2026-11-01

Design: [ADR 0110](../../architecture/0110-hearth-events-vii.md).

## What changed

- `packages/content/src/events.ts`: fifteen templates from rules 78 across
  the conditions and the ages, one a chain whose default declines the
  wager; one hundred and thirty-five templates; the rules 77 pack
  (`a1d7c299`) is frozen; the template schema admits rules 78.
- `packages/sim/src/save.ts`: save 78, `PRE_EVENTS_VII_CONTENT_HASH`, the
  v77 schema and branch (a v77 envelope may not name a rules 78 template);
  version plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen seal, counts, one chain, every rules 78
  default free of a follow-up), the sim version pins, the epochs test's
  list of age-gated events, a rules 78 test in `hearth-events.test.ts`
  (seal under 77, load, the refused v77 envelope, the far tithe's exact
  effect), a sixth journey in `tests/gameplay/hearth-events.spec.ts`
  answering the far tithe.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,381 tests / 310 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **339 / 281 / 213** (329 / 301 / 219 under rules 77), 0 refused orders: the Epic course drifts ten turns back toward its 350–400 band and stays eleven under it, Long and Standard in band; the larger catalogue redraws every fortune of the campaign, as every catalogue has, and no price changed ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 355 / 338, Long 246 / 285, Standard 194 / 199 (355 / 383, 286 / 315, 194 / 204 under rules 77), 0 refused orders: one Epic seed in band and one twelve under, the second Long seed moving most on the redraw ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 402, chronicle Epic 426, Long 288, Standard 208 (379 / 461 / 353 / 209 under rules 77), within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth events (six, one new) | 6 passed in 17 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 25 s at the pin’s new turn, **57** ([attribution](chronicle-expectation.md)): [the replay](chronicle-replay.txt) shows the Reedbound Council’s turn-40 draw landing on *The long peace* under rules 78 where rules 77 drew *Rumours of glass*, command 536 the first of 916 to differ ([log](browser-chronicles.log)) |

## What the tests found first

The template schema's `sinceRules` union had to admit 78 before the
content validated; nothing else failed on the first run.

## Known limits

- One hundred and thirty-five templates against the scope's one hundred and
  fifty.
- The AI answers the new templates by quoted value, as every catalogue; no
  template reads an office, a tax rate or a city-state kind.
