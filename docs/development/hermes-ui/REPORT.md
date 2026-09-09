# Hermes UI implementation evidence — R18 / R23 / R07

Baseline: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`. Work performed in the shared dirty working tree, with parent-owned simulation and sibling-owned persistence work preserved. No commits, pushes, generated artwork, or edits to the historical audit/global implementation status. Project changes are confined to `apps/web/src`, these gameplay tests, and this evidence directory.

## Delivered slices

- **R18 immediate zero-image repair:** the shared-only `character.waykeeper` role reaches the approved catalog instead of failing the culture-qualified role lookup. Repeated requests across Ashen/Reedbound use the same cached frame and effects-page decoding. Cards retain the real asset ID, label it **shared Waykeeper silhouette**, and do not claim faction-specific art or show the failed-load pawn. Both browser cases paid 40 coin through Appoint Waykeeper and assigned the character through the real roster. `/art/battle.png` was requested once per scenario; battle-foot/mounted pages remained deferred. The page is 1024×1024 / 4 MiB RGBA. Specialist-art pilots are **not** part of this repair.
- **R23:** namespaced sibling keys `overview:${registryEpoch}` / `battlefield:${registryEpoch}` retain intended epoch resets without React identity collisions. Development and production runs each retained exactly one control, one original canvas, and one map-host descendant through generation, four loads, four alternating Small/Tiny imports, one rejected import, and battle entry/exit. Realm filters, mode buttons and keyboard map actions remained operable. Attached listeners stayed window/document/canvas **17/7/12 dev**, **16/7/12 production**. Production has no debug hook. These measurements do not certify detached heap, worker or GPU resource cleanup.
- **R07 unassigned-household slice:** added a Labor category to existing next-action navigation, independently of idle production. Counts come only from permitted compact land summaries (`workerCapacity - worked.length`), not population or paged detail guesses. Stable-ID next/previous review locates the exact hearth and opens its land pane in one activation. Explicit attention entry reveals that pane after final HUD sizing at 390px; ordinary inspectors do not reset scroll on unrelated HUD resizing. Real growth in a queued hearth exposes one new worker; 2/10/40-town fixtures isolate and resolve the exception without opening every town. Manual assignment preserves existing worked cells, does not spend treasury, and survives save/load. Existing standing/paused-route, mission, embarked-troop, remapped-key, modal and touch journeys pass. No new sim observation contract or automatic assignment/spending was needed. Forecast deficits, urgency categories, policies and a full dashboard remain outside this slice.
- **Parent-requested R03 preview:** `BattleDefensePreview` renders the canonical optional `ArmyView.battleDefense` / `SiegeObservation.battleDefense` quote beside public attack/assault controls. It shows committed/reserve formation and strength values plus the need to clear reserves; it never calculates a competing contingent or issues orders. Browser field combat commits 20 of 21 and leaves the reserve; desktop siege play requires a later assault before capture. The new siege quote is captured at 390px. Canonical rules/version ownership remains with the parent.

## Verification and exact exits

All commands run from `/home/telephoneheater/Work/Theandril`, using isolated Chromium **152.0.7977.82**, one Playwright worker, and server **127.0.0.1:5192**. User port 5173 was not used or stopped. Desktop 1440×1000, narrow 390×844; existing map-action regression also exercises 130% text.

| Check | Actual result | Evidence |
|---|---|---|
| R18 unit RED | exit **1**, role lookup rejected published shared artwork | `r18-unit-red.log` |
| R18 public UI RED | exit **1**, expected shared / received fallback | `r18-ui-red.log` + trace |
| R23 unit RED | exit **1**, both sibling keys evaluate to zero | `r23-unit-red.log` |
| R23 dev RED | exit **1**, controls **1→9**, canvas stays one; 74 duplicate-key warnings | `r23-dev-red-v4.log` and its `lifecycle.json` |
| R23 production RED | exit **1**, controls **1→6** before a build/fixture save-version mismatch stopped cross-size imports | `r23-production-baseline-red.log` and its `lifecycle.json` |
| R07 unit RED | exit **1**, household candidates absent | `r07-unit-red-v2.log` |
| R07 UI RED | exit **1**, labor review control absent | `r07-ui-red.log` |
| R07 narrow RED | exit **1**, land heading exists but viewport ratio is zero | `r07-narrow-red.log` |
| R03 attack / siege unit RED | each exit **1**, canonical preview text absent | `r03-attack-unit-red.log`, `r03-siege-unit-red.log` |
| Complete web unit suite | exit **0**, **27 files / 198 tests passed** | `web-unit-handoff.log` |
| Combined dev UI + affected existing journeys | exit **0**, **16 passed**, zero skipped/flaky/unexpected | `handoff-dev.log`, `handoff-dev/results.json` |
| Production R23 | exit **0**, **1 passed**, all eleven checkpoints | `r23-production-handoff.log`, `r23-production-handoff/results.json`, lifecycle JSON |
| Root typecheck | exit **0** | `typecheck-handoff-final.log` |
| All owned TypeScript source/test/config ESLint | exit **0**, no diagnostics | `lint-handoff.log`; final config/test-only rerun also exit 0 |
| Production build | exit **0** | `production-final-build.log`; output `/tmp/theandril-hermes-ui-production-final` |
| Scoped `git diff --check` | exit **0** | final terminal verification |

Re-run UI:

```sh
HERMES_UI_EVIDENCE=./handoff-dev pnpm exec playwright test --config docs/development/hermes-ui/playwright.config.ts hermes-ui-slices household-attention battle-defense next-action.spec.ts map-actions.spec.ts
```

For production, serve the retained build with `pnpm exec vite preview --host 127.0.0.1 --port 5192 --strictPort --outDir /tmp/theandril-hermes-ui-production-final` from `apps/web`, then select only `hermes-ui-slices --grep R23`. Never run a second browser worker or replace a server without checking ownership.

## Durable artifacts

- `evidence-summary.json`: parsed final test stats, full lifecycle counts/listeners, console records, observation index.
- `handoff-dev/results.json`: full passing result data, including base64 JSON attachments.
- `handoff-dev/observations/index.json`: eight decoded observation attachments; includes actual art requests, paid coin, growth assignments/treasury, 2/10/40-town activation counts, field and siege quotes.
- `r23-production-handoff/*/lifecycle.json`: exact production node/console records.
- Per-case PNGs under `handoff-dev/`, `slices-dev-final/`, `r03-preview-ui-green-v3/`, `r23-production-handoff/`; failed runs retain traces/error contexts.

Passing in-memory Playwright attachments were initially lost by the list-only reporter. The isolated config now also retains JSON; the complete 16-case run was repeated and its eight observations decoded to real files. Earlier green-log names are not sufficient evidence by themselves.

### Pixels actually opened

Opened and inspected: `slices-dev-final` Ashen paid desktop Waykeeper, Reedbound assigned 390px Waykeeper, 40-town attention/review at 390px, and lifecycle controls at 390px; also `r03-preview-ui-green-v3` siege-defense-390. These show the real shared figure (not a pawn), readable Labor review, the land heading revealed in the compact popup, and exact committed/reserve text next to assault. This is narrow contextual inspection, not all-asset or complete responsive certification. Parent final visual/integration review remains requested. Lifecycle captures have a blank map backdrop after battle; do not infer full renderer visual correctness merely from passing DOM/control/attached-listener assertions.

## Harness exclusions and remaining issue

- Earlier R18 green attempts exposed overlapping synthetic frame placement, a decorative-image accessible-name assumption, and a faction definition/color fixture mismatch. Corrected harness runs pass; failed pilot logs remain, not relabeled as additional game defects.
- Early R23 pilot locators used the wrong export name/hidden save visibility/map-dialog name. Dev v4 proves the full 1→9 count failure before its final mistaken dialog locator. The production baseline proves the key defect through four loads/one import but not the full cross-size sequence, because parent rules moved to version 17 during compilation. The final production build and full sequence both pass. No save compatibility test was weakened.
- The first R03 siege browser preparation allowed real AI turns to change the fragile 21-defender stress fixture to 20, so the absence of reserves was correct. The final authored input mirrors the parent's canonical setup: ordinary declaration/besiege/three simulation ticks without AI scheduling **during fixture preparation**, then imports the ready siege. Real public assaults/autoresolve, a later live AI turn and capture run in the browser. This is not natural campaign growth or a full-AI preparation claim.
- **Open follow-up:** an extended R03 journey at 390px reached the second-assault capture prompt, but clicking Occupy was intercepted by map-management/canvas elements. Retained at `r03-preview-ui-green-v2.log` and `r03-preview-ui-green-v2/battle-defense-R03-public--a258a-later-defeat-before-capture/trace.zip`. The final test explicitly limits narrow coverage to the new preview and resolves the capture on desktop. No forced click, suppressed failure, or claim of narrow capture completion. Baseline attribution has not been established.
- Browser console retains an unidentified 404 and SwiftShader ReadPixels performance warnings. No page exceptions or duplicate-key warnings in final lifecycle runs. Build retains Zod annotation/outDir/chunk-size warnings; it did not fail.
- No full repository release gate, real-GPU certification, long campaign performance, or expanded R07/R18 backlog completion is claimed. Parent owns global status/integration.

## Final server state

Owned development server `proc_1388040f481d` and production preview `proc_02c793a5197a` were stopped after verification. No server handoff or new background work remains. Port 5173 was untouched.

## Changed project files

`apps/web/src/{faction-art.tsx,faction-art.test.tsx,main.tsx,campaign-hud.css,map-actions.tsx,next-action.ts,next-action.test.ts,campaign-lifecycle.test.ts,warfare.tsx,siege.tsx,battle-defense.tsx,battle-defense.test.tsx}`

`tests/gameplay/{hermes-ui-slices.spec.ts,household-fixture.ts,household-attention.spec.ts,battle-defense.spec.ts}`

This directory's isolated Playwright configuration, logs, screenshots, traces, result JSON and report. Reusable QA memory also records the list-reporter attachment-retention pitfall, as required by the runtime workflow instruction; no other Hermes profile or project factory files were changed.
