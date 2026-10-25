# Land commission publication

Implementation `24a710aaa8ddc49aa4ce56173ac043fe4ba1f767` is published.
[Implementation packet](../2026-10-25-land-commissions/README.md).

Both [exact-commit workflows](source-actions.json) succeeded:
[Pages 40227169802](https://github.com/ErikBurdett/Theandril/actions/runs/40227169802)
and [Verify 40227169868](https://github.com/ErikBurdett/Theandril/actions/runs/40227169868).
[Exact public readback](source-readback/readback.json) passes against the isolated
24a710a build, including its regenerated feed. That source commit still carries
the unchanged edition-21 journal pinned to 97b248e; the rules-37 land commission
feature is in the game and worker assets. Dispatch 22 is verified separately.

The first [two live attempts](source-live.log) both failed before page load with
`net::ERR_NETWORK_CHANGED`. Their screenshots and traces are retained in
`source-live-results/`. The unchanged checks rerun outside the sandbox
[both pass in 14.0 seconds](source-live-retry.log), with
[captures and exported campaigns](source-live-retry-results/). No game code,
assertion or timeout was changed to obtain the passing result.

## Reviewed journal candidate

Edition 22, **Give land work a budget**, pins source 24a710a and sixteen specific
evidence paths. It preserves historical articles and all twenty-five existing
image records/bytes. The exact new native summary adds 14,026 bytes, bringing
twenty-six images to 3,655,866 bytes under the unchanged 3,670,016-byte cap.
[Image preservation review](image-review.json),
[parent source-image review](image-source-review.json).

The existing catalogue retains twenty-three stable items: six completed,
thirteen in progress and four pending. Its ninety-four delivered and forty-nine
remaining statements are editorial counts, not completion percentages. ACT-32/M3,
DH-021, R06 and all fifteen release gates remain open.

[Focused journal tests](journal-focused-final.log) pass 38 cases after correcting one
test-only latest-entry list; the initial 37-pass/one-failure result is retained.
No new canonical behavior follows the verified source commit.

## Final local publication checks

[Full suite](tests.log): **2,463 tests / 298 files pass in 70.85 seconds**.
[Typecheck](typecheck.log), [lint](lint.log), [content validation](content.log),
[art validation](art.log) and [Pages build](build.log) pass. Numeric candidate
art validation does not grant visual approval; the screenshot has its own review.

The first affected browser run passed eighteen cases and failed one old latest-
checkpoint count assertion (2,432 versus pinned-source 2,461) in the scope ledger.
[Initial log](browser.log) and its trace/screenshot are retained under
`browser-results/gameplay-updates-scope-led-e1003-an-reach-authoring-guidance/`.
Only that test expectation changed; journal and game runtime stayed identical.
[The full affected rerun](browser-final.log) passes **all nineteen cases in
28.0 seconds**: seven roadmap, ten reader and two commission journeys.

The source's full seventy-four-case run and these nineteen cases overlap; they
are not additive. Sixteen actual reader captures and four layout records are
retained from the first run, whose four viewport cases already passed. The final
run repeats them against unchanged journal content. Existing keyboard image
enlargement uses a historical culture illustration; this is not a separate new-
image keyboard-enlargement claim. [Editorial review](editorial-review.md) verifies
all sixteen pinned evidence paths, historical preservation and factual scope.
[Independent displayed review](layout-review.md) inspects all sixteen captures
across 1440px, 1366px and 390px at normal and enlarged text. No blocking clipping
or overlap is found. All four metadata records have complete images, no page
errors and no game workers. The tiny mobile raster remains supporting imagery;
its full caption and Inspect/Original links remain readable. Public journal
readback is recorded separately after deployment.
