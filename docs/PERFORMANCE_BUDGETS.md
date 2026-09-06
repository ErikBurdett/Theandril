# Performance Budgets

These are engineering guardrails, not marketing promises.

## Frame budget
- Aim for 16.7 ms/frame during ordinary map interaction.
- Keep expensive world recomputation off the main thread.
- Avoid sustained >33 ms frames during normal pan/zoom.
- UI text remains crisp even if world render resolution scales dynamically.

## Rendering
Track:
- visible chunks;
- visible world objects;
- active labels;
- draw calls/batches;
- dirty chunks rebuilt;
- world render time;
- pick/hit-test time.

Use zoom LOD and aggregate armies/labels at far zoom.

## Simulation
Track each turn phase separately:
- movement;
- combat;
- economy;
- diplomacy;
- AI;
- agents;
- events;
- visibility;
- victory;
- snapshot/hash.

Do not accept a single opaque "end turn took 8s" metric.

## AI
Budget by layer:
- grand strategy infrequent/cached;
- theater updates when front/world changes or on cadence;
- operational planning bounded;
- economy uses candidate pruning;
- tactical planning only for battles requiring it.

## Pathfinding
Track:
- path requests;
- cache hit rate;
- nodes expanded;
- average/95th percentile route time;
- invalidations.

Use hierarchical routing for long distances.

## Worker communication
Measure bytes transferred per:
- command;
- render delta;
- panel/read-model query;
- end-turn update.

Do not structured-clone the whole 100MB world each turn.

## Soak
Run deterministic campaigns for hundreds of turns and record:
- memory trend;
- event-log size;
- save size;
- turn-time trend;
- entity counts;
- state hash checkpoints.

