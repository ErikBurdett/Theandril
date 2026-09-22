# Rejected state-hash cache experiment

**Final disposition: rejected for production.** Unchanged whole-state hashes were
faster, but late land changes made hashes 18–45% slower, retained more graphs and
strings, and exposed unresolved custom JSON conversion differences. No experiment
was added to runtime. The strict save/hash path remains in use. These measurements
do not close M0 or the Epic full-suite timeout.

## Profile and initial candidate

The unchanged default full suite passed 1,791/1,792 tests; Epic took 65.905 seconds
against its original 60-second budget. The next unchanged isolated Epic run passed
in 50.45 seconds. Its [profile](epic-before-hash.cpuprofile) attributes about 15.136
seconds to state hashing, including 10.44 seconds in canonical projection:
4.570 seconds in land, 3.087 seconds in completed report parsing, 0.543 seconds in
roads, and 0.663 seconds in explored-cell ordering. These nested inclusive timings
must not be added as independent runtime costs.

The first evidence-only prototype compared every current report property against
a private parsed projection. At 1,000 projections per sample, an actual retained
v15 report improved from 22.463 to 12.788 ms; a v17 battle completed by ordinary
commands from the existing authored border fixture improved from 24.127 to
15.261 ms. Roughly nine microseconds saved per report did not justify a new cache
alone. Review also found missing enumerability/order handling before land reuse.
The prototype was never installed in production. See
[raw results](battle-projection.json) and [producer](battle-projection.ts).

## Whole-hash experiment

The second candidate retained a parsed land/report graph, an independent snapshot
of source key order, enumerability, prototypes and leaf values, and encoded JSON.
Every reuse checked the full current structure; identity alone was insufficient.
It composed private encoded fragments with ordinary fields rendered in original-
key object wrappers. No caller-provided raw JSON was accepted.

[The loader](load-hash-candidate.ts) rewrote [retained source](save-before-projection.ts.txt)
into a temporary module sharing unchanged dependencies. Production `save.ts` was
never replaced. Both retained and production source had SHA-256
`8fa091b1af59bb7f766d5b1095fe9fd082ada190b11da28f4fffb2a7ba471257`
at the experiment's end. Public `battleReportForVersion` remained uncached and
detached. Historical derived projections without cached fragments used ordinary
rendering.

| Corpus in current v17 representation | Turn | Towns | Reports | Land memories | Save bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Retained real Epic, seed 99 | 808 | 32 | 20 | 2,268 | 549,902 |
| Authored town observation fixture | 1 | 17 | 0 | 119 | 39,614 |
| Genuine v17 pending diplomacy fixture | 2 | 3 | 0 | 35 | 29,396 |
| Retained real Standard24, seed 74 | 227 | 269 | 20 | 16,887 | 5,128,634 |

The real campaign inputs came from
`docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/final.json.gz` and
`D-standard24-seed74-300/final.json.gz`. Both genuine v16 saves passed the unchanged
loader and migrated normally to v17. Standard24 has 98,304 cells. Its raw result
label mistakenly says `turn301`, inferred from the run's nominal 300-turn bound;
the actual saved and reported `turn` field is **227**. The label is retained as
run evidence, not a claim that the campaign reached turn 301.

Node 22.23.2 on an Intel i9-13900K ran two warmups and eight alternating sample
pairs, with 50 complete hashes per sample (10 for Standard24). Setup, module
loading, and independent complete-byte/hash checks were outside timing. Late
changes mutate the last known-land biome, or the last land flag if no memory
exists. These are synthetic cache-miss workloads, not gameplay outcomes. Finding
the target was outside timing; the mutation is constant-time. The measured sample
pairs total 61.36 seconds; the initial approximately 15-second estimate was too
short for this corpus. The process completed with exit code zero and complete
results before the requested stop was delivered.

## Results and tradeoff

Median milliseconds **per hash**, normalized by hashes per sample:

| Corpus and changed data | Existing | Candidate | Change |
| --- | ---: | ---: | ---: |
| Epic, unchanged | 6.842 | 5.123 | 25.1% faster |
| Epic, treasury every read | 6.683 | 4.497 | 32.7% faster |
| Epic, late land every read | 6.581 | 9.559 | **45.2% slower** |
| Epic, late land one in five reads | 6.126 | 5.226 | 14.7% faster |
| 17 towns, unchanged | 0.423 | 0.364 | 14.0% faster |
| 17 towns, late land every read | 0.427 | 0.618 | **44.8% slower** |
| Pending diplomacy, unchanged | 0.346 | 0.300 | 13.3% faster |
| Pending diplomacy, late land every read | 0.342 | 0.405 | **18.3% slower** |
| Standard24, unchanged | 61.058 | 47.198 | 22.7% faster |
| Standard24, treasury every read | 60.683 | 48.349 | 20.3% faster |
| Standard24, late land every read | 61.436 | 85.964 | **39.9% slower** |
| Standard24, late land one in five reads | 60.447 | 55.389 | 8.4% faster |

[Raw results](hash-projection.json) retain all cases, samples, corpus hashes and
cache diagnostics. Unchanged Epic produced 10,521 hits and no reparses; late-land-
every-read produced 10,021 hits and 500 reparses. Counts include warmups and
outside-timing correctness calls, not just timed hashes. No campaign or full suite
ran with the candidate.

Each live source entry retains a parsed graph, a Shape object with four arrays per
object/array, and a JSON string. Weak keys and replacement bound revisions per
live source, but multiple campaign/replay states multiply retained data. Reports
are capped at 20 per state. No acceptable heap budget was demonstrated; the
`encodedBytes` diagnostic is cumulative encoding work, **not live memory**.

The candidate matched complete existing serializer bytes and hashes for the
benchmark's ordinary-data inputs and scalar mutations. That does not prove all
runtime acceptance semantics. The independent [review](../review/hash-prototype-notes.md)
found two unresolved issues: a preinstalled inherited `toJSON` could be accepted as
an unchanged baseline but receive a root key instead of its original parent key;
and a conversion in an ordinary field could change prototypes during a chunk
flush, changing how native stringify would process later data. Retrying after a
hook executes can repeat stateful behavior. The earlier source-order/enumerability
issue was fixed in the second candidate; these conversion issues were not.

The parent and performance owner rejected production integration because of these
correctness gaps, mutation penalties, and unproven retained-memory cost. The
helpers remain explicitly experimental and unreferenced by runtime. Do not import
them into production without a new design and independent correctness/performance
proof. No timeout, scheduling, assertion, schema or canonical outcome was changed.

The parent's broad [final lint run](../lint-final.log) passed, including these
experimental scripts. `git diff --check` passed for the evidence. Final default
integration verification remains the parent workstream's responsibility.

## Reproduction and measured sources

```sh
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-campaign-continuation/performance/battle-projection.ts > docs/development/2026-09-21-campaign-continuation/performance/battle-projection.json
/home/telephoneheater/.local/share/mise/installs/node/22.23.2/bin/node --import tsx docs/development/2026-09-21-campaign-continuation/performance/hash-projection.ts > docs/development/2026-09-21-campaign-continuation/performance/hash-projection.json
```

Measured encoded candidate SHA-256:
`37f401ae461200aec5ecb87a3508ca0dc6f43cd45cfb89675058390de02ed0b5`.
Whole-hash harness SHA-256:
`f48e5f524b4e0c977a064c920e3115edd0029cd1fd0bad0ffb807e6dfb0ff90b`.
Raw result SHA-256:
`41e2fbe6228fe9b18c9806f4f7f2538648308de7a8b149dfc6e1d1b7182a07b3`.
