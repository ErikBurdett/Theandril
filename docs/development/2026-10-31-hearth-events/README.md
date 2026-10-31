# Hearth events (rules/save 46), and ferry landings on the ferry's own water — 2026-10-31

Design: [ADR 0075](../../architecture/0075-hearth-events.md) (events) and
[ADR 0076](../../architecture/0076-ferry-landings-on-own-water.md) (AI only,
found by this slice's tests).

## What changed

- `packages/content/src/events.ts`: `HEARTH_EVENTS` (eight original templates),
  schemas, `hearthEventsForRules`, `HEARTH_EVENT_FIRST_TURN` 40,
  `HEARTH_EVENT_INTERVAL` 10, `HEARTH_EVENT_CHANCE_PERCENT` 35,
  `HEARTH_EVENT_ANSWER_TURNS` 5, `validateHearthEventContent`; the pack hash
  seals the events (`contentPackHash(…, events)`), localization and
  `validateContent` count them.
- `packages/sim/src/hearth-events.ts`: the register, `advanceHearthEvents`
  (lapse, then one bounded draw per realm per turn from a seeded stream keyed
  by seed, turn and seat), `resolveHearthEvent`, `hearthEventChoiceBlocker`,
  `observeHearthEvents`, `validateHearthEvents`, `assertNoHearthEvents`.
  Wired in `simulation.ts` (command schema from rules 46, command branch,
  `resolveTurn` after progression, observation), `types.ts`, `save.ts` (save
  46, `PRE_EVENTS_CONTENT_HASH` `1f0c41ca`, `stateV45Schema`, the legacy
  parser upgraded through `parseSaveThrough45` and then given the register,
  hash payload and sealing refusal under older versions), `rules.ts`, the
  chronicle and persistence version lists, `scripts/measure-pacing.ts`.
- `packages/ai/src/hearth-events.ts`: `planHearthEvents` answers open choices by
  quoted value; `index.ts` plans it first and takes its cost off the purse.
- `packages/ai/src/naval.ts`: landings whose water is known to lie in a
  separate basin from the ferry's are not ranked (ADR 0076).
- `apps/web/src/hearth-events.tsx`: the Realm affairs panel; `main.tsx` mounts
  it and counts pending events in the Diplomacy badge.
- Tests: `packages/sim/src/hearth-events.test.ts` (determinism, independence
  per realm and turn, interval, nothing under historical rules; answer effects,
  foreign and unknown answers refused, unaffordable answers blocked, lapse
  takes the first affordable answer; conditions from canonical state;
  save round trip, v45 envelope upgrade, older hashes blind, sealing refused),
  `packages/ai/src/hearth-events.test.ts`, `apps/web/src/hearth-events.test.tsx`,
  `packages/content/src/content.test.ts` (frozen hash, catalogue validation),
  `tests/gameplay/hearth-events.spec.ts` (answer from Realm affairs, treasury
  and journal). `save.test.ts` and `features-in-sight.test.ts` strip the new
  register from their synthetic legacy envelopes; two chronicle continuation
  tests filter event offers from pinned modern end-turn events.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,329 tests / 288 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **393 / 301 / 210**, all Attunement, 0 refusals ([log](pacing-after.log), [json](pacing-after.json)) |
| proxies | Epic 385, chronicle Epic 412, Long 270, Standard 182, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth-events (new), diplomacy, attunement | 8 passed in 16 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s ([log](browser-chronicles.log)) |

## Known limits

- Eight templates; the scope asks for one hundred and fifty. No epochs,
  escalation, crises with prevention and recovery, migration or collapse.
- Effects are confined to five existing fields; nothing an event does cannot
  already happen by other means.
- The AI's valuation is a fixed weighting; it does not look past the turn.
- Pacing is measured on the headline seed only.
