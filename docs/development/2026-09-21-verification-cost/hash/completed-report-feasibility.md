# Completed-report memoization feasibility

Disposition: **no safe new optimization identified under the existing public
mutation, accessor, validation and serialization contract**. This is a read-only
source assessment; no candidate, benchmark or production edit was made.

The current profile attributes about 3.2 seconds inclusively to completed-report
projection. The [earlier report-cache experiment](../../2026-09-21-campaign-continuation/performance/hash-investigation.md)
already measured structural-comparison reuse and rejected the whole-hash design
for mutation penalties, unresolved JSON hooks and retained-memory cost. Repeating
that experiment is not proposed.

## Existing ownership boundaries

- `finishCampaignBattle` in `packages/sim/src/warfare.ts` appends the completed
  mutable battle object directly to `state.battleReports`. It does not freeze the
  root or nested formation, log, snapshot and aftermath data.
- `deserializeGame` returns freshly parsed but mutable report graphs. Runtime
  search found no production `Object.freeze`/deep-freeze path for reports in the
  simulation or chronicle packages.
- `canonicalPayload` parses each report once per current-rules hash. There is no
  repeated parse of the same report inside that one projection to eliminate.
  Historical projections may additionally apply a different frozen-version
  schema, which is not an interchangeable cached result.
- `CampaignJournal` privately owns its detached archive prefix, but this is
  separate from the public mutable `GameState` whose reports the hash validates.
  Its seal method already memoizes equal-version hashes within that one check.

## Why the proposed boundaries are insufficient

Only accepting already-frozen report roots would produce no ordinary campaign
hits today. A frozen root alone does not prove immutable nested arrays/objects,
stable accessor results, or immutable prototypes. Even a recursively frozen
own-property graph can still have getters or acquire different inherited
optional fields through a mutable prototype. An `Object.isFrozen` check cannot
authorize skipping those reads or their schema validation. Freezing canonical
reports during battle completion or loading would change currently accepted
caller mutations and therefore violates this task's compatibility boundary.

`replayArchive` owns its replay game locally, but repeatedly reads caller-owned
archive records and commands between checkpoints. Native JSON serialization can
also execute inherited hooks on each detached projection. Thus verification-wide
identity reuse is not equivalent to the present repeated parse: the validation
environment can change between hashes, and a hook can mutate a cached parsed
projection if it is reused. Revalidating prototypes, descriptors and all source
values, then detaching the result each time, returns to the already measured
structural-cache design. Freezing a cached projection exposed as `toJSON`'s
receiver would also change hook mutation behavior.

A safe future optimization would first require a deliberately specified internal
immutable report representation with controlled prototype/serialization behavior
and an explicit boundary back to today's mutable public reports. That is an
architecture/interface change requiring its own semantics and performance proof,
not a bounded optimization justified by the present timing failure. No such
change, validation bypass, weakened hash coverage or new cache is proposed here.
