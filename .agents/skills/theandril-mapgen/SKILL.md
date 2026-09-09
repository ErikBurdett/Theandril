---
name: theandril-mapgen
description: Use when building or tuning Theandril procedural world generation, geography, biomes, rivers, resources, regions, starting positions, map presets, or map-generation diagnostics.
---

# Theandril World Generation

The world must look geographically believable and create strategic choices.

## Pipeline

Generate from one explicit seed through stable stages:
1. macro landmasses/plates;
2. elevation;
3. mountain tendencies;
4. coast/ocean depth cleanup;
5. temperature;
6. wind/moisture;
7. rainfall;
8. biome;
9. drainage/flow;
10. rivers/lakes;
11. fertility/resources;
12. regions;
13. settlement suitability;
14. chokepoints;
15. starts/minor actors;
16. validation.

Each stage should be independently inspectable in a debug lens.

## Required validation

For each generated map:
- land/water ratios within preset tolerances;
- multiple meaningful landmasses when requested;
- no impossible river topology;
- all major start regions reachable according to scenario rules;
- each major start has a survivable resource baseline;
- enough expansion sites;
- strategic resources are not globally inaccessible;
- island/peninsula/chokepoint diversity;
- no giant accidental one-cell corridors unless intended;
- no invalid biome/climate combinations beyond explicit magical anomalies.

## Performance

Run generation off the main thread.

Show progress and allow cancellation.

For huge maps, avoid algorithms that repeatedly compare every cell with every other cell.

## Determinism

Same:
- generator version;
- content hash;
- settings;
- seed

must generate the same canonical world.

New-campaign defaults are a separate boundary: leave the seed field blank and
sample browser entropy once when the user starts the campaign. Reset that field
when opening New campaign; keep explicit uint32 seeds reproducible, including
zero. Restoring a save must preserve its seed. Do not fix repeated new worlds by
adding randomness inside `createGame`, generator stages or simulation commands.
Verify two default launches, explicit-seed equality and save/load through the
real setup controls.

Resource deposits are currently a separately versioned canonical layer in
`packages/sim/src/resources.ts`, not a change to physical generator 7. Generate
them from the explicit seed and actual terrain/biome suitability; do not consume
the combat RNG or rewrite terrain to make a deposit fit. Retain deposit IDs in
saves and expose only charted cells. Cultivation cannot transmute a deposit.
Old worlds use resource version 0 and stay empty through migration. Tests that
author geography must explicitly reconcile deposits on the changed cells;
never relax physical validation to accommodate a fixture.

The political overview consumes permitted observed ownership and last-seen
land memory. Filters must neither discover cultures nor transfer hidden terrain.
Check exact hash, exploration, and worker traffic across filter/zoom changes.
