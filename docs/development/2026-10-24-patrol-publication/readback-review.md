# Readback script validation and favicon diagnosis

Date: 2026-10-24. Publication candidate
`04d17762033bd5d0978a117b592272e1b72ec62f`; gameplay/evidence source
`dee74cf9c4e2d153f9c5f5cfdbd9221798205481`.

The [initial local readback](local-readback/readback.json) and its screenshots
remain unchanged. Identity, exact built assets, dispatch, roadmap and production
setup checks completed, but the final console check failed on one resource 404.
That version recorded only console text, so the failure alone did not identify
the resource. It is retained as a failed run, not rewritten as passing evidence.

An isolated browser visit to the same local production preview used both
`console.location()` and Chromium DevTools Protocol Network/Log events. The
[diagnostic](favicon-diagnostic.json) identifies the exact request as
`http://127.0.0.1:4175/favicon.ico`, status 404, resource type `Other` and log source
`network`. The game document has no icon link, so Chromium requests its automatic
origin-root icon. This is outside the `/Theandril/` deployment root; it is not a
failed game, worker, CSS, illustration or provenance URL.

The script now records locations for every console error. Only the exact
same-origin `/favicon.ico` URL, exact browser resource-404 message, and a non-root
deployment are classified under `browserDiagnostics`. The observed URL and text
remain in the JSON. Every other console error, in-project favicon failure,
root-deployment favicon failure, failed request and HTTP error still fails the
readback. No general 404 or console-error suppression was added. Published app
source and browser resources were not changed.

The [final local readback](local-readback-final/readback.json) passes against the
unchanged preview at port 4175. It records the one scoped favicon diagnostic and
empty page-error, failed-request, HTTP-error and console-error arrays. Exact local
HTML and linked JS/CSS/worker bytes, both native image hashes, provenance, newest
ledger revision, dispatch14/evidence pin, roadmap 23 items / 6 completed / 13 in
progress / 4 pending / 86 delivered / 49 remaining / 15 open gates, and game setup
without development hooks all pass. Native screenshots and the separate final
log are retained. No campaign was started and no public-site run is claimed here.

Local-validated script SHA-256:
`358f017896568a05786d475f3ee17308407f6c7c83dbf8f3c0a15363f93b8511`.
Syntax and scoped ESLint checks pass. The script is frozen for the parent's live
publication readback; workflow/deployment identity still requires its separate
GitHub verification.

## Public HTTP/2 wording follow-up

The parent's [first live run](live-readback/readback.json) is retained as failed.
Its application identity, asset and browser checks reached the final console
assertion, which recorded the same exact out-of-project URL,
`https://erikburdett.github.io/favicon.ico`, with the HTTP/2 empty-reason wording
`Failed to load resource: the server responded with a status of 404 ()`.
HTTP-error and failed-request arrays remained empty. This differs from the local
browser message only in its reason phrase, `(Not Found)` versus `()`.

The exception now accepts exactly those two observed complete strings, still
only at the same origin's exact `/favicon.ico` URL outside a subpath deployment.
No wildcard message or general resource-error filter was added. All other
boundaries above remain unchanged; no application source or deployed asset was
edited. The original local and live failures remain intact. The parent's unique
`live-readback-final` rerun will establish the final result; this amendment does
not relabel the initial failure or claim that rerun has passed.

Refrozen script SHA-256:
`bd38fbf2e1c8333ea6b4ae27353adbd6ad260d9a5381ad597e1e4ba02010c90b`.
Syntax and scoped ESLint checks pass.
