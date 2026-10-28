# Bounded concurrent history reconstruction — 2026-10-28

Baseline: 7c003a0. This fixes the documented changelog-check timing pressure while
preserving exact first-parent history, root/merge semantics and authored notes.
No test is disabled, cached or granted a longer deadline. No CI deep-test step is
added. Gameplay, canonical state, saves, AI and content are unaffected.

## Implementation and independent oracle

The builder requests explicit SHA batches using the same pinned Git show options.
At most two stat subprocesses run at once; batches contain at most 32 commits.
Metadata order determines the output regardless of completion order. Missing or
duplicated boundaries reject the result. A subprocess failure stops further
scheduling and drains already-active children before rejecting the entire build.
The API/CLI and sole test callers now await complete reconstruction.

[Original builder](baseline-builder.txt), [exact pre-change feed](baseline-feed.json)
and [baseline measurements](baseline-evidence.json) were captured before edits.
An independent per-commit test oracle covers root, binary, empty commits, quoted
filenames, rename behavior, bodies, notes and clean/conflicted merges; another
case crosses the batch boundary. Missing-blob failure rejects instead of returning
a partial or cached feed. The existing determinism test still rebuilds twice,
checks the entire committed rootward suffix and retains its 20-second timeout.

## Measurements and review

[Initial quiet benchmark](benchmark-initial.json) reconstructs all 116 entries and
91,905 bytes exactly, SHA256 57e707fd51d5a69c50ce1bf799872d8533864507e68fb2d43277a9efd303ee5d.
Median wall time falls from 7.880s to 4.860s in three alternating old/new pairs.
Subprocess count falls from 117 to 5 per build; no cache or omitted history is used.
These measurements include Git, parsing, note reads and JSON serialization but
exclude Node startup and concern this repository/history on this workstation.
They do not predict arbitrary future history sizes or hosted runner timing.

[Independent review](review.md) found an aggregate-output capacity edge case in
the initial 16MiB batch limit. The corrected statistics bound is 33MiB for 32
commits, preserving each old 1MiB output plus framing; metadata remains 16MiB.
The reviewer confirms the finding resolved. [Final focused checks](tests-final.log)
pass 10 tests, retaining two fresh complete reconstructions and the unchanged
20-second timeout. [Final quiet benchmark](benchmark-final.json) matches the same
baseline exactly in 4.865/4.867/5.026 seconds; median 4.867s, about 38% below the original
7.880s. Original measurements are retained separately.
[Initial tests](tests-initial.log) retain an incorrect clean-merge fixture
expectation; the legacy oracle already matched. [Corrected focused tests](tests-batching.log)
pass without changing Git behavior or existing assertions/timeouts.

Final work-tree integration (also containing pending land-template work) passes
**2,519 tests / 305 files in 118.74 seconds**, including the unchanged 20-second
history check. [Full tests](integration-tests.log), [typecheck](integration-typecheck.log),
[lint](integration-lint.log) and [production build](integration-build.log) pass.
The earlier integration before the capacity correction passed 2,518 tests; the
extra capacity regression is included in this final all-green run. Tooling files
will be committed and deployed separately from the pending gameplay templates.
Exact published artifact verification is recorded after completion below.
