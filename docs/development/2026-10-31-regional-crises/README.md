# Regional crises (rules/save 59) — 2026-10-31

Design: [ADR 0089](../../architecture/0089-regional-crises.md).

## What changed

- `packages/content/src/crises.ts`: `scope: 'region'` and `radius` from
  rules 59; three regional crises, one per later age — the Valley Blight,
  the Glass Storm, the Bread Riots; `crisesForRules`, `crisisIsRegional`;
  validation pairs the scope and the radius and keeps regional crises to
  rules 59. `events.ts`: their three events (seed from the next valley,
  glass in the thatch, the granary doors); sixty templates; the rules 57–58
  pack (`0eed2d1a`) is frozen.
- `packages/sim/src/crises.ts`: the standing crisis's optional `center`;
  `crisisReaches`, `affectedHearths`; the toll, the shelter quote and its
  blocker, the migration and the observation (centre, radius, the hearth
  it is centred on, the realm's reached hearths) read the reach; the draw
  centres a regional crisis on one of the world's hearths from the seed and
  keeps regional crises out of a world without one; `hearth-events.ts`
  offers a crisis's event at a hearth it reaches; `validateCrises` pairs
  the centre with the crisis. `save.ts`: save 59,
  `PRE_REGIONAL_CRISES_CONTENT_HASH`, the v58 schema and branch, a regional
  crisis refused under earlier rules; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `packages/ai/src/crises.ts`: only reached hearths count at risk of
  migration. `apps/web/src/crises.tsx`: the card names the centre and the
  radius and how many of the realm's hearths lie within.
- Tests: the content tests (nine crises, sixty events, the pairing, the
  frozen seal), `packages/sim/src/crises.test.ts` (reach, quote, toll,
  blocker, migration and the sealed reading of a regional crisis; a first
  regional draw offering its event only to the realms it reaches; the
  centre validated against the crisis), `packages/ai/src/crises.test.ts`,
  a fourth journey in `tests/gameplay/crises.spec.ts` (the centre, the
  radius and the reach on the card).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,350 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **395 / 302 / 203**, all Prosperity, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 338 / 338, Long 268 / 287, Standard 185 / 199, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 431, Long 302, Standard 181, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [crisis-probe.ts](crisis-probe.ts), the Epic course of each seed | headline: the Valley Blight (26–32) and the Glass Storm (45–49), then the Fever of the End; seed 20260906: the Valley Blight and the Tremors; seed 20260907: the Toll Wars and the Glass Fever ([05](crisis-probe-epic-20260905.txt), [06](crisis-probe-epic-20260906.txt), [07](crisis-probe-epic-20260907.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: crises (four, one new), hearth events | 5 passed in 13 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 54 unmoved ([log](browser-chronicles.log)) |

## Known limits

- A regional crisis is centred on a hearth, never on a seam, a landmark or
  a coast; its radius is fixed. Collapse remains unbuilt.
