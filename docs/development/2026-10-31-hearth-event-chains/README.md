# Hearth event chains (rules/save 48) — 2026-10-31

Design: [ADR 0078](../../architecture/0078-hearth-event-chains.md).

## What changed

- `packages/content/src/events.ts`: `followUp` on an answer, the `chained`
  condition, `THIRD_BATCH` (nine templates in three chains, `sinceRules: 48`),
  `hearthEventTemplate`; validation of follow-ups and chained reachability.
- `packages/sim/src/hearth-events.ts`: `settle` applies an answer and schedules
  its follow-up (`turn` ahead, `chainedFrom`); scheduled events are offered
  on their turn with the event they follow named, are unseen and unanswerable
  before it, and hold the realm's slot; validation bounds the lead. `save.ts`:
  save 48, `PRE_CHAINS_CONTENT_HASH` `c1e05b8e`, v47 envelopes load
  unchanged; version plumbing in `rules.ts`, `simulation.ts`, chronicle,
  persistence and `scripts/measure-pacing.ts`.
- `packages/ai/src/hearth-events.ts`: discounted two-step lookahead through
  follow-ups. `apps/web/src/hearth-events.tsx`: "following …" and "then,
  after N turns: …".
- `tests/gameplay/chronicles.spec.ts`: the pinned victory turn is 55
  ([attribution](chronicle-expectation.md)).
- Tests: `packages/sim/src/hearth-events.test.ts` (scheduling, hidden until
  its turn, offered with its origin, answered, lapsed and chained on, never
  drawn, sealing refused as v47, v47 round trip, validation of an orphan
  ahead), `packages/content/src/content.test.ts` (frozen `c1e05b8e`, counts,
  follow-up rules), `packages/ai/src/hearth-events.test.ts` (levees raised,
  lanes closed), `apps/web/src/hearth-events.test.tsx` (chained wording).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,331 tests / 288 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **385 / 306 / 211**, all Prosperity, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| proxies | Epic 345, chronicle Epic 469, Long 311, Standard 193, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hearth-events, attunement, diplomacy | 8 passed in 15 s ([log](browser-covering.log)) |
| `@scale` chronicles journey, alone | first run failed at the pinned turn (56 → 55), attributed headlessly ([note](chronicle-expectation.md), [replay](chronicle-replay.txt)); 1 passed in 23 s with the pin at 55 ([log](browser-chronicles.log)) |

## Known limits

- Three chains of three; the lead is at most ten turns; a chain is one slot,
  so a realm in a chain is drawn for nothing else until it ends.
- The AI's lookahead is two steps and reads the catalogue, not the hearth's
  future; it does not weigh the chance of answering later with more coin.
- Epochs and world crises remain unbuilt.
