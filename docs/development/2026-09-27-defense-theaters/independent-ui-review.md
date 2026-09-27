# Independent theater UI and recovery review

Reviewed 2026-09-27. **Pass for the inspected gameplay views and four recovery journeys; no blocking UI finding.** This is not release acceptance.

The reviewer authored the historical save/schema compatibility work, lifecycle tests, and recovery browser tests, but did not author the theater UI or its two normal gameplay journeys. The visual verdict is an independent inspection of the four exact native screenshots produced by those journeys. No images were edited, resized, recompressed, or regenerated for this review.

## Evidence and scope

- [Normal gameplay log](browser-initial.log): two journeys passed in 16.9 seconds. They exercise explicit creation, next-turn dispatch, a standing-posting override, pagination, detach/pause/delete, manual restoration, portable import, and explicit replacement of membership.
- [Recovery log](recovery-browser-initial.log): all four journeys passed on their first run in 15.3 seconds, without skipped cases or retries. The filename contains `initial` because this was the first attempt; it is a clean passing run.
- [Recovery test source](../../../tests/gameplay/defense-theater-recovery.spec.ts) intercepts responses from actual completed worker commands. It removes the theater view after an ordinary End turn, removes or corrupts it after a theater edit, or triggers the worker error path after the real edit has completed. Each case proves that controls stop accepting orders, no successful theater result is invented, no command is automatically retried, a real manual save restores the previous hash, and an explicit repeat reaches the original accepted result.

These are distinct scopes: two normal gameplay journeys and four recovery journeys. They are not a full browser suite or a production deployment check. Browser/server work for the recovery run ended before this review.

## Exact reviewed images

Paths are relative to this evidence directory. SHA-256 seals refer to the original PNG bytes.

| Image | Native dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| [Draft controls](browser-evidence/initial/defense-theaters-a-hundred-2ca15-age-while-postings-override/defense-theater-controls-narrow.png) | 390 × 844 | 129,009 | `95bcef9526380b383e0b2c11c5c92e987f0a2b6588c908cdc0d4018c9e934155` |
| [Desktop report](browser-evidence/initial/defense-theaters-a-hundred-2ca15-age-while-postings-override/defense-theater-report-desktop.png) | 1440 × 1000 | 745,292 | `56bc123ada806e0e4e411d66d9788536a9bcdb6c4177b4e9957794b39d6617d7` |
| [Narrow report](browser-evidence/initial/defense-theaters-a-hundred-2ca15-age-while-postings-override/defense-theater-report-narrow.png) | 390 × 844 | 156,721 | `abe113fb421ac1ef2732f3b9609489d47eb37481365509a2e16fd78aa51c4493` |
| [Restored narrow controls and report](browser-evidence/initial/defense-theaters-detach-pa-20970-s-restore-the-whole-theater/defense-theater-restored-controls-narrow.png) | 390 × 844 | 155,910 | `612c78ecf2e76eadebfbf84606dbf6e536c0b4f573c13880051ec6211b0a6446` |

The draft screenshot shows an unsubmitted “Border watch” editor and `0 / 8 theaters`. The earlier `1 orders accepted · 0 refused` belongs to a separate standing-posting action; it must not be captioned as successful theater creation. Its labels and fields are readable at 390px. The form continues through ordinary vertical scrolling.

The desktop report shows enabled Border watch, the Pause/Delete controls, a paginated member list, the posting override, and a last-dispatch disclosure. The narrow report wraps the same summary and both hearth reports legibly, with usable full-width controls and no horizontal overlap. Intentional vertical scrolling means neither image presents all 100 members simultaneously. Source CSS provides bounded scrolling, wrapping, and native controls with 44px minimum heights; keyboard behavior is supported by the browser assertions, rather than inferred from pixels.

The restored screenshot follows page reload and real portable import, after the journey's separate exact manual-restore checks. It shows Saved watch with its restored 100-member configuration. The subsequent replacement with one member occurs after this capture and must not be attributed to this image.

Two recovery captures were also visually inspected: [worker error lock](recovery-browser-initial-output/defense-theater-recovery-a-65427-ion-without-automatic-retry/recovery-worker-crash-locked.png) (`6258f0d10d96c1674d7d912257cf729389ae030070eb01715fe03640dc2fc07d`, 390 × 844, 153,381 bytes) and [missing ordinary-turn view lock](recovery-browser-initial-output/defense-theater-recovery-a-75c55-y-erase-delegation-controls/recovery-missing-turn-view-locked.png) (`59c3728bbbb53744eb277cc629b17e1188da3c2e408366cc222f5e74dfb6a6c7`, 1440 × 1000, 988,466 bytes). Both visibly preserve a readable prior view while disabling orders and directing the player to restore a saved campaign. The other two retained fault captures are supported by their passing browser assertions, without a separate pixel verdict here.

