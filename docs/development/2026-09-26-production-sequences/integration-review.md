# Production sequence integration review

26 September 2026. Parent review: independent of the worker/protocol, template
store and UI authors; author of main-thread wiring/correlation and recovery tests.
This is not an independent review of those parent-owned files. The separate
storage/main review and UI review disclose their own authorship boundaries.

The worker preflights the entire bounded envelope before mutation, copies/sorts
hearth IDs, preserves item order and journals each ordinary queue attempt.
Canonical refusals stop only that hearth; a recorder exception stops the batch,
omits uncertain outcomes and retains recovery. Publication failures also lock.
No queue eligibility, price or AI rule is duplicated in worker/UI. Response rows
contain attempted prefixes, and own-seat/watch/battle/victory guards precede work.
The benchmark verifies640attempts as the bounded ceiling, single publication,
exact replay/recorded order and unchanged fog. Large observation transfers remain.

Personal storage uses a separate bounded/version-checked database, transactional
whole-library validation and cloned ordered items. Template actions issue no game
commands. UI editing and direct Apply survive library errors, while explicit
Recall and Apply stay separate. Completed rows clear selection, paid partial
prefixes remain visible, manual reapplication is not misrepresented as resume.
Existing hearth selection and individual queue controls remain integrated.

No blocking source finding remains. The current-worker crash lock was identified
by the independent main reviewer and corrected before final browser acceptance.
Actual five recovery journeys now pass, including crash after real paid commands
and restoration of the real manual save. The initial forty-hearth browser count
omitted the normal selected-army movement refresh; its replacement asserts the
exact production/state and movement/query pairs separately, not a loose bound.
Canonical charters are checked against serial observation with two real policies.

Evidence: full implementation1975/247 in tests.log; thirty affected browser
journeys in browser-final.log; generated built-production journey in
production-initial.log. No timeout change, skip or assertion suppression. The
full suite includes determinism/save/replay coverage; existing simulation/rules,
AI, prices and content are unchanged. No new headline pacing run is warranted or
claimed. Build warning about large chunks remains visible. Publication tests and
live evidence are separate; no M3 or whole release gate is completed.
