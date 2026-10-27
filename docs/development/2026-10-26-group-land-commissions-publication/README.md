# Group commission publication — 2026-10-26

Feature source: `cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5`.
[Implementation evidence](../2026-10-26-group-land-commissions/README.md).
This packet records publication separately from local implementation acceptance.

Rules/save 37 and content 015468d1 remain unchanged. The feature's full local suite
passes 2,486 tests / 300 files; all 78 distinct Pages cases have passing results across
the retained 76-pass/two-failure run and corrected seven-case rerun. The two browser
failures are a stale historical journal count and a new form capture's scroll
position; runtime code, assertion thresholds and timeouts were unchanged. Exact
narrow form bounds and independent source/visual reviews are retained with source.

The substantial change advances existing ACT-32/M3 group management. It does not
close M3, DH-021, R06 or any of the fifteen 1.0 gates. It adds no new gameplay scope.
Publication workflow results, exact public-file comparisons and live tests are
recorded below after completion; no deployment success is inferred from a push.

## Source deployment, verified after restart on 27 October

The interrupted upload completed. Both exact source workflows succeeded:
[Pages 40393128385](https://github.com/ErikBurdett/Theandril/actions/runs/40393128385)
and [Verify 40393128217](https://github.com/ErikBurdett/Theandril/actions/runs/40393128217).
[Actions identity](source-actions.json) and [exact public-file comparison](source-readback/readback.json)
verify cfd660c against its preserved isolated production build and regenerated
change feed. This feature commit still carries edition 22, pinned to 24a710a;
edition 23 is checked separately. No second upload was needed after recovery.

## Reviewed journal candidate

Edition 23, **Give several hearths a land budget**, pins cfd660c and fifteen exact
source paths. [Independent editorial review](editorial-review.md) and
[verification data](editorial-verification.json) preserve every historical article
and all 26 historical image records/bytes. The exact new 780×28 native budget strip
adds 6,426 bytes, bringing 27 images to 3,662,292 bytes under the unchanged 3,670,016-byte
cap. It illustrates permission wording only; captions and inspection links explain
its limits. [Catalogue review](catalogue-review.json) retains 23 stable items with
6 completed / 13 in-progress / 4 pending statuses, 94 delivered / 49 remaining editorial
statements and 15 open gates; these counts are not release percentages.

The first focused journal check passed 44 cases and failed one stale latest-entry
expectation. Its corrected [45-case rerun](journal-focused-final.log) passed;
[journal-focused.log](journal-focused.log) retains the original result.
Publication typecheck then found a test comparison against a status excluded by
the gate type; the assertion now tests membership in the two allowed open statuses,
as the other gate tests already do. [Original diagnostic](typecheck-initial.log)
is retained. No production behavior or gate status changed for either correction.


All [four live source journeys](source-live.log) pass in 42.4 seconds without retries,
with [actual captures and exported replay](source-live-results/). They cover the
thirty-hearth shared purse and three deliberately damaged native-worker replies
after payment, including saved restoration and explicit single-payment retry.

## Final local journal integration

[Full suite](tests.log): **2,488 tests / 300 files pass in 135.33 seconds** with two
workers. [Final typecheck](typecheck-final.log), [lint](lint-final.log),
[content](content.log), [art validation](art.log) and [Pages build](build.log) pass.
The source rule/AI code remains unchanged. A subsequent [focused roadmap unit
run](roadmap-final.log) verifies the equivalent allowed-status assertion correction.

The [first affected browser run](browser.log) passes 25 of 26 cases; its single failure
was a current-roadmap link assertion pinned to the previous source revision.
The check now uses the exact current library revision. All [seven roadmap cases](browser-roadmap-final.log)
pass in 5.7 seconds. Thus all **26 distinct affected local cases** have passing results
across these runs, not 26 passes in one run. The original failure trace and screenshot
remain under `browser-results/`; runtime code was unchanged for the correction.

[Independent displayed review](layout-review.md) inspects sixteen retained reader
captures across 1440px, 1366px and 390px at 100%/130% text. Four layout metadata records
have loaded images, no page errors and no game workers. The tiny mobile budget
strip is supporting illustration with readable caption and Inspect/Original links;
it is not a mobile body-text or completed-work claim. Existing image-keyboard
coverage uses the historical cultures image. Source-pinned article evidence and
all historical assets remain unchanged since editorial approval.

## Journal publication and live verification — 27 October

Reviewed journal commit **d65b016731cb4a4f846975feafac493478a560fa** is deployed.
[Pages 40590239425](https://github.com/ErikBurdett/Theandril/actions/runs/40590239425)
and [Verify 40590239382](https://github.com/ErikBurdett/Theandril/actions/runs/40590239382)
both succeeded; [workflow identities](publication-actions.json) and
[exact public-file readback](public-readback/readback.json) match the isolated
production build, regenerated feed, source pins and native artwork.

All **26 distinct affected live cases** have passing results across retained runs:
[initial run](live.log) passes 21 and fails five; the unchanged
[focused recovery](live-recovery.log) passes four and fails one; the final unchanged
[roadmap case](live-roadmap-final.log) passes in 1.7 seconds. These are not twenty-six
passes in one uninterrupted run. No assertions, timeouts, runtime code or browser
configuration changed between attempts.

[Trace extracts](network-failures.json) document ERR_NETWORK_CHANGED for every
failed case: document navigation, journal image requests, game modules and the
roadmap client module. Read-only workstation diagnosis also observed newly created
virtual network interfaces during this interval; that is a plausible source of
Chromium network notifications, not proof of the underlying cause. No host network
settings or other applications were changed. Original traces, failure screenshots,
live gameplay captures, exact exported campaigns and layout metadata remain under
[live-results](live-results/) and [live-recovery-results](live-recovery-results/).
Passing reruns do not prove application recovery from interrupted asset loads.

The four group journeys passed in the initial live run. The authored thirty-hearth
purse, paid works, paged receipts, narrow form, removal, exact replay and saved
restoration remain verified, as do the three generated-hearth reply-fault cases.
The recovered individual-commission case also passes its narrow manual-work and
exact-replay assertions. All fifteen release gates and the existing pacing issue
remain open. This is a verified development deployment.
