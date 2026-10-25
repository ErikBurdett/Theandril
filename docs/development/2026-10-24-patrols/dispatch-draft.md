# Draft dispatch — Keep a watch moving

Publication: **draft, local only**. Proposed slug: `land-patrols`.
Base revision `d06ba4b` plus the [local source manifest](source-manifest.json).
Rules/save **35**; content **`015468d1`** remains unchanged.

## A watch that returns

An army can now patrol between two explored hexes instead of needing a new march
after every arrival. Select a combat land army, open Two-point patrol, enter its
endpoints or choose owned hearths, and start the order. Each turn it uses ordinary
travel toward the next point, then turns back. The inspector reports its next
destination and any reason it is waiting. Working patrols leave the generic idle
list; interrupted travel and stalled patrols remain actionable.

Patrols do not fight automatically. Newly seen threats can pause their ordinary
routes. Direct travel, standing postings, voyages, missions and sieges keep their
priority. Pausing or removing a patrol stops new assignments; the travel already
issued remains visible and can be canceled separately.

The “Pause when war begins” option makes that choice explicit. An opted-in patrol
pauses at the next allocation when its realm is at war, with an event explaining
why. Peace does not silently resume it. A player can change the option while a
patrol is paused without enabling it. AI home patrols use persistent coverage:
they are adopted during peace, then continue patrolling their circuit through war.

## Saved orders and actual scale

The first browser journey makes both patrol legs with End turn, pauses and
resumes, then restores the exact campaign through manual and portable saves.
A second confirms that postings take priority and that removing a patrol leaves
its already issued route intact. An authored Legendary realm locates the last
of one hundred owned armies through the registry and saves its patrol policy.
That scene is a controlled acceptance fixture, not an organically built realm.

Image: [native narrow controls](browser-results/patrols-the-last-of-one-hu-18a76-at-desktop-and-narrow-sizes/patrol-narrow-actions.png).
Caption: “A patrol's saved war policy and its update, pause and remove controls.”
Alt text: “Selected orders for Travel company 100, showing Pause when war begins
checked, Update patrol, Pause patrol and Remove patrol.” The separate endpoint
capture retains the top of the form. No crop, resizing or generated imagery is
used; the final image manifest records exact native bytes.

The allocator has eight route attempts per realm per turn and rotates its
starting point deterministically. Authored Huge and Legendary measurements
configure 1,500 and 4,000 patrols across 32 and 40 realms. One warmup and three
identical-save samples measure allocation medians of about 4.59 and 6.28 ms,
with 256 and 320 actual attempts and no refusals. These are short local routes and
isolated patrol phases; they do not certify worst-case searches, whole turns,
worker transfers or rendering.

## Let the campaigns challenge the design

The initial persistent-patrol candidate completed the twelve-realm Standard-map
headline campaigns at Standard 236, Long 335 and Epic 374, compared with rules 34's
233/311/349. Epic moved into its 350–400 target; Standard and Long remained above
their approximate targets, and Long lengthened by 24 turns.

An experiment made the AI choose the new automatic wartime pause. It correctly
released patrol companies for ordinary army planning, but campaigns finished
later: 243/375/427. Long and Epic changed winners, and war/battle counts rose.
This does not prove one cause for the delay. The player option remains; the AI
keeps persistent home coverage. The packet retains both experiments and the
final remeasurement, which reproduces 236/335/374, alongside the adverse results. No prices,
contact requirements or proxy bounds were changed. DH-021 remains open.

## Compatibility and the road ahead

Rules/save35 preserves original rules34 bytes and replay through frozen schemas
and command execution. Six genuine pre-change save/archive checkpoints were
captured before implementation. Current patrols, target state and policy survive
database reopen and export/import; mixed histories preserve their older records.
Foreign patrol configuration is private. Simulation owns all routes and reports;
UI and AI issue the same commands.

See the [verification packet](README.md), [architecture](../../architecture/0048-land-patrols.md),
[history integration review](integration-review.md) and [AI review](ai-review.md).
The final local suite passes 2,206 tests across 273 files in 56.85 seconds.
Eleven distinct affected gameplay journeys pass across retained runs, and three
production journeys pass in 11.3 seconds. Typecheck, lint, content validation and
build pass. [Source](source-manifest.json) and [image](image-manifest.json)
manifests identify this local checkpoint. The initial development-server reload
interruption and fixture/version-assertion corrections remain recorded. The
draft still needs a publication revision and journal reader review before release.

This advances existing ACT-32/M3 and the `empire-management`/`military-depth`
catalogue items. No gameplay scope was added beyond those obligations, and none
was removed. Escorts, larger route programs, broader governors, organic mature
realm acceptance and campaign pacing remain unfinished. All fifteen release
gates remain open, including M3's C/F/I/K gate dependencies. Next investigate
patrol opportunity cost with fixed prices and more headline seeds. The shipped
journal accepts published entries only, so this
draft stays under docs until explicit publication authorization and pinned review.
