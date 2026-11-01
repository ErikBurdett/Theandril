# Taxes (rules/save 70) — 2026-11-01

Design: [ADR 0101](../../architecture/0101-taxes.md).

## What changed

- `packages/sim/src/taxes.ts`: the register, `taxRateOf`, `taxedCoin`, the
  drift table, `setTaxRate` with its blockers (rules, a city-state, the
  same rate), `observeTaxes`, validation. `simulation.ts`: the command, the
  register, the observation; the hearth's coin taxed last in
  `settlementYields`; the lanes' mending adjusted by the rate each turn a
  hearth is not besieged. `save.ts`: save 70, the register appended last,
  stripped for older seals, refused under earlier rules, given to older
  envelopes empty; version plumbing in `rules.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`; the sim index exports the module.
- `packages/ai/src/taxes.ts`: heavy when short, lean when rich and scarred,
  steady otherwise; `index.ts` issues the change beside the hire.
- `apps/web/src/taxes.tsx`: the Taxes section of Realm affairs.
- Tests: `packages/sim/src/taxes.test.ts` (the three shares of coin, the
  mending under heavy and lean taxes, the observation, setting once,
  steady clearing the record, a city-state kept steady, validation; nothing
  under rules 69; sealing refused with a rate; a v69 envelope loads with
  steady taxes), `packages/ai/src/taxes.test.ts`,
  `tests/gameplay/taxes.spec.ts` (set heavy from Realm affairs, read the
  sentence and the journal); the forged v38 envelope in
  `features-in-sight.test.ts` and the synthetic projection in
  `save.test.ts` strip the register.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,373 tests / 306 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **388 / 296 / 198**, all Prosperity or Attunement, 0 refused orders (Epic 380 → 388 and Standard 197 → 198 against rules 69; Long unchanged) ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 345 / 344, Long 309 / 286, Standard 191 / 196, 0 refused orders; the two Epic courses rise from 344 / 336 to just under the 350–400 band, Long seed 20260906 returns to 309 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 370, chronicle Epic 478, Long 293, Standard 207, within the proxy bounds (the campaigns project passed on them) ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: taxes (new), tribute | 2 passed in 6.2 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 69 and 70 issuing the same 916 commands (no realm of that campaign ran short enough to change its taxes) ([log](browser-chronicles.log)) |

## Known limits

- Taxes touch coin and devastation only: no unrest, no legitimacy, no
  per-hearth rate, no tariff on trade. Recurring trade routes, resource
  processing and the wider economic policy remain unbuilt.
