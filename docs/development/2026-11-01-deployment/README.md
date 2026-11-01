# Army deployment (rules/save 75) — 2026-11-01

Design: [ADR 0107](../../architecture/0107-deployment.md).

## What changed

- `packages/sim/src/deployment.ts`: the four doctrines with their names and
  text, `arrangedFormations` (by doctrine, then by id), `frontRank`,
  `setDeployment` with its blockers (rules, an own army, a fleet, a
  standing battle, the same doctrine), validation. `warfare.ts`: a battle
  with a doctrined army draws the armies up in id order, each by its
  doctrine; otherwise as before. `army-composition.ts`: the army view's
  `doctrine` and `frontRank`; foreign armies read the line. `simulation.ts`:
  the command. `save.ts`: save 75, the optional field on the current army
  schema, earlier envelopes refusing it, sealing refused with a doctrine;
  version plumbing in `rules.ts`, chronicle, persistence and
  `scripts/measure-pacing.ts`; the sim index exports the module.
- `apps/web/src/army.tsx`: the Deployment select and the front-rank quote
  in the composition panel.
- Tests: `packages/sim/src/deployment.test.ts` (the four orders, the
  quote, the event, the doctrine kept and cleared, a real battle placing
  the cohort in the front rank, the standing-battle blocker, validation;
  nothing under rules 74; sealing refused; a v74 envelope loads with the
  line and refuses a doctrine), `tests/gameplay/deployment.spec.ts`
  (choose a shield wall, read the front rank and the journal).

## Checks and results

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | pass ([log](typecheck-lint.log)) |
| `pnpm test:unit` | **2,380 tests / 310 files pass** ([log](tests-unit.log)) |
| `pnpm test:campaigns` | 57 tests / 10 files pass ([log](tests-campaigns.log)) |
| `pnpm measure:pacing headline standard long` | **329 / 301 / 219**, identical to rules 74 on every course (no AI realm sets a doctrine), 0 refused orders; the headline Epic drift recorded with the sixth catalogue stands unchanged ([log](pacing-after.log), [json](pacing-after.json)) |
| seeds 20260906 and 20260907 | Epic 355 / 383, Long 286 / 315, Standard 194 / 204, identical to rules 74 ([log](pacing-seeds.log), [json](pacing-seeds.json)) |
| proxies | Epic 379, chronicle Epic 461, Long 353, Standard 209, identical to rules 74, within the proxy bounds ([log](pacing-proxies.log), [json](pacing-proxies.json)) |
| `pnpm build` | pass ([log](build.log)) |
| covering journeys: deployment (new), battlefield | 5 passed in 41 s ([log](browser-covering.log); screenshots under `browser-results/`) |
| `@scale` chronicles journey, alone | 1 passed in 25 s, the pin at 56 unmoved; [the replay](chronicle-replay.txt) shows rules 74 and 75 issuing the same 916 commands ([log](browser-chronicles.log)) |

## What the tests found first

The current army schema first lost the refinement that keeps provisions to
fleets, which the chronicle's fleet-provisions test caught; it carries that
refinement again and one of its own that keeps a doctrine to land armies.
The test fixtures gave the column more movement than its cohort allows,
which the save validator refused; they march at the cohort's pace now.

## Evidence refreshed alongside

The battlefield journey rewrites its two performance snapshots under
`docs/performance/slice0035-cast-*.json` on every run; this run's frame
timings went into the commit with the slice.

## Known limits

- A doctrine orders the ranks only: no column choice, no per-formation
  placement, no reserve line; the AI keeps the line.
