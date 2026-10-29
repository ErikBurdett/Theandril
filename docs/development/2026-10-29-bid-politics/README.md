# A unification bid lost to politics — 2026-10-29

Local checkpoint; nothing in this packet is published. No rules, save, content
or price change: the pledge rule is rules 22 and the bid rule is rules 19–21.

## What was built

- `packages/ai/src/diplomacy.ts`: `answerPatronage` renounces an oath whose
  patron holds a public, active Unification bid (lawfully after the term,
  otherwise as a breach), and refuses a new patronage offer from a bidding realm.
  The reasons name the bid. Nothing else in the planner changed.
- `apps/web/src/progression.tsx`: the Unification section says pledged hearths
  stand behind a bid only while the oath holds.
- `packages/sim/src/unification.test.ts`: a bid carried by three pledged hearths
  opens, survives the renunciation until the round closes, then ends with the
  existing majority-lost reason; exact save round trip.
- `packages/ai/src/diplomacy.test.ts`: acceptance before a bid, renunciation
  leading the whole turn plan once the bid is public, refusal afterwards, with
  an unchanged observation.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([lint log](lint.log)) |
| `pnpm test:unit` | 2,283 tests / 278 files pass ([log](tests-unit.log)) |
| `pnpm measure:pacing headline headline-standard headline-long` | **219 / 329 / 374**, 0 refused; command and event counts identical to the subject-rule runs — no headline realm opened a bid, so no renunciation occurred ([log](pacing-after.log), [json](pacing-after.json)) |
| `tests/gameplay/diplomacy.spec.ts`, `attunement.spec.ts` | 7 passed ([log](browser.log)) |

## Limits

The AI renounces whenever its patron bids, whether or not its hearths are the
margin, because a client's observation does not see the patron's full hearth
count through fog; the bid itself is public. A patron receives no advance
warning beyond the public ledger and the ordinary oath events.
