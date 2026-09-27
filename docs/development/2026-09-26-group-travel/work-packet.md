# Coordinated travel — dispatch work packet

Reviewed implementation candidate, 27 September 2026. Local verification is complete; the public dispatch and live publication checks remain separate.
Follow the [dispatch contract](../../updates/CONTRIBUTING.md); no delivery claims
or source pin are final until the underlying checks and reviews pass.

Player problem: assembling or redirecting a large force still requires opening
each army's travel controls. Saved groups and postings already exist; the missing
piece is applying ordinary direct journeys to the checked armies together.

Proposed demonstration: recall an authored hundred-army group, explicitly review
a shared destination, apply ordinary routes, inspect canonical refusals, override
one army, then restore the exact campaign through real saves. Show why canceling
a journey leaves a standing posting able to march again. Label authored worlds
and native imagery clearly.

Evidence will separate headless command/history equivalence, real worker transfer
measurements, development browser fixtures, generated production campaigns and
live publication. Retain initial failures, uncertainty recovery and query cost.

Scope stays within existing coordinated-orders acceptance. Rules/save 32 and
content `015468d1` are unchanged; no theater planner, patrol/escort role or personal
army-template library is claimed. M3 and all fifteen release gates remain open.
Publication remains covered by the user's continuing deployment authorization.

Local evidence: 2,000 headless tests / 250 files; 23 distinct affected gameplay
journeys across overlapping 21-case and six-case runs; one separate generated
production journey; typecheck, lint, content/art validation and Pages build pass.
Four bounded worker measurements and source/pixel reviews are retained in the
checkpoint README. The 318×19 result PNG is 2,337 exact native bytes; publication
will retain its original source and hash without transformation.

Reviewed implementation source: `3b0918999a166f36f6f3d51fbcb49413de549163`.
Dispatch 11 will pin this source and retain previous published dispatches.

Final publication candidate: 2,000 tests / 250 files in53.68 seconds and33/33
local Pages journeys in1.0 minute. Independent factual and rendered reviews pass.
The existing media cap remains3MiB; all16images total3,141,226bytes. Initial
sandbox checks, stale browser expectation and corrected capture evidence remain
recorded in the README. Publication remains authorized and live checks follow.
