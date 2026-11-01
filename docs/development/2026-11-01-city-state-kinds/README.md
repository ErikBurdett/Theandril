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
| `pnpm test:unit` | UNIT_ROW ([log](tests-unit.log)) |
| `pnpm test:campaigns` | CAMPAIGNS_ROW ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | PACING_HEADLINE_ROW ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | PACING_SEEDS_ROW ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | PACING_PROXIES_ROW ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | BUILD_ROW ([log](build.log)) |
| covering journeys: hires, tribute | JOURNEYS_ROW ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | CHRONICLES_ROW ([log](browser-chronicles.log)) |

## Known limits

- A kind changes prices and companies only: no raids, no wandering camp, no
  clan feud. The wider relations of the roster remain unbuilt.
