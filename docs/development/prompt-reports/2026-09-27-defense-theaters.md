# Continue development — defensive theaters and deployment

## Prompt

“Continue development.” Continued Theandril toward 1.0 under the user's existing deployment authorization and repository Unlazy workflow.

## Delivered

Players can save named defensive theaters: choose explicit combat land armies, protected hearths, a guard floor and an explored reserve. Idle assigned armies fill gaps and gather surplus each turn through ordinary movement. Direct and paused routes, postings, voyages, missions and sieges keep priority. Reports distinguish stationed and incoming guards; pause/delete/detach stop future assignments while existing routes remain.

Small AI home watches use observed canonical route checks. Campaigns exposed an initial unreachable-island assignment; the final policy corrects it, with failing-before/passing-after regressions and retained diagnostics. Rules/save 33 preserves genuine rules 32 history, mixed continuation, portable archives and local restoration.

Published implementation `0ecd2d1767f613942cf9f22315da624164cc4055` through deployment `bce46a1442a0b2aa33487952b4d43e1d96cb8540`. [Play](https://erikburdett.github.io/Theandril/) · [Dispatch 12](https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=defense-theaters).

## Changed

- `packages/sim`, `ai`, `chronicle`, `persistence`, and test fixtures: canonical theater state/commands/allocation, observed reports, AI adoption, migration and exact history.
- `apps/web`: real registry controls, strict worker-response correlation, autosave/recovery, and one renderer explored-cell getter.
- Local tests and scripts: canonical lifecycle/property cases, historical captures, authored hundred-army and generated production journeys, active allocator/AI measurements and paired headline campaigns.
- Existing journal, roadmap, architecture, implementation status and performance evidence updated. Native source pixels are unchanged; the image inventory remains below its existing 3 MiB cap.
- DHARMA ACT-32/M3 and DH-021 progress updated with hash-guarded changes. ACT-36 remains done and DH-020 remains resolved.

## Verified

- [Implementation suite](../2026-09-27-defense-theaters/tests-final.log): **2,075 tests / 258 files**, 61.02 seconds. [Publication suite](../2026-09-27-defense-theaters/publication-tests.log): same count, 57.79 seconds. The 100 compatibility and 270 AI checks overlap these totals.
- [Affected browser journeys](../2026-09-27-defense-theaters/affected-browser-initial.log): **33 passed**, including six new theater/recovery cases. [Final standalone production journey](../2026-09-27-defense-theaters/production-final.log): one passed, 5.0 seconds, 6.0-second run.
- [Local Pages](../2026-09-27-defense-theaters/publication-pages.log): **34 passed / 1.1 minutes**. [Live Pages](../2026-09-27-defense-theaters/live-pages.log): **34 passed / 2.3 minutes**, no failures/retries/skips, [exact matching identities](../2026-09-27-defense-theaters/live-pages-identities.json).
- Typecheck, lint, content/art validation and production build pass. Independent [implementation](../2026-09-27-defense-theaters/independent-final-review.md), [gameplay pixels](../2026-09-27-defense-theaters/independent-ui-review.md), [publication facts](../2026-09-27-defense-theaters/publication-review.md) and [rendered journal](../2026-09-27-defense-theaters/publication-visual-review.md) reviews retain their authorship and scope limits.
- [Pacing](../2026-09-27-defense-theaters/pacing-fixed-comparison.json): final Standard **233**, Long **311**, Epic **349**; frozen 32 baselines **234 / 342 / 379** reproduce exact historical hashes/traces. Twelve one-army watches and three accepted automatic journeys per current campaign, zero automatic/submitted refusals.
- [Allocator](../2026-09-27-defense-theaters/benchmark-final.json) and [AI adoption](../2026-09-27-defense-theaters/ai-benchmark-final.json) measurements use warmup plus three samples and prove canonical consistency; their authored, single-realm and unsaturated-search limits remain explicit.
- Both exact GitHub workflows succeed. [Deployment record](../2026-09-27-defense-theaters/deployment.json) and [live readback](../2026-09-27-defense-theaters/live-readback.json) match game/worker assets, image bytes, source links and all roadmap records. [Tracker source and generated-page readback](../2026-09-27-defense-theaters/tracker-readback.json) passes after the guarded update and local build.
- The primary checkout `/home/telephoneheater/Work/Theandril` was master, synchronized at zero ahead/behind with published `bce46a1`, before this final documentation record. No separate worktree or unsynchronized development branch remains.

## Not done / caveats

All fifteen 1.0 gates remain open. ACT-32/M3 is partial; DH-021 remains open because Standard/Long exceed approximate targets and Epic is one turn below its nominal lower edge. One seed per pace is not balance acceptance. No prices, targets or proxy bounds were changed to hide results.

Threat-aware defense, reinforcement, patrol/escort, invasion planning, reusable army orders, broader governors, multiplayer and integrated mature-realm acceptance remain incomplete. Authored scale fixtures do not prove organic maturity, whole-world saturation, rendering or sustained memory budgets. AI does not automatically refill or redesign an existing watch.

Initial simulation/fixture/typing failures, sandbox refusals, rejected adoption results, an overlapping benchmark, stale publication expectations and a failed optional inspection-harness import are retained in the [evidence packet](../2026-09-27-defense-theaters/README.md). Corrections preserve ordinary rules, historical bytes, meaningful assertions, timeouts and the media budget. The optional harness failure occurred before browser launch; the passing Pages suite and live image readback are separate evidence.

## Follow-ups

Implement a dependency-ready reinforcement or governor slice through ordinary commands, preserving visible blockers and direct overrides. Measure its actual campaign effect and bounded costs. Address DH-021 through deliberate multi-seed headline measurement and frozen-pack-compatible decisions. Continue existing release gates without treating this deployment as 1.0 signoff.
