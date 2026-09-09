# QA handoff complete

Final artifacts: [report.md](report.md), [checks.json](checks.json). No production edits/commit/push; tracked diff empty.

- Full Vitest actual parsed totals: **1603/1604 tests and183/184 files**, one deterministic contact failure. JSON333/335 nested suites describe the same one failure; do not use122/123.
- Full gameplay149/149 and production smoke4/4 pass. Default chronicle benchmark fails.43 named commands =31exit0/12exit1; checks.json separates8 product-red executions from4 superseded audit attempts, and exit0 diagnostics that observed bugs.
- Two independent save root causes, three manifestations: immediate post-battle strategic morale invalidity; repeat-battle historical morale invalidity (same source cause); independently valid Standard24Long turn446 state cannot serialize93,161,744-byte archive under67,108,864-byte limit. Raw state10,912,745B, capturegzip9,008,518B.512armies/1357formations/357towns;114244records/1496battles. Exact metadata large-archive.json.
- Minimal valid checkpoint +2commands repro ready: node --import tsx docs/hermes-analysis/qa/minimal-save-repro.mjs (expected current exit1). Both commands accepted; final strict save fails. Previous valid storage slot protected in separate fake-indexeddb probe.
- Fresh no-emulation lifecycle reproduced both dev/prod: controls1→9 with loads/imports, →1 on browser reload; one canvas and attached listener counts stable. Duplicate same-key siblings main.tsx:713. Production has no debug hook.
- Genuine Standard turn200 browser checkpoint470armies/913formations/250towns. Huge/Legendary generated100turn and artificial1500/4000army workloads; composed18908/25760formation fixtures; actual2240soldier battle. Renderer exact SwiftShader, not physicalGPU. Final lower-QA-concurrency battle framep50/p9550.0/66.7ms, not60FPS certification. Full evidence and visual caveats inreport.
- Clean committed archive/freshnode_modules/offlinestore/Node26 forced build reproducible:26files/8,836,874B SHA256identical. CI Node22/livePages/realGPU/mobile/Firefox/Safari/longscale campaigns remain uncertified.
- Owned4173/4174 stopped; parent5191/user5173 preserved and verifiedHTTP200. No own unfinished processes.
