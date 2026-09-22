# Deployment and branch reconciliation from DHARMA — 2026-09-21

## Prompt

Use the new local DHARMA tracker to bring Theandril's deployment up to date with completed features, reconcile committed files, deploy the next release, merge or prune all relevant branches, and identify next development.

## Delivered

The completed campaign foundation work is committed and deployed at **`274d0e28c1ab9de4fc7fc43fde9f0579fc48fee4`**, including implementation checkpoint **`1e41ec24965e46e8035c57b4f54632a690b8b712`**. Players receive the reviewed paid-harbor/founder-planning corrections and exact-output movement, observation, save ordering, replay comparison and technical-record optimizations. Rules/save remain **17**, content **`b79c78ed`**; there is no new gameplay schema or runtime artwork.

The [live game](https://erikburdett.github.io/Theandril/), [fourth developer dispatch](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order) and [existing roadmap](https://erikburdett.github.io/Theandril/updates/roadmap/) are updated. The article uses exact reviewed screenshots and immutable implementation evidence; historical dispatch pins remain unchanged. This is a development deployment with all fifteen whole 1.0 gates open.

DHARMA records **ACT-17 done**, **ACT-18 next**, **DH-015 open** and **ACT-21 backlog**. Its local site/Markdown were rebuilt, and the generated Theandril page contains the actual Pages and failed Verify links. [Tracker evidence](../2026-09-21-release-reconciliation/tracker-update.json).

## Changed

- Committed previously completed AI/sim/mapgen/chronicle implementations, eight regression files, required fixtures and source/review evidence: [inventory](../2026-09-21-release-reconciliation/inventory.md).
- Updated the existing journal catalogue, evidence links, roadmap snapshot, image metadata, image reproduction script and corresponding tests. Current source pin is `1e41ec2`; earlier dispatches retain theirs.
- Updated canonical implementation status, deployment instructions, work packet and this prompt report. Final post-deployment evidence is a documentation-only follow-up to `274d0e2`; it does not change game or journal behavior.
- Fast-forwarded the integration branch into master and pushed. Pruned local `checkpoint/campaign-safety-r17`, `feat/developer-dispatches`, `backup/campaign-safety-r17-a936fc3` and the temporary `feat/campaign-foundation-m0`, plus the obsolete remote checkpoint. Only local/remote master remain. The primary checkout was synchronized to the deployed commit and remains the publication checkout.
- Preserved the superseded backup tip in a verified standalone local Git bundle. Detached the legacy release worktree at its original `fcae402` without changing any of its **547** dirty files; retained a patch, archive and exact hashes. [Branch audit](../2026-09-21-release-reconciliation/branches.md), [cleanup](../2026-09-21-release-reconciliation/branch-cleanup.json), [recovery](../2026-09-21-release-reconciliation/recovery.json). No missing gameplay branch needed an additional merge.

## Verified

Fresh Node 22.23.2 typecheck, lint, content/art validation and production build pass. The eight new regression files pass **142/142**; journal/tooling checks pass **44/44** with a subsequent overlapping **3/3** link check. The unchanged full local suite is **1,858/1,859**, failing only Epic archive at **66.513 seconds / 60 seconds**. No acceptance budget or assertion was weakened. [Complete evidence table and logs](../2026-09-21-release-reconciliation/README.md#fresh-verification).

The locally built Pages candidate passes **27/27** in 28.8 seconds. Independent [publication review](../2026-09-21-release-reconciliation/journal-review.md) approves source, facts, image provenance and all five retained visual captures; its accessibility and image-text limits remain recorded.

[Pages run 35675919748](https://github.com/ErikBurdett/Theandril/actions/runs/35675919748) successfully built and deployed exact revision `274d0e2`. The **actual public site** passes **27/27** production checks in **40.7 seconds**, covering the real worker/game, approved resources, paid orders, save/load, battle/fog and public-site journeys. [Live browser log](../2026-09-21-release-reconciliation/browser-live.log). Independent [live identity readback](../2026-09-21-release-reconciliation/live-identity.json) confirms that exact revision, the new dispatch, source links, HTTP responses and no page errors.

At the same revision, [Verify campaign 35675919711](https://github.com/ErikBurdett/Theandril/actions/runs/35675919711) passes **1,855/1,859** in 354.21 seconds, with four timeouts: Epic archive **149.966 / 60 s**, Standard/24 contact **20.938 / 20 s**, Huge/32 contact **33.253 / 20 s**, and Epic seed-74 pacing **96.892 / 60 s**. Later art/build/gameplay/benchmark steps are skipped in that workflow. [Exact results](../2026-09-21-release-reconciliation/deployment-summary.json). These failures are retained openly; the separate development Pages workflow is not full release acceptance.

## Not done / blocked / caveats

DH-015, M0 and every whole 1.0 gate remain open. Scoped production Chromium checks do not certify the full gameplay suite or other browsers. The legacy worktree's unreviewed report/screenshot changes are preserved and excluded, not declared finished features. The separate Hearth & Card worktree and unrelated tracker projects are untouched, so ACT-21 is not closed. Recovery bundles stay local; no secret, oversized trace or unreviewed art report was added to the deployment.

The project-trackers, Theandril core/release-QA and art QA/provenance skills guided this work. The tracker supplied context; its earlier owner-approval hold was superseded by this explicit deployment request. No weekly writer, external message, tracker cloud deployment or timer change was performed.

## Follow-ups

1. **ACT-18 / DH-015:** profile the actual default-suite Epic workload and hosted timing failures; preserve deterministic commands, hashes and saved results. Obtain two passing unchanged local full runs and a complete green hosted Verify campaign before closing M0.
2. **M1:** implement paid client/tributary contracts, visible obligations, refusal/breach/expiry and AI responses, then the distinct contestable unification victory. Preserve real rules-17 historical fixtures through any explicit migration.
3. **M2:** complete discovery of magical sites through resources, research, qualified casters and paid counterplay.
4. **M3:** add settlement delegation, coordinated army orders and grouped actionable alerts that remain usable at large empire scale.

These are the existing [M0–M10 roadmap dependencies](../../1.0-DEVELOPMENT.md#active-development-roadmap), not a new parallel plan or newly completed features.
