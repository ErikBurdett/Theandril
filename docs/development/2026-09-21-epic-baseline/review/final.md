# Final checkpoint review — Epic baseline continuation

Verdict: **no blocking finding in the bounded implementation, evidence claims or current screenshot presentation**. This approves the local checkpoint's factual and visual account. It does **not** clear the failing Epic integration gate, complete M0 or any whole release gate, or authorize publication.

## Scope and source identity

This review concerns the current local Epic baseline pass, measured against its [starting manifest](../baseline.json), not Git HEAD alone. Earlier authorized campaign changes remain in the working tree and are explicitly historical in the status and draft packet. The current production changes are search-local neighbor storage, omission of unused range predecessors, and lazy preparation within one naval plan. Rules/save remain 17 and content remains `b79c78ed`. The independently reviewed [movement](movement.md) and [naval](naval.md) changes have no blocking finding within that scope.

The reviewer independently read back all **614 files** in the [runner manifest](../runner/source-manifest.json), SHA-256 `24e2d95ba095d7366a90283c9c924bd42352cb6c945d37a13e8b802f6f0687f4`. All matched during the initial readback. After the disclosed screenshot-retention correction, the only mismatch is `tests/gameplay/compendium.spec.ts`; all listed runtime sources, headless tests and configuration still match.

The [final source manifest](../source-manifest.json), SHA-256 `1b26950505addd8288297fc644c438990771eb7091792790eca50919fef110ac`, contains the same 614 paths. Every final hash matches the current file. Its one declared difference from the runner manifest is exactly the compendium correction below; no runtime source drift occurred after the timing runs.

| Current artifact | SHA-256 |
| --- | --- |
| `packages/mapgen/src/index.ts` | `3edf13ec85b8f77600856263dd7563aad80b6d3c8c5f7e55c3389850ddea1f62` |
| `packages/sim/src/movement.ts` | `d136fa29fdd482a2e20c3dbacd48fa04e1c5b479a96cbc69b418a5acad8d53cc` |
| `packages/ai/src/naval.ts` | `fbefc7cbf38f58e84c8711a55dd9becee9b68774ce2ac4fde6b3da5005310cb6` |
| `packages/sim/src/save.ts` | `8fa091b1af59bb7f766d5b1095fe9fd082ada190b11da28f4fffb2a7ba471257` |
| `tests/gameplay/compendium.spec.ts` after correction | `099ab12d3e98bd8f9efff930e61626967f295577edb500b820bc6a9968c4f68e` |

The compendium correction replaces two historical documentation screenshot paths with `testInfo.outputPath` and removes the obsolete directory-creation import/call. Every assertion, viewport step, `fullPage` option and timeout remains unchanged. This prevents a current browser run from overwriting earlier evidence. The file is outside the configured headless `*.test.ts` / `*.test.tsx` selection, so this correction does not alter the recorded headless experiment.

The reviewer inspected the unchanged Vitest configuration and found no diff in that configuration, `package.json`, the Epic archive test, or the contact/pacing tests. Worker caps occur only in the recorded diagnostic commands. No runner policy, test timeout, assertion, activity requirement or search budget was relaxed.

## Full-suite evidence

The raw JSON reports independently recount to **1,858 assertions in 221 test files**, with **1,857 passed**, one failed and no pending tests in each completed run. The only failed assertion is `generated-start epic AI victory produces complete factual logs identical after archive save/resume`.

| Completed run | Vitest elapsed | Epic duration | Result |
| --- | --- | --- | --- |
| Default | 87.84 s | 64.779 s | Failed: unchanged 60-second Epic limit |
| Eight-worker diagnostic | 86.91 s | 64.474 s | Failed: same limit |
| Four-worker diagnostic | 100.67 s | 63.069 s | Failed: same limit |

The nine raw log, JSON-report and shell-timing artifact hashes listed by the three summaries match. The summaries identify Node 22.23.2, the same frozen manifest, no interruption and exit code 1. Vitest's 403 nested-suite count is distinct from its 221 test files; the documented **220/221 files** is accurate. Shell elapsed/CPU totals are separately labelled and are not substituted for Vitest elapsed time.

The first `default-a` attempt did not execute tests because `/usr/bin/time` was unavailable. Its retained failure is a tooling record, not a fourth campaign result. The corrected harness uses Bash builtin timing. The worker experiment has one completed sample per policy, no memory measurement and no basis for a causal CPU-scheduling or universal speedup claim. Neither cap clears Epic; retaining the existing configuration is supported by these results. The isolated pre-change 52.46-second Epic profile does not clear the failed default full-suite gate.

