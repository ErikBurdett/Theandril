# The goods a client city-state sends (rules/save 60) — 2026-10-31

Design: [ADR 0090](../../architecture/0090-city-state-trade.md).

## What changed

- `packages/content/src/city-state-trade.ts`: twenty-four trades, one per
  city-state, each a resource and an amount; `cityStateTradeFor`,
  `cityStateTradeForRules`, `validateCityStateTradeContent` (every
  city-state, a known resource, no duplicate). The pack hash seals the table
  from rules 60; frozen seals pass none; `validateContent` counts it.
- `packages/sim/src/clients.ts`: `clientGoodsOf`, the delivery on each paid
  tribute (`deliverGoods`), the promise said as the bond is sworn
  (`goodsPromised`, by acceptance and under a subject rule);
  `diplomacy.ts`: the observation's `clientGoods`. `save.ts`: save 60,
  `PRE_TRADE_GOODS_CONTENT_HASH`, the v59 schema and branch; version
  plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `packages/ai/src/diplomacy.ts`: a city-state whose good the realm holds
  fewer than six of is courted first.
- `apps/web/src/diplomacy.tsx`: the patron's oath line names the goods.
- Tests: the content tests (twenty-four trades, validation, the frozen
  seal), `packages/sim/src/clients.test.ts` (the promise, the observation,
  the delivery on a paid tribute and none on a missed one, none for a realm
  client, none under rules 59), a third journey in
  `tests/gameplay/guarantee.spec.ts` (the goods in Realm affairs and the
  journal), the private-diplomacy expectation carrying the empty list.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,351 tests / 294 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **395 / 302 / 203**, identical to rules 59: the headline seats no city-states ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 338 / 338, Long 268 / 287, Standard 185 / 199, identical to rules 59 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 431, Long 302, Standard 181, identical to rules 59 ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [goods-probe.ts](goods-probe.ts), Epic headline with six city-states seated | **thirty bonds with city-states sworn**, their goods promised; the course ends on 391 ([txt](goods-probe-epic-citystates.txt); [without city-states](goods-probe-epic.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: guarantee (three, one new), diplomacy | 7 passed in 16 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 54 unmoved ([log](browser-chronicles.log)) |

## Known limits

- A good is a flat amount per paid tribute, not a share of the city-state's
  works; no market, no price, no trade between realms. The wider roster of
  independent powers remains unbuilt.
