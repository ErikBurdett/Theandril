# Independent observation publication review — 2026-09-21

**Verdict: approved for the reviewed object-construction optimization. No blocking
finding.** This is an independent source, test-design and retained-evidence review.
I did not rerun tests, typecheck, lint or benchmarks while the parent prepared the
full suite. Campaign timing, browser checks and M0 acceptance remain separate.

## Reviewed source

| File | SHA-256 |
| --- | --- |
| `packages/sim/src/simulation.ts` | `f964747ffba1541286bf19bc0db1583f385aed970961edf302e441bb88e0e39c` |
| `packages/sim/src/territory.ts` | `bf4a16db0272d36060aabb367b5aad845e2b5d2688a246ea779749556365982a` |
| `packages/sim/src/observation-publication-equivalence.test.ts` | `c4fc2c8e53d9f1f4c9f47e7d66e90125dc04add10a7c0c5e59d5c98067a79132` |
| `observations/baseline.json` | `aad2abed7026e193d5d10f4b10a4fd5e26f34b554e3f265098909b065541fb6d` |

The retained pre-change sources hash to
`b80a07b412ba6c0fa25b2802bfc2e661ec7211b92a65e2fc62c6893d512cdbfc`
for simulation and
`25f77075def0615c5c485704a0be850bf45fafb0b581ec9a9ac37af85a0e8a97`
for territory. Those values agree with the capture and benchmark metadata; the
benchmark's current-source hashes agree with the files reviewed here.

## Field and rule equivalence

- `simulation.ts:536,571` hoists read references and builds each explored-cell
  record directly. Its insertion order remains `cell`, optional resource,
  terrain, biome, water depth, fertility, visibility, optional hydrology, optional
  road mask, optional settlement and faction, optional improvement. The original
  truthiness predicates are preserved, including omission of zero hydrology/road
  masks. The faction property remains present whenever the remembered settlement
  predicate passes, including its possible null value.
- `territory.ts:276` expands the four scalar geography fields in the same order
  as the old spread. `features` is a number, not an aliased collection. The
  geography map remains call-local and no persistent publication cache is added.
- `territory.ts:492` preserves the four fields returned by `actualLandCell` in
  their existing order, including explicit null settlement/faction/improvement
  values. Optional resources still precede `cell` and require rules version 16 or
  later. Every remaining land-cell field is assigned before return.
- `territory.ts:502,506` preserves the full quote shape: identifier and name,
  then `coinCost`, `turns`, `canStart`, `blocker`, `effectText`. The shared `option`
  constructor at line 294 returns exactly those five quote fields. Null blockers,
  false availability, costs, durations and explanatory text are retained.
  The quote functions and all eligibility/funding rules are unchanged.

Fog boundaries are unchanged: explored cells publish remembered land and road
ownership; detailed town candidates are still filtered through current visibility
before `actualLandCell` is consulted. Town ownership checks, foreign-town private
lookup rejection, detail windows, current resource-version guards and historical
candidate selection are unchanged. Hoisted references do not introduce a new
state write. Published cell records and quote records are fresh objects containing
scalar fields; existing fresh yield objects and copied town arrays/work records
remain in place. No save schema, hash algorithm or command behavior changes in
this delta.

The explicit constructors must be maintained if the source record or quote shape
grows. Current constructors match the source interfaces and runtime returns;
that maintenance obligation is not a present defect.

## Evidence and initial failure disposition

The retained baseline contains eight snapshots and 91 complete observation
strings, with checksummed compressed data and serialized canonical inputs. Cases
include paid improvement construction/completion, roads, transport, visible and
remembered foreign territory, and 17 authored towns. That last workload exercises
rules versions 10, 15 and 17, requested/empty/rotating detail selection and direct
town detail queries. These are representative compatibility checks, not exhaustive
historical campaign proofs.

The new test compares complete serialized outputs against those fixed strings,
checks direct detail output and unchanged canonical saves, and mutates published
cells, yields, quote fields, town arrays and work records before verifying a fresh
read. Invalid owner/window and private-town cases are also covered. JSON byte
comparison alone cannot distinguish an absent property from an own property set
to `undefined`; the explicit field/predicate review above covers that distinction
for the changed constructors.

`observations/focused.txt` honestly retains the first run's one failure out of
33 tests. Its paid-construction lifecycle assertion compared a live event's
property order with an observation captured after save parsing. The existing
territory notice constructor uses `turn, factionId, type, message, cell`, while
`save.ts:69` parses events in `turn, type, message, factionId, cell` order. Neither
event path changed in this optimization. The corrected test compares all immediate
values, then performs the same save/import lifecycle as the baseline and still
requires exact complete bytes. It also checks the completed canonical hash. This
is an appropriate lifecycle correction, not removal of the output-equivalence
check. `observations/focused-final.txt` reports five files and 69 tests passing;
that result is read from retained evidence, not an independent rerun here.

Fixture authorship is disclosed in the capture source: the 17-town economy and
ownership are authored, foreign-memory staging moves fixture armies, and the road
fixture receives authored treasury before its ordinary paid command. Improvement,
road acceleration and embarkation captures use actual command application. These
fixtures establish observation behavior; they are not evidence that a natural
campaign earned those holdings or passed giant-scale campaign gates.

## Performance scope

The paired benchmark loads the retained original constructors with unchanged
current dependencies, verifies complete bytes and canonical input preservation,
then uses four warmups and 20 alternating timed samples. Setup, serialization and
equivalence checks occur outside observation timing. Retained medians include
2.031 → 1.054 ms for all 17-town details and 39.471 → 10.425 ms for the synthetic
98,304-cell fully charted Standard map. No detail is omitted from either side.

The 17-town summary p95 rises from 0.363 to 0.512 ms while its median improves;
therefore the evidence does not justify a claim that every measured percentile
improved. The fully charted Standard input has no owned towns and deliberately
authored knowledge. It is not a mature campaign, Epic turn-time result, renderer
measurement or peak-memory result. Both versions still sort explored cells and
allocate complete requested observation output. This change removes temporary
spread objects without changing those asymptotic costs or release budgets.

No corrective production edit is requested. Recheck this verdict if the hashed
source changes, and retain the parent's full-suite outcome independently.
