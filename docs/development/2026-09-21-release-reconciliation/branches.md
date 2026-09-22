# Branch and worktree reconciliation audit

Read-only audit captured September 21, 2026 (America/Chicago), beginning September 22 at 00:39 UTC. This records the state before release integration or branch cleanup; disposition below is a recommendation, not a claim that deletion or deployment occurred. The parent release report records the completed actions.

## Committed history

Primary checkout: `/home/telephoneheater/Work/Theandril`, branch `master`, commit `f07024fe23ad3386874656d48fbbc33a5380d979`. Remote: `https://github.com/ErikBurdett/Theandril.git`.

| Ref | Tip | Commits only on master / only on branch | Exact merge base with master | Disposition |
| --- | --- | --- | --- | --- |
| `checkpoint/campaign-safety-r17` | `8b3b8c148b7e8ee3689001210033fee7a1b8a6ef` | 7 / 0 | Same as branch tip | Already integrated; local and remote refs can be pruned. |
| `feat/developer-dispatches` | `fcae402da6c290b93a9a6933510c74538477ad04` | 2 / 0 | Same as branch tip | Already integrated; detach the dirty linked worktree at this same commit before pruning the local branch. |
| `backup/campaign-safety-r17-a936fc3` | `a936fc36d4281ef2274c0a70306e3370d847d964` | 8 / 1 | `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd` | Replaced by the publishable checkpoint; preserve the original commit in a verified local recovery bundle, then prune. Do not merge it. |

Evidence commands: `git rev-list --left-right --count master...<branch>`, `git merge-base master <branch>`, `git merge-base --is-ancestor <branch> master`, and `git log --oneline master..<branch>`. The ancestor checks exit 0 for checkpoint and developer-dispatches, and 1 for the backup. The backup is not patch-equivalent according to `git cherry`, because the replacement deliberately changes three paths.

GitHub's branch API returned only `master` at `f07024fe23ad3386874656d48fbbc33a5380d979` and `checkpoint/campaign-safety-r17` at `8b3b8c148b7e8ee3689001210033fee7a1b8a6ef`, both unprotected. `GET /repos/ErikBurdett/Theandril/pulls?state=all&per_page=100` returned an empty array. There were no local tags at inspection. These API reads confirm the initial remote state independently of stale tracking refs; the parent performs fetch and final reconciliation.

## Why the backup must not be merged

The two checkpoint commits share parent `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`. Comparing their complete trees with `git diff --name-status a936fc3 8b3b8c1` produces exactly:

1. Modified `.gitignore`, adding the oversized trace exclusion.
2. Added `docs/development/github-checkpoint-a936fc3.json`, recording the deliberate replacement.
3. Deleted `docs/development/hermes-ui/r03-preview-ui-green-v2/battle-defense-R03-public--a258a-later-defeat-before-capture/trace.zip`, a 163,636,513-byte blob.

All gameplay source, tests, and other evidence from the original commit are already present in the replacement and reachable from master. Merging the old backup would reintroduce the oversized blob into published history without adding missing gameplay work.

The trace is still present at the ignored path in the primary checkout and at `/home/telephoneheater/Work/Theandril-local-backups/a936fc3-4ltfhwyo/trace.zip`. Both copies were read and match SHA-256 `65f4b66fd9b4a2d849048e1f3942ac9141b00e6906247eafa2cbad9af4629080`, exactly as the historical checkpoint record specifies. The external backup also contains `recovery.json` (549 bytes, SHA-256 `0b58a5248aa91fdf1e60cc674bf6d7c12f8c2c400697d1a77d6e82e0efeca7f8`). These files preserve the trace, but do not themselves preserve the original commit graph; create and verify a durable local Git bundle before deleting the backup branch. A local archival tag is another preservation mechanism, but must never be pushed indiscriminately with `--tags`.

## Dirty worktrees

The primary checkout contains the current September 21 campaign work, which has not been committed at the audit baseline. Initial status showed 13 modified tracked files and 235 untracked files (including evidence and test fixtures), no staged files. The parent release owner must review and commit the selected source, tests, canonical status, and evidence together. This count is a baseline snapshot; the ongoing release task creates additional files.

The linked checkout `/home/telephoneheater/Work/Theandril-release` is on `feat/developer-dispatches` at `fcae402da6c290b93a9a6933510c74538477ad04`, with **547 modified tracked files**, no staged files, and no untracked non-ignored files:

- 545 `assets/art/reports/*.json` files. Every report changes `inputHash`, `specificationHash`, and `metrics`. Across the reports, 1,425 frame metric hashes differ, along with bounds, pixel counts, and other metrics. These are not timestamp-only changes. No matching tracked source-art or specification changes appear in that worktree's status.
- `docs/development/site-expansion/compendium/screens/compendium-1440.png`, SHA-256 `d7abf657e63e090ae129109043f62028c4be45139f3ecacec1430b325661b1c7`.
- `docs/development/site-expansion/compendium/screens/compendium-390-130.png`, SHA-256 `ea19071bba145876b3fc0da15671a445eb5b9d7f6cdca2f155632a153071c7aa`.

All 547 files differ from the primary checkout as well. The binary patch against that worktree's HEAD is 11,311,542 bytes. This audit does not establish these generated reports or screenshots as approved replacement art evidence. Preserve the files and a binary patch with a hash manifest; do not silently discard them or publish them as completed features.

## Safe cleanup sequence for the integration owner

1. Fetch the origin and recheck the branch tips and ancestry before mutation.
2. Preserve the original backup commit in a durable local bundle; verify it with `git bundle verify` and confirm its listed head equals `a936fc36d4281ef2274c0a70306e3370d847d964`.
3. Preserve the release worktree's binary patch and a SHA-256 manifest of all 547 changed files outside published content. Record the recovery location in the final report.
4. Detach the linked worktree **at its existing commit**: `git -C /home/telephoneheater/Work/Theandril-release switch --detach fcae402da6c290b93a9a6933510c74538477ad04`. Verify all file hashes remain unchanged. Do not remove or reset the dirty worktree.
5. Remove the two proven integrated local branches with `git branch -d checkpoint/campaign-safety-r17 feat/developer-dispatches`; delete the remote checkpoint ref after the remote recheck. No merge commit is necessary.
6. Once preservation is verified, remove the deliberately replaced backup ref with `git branch -D backup/campaign-safety-r17-a936fc3`. The forced branch deletion is appropriate only because its sole unique commit is intentionally replaced and independently recoverable; it must not be used as a generic cleanup shortcut.
7. Commit, verify, and deploy the reviewed primary-checkout changes through the existing workflow. Confirm the primary checkout and remote master agree afterward, and report any retained detached worktree separately from active development branches.

No Git ref, index, worktree content, deployment, or external backup was changed by this audit. Only this report was authored.
