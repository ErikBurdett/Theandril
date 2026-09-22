# Campaign performance continuation — 2026-09-21

## Prompt

“Okay continue with development.” Continued the existing M0–M10 roadmap and preserved the preceding prompt's uncommitted work.

## Delivered

Implemented four independently reviewed improvements to existing campaign processing:

- Naval AI requests its destination preview without constructing an unused reachable overlay. The same preliminary search, fog information and shared 4,096-node budget remain. Three callers change; all 22 captured previews, 91 proposal variants and an eight-turn paid voyage retain their complete results. The voyage preserves 22 accepted commands and final hash `fa29672f`. [Evidence](../2026-09-21-campaign-continuation/movement-preview/README.md).
- Observation publication avoids repeated temporary object copies while preserving complete current/historical fields and land quotes across 91 captured observations. [Evidence](../2026-09-21-campaign-continuation/observations/README.md).
- Eligible explored-cell lists use native unsigned sorting while retaining exact original output and unusual-input behavior. This adds transient storage but no persistent cache. [Evidence](../2026-09-21-campaign-continuation/serialization/README.md).
- Technical chronicle formatting removes an intermediate parse/re-encode and retains the original complete bytes. [Evidence](../2026-09-21-campaign-continuation/performance/README.md).

The measured query, observation and formatting gains are scoped benchmarks, not a universal campaign speedup. A broader encoded land/report cache was **rejected**: changing-land whole hashes became 18–45% slower, custom serialization behavior remained unresolved and retained memory was unproven. No experimental cache is imported by production. [Disposition](../2026-09-21-campaign-continuation/performance/hash-investigation.md).

Captured a [pre-change rules-17 diplomacy archive](../2026-09-21-campaign-continuation/m1-fixture/README.md) with real paid peace, a pending offer and exact saved continuation. Authored initial scout contact is disclosed. This prepares compatibility evidence; client contracts and unification remain unimplemented.

## Changed

- **Simulation:** `canonical-cells.ts`, `save.ts`, `simulation.ts`, `territory.ts`, `movement.ts`, the preview export and corresponding regression tests.
- **AI:** exactly three preview call sites in `packages/ai/src/naval.ts`, preserving the preceding harbor/founder corrections.
- **Chronicles:** direct sorted indentation in `json-equivalence.ts` and its two consumers in `index.ts`, plus exact-output regressions.
- **Status and evidence:** [canonical roadmap](../../1.0-DEVELOPMENT.md#active-development-roadmap), [implementation status](../../IMPLEMENTATION_STATUS.md), [continuation evidence](../2026-09-21-campaign-continuation/README.md), and the existing [reviewed draft packet](../../updates/campaign-foundation-work-packet.md). No competing roadmap, new content rules or runtime art.

## Verified

Node 22.23.2; Chromium at `/usr/bin/chromium`. The [verification manifest](../2026-09-21-campaign-continuation/verification.json) records exact results and log hashes, and the [source manifest](../2026-09-21-campaign-continuation/source-manifest.json) records 21 source/configuration hashes.

| Check | Actual outcome |
| --- | --- |
| Typecheck, lint, content/art validation | Pass: [typecheck](../2026-09-21-campaign-continuation/typecheck-final.log), [lint](../2026-09-21-campaign-continuation/lint-final.log), [content](../2026-09-21-campaign-continuation/content.log), [art](../2026-09-21-campaign-continuation/art.log). |
| Production Pages build | Pass, with existing annotation/bundle warnings: [log](../2026-09-21-campaign-continuation/build.log). |
| Unchanged full headless suite | **1,818/1,819**, 218/219 files, 90.01 seconds. Sole failure: Epic archive verification at **64.312 seconds against 60**. [Log](../2026-09-21-campaign-continuation/full-headless-final.log). |
| Affected Chromium gameplay | **25/25**, 2.5 minutes; land, movement, naval, diplomacy, contact, defense and chronicles. [Log](../2026-09-21-campaign-continuation/browser-gameplay.log). |
| Rebuilt production Pages suite | **27/27**, 33.2 seconds at `/Theandril/`. [Log](../2026-09-21-campaign-continuation/browser-pages.log). |

Independent reviews approve the bounded [sorting](../2026-09-21-campaign-continuation/review/canonical-cells.md), [observations](../2026-09-21-campaign-continuation/review/observations.md), [formatting](../2026-09-21-campaign-continuation/review/pretty-json.md) and [movement-preview](../2026-09-21-campaign-continuation/review/movement-preview.md) changes. [Final factual/visual review](../2026-09-21-campaign-continuation/review/final.md) verifies source/log/image hashes, exact capture bytes and draft claims. No tests were rerun by that final reviewer.

The earlier 1,791/1,792 full failure and isolated 50.45-second Epic diagnostic remain retained. Counts overlap and are not additive. No timeout, test scheduling, assertion or AI activity requirement was relaxed. Final source/log hashes, local documentation links and `git diff --check` were checked.

## Not done / blocked / caveats

**M0 remains in progress and all fifteen release gates remain open.** The unchanged default-suite Epic timeout still needs resolution. Isolated passes and synthetic gains do not clear it or demonstrate hosted CI recovery. The gameplay run is scoped Chromium coverage, not the entire gameplay suite or cross-browser certification. No M1 gameplay feature, schema migration or new art was delivered; rules/save remain **17**, content **`b79c78ed`**.

No commit, push, publication or deployment occurred. Work remains in the user's primary checkout on `master`, based on `f07024fe23ad3386874656d48fbbc33a5380d979`; no published-checkout sync was needed. The two historical compendium images rewritten by the Pages test were restored to exact pre-run bytes. Prior work and failed evidence were preserved.

## Follow-ups

1. Use the retained Epic profile to reduce remaining repeated canonical hash/pathfinding work without weakening validation, changing campaign activity or reviving the rejected cache unchanged.
2. Once the integrated baseline passes, implement M1 client contracts through canonical rules, human controls, observed AI decisions and exact saved replay; then add contestable unification victory.
3. Continue M2's magical-site/caster/counterplay loop and M3's empire delegation according to the existing roadmap dependencies.
