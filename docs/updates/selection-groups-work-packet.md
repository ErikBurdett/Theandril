# Saved realm groups — work packet

- State: draft dispatch; implementation locally verified (1,941 tests / 243 files, 20 affected browser journeys, one production journey).
- Source baseline: `6cb7692c800464d3c5ad66b42df6cf063ffeb0ca`.
- Intended source revision: to be pinned after verification.
- Rules/save: 32; content remains `015468d1`.
- Tracker: ACT-32 / M3.

Players can issue the same posting or charter to a selected collection, but must
select those members again after restoring a campaign. This slice stores named
army/hearth selections in the campaign and makes Recall explicit. Applying
orders remains separate. Names and membership follow campaign exports; personal
charter templates retain their existing browser-local boundary.

Evidence is being collected under
`docs/development/2026-09-25-selection-groups/`. Before publication, record exact
local checks, meaningful browser screenshots and provenance, independent code
and factual review, compatibility, measured overhead and remaining limitations.

No new gameplay scope is added. This implements a bounded part of existing
army grouping and giant-empire management. All fifteen release gates remain
open; deployment does not establish release acceptance. Publication is already
authorized by the user's instruction to deploy changes and continue development.

Retained corrections: fresh migration defaults, malformed-response recovery,
current64-seat research save support with frozen historical48-row schemas, and
the browser test completion barrier. Synthetic metadata reconciliation and
transfer overhead are measured in benchmark.json; no new pacing result is claimed.
Compact genuine screenshot: 318×121, 15,348 bytes, no postprocessing. Independent
code and visual reviews pass. Exact source pin and publication checks follow.
