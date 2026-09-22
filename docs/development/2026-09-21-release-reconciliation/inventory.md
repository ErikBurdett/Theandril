# Reviewed development-release inventory — 21 September 2026

## Scope and authorization

The current user request authorizes reconciling completed work, committing it, updating Theandril's deployment, and merging or pruning branches where appropriate. This authorization supersedes earlier prompts' lack of permission to publish. Earlier reports correctly retain their historical statements that no commit, push or deployment occurred during those prompts.

This inventory recommends a **development-demo checkpoint**, not a 1.0 release. It does not claim that tracker item **DH-015**, M0 or any whole release gate is closed. The parent owns integration, current verification, Git operations and deployment readback. The inventory reviewer inspected source, dependency closure and retained evidence without changing runtime code or rerunning tests.

The initial inspection found **13 modified tracked files and 235 untracked files**, totaling **18,046,677 bytes of untracked content**. These counts precede this release-reconciliation directory and subsequent publication edits. The largest untracked file was the 1,844,352-byte observation baseline. No untracked symlinks, unexpected generated directories or files outside the intended package/evidence/report groups were found.

## Completed changes eligible for the checkpoint

| Change | Runtime and regression paths | Evidence |
| --- | --- | --- |
| Count an already paid queued harbor toward the isolated realm's outlet commitment; share geography when considering waiting founders | `packages/ai/src/naval.ts`, `packages/ai/src/naval-outlets.test.ts` | [Roadmap-start naval evidence](../2026-09-21-roadmap-start/naval/README.md) |
| Avoid movement work that cannot improve a route; publish target previews without unused overlays; reuse search-local neighbor storage and omit an unused range predecessor map | `packages/sim/src/movement.ts`, `packages/sim/src/index.ts`, `packages/mapgen/src/index.ts`; movement-search, movement-preview and neighbors-into tests | [Original movement comparison](../2026-09-21-roadmap-start/performance/README.md), [preview compatibility](../2026-09-21-campaign-continuation/movement-preview/README.md), [allocation evidence](../2026-09-21-epic-baseline/movement/README.md) |
| Construct complete observations and land details with fewer temporary copies | `packages/sim/src/simulation.ts`, `packages/sim/src/territory.ts`, `packages/sim/src/observation-publication-equivalence.test.ts` | [Observation captures and measurements](../2026-09-21-campaign-continuation/observations/README.md) |
| Use native integer sorting for eligible unordered explored-cell lists while retaining fallback semantics | `packages/sim/src/save.ts`, `packages/sim/src/canonical-cells.ts`, `packages/sim/src/canonical-cells.test.ts` | [Serialization evidence](../2026-09-21-campaign-continuation/serialization/README.md) |
| Compare complete ordinary archive JSON trees without repeatedly encoding them; preserve technical export bytes through direct sorted formatting | `packages/chronicle/src/index.ts`, `packages/chronicle/src/json-equivalence.ts`, `packages/chronicle/src/json-equivalence.test.ts` | [Replay review](../2026-09-21-roadmap-start/review/chronicle.md), [formatting evidence](../2026-09-21-campaign-continuation/performance/README.md) |
| Prepare naval geography/navigation only when the current plan consumes it | `packages/ai/src/naval.ts`, `packages/ai/src/naval-publication-equivalence.test.ts` | [Complete retained proposals, paid voyage and measurements](../2026-09-21-epic-baseline/ai/README.md) |
| Preserve historical compendium screenshots by writing new captures into the current Playwright result directory | `tests/gameplay/compendium.spec.ts` | [Final browser evidence and review](../2026-09-21-epic-baseline/review/final.md) |
| Record ordered development milestones, actual status and reviewed checkpoint evidence | `docs/1.0-DEVELOPMENT.md`, `docs/IMPLEMENTATION_STATUS.md`, prompt reports, draft developer packet and existing public catalogue | [Canonical workflow and roadmap](../../1.0-DEVELOPMENT.md), [draft packet](../../updates/campaign-foundation-work-packet.md) |

Runtime rules/save remain **17** and content remains **`b79c78ed`**. This checkpoint does not introduce a schema migration, new artwork or a new victory path. The final evidence manifest contains 614 runtime/test/config/input paths; all 614 matched current file SHA-256 values during the initial inventory. Subsequent publication changes need their own recorded verification and source identity.

