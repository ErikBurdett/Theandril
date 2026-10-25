# Group patrols native image review

Reviewed all six original PNGs from the first passing production run, using the actual local image files. No visual blocker found in the new controls or the three recovery states. Source hashes, image hashes, dimensions, byte counts and capture provenance are retained in [image-review.json](image-review.json). This is approval of an exact native image candidate; implementation pin and final journal layout inspection remain pending.

## Publication candidate

Use `browser-first-results/production-group-patrols-p-8d403-hout-changing-issued-travel/group-patrol-actions-native.png`: **318 × 149**, **31,103 bytes**, SHA-256 `5a1a6eb8f4cfaf0b2c66fb9832887cd16faf009d70dc36185565b8c76cd921fc`. The three stacked buttons are fully legible, with the middle Resume control visibly disabled. This is a native Playwright locator screenshot of `[data-testid=group-patrols] > .group-selection-actions`, captured in the real built application at a 390 × 844 viewport and 130% text. No image transformation was performed.

The observer is Ashen Compact in an authored 101-company open-terrain campaign, with two hearths, treasury and a foreign obstruction guard. Orders and route interruptions use ordinary canonical commands. The capture is **after the 99-policy Resume batch and before Remove**: Pause 99, Resume 0, Remove 99. It does not show an accepted result, the selected-army context, or an organically developed large empire.

Suggested caption: “Native control detail from an authored 101-company campaign at 390px and 130% text. After resuming 99 patrol policies, Pause and Remove each apply to 99; Resume is disabled because none are paused. Captured before removal; this detail excludes the selection context and outcome summary.”

Exact copying would increase the journal inventory from 3,481,838 to **3,512,941 bytes**, leaving **157,075 bytes** under the unchanged 3,670,016-byte cap. No runtime image or manifest has been changed in this review. Keep the larger full screenshots as source-pinned evidence rather than including both a detail and redundant full capture in the journal inventory.

## Context and recovery pixels

- `group-patrol-pause-desktop.png` (1440 × 1000): the expanded Group patrols panel shows 101 selected, 51 outside the current filter, 99 policies, Pause 49 / Resume 50 / Remove 99. The policy-versus-travel explanation and removal warning are readable; all three buttons fit. This is the initial pre-Pause state despite the filename.
- `group-patrol-remove-narrow-130.png` (390 × 844): after Resume, the scrolled panel shows all three stacked controls, the continuing-travel explanation and the removal warning without horizontal clipping. “No matching entries” is truthful: the paused cohort is empty while selected armies outside the filter remain actionable. The capture precedes the test's explicit keyboard focus and Enter activation; it does not itself depict the focused state.
- `patrol-missing-results-recovery.png` and `patrol-wrong-army-recovery.png` (each 1440 × 1000): disabled group actions and End turn accompany the explicit uncertain-result warning to restore a saved campaign. The full warning is visible inside the registry. No success result is displayed.
- `patrol-worker-crash-recovery.png` (1440 × 1000): disabled controls accompany the worker-stopped warning and instruction to restore a saved campaign before further group orders. This is the locked state before restoration, not a post-recovery screenshot.

The recovery scenarios deliberately damage the native worker's completed response or dispatch a synthetic worker error **after real canonical mutation**. They are transport fault injections, not organic command refusals. The passing source assertions subsequently restore the explicitly saved pre-action campaign, verify its exact archive, and retry one ordinary command. Screenshots alone do not prove those later assertions.

## Evidence boundary

[browser-first.log](browser-first.log) records **7 passing affected production cases in 44.5s**, including the normal journey in 9.0s and all three recovery cases. The normal `group-patrol-evidence.json` records initial `c6f43460`, Pause `acebff08` / 154 records, Resume `f89dea4d` / 253 records, and Remove `a488bb10` / 352 records. Accepted policy commands are 49, 99 and 99 respectively; skipped selections are 52, 2 and 2. Exact replay/reload, army/route/posting invariance and the real pending filter lock are asserted by the executed journey. See [browser-evidence.json](browser-evidence.json) for artifact checks; serialized envelope checksums are distinct from these canonical state hashes.

The parent reports the integrated source suite passing 2,339 tests across 285 files in 62.78s, plus typecheck, lint and build. This image review adds no test run or performance claim and does not close M3, mature-realm acceptance, DH-021 or any release gate. Final article display pixels must still be reviewed after the publication source and implementation pin are integrated.
