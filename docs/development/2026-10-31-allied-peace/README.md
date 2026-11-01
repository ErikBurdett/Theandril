# Allied peace (rules/save 56) — 2026-10-31

Design: [ADR 0086](../../architecture/0086-allied-peace.md).

## What changed

- `packages/sim/src/alliances.ts`: the `calls` register (`allyId`,
  `attackerId`, `partnerId`, `turn`), recorded in `callAllies` from rules
  56; `alliedPeace` — an ally's own peace releases its call, and the
  partner's peace ends every called ally's war with the same truce and no
  coin, its offers lapsing, all three parties told (`allied_peace`);
  `assertNoAllianceCalls`; the calls validated; the observation lists a
  realm's calls. `simulation.ts`: the accepted peace settles the calls
  around it; `siege.ts`: so does the peace a subject rule imposes.
  `save.ts`: save 56, the calls appended to the register, stripped for
  older seals, refused under earlier rules, given to older envelopes empty;
  version plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `apps/web/src/diplomacy.tsx`: the Allies section names who entered whose
  war and that a peace ends it.
- Tests: `packages/sim/src/alliances.test.ts` (the call recorded and
  observed; the partner's peace ends the ally's war with the same truce;
  the ally's own peace releases its call; nothing under rules 55; a
  campaign with a call refused under older rules; a v55 envelope loads
  with none), `tests/gameplay/allied-peace.spec.ts` (the call read in Realm
  affairs, the peace accepted, the ally's leaving in the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,348 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **418 / 295 / 211**, Prosperity / Attunement / Attunement, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 347 / 305, Long 296 / 246, Standard 209 / 185, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 353, chronicle Epic 468, Long 323, Standard 204, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [allied-peace-probe.ts](allied-peace-probe.ts), Epic and Long headline | Epic: 23 calls answered, **13 allied peaces**; Long: 12 and **8** ([epic](allied-peace-probe-epic.txt), [long](allied-peace-probe-long.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: allied peace (new), alliances, diplomacy | 7 passed ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved ([log](browser-chronicles.log)) |

## Known limits

- An ally leaves with its partner's peace whatever its own reasons for the
  war; there is no way to stay in. Guarantees, passage rights and joint war
  aims remain unbuilt.
- The Epic headline course ends on 418, above its band, with the other Epic
  seeds below it; the spread of the measured world stands as recorded under
  rules 54.
