# Cavalry wings (rules/save 76) — 2026-11-01

Design: [ADR 0108](../../architecture/0108-cavalry-wings.md).

## What changed

- `packages/sim/src/deployment.ts`: the `wings` doctrine, its name and text,
  the mounted test (movement four or more, no reach), the rank-by-rank
  arrangement with the outer columns first, `assertNoWings`, a rules 75
  reading of the line, validation. `save.ts`: save 76, the value on the army
  schema, the v75 branch refusing the wings, sealing refused with wings.
  Version plumbing in `rules.ts`, `simulation.ts`, chronicle, persistence
  and `scripts/measure-pacing.ts`; the select in the army panel lists the
  fifth doctrine from the same table.
- Tests: `packages/sim/src/deployment.test.ts` (the wings' order and front
  rank, nothing under rules 75, sealing refused, a v75 envelope naming the
  wings refused); the deployment journey covers the panel.

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,380 tests / 310 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **329 / 301 / 219**, identical to rules 75 on every course (no AI realm sets a doctrine), 0 refused orders; the headline Epic drift stands as surveyed ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 355 / 383, Long 286 / 315, Standard 194 / 204, identical to rules 75 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 379, chronicle Epic 461, Long 353, Standard 209, identical to rules 75, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: deployment | 1 passed in 4 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 23 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 75 and 76 issuing the same 916 commands ([log](browser-chronicles.log)) |

## Known limits

- One kind of company chooses its columns; no per-formation placement or
  reserve line, and the AI keeps the line.
