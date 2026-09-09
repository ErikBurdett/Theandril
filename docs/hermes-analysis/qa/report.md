# Fresh QA, release engineering and Campaign E audit

**Disposition: not release-ready.** The build and Chromium gates pass, but the full unit/property gate and default chronicle benchmark fail. Real accepted battle commands can produce a state that cannot be saved/restored; a separate ordinary completed campaign exceeds the archive size policy. Repeated campaign restoration also leaks DOM controls in the production build.

Baseline: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`. No tracked production/test/configuration edits, commit or push. Audit harnesses, copies, logs, JSON and screenshots are confined to this directory. Normal ignored build outputs/caches were used, not deleted. Final tracked diff is empty. See [checks.json](checks.json) for machine-readable results, exact commands, per-command exits, timings, classifications, environment and missing certifications.

## 1. Exact gate results

| Fresh check | Result | Exit | Full evidence |
|---|---|---:|---|
| `pnpm typecheck` | Pass | 0 | [log](logs/typecheck.log) |
| `pnpm lint` | Pass | 0 | [log](logs/lint.log) |
| `pnpm content:validate` | Pass | 0 | [log](logs/content.log) |
| Full Vitest unit/property suite, maximum four workers | **1,603 passed / 1,604 tests; 183 passed / 184 files; one failed test/file** | **1** | [raw log](logs/unit-full.log), [JSON](unit-results.json) |
| `pnpm exec turbo run build --force` | Real rebuild, not a cache-only result | 0 | [log](logs/build.log) |
| Full Chromium gameplay suite, one worker | **149 passed / 149; zero skipped, flaky or unexpected** | 0 | [raw log](logs/gameplay-full.log), [JSON](gameplay-results.json) |
| Fresh production Chromium smoke, one worker | **4 passed / 4; zero skipped, flaky or unexpected** | 0 | [raw log](logs/production-smoke-v2.log), [JSON](production-results.json) |
| `pnpm art:validate` / `pnpm bench:art` | Both pass | 0 / 0 | [validation](logs/art-validate.log), [benchmark](logs/bench-art.log) |
| `pnpm bench` / composed army-fleet benchmark / `pnpm bench:storage` | All complete | 0 / 0 / 0 | [scale](benchmark-scale.json), [composed](benchmark-composed.json), [storage](benchmark-storage.json) |
| **Unmodified** `pnpm bench:chronicles` | Fails strict save validation; not certified as a completed matrix | **1** | [log](logs/benchmark-chronicles.log) |

Totals are parsed from retained output, not estimated. The full Vitest run is **183/184 files**, not 122/123. Its JSON reporter additionally reports 333/335 nested suites, with two failed nested suites: these refer to the **same one failed test**, not two independent failures. No production test assertions or known failures were disabled. The focused contact repro selects one case intentionally and is separate from the full unchanged suite.

There are **43 named command records: 31 exit 0 and 12 exit 1**. These are not 31 product gates passing and 12 distinct product bugs: eight exit-1 records are product failure/repro executions, and four are superseded audit attempts. Six exit-0 diagnostics explicitly observe known defects or recovery behavior. A shell chain's final exit is not the exit of every command. `results/*.json` and `checks.json` retain that separation.

## 2. Release-blocking persistence findings

### QA-SAVE-01 — valid battle commands create non-round-trippable state

**High / release blocker. Two failure surfaces, one traced root cause.**

#### Case A: immediate post-battle strategic state

A retained **valid, deserializable** real AI-campaign checkpoint at turn 236 has hash `602413fe` and the relevant formation morale 55. The two retained legal commands—attack then autoresolve—are accepted. Immediate `deserializeGame(serializeGame(state))` then throws:

> `Invalid save: invalid formation definition, morale or strength`

This is not a hand-edited invalid fixture, content mismatch, or a browser timing timeout. [minimal-save-repro.mjs](minimal-save-repro.mjs) starts from [the valid checkpoint](pre-first-battle.json.gz), applies [the exact commands](first-battle-commands.json), and asserts a normal round trip. It exits **1**, intentionally red on the defect. [Raw log](logs/minimal-save-repro.log); [full command trace](save-replay-diagnostic.json).

Reproduce from the repository root:

```sh
node --import tsx docs/hermes-analysis/qa/minimal-save-repro.mjs
```

#### Case B: another same-turn battle poisons retained battle history

The ordinary generated Tiny / four factions / Standard-pace campaign, seed **20260905**, reaches a real Prosperity victory at turn **237**, after **5,669 accepted orders, zero rejected orders, and 166 archived battles**. Its raw state snapshot is **372,291 bytes**. Final load fails:

> `Invalid save: battle formation differs from unit content`

The retained report contains morale **63**, above the permitted trained limit **59**. Strategic morale can recover/normalize on an end turn, but that does not repair the already-retained report. [save-mismatches.json](save-mismatches.json), [capture log](logs/capture-tiny-standard.log), [actual captured snapshot/archive](captured-tiny-standard-20260905.json.gz). The unmodified direct benchmark also fails: [log](logs/chronicles-tiny-standard.log).

**Source trace:** `packages/sim/src/warfare.ts:62` adds training morale to current strategic morale when deploying; `warfare.ts:215` writes resulting tactical morale directly back into strategic formations. `packages/sim/src/save.ts:677` requires strategic morale not to exceed base unit morale. `save.ts:828` separately requires battle morale not to exceed unit morale plus training. Thus a trained bonus can survive aftermath and be added again on another deployment. These two save cases are **not counted as independent bugs**.

**Fix direction / acceptance, not implemented:** establish one consistent canonical meaning for strategic versus effective battle morale; prevent temporary deployment bonuses from being accumulated through aftermath. Do not merely loosen or remove validation. Add round-trip assertions after attack, manual/autoresolve resolution, two battles within one turn, and end-turn/history retention, including promotions/rally/development snapshots. The retained two-command repro must exit 0, and the complete Tiny/Standard archive must save, load and replay with identical state/events. Preserve or explicitly version historical save/battle behavior if canonical rules change.

**Recovery qualification:** [save-failure-recovery.json](save-failure-recovery.json) exercises real `SaveStore`/`CampaignStorage` logic using **fake-indexeddb**, saving the valid checkpoint first. The invalid update is rejected and the previous slot remains hash `602413fe`; the continued in-memory hash is `a7f6dab1`. This demonstrates protective rollback, **not** that the battle result is saveable, browser disk durability, or automatic recovery of unsaved progress.

### QA-SAVE-02 — independently valid mature state cannot export its complete archive

**High / release blocker; independent of the morale defect.**

The unmodified Standard / 24 factions / Long-pace benchmark, seed **748291**, reaches a real Prosperity victory at turn **446**, but export serialization throws `Save exceeds the 64 MiB limit.` The audit capture rerun reproduces it without changing simulation commands/assertions.

| Actual completed campaign quantity | Exact value |
|---|---:|
| Army containers / canonical formations | **512 / 1,357** |
| Settlements | **357** |
| Accepted archive records / rejected orders | **114,244 / 0** |
| Recorded battles | **1,496** |
| Raw state snapshot | **10,912,745 bytes** |
| Logical uncompressed campaign envelope | **93,161,744 bytes** |
| Policy ceiling | **67,108,864 bytes** |
| Compressed diagnostic capture | **9,008,518 bytes** |
| Final state hash | `0f0b85f5` |

The **snapshot independently passes strict `deserializeGame` validation**. Its size is not the archive size. Small gzip output does not satisfy the uncompressed logical policy. Envelope bytes were reconstructed from the actual captured payload with the production envelope/checksum format; no payload values were changed. Full replay of this over-limit archive was **not** run, and this is not a successful portable export or import.

Evidence: [unmodified failure](logs/standard-long-archive.log), [capture failure](logs/capture-standard-long.log), [exact metadata](large-archive.json), [compressed source](captured-standard-long-748291.json.gz). Capture SHA-256: `56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780`.

**Source:** `packages/persistence/src/size.ts:1–5` sets/enforces 64 MiB; `index.ts:14` constructs the portable envelope; `campaign-storage.ts:185–193` validates the snapshot and also enforces the logical campaign size. Incremental storage reduces repeated history writes but does not remove the logical bound.

**Fix direction / acceptance, not implemented:** design an explicit archive capacity/retention or streamable format policy that supports the advertised campaign durations without silently discarding origin replay. Keep decompression/validation resource bounds. Measure growth and warn before save failure; distinguish snapshot-only fallback from complete archive preservation. This retained valid-state campaign must complete save/export/import and full replay, with previous slots protected on any failure. Simply noting that compressed bytes are under 64 MiB is not a fix.

## 3. Other verified findings

### QA-AI-01 — committed contact gate fails deterministically

**High / release gate blocker.** `packages/ai/src/contact.test.ts:85` expects the player's first contact to be non-null within its committed bound. Standard / four seats fails in the full suite and again alone with one Vitest worker. This is an assertion failure, not an execution timeout.

A separate 150-round unmodified diagnostic reaches player contact at turn **137**, Reedbound at **130**, Cinder at **57** and Glass at **56**; first war/battle occurs at **121**. All **5,776 commands are accepted**, snapshot round trip passes, and **5,473 resumed commands** mirror correctly. Thus this is late contact, not proof of permanent isolation or corrupted replay. [Focused log](logs/contact-repro.log); [diagnostic](contact-diagnostic.json).

The diagnostic also records a sampled local exploration heuristic maximum of zero while a scout can gain new sight; this is a candidate planner/progress issue, not a proven single-line root cause. Investigate exploration/transport progress against generated geometry rather than hiding the failure by skipping the test or increasing a wall-clock timeout. Acceptance: the original bounded test and full suite pass using legal observation-only plans, with replay parity retained.

### QA-UI-01 — repeated load/import accumulates World map controls

**Medium / functional DOM lifecycle + console. Confirmed in development and production.**

Fresh desktop Chromium, **no mobile emulation and no injected replacement state**, generates a Small/12-faction campaign. Four public-UI saves/loads and four repeated battle-fixture imports grow `.faction-overview-control` counts:

**1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9**. Battle entry/exit leaves nine; a full page reload resets to one. The production reproduction has the same result while the development debug hook is absent.

`apps/web/src/main.tsx:713` places both `FactionOverviewControl` and `BattlefieldPanel` among the same siblings with `key={registryEpoch}`. Development console output explicitly warns of duplicate keys. This is an observed DOM leak, not just a warning. In screenshots, controls overlap at the same position, so nine separate buttons are not necessarily visually distinguishable.

Canvas count stays **one**. Attached listener counts remain window **2**, document **5**, canvas **12**. This does **not** certify detached-node/listener/worker heap cleanup or prove no memory leak. [Dev observations](lifecycle/observations.json), [production observations](lifecycle-production/observations.json), [dev log](logs/lifecycle-v2.log), [production log](logs/lifecycle-production.log), [capture](lifecycle/after-battle.png).

**Fix direction / acceptance, not implemented:** use unique component-scoped sibling keys or deliberate keyed subtrees. After repeated same/different save imports, loads, failed imports and battle transitions, assert one control, one renderer/canvas, no duplicate-key errors, correct fog/selection, and stable owned listener/resource counts in both dev and production.

## 4. Campaign E performance and stress

### Environment and precision limits

Host: Linux `7.2.3-arch1-3`, **i9-13900K, 32 logical CPUs, 31 GiB reported RAM**; initial 18 GiB used / 12 GiB available. Node **26.7.0**, pnpm **10.32.1**, Vitest **4.1.11**, Playwright **1.63.0**, system Chromium **152.0.7977.82**.

The queried renderer is **WebGL 2.0**, specifically:

> `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`

This is **software rendering**, not the machine's physical GPU. Maximum texture size queried: 8192. Main-page JS heap, atlas/chunk byte estimates, worker protocol byte counters, draw-entry instrumentation and RAF intervals are distinct measurements—not GPU allocation totals or driver timing.

Initial headless/full-browser runs overlap parent/campaign work. The final standalone map probes and final battle rerun occur after other QA workloads stop, but user desktop applications including Civ7 remain active. This is **lower QA concurrency**, not exclusive-host timing. [Environment](logs/environment.log), [pre-probe process snapshot](logs/perf-host-before.log).

### Real AI growth versus artificially populated fixtures

`benchmark-scale.json` contains four **100-turn** real-AI workloads with zero rejected commands and 50 verified resumed turns each. Victory project proposals are intentionally deferred in this scale benchmark; it is not an ordinary completed victory/archive certification.

| World / origin | Final armies / formations / towns | Mean complete turn without save | Snapshot serialize / load |
|---|---:|---:|---:|
| Huge, generated current generator 7 | 530 / 836 / 230 | 244.215 ms | 99.616 / 266.356 ms |
| Huge, artificially populated legacy generator 4 | 1,140 / 1,663 / 186 | 260.882 ms | 115.261 / 324.669 ms |
| Legendary, generated current generator 7 | 668 / 1,010 / 278 | 305.531 ms | 106.478 / 442.550 ms |
| Legendary, artificially populated legacy generator 4 | 1,977 / 4,110 / 219 | 390.027 ms | 111.769 / 375.710 ms |

The artificial cases start at **1,500 / 4,000 singleton army containers**, not organically mature empires. Current generated worlds grow from 64/80 initial army containers. CPU-only, no browser/autosave costs in turn figures. Mean AI-all-factions time alone is 207.787 ms for generated Huge and 260.743 ms for generated Legendary.

The separate composed-army workload has **1,500 armies / 18,908 formations** on Huge and **4,000 / 25,760** on Legendary, with authored veterans/extra formations plus real paid appointments/development commands. Twenty measured idle end turns after seven warmups give p50/p95 **4.752/5.886 ms** and **8.195/12.250 ms**. These turns include economy/upkeep/movement but **no AI planning or battles**; do not compare them with complete AI turns as the same workload. Strict deserialize p50/p95: **208.144/281.823 ms** and **351.105/438.922 ms**. [Composed evidence](benchmark-composed.json).

### Actual browser map, save, load and export

[map-probe/summary.json](map-probe/summary.json) contains **three cases × five stages × 180 sampled RAF intervals = 2,700 intervals**, after 90 warmup frames per stage. Actions use public UI import, zoom, pan, overview, save, export download and restore. Each export verifies the state hash.

| Imported world | Actual world armies / formations / towns | Import → art ready | Save acknowledgements (three) | Load / export-download |
|---|---:|---:|---:|---:|
| Artificial Huge, turn 1 | 1,500 / 1,500 / 32 | 2,229.1 ms | 432.0, 566.3, 547.9 ms | 1,266.8 / 1,423.9 ms |
| Artificial Legendary, turn 1 | 4,000 / 4,000 / 40 | 2,704.8 ms | 813.2, 871.8, 879.1 ms | 2,196.4 / 2,108.5 ms |
| **Genuinely grown Standard checkpoint, turn 200** | **470 / 913 / 250** | 1,814.7 ms | 461.0, 536.2, 516.4 ms | 1,094.6 / 1,374.5 ms |

The Standard checkpoint comes from the concurrently retained campaign-agent run; provenance is in the JSON. Its browser import is snapshot-only/from-save, not a recreation of the complete original archive. The Huge/Legendary cases fully reveal terrain but retain live-entity fog. Global army counts are **not simultaneously rendered actor counts**: near views contain only two visible sprites in these probes, with stack aggregation. The full gameplay army-size case additionally exercises the dense owned-army fixture; its separate artifact is under `gameplay-artifacts/`.

Map frame p50 is **16.7 ms**; stage p95 ranges **16.7–16.8 ms**. Measured draw-entry p95 ranges **1–3 per RAF interval**. Cached chunks peak at **10 / 11 / 13** in the three cases; corresponding cached texture estimates reach **41,943,040 / 46,137,344 / 48,300,032 bytes**. Map art uses two atlas pages, estimated **17,825,792 resident bytes**. Initial worker protocol totals are **2,573,092 / 4,119,978 / 326,641 bytes**. These are renderer counters and estimated protocol sizes, not a heap profiler or measured network transfer. Per-stage raw sample files are retained in `map-probe/`.

### Thousands of soldiers: actual battle renderer and current rules CPU

Authored but valid **20 vs 20 formations, 2,240 soldiers, 46 actors, six officers**, real Brace command and actual animation. No injected battle outcome. Both the full-suite capture and lower-QA-concurrency rerun have **120 sampled warmed frames**:

- Frame p50/p95: **50.0 / 66.7 ms** in both runs. This does **not** establish a 60 FPS battle experience on the tested software renderer.
- Final rerun render CPU p50/p95: **0.7 / 7.9 ms**; only 15 sampled frames remain animation-active. RAF latency and render-CPU duration are different metrics; this is not a GPU bottleneck diagnosis.
- Soldier pool peaks **2,240**, actor pool **46**, transient effects/pool **12**. Five atlas pages, estimated **55,574,528 bytes**, plus **1,048,576** cached chunk texture bytes.
- Latest worker response size counter **972,930 bytes**, cumulative **1,434,901**, cell payload **39**; command CPU **3.2 ms**. Battle draw-call and real GPU memory measurements were not captured.

[Final JSON](perf-rerun-artifacts/battle-performance-authore-4d2f5-red-renderer-and-bounded-FX/battle-render.json), [full-suite JSON](gameplay-artifacts/battle-performance-authore-4d2f5-red-renderer-and-bounded-FX/battle-render.json), [final screenshot](perf-rerun-artifacts/battle-performance-authore-4d2f5-red-renderer-and-bounded-FX/twenty-versus-twenty-battle.png).

A separate **current rules 10** CPU fixture avoids confusing historical kernel benchmarks with production battle rules. Thirty samples: autoresolve without presentation p50/p95 **2.527/3.525 ms**, with presentation **3.132/4.735 ms**; presentation payload **686,549 bytes**. Pending/result snapshots **63,077 / 74,815 bytes**. These are authored fixtures, not recruited campaign-growth evidence. [modern-battle.json](modern-battle.json).

### Archive duration and storage evidence

Successful **ordinary** real-AI complete archives include Tiny/Short (victory turn 42), Tiny/Epic (**turn 806, 16,977 orders, 452 archived battles**), Huge/32/Short (turn 42) and Legendary/40/Short (turn 39). Each successful benchmark verifies complete replay and envelope restoration. Huge/Legendary **Short** completion is not Long/Epic maturity certification. Logs: `chronicles-tiny-short`, `chronicles-tiny-epic`, `chronicles-huge-short`, `chronicles-legendary-short` under `logs/`.

Tiny/Epic envelope is **14,637,268 bytes**, replay **9,513.517 ms**. Huge/Short envelope **8,202,565 bytes**, replay **3,726.993 ms**. Legendary/Short envelope **11,163,609 bytes**, replay **5,508.633 ms**.

`benchmark-storage.json` measures real generated campaign prefixes using **fake-indexeddb, not browser disk**. At Standard/Long turn 261, 59,599 records occupy a **47,177,713-byte logical envelope**. Ten incremental saves have median **575.319 ms**, versus **2,185.598 ms** whole-envelope saves; load **1,779.059 ms**, complete replay **29,161.306 ms**. A no-op encodes no new history records/blobs but still takes **539.284 ms**. Raw heap sample **1,293 MiB** is neither forced-GC retained heap nor peak memory. Three history replicas remain intentional. This benefit does not solve QA-SAVE-02.

## 5. Visual evidence and limits

- [Mature turn-200 map](map-probe/mature-standard-initial.png): actual populated map and campaign UI; no missing-tile hole was apparent in the inspected view.
- [Legendary overview](map-probe/legendary-overview.png): whole-world overview rendered; not a near-view 4,000-sprite display.
- [20-vs-20 battle](perf-rerun-artifacts/battle-performance-authore-4d2f5-red-renderer-and-bounded-FX/twenty-versus-twenty-battle.png): distinct unit groups and count labels are visible, but it is not an unobstructed visual approval—the camera bar covers an upper strip and a black lower band crosses the scene. Retain as visual follow-up; no causal shader/occlusion diagnosis or pixel-diff assertion was run.
- [390px battle inspection](gameplay-artifacts/battle-camera-390px-battle-62d0f-ves-paused-orders-and-picks/battle-inspection-controls-390.png) and [390px, 130% text orders](gameplay-artifacts/campaign-hud-390px-enlarge-445b5--without-clearing-selection/hud-orders-390-130.png) are retained from actual Chromium viewport tests. These are not physical-phone, touch or mobile-GPU runs.
- [Repeated-load lifecycle capture](lifecycle/after-battle.png): duplicate controls can visually coincide. DOM counts and console warnings provide the defect evidence; the screenshot alone cannot count them.

## 6. Release engineering, recovery and migrations

A clean committed archive was extracted with **fresh node_modules**, `pnpm install --offline --frozen-lockfile`, clean typecheck/lint/content validation and a forced real build. All pass. The temporary tree was removed. **All 26 output files / 8,836,874 bytes match SHA-256-for-SHA-256** between working-tree and clean builds. [clean-release.json](clean-release.json), [build-comparison.json](build-comparison.json), `logs/clean-*.log`.

Limits: this reused the existing offline package store and **Node 26**, while CI specifies **Node 22**. No clean online download or unit/browser suite rerun inside that clean archive. The build emits a large-chunk warning; primary JS is **995,649 bytes**, worker JS **668,932 bytes** uncompressed. A reproducible build is not proof that the failing simulation/persistence gates are acceptable.

`.github/workflows/verify.yml` runs unit tests, gameplay, benchmarks/chronicles and art; the red unit gate prevents a normal all-green run. Pages deployment is separately configurable and does not itself prove the full verification gate passed. `.github/workflows/pages.yml` and `docs/DEPLOYMENT.md` describe the deployment checks. This audit used a fresh local production preview, not live GitHub Pages certification.

Production smoke proves the checked asset/fog/play flows and absence of development hooks; the independent production lifecycle probe confirms hook absence throughout. Nevertheless, functional DOM accumulation remains possible despite all four smoke tests passing.

Existing persistence tests cover corruption fallback, previous backups, atomic failures, no-op/delta reconstruction, portable interchange and migration fixtures; the full run includes them. Gameplay storage tests exercise actual browser IndexedDB saves/loads, corrupt-primary fallback and rejected import behavior. These are bounded test cases, not power-loss durability or a corpus of historical user saves.

Source review: `apps/web/src/main.tsx:410–425` installs worker error handling, terminates a failed worker, pauses watch, invalidates/rejects pending queries and restores previous-worker references; the worker's request handler reports caught operation errors. No worker crash, `messageerror`, WebGL context-loss or browser kill injection was added in this audit. Their source presence must not be presented as executed recovery certification.

## 7. Missing certification / acceptance before release

1. Resolve both independent save root causes; verify all three described save manifestations with strict state/event/replay equality and previous-slot protection.
2. Restore the original full unit/property gate and default chronicle matrix without skipping known failures.
3. Fix and test repeated-load/import DOM identity in both development and production.
4. Run real-GPU desktop and physical-mobile/touch performance, Firefox and Safari/WebKit. Current software-rendered battle intervals are insufficient for smoothness claims.
5. Complete ordinary Long/Epic Huge/Legendary campaigns with full retained archive save/load/export/replay and bounded growth; existing synthetic stress and Short victories are not substitutes.
6. Run clean online CI Node-22 release reproduction and actual deployed Pages/subpath smoke.
7. Exercise worker/browser/GPU failure recovery, broad historical-save migrations, sustained detached-node/worker/GPU memory behavior and disk/quota/power-loss conditions. No leak-free or universal migration claim is made here.

## 8. Handoff and cleanup

Owned Vite servers **4173 and 4174 are stopped**, verified by a fresh listener read. Parent **5191** and user **5173** remain running and both respond HTTP **200**. No own unfinished processes remain. [Cleanup verification](logs/cleanup-verification.log). The root `hermes-analysis` untracked item is outside this QA ownership; it was not altered. The complete tracked diff is empty.

Primary handles: [checks.json](checks.json), `results/*.json`, `logs/*.log`, [reproduction-notes.md](reproduction-notes.md), retained `gameplay-artifacts/`, `production-artifacts/`, `perf-rerun-artifacts/`, `map-probe/`, `lifecycle/`, `lifecycle-production/`, and the root-level minimal-save repro files. Full logs retain failed attempts rather than substituting plausible output.

Superseded audit attempts are explicit: initial production config concatenated two Playwright webServers and inherited a nonexistent cwd; initial battle probe traversed a nonexistent property; initial lifecycle locator excluded a hidden button; the first candidate minimal-save checkpoint was already post-defect. Only audit harnesses were corrected. Their reruns and the deliberately red minimal product repro are separately named in `checks.json`.
