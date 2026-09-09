# PERSIST-01 / PERSIST-02 durability fixes

Status: implemented and exercised; **not an independent review verdict**.
Initial failed reviews/audit evidence remain unchanged. This report supersedes neither
`../persistence-review-initial-verdict.json` nor the parent's independent review records.

## Changes and rationale

Only production change: `packages/persistence/src/campaign-storage.ts`.
Added focused tests: `packages/persistence/src/campaign-storage-durability.test.ts`.
All helpers/evidence for this task are `persistence-*` files here. Existing dirty
persistence changes were preserved; [persistence-fix.diff](persistence-fix.diff) is
relative to the exact starting working file, not HEAD. Production delta is +49 net lines.
No additional persistence file, simulation/AI/UI/version/fixture/root-status edit,
commit, push, stash, reset, install, provider, or deployment was performed.

- **PERSIST-01:** A cursor proves which immutable bytes once belonged to the journal,
  not that its dependencies still exist. Under the same read/write transaction that
  publishes and rotates, verify the origin and every predecessor's SHA-256 payload,
  origin/sequence endpoints and cumulative blob/byte counts. Missing replicas refuse
  publication; the last readable generation, stored evidence and durable cursor stay
  unchanged. Verification streams one blob at a time, without whole-journal
  materialization or canonical historical replay during saves.
- **PERSIST-02:** Refcounts remain scheduling hints, not reclamation authority. When
  the garbage queue is nonempty, derive actual incoming references from digest-verified
  payload links and verified generation manifests in the transaction. Compare payload
  link/type/size/endpoints with metadata; refuse if proof is incomplete. Reconcile
  counts/queue, including orphan-successor leases, before the existing bounded sweep.
  This fixes the resealed undercount without disabling rotation or GC.
- Extracted the existing manifest reader for shared load/GC validation. DB schema,
  v1 readers/prefix policy, v2 size/count limits, immutable payloads/three replicas,
  installation leases, three generations per kind and 64-deletions-per-commit limit
  are unchanged. Cursor/stats advance only after commit. No public API change.

## RED -> GREEN

1. [persistence-red-01.log](persistence-red-01.log): wrote and ran both original-live-
   journal variants before production edits. **Two expected failures**, exit 1:
   saving with a lost interior dependency resolved instead of refusing (no-op/append).
2. Applied PERSIST-01 only. [persistence-green-01.log](persistence-green-01.log):
   **37 persistence tests passed**.
3. Added the resealed-refcount regression. [persistence-red-02.log](persistence-red-02.log):
   **one expected failure, two passes**, exit 1: no-op rotation removed all three
   still-required oldest payload replicas.
4. Applied PERSIST-02. [persistence-green-02.log](persistence-green-02.log):
   **38 persistence tests passed**.
5. Added supplementary coverage of a resealed predecessor-metadata mismatch: GC
   refuses after suffix installation, the transaction rolls back all stores, the prior
   complete history replays, and retry still writes exactly one suffix record.

Final integration command:

```sh
pnpm exec vitest run packages/persistence packages/chronicle \
  apps/web/src/worker-queries.test.ts --maxWorkers=1 \
  --reporter=default --reporter=json \
  --outputFile=docs/development/review-fix-2/persistence-integration-final.json
```

[persistence-integration-final.log](persistence-integration-final.log): **277 tests /
24 files passed**, no skips: 39 persistence, 232 chronicle and 6 actual-worker-handler
integrations, including the fresh current-version origin tests. Duration 19.36 s.
The existing worker teardown emits Dexie's connection-closing notification while
its disposable database is deleted; it is retained in the log, not hidden.

[persistence-gates.json](persistence-gates.json): root `pnpm typecheck`, helper
TypeScript check, scoped persistence/helper ESLint with `--max-warnings=0`, diff
whitespace check and original-capture SHA-256 check all exit 0. Root `git diff --check`
also passed. This is scoped integration, not the whole-repository release suite.

## Real IndexedDB verification

[persistence-browser-before.log](persistence-browser-before.log) runs the exact
preserved starting implementation via an isolated Vite module query, without swapping
production files. Chromium **152.0.7977.82** independently reproduces:

- PERSIST-01 no-op: turns `[1,2,3]`, all three turn-2 payload replicas deleted/read back
  absent, turn-3 head replicas intact, fallback turn 1. Original live save incorrectly
  succeeds and leaves `[2,3,3]`; loading then fails.
- PERSIST-01 append: the same corruption leaves `[2,3,4]`; loading fails.
- PERSIST-02: `[2,3,4]`, oldest `refs:2 -> 1` with recomputed local metadata checksum,
  intact payloads/manifests. Load 4 succeeds; no-op removes the three required replicas
  and all later loads fail.

[persistence-browser-after.log](persistence-browser-after.log) exercises the normal
fixed SaveStore facade and proves:

- Both missing-dependency saves refuse, preserve every stored row and `[1,2,3]`, and
  recover/replay turn 1. Restoring **only the test-deleted bytes** permits retry with
  suffix counts **0 / 1**, then exact complete load/replay at turns 3 / 4. Production
  does not silently repair/rewrite lost history.
- The undercount is reconciled to the one actual successor owner. All replicas remain
  byte-identical; retained fallback histories replay at turns **4,4,3**.
