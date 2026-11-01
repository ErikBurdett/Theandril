# Companies hired from city-states (rules/save 68) — 2026-11-01

Design: [ADR 0099](../../architecture/0099-hired-companies.md).

## What changed

- `packages/sim/src/hires.ts`: the register; `hirePriceOf` (thirty coin and
  four per population); `hireBlocker` (rules, a realm not a city-state, a
  city-state at peace and not besieged, an own land company at the gate,
  the ten-turn cooldown, the coin); `hireCompany` raising a company of Ash
  pike at the gate through the campaign's army raiser with no movement
  this turn, moving the coin, warming the city's trust and recording the
  sale; `observeHires` quotes and records; validation. `simulation.ts`:
  the command, the register, the observation, `addArmy` passed in.
  `save.ts`: save 68, the register appended last, stripped for older
  seals, refused under earlier rules, given to older envelopes empty; the
  pack unchanged, so v67 envelopes carry the current hash; version
  plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`; the sim index exports the module.
- `packages/ai/src/hires.ts`: a realm at war hires the cheapest open quote
  once a turn when it keeps sixty coin after the purchase; `index.ts`
  issues it beside the tribute demand.
- `apps/web/src/diplomacy.tsx`: the hire quote and button beside the
  tribute demand for every city-state met.
- Tests: `packages/sim/src/hires.test.ts` (sold at the gate for the price,
  raised beside the buyer, the coin moved, the sale remembered and quoted,
  the cooldown, refused unpaid, by a city-state, of a realm, when
  besieging; validated; nothing under rules 67; sealing refused with a
  hire; a v67 envelope loads with none), `packages/ai/src/hires.test.ts`,
  `tests/gameplay/hires.spec.ts` (hire from Realm affairs, read the coin,
  the registry and the journal); the forged v38 envelope in
  `features-in-sight.test.ts` and the synthetic projection in
  `save.test.ts` strip the register.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,368 tests / 303 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **380 / 296 / 197**, identical to rules 67 on every course, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 344 / 336, Long 276 / 266, Standard 190 / 191, identical to rules 67; the two Epic courses sit just under the 350–400 band as recorded since the fourth catalogue ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 327, chronicle Epic 476, Long 301, Standard 201, identical to rules 67, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hires (new), tribute | 2 passed in 4.7 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 67 and 68 issuing the same 916 commands, with no hire in that campaign ([log](browser-chronicles.log)) |

## What the tests found first

The roadmap bullet first landed in the empty `delivered` list of the online
campaigns item, two items below the one it belongs to; typecheck refused the
hole it left and the bullet was moved before the commit. The two hire tests
first named the city-state by its hearth, Gate City, where the simulation
names the faction, and the sim test tried to besiege without a war; both
read the campaign now.

## Known limits

- One company kind at one price formula; no contracts that outlast the
  sale, no mercenary bands on the map, no hire at another realm's hearth.
  The wider roster of clans, pirates, cults and nomads remains unbuilt.
