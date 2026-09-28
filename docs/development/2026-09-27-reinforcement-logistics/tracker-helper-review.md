# Tracker helper source review

Initially reviewed 28 September 2026 by the journal-test/UI agent, independently of the helper's author. This agent authored earlier UI and acceptance work and the publication test updates, but did not author the original helper. The initial review was read-only: helper source, tracker procedure, current `tracker-context dharma --project Theandril` output and retained packet facts. No helper invocation, tests, network operation or tracker write was performed during that review. The requested corrections and isolated verification are recorded separately below.

Reviewed helper: `/tmp/theandril-record-reinforcement-logistics.py`, SHA-256 `cf0339822d55c4a70fcf944dd5139b14dd0bd778452ca3fdd70cd66b269d4e7b`. Intended implementation P1 is `f33a816f3a853229695b902af007e4e3f3547275`; publication P2 is `abb2369fd289a549c59704fbbe4aa6fb8354bafb`. Final deployment/readback metadata and the sealed proposal were not yet available for this review.

**Initial verdict: write scope and status preservation pass; application approval remains conditional on the two guard corrections below and review of the final metadata/proposal.**

The helper writes only DHARMA `actions.json`, `projects.json` and `issues.json`, plus private backups and temporary replacement files. `resources.json` is read-only. The default and template paths do not write; application requires the exact proposal seal, which includes helper, metadata, input, output and evidence hashes. It performs local Git reads and has no fetch, deployment, inventory or build call.

Input guards require ACT-32/ACT-33 `doing`, ACT-38 `backlog`, ACT-36 `done`, DH-021 `open`, DH-020 `resolved`, and M3/M4 `in-progress`. Deep-copy updates target ACT-32, ACT-33, ACT-38, DH-021 and the Theandril roadmap; those statuses and unrelated records remain unchanged. History is appended and duplicate publication recording is refused. The proposed notes distinguish editorial bullet counts from fixed-scope completion, retain all fifteen open gates and make no organic-adoption or pacing-band acceptance claim.

Evidence checks require source ancestry, the exact publication at HEAD and fetched origin/master, pinned source/publication bytes, hashed later live evidence, seven separate verification scopes, matching local/live browser identities, clean final logs, successful exact-revision workflow records and matching built/live assets. Performance inputs require final source-pinned Huge/Legendary scopes and eighteen distinct paired rules 33/34 pacing rows. These are evidence-linkage checks, not an independent rerun or proof of live deployment.

Two corrections were reported to the parent before any application:

1. **Exact catalogue counts are not guarded** (`release`, reviewed lines 117–118). The arithmetic checks would accept a reconciled stale 68-delivered/49-remaining catalogue. Require this release's 78 delivered, 49 remaining, 127 total, 23 items and status counts 6 completed / 13 in progress / 4 pending. The final preview must retain the explanation that this denominator is editorial.
2. **A rollback error can prevent later rollback attempts** (`apply`, reviewed lines 184–187). A read or restore failure on an earlier written path exits the rollback loop, potentially leaving later unchanged writes applied and replacing the original failure. Handle each rollback attempt independently; retain the original error and report any rollback failures and backup location. Preserve the existing rule that concurrently changed bytes are never overwritten.

The normal write path stages all replacements and fsyncs their contents and backups, checks all three current files before each replacement, then verifies the outputs. Replacements are atomic per file, explicitly not one transaction across all three files. The source does not establish process-kill durability or eliminate the interval between a comparison and a replacement; no such stronger guarantee is approved here. Final application still requires a fresh, reviewed preview against unchanged tracker inputs and actual deployment evidence.

## Correction and isolated verification addendum

At the parent's request, this reviewer authored the two narrow corrections in the temporary helper. The original independent findings above are preserved; this addendum discloses authorship of their fixes rather than claiming an independent review of those edits.

The corrected helper is SHA-256 `1bf410c8c8a3b0dee1c78d9fbe4b48f64422944fdc4be0b4beb16507d138e969`. It now requires exactly 78 delivered / 49 remaining / 127 total editorial statements, 23 items and unchanged 6/13/4 statuses. Rollback attempts each written file independently, preserves the original exception object, and attaches backup location, rollback errors and cleanup errors as exception notes. It checks bytes both before staging a restoration and immediately before replacement; observed concurrent changes remain untouched. Temporary replacement paths are registered before their contents are written so failed staging can also be cleaned up.

`python3 /tmp/theandril-tracker-helper-review-tests.py` passed **8/8 tests in 0.005 seconds**, with four catalogue variants inside one test. Every apply target, evidence file and backup was inside an isolated `TemporaryDirectory`; the helper's real input reader was replaced with a failing sentinel. Catalogue checks used in-memory evidence and mocked Git calls. Neither the helper CLI nor real tracker paths were used, and no network or deployment call occurred.

The retained checks verify:

- Successful application writes exact outputs, preserves target permissions, makes exact private backups and leaves no staged temporary files.
- Failure on the second replacement restores the first file and rethrows the identical original exception.
- Failure on the third replacement plus failure restoring the second file still restores the first; the original exception and rollback failure remain separately visible.
- Concurrently changed bytes survive both a later write failure and a change made while a rollback file is being staged.
- A staged-file cleanup failure is attached to the original failure without masking it; other files are restored.
- Changed evidence refuses all writes.
- The current 78/49/127 and 23-item 6/13/4 catalogue passes its guards; stale 68/49/117 counts, regrouped statuses and an extra item are refused.

Retained local verification source: `/tmp/theandril-tracker-helper-review-tests.py`, SHA-256 `caaae81a66038e2e4b5ff227ae4d472c9e78d8abe1ba87b962646710105ab331`. Output: `/tmp/theandril-tracker-helper-review-tests.log`, SHA-256 `af8812b02dedaa9cc3a25a16349a8708922e6d0e9d8a3702b9d655beee7ee914`.

**Updated verdict: both reported defects are corrected and the isolated checks pass.** No real application was performed. Final live metadata and a newly generated proposal seal still require review; the original seal, if one existed, cannot authorize this changed helper. The per-file atomicity and process-kill/concurrency limits stated above remain unchanged.
