# The migration a crisis leaves behind (rules/save 55) — 2026-10-31

Design: [ADR 0085](../../architecture/0085-crisis-migration.md).

## What changed

- `packages/sim/src/crises.ts`: `migrateAfterCrisis` on the end of a crisis
  — every hearth of three or more whose realm did not shelter loses one
  household to the nearest sheltered hearth within twelve hexes, the worked
  land trimmed with it, both realms told (`crisis_migration`);
  `MIGRATION_MIN_POPULATION`, `MIGRATION_RANGE`; the observation names the
  sheltered realms from rules 55. `save.ts`: save 55, the v54 schema and
  branch under the same pack; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `packages/ai/src/crises.ts`: the toll still to come counts a household
  for every hearth of three or more with a known sheltered hearth of another
  realm within range.
- `apps/web/src/crises.tsx`: the card says how many realms have sheltered
  and what the crisis's passing will take.
- Tests: `packages/sim/src/crises.test.ts` (a rival hearth founded within
  range of the player's: the household crosses, the far capital and a
  hearth of two keep theirs, nothing moves with no shelter or under rules
  54, a v54 envelope loads unchanged), `packages/ai/src/crises.test.ts`
  (the risk counted only with a known haven in range), a third journey in
  `tests/gameplay/crises.spec.ts` (the card's line, the crisis passing on
  End turn, the crossing in the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,347 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **408 / 275 / 215**, all Attunement, 0 refused orders, identical to rules 54 ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 344 / 313, Long 308 / 246, Standard 211 / 176, identical to rules 54 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 353, chronicle Epic 448, Long 323, Standard 204, identical to rules 54 ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [crisis-probe.ts](crisis-probe.ts), Epic and Long headline | Epic: 25 shelters, **8 households cross**; Long: 25 shelters, **7 cross** ([epic](crisis-probe-epic.txt), [long](crisis-probe-long.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: crises (three, one new), hearth events | 4 passed in 11 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 22 s, the pin at 56 unmoved ([log](browser-chronicles.log)) |

## What was measured and replaced

The AI's first valuation counted every hearth of three or more at risk once
any realm had sheltered. Every realm sheltered every crisis (36 of 36
realm-crises on the Epic headline), no household crossed, and the Epic
headline ended on 451. A campaign test also found a hearth working more
land than it had people after a crossing. Both were corrected before the
measurements above.

## Known limits

- Households cross only at a crisis's end, only to another realm's
  sheltered hearth, only within twelve hexes; no hearth is abandoned and no
  one moves within a realm. Collapse and regional crises remain unbuilt.
