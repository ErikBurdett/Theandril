# Long patrol diagnostic runner

The read-only runner is `scripts/diagnose-patrol-ai.ts`. It uses the same generated
origin and command protocol as `measure-pacing.ts`: rules35, Long pace, Standard
map, twelve realms, seed20260905, up to900 rounds; one ordinary plan per faction,
drain tactical/capture decisions with the existing four-decision bound, then End
turn. `planTurnWithReasons` is the implementation called by ordinary `planTurn`;
capturing its reasons does not substitute a planner or change proposals.

Run only after the parent's baseline matrix has completed:

```sh
node --import tsx scripts/diagnose-patrol-ai.ts --out=docs/development/2026-10-24-patrol-recovery/diagnosis-long
```

The destination must not exist: failed and previous evidence is never overwritten.
`--max-rounds=N` supports an explicitly incomplete short smoke run, not a pacing
result. No campaign was run by the runner's author while the parent measured its
baseline matrix. Repository typecheck, scoped ESLint and `--help` passed before
handoff. The parent launches the actual diagnostic sequentially.

The later diagnostic adds validated `--pace=standard|long|epic` and
`--seed=uint32`, retaining Long/20260905 defaults. Duplicate options, unsupported
paces, fractional/negative seeds and seeds above4294967295 are rejected before
world setup or output creation. The original runner bytes remain at
`diagnosis-runner-before-options.ts.txt`; already-running measurements retain
their original source hash. For the observed Standard patrol refusal, run with
`--pace=standard --seed=20260905` and a fresh output directory.

## Evidence schema

- `metadata.json`: exact configuration, content hash, selected source hashes,
  bounds and scope. Source hashes cover the diagnostic and major relevant
  modules; they are explicitly not a whole-repository source manifest.
- `proposals.jsonl`: sequence, turn, faction, ordinary/capture phase, complete
  actual proposed commands and planner reasons. At most25,000 plans; exceeding
  the evidence cap fails instead of silently dropping proposals.
- `patrol-states.jsonl`: before each owner's ordinary commands, changed patrol
  facts and ten-turn heartbeat. Includes current order, army state, complete
  ordinary route/pause reason, supply, observed endpoint ownership, route's
  single-waypoint match to patrol target, already-at-target flag, held-army
  reservation and proposed actor commands. Nearby observed hostile combat armies
  are bounded to twelve, with total count, army distance and whether within that
  army's sight; proximity is within six hexes of the army or either endpoint.
  Rows are bounded at20,000. The `globalDiagnosticOnly` owner comparisons and
  register removals are instrumentation facts, never planner inputs.
- Repeated sampled position is labeled `sampledStationaryTurns`, not asserted
  actual idle time: an army can complete a short loop between samples. A
  continuously observed paused route has separate `pausedRouteTurns` and
  `maxPausedRouteTurns`. The observation phase is explicit; changes after that
  phase appear at the next owner sample.
- `readiness.jsonl`: every realm's changed project blockers, infrastructure
  eligibility, affordability, technologies/institution/doctrine, own hearths,
  wars and project status, plus a ten-turn heartbeat. Includes current coin,
  knowledge, economy, project progress, up to eight normal host assessments and
  actual proposed project starts. At most15,000 rows. `summary.json` filters this
  history to the actual winner after campaign completion, preserving pre-victory
  milestones without assuming a winner in advance.
- Up to three actual serialized problem states: first enabled patrol with an
  eight-turn paused route; first enabled patrol still paused during peace after
  that duration; first enabled home patrol whose endpoint is no longer an owned
  hearth. These are diagnostic triggers, not conclusions of a source defect.
  Each category is saved once. Each snapshot has a raw SHA256, canonical state
  hash, exact reload assertion, phase/plan sequence, permitted own-view movement
  preview toward the actual patrol target, and route/target match facts. Snapshot
  inspection asserts that canonical hash remains unchanged. No snapshot is
  manufactured if its trigger never occurs.
- `summary.json`: final turn/winner/path/hash, complete command/event counts,
  refusal and patrol attempt counts, SHA256 of the complete ordered
  command/result trace, row counts, snapshot ledger, per-patrol maximum paused
  duration and last observed state, winner milestones and explicitly labeled
  global final project state. Full result bytes feed the trace hash without
  changing or filtering executed commands. The final save also reloads exactly.
  The later diagnostic additionally retains up to64actual `patrol_blocked`
  events with event turn, owner, exact message and executed-command sequence;
  an explicit omitted count records any overflow. Full event counts remain
  uncapped, and a patrol refusal is never merged into the separate theater
  automatic-refusal counter or silently dropped from the report.

## Question to resolve before policy changes

The source suggests an enabled patrol may retain its army reservation while its
ordinary route stays paused after the sighting that caused the pause becomes
irrelevant. `packages/ai/src/patrols.ts` exits on any existing configured patrol;
`heldDelegatedArmyIds` in `packages/ai/src/theaters.ts` reserves enabled patrols;
`packages/sim/src/patrols.ts` preserves existing routes, including paused routes.
That interaction preserves explicit user policies, but may leave ordinary AI
companies unable to recover without an explicit legal resume command.

The diagnostic must establish an actual campaign witness: saved enabled policy,
paused route matching the selected target, enough elapsed turns, owned endpoints,
current permitted threats and movement blocker, safe ordinary preview, and no
ordinary actor orders while held. A pause alone is not proof that resuming is
safe, and a local recovery witness would not explain all of the measured Long
campaign's +24-turn change. No price, proxy threshold, runtime policy or test was
modified by this diagnostic task.
