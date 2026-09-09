# Random campaigns, hearth districts and specialist formations

The local slice starts from `a57b463`. It changes setup entropy, observed map
presentation and paid unit content. It does not regenerate old worlds. Current
rules/save version is 15, content seal `eec4003a`; faction roster 4 and physical
generator 7 are unchanged. The original rules-14 content and captured replay
remain frozen.

## Map workload and measurements

The before/after renderer scenario retains the same generator-4 Huge geography,
196,608 cells, 32 towns, 1,500 global singleton armies, ordinary entity fog and
1440×696 canvas. It imports a strict synthetic save and does not advance turns.
Rules/content change the envelope seal from `b14aa18a` to `98c948c0`; this is not
an identical-save comparison. The packed geography transfer is unchanged.
Measurements use system Chromium with software WebGL; the two final large-map
cases ran before the full headless/build jobs started. Frame p95 is the existing
rolling 240-frame counter, not a fresh independent distribution per stage.

| Measurement | Before | After |
| --- | ---: | ---: |
| Warm near/pan/far frame p95 | 16.7–16.8 ms | 16.7–16.8 ms |
| Initial sampled frame p95 | 33.3 ms | 16.8 ms |
| Maximum cached terrain | 18 chunks / 72 MiB | 18 chunks / 72 MiB |
| Map atlas RGBA | 16 MiB | 17 MiB |
| Packed cell transfer | 1,769,695 bytes | 1,769,695 bytes |
| Complete initial transfer | 1,974,826 bytes | 1,975,374 bytes |

The 548-byte publication increase is observed metadata, not per-frame transfer.
The initial timing difference is one local sample and is not evidence of a
startup optimization. [Before](0038-map-before.json), [after](0038-map-after.json).

The separate [dense military case](0038-army-stacks.json) owns and observes all
1,500 army containers and 18,000 formations on 91 cells. It draws 273 near army
figures plus the town, preserves all roster counts, and switches to strategic
markers and the bounded world raster. Rolling p95 is 33.4 ms for near/strategic
and restored focus, 16.8 ms for overview; some 33.4 ms samples also existed in
[slice 25](0037-army-stacks.json). Maximum cache backing is 24 chunks / 96 MiB,
with a separate 3,148,800-byte overview texture. The complete transfer is
10,300,797 bytes. This is not a universal 60 fps or physical-GPU claim.

The [generated Huge archipelago check](0038-geography.json) uses the actual
worker, seed 74 and 32 seats. Reveal, river inspection, pan, full overview and
restored fog preserve `e9e4bd02`. It ran during the final headless work, so its
acknowledgement/generation timings are under concurrent load and are not the
isolated comparison above. No observation budget, fog assertion or texture
limit was relaxed to pass these cases.

Claim indexing and district derivation run on map publications. Population,
buildings, workers and visible work create only affected-chunk invalidations;
idle frames do not rescan the whole map or read texture pixels. Mature housing
and all civic types have actual narrow/near/far gameplay evidence. These Huge
performance fixtures are not thousand-turn, densely built 32-city empires;
long-campaign district density, browser/GPU heap and saturated caches remain
separate profiling work.

## Artwork and direct review

All 516 assets / 579 frames have durable approvals. Ten new original sources
supply five researched sites and five civic buildings. A separately compiled
512² `map-works` page adds 36,079 PNG bytes / 1 MiB estimated RGBA; the exact
foundation PNG and metadata are unchanged. All map pages total 17 MiB; lazy
battle use brings that to 21 MiB. These figures exclude cached terrain, DOM
atlas copies, materials, texture pools and other GPU allocations.

[Native/source review and compiler measurements](../art/reviews/HEARTH_IMPROVEMENTS.md)
retain genuine generation, actual Snapper/Aseprite outputs and reviewed pixels.
[Runtime evidence](../art/reviews/slice26/README.md) includes the rejected flat
civic/grey-pad draft and accepted quieter pixel-art neighborhoods. Exact
all-frame opaque geometry covers all fifteen improvement/civic assets. All
five civic forms have actual gameplay visual review, including an unobstructed
coastal harbor at 390-pixel width. The advanced-improvement narrow capture
partly covers its southern garden with controls; its desktop and per-site
views establish that artwork. Fractional camera scaling remains intentional.

## Verification and limits

The first full Chromium run was **130/139 in 14.0 minutes**. Eight failures were
full-document live reloads during AI edits, confirmed by trace/source-write
timestamps; one selector incorrectly assumed scout art was unique after two
specialists began sharing it. Scoping that assertion to its actual production
card preserves the approved-art requirement. With product sources frozen,
**35/35 passed in 3.4 minutes**, followed by **3/3 in 41.9 seconds** for the Mire
culture, actual AI-watch contact and durable coastal evidence. Every current
**140 gameplay scenario** has passing evidence across these runs; this is not
one 140/140 invocation. [Full checkpoint](0038-browser-checkpoint.txt),
[final integration](0038-browser-final.txt), [final evidence](0038-browser-evidence.txt).

The first harbor discovery attempt hit a Node JSON-module import mismatch in
the new test, fixed by resolving the same pure fitter in the browser's Vite
module graph. A later browser launch without the explicit executable found no
matching bundled browser; the successful runs use installed system Chromium.
Neither attempt exercised gameplay, and neither is counted as a passing run.

The default-parallel headless checkpoint was **1,494/1,497 in 93.02 seconds**:
Standard/four-seat contact, Huge/32-seat contact and the Epic 60-second replay
budget failed. The follow-up trace found an introduced passenger-transport tie
change; retaining established transport routing while applying ID-independent
ties to dedicated scouts fixes the Huge gate. Actual-source focused AI checks
pass **51/52**, with Standard24 and Huge32 both passing their unchanged contact
and saved-command-mirror assertions. Only Standard4 remains in that focused
run. [AI correction and causal evidence](0035-specialist-roster-validation.md),
[intermediate full headless](0038-headless-checkpoint.txt).

The final full headless run with four workers passes **1,495/1,497 across
163 files in 79.83 seconds**. The remaining failures are Standard/four-seat
contact and the existing Epic 60-second replay budget; Standard24 and Huge32
now pass in the full suite too. All tests remain enabled. Actual rebuilt
production passes **4/4 in 15.8 seconds**: verified assets and worker creation,
paid map work with save restoration, exact tactical outcomes and spectator
fog without development hooks. [Final headless](0038-headless-final.txt),
[production](0038-production.txt), [build](0038-build.txt).
The one-file, one-worker Short/Epic follow-up passes **2/2 in 58.72 seconds**,
including its long saved continuation and replay checks. This separates the
parallel duration failure from canonical replay correctness; it does not waive
the full-suite time budget. [Short/Epic follow-up](0038-epic-single-file.txt).

Whole typecheck and lint pass. All eight changed repo skills pass structural
validation. Final rebuild takes **4.066 seconds** (Vite 3.63 seconds); the
preceding concurrent build took 14.577 seconds and is not an isolated timing
comparison. Large-main-chunk and upstream Zod annotation warnings remain
visible. Main JS is **935.52 kB / 287.81 kB gzip**, worker **610.62 kB** and
CSS **95.37 kB / 18.88 kB gzip**. These are bundler sizes, not downloaded-session
memory. No contact target, timeout, canonical assertion or replay scope is
weakened. This local slice is not a 1.0 release or multiplayer signoff.
