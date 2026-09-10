# JOURNAL-01 / 02 / 03 bounded fixes

Only these existing files changed from the reviewed postimages:

- `apps/web/src/updates/Journal.tsx`: featured checkpoint uses `featured.sourceRevision.slice(0, 7)`.
- `apps/web/src/updates/journal.ts`: full-story search includes takeaways.
- `apps/web/src/updates/journal.test.ts`: renders the real Journal with two different story revisions (restoring catalog/global state); searches `complete-or-error` and requires `Keeping the whole record`.
- `apps/web/src/updates/validation.test.ts`: validates each unique revision/path pair across stories, library, scope ledger and image sources. The shared-path regression uses real Git objects: the summary exists at `8b3b8c148b7e8ee3689001210033fee7a1b8a6ef`, but not at `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`. Both story orders must reject the missing object; duplicate valid pairs pass.

No content, artwork, game/AI code, integration files or workflows changed. No installs, browser runs, commits, pushes or deployment were performed. Parent owns integration/status updates and publication.

## Execution evidence

Run from `/home/telephoneheater/Work/Theandril-release`; each log contains actual command output, not synthesized results. Each issue completed RED then GREEN before the next issue's implementation.

| Log | Command | Exit / result |
| --- | --- | --- |
| `JOURNAL-01-red.log` | `pnpm exec vitest run apps/web/src/updates/journal.test.ts` | 1; expected checkpoint 1234567, received hardcoded 8b3b8c1 |
| `JOURNAL-01-green.log` | same | 0; 2 passed |
| `JOURNAL-02-red.log` | `pnpm exec vitest run apps/web/src/updates/validation.test.ts` | 1; missing revision/path was silently overwritten, validation did not throw |
| `JOURNAL-02-green.log` | same | 0; 5 passed |
| `JOURNAL-03-red.log` | `pnpm exec vitest run apps/web/src/updates/journal.test.ts` | 1; takeaway-only search returned no stories |
| `JOURNAL-03-green.log` | same | 0; 3 passed |
| `journal-suite-green.log` | `pnpm exec vitest run apps/web/src/updates` | 0; 15 passed in 5 files, including strengthened JOURNAL-02 order/duplicate assertions |
| `typecheck.log` | `pnpm typecheck` | 0 |
| `scoped-lint.log` | `pnpm exec eslint apps/web/src/updates` | 0 |

## Exact delta and preservation proof

- `journal-fixes.diff` is against the original reviewed postimages, **not HEAD**. SHA-256: `1b242ee2be1264cd46e41e313930ba02b925f9a88f4dee0329c2505db6bb7797`.
- `original-postimages.sha256` copies the untouched review manifest; `postimages.sha256` contains the current hashes for all 26 reviewed files.
- `verification.json` records that all 26 original postimages matched before editing; the delta applies cleanly to those bytes and reconstructs the current files byte-for-byte.
- Of 16,098 baseline files checked, only the four named files changed. All other 492 baseline files under `apps/` and `packages/` and 256 original dispatches evidence files remained byte-identical. This preserves pre-existing unrelated work, rather than asserting the worktree was clean.
- The original `/tmp/theandril-dispatches-journal-review-WMUDLt/journal.diff` and `postimages.sha256` remain intact with their recorded hashes.
- `verify-delta.py` is the original capture/verification helper, not a read-only verifier: it rewrites the patch and manifests. Do not rerun it over frozen review evidence. The independent final reviewer instead applied the actual retained patch to hash-verified originals in a disposable directory and compared resulting bytes without regenerating the evidence.

New files are confined to this evidence directory: this README, the nine execution logs above, `journal-fixes.diff`, `original-postimages.sha256`, `postimages.sha256`, `verification.json`, and `verify-delta.py`.
