# Pending-assault validation — second review fix

## Outcome and scope

Fixed the independently reproduced pending-assault contingent validation defect with one production-line change in `packages/sim/src/save.ts:853`. `battle.settlementId` is the existing assault discriminator (`string | null`); there is no new battle-kind field. Current assaults now validate the untargeted stable-ID contingent used by `startSettlementAssault`, while field battles still prioritize their named `defenderId`.

The original-envelope rule gate remains `originalVersion >= 17`; rule-16 saves still require the complete defending stack. Campaign/save versions, battle rules 10, the twenty-formation budget, payload fields and historical fixtures are unchanged. No warfare, movement, AI, persistence, UI, root status or repository skills were edited by this task. Root status/integration and independent re-review belong to the parent owner.

## Reproduction and strict TDD

1. Authored a valid `conquestCampaign` garrison at `settlement.6`: scout armies `army.100` (12 formations), `army.200` (4), `army.300` (9). Formation IDs are unique and sorted, `nextId` exceeds every serial, and authored sight is refreshed. Setup and each accepted declaration/besiege/end-turn boundary pass real save/load validation.
2. Normal current assault selects `army.100` + `army.200` (16), agrees with the canonical preview and round-trips exactly.
3. On a separate pre-assault copy, temporarily remove `army.100`, refresh sight, and execute the real assault. The engine produces internally consistent snapshots for `army.200` + `army.300` (13); that pending state loads successfully.
4. Restore `army.100` and refresh sight. Resealing rejects the omission with `Invalid save: battle omitted a defending army`. Change only `battle.defenderId` to `army.300`, then reseal again: production incorrectly accepts it.
5. **RED:** the new test failed at the final `toThrow` because the loader did not throw. Normal saves and the preceding omission rejection had already passed, ruling out fixture validation, stale indexing and checksum failures as the cause. The loader's targeted selector disagreed with the assault command's untargeted selector.
6. Change only the selector argument to `battle.settlementId ? undefined : battle.defenderId`.
7. **GREEN:** the same, unchanged single regression passed. Only afterward add unchanged-behavior rule-16 guards; no further production changes were needed.

The regression uses the real command engine and serializer, not mocked battle snapshots or an invalid checksum. The final focused file contains three tests. Additional guards prove exact rule-16 pending round-trips, rejection of resealed omissions for both representative IDs, version-16 rejection of a current reserve-containing assault, and atomic historical over-budget command refusal. Existing focused tests verify later-sorting field-target priority, 20/21/200 formation boundaries, naval reserves, militia assaults, pending continuation, capture timing, and independently captured rule-16 results/hashes.

## Actual verification

Runtime: Node `v26.7.0`, pnpm `10.32.1`, Vitest `4.1.11`. Exact commands and process exit codes are retained in the logs.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Tight RED, before production edit | 1 failed / 1 test, 1 file; exit 1 (expected unwanted acceptance) | `assault-red.{json,log}` |
| Tight GREEN, unchanged regression | 1 passed / 1 test, 1 file; exit 0 | `assault-green.{json,log}` |
| Focused sim regressions and preservation guards | 55 passed / 55 tests, 6 files; exit 0 | `assault-focused.{json,log}` |
| All sim and chronicle tests | 708 passed / 708 tests, 62 files; exit 0 | `assault-sim-chronicle.{json,log}` |
| Whole-repository typing | `pnpm typecheck`; exit 0 | `assault-typecheck.log` |
| Scoped ESLint and whitespace/diff checks | exit 0 | `assault-lint-diff-final.log` |

All test invocations have zero pending/todo tests. Counts were independently recomputed from each JSON report's assertion results and checked against its declared totals; focused tests overlap the full sim/chronicle run and must not be added to it.

The initial combined lint/diff invocation ended with exit 1 and empty output because `git diff --no-index --check /dev/null <new-test>` reports the new-file difference. This was not relabeled as success: `assault-lint-diff.log` is retained, and the final invocation separately verifies ESLint, the tracked save diff and explicit new-file whitespace/EOF checks with exit 0. A test-file patch attempt also stopped atomically on ambiguous context; retrying with unique surrounding lines succeeded without partial edits.

## Exact change and provenance

- Modified: `packages/sim/src/save.ts` — only the one-line selector argument change, relative to this task's already-dirty preimage.
- Created: `packages/sim/src/pending-assault-save.test.ts` — focused regression plus rule-16 preservation guards.
- Created: this task's `docs/development/review-fix-2/assault-*` evidence. The complete path inventory is in `assault-files.json`.

`assault-baseline.log` retains the base revision, runtime, source hashes and pre-existing save diff. `assault-fix.patch` is the isolated task-only production diff, not the parent owner's earlier version-17 work. Reversing this single line reproduces the exact captured preimage SHA-256; sampled protected gameplay sources and both frozen rule-16 fixture hashes remain identical. `assault-verification.json` retains the checked hashes, isolated patch and recounted test results.

- Save preimage SHA-256: `a4e80d17de3d88cf5eb7dc9784962c0f8c2024beba2a1c046b28dfe6d5b5060b`
- Save postimage SHA-256: `217673aa986ece9dcdc6472eacb225b7790ff9847553b2d0fb14511cc77f68a9`
- Final regression SHA-256: `5c43163a8ebb02115c35878301db1089950dd268c7b6c35b422322c98ffe1c4d`

No remaining blocker for this scoped fix. No commit, push, stash, reset, installation, provider call or deployment occurred. Whole-project build/browser/release acceptance and unrelated active owners' work were not claimed as verified by these checks. This validation-only fix does not change a turn hot path or require a new tactical budget.
