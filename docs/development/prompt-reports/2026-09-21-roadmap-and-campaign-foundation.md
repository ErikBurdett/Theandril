# Full roadmap and first campaign-foundation work — 2026-09-21

## Prompt

“Okay make a full road map with these items begin completing them.” This follows the project-status and next-development assessment.

## Delivered

Expanded the [existing 1.0 roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap) into eleven ordered milestones with dependencies, owning packages, player outcomes and acceptance: stabilization; client states/unification; magical discovery; empire delegation; supply/trade/operations; independent powers/politics; epochs/crises; progression and a third victory; authored breadth; online campaigns; and integrated release proof.

Started M0 with implemented, independently reviewed naval AI corrections. An already-paid second harbor counts toward the isolated outlet limit; multiple founders share bounded observed-geography work. Paid scout funding and saved routes through arrival/founding have regressions. Movement searches skip edges that cannot improve the result; replay comparison avoids unnecessary complete JSON encoding while preserving historical validation and technical export bytes.

The real profiled Epic campaign retains victory turn 910, 22,914 commands, 249 battles, zero rejections and final hash `1e4534db`. The local before/after sample improves from 32.443 to 27.161 seconds after the movement/naval fixes; this is one sample per version, not hosted or universal performance acceptance. [Measured evidence and limits](../2026-09-21-roadmap-start/performance/README.md).

## Changed

- **Planning/status:** `docs/1.0-DEVELOPMENT.md`, `docs/IMPLEMENTATION_STATUS.md`, and the existing catalogue in `apps/web/src/updates/library.ts`. Stable IDs, bounded completion states, historical public evidence pin and all fifteen open gates remain intact.
- **AI:** `packages/ai/src/naval.ts` and new `naval-outlets.test.ts`.
- **Movement:** `packages/sim/src/movement.ts` and new `movement-search-equivalence.test.ts`.
- **Replay:** `packages/chronicle/src/index.ts`, new internal `json-equivalence.ts` and its tests.
- **Evidence:** [retained source hashes, logs, benchmarks, CPU profiles and screenshots](../2026-09-21-roadmap-start/README.md); [reviewed draft dispatch](../../updates/campaign-foundation-work-packet.md). No new runtime art.

## Verified

All integration results are local on Node 22.23.2; browser results use Chromium. Commands and exact log hashes are in the [verification record](../2026-09-21-roadmap-start/verification.json).

| Check | Actual outcome |
| --- | --- |
| Typecheck and lint | Pass: [typecheck](../2026-09-21-roadmap-start/typecheck.log), [lint](../2026-09-21-roadmap-start/lint.log). |
| Content/art validation | Pass: [content](../2026-09-21-roadmap-start/content.log), [art](../2026-09-21-roadmap-start/art.log). Rules/save 17, content `b79c78ed`; no new visual approval. |
| Production Pages build | Pass with existing bundle-size/Zod warnings: [build](../2026-09-21-roadmap-start/build.log). |
| Unchanged full headless suite | **1,768/1,769**, 215/216 files. Epic archive verification fails at 66.351 seconds against the original 60-second limit: [log](../2026-09-21-roadmap-start/full-headless.log). |
| Affected gameplay browser scenarios | **20/20**, covering AI watch/contact, movement, naval, archives, defense and narrow controls: [log](../2026-09-21-roadmap-start/browser-gameplay.log). |
| Complete Pages browser suite | **27/27** under `/Theandril/`, including actual production game checks and roadmap journeys: [log](../2026-09-21-roadmap-start/browser-pages.log). |

Standard/24 contact, Huge/32 contact and Epic seed-74 pacing pass in the final local headless run. The isolated Epic diagnostic passes in 52.03 seconds, but the full parallel run remains failed. Focused regression counts overlap the full suite and are not added to it. Earlier failed and sandbox-interrupted logs are retained separately. No timeout, scheduling, contact assertion or activity reduction was used.

Independent reviews approve the bounded [naval](../2026-09-21-roadmap-start/review/naval.md), [movement](../2026-09-21-roadmap-start/review/movement.md), [replay](../2026-09-21-roadmap-start/review/chronicle.md) and [roadmap](../2026-09-21-roadmap-start/review/roadmap.md) work. [Final factual/visual review](../2026-09-21-roadmap-start/review/final.md) confirms the draft's claims and retained screenshots. Local links, recorded source hashes and `git diff --check` also pass.

## Not done / blocked / caveats

**M0 remains in progress.** The existing Epic archive timing failure is reduced in isolated diagnostics but remains open in the unchanged full workload. No whole release gate is signed off. The scoped gameplay run is not the complete gameplay suite; Chromium is not cross-browser certification. Synthetic planner and comparison benchmarks do not establish campaign or renderer performance by themselves.

No commit, push, deployment, public journal entry or hosted CI run was performed. Work remains in the user's primary checkout on `master` at base `f07024fe23ad3386874656d48fbbc33a5380d979`; no published checkout synchronization was required. The earlier status-review report is preserved. The Pages suite's incidental overwrites of two historical compendium screenshots were restored to exact committed bytes.

## Follow-ups

1. Close the unchanged default-suite Epic archive timing failure and obtain a trustworthy integrated baseline.
2. Implement M1 client-state diplomacy and contestable unification victory through canonical commands, AI, saves/replay and actual browser controls.
3. Follow the documented M2 magic-site/caster/counterplay and M3 delegation dependencies, preserving all remaining 1.0 obligations.
