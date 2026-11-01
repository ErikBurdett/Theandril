# Four kinds of city-state (rules/save 77) — 2026-11-01

Design: [ADR 0109](../../architecture/0109-city-state-kinds.md).

## What changed

- `packages/content/src/city-state-kinds.ts`: the four kind definitions
  (name, description, company, hire and tribute percentages) and the table
  giving every city-state a kind, sealed from rules 77; `cityStateKindFor`,
  `cityStateKindsForRules`, validation (every city-state has a kind, every
  kind a city-state). `index.ts`: the pack hash takes the kinds; frozen
  seals pass none; localization carries the kind names.
- `packages/sim/src/hires.ts`: `cityStateKindOf`, `hiredUnitOf`, the price
  by kind, the hired company raised of the kind's unit and named for it,
  the quote's `unitId`, and `kinds` on the observation for every city-state
  in sight. `demands.ts`: the tribute by kind. `save.ts`: save 77,
  `PRE_KINDS_CONTENT_HASH`, the v76 branch, the v74 and v75 branches
  reading the frozen pack; version plumbing in `rules.ts`,
  `simulation.ts`, chronicle, persistence and `scripts/measure-pacing.ts`.
- `apps/web/src/diplomacy.tsx`: the kind beside the city-state badge; the
  hire quote names the company.
- Tests: the content tests (frozen seal, forty-eight kinds, the four
  definitions, validation), the hire test (price and company by kind, the
  observation's kinds, rules 76 reading none), the hires journey reading
  the quoted company; the sim version pins and the frozen seals of the
  rules 74–76 tests.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,380 tests / 310 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **329 / 301 / 219**, identical to rules 76 (the headline campaigns seat no city-states), 0 refused orders; the headline Epic drift stands as surveyed ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 355 / 383, Long 286 / 315, Standard 194 / 204, identical to rules 76 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 379, chronicle Epic 461, Long 353, Standard 209, identical to rules 76, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: hires, tribute | 2 passed in 6 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 76 and 77 issuing the same 916 commands ([log](browser-chronicles.log)) |

## What the tests found first

The hire test’s expected quote lacked the company the quote now names, the
city-state’s own observation gained its kind, and the AI tribute test’s
city-state, drawn from the whole roster, was a clanhold whose half tribute
fell under the AI’s twenty-coin minimum; its hearth is grown to four
households so the quote clears the minimum whatever kind is drawn. The
slice’s first commit (`d369bfc`) went out with the hire test still failing
and the packet’s figures unfilled, because the commit was not gated on the
unit run; this follow-up commit carries the fix and the figures, and the
readback is taken against it.

## Known limits

- A kind changes prices and companies only: no raids, no wandering camp, no
  clan feud. The wider relations of the roster remain unbuilt.
