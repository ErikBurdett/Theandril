# Independent review: changelog batching

Reviewed on 2026-10-28 against baseline `7c003a0`. Scope: `scripts/build-changelog.ts`, `apps/web/src/updates/changelog.test.ts`, and `tests/changelog-builder.test.ts`. This was a read-only code review; the reviewer did not run tests or performance measurements during the separate timing window.

## Finding

**P2 — The initial batch output limit reduces supported history capacity.** The initial implementation allows 16 MiB of stdout per batch of 32 commits. The previous implementation used Node's default 1 MiB limit separately for each commit. A batch of 32 commits emitting 600 KiB each therefore succeeded previously but exceeds the new aggregate limit. This follows directly from the configured limits; the reviewer did not construct a large-output repository to reproduce it.

Preserve at least the previous per-commit capacity across the whole batch, including the new commit headers, or split batches when output exceeds the limit. The parent accepted a proposed 33 MiB limit per 32-commit batch, which exceeds `32 × (1 MiB + header overhead)`. At the time this review was recorded, that change was pending completion of the separate full-suite run. **Resolution has not yet been reviewed.**

## Other reviewed behavior

- The implementation retains `git show` and the previous numstat flags, avoiding a change to root or merge diff semantics. The independent fixture oracle runs the old single-commit, empty-format command rather than reusing the new header parser.
- Fixtures compare root, binary, empty commits, clean and conflict-resolved merges, rename handling, quoted tab/newline/control-character filenames, commit bodies, and authored notes. An empty filename is not a valid Git path; an empty commit is the relevant absence-of-statistics case covered here.
- The parser separates commit headers using literal control characters that Git quotes inside numstat filenames. Missing, duplicate, or unexpected commit headers reject the build rather than silently attributing statistics to another commit.
- Two workers allocate fixed batches synchronously. Results are assembled in the original metadata order, so asynchronous completion cannot reorder entries. A recorded failure prevents additional batches from starting, active workers finish, and the build rejects rather than returning a partial feed.
- Fixed 32-SHA argument batches bound command-line size independently of history length. The new shared output limit is the capacity issue described above; it is not a history truncation mechanism.
- Each `buildFeed` call freshly reads first-parent metadata, all selected commit statistics, and notes. The repository test still performs two independent reconstructions and compares the committed feed's exact suffix through the root. No shared reconstruction cache, skipped history, assertion weakening, or timeout increase was introduced; the configured test timeout remains 20 seconds.
- The asynchronous CLI awaits the completed feed before writing its output. The inspected callers await the new promise-returning API.

## Test coverage observation

The 36-commit fixture crosses a batch boundary and checks exact metadata order and empty/changed commit statistics. Error coverage includes an empty repository, a missing repository, and a missing blob whose commit metadata remains readable. It does not specifically force one worker to fail while another is active and additional batches remain queued; that is an optional coverage improvement, not a second identified correctness defect.

This review does not establish performance results, test-suite completion, deployment readiness, or 1.0 acceptance. Those remain separate evidence owned by the parent agent.

## Resolution review

The subsequent capacity correction was independently inspected on 2026-10-28. **The P2 finding is resolved in the reviewed code.** The original finding above is retained as the review history.

`CHANGELOG_GIT_LIMITS` now fixes batches at 32 commits, workers at two, and statistics output at 33 MiB. The actual statistics child invocation explicitly passes that 33 MiB limit; metadata retains the separate 16 MiB default. The statistics allowance exceeds `32 × (1 MiB + 128 bytes)`, covering every previously supported per-commit stdout size plus framing even with SHA-256 commit IDs. Argument size and worker concurrency remain bounded, and the correction does not alter parsing, ordering, history selection, failure handling, or test timeouts.

The added small regression checks the relationship between batch size and the old per-commit capacity, caps the resulting statistics limit at 33 MiB, and retains two workers. This is a configuration-capacity regression check; it does not construct a large-output repository or measure peak memory. Inspection confirms the tested limit is wired into the child process call.

No further blocking findings were identified. The reviewer performed no additional tests or benchmarks; final focused tests, typechecking, and repeat timing measurements remain the implementing agent's evidence.
