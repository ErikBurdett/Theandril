# Landmarks (rules/save 51) — 2026-10-31

Design: [ADR 0081](../../architecture/0081-landmarks.md).

## What changed

- `packages/content/src/landmarks.ts`: twelve original landmark kinds (the
  Witness Stair, the Drowned Causeway, the First Kiln, the Glass Orchard, the
  Hollow Oak, the Salt Stair, the Ash Cairn, the Silent Mill, the Lanternwood,
  the Tide Bell, the Old Boundary, the Ember Spring) with terrains, a coastal
  flag and a yield each; `landmarkKindsForRules`, `landmarkKind`,
  `validateLandmarkContent`. The pack hash seals them from rules 51; frozen
  seals pass none; localization and the content count carry them.
- `packages/sim/src/landmarks.ts`: `landmarks(world)`, the seeded, cached
  placement; `landmarkAt`; `landmarkYieldAt` (rules 51 and later);
  `observeLandmarks` over explored ground. `territory.ts` adds the landmark's
  yield to the hex's features. `types.ts`: `Observation.landmarks`.
- `save.ts`: save 51, `PRE_LANDMARKS_CONTENT_HASH`, the v50 schema and branch;
  version plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`.
- `apps/web/src/map-management.tsx`: the hex inspector names the landmark with
  its story and yield; the settlement summary lists the landmarks a hearth
  holds.
- Tests: `packages/sim/src/landmarks.test.ts` (placement is seeded and
  stable, away from starts and seams; the yield reaches a working hearth from
  rules 51 and not before; explored landmarks are observed), content tests
  (frozen hash `5b9864d4`, twelve kinds, validation), version pins in the
  attunement and hearth-event tests, `tests/gameplay/landmarks.spec.ts`
  (select a landmark hex and read its name, story and yield in the inspector).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,342 tests / 292 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **413 / 320 / 216**, Attunement / Prosperity / Prosperity, 0 refused orders ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 379 / 332, Long 260 / 284, Standard 197 / 201, 0 refused orders ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 314, chronicle Epic 424, Long 309, Standard 189, all Prosperity, within bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: landmarks (new), map actions, attunement | 6 passed in 14 s ([log](browser-covering.log); the inspector screenshot under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 55 unmoved ([log](browser-chronicles.log)) |

The Epic headline course ends on 413, above its 350–400 band, as it did under
rules 49 (419) and rules 50 (359, in band); the two other Epic seeds end on
379 and 332, inside it, and the Long and Standard courses of every seed are in
band. The judgement recorded under rules 49 stands: a drift of one course,
read against the three-seed matrix, not a change to re-price.

## Known limits

- Landmarks yield and are read; they have no events, rewards, intelligence or
  faction interactions, and the AI does not seek them.
- Twelve kinds against the scope's landmark count; the catalogue is a first
  slice.
