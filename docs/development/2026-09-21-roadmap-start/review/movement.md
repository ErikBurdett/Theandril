# Independent movement-search review — 2026-09-21

**Verdict: approved for the scoped search optimization.** No correctness or
security defect was found in the reviewed diff. This does not certify the full
campaign baseline, hosted timeouts, browser behavior or any release gate.

Reviewed source:

- `packages/sim/src/movement.ts`, SHA-256
  `6e4635e4900d890ca3bb2f2c86fa48b3f5fe1bdd147dd96148a970fadd6862d5`.
- `packages/sim/src/movement-search-equivalence.test.ts`, SHA-256
  `943c8ef9dc819af6f7808dbc95712b880502866ab911ee281124be2bacc57c2a`.
- `performance/README.md`, movement before/after JSON, retained microbenchmark,
  and Epic before/after JSON under this work packet.

The committed movement preimage at
`f07024fe23ad3386874656d48fbbc33a5380d979` independently hashes to
`1921dc7560b362fae0d91b9f734799e163eef67302a43f613b4fcec894d0c60e`, matching
the regression and evidence record.

## Correctness argument

Both current knowledge adapters return movement edge cost **1 or 2**. Observed
roads cost 1; canonical known roads cost 1 only at the existing rules-version
boundary, and other terrain uses the historical 1/2 cost. Naval terrain/depth
eligibility does not introduce a discounted or zero-cost edge.

For a popped node at the finite range limit, every outgoing arrival would exceed
that limit. Skipping those probes therefore removes no relaxation. For an adjacent
cell with a prior best cost, `node.cost + 1 >= priorCost` implies the real edge
cost cannot strictly improve that prior cost. The old code already rejected that
arrival, including equality. Thus no successful relaxation, parent assignment or
heap insertion changes. Heap ordering and the insertion-order-sensitive tie
outcomes remain identical by induction.

The code charges a nonstale popped node and handles target arrival **before** the
new range pruning. It does not move the budget check, stale-node check or target
check. The exact popped sequence and shared 4,096-node range/preview budget are
preserved, including exhaustion and limited-result flags. Unknown terrain and
blocked cells still cannot become a successful arrival. `mayEnter` and edge-cost
reads have no required canonical side effect; skipping an already uncompetitive
probe cannot change simulation state or later queries.

No cache, schema field, rule-version branch, navigation target, command payment,
fog projection or replay format is added. The positive lower bound must be
revisited if future rules introduce zero/fractional/subsidized movement, but no
current rules path permits it.

## Evidence assessment

I compared all **22** retained before/after query fingerprints and metadata.
Names, complete-query SHA-256, expanded nodes, reachable counts, route lengths
and limited flags match in every case. The committed regression retains fixed
pre-change hashes and checks fresh detached observations as well as repeated
queries. Its corpus covers ties, weighted terrain, roads, exhausted/range-limited
armies, shared budget exhaustion, unknown geography, peaceful/hostile occupants,
towns, append/pause and naval depth.

The mutation regression establishes that callers cannot corrupt future output by
editing a prior result, and that movement allowances/current blockers are read
again. The pre-existing observation WeakMap still assumes immutable geometry,
road, settlement and occupancy snapshots. Mutating those fields in the same
observation object is outside that existing cache contract; this optimization
neither expands the cache nor claims to repair it.

The performance prose matches the retained JSON: disconnected-query median
3.155→1.616 ms, shared-budget query 5.380→3.909 ms, and the combined local Epic
campaign 32.443→27.161 s. Both Epic samples retain victory at turn 910, 22,914
orders, 52,393 events, 249 archived battles, zero rejections, identical archive
byte counts and final hash `1e4534db`. The README correctly distinguishes warmed
synthetic query timing from the combined profiled campaign sample and does not
claim hosted timeout resolution from either.

This reviewer performed source and retained-evidence checks, not another timed
run or full test suite, while parent integration held the execution window.
Parent verification must cover the final combined tree.

## Bounded roadmap consistency pass

The inspected milestone table/catalogue changes retain the existing scope,
dependency order, stable roadmap IDs and all fifteen open gates. New unification,
magic, delegation and online outcomes remain future work rather than delivery
claims; the public snapshot is explicitly historical. One wording correction was
sent to the parent: M0's harbor acceptance should describe preventing an
unnecessary **third paid harbor commitment**, rather than “unnecessary saving.”
This is documentation precision, not a movement-code blocker. Final status and
draft-dispatch reconciliation remain parent-owned after integration results.
