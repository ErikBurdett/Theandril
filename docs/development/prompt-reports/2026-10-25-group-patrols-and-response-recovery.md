# Group patrol controls and verified reply recovery

## Prompt

“continue”, under the standing instruction to continue toward 1.0 and deploy each feature or fix.

## Delivered

Two updates were committed, deployed separately to [GitHub Pages](https://erikburdett.github.io/Theandril/) and checked there:

| Update | Player outcome | Publication and proof |
| --- | --- | --- |
| Group patrol controls | Pause enabled policies, resume paused policies or remove policies across checked land armies ashore. Existing travel stays intact; unaffected and refused actors remain checked. | Implementation `8d880eb`, publication `5cb7dc8`; [four live journeys and exact readback](../2026-10-24-group-patrol-publication/deployment.json). |
| Posting/charter reply recovery | Missing, duplicate or unrelated result rows no longer appear as successful orders. The UI retains selection and requires saved restoration before further play. | Fix `912b873`; [eight targeted live journeys and exact readback](../2026-10-25-group-response-review/deployment.json). |

Reviewed dispatch 18 explains patrol controls with an exact native control capture and pinned implementation evidence. Prior dispatches and images are preserved. The catalogue retains 23 items, 90 delivered and 49 remaining editorial bullets, with all fifteen release gates open; these are not a completion percentage.

## Changed

- Registry and worker client: explicit group patrol controls, hash-bound batches of at most 128 actors, exact replies, partial refusal handling and shared busy/recovery locks. The worker executes ordinary canonical commands in stable order and publishes one final state/autosave.
- Legacy reply handling: posting and charter request wrappers retain actor/faction identity and validate before state adoption. The generic request helper remains byte-identical; rejected enqueue attempts cannot reach the worker.
- Evidence and documentation: production journeys, genuine fail-before cases, exact save/replay exports, source and visual review, headless worker measurements, dispatch 18, canonical status/M3/performance records and this report.

## Verified

Final local source passes **2,352 tests across 286 files in 60.66 seconds**, four workers; [log](../2026-10-25-group-response-review/full-tests-final.log). Typecheck, lint and Pages build pass. All **57 local Pages journeys pass in 2.9 minutes**; [exact scope](../2026-10-25-group-response-review/local-acceptance.json). Independent [source review](../2026-10-25-group-response-review/integration-review.md) and [browser/export review](../2026-10-25-group-response-review/browser-review.md) find no scoped blocker.

The authored 101-army patrol workflow executes 49/99/99 pause/resume/remove orders, retains 52/2/2 unaffected checks and restores its exact 352-record archive without changing armies, routes or postings. Six Huge/Legendary 128-policy samples preserve exact serial replay/autosave; [measurements and limits](../2026-10-24-group-patrols/worker-benchmark.md). These Node worker-module/fake-storage timings are not browser Worker latency, physical disk or percentile claims.

Two old-build browser cases genuinely reproduced false “2 accepted” results after real commands, leaving one actor checked and End turn enabled. All six corrected fault cases now require restoration. Twelve independently decoded exports preserve exact zero-record manual restoration and two-record explicit retry, with posting/charter hashes `782d91b7`/`caafaa3d`; [replay evidence](../2026-10-25-group-response-review/export-review.json). Native images show retained selection and disabled controls; posting alert text is below the captured scroll position, so its content proof comes from DOM assertions and retained panel text.

Both publications have successful build and Pages workflows and exact public asset/source/catalogue/ledger readback. Live scopes are separate: four patrol journeys in 26.4 seconds, then eight posting/charter journeys in 37.4 seconds. The final fix did not rerun all 57 journeys live. The original failures and the first typecheck's TS2345 error remain retained; a direct validated-record field read corrected that error, and final checks pass without weakened assertions or timeouts.

Work remained in the user's primary checkout `/home/telephoneheater/Work/Theandril`, branch `master`. At final feature verification, local HEAD and `origin/master` both equal live fix `912b8736b1c417e203a30b617bc041f62659ff52`. The subsequent documentation commit records these completed outcomes and this report; it changes no application, test, simulation or workflow source.

## Not done / blocked / caveats

**ACT-32/M3, R06, DH-021 and all fifteen release gates remain open.** These are development deployments, not 1.0 acceptance. Rules/save remain 35 and content remains `015468d1`; neither change alters automatic turns or campaign pacing, so no new pacing run is claimed.

Mobile escorts still need target lifecycle, direct-order precedence and coordinated leader/follower movement. Fixed-cell following alone would not establish protection. Broader governors/programs, organic mature-empire acceptance, memory/transfer budgets and cross-browser release verification remain unfinished. Reply fault injections establish recovery behavior; they do not claim healthy workers naturally emit damaged lists or that restoration rolls back a worker mutation automatically. Legacy posting/charter requests still lack the newer patrol intent-hash check.

## Follow-ups

Continue the existing [M3 plan](../../1.0-DEVELOPMENT.md) with complete escort/delegation behavior and organic mature-realm evidence. Keep fixed-pack headline pacing work under DH-021 and broader strategic counterplay under R06 separate from this transport/UI work. The [canonical status](../../IMPLEMENTATION_STATUS.md) and release gates remain authoritative.
