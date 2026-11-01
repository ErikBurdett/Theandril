# Pressing a city-state for tribute (rules/save 61) — 2026-10-31

Design: [ADR 0091](../../architecture/0091-tribute-demands.md).

## What changed

- `packages/sim/src/demands.ts`: the register, `demandTribute` with its
  blockers (a city-state at peace, no bond, a land company at the gate, the
  twenty-turn cooldown), the weighing of the company against the walls'
  garrison, the sum a city pays, the memory either way, the quotes and the
  observation, validation. `simulation.ts`: the command, the new-game
  register, the observation. `save.ts`: save 61, the register appended last,
  stripped for older seals, refused under earlier rules, given to older
  envelopes empty; version plumbing in `rules.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`.
- `packages/ai/src/demands.ts`: `planDemand`; `index.ts` issues it beside
  the turn's diplomacy; `diplomacy.ts`: a pressed city-state refuses the
  realm's patronage for forty turns.
- `apps/web/src/diplomacy.tsx`: the quote and the demand on a city-state's
  row.
- Tests: `packages/sim/src/demands.test.ts` (paid, refused, remembered,
  quoted, the cooldown; every blocker; nothing under rules 60; sealing
  refused with a demand; a v60 envelope loads with none),
  `packages/ai/src/demands.test.ts`, `tests/gameplay/tribute.spec.ts` (the
  quote, the demand, the coin, the journal); synthetic legacy envelopes
  strip the register.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,354 tests / 296 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **395 / 302 / 203**, identical to rules 60: the headline seats no city-states ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 338 / 338, Long 268 / 287, Standard 185 / 199, identical ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 307, chronicle Epic 431, Long 302, Standard 181, identical ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| [tribute-probe.ts](tribute-probe.ts), the headline seed with six city-states | Epic: **2 demands paid, 4 refused**, 18 bonds with city-states, ends on 347; Long: 3 and 3, 13 bonds, ends on 266 ([epic](tribute-probe-epic-citystates.txt), [long](tribute-probe-long-citystates.txt)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: tribute (new), diplomacy | 6 passed in 15 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 22 s, the pin at 54 unmoved ([log](browser-chronicles.log)) |

## Known limits

- The walls are only the companies on the hearth; fortifications do not
  count. A refused demand costs the realm nothing but the city's trust.
  Mercenary contracts, raiding and the wider roster remain unbuilt.
