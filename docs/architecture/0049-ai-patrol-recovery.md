# 0049 — Explicit AI review of interrupted home patrols

Date: 2026-10-24. Status: implemented locally; campaign balance remains open.

The first patrol implementation reserves every enabled patrol from other AI
actors, while canonical movement deliberately requires an explicit resume after
a hostile sighting. The AI never reviewed existing patrol records. A generated
Long campaign retained one paused army for 284 sampled turns, even after peace
and an ordinary legal three-step route home. The preserved turn-58 snapshot and
fail-before regression establish the defect independently of pacing guesses.

Keep canonical movement and saved policy semantics. `planPatrol` reviews an
existing home circuit through `planPatrolRecovery` and proposes the ordinary
`resumeMovement` command. It does not enable, replace, disable, delete or cancel
patrol configuration. All actor planners retain the existing held-army set.

Review requires an enabled own combat land army ashore, a waiting patrol,
positive movement, actual observed supply, no movement blocker, and both patrol
endpoints still represented by owned hearths. Postings, sieges and character
missions override recovery. The existing route must be paused and contain
exactly one waypoint, equal to the patrol's next point. Any observed wartime army
or settlement within the army's sight prevents review. Otherwise the ordinary
permitted movement preview must allow a move, never an attack or siege.

An already-arrived single leg can use ordinary resume to remove its completed
route; that command preserves the saved patrol and does not move the army.
Multi-waypoint and differently targeted direct routes remain untouched.

The AI may review four paths and issue four resumes per planning pass. Stable
turn rotation across sorted own patrol records prevents fixed low IDs from
monopolizing the budget. Index observed armies, routes, supply, endpoints,
overrides and hostile cells once. Local threat checks examine only the army's
sight neighborhood, avoiding a patrol-by-global-enemy scan. Existing pathfinder
budgets are unchanged. Failed previews spend the same review budget.

This is an explicit AI-seat decision. Normal player End turn invokes AI for
other realms, while Watch mode explicitly hands all realms to AI. Canonical
player patrols never resume themselves. Routes have no source-provenance field:
an identical manually queued single leg may also be reviewed after explicit AI
takeover. Do not claim that matching endpoints prove which system issued it.
Player-disabled patrols are never enabled by this policy.

Rules/save remain 35 and content remains `015468d1`; no canonical schema or
command semantics change. Recorded archives replay their ordinary commands,
not a rerun of old AI policy. Continued AI planning intentionally uses the new
review policy. The previous AI source and generated problem snapshots are kept
under `docs/development/2026-10-24-patrol-recovery/`.

Endpoint loss, obsolete circuits, unsafe routes and prolonged wartime holds
remain separate cases. Recovery does not prove the cause of the original Long
pacing drift or clear DH-021. Measure fixed-price headline campaigns across
multiple seeds; preserve adverse results alongside the concrete recovered-leg
regression. No proxy bounds, campaign prices or release targets change here.
