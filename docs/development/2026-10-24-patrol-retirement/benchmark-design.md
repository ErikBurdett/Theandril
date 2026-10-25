# Captured-endpoint retirement benchmark design

2026-10-24. Planned isolated local measurement, not measured evidence. Implementation
will later belong in `scripts/benchmark-patrol-retirement.ts` after the preceding
publication is verified and the parent releases the next slice. No heavy run or
runtime/test-discovery edit is authorized by this design alone.

## Scope and fixture construction

Reuse the mature Huge/Legendary fixture shapes (32/40 realms, initially1,500/4,000
armies) and the preceding recovery benchmark's validated authored-land approach.
Do not copy its12-hex home pair: retirement should recognize the adoption policy's
at-most-six-hex pair. Use two distinct town centers six hexes apart, with all
other towns respecting ordinary minimum spacing and all opposing factions on
distinct cells. Friendly armies may share a cell. Flat rewritten geography must
explicitly clear incompatible generated resources and use `rebaseAuthoredLand`
and strict serialization, never weaken a save validator.

Create128 owned land guard companies and their orders using actual `setPatrol`
and `queueMovement` commands while both endpoint hearths are owned. Give these
authored companies zero available movement for route creation: ordinary queueing
is legal and produces a full valid six-hex route without moving. Pause it with
the canonical pause helper, explicitly labelled authored setup. The patrol's
selected target and sole route waypoint must equal the second endpoint.

For the foreign-endpoint cases, author that second settlement's ownership and
rebase territory/sight, then validate the resulting save. This is a constructed
post-capture stress state, not128 organically played conquests. Real capture and
ordinary clear/replay behavior are covered by the generated witness and scenario
tests. A dedicated ordinary owned observer near the foreign endpoint supplies
positive current sight; move that observer away for the hidden case. Avoid
placing an owned company on the foreign town itself.

Keep a separate owned observer near many foreign army stacks to create substantial
permitted observation input. Use one distinct distant cell per foreign faction
(as in the corrected recovery benchmark), and report both observed entity count
and unique occupied cells. This tests indexing thousands of observed entities,
not dispersed geographic fronts. Do not forge observations to include hidden
forces. Preserve real canonical wars only if needed for the intended scenario;
retirement's foreign-settlement condition should not require inventing a war.

The zero-movement setup deliberately isolates administrative retirement from
existing recovery: cleanup can still be issued, while owned-endpoint controls
do not spend route queries resuming otherwise safe legs. This is a disclosed
fixture constraint, not a new runtime prerequisite or a generic recovery result.

**Preflight scope correction:** the first Huge verification-only fixture used
the recovery benchmark's507charted cells. It passes command/save/replay checks
but records no timings. The new retirement branch lazily indexes `view.cells`
for a foreign candidate, so that small chart would not expose its relevant
scale cost. The parent explicitly selected fully charted authored worlds for
all six final cases:196,608cells on Huge and307,200on Legendary. Current sight
still comes only from real sources; the hidden foreign endpoint remains explored
but invisible and absent from the settlement roster. The initial
[507-cell verification](fixture-positive-initial.json) remains retained as a
preflight, not substituted for final timings. No extra scenario or runtime
visibility rule is introduced by this fixture correction.

## Six measured cases

Run each workload on Huge and Legendary:

| Workload | Permitted endpoint fact | Expected plan |
| --- | --- | --- |
| Visible foreign hearth | Target is a currently visible foreign settlement; other point remains owned | Four `clearPatrol` commands, zero route queries/expanded nodes, all128 actors held for this batch |
| Hidden foreign hearth | Target remains explored but not currently visible; no foreign settlement row is disclosed | No clear, resume or attack, zero route queries/expanded nodes; all128 configurations and reservations retained |
| Still-owned hearth | Both endpoint settlements remain owned | No retirement, no recovery while movement is exhausted, zero queries; all128 configurations and reservations retained |

Assert all endpoint geometry, visibility, ownership, supplied/unsupplied facts
if relevant, routes and pause state from fresh canonical observations before
timing. Do not assume an observer move hid a town: own settlements, claimed land
and other armies also contribute sight. Assert hidden-case observation excludes
the foreign target row and marks its explored cell invisible. The own case may
be visible from its settlement regardless of army sight, which is correct.

## Timing protocol

One warmup, then three fresh-observation samples per case, run sequentially in
the parent's quiet CPU window after campaign measurements. Time only `planPatrol`.
Exclude world generation, fixture construction, observation building, cloning,
serialization/hashing, assertions, command execution, full AI/turns, worker
transfer, renderer and campaign pacing. Retain sample values, median/min/max,
Node/platform/CPU, exact source hashes, content seal, global and observed counts,
unique foreign cells, observation bytes, own patrol count, command count,
route-query count and target-expanded nodes. Refuse output overwrite and verify
source hashes unchanged at the end.

This measures absolute planner work with many patrols and observed entities. It
does not establish a speedup, tail latency, worst-case pathfinding or whole-turn
acceptance. No route search is expected in these specific six cases. Existing
safe-recovery benchmarks remain separate.

## Correctness outside the timing window

- Every fresh observation and canonical baseline hash stays unchanged after
  planning; identical inputs produce identical ordered commands/reasons/counters.
- In the positive case, all128 actors remain held in the returned plan. Execute
  the four ordinary clears on two independent validated save copies and compare
  complete command results/events. Keep every route field and army unchanged.
  Exactly four patrol records disappear;124 remain. Only the cleared actors
  lose their patrol-derived hold in a fresh observation, provided the fixture
  assigns no theater or other delegation to them.
- Save/reload the resulting state and compare hashes/bytes. A from-save journal
  of those four commands must replay to the same hash; replay is outside timing.
  Do not issue movement merely to make a follow-up appear useful.
- Negative cases preserve all128 routes, policies and reservations, and emit no
  commands. Prove hidden-owner noninterference separately on valid unseen state
  variants with equal permitted observations where the fixture supports it.
- Deterministic rotation/fairness and mixed recovery/clear cap are unit/property
  acceptance, not inferred from three identical-turn benchmark samples. If the
  tool additionally checks them, run those assertions outside timing and label
  them separately.

If a proposed fixture fails strict save validation, retain its failed log and
correct only the authored setup. The previous benchmark's hostile-stack collision
is a reason to validate before measurements, not to relax validation or omit
the failure from the record.