## Fixture and caption boundary

The normal journeys use `theaterCampaign(100)` from [the canonical fixture](../../../packages/test-fixtures/src/theater-fixture.ts): seed 20260927, generator 4, a tiny 48 × 32 map, two realms, authored flat land and cleared deposits, a funded treasury, two hearths at hexes 500 and 510, and 100 owned combat army containers at reserve hex 495. Founding and theater actions use canonical commands. This is an authored scale exercise, not an organically grown campaign or a Legendary 4,000-army fixture.

Approved report caption claim:

> An authored tiny-map exercise with 100 owned combat armies. After one End turn, Border watch reports four incoming guards, two assigned to each hearth, 95 armies in reserve and one standing-posting override. Both hearths still show zero stationed guards; arrival has not yet occurred.

The `0 missing guards` summary includes incoming coverage. It does not prove arrival, combat strength, threat adequacy, or successful defense. The draft image requires an unsubmitted-draft caption; the restored image requires a restored-configuration caption.

## Remaining limits

This evidence does not establish production-browser behavior, organic campaign maturity, whole-campaign pacing, worst-case 512-theater performance, GPU or frame-time budgets, or 1.0 completion. Parent-run pacing and unit work are outside this review's verdict. Existing release gates remain open.

## Additional native illustration review

Later on 27 September, the reviewer inspected the exact [summary text PNG](browser-evidence/text-capture/defense-theaters-a-hundred-2ca15-age-while-postings-override/defense-theater-summary-text.png) at its native resolution, with its [DOM Range capture record](browser-evidence/text-capture/defense-theaters-a-hundred-2ca15-age-while-postings-override/defense-theater-summary-text-capture.json). **Approved as a source illustration candidate**, subject to separate final journal layout review.

- Native PNG: **406 × 19**, **4,295 bytes**, SHA-256 `1bf7e35a12e1dbccc0ed98498eaa5adff5aa99edf4da16d0e2df863c5862399c`.
- Actual browser viewport: **1440 × 1000**, device scale **1**. This is a desktop text clip, not a 390px capture.
- DOM Range bounds: x `328`, y `282.75`, width `403.109375`, height `16`. The native screenshot rectangle is x `327`, y `281`, width `406`, height `19`, with safety padding around the text.
- Source locator: `[data-testid="theater-report"] > p:first-of-type`; turn **2**, canonical hash **`a1fb1216`**.
- The complete visible sentence is “0 missing guards · 4 incoming · 95 in reserve · 1 direct overrides.” The first and last glyphs, separators and incoming qualifier are intact and readable. No CSS change, post-capture crop, resizing, editing or re-encoding was used. The browser screenshot itself captures the recorded rectangle.

The [capture journey](text-capture.log) passed once in 8.3 seconds, 9.4 seconds for the run. It repeats an existing authored journey and adds no distinct acceptance scenario. The larger whole-paragraph captures remain evidence; this native text-bounds capture changes neither their bytes nor the UI.

Approved caption: **“Native 406 × 19 text capture from the authored 100-army, two-hearth scenario at turn 2: zero missing guards includes four incoming armies, with 95 in reserve and one direct override. The incoming armies have not yet arrived.”** This image shows a bounded coverage summary; it does not show the full editor, organic campaign maturity, stationed garrisons, frame performance or a closed release gate. Adding 4,295 bytes to the existing 3,141,226-byte journal inventory yields 3,145,521 bytes, leaving 207 bytes under the unchanged 3 MiB cap. Final manifest accounting remains a publication check.

## Initial generated-production image review

The reviewer also inspected [the initial production restoration capture](browser-evidence/production-initial/production-defense-theater-e56cf-n-without-development-hooks/production-defense-theater-restored-narrow.png): **390 × 844**, **140,249 bytes**, SHA-256 `b9a628b56ece20a99a1a246a0999c07c360527c9c9d0b14b32255eb8e3ccd31e`. **No blocking layout finding.** Save/reset/pause/delete controls remain distinct, text wraps within the registry, and the protected-hearth row is legible without horizontal overlap.

This image shows enabled Home defense and Watch Hearth at hex 1053 with **one stationed guard, zero incoming, one required and zero missing**. It is a separate generated campaign and must not be captioned with the authored hundred-army scenario's four incoming guards. The [initial production log](production-initial.log) records one real-control journey passing in 4.8 seconds, 5.8 seconds for the run, covering saved restoration/portable import without development hooks. It predates the final AI reachability correction; this visual review does not replace the planned final-build production rerun.
