# Unrest in the hearths (rules/save 71) — 2026-11-01

Design: [ADR 0102](../../architecture/0102-unrest.md).

## What changed

- `packages/sim/src/unrest.ts`: the register, `unrestOf`, the pressures
  (heavy taxes, occupation, devastation at fifty, lean taxes easing),
  `advanceUnrest` with the riot, `unrestHalvesIndustry`, `observeUnrest`,
  validation. `simulation.ts`: the register, the observation, the turn's
  unrest after the lanes mend, the halved industry last in
  `settlementYields`. `save.ts`: save 71, the register appended last,
  stripped for older seals, refused under earlier rules, given to older
  envelopes empty; version plumbing in `rules.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`; the sim index exports the module.
- `packages/ai/src/taxes.ts`: no heavy taxes at forty unrest; lean taxes at
  sixty with a hundred and fifty coin.
- `apps/web/src/siege.tsx`: the condition panel's unrest line with its
  pressures and the halved industry.
- Tests: `packages/sim/src/unrest.test.ts` (the pressures and their sum,
  the turn, the observation, the halved industry, the riot, lean easing,
  the record clearing, a besieged hearth standing still, validation;
  nothing under rules 70; sealing refused with unrest; a v70 envelope loads
  with none), the AI tax test (restraint and easing),
  `tests/gameplay/unrest.spec.ts` (the condition panel of a restless
  hearth); the forged v38 envelope in `features-in-sight.test.ts` and the
  synthetic projection in `save.test.ts` strip the register.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,375 tests / 307 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **388 / 296 / 198**, identical to rules 70 on every headline course, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 339 / 344, Long 283 / 286, Standard 191 / 196, 0 refused orders (Epic seed 20260906 345 → 339 and Long seed 20260906 309 → 283 against rules 70; the two Epic courses stay just under the 350–400 band) ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 370, chronicle Epic 478, Long 305, Standard 207, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: unrest (new), taxes, conquest | 5 passed in 20 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 24 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 70 and 71 issuing the same 916 commands ([log](browser-chronicles.log)) |

## Known limits

- Unrest knows three pressures and two consequences: no founder culture
  against the ruler, no legitimacy, no secession, no rebels on the map.
