# Exact movement previews without the unused reachable overlay

The retained Epic profile attributes about 5.08 seconds to `getMovementQuery`, including about 3.6 seconds in search. Three naval callers consume only the target preview. `getMovementPreview` still executes the identical preliminary range search and gives its remaining shared 4,096-node budget to the existing target preview. It omits only copying the reachable map, constructing the attack overlay and sorting the published reachable cells. After the paired measurement passed, exactly those three callers were switched. The full query remains in use by navigation and UI consumers.

The earlier movement search pruning is preserved. This change adds no cache, canonical state, rule, save schema or command behavior. Existing observation indexing remains unchanged: callers must treat geometry/occupancy in a published observation as immutable. Current army capabilities, movement, strategic blockers and wars continue to be read for each call.

## Independent evidence

- `movement-before.ts.txt` retains the full query implementation before adding the new API, including the previously verified search pruning. Its SHA-256 is `6e4635e4900d890ca3bb2f2c86fa48b3f5fe1bdd147dd96148a970fadd6862d5`.
- `capture.ts`, `corpus.ts` and `baseline.json` retain all fields and JSON key order of 22 original target previews before the API change. The synthetic detached charts cover finite and exhausted range, ties, weighted terrain, roads, fog gaps, attack/peace/settlement blockers, foreign armies, mission blockers, active/paused appended routes, shallow-water hulls and deep-water hulls.
- `movement-preview.test.ts` compares the new API against those fixed original results, the current full query and fresh observations. It also verifies the range-exhausted case spends all 4,096 nodes before the target preview, returned-path detachment, changed army movement/capabilities/mission blockers/wars, missing and besieging armies, and a real embarked passenger after an accepted boarding command.
- The earlier `movement-search-equivalence.test.ts` retains 22 independent complete-query fingerprints, including every reachable cost, target path and node count, plus mutation coverage. Its original full-query fingerprints remain unchanged.
- `naval-proposals-before.json` retains complete proposals, reasons, held/queued IDs and founder sites from 91 previously captured observation variants: 35 research/production commands and 21 founder assessments. This is authored observation coverage, not voyage evidence.
- `naval-campaign-before.json` separately captures an authored voyage run through whole-AI planning and the authoritative command API before changing callers: eight turns and 22 accepted commands, including boarding, deep-water sailing, landing and founding. It retains exact command/results, route state and per-turn hashes. A saved mirror agrees after every turn, and every accepted turn state strictly round-trips. Final state hash: `fa29672f`; complete turn payload SHA-256: `4f025ff509924559e7bd6bf3508bfcc29d59befaea223437372e168f46d33661`. The pre-substitution naval source SHA-256 is `897dffd55c5edf0ee67400a6728a4931f90e181bf98b87e87e6839d0057b2d07`.

`capture.ts` and the `--capture` script modes document baseline creation; do not regenerate the original seals to accept a changed result. Run the other modes for verification. The voyage begins from authored ships and geography; it is not proof of naturally earned campaign generation or campaign timing.

## Paired measurement

`benchmark.ts` validates complete outputs outside timing, then alternates the original full publication and the target-only publication on the same detached chart. Both perform the same range and target searches. Five warmups and forty samples per side retain median and p95; fixture construction, equality assertions and hashing are outside the timed spans. The existing observation index is warm on both sides. Results measure repeated observed queries, not full campaign or renderer performance.

The exclusive CPU run is retained in `benchmark.json` (Node 22.23.2; CPU model in that file). All 22 previews match the fixed original capture before timing.

| Detached query workload | Full query median (ms) | Target-only median (ms) | Reduction |
| --- | ---: | ---: | ---: |
| Movement 2, ordinary route | 0.0721 | 0.0404 | 44.0% |
| Movement 5, ordinary route | 0.1397 | 0.0572 | 59.1% |
| Movement 9, ordinary route | 0.2980 | 0.0710 | 76.2% |
| Shallow-water fleet | 0.1218 | 0.0463 | 62.0% |
| Ocean fleet route | 0.0944 | 0.0615 | 34.8% |
| Search across disconnected fog | 0.5588 | 0.5206 | 6.8% |
| Range exhausts shared budget | 2.9158 | 1.0570 | 63.7% |

The disconnected search benefits much less because search is deliberately unchanged. Zero-movement and immediate strategic blockers are already very small and their small timing differences should not be treated as meaningful campaign gains. These measurements justify removing unused result construction, but do not establish the total Epic campaign improvement or acceptance of the 60-second integration gate.

## Final scoped verification and source freeze

- `focused-final.txt`: **73/73 tests, six files**, including new previews, historical full queries, naval commands, paid outlet commitments, fleet assembly and funding.
- `naval-proposals-verify.log`: all 91 original proposal/site results agree, including reasons and held/queued IDs; payload SHA-256 `ceebe5c9c62b0985c986a9ba4c7e7aad6d0ddd68f3591c3e3c92e5f85585a3d3`.
- `naval-campaign-verify.log`: all eight turns, 22 commands, complete results, routes and state hashes agree with the pre-substitution capture. Boarding, deep-water sailing, landing and founding remain present.
- Root owns project typecheck, lint, full suite, build and campaign integration. No test timeout, query budget, rule, activity, visibility or route behavior was relaxed.

Frozen source SHA-256:

| File | SHA-256 |
| --- | --- |
| `packages/sim/src/movement.ts` | `055e490457a30c376511f513d34f1f9e8a7bbf6e832aa7345ef796c9a8e0ab77` |
| `packages/sim/src/index.ts` | `85f5a8d8876505ca7cd23ea40cb1df57c2552d8eb38ed7503cd44c8793e41c5f` |
| `packages/sim/src/movement-preview.test.ts` | `f3149765b9e84f3b30634d0a652175f2f912d70ef7e7b24c324cdca19e7f29c5` |
| `packages/ai/src/naval.ts` | `797310db2da52d41d4c9f7996f2462da8dd2f3b0f3f7eff7c1ffcfc57eec3220` |

These hashes describe this scoped source freeze; later parent integration is recorded separately. Original previews are retained in `baseline.json` (SHA-256 `1d6e86cdbcd9a2514dffec426c4b0e82621e9a783897174a5bdad6b044873e0c`). The complete original voyage capture is `naval-campaign-before.json` (SHA-256 `acb50ad4ca6466d44f14699454973796a349368ff2d7bfffbd84a626c33d10ea`).
