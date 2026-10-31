# Campaign epochs (rules/save 49) — 2026-10-31

Design: [ADR 0079](../../architecture/0079-campaign-epochs.md).

## What changed

- `packages/content/src/epochs.ts`: `EPOCHS` (Fracture, Roads, Seams, Bids),
  condition schema (`start`, `hearths` with a per-pace turn, `seamFound` with
  a per-pace turn, `projectStarted`), `epochsForRules`, `epochIndexOf`,
  `validateEpochContent`; the pack hash seals the ages (`epochs` parameter),
  localization and `validateContent` count them.
- `packages/content/src/events.ts`: an optional `epoch` on a template, six
  templates of the ages (`sinceRules: 49`); validation refuses an age on an
  earlier template, an unknown age and the first age.
- `packages/sim/src/epochs.ts`: `epochConditionHolds`, `epochIndex` and
  `epochId` derived from the world, `announceEpochs`, `observeEpoch`.
  `simulation.ts` announces the ages each command brings and carries the age
  in the observation; `hearth-events.ts` gates templates by age.
  `packages/chronicle`: a turn in which an age begins is titled after it.
  `save.ts`: save 49, `PRE_EPOCHS_CONTENT_HASH` `4847de40`, v48 envelopes
  load unchanged; version plumbing in `rules.ts`, `simulation.ts`, chronicle,
  persistence and `scripts/measure-pacing.ts`. No canonical field.
- `apps/web/src/main.tsx`: the masthead names the world's age.
- Tests: `packages/sim/src/epochs.test.ts` (reads the age from the world,
  enters every age whose condition holds, announces each to every realm as it
  happens, never goes back; a razed hearth leaves the age where it was; the
  events of the ages are gated; no field in the save and a v48 envelope reads
  the same age), `packages/content/src/content.test.ts` (frozen `4847de40`,
  the catalogue and its validation), `packages/chronicle/src/chronicle.test.ts`
  (the bounded feed carries the four ages that begin for two realms),
  `tests/gameplay/epochs.spec.ts` (the masthead and the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,335 tests / 289 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **419 / 293 / 211** (Prosperity / Attunement / Prosperity), 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 352 / 340, Long 270 / 274, Standard 193 / 193, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)); the three-seed Epic mean is 370 |
| proxies | Epic 333, chronicle Epic 365, Long 294, Standard 189, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: epochs (new), hearth-events, attunement, diplomacy | 9 passed in 16 s ([log](browser-covering.log); the masthead in `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 55 unmoved ([log](browser-chronicles.log)) |

## Known limits

- The Epic headline course ends on 419, nineteen turns above its band, while
  the two other Epic seeds end inside it; recorded as a drift of one course,
  not re-priced (ADR 0079).
- Four ages; their consequences are events and chapter titles. Crises,
  migration and collapse remain unbuilt.
- The first design kept the age as canonical state and was replaced by the
  derived reading; the evidence logs are from the final code.
