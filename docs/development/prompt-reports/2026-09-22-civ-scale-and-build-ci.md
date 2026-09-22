# Civilization-scale campaigns, map types, simpler tests and build-only CI — 2026-09-22

## Prompt

“simplify the testing suite and focus on making the game a bit more manageable of a size … aim to make something can go to around 350 - 400 [turns] … decreasing the size of the map just a bit and make the map generation more varied … simplify the testing where we can and focus on getting CI passing and deploying a working build”, then “let's not test it in the cloud, let's just make sure that it builds - we'll keep deep gameplay testing local”.

## Delivered

- **Rules/save 18 pacing.** On Standard maps with 12 AI realms, campaigns conclude around 211–230 turns (Standard), 259–322 (Long, across all map types) and 329–389 (Epic). Rules 16–17 saves and archives load and replay unchanged.
- **Generator 8.** Maps are a little smaller (Standard is 224×140 for 12 realms) and there are seven Civ-style map types: Continents, Pangaea, Fractal, Islands, Archipelago, Earth-like and Inland Sea. The new-campaign form offers a Map type choice, and pace options state their target lengths.
- **AI.** At peace, cultures no longer starve their next caravan by recruiting every newly unlocked role.
- **Simpler tests.** The full local suite has 1,793 tests and runs in about 27 s; it took 81 s before this work.
- **CI** only typechecks and builds. Pages typechecks, builds and deploys.

## Verified locally

- Typecheck, lint, content validation (hash `98b97bba`) and the production build pass.
- `pnpm test`: 1,793/1,793.
- Browser: 177/182 on the first full run. The other five were stale expectations (old defaults, cell counts, the Tiny watch victory turn) plus one hot-reload artefact. After the updates, all 12 affected journeys pass, and 17/17 setup-form journeys pass after the final form change.
- All seven map types render in the game's world overview.

## Not done / caveats

- Browser journeys run locally only, by the owner's decision.
- The stored benchmark results (`scripts/benchmark-*`) reflect the older generator and seat counts.
