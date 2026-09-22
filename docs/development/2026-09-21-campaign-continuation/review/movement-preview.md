# Independent movement-preview review — 2026-09-21

**Verdict: approved for the three reviewed naval callers; no blocking
finding.** Final caller verification is recorded below. This is a
bounded source, test-design and retained-evidence review; I did not run tests,
lint, typecheck or benchmarks during the coordinated CPU window. Full-suite and
M0 acceptance remain separate parent-owned checks.

## Reviewed source and baseline

| File | SHA-256 |
| --- | --- |
| `packages/sim/src/movement.ts` | `055e490457a30c376511f513d34f1f9e8a7bbf6e832aa7345ef796c9a8e0ab77` |
| `packages/sim/src/index.ts` | `85f5a8d8876505ca7cd23ea40cb1df57c2552d8eb38ed7503cd44c8793e41c5f` |
| `packages/sim/src/movement-preview.test.ts` | `f3149765b9e84f3b30634d0a652175f2f912d70ef7e7b24c324cdca19e7f29c5` |
| `packages/ai/src/naval.ts` | `797310db2da52d41d4c9f7996f2462da8dd2f3b0f3f7eff7c1ffcfc57eec3220` |
| `movement-preview/corpus.ts` | `0331a7c8115fa6822971f183ccff315ca84c430a0d1cada181dff28c81cbaa3d` |
| `movement-preview/baseline.json` | `1d6e86cdbcd9a2514dffec426c4b0e82621e9a783897174a5bdad6b044873e0c` |
| `movement-preview/naval-proposals-before.json` | `649011c998e453241bdaa5e1bcacd71a6bcd77badf4487ee85af1a8086d1e34d` |
| `movement-preview/naval-campaign-before.json` | `acb50ad4ca6466d44f14699454973796a349368ff2d7bfffbd84a626c33d10ea` |

The retained pre-API movement source hashes to
`6e4635e4900d890ca3bb2f2c86fa48b3f5fe1bdd147dd96148a970fadd6862d5`,
matching the 22-preview capture metadata. Comparing that source with the reviewed
file isolates the new helper/API and the full query's equivalent helper call;
the preceding search lower-bound optimization already exists in both.

The retained naval source hashes to
`897dffd55c5edf0ee67400a6728a4931f90e181bf98b87e87e6839d0057b2d07`.
Both proposal and voyage capture metadata use that same hash, before these three
caller substitutions. The earlier paid-harbor/founder fixes are already in this
baseline and are not newly attributed to the preview change.

## Route, budget and privacy reasoning

`movement.ts:154–164` extracts exactly the existing range-search predicate into
`queryRange`. Both APIs build the same observed knowledge and begin with
`MAX_PATH_NODES = 4096`. Both execute the range search first and pass its remaining
budget to the unchanged target-preview helper. The optimization does not grant
the target a fresh search budget. The reported preview `expandedNodes` remains
target-only, including zero when the range consumed all available nodes.

The removed work at these callers is reachable-overlay publication: copying the
range cost map, enumerating adjacent attack overlays and sorting the published
reachable array. That overlay loop writes only its local map; it neither consumes
search nodes nor changes the knowledge, route or target-preview result. The
original full API continues producing the overlay for callers that request it.
The target helper, path order, movement costs, waypoint/route limits, append
behavior and blocker precedence are unchanged.

All information still comes from the same detached `Observation`. There is no
new canonical-state lookup or extra visibility. Known-road costs, shallow/deep
water restrictions, observed occupants, foreign settlements, declared wars,
defending formation limits, missions, siege, transport and strategic blockers use
the existing rules. The three changed `naval.ts` calls are coastal-founder
candidate testing at line 234, bounded travel at line 390 and adjacent naval
attack testing at line 446. Each previously discarded the full result except
`.preview`; each supplies a definite numeric target. Query-count limits,
visibility checks and subsequent command decisions remain unchanged.

