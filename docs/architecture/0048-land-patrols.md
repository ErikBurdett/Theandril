# 0048 — Saved two-point land patrols

Date: 2026-10-24. Status: implemented locally; pacing remains unresolved and no
release acceptance is claimed. Verification lives in the implementation packet.

An owned combat land army may receive two distinct explored endpoints and repeat
ordinary travel between them. `packages/sim` owns the order, next endpoint,
enabled state and latest actual route refusal. Three ordinary validated commands
set, enable/pause and clear the patrol. Player UI and AI consume private observed
reports and issue these same commands.

Advance patrols after existing travel and postings, before defensive theaters.
Active or paused travel, standing postings, transport, missions and sieges take
precedence. Pause/clear stops future patrol assignments; already issued routes
remain ordinary routes and require explicit cancellation. Patrols never attack,
declare war, bypass movement costs or expose hidden obstacles. New sightings
retain ordinary paused-route behavior and require a player's explicit response.

At most 128 patrols per realm, 8,192 globally and eight route attempts per realm
per turn bound work. Stable turn-based rotation prevents lower IDs monopolizing
the route budget. Build shared blockers once per advance/report, not once per
army. Every route uses the existing bounded movement search. Enabled patrols
are direct overrides for theaters. Existing guards and other armies stay under
their current owners.

Rules/save 35 adds the patrol register; content remains `015468d1`. Frozen 34
schemas reject patrol fields, old-envelope serialization rejects active records,
and all older loads initialize an empty register. Historical execution excludes
patrol behavior and observation. Genuine pre-change 34 save/archive bytes were
captured before implementation under `docs/development/2026-10-24-patrols/historical`.
Current and mixed-version command history must replay exactly.

The AI may delegate one spare peacetime single-company force between two nearby
owned hearths after bounded observed route reviews. Preserve scouts, caravans,
leaders, specialists, the two strongest field armies and existing assignments.
Do not rewrite an existing paused patrol. Measure campaign pacing and actual
adoption before calling this playable slice verified.

The first measured candidate retained peacetime patrol companies through later
wars and moved the headline Long campaign from 311 to 335 turns. Add an explicit
`pauseOnWar` policy, exposed to players. During
allocation an opted-in patrol pauses when its realm is at war, emits that actual
reason and releases future delegation; routes already issued remain intact.
Peace does not silently re-enable it. Default player patrols continue during war
unless the player selects this option. Resume during war will pause it again at
the next allocation. This is saved public policy, not an AI-only rule exception.

The measured automatic-war-pause AI experiment lengthened Epic to427 and Long
to375 turns. Keep the player option, but AI-created home patrols use persistent
coverage, the default-false policy. Peace is an adoption condition, not a promise
that AI-created patrols dissolve during war. The original persistent candidate
finished at 374/335/236 Epic/Long/Standard; the final source reproduces those
turns with the saved policy present. Long remains 24 turns slower than rules 34.
See the implementation packet for exact results and limits. No price or proxy
bound is changed.

This advances ACT-32/M3. Escorting mobile forces, multi-waypoint patrols,
multi-step programs, reactive combat and broader governors remain unfinished.
