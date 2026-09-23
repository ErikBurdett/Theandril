# Fleet deployment and group postings — 2026-09-23

The user requested deployment of the completed fleet work and continued development.
Fleet rules/save31 was committed as `b623c2c91d4d852cba710f2d996c28a6b1b5d624`
and pushed; [Verify build](https://github.com/ErikBurdett/Theandril/actions/runs/35905372218)
and [Pages](https://github.com/ErikBurdett/Theandril/actions/runs/35905372172) passed.

## Continued development: ACT-32 / M3

The army registry selects up to128 owned land armies ashore across its25-row
pages and filters. Hold or Join targets each army’s current hex or one owned
hearth. Clearing postings skips selected armies without one. Accepted armies
leave the selection; canonical refusals retain it for review. Ordinary individual
orders still override one member without changing the others. Selection is an
unsaved editing convenience; postings are ordinary saved campaign state.

One bounded worker request records every ordinary command in stable army-ID
order and sends one final permitted observation. This changes no simulation rule,
AI policy, canonical schema, content seal or campaign pricing. Whole-envelope
validation precedes mutation. Valid commands can be partly refused; recording
interruption stops the sequence and requires restore, without claiming rollback.
[Architecture0039](../../architecture/0039-group-postings.md) documents the boundary.

## Verified locally

- [Full suite](tests-final.log):1,876/1,876 tests in234 files,29.46s.
- [Affected browser journeys](browser-final.log):7/7 in42.5s. Includes authored
  Legendary40-hearth/100-owned-army/4,000-total-army selection, one response,
  individual override, clearing and manual-save restoration; actual partial
  canonical refusal; two damaged-response recovery cases; existing postings,
  keyboard registry navigation and390px controls.
- [Production Pages journeys](pages-final.log):27/27 in30.1s, including the real
  worker, approved assets, battles, map actions, watch fog, journal, roadmap,
  keyboard routes and390px/130% text. The first run found one stale homepage
  assertion expecting four dispatches instead of five; the full rerun passes.
- [Typecheck](typecheck.log), [lint](lint.log),
  [content validation](content-validation.log), [art validation](art-validation.log),
  and [Pages-subpath build](build.log) pass. Art structural validation is not new
  visual approval. Build retains its existing large-bundle warning.
- [Independent code review](code-review.md): corrected an error-path promise
  that could remain pending after rejected map metadata or a missing result.
  The two real-worker browser fault injections now pass. Recorder-failure tests
  separately verify actual partial state and recovery.
- [Publication factual review](publication-review.md) and
  [journal preparation](journal-preparation.md): sequence5 fleet claims, exact
  image bytes, historical dispatch preservation and15 open release gates checked.
- Desktop and390px [screenshots](screenshots/provenance.json) inspected: readable
  counts, checkboxes, result message and reachable posting/clear controls; narrow
  panel scroll is intentional and has no horizontal document overflow.

The worker regression compares100 batch postings with100 serial requests over
an authored100-company fixture: equal archives, replay and hash `e43b0ca7`;
531,302 versus51,416,921 transferred bytes (about96.8 times less), one state versus100.
Single-run harness times in architecture0039 are illustrative, not browser or
whole-campaign performance distributions. The browser separately verifies that
one batch adds exactly one final packet to its transfer counter and no cell rows.
An empty packed-cell header is39bytes. No global each-turn/frame work was added.
Pacing was not rerun for this UI/transport slice: canonical command behavior and AI
are unchanged; the fleet measurements remain234/342/379 for Standard/Long/Epic.

## Corrected verification assumptions

Initial browser failures are retained beside this record: the empty packet has a
39-byte header, not zero bytes; imported historical saves continue under current
rules (historical replay stays pinned); and the existing individual button says
“Update posting” once a posting exists. Tests now use the exact codec size, a real
canonical-capacity partial refusal, and the actual control. No timeout, rule or
acceptance bound was weakened. Sandboxed TypeScript validation initially could
not open its local IPC socket; authorized runs outside the sandbox passed.

## Open scope

ACT-32 and M3 remain in progress. Theater strategy, patrol/escort roles, durable
named groups, broader order templates, settlement batch policies and combined
late-campaign automation acceptance remain. Group selection currently covers
land armies ashore, not fleets or embarked passengers. This slice does not change
movement, arrival/join capacity, war decisions, fleet logistics or AI behavior.
All fifteen release gates remain open. Standard/Long pacing and sustained naval
recovery remain explicit fleet limitations. Publication evidence is recorded in
the prompt report after exact revision and public readback checks.