## Mutation and test assessment

Each preview constructs a fresh result/path and copies appended waypoints. A
caller changing a returned path/cost cannot affect subsequent results or the
stored route. The new API introduces no result cache. The existing observation
index is shared with the full API: movement, naval capability, wars, route lookup
and current movement blockers are read on each call; indexed chart/occupant
membership retains the existing assumption that a detached observation's
geography/membership is stable. This review does not claim support for arbitrary
in-place chart or occupant replacement after warming that existing index. That
limitation predates this change and the naval callers do not mutate their input.

The 22 fixed previews cover exhausted and non-exhausted shared budgets, weighted
terrain, roads, a fog gap, peaceful and hostile occupants, attacks, forbidden
queued attacks, foreign settlement/army, missions, append and paused routes,
shallow naval travel and deep-water capability. Tests require strict complete
value equality and exact JSON against the pre-API capture, compare the full API,
retry with cloned input and assert the original observation is unchanged. Directed
tests add missing armies, siege, a real accepted embark command and mutations to
returned paths, movement, naval capability, mission blockers and wars. The
4096-node exhaustion case explicitly guards the shared-budget invariant.

`focused-before-ai.txt` records 47 passing tests across two files before the naval
substitutions. This is retained evidence read by the reviewer, not a test rerun.

## Caller evidence and its bounds

The 91-view proposal corpus retains whole plans, held army IDs, queued settlement
IDs and founder-site choices, and checks input immutability. It yields 28 research
and seven queue commands. It is useful broad planning compatibility evidence, but
does not itself demonstrate issued movement or attacks.

The separate voyage closes that movement-coverage gap: it starts from a disclosed
authored naval fixture, then uses complete AI plans and the ordinary command API
for eight turns and 22 plan commands. It boards, sails through deep water,
disembarks and founds another settlement. Research, production and land-work
orders pay their existing canonical costs; the fixture's starting treasury,
fleet and chart are authored and are not presented as naturally earned holdings.
Complete plans, command results, routes and per-turn hashes are retained. Commands
are applied to a mirror and each recorded boundary is checked through save/import.
The captured final hash is `fa29672f`.

Those before-call captures are sufficient to compare the bounded substitution's
actual planning and voyage behavior when the verification scripts are rerun.
They do not establish independent natural campaign balance or a new naval feature.
The three small call replacements plus full preview equivalence support their
scope even though this voyage does not exercise every adjacent attack decision.

## Timing scope and verification status

The retained paired benchmark uses synthetic detached 64×64 charts, five warmups
and 40 alternating samples. Its assertions compare both APIs with the captured
original target output, and its recorded source hash matches the reviewed helper.
Examples are 0.140 → 0.057 ms median at movement five, 0.094 → 0.062 ms for the
ocean route and 2.916 → 1.057 ms for the deliberately exhausted range. The range
search still executes in full. Some small-case p95 values worsen, so the evidence
does not support a claim that every percentile improves.

These are preview-publication timings, not end-to-end AI turn or Epic campaign
timings. The final retained evidence now records:

- `focused-final.txt`: 73 passing tests across six files.
- `naval-proposals-verify.log`: all 91 plans/site sets match, with the original
  35 commands and 21 founder assessments; complete payload SHA-256 remains
  `ceebe5c9c62b0985c986a9ba4c7e7aad6d0ddd68f3591c3e3c92e5f85585a3d3`.
- `naval-campaign-verify.log`: all eight turns and 22 plan commands match, with
  boarding/deep sailing/landing/founding intact, final hash `fa29672f` and original
  turn-payload SHA-256
  `4f025ff509924559e7bd6bf3508bfcc29d59befaea223437372e168f46d33661`.

I read those final logs and checked the frozen caller diff: only the import and
the three `.preview` substitutions differ from the retained naval source. These
results satisfy this bounded integration review. Broader typecheck, lint, build,
full-suite timing and release gates are not replaced by this approval.
