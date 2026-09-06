# Map generation foundation

`generateWorld(seed, size, factionCount, generatorVersion = 3)` returns typed terrain,
fertility, biome and water-depth arrays, a canonical unsigned seed, generator version, dimensions,
and one start cell per faction. Call it from
the simulation worker; it has no browser, network, or simulation dependencies.

The generator accepts safe integer seeds (normalized modulo 2³²) and 1–48 factions.
Unknown map sizes and malformed settings fail explicitly. Coordinates use finite,
non-wrapping odd-row hex offsets. `neighbors` returns clockwise adjacent cell IDs;
`hexDistance` measures geometric hex distance, independently of terrain.

| Preset | Dimensions | Cells |
| --- | --- | ---: |
| Tiny, test fixture | 48 × 32 | 1,536 |
| Small | 256 × 160 | 40,960 |
| Standard | 384 × 256 | 98,304 |
| Huge | 512 × 384 | 196,608 |
| Legendary | 640 × 480 | 307,200 |

Terrain IDs are water 0, plains 1, forest 2, hills 3, mountain 4. Fertility is an
integer from 0 to 100. Water and mountains are impassable for the current terrestrial
campaign. The engine owns movement costs and all mutable game rules. Biomes do not
change movement costs or fertility in this slice: all versions retain byte-identical
physical terrain, fertility and starting positions for the same seed/settings.

Version 3 adds `waterDepth`: land (0), coastal shallows (1), and deep ocean (2).
`WATER_DEPTH`, `WATER_DEPTH_NAMES` and `isValidWaterDepth` expose the stable IDs.
`deriveWaterDepth(width, height, terrain)` marks exactly the first two water hexes
from any land as shallow. Mountains also form shores; the finite map edge does not.
All-water maps are deep, and small enclosed pools use the same shoreline rule.
This deterministic O(cells) stage uses no RNG, leaves its input untouched and uses
one byte/cell of output plus at most four bytes/cell of temporary queue storage.
It is a geometric shelf, not measured bathymetry, lake classification or hydrology.
Simulation owns ship domains, technology requirements and actual sea movement.

Version 2 adds Ocean (0), Temperate grassland (1), Temperate forest (2), Taiga (3),
Tundra (4), Desert (5), Steppe (6), Marsh (7), Rainforest (8), and Alpine (9).
`BIOME`, `BIOME_NAMES` and `isValidBiome` provide the stable classification contract.
Latitude, coherent seeded temperature/moisture fields, upland cooling, equatorial
rain and subtropical dry belts produce broad regions. Existing forest terrain constrains
woodland classifications; marshes require warm wet coastal lowlands, and physical
mountains always classify as alpine. This is climate identity, not yet separate
biome-based economic modifiers, snow simulation or drainage.

`deriveClimate(seed, width, height, terrain)` returns independent temperature and
moisture arrays for generation diagnostics. Values are relative integer indices
0–100, not degrees or rainfall units. `deriveBiomes(seed, width, height, terrain,
generatorVersion)` classifies an existing map without mutating it. Both are O(cells)
stages with bounded typed-array storage and reject malformed input.

Continental envelopes, interpolated coast noise, woodland moisture, and upland
ridges create coherent terrain. All starts occupy the largest connected passable
component. Candidate regions have at least four passable neighbors. A bounded
farthest-point selection separates starts; each receives at least 75 fertility and
an adjacent cell with at least 70. This supports connected terrestrial expansion
while leaving other land accessible by sea. Starts retain surrounding
geographic differences.

Generation takes O(cells + 8192 × factions) work and O(cells) temporary space.
Component traversal reuses its neighbor scratch buffer. The candidate scan samples
evenly to bound distance comparisons; no generation stage retries until success.
Every world owns separate buffers. Seeded integer stream state can be serialized
and resumed using `SeededRandom`.

`GENERATOR_VERSION` is 3. Explicit version 1 generation preserves the historical
seeded terrain/fertility/starts and derives only a base-terrain biome fallback:
water → ocean, forest → temperate forest, mountains → alpine, plains/hills → grassland.
Migration can use the same helper on authored legacy terrain instead of regenerating
and overwriting it. The seed-20260905, Tiny, eight-faction fixture retains physical
fingerprint `88244012`; its version-1 biome fingerprint is `583ccc48`, and its
version-2/3 climate-biome fingerprint is `fa0ab681`. The version-3 water-depth
fingerprint is `46301137`. Versions 1/2 also return derived water depth, but legacy
save/archive hash projections must omit the added field; migration derives it from
the stored terrain rather than regenerating an authored map. Version 3 preserves
every previous physical array/start and the version-2 biome array. Any later change
to seeded output must increment the version and address save/replay compatibility.

This is a campaign foundation, not complete 1.0 geography. Persisted climate/elevation
debug lenses, hydrology, rivers/lakes, biome economic modifiers, resources/sites, named regions,
archipelago presets, wrap settings, generation progress/cancellation, and faction
geographic preferences remain unfinished. Multiple separated continents are common,
but a minimum continent count is not yet a selectable or validated setting.

Validation covers the full preset range, seed reproducibility, exact RNG integer
bounds, hex path metrics, reciprocal edges, connected starts, food baselines,
land ratios, terrain coherence, malformed input, and independent campaign buffers.
Additional Huge/Legendary climate checks cover all ten biome classes, coherent
land-neighbor distributions, climate/terrain compatibility, and all 48 starting
food guarantees while proving physical-map parity with legacy generation.
Water-depth tests add exact two-hex distances, malformed-input bounds, frozen Huge/
Legendary fingerprints, shallow/deep distributions and unchanged start guarantees.
Run `node --import tsx scripts/benchmark-naval-geography.ts` from the repository root
for generation/shelf timings and independent water-connectivity diagnostics. These
measure geography only, not simulation, pathfinding, saves or browser performance.
