# Rejected local neighbor-buffer candidate

This final bounded experiment starts from the already implemented visibility disk reuse, **not** the original release source. `disk-visibility-before.ts.txt` retains the exact current source, SHA-256 `36e50155c0c262bee491e934f353013b99a74cc36226e82a94f66fbab0ffce5a`.

The candidate changes only `cellsWithin`: import `neighborsInto`, create one query-local array and reuse it while consuming each BFS frontier cell's neighbors. Visited-set insertion, next-frontier order and the detached returned disk stay unchanged. A radius-three query replaces 19 short neighbor-array allocations with one scratch array; it does not retain that array outside the invocation. Candidate SHA-256: `28686c012ecb963ecf8b7b940d1b7f054041e5ebb23f16cf0e2097a6164b6c08`.

`disk-benchmark.ts` loads both retained modules without editing production. Both agree with all **32 frozen lifecycle captures**. Five additional nondefault land/road memory sequences agree across arrivals, departures and later refreshes. Another 35 origin/radius combinations preserve the complete ordered disk, and mutating a returned disk does not affect the next query. Full serialized bytes and visibility/counter snapshots also agree after every timed sample.

The benchmark measures the complete positive/negative `updateSight` pair with authored memory overlays on generated Tiny geography. It uses 100 warmups and 30 alternating sample pairs of 300 lifecycles. Equality, serialization and setup are excluded from timing. `disk-benchmark.json` retains all raw samples, source hashes, CPU and Node 22.23.2.

| Rule version / radius | Existing median (ms) | Scratch candidate median (ms) |
| --- | ---: | ---: |
| 4 / 1 | 0.0006895 | 0.0006881 |
| 4 / 3 | 0.0043884 | 0.0042931 |
| 9 / 1 | 0.0009836 | 0.0009924 |
| 9 / 3 | 0.0057890 | 0.0057976 |
| 12 / 1 | 0.0011021 | 0.0010679 |
| 12 / 3 | 0.0064767 | 0.0070595 |
| 17 / 1 | 0.0010737 | 0.0010617 |
| 17 / 3 | 0.0063875 | 0.0069053 |

**Rejected.** The important modern radius-three lifecycle regressed by roughly 8–9%, while other cases were effectively flat or modestly faster. The allocation argument does not establish a runtime improvement. No production source, test, budget or rule was changed, and no further variants were pursued. This result does not alter the accepted earlier disk-reuse optimization or any campaign gate.

Reproduce from the repository root:

```sh
node --import tsx docs/development/2026-09-21-verification-cost/visibility/disk-benchmark.ts
```