## Exact regression dependency closure

The new tests are not self-contained without their retained documentation fixtures. Commit these inputs with the tests:

| Test | Required currently untracked inputs |
| --- | --- |
| `packages/sim/src/movement-preview.test.ts` | `docs/development/2026-09-21-campaign-continuation/movement-preview/corpus.ts`; `docs/development/2026-09-21-campaign-continuation/movement-preview/baseline.json` |
| `packages/sim/src/observation-publication-equivalence.test.ts` | `docs/development/2026-09-21-campaign-continuation/observations/baseline.json` |
| `packages/ai/src/naval-publication-equivalence.test.ts` | `docs/development/2026-09-21-epic-baseline/ai/complete-proposals-before.json` |

The preview corpus imports the ordinary simulation implementation. The observation fixture embeds its captured data. The naval proposal fixture references these nine compressed saves, all present and already tracked:

```text
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-1.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-30.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-60.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-100.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-200.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-300.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-500.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-800.json.gz
docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/turn-808.json.gz
```

The other new tests use tracked sources/fixtures or values within their own source. The chronicle equivalence test's `packages/chronicle/src/fixtures/v15-development-baseline.json` already exists in Git. No external generated fixture or ignored local-only file is required by the added tests.

## Deferred work and retained experiments

Client contracts, client capture/transfer outcomes, contestable unification, the complete magical-site/caster/counterplay loop and empire delegation remain future implementation. The retained M1 notes and genuine rules-17 migration fixture prepare that work; they are not delivered gameplay.

The encoded hash projection/cache, alternate checksum kernels, primitive validation wrapper and parallel-array movement heap were rejected. Archive validation reuse and a shared preview session were investigated without adoption. Worker-cap diagnostics did not justify a scheduling change. These candidates and failed attempts remain under the three dated evidence directories, clearly identified by their reports. No production module imports their candidate implementations. Retain the evidence because its reports/reviews link it and it explains the rejected paths; committing audit artifacts does not ship them as game code.

## Known verification limitation

The latest retained unchanged default headless run passes **1,857/1,858 tests across 220/221 files**. Epic is the sole failure at **64.779 seconds against its existing 60-second limit**. Eight-worker and four-worker diagnostics also fail that limit; no cap or timeout change was adopted. Typecheck, lint, content/art validation and production build pass. Scoped Chromium gameplay passes **25/25** and production Pages passes **27/27**. These are retained results, not a fresh run by this reviewer. [Exact source, logs and limitations](../2026-09-21-epic-baseline/README.md).

The [Pages workflow](../../../.github/workflows/pages.yml) explicitly publishes a development demo and performs its own validation/build/browser checks. The independent [campaign verification workflow](../../../.github/workflows/verify.yml) retains the complete campaign and benchmark checks. A successful Pages deployment therefore does not establish full-suite acceptance. Preserve the Epic failure visibly in the current release description, tracker state and next-development priorities.

## Hygiene and commit recommendation

- Initial `git diff --check` passed. A content-pattern scan of all initially dirty/untracked files found no private-key, GitHub token, AWS access-key, OpenAI key or password-literal matches. This is a bounded scan, not a guarantee covering future edits.
- All relative Markdown targets in the inspected changes existed except nine `:line` links in `m1-client-plan.md`; the parent is correcting these to GitHub `#Lline` anchors.
- `.gitignore` excludes dependencies, builds, disposable test results, art caches/candidates and one specifically documented historical trace. It does **not** exclude the three new September 21 evidence directories or this release-reconciliation directory. No ignore-rule change is necessary.
- The public catalogue still pins its delivered evidence to September 12. Update its current snapshot and claims only after the underlying checkpoint is committed; retain historical dispatch identities and claims.

Recommended grouping: first commit the accumulated reviewed runtime, regression tests, complete fixture/evidence closure, status/roadmap, prompt reports and existing draft checkpoint. Then commit the authorized current public journal/roadmap with immutable links to that first commit, current release verification and deployment reporting. Keep tests and their documentation fixtures in the same first commit. Exact publication and branch reconciliation remain parent-owned.
