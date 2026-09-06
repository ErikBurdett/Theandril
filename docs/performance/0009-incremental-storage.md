# Incremental local campaign storage

Measured 2026-09-05 on the same i9-13900K / Node 26.7 environment as slice 8. `node --import tsx scripts/benchmark-storage.ts` ran two genuine AI histories and ten following rounds per case, recording every command/result/event and final hash. This is a warmed **fake-indexeddb** comparison, not Chromium disk latency. Full materialization and replay were measured separately; these costs have not disappeared.

| Workload | Tiny Epic / 4 factions | Standard Long / 24 factions |
| --- | ---: | ---: |
| Initial round / records | 501 / 8,856 | 251 / 38,635 |
| Initial logical envelope bytes | 8,189,170 | 32,718,471 |
| First chunked commit | 101.03 ms | 501.93 ms |
| Following commands / final round | 204 / 511 | 1,478 / 261 |
| Final logical envelope bytes | 8,365,703 | 34,041,608 |
| Incremental append mean / median / max | 13.56 / 13.32 / 17.55 ms | 210.66 / 210.58 / 217.06 ms |
| Prior whole-envelope save mean / median / max | 198.07 / 191.04 / 229.53 ms | 1,049.78 / 1,053.56 / 1,089.41 ms |
| New encoded history bytes per append | 11,911–29,374 | 94,571–160,112 |
| New immutable blobs / replica writes per append | 1 / 3 | 1 / 3 |
| No-op save | 11.98 ms | 207.36 ms |
| Cold load / full replay | 170.31 / 1,831.46 ms | 810.53 / 11,261.11 ms |
| Final canonical hash | `3f2d7d1b` | `05d1af90` |

No-op commits encoded zero history records/bytes and wrote zero history payloads. They still serialize the current game snapshot and do storage metadata work; Standard's 207 ms is a remaining cost, not a zero-cost save claim. The first commit writes the complete initial history; subsequent commits encode only new records and share immutable prefix blobs across retained generations. All payloads have three independently verified replicas. GC processes at most 64 pending blobs per commit.

Both cases compare independent journals by deep equality of the complete materialized archive and exact canonical hashes, then replay it. Key order introduced by schema parsing is not mistaken for a data difference. The old timing includes detached full materialization, envelope serialization and the original save path, matching the work the worker previously did.

Reported raw heap reaches 277 MiB for Tiny and **2,109 MiB** for Standard. The harness simultaneously retains two journals, three fake-store replicas, materialized JSON and replay temporaries; no forced-GC retention study was performed. This is not proof of acceptable browser memory on 1,000-turn giant empires. The portable archive remains a complete envelope with the existing 64 MiB UTF-8 ceiling; history is never truncated to fit. Cold loading, export/log materialization, snapshot encoding and larger mature-empires storage remain profiling priorities.

Focused verification: 13 new journal tests plus 29 existing archive tests, all 20 persistence tests, and a real Chromium DB2 workflow passed. That browser workflow checks history sharing, no-op writes, corruption fallback, actual Load, full portable export/replay and UI import. See [decision 0016](../architecture/0016-incremental-local-archives.md) and [implementation status](../IMPLEMENTATION_STATUS.md) for final aggregate gates.
