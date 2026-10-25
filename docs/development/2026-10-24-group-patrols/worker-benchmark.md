# Headless group patrol batch cost samples

The exclusive local run passed Huge verification and all six measured cases on an Intel i9-13900K with Node v26.7.0. No fixture or runtime correction was needed after execution began. Original output is retained in `worker-benchmark-verify-initial.log` and `worker-benchmark-measured.log`; full precision and exact source hashes are in `worker-benchmark-results.json`.

```sh
./node_modules/.bin/tsx apps/web/src/worker-patrol.benchmark.ts --verify-only --size=huge
./node_modules/.bin/tsx apps/web/src/worker-patrol.benchmark.ts
```

This runs the production worker **module** under a Node same-thread host shim, real simulation/journal/persistence code, Node structuredClone copy/transfer and fake-indexeddb. It does not measure browser Worker scheduling, real postMessage overhead, physical storage or rendering. Each table row is one functional/cost sample, not a median, percentile or performance-budget acceptance.

| Size | Action | Explicit batch ms | Command loop ms | Fake-IDB autosave ms | Separate cold observation ms | Result bytes | Total state transfer bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Huge | pause | 330.824 | 1.498 | 227.840 | 5.323 | 16155 | 677371 |
| Huge | resume | 382.883 | 1.153 | 280.515 | 4.714 | 16923 | 664647 |
| Huge | remove | 389.917 | 1.201 | 279.879 | 4.562 | 15131 | 631133 |
| Legendary | pause | 668.912 | 1.120 | 474.300 | 6.131 | 15738 | 669251 |
| Legendary | resume | 634.563 | 1.016 | 466.896 | 6.395 | 16506 | 656498 |
| Legendary | remove | 673.485 | 1.025 | 509.803 | 5.929 | 14714 | 622592 |

Every batch contains128 ordinary canonical commands in stable ID order and emits exactly one final state and one autosave. No query request is sent. Existing route and every army are unchanged. The39-byte empty packed-cell transfer proves no cell delta in these policies-only examples. Result bytes include the UTF-8 JSON group-result wrapper; total bytes additionally include the existing observation and packed cell payload. The result is compared against an ordinary-command mirror, strict saved import, exact archived command order, full replay, and exact automatic-save export after restore.

Huge has196,608 map cells,32 realms,1,581 global armies and128 owned policies. Legendary has307,200 cells,40 realms,4,028 global armies and128 owned policies. Both have61 permitted observed cells. These authored mature fixtures retain generated terrain, resources and fog; extra owned guards are co-located at the existing origin. Strict serialize/deserialize validates the expanded world before ordinary setup. A from-save journal records128 set-patrol commands and one legal movement order whose route cost exceeds remaining movement, leaving a nonempty route for preservation checks. No direct patrol or route fabrication is used. This is not a fully charted observation stress test or an organically earned mature realm.

Setup/generation/validation costs are separately reported:925.283 ms Huge and1,729.763 ms Legendary, with3.568/1.861 ms inside the129-command setup journal portion. Imports, exports, comparisons, mirror/replay, restore and the separate cold-observation check are outside each timed batch. The prototype wrappers transparently run the real methods; canonical-plus-journal time inside the command loop ranges0.958–1.270 ms, and fake-IDB autosave227.840–509.803 ms dominates these samples. Final-publication residual includes envelope/current-hash validation, observation, final hashing, Node clone and host promise scheduling; it must not be relabelled as isolated observation time. Cold observation is measured separately on a strictly deserialized state and checked against the delivered summary.

The benchmark source passed typecheck and scoped lint before execution. Its only later changes strengthened the route choice to require an unfinished legal leg and clarified same-thread measurement labels; parent integrated checks also passed. No gameplay rules, schema, AI, prices or pacing changed. These bounded explicit-action samples do not close M3, DH-021 or a release gate, and make no campaign-turn/FPS/browser-latency claim.
