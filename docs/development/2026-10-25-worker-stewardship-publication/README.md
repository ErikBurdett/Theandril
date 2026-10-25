# Worker stewardship publication

Source checkpoint `97b248ed596c931f01d0df66d60fcf25f819eaef` is published.
[Implementation evidence](../2026-10-25-worker-stewardship/README.md).

Both [Actions](source-actions.json) succeeded:
- [Pages40220803748](https://github.com/ErikBurdett/Theandril/actions/runs/40220803748)
- [Verify40220803756](https://github.com/ErikBurdett/Theandril/actions/runs/40220803756)

[Exact source readback](source-readback/readback.json) passes against an isolated
local97b248e build, including regenerated build feed. The existing edition20
journal remains unchanged in this source commit; the new feature is in its game
and worker bundles. An initial readback invocation lacked its output parent and
failed before fetching; the log is retained and the parent was created.

[Six source live cases](source-live.log) pass in55.6seconds. These are the same
six new individual/group/recovery cases from the twelve-case local run, not
additive coverage. The real public game is used without development hooks.
Live images, exported campaigns and hashes are under `source-live-results/`.

Developer-dispatch publication, full local Pages coverage and final readback will
be appended after verification. M3, DH-021, R06 and all fifteen release gates
remain open; this is development publication.

## Publication review and retained corrections

The journal candidate passes2,434tests /294files in66.41seconds, typecheck, lint,
content validation, art validation and the Pages build. [Editorial review](editorial-review.md)
verifies all15pinned evidence paths and scope. [Image review](image-review.json)
preserves the exact13,857-byte native strip and all24historical records; the
25-image total is3,641,840bytes under the unchanged cap. [Layout review](layout-review.md)
inspects16actual captures across four viewport/text-scale configurations. The
small mobile raster is supporting illustration; readable captions and inspection
links carry its meaning. The existing keyboard enlargement case uses a historical
culture image, not this new asset.

The first whole Pages run passed71cases and failed one older patrol-retirement
fixture assertion before browser gameplay. Its original SHA256 stays unchanged;
the corrected assertion explicitly requests its frozen rules35seal rather than
comparing that seal to a migrated36hash. Both historical and current initial hashes
are now recorded. [Initial full run](browser.log), including retained trace.

A final one-line presentation correction changes the plural feedback from
“worker policys” to “worker policies”. It changes no canonical command, allocation,
record, save schema or AI behavior. Final checks and the whole Pages rerun are
recorded separately; their counts overlap the earlier scopes.

## Final local candidate

After the feedback correction and explicit historical-hash assertion:
- [Full suite](tests-final.log): **2,434tests /294files pass in62.45seconds**.
- [Typecheck](typecheck-final.log), [lint](lint-final.log) and [Pages build](build-final.log) pass.
- [Whole Pages suite](browser-final.log): **all72cases pass in4.9minutes**,
  including the genuine captured-hearth patrol's actual subsequent movement.
- Content and art validation passed separately; no candidate artwork was promoted
  by numeric validation. The new journal screenshot has its own exact-byte review.

The first and final browser runs, source twelve-case checks and six live checks
overlap; their counts are not additive. Layout review uses the first run's sixteen
journal captures, whose cases already passed; the final run repeats those four
viewports against unchanged journal content. Source/policy behavior and editorial
scope remain those described at97b248e, with the final feedback wording corrected.
