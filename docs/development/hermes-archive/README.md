# R02 archive-capacity verification

**Outcome:** the retained Standard / 24 factions / Long / seed `748291` victory on
turn 446 now saves and reloads with complete history, exports/imports in Node and
actual Chromium, and fully replays from the downloaded browser export. This is a
verified bounded slice, **not** unlimited campaign capacity or a 1.0 certification.

## Subsequent durability corrections and review

The execution results below retain the original capacity checkpoint. Later independent
review found interior-prefix loss and resealed-reference-count durability defects;
their fixes now have separate [passing independent review](../post-fix-review/persistence.verdict.json).
The original failed verdict is preserved, not relabeled. The reviewer ran **52/52 tests
and 14/14 additional probes**; the parent retained and recounted the temporary results
in [this evidence manifest](../post-fix-review/retained-persistence-evidence.json).

Current saves verify the origin and every prefix dependency within publication;
queued GC proves incoming references from payloads/manifests before deletion.
**Zero history writes is not constant-time work:** append/no-op reads, hashes and
parses O(prefix bytes), and GC proof scans the stored inventory; only deletions are
capped at 64. An unverifiable unrelated branch may atomically refuse a valid save
when GC is queued. Overcounts without queued garbage are not proactively scrubbed.
These latency/availability costs and the updated policy are recorded in
[ADR R02](ADR-R02.md#recovery-and-verification) and the
[fix report](../review-fix-2/persistence-REPORT.md). Large-store GC needs separate
profiling. Neither Chromium nor the large full replay was rerun by this independent
review. Temporary probes are retained as evidence, not installed permanent tests.
Overall integration and the certification gaps below remain open.

## Exact retained evidence

Original capture (read-only):
`docs/hermes-analysis/qa/captured-standard-long-748291.json.gz`

SHA-256: `56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780`.
The reproduction checks that digest on every run. Original audit artifacts are unchanged.

- Snapshot: **10,912,745 bytes**; complete envelope: **93,161,744 bytes**.
- **114,244 orders**, **1,496 recorded battles**, all original rules version 16.
- Original initial/final hash versions remain **16**; original victory seal **`0f0b85f5`**.
- Parent's schema/rules-17 migration yields current snapshot hash **`2142bf9e`** without
  replacing historical records, origin snapshot, checkpoints or battle rules.
- Record payloads: **80,185,627 bytes**; largest original record: **28,151 bytes**.
- Chunk store: **447 history blobs + one origin**, **1,344 payload replicas**.
  No-op save writes **zero history payloads**, not a new full-history copy.
- Injected quota failure during the real retained cold commit rolls back all new history
  and preserves the exact previous raw slot. A corrupted newest manifest recovers the
  preceding full generation and retains corrupt evidence instead of deleting it.

[ADR-R02.md](ADR-R02.md) records the independent bounds and formats: 64-MiB
snapshot/origin/manifest and compressed-file bounds; 128-MiB record total;
192-MiB logical envelope / stored history; 4-MiB new records; 16,384 history blobs.
Complete-or-error, never implicit truncation. DB schema remains 2; manifests become 2;
small envelopes stay 1, larger envelopes use 2 and a `TAC2`-prefixed gzip file.
Historical v1 reads/exports keep their prior bounds. A legacy prefix with a record
above 4 MiB cannot migrate into v2 chunk storage; refusal happens before publication,
so rotation cannot replace readable legacy generations with unreadable new ones.

## Real execution

Final focused command:

```text
pnpm exec vitest run packages/persistence apps/web/src/worker-queries.test.ts --maxWorkers=1
Test Files  3 passed (3)
Tests       39 passed (39)
Duration    4.23s
```

[verification-tests.log](verification-tests.log): **33 persistence tests + 6 existing
worker-query integration tests**, no skipped tests in this run. Tests cover legacy
raw/DB1/v1 manifests and genuine schema-12/13 histories, append/no-op/replay, UTF-8,
record/count/history budgets, forged fragment/manifest metadata, quota rollback,
replica corruption, prior-slot recovery, CRC/trailer/length corruption, concatenated
members, mismatched tags, compressed input bounds, and cancellation on invalid UTF-8.
The original guard failure is retained in [red-retained.log](red-retained.log).

Also pass:

- `pnpm typecheck` (root project).
- `pnpm exec tsc --noEmit -p docs/development/hermes-archive/tsconfig.json` (harness).
- `pnpm exec eslint packages/persistence docs/development/hermes-archive`.
- `git diff --check -- packages/persistence docs/development/hermes-archive`.

The earlier root typecheck failure in another owner's AI contact test was resolved by
that owner; no AI/sim/content/UI source was changed for this persistence work.

### Retained campaign runs

| Evidence | Verified scope |
| --- | --- |
| [retained-save-load.json](retained-save-load.json) | Node/fake-indexeddb cold save, no-op, complete load equality, quota rollback and corrupt-manifest fallback |
| [retained-portable.json](retained-portable.json) | Node complete export/import, snapshot + every nested historical value equal |
| [retained-replay.json](retained-replay.json) | Full historical replay from Node portable import |
| [retained-browser.json](retained-browser.json) | Actual Chromium 152.0.7977.82 IndexedDB, separate page reload, browser download, separate-page re-import |
| [retained-browser-replay.json](retained-browser-replay.json) | Node full historical replay of the actual Chromium-downloaded file; every order/result/event/checkpoint/battle verified |

Chromium cold save: **2.254 s**; load: **3.059 s**; complete export: **4.748 s**.
The browser-export full replay takes **63.157 s**. These are single diagnostic
samples on a shared workstation, not exclusive benchmark budgets or percentiles.
Node/fake-indexeddb timings are not disk latency. Chromium is real IndexedDB but
not a hardware-fsync or crash-durability certificate.

Peak Node process RSS, including source parsing and ownership/validation clones:
**2,741,140 KiB** for the final save/recovery harness; **1,599,868 KiB** for portable
roundtrip; **3,241,824 KiB** for browser-export full replay. Browser JS heap samples
are included in its report but are **not peaks**, retained-memory proof or whole-browser
RSS. The live journal and string APIs remain O(history); mobile-memory certification
is open despite bounded input and streamed compression/decompression.

Downloaded files:

- [retained-standard-long-748291.theandril](retained-standard-long-748291.theandril):
  **9,087,296 bytes**, SHA-256
  `e726e8575c9655b63266979d308d7b4c5b395653b6d06930a1c0ac14dd73b338`.
- [retained-browser.theandril](retained-browser.theandril): **9,032,092 bytes**, SHA-256
  `76bb55d90d3e7e5d78f036a22128ad3a1497b0efed1df6e4f8909ee7c64d1406`.

Serialization after schema parsing normalizes object field order, so portable bytes
can differ while every historical value and seal remains equal. Both complete replay
runs pass. Small compressed size is not substituted for logical-bound compliance.

## Reproduce sequentially

From `/home/telephoneheater/Work/Theandril`:

```sh
pnpm exec tsx docs/development/hermes-archive/retained-case.ts save-load
pnpm exec tsx docs/development/hermes-archive/retained-case.ts portable
pnpm exec tsx docs/development/hermes-archive/retained-case.ts replay
# With the existing local Vite app server available on 5173:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
  node docs/development/hermes-archive/retained-browser.mjs
pnpm exec tsx docs/development/hermes-archive/retained-case.ts replay-browser
```

The browser harness supports `ARCHIVE_TEST_SERVER` for another existing loopback
Vite server. It uses blank private pages and a named disposable database, imports
actual production persistence modules, verifies read-back and deletes the database.
It does not exercise player UI controls or inject simulation commands/resources.
A missing managed Playwright executable was resolved using the discovered system
Chromium; [browser-pilot-missing-executable.log](browser-pilot-missing-executable.log)
is a harness prerequisite failure, not a game failure.

## Ownership and remaining certification

Changed code/tests only:
`packages/persistence/src/{size.ts,index.ts,campaign-storage.ts,persistence.test.ts,campaign-storage.test.ts}`.
Reproduction scripts, format decision, reports, backups and harness typecheck config
are confined to this directory. **No worker/UI interface change is required**:
existing `saveCampaign`, `serializeCampaign` → `exportSave`, and `importSave` →
`deserializeCampaign` calls use the new bounded paths. No commit, push, provider or
original-audit mutation was performed. Parent owns canonical rules and status integration.

Still open: larger/Huge/Legendary and near-1,000-turn capacity, actual browser quota
exhaustion/process-kill recovery, Firefox/WebKit, user-control flows for this retained
large campaign, mobile/peak/sustained memory, and independent integration review.
The fixed finite budgets can still reject longer or incompressible histories. Reaching
a limit is explicit and preserves the prior slot, not a claim that every campaign fits.
