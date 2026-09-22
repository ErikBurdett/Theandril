# September 21 development release reconciliation

## Scope and authorization

The user asked to use the local DHARMA tracker to reconcile all completed Theandril features, commit and deploy the next release, merge or prune branches, and identify subsequent development. That explicit request supersedes the tracker's earlier owner-approval hold. This publishes a development checkpoint, not 1.0 acceptance. The tracker remains the project queue; the existing M0–M10 roadmap remains the development plan.

Implementation commit **`1e41ec24965e46e8035c57b4f54632a690b8b712`** records the previously reviewed campaign foundation work and its exact regression dependencies. [File inventory](inventory.md) explains the 248-file commit and retained rejected experiments. The public dispatch uses that immutable evidence pin; current publication verification is recorded here separately. Rules/save **17** and content **`b79c78ed`** are unchanged.

## Branch reconciliation and recovery

[Branch audit](branches.md), [local cleanup](branch-cleanup.json), [remote readback](remote-branches-after-cleanup.json).

- `checkpoint/campaign-safety-r17` and `feat/developer-dispatches` were already ancestors of master and are pruned locally. The remote checkpoint is also deleted with an exact-tip lease.
- `backup/campaign-safety-r17-a936fc3` is the superseded original checkpoint with the oversized trace. It contains no omitted gameplay implementation. A verified standalone Git bundle preserves it before branch deletion; it is not merged back into published history.
- The legacy `/home/telephoneheater/Work/Theandril-release` worktree is detached at its original `fcae402` commit. All **547** modified files retain identical hashes. They include 545 changed art reports and two compendium captures; their unreviewed input/metric changes are excluded from the release.
- Recovery artifacts remain local under `.git/codex-recovery/2026-09-21-release/`. [Metadata and hashes](recovery.json) describe the bundle, binary patch, file archive and manifest. The 1.26-GB bundle and unreviewed files are not committed or published.
- The temporary `feat/campaign-foundation-m0` integration branch was fast-forwarded to master, pushed and pruned. Only local and remote `master` remain. The primary checkout is on the published master; the final evidence/report follow-up changes documentation only.

## Fresh verification

Node **22.23.2**, unchanged repository test policies and acceptance budgets. No timeouts, activity requirements, assertions or gates were weakened. Browser checks use Chromium and the built `/Theandril/` path.

| Check | Result / evidence |
| --- | --- |
| Typecheck / lint | Pass: [typecheck](typecheck-final.log), [lint](lint-final.log). |
| New checkpoint regressions | **142/142**, eight files: [log](focused-checkpoint.log). Overlaps the full suite. |
| Journal and tooling | **44/44**, 16 files: [log](journal-tests.log); final extra link assertions pass in [3/3 follow-up](journal-links.log), overlapping counts. The [sandbox attempt](journal-tests-sandbox.log) is retained separately. |
| Unchanged full headless suite | **1,858/1,859**, 220/221 files, 90.55 s. Epic archive verification alone fails at **66.513 s / 60 s**: [log](full-headless.log). |
| Content / art | Pass: [content](content.log), [art](art.log); unchanged rules/content/runtime-art boundary. |
| Production build | Pass in 3.93 s: [log](build.log). Existing chunk-size warnings remain. |
| Production Pages browsers | **27/27**, 28.8 s: [log](browser-pages.log). Real game worker, paid orders, save/load, battlefield, fog, journal, roadmap and narrow/text-scale journeys. |
| Publication review | [Independent source, factual and visual review](journal-review.md); [author notes](journal-review-notes.md). [Exact current screenshots and provenance](screens/provenance.json). |

These tests do not substitute for complete gameplay, cross-browser or hosted campaign acceptance. The earlier affected-gameplay 25/25 result belongs to the unchanged gameplay implementation checkpoint and is retained in its own evidence; it was not rerun as a full gameplay suite here.

## Publication and next work

Release **`274d0e28c1ab9de4fc7fc43fde9f0579fc48fee4`** was pushed to master. [Pages run 35675919748](https://github.com/ErikBurdett/Theandril/actions/runs/35675919748) succeeded; both its build and deployment jobs passed. [Run metadata](pages-run.json), [job/step results](pages-jobs.json). The fourth dispatch updates the existing journal; historical dispatches retain their original evidence pins and no second roadmap is created.

The actual public site passes **27/27 production Chromium checks in 40.7 seconds**. [Raw live log](browser-live.log). An independent [live identity readback](live-identity.json) verifies the ledger's exact release SHA, fourth dispatch and immutable implementation links, explicit roadmap gate boundary, HTTP 200 responses and no page errors. These are live public URLs and real UI commands, not a local preview or mocked deployment.

[Verify campaign run 35675919711](https://github.com/ErikBurdett/Theandril/actions/runs/35675919711) failed at the same release: **1,855/1,859 tests**, 218/221 files, 354.21 seconds. Reported failed durations/limits are Epic archive **149.966 / 60 s**, Standard/24 contact **20.938 / 20 s**, Huge/32 contact **33.253 / 20 s**, and Epic seed-74 pacing **96.892 / 60 s**. All four fail by timeout; this does not establish that the final contact/victory assertions would fail. Later art, build, browser/gameplay and benchmark steps are skipped. [Raw failed log](verify-failed.log), [run](verify-run.json), [steps](verify-jobs.json), [structured summary](deployment-summary.json). Pages publication did not bypass or change the independent full verification workflow.

DHARMA's four relevant records were updated from these actual results under its existing timer lock, then the existing engine rebuilt the local site and Markdown. **ACT-17 is done; ACT-18 remains next; DH-015 remains open; ACT-21 remains backlog.** Previous fields/history and all unrelated records are preserved. The generated Theandril page contains both actual Actions links. [Input evidence](tracker-input.json), [apply result](tracker-apply.log), [verified records](tracker-update.json), [context readback](tracker-readback.txt). The context capture predates this final evidence commit, so its temporary uncommitted-file count is not the final checkout state. No weekly writer, external notification, tracker deployment or unrelated project mutation was invoked.

**ACT-17** is implemented by the committed checkpoint. **ACT-18 / DH-015** remain open: obtain two passing unchanged Epic/default-suite measurements and a complete green hosted Verify campaign run. M0 and all fifteen whole 1.0 gates remain open. Next feature work is M1 client contracts and contestable unification, followed by M2's magical-site/caster/counterplay loop and M3's empire delegation. The legacy worktree portion of **ACT-21** is preserved and reconciled, but its separate Hearth & Card scope remains untouched.
