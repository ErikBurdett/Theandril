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