The review read the passing focused movement and naval logs (92/92 and 60/60). These overlap the full-suite count and are not added to it. The 39 new regressions comprise two topology cases and 37 complete-plan/mutation cases. Complete proposal and paid-voyage evidence remains bounded as described in the naval review; neither it nor detached-query timing is a complete campaign-performance claim.

## Claims and limits

The current status, M0 checkpoint and draft packet correctly distinguish the two retained production optimizations from rejected hash kernels, the incompatible primitive-validation wrapper and the alternate heap experiment. Archive command reuse and a shared preview session were not introduced. The earlier encoded-land cache remains rejected. The hash implementation matches this pass's pre-change source.

M1 save/replay and client interface notes are preparation only. They do not implement client contracts, tribute, a rules-18 migration or unification. The pre-change rules-17 fixture and all earlier browser images/results retain their historical attribution. No completion percentage, new release obligation, hosted CI success, M0 completion or publication authorization is asserted. All fifteen whole release gates remain open.

The reviewer authored the rejected hash investigation, the naval review and part of the M1 planning notes. This is an independent readback of the parent's integration evidence and final claims, not a blind second review of those authored documents. No test, benchmark, build or browser scenario was rerun by this reviewer; results are assessed from the retained raw artifacts and source identities. The parent owns integration.

## Final browser and visual review

The retained production build, content/art validation and final typecheck/lint pass. The parent reran typecheck/lint after the compendium correction. The raw browser logs report **25/25 affected Chromium gameplay scenarios in 2.6 minutes** and **27/27 production Pages scenarios in 28.9 seconds**. The Pages log includes the corrected compendium journey. Its two historical documentation PNGs have no Git diff after that run. These are scoped Chromium checks rather than complete gameplay, cross-browser or release certification.

| Retained verification log | SHA-256 |
| --- | --- |
| `typecheck-final.log` | `9b806551a727ff9f9eec8de2739b3a5dd7929f84cd9cf0523039dc41ae6375ce` |
| `lint-final.log` | `a410ca93a80b3f6d79866340973de241518b1e6d0587b2570ec254efd8dbe477` |
| `content.log` | `8393d57c539d963a938ac86e4b6b73e837b53b1c881fa98b649184913b44ccde` |
| `art.log` | `1c05a6b8969552eaf7558cf8c794650c22896ab2062826ad4db52f3f8f4e05fa` |
| `build.log` | `1281d82050ad49f7f6084a6e0ba7e34efe949fe241dabbab3be60b055f411007` |
| `browser-gameplay.log` | `413058f560c0f3448eb341b291b7a444e09e124c670908723f44eb987aa20edb` |
| `browser-pages.log` | `a5fc3fdc661e5403ce232cea0c5cf6e50646887e1159de3afe552c122d53d2c6` |

The reviewer opened both exact current PNGs and compared their bytes with the original Playwright files named in [provenance](../screens/provenance.json). Both copies, SHA-256 values and PNG dimensions match; no crop, resize or re-encoding occurred.

- [Technical ledger](../screens/technical-ledger.png), 1440 × 1000, SHA-256 `bf6c0c3924d3aa25ab8f2c186e0aed97a852489355eb62f805067beeda3cb799`: the modal shows the ended campaign, seed 20260905, Short watch mode, turn 41, accepted movement order 531, initial/final seals and the technical JSON download control. Tabs, turn navigation, export and close controls are visible and legible. The producing scenario begins a generated campaign, saves/reloads, reaches victory on turn 42 and verifies the downloaded archive against replay. The caption correctly describes that journey without claiming Epic timing acceptance.
- [Transport landing](../screens/transport-landing-390.png), 390 × 844, SHA-256 `7dea9b20985e5f917910eb632281b2b796d11c7526c9d3f929e19c88f644f516`: the narrow selected-orders panel shows the passenger aboard its transport, carrying-fleet control, landing-shore selector, landing constraints and a fully visible Disembark army button. The lower route controls continue below the captured scroll position; the caption does not claim all panel content is simultaneously visible. The producing scenario uses an authored initial campaign and ordinary human commands, researches Ocean navigation, saves/restores queued travel, lands with identical formation IDs and saves again. The caption explicitly avoids presenting it as an organic AI expedition.

The final README, current implementation-status section, M0 checkpoint and single draft packet agree on the failed headless gate, passing scoped browser checks, unchanged rules/content, rejected experiments and unimplemented M1. Current images are separated from both earlier checkpoints' imagery. The draft slug remains absent from the public dispatch catalogue. This review records no publication, hosted CI result or whole-gate acceptance.