- After genuine command growth and abandoning the branch, deletion counts per commit
  are **0,0,64,4**. The deferred queue drains, every abandoned blob/replica is absent,
  and the active history retains exactly **4 blobs / 12 replicas**, fully replayable.
- A separate fresh page reopens each named DB and replays its complete result; all
  disposable databases are deleted with existence readback. No page errors.

Used a private browser context and dedicated loopback **5197**, checked free before
starting, with a private dependency cache and HTTP readiness check. The owned server
was stopped afterward; user server **5173 / PID 185598** remained untouched. No UI
owner's server was started, stopped or reconfigured. These are API/IndexedDB tests,
not UI-control, physical-fsync/process-kill, real quota exhaustion, cross-browser or
metadata authentication evidence.

## Retained archive costs and equality

Original capture, unchanged:
`docs/hermes-analysis/qa/captured-standard-long-748291.json.gz`

SHA-256: `56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780`.
**114,244 original records / 1,496 battles**, original version-16 victory seal
`0f0b85f5`. Sequential before/after harnesses preserve every original record/header;
no seal, initial snapshot or fixture regeneration occurred.

This capture is already victorious. The append measurement records a real, refused
`endTurn` (`This campaign has ended in victory.`), yielding one legitimate immutable
journal suffix, **not fabricated post-victory play**. Successful endTurn appends are
separately exercised in the fresh campaign tests/browser probes.

Times are single diagnostic samples on a shared workstation, not percentiles or
exclusive hardware budgets. Save timings exclude input import/journal validation;
load comparisons are separate. No large replays or retained cases ran in parallel.

| Runtime / save | Before (ms) | After (ms) | Difference (ms) |
| --- | ---: | ---: | ---: |
| Node / fake-indexeddb cold | 1506.6 | 1527.2 | +20.5 |
| Node / fake-indexeddb noop | 838.7 | 1170.7 | +332.0 |
| Node / fake-indexeddb append | 833.9 | 1166.2 | +332.3 |
| Chromium / IndexedDB cold | 2205.3 | 2217.0 | +11.7 |
| Chromium / IndexedDB noop | 923.2 | 1504.4 | +581.2 |
| Chromium / IndexedDB append | 919.4 | 1570.6 | +651.2 |

Node evidence: [before](persistence-retained-before.log), [after](persistence-retained-after.log).
Browser evidence: [before](persistence-retained-browser-before.log), [after](persistence-retained-browser-after.log).
Node performs complete deep equality against the original capture plus the one-record
suffix. Chromium performs separate-page reload with matching whole-archive,
original-prefix and canonical-snapshot SHA-256 digests. Both leave **449 blobs / 1,347
replicas** after append; cold writes 1,344 replicas, no-op **zero**, append **three**.

Node whole-process peak RSS (includes parse/journal ownership/load/equality temporaries):
**1,897,368 KiB (1.809 GiB)** before;
**2,420,944 KiB (2.309 GiB)** after. These uncontrolled
GC samples do not isolate retained memory or attribute the entire difference to the fix.
Browser JS heap samples are in the reports; they are **not peaks or whole-browser RSS**.
Prior retained full replay evidence in `../hermes-archive/` remains applicable and was
not rerun: no canonical/replay/format semantics changed, and complete input equality
was reverified. Tiny regression histories were actually replayed in these new tests.

### Explicit remaining costs/limits

- No-op/append now **read/hash/parse O(prefix bytes)** under the write lock instead of
  proving only the head. They still encode/write only the suffix. The added latency
  is real, not hidden behind zero-payload-write counters.
- GC proof is lazy (only when garbage is queued), but scans **all stored blob payloads
  and retained manifests**. Its verification/metadata work is **not capped at 64**;
  only physical blob reclamation is. Metadata/count maps are O(stored blobs), with
  one current payload/manifest at a time. Large-store GC latency was not separately
  benchmarked by the retained cold/no-op/append sequence.
- A missing/unverifiable GC proof, even on an unrelated stored branch, can refuse the
  whole save conservatively. This change does not supply an archive-repair tool or
  silently discard damaged evidence. Overcounts that never enqueue garbage are not
  proactively scrubbed.
- Finite v2 archive bounds remain; this is not unlimited capacity, mobile/sustained
  memory certification, browser quota/process-kill testing, or an independent review
  approval. The parent owns integration/review disposition and root status updates.

## Reproduce

From `/home/telephoneheater/Work/Theandril`, with installed dependencies/browser:

```sh
pnpm exec tsx docs/development/review-fix-2/persistence-retained.ts after
# Check 127.0.0.1:5197 is free; run this dedicated server in a separate terminal:
node docs/development/review-fix-2/persistence-vite.mjs
# Verify HTTP readiness on 5197 before the following bounded runs:
node docs/development/review-fix-2/persistence-browser.mjs before
node docs/development/review-fix-2/persistence-browser.mjs after
node docs/development/review-fix-2/persistence-retained-browser.mjs before
node docs/development/review-fix-2/persistence-retained-browser.mjs after
# Stop only the dedicated server after the runs.
```

The Node `before` label was measured before production changes; rerunning that label
on the fixed source does not recreate a historical measurement. Browser `before`
uses the preserved exact checkpoint and can still reproduce it without file swaps.
Reusable transitive-prefix/GC-proof lessons were added to the loaded
`bounded-campaign-archives` skill; no repository guidance/status file was changed.
