# The sixth hearth-event catalogue (rules/save 74) — 2026-11-01

Design: [ADR 0105](../../architecture/0105-hearth-events-vi.md).

## What changed

- `packages/content/src/events.ts`: fifteen templates from rules 74 across
  the conditions and the ages, one a chain whose default hears nothing;
  one hundred and twenty templates; the rules 73 pack (`4c666e0d`) is
  frozen.
- `packages/sim/src/save.ts`: save 74, `PRE_EVENTS_VI_CONTENT_HASH`, the
  v73 schema and branch (a v73 envelope may not name a rules 74 template);
  version plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen seal, counts, one chain, every rules 74
  default free of a follow-up), the sim version pins, the epochs test's
  list of age-gated events, a fifth journey in
  `tests/gameplay/hearth-events.spec.ts` answering the salt road toll.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,377 tests / 308 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **329 / 301 / 219**, all Prosperity or Attunement, 0 refused orders: **the Epic course sits 21 turns under its 350–400 band** (375 under rules 73), Long and Standard in band; see below ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic **355 / 383**, Long 286 / 315, Standard 194 / 204, 0 refused orders: both other Epic seeds in band, the first time both have been since rules 63 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 379, chronicle Epic 461, Long 353, Standard 209, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth events (five, one new) | 5 passed in 24 s (one rerun after the new journey’s text expectation was corrected) ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 26 s, the pin at 56 unmoved: [the replay](chronicle-replay.txt) shows the Reedbound Council’s turn-40 draw landing on another template again (command 536), and both catalogues still ending the campaign on 56 ([log](browser-chronicles.log)) |

## What the measurements found

The headline Epic course ends on 329 under rules 74, twenty-one turns under
its 350–400 band, where rules 73 ended it on 375. Two checks were made
before recording it as a drift. With every effect of the sixth batch
neutralised to one coin, the headline runs 351 / 318 / 209
([log](pacing-neutral-effects.log)): most of the move is the larger
catalogue redrawing every fortune of the campaign, as every catalogue has,
and the rest is which answers follow. The batch is not the generous one:
by the AI's own rough valuation its best answers average 7.0 against 12.1
for the first five catalogues and 6.1 for the fifth, so there is no price
to correct. Both other Epic seeds sit in band at 355 and 383, the first time
both have since rules 63, and Long and Standard hold. The drift is recorded
as one course's and watched; a re-pricing of the Epic pace with the pack
frozen remains the owner's call, not this slice's.

## Known limits

- One hundred and twenty templates against the scope's one hundred and
  fifty.
