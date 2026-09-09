# Narrow capture controls and post-battle pixels — UI follow-up

## Outcome and ownership

**The reported 390×844 Occupy interception is fixed.** The public reserve-siege journey completes both assaults, the intervening live AI turn, destructive-choice review/cancellation, and occupation at 100% and 130% text without forced clicks or a desktop viewport escape. The completed settlement is owned by the player, pending capture is cleared, End turn unlocks, and the original canvas remains mounted.

Only application change: `apps/web/src/campaign-hud.css` adds `.application .capture-panel { z-index: 7; }` and its explanatory comment. The capture decision previously inherited battle-panel `z-index: 2`, below map-management controls at `4` and the overview at `6`. The 390px RED recorded Occupy's centre at `(195, 145.171875)` hitting **Characters & agents**. The final pointer observations hit **Occupy** at both text scales. Existing responsive dimensions and scrolling are retained; this is not a general capture-screen redesign or touch-target-size certification.

Starting revision: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`, shared dirty working tree. All prior implementers' changes were preserved. The before/after SHA-256 manifests verify that `packages/{render,sim,ai,chronicle,persistence}` are unchanged and that **no other web source file changed** during this follow-up. In particular, `overview:${registryEpoch}` / `battlefield:${registryEpoch}`, Waykeeper shared fallback, Labor review, and the single land-query owner are untouched. Root status/docs and historical evidence were not edited. No commit/push/stash/reset/install/provider/art generation/deployment occurred.

CSS SHA-256:
- Before: `2687fd7536de826ef084ecb7e4f494ad23e17cc12f43237cbfd5e867a8865ab6`
- After: `b99f1aa7db843840b92280fd254b469c635981c86d4276697d82955b69af53c7`

## Strict TDD and evidence

| Check | Actual exit/result | Evidence |
|---|---|---|
| New full narrow siege/capture regression, before CSS edit | **1**, Occupy intercepted by HUD/canvas | `capture-red.log`, `capture-red/…/trace.zip`, decoded `narrow-capture-before.json` |
| Same regression after capture-layer edit | **0**, **1 passed** | `capture-green.log` |
| Full affected UI regression, final broad run | **0**, **28 passed / 9 files**, no skipped/flaky/unexpected | `handoff-final.log`, `handoff-final/results.json` |
| Final stronger pointer-hit/PNG checkpoint at 100% and 130% text | **0**, **2 passed**, both hit Occupy | `capture-hit-evidence.log`, `capture-hit-evidence/observations/` |
| Complete web unit suite | **0**, **27 files / 198 tests** | `web-unit.log` |
| Root typecheck, final test/helper version | **0** | `typecheck-complete.log` |
| Owned TS tests/evidence config/fixture script ESLint | **0**, no diagnostics | `lint-complete.log` |
| Scoped diff whitespace check | **0** | terminal verification |

The broad run includes the original desktop-completion R03 test unchanged in behavior, both new narrow cases, R18 paid/assigned Waykeepers for Ashen/Reedbound, all R07 growth/2/10/40-town cases, the complete R23 replacement lifecycle, all selected land-query cases, conquest/save/sack/raze/AI-defense cases, HUD, map actions, next-action and narrow battle-camera regressions. After the broad run, only capture evidence preparation was strengthened to use ordinary click actionability checks before recording the hit target; both affected cases were rerun successfully. No application code changed after the first GREEN.

Authored inputs are explicit: the existing reserve fixture prepares a 21-defender stress siege with three simulation ticks **without AI scheduling during fixture construction**. Browser declaration/assault/autoresolve/capture actions are ordinary public controls, and the intermediate End turn schedules live AI. There are no in-browser resource grants, suppressed live AI or natural-campaign-growth claims. `prepare-map-input.ts` creates only the separately labeled authored border-battle save used in the clean browser.

## Map finding: the reported blank renderer was not reproduced

A fresh named browser session reproduced field battle entry/exit through public controls in both Terrain and Realms modes. Actual PNGs show terrain hexes, settlement buildings, army figures and selection labels after combat at desktop and narrow size. The full R23 generation → four loads → four alternating Small/Tiny imports → rejected import → battle journey also passes real screenshot-pixel checks.

The earlier report's blanket statement that lifecycle captures have a blank map backdrop is **not supported by the exact desktop PNGs inspected here**. The untouched `hermes-ui/slices-dev-final/…/lifecycle-after-battle.png` visibly contains terrain, Ashen Hearth and army figures. Its central 120×120 PNG crop has 1,203 RGB colors; the prior final handoff crop has 1,210. Their paths, original image hashes and crop statistics are retained in `historical-pixel-comparison.json`. Earlier narratives were not rewritten.

At 390px, selecting **Terrain** or **Realms** intentionally invokes `onFit()` in `faction-overview-control.tsx`. The authored Tiny campaign has only a small explored patch; the open overview menu covers that patch, while the rest is fog. Closing the menu reveals the small world raster. **Focus selection** returns to local detail. `clean-browser/narrow-overview-menu-{open,closed}.png` and `narrow-local-after-battle.png` preserve the distinction. No renderer-package edit is justified by this reproduction.

`map-pixel-evidence.ts` decodes actual screenshot PNG bytes with an offscreen 2D canvas. It retains a 120×120 / 14,400-pixel patch, verifies 49 hit-test samples belong to the displayed map canvas rather than DOM overlays, and requires more than 100 RGB colors and more than 0.2 non-dominant fraction. It does **not** infer pixels from counters or from a potentially cleared WebGL drawing buffer. The full screenshots were separately opened and inspected.

Final broad-run screenshot samples:

| Checkpoint | RGB colors | Non-dominant fraction |
|---|---:|---:|
| Post-capture 390px, 100% text | 1,013 | 0.9517 |
| Post-capture 390px, 130% text | 947 | 0.9512 |
| R23 post-battle desktop | 1,203 | 0.8974 |
| R23 post-battle 390px local detail | 995 | 0.8959 |

R23 separately retains one control, one original canvas and one map-host descendant at all eleven checkpoints; attached listeners remain **17/7/12** for window/document/canvas. Final lifecycle records contain no page errors or console warnings/errors. Counts complement the PNG evidence; they do not certify detached heap/GPU cleanup or every rendered gameplay fact.

## PNGs actually inspected

- [Original RED capture prompt](capture-red/battle-defense-R03-narrow--67f2b-ithout-intercepted-controls-ui-followup-5193/capture-prompt-390.png): HUD overlays the capture content.
- [Final 100% Occupy pointer checkpoint](capture-hit-evidence/battle-defense-R03-narrow--67f2b-ithout-intercepted-controls-ui-followup-5193/capture-occupy-ready-390.png).
- [Final 130% Occupy pointer checkpoint](capture-hit-evidence/battle-defense-R03-narrow--7c6b9-cepted-controls-at-130-text-ui-followup-5193/capture-occupy-ready-390.png).
- [130% destructive-choice review](capture-hit-evidence/battle-defense-R03-narrow--7c6b9-cepted-controls-at-130-text-ui-followup-5193/capture-raze-review-390.png): Confirm raze and Keep settlement remain reachable in the scrolled pane.
- [130% completed occupation](capture-hit-evidence/battle-defense-R03-narrow--7c6b9-cepted-controls-at-130-text-ui-followup-5193/capture-completed-390.png): local terrain/units, two-town Labor summary and unlocked End turn.
- [Final R23 desktop map](handoff-final/hermes-ui-slices-R23-repea-884df-sive-map-control-and-canvas-ui-followup-5193/lifecycle-after-battle.png).
- [Final R23 narrow local map](handoff-final/hermes-ui-slices-R23-repea-884df-sive-map-control-and-canvas-ui-followup-5193/lifecycle-local-390.png).
- Clean-browser Terrain/Realms returns, overview menu open/closed, plus the exact prior `slices-dev-final` desktop crop.

## Harness exclusions and limits

- `narrow-text-options` records a **harness** failure after successful 130% occupation: the initial fixed-centre pixel crop touched the overview control. The helper now locates a nearby unobscured crop, keeping the same area and both pixel thresholds and increasing hit-test coverage. No application UI was hidden and no renderer assertion was weakened.
- A preliminary 130% `capture-occupy-ready` image in `handoff-final` used `scrollIntoViewIfNeeded`, which alone left the button under the top bar; the subsequent normal click still succeeded. Final `capture-hit-evidence` uses the same native scrolling/actionability check as the real click, asserts the actual centre hit, and retains the correctly positioned PNG. Earlier evidence is retained, not relabeled as pointer proof.
- The runner logs its existing NO_COLOR/FORCE_COLOR warning. Final scoped lint/typecheck are clean. This is Chromium/SwiftShader development evidence, not a real-GPU, cross-browser, full accessibility, long-campaign or release-readiness certificate. Capture buttons retain their pre-existing sizing; the fix addresses occlusion, not every touch affordance.
- Parent owns full integration/build/production and global status. No art approval or independent-review claim is made.

## Exact files and reproduction

Application modified: `apps/web/src/campaign-hud.css`.
Tests modified: `tests/gameplay/battle-defense.spec.ts`, `tests/gameplay/hermes-ui-slices.spec.ts`.
New test helper: `tests/gameplay/map-pixel-evidence.ts`.
New evidence: this directory's `playwright.config.ts`, `prepare-map-input.ts`, authored `border-battle.theandril`, `summarize-evidence.py`, report, logs, traces, PNGs, retained result JSON, decoded observations, source hash manifests and parsed `evidence-summary.json`. The JSON reporter is retained; 20 in-memory attachments from the broad final run were decoded, with the final hit-check attachments indexed separately. A reusable default-profile dogfood skill note was updated for exact-PNG/overlay sampling; no other project/profile was changed.

```sh
# From /home/telephoneheater/Work/Theandril, with the owned server running:
UI_FOLLOWUP_EVIDENCE=./parent-check pnpm exec playwright test \
  --config docs/development/ui-followup/playwright.config.ts \
  hermes-ui-slices household-attention battle-defense next-action.spec.ts \
  map-actions.spec.ts land-query.spec.ts conquest.spec.ts campaign-hud.spec.ts battle-camera.spec.ts
```

## Owned server handoff

URL: **http://127.0.0.1:5193/**, latest readiness check **HTTP 200**. Vite process handle **`proc_24180f93e166`**, launch PID **419037**, listening Node PID **419160**. Started with `pnpm --filter @theandril/web dev --port 5193 --strictPort`; 5193 was free before launch. Left running for parent inspection, not a new ongoing job. Browser Use session **`theandril-ui-followup-5193`** retains the clean authored border-battle return at 390×844. Chromium **152.0.7977.82**, Node **v26.7.0**, pnpm **10.32.1**. User server **5173 / PID 185598** was neither used nor stopped.
