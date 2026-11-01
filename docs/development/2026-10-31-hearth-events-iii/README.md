# The third hearth-event catalogue (rules/save 62) — 2026-10-31

Design: [ADR 0093](../../architecture/0093-hearth-events-iii.md).

## What changed

- `packages/content/src/events.ts`: fifteen templates from rules 62 across
  the conditions and the ages, one a chain whose default keeps out of it;
  seventy-five templates; the rules 61 pack (`acd39799`) is frozen.
- `packages/sim/src/save.ts`: save 62, `PRE_EVENTS_III_CONTENT_HASH`, the
  v61 schema and branch, v60 envelopes re-sealed under the new pack; version
  plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- Tests: the content tests (frozen seal, counts, one chain), the
  hearth-event cadence test counting only drawn offers (a chain's follow-up
  and a crisis's own event are given, not drawn) and its lapse test waiting
  for a template the frozen rules know, the epoch test's gated list, a second
  journey in `tests/gameplay/hearth-events.spec.ts` answering the lost
  ledger; the chronicle pin moved and attributed.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,355 tests / 296 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **386 / 305 / 214**, all Prosperity; one refused survey order on each pace at turn 68, the recorded same-batch race ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 390 / 362, Long 295 / 282, Standard 183 / 202, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 336, chronicle Epic 440, Long 289, Standard 197, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth events (two, one new) | 2 passed in 6 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed, the pin moved 54 → 53 and attributed ([log](browser-chronicles.log), [attribution](chronicle-expectation.md), [replay](chronicle-replay.txt)) |

## Known limits

- Seventy-five templates against the scope's one hundred and fifty.
