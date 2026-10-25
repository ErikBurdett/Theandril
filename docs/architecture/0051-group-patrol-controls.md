# Group controls for existing patrol policies

24 October 2026. Work packet: `docs/development/2026-10-24-group-patrols/`.

The registry can locate paused policies, but each policy still requires a separate
inspector visit to pause, resume or remove it. Reuse the existing checked army IDs
and canonical `setPatrolEnabled` / `clearPatrol` commands for explicit bounded
batches. This advances the accepted M3 delegation workflow; it adds no new
simulation policy, automation, save field, AI behavior or campaign price.

The UI proposes orders for currently observed owned land armies ashore. Pause
includes enabled policies, Resume includes disabled policies, and Remove includes
all selected policies. Unaffected and refused armies retain their checks; only
confirmed accepted IDs leave the selection. Filtering does not silently discard
checks, including selected armies outside the current cohort. Pending work locks
sibling order controls, filters, pages and roster navigation. The UI explains that
these controls change future assignments, while existing active or paused travel
keeps its exact state. War-pause configuration is preserved and explained.

The new worker envelope is deliberately narrower than arbitrary command batching:
1–128 distinct army IDs, one faction and one homogeneous policy action. Strictly
validate the entire envelope, command shapes and expected observation hash before
the first mutation. Apply ordinary commands in stable ID order and record each
ordinary result. Canonical refusals do not prevent later independent actors from
being considered. Publish one final state with exact result coverage and autosave
once when at least one command succeeds. These orders never run pathfinding.

Correlate the final reply with the request ID, faction and exact sorted actor IDs.
Missing, duplicated, foreign, malformed or extra results are uncertain mutation,
not partial success. A recorder/worker/presentation failure after mutation locks
continued play and requires existing saved-restoration recovery. No automatic
retry, fabricated refusal or silent selected-ID removal is allowed.

Acceptance requires strict transport and genuine command refusal/failure tests,
full unchanged army/route comparisons, actual public controls on a 100+ army
fixture, keyboard/narrow layout, exact command archives and manual/portable
restore. Deliberately damaged worker replies are labeled fault injection; they
must preserve real command execution and exercise the recovery UI. Keep ordinary
functional durations separate from planner/rendering performance claims.

This is not a technical prerequisite for mobile escorts. A genuine escort needs
saved target identity, lifecycle handling and coordinated movement; following an
old target cell alone can leave a caravan unprotected. That accepted scope,
organic mature-realm acceptance, DH-021, R06, M3 and all release gates remain open.
