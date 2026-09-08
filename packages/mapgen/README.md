# Versioned world geography

`generateWorld(seed, size, factionCount, generatorVersion = 7, options = {})` returns typed terrain,
fertility, biome, water-depth and packed hydrology arrays, a canonical unsigned seed, generator version, resolved layout, dimensions,
and one start cell per faction. Call it from
the simulation worker; it has no browser, network, or simulation dependencies.

The generator accepts safe integer seeds (normalized modulo 2³²) and 1–48 factions.
Unknown map sizes and malformed settings fail explicitly. Coordinates use finite,
non-wrapping odd-row hex offsets. `neighbors` returns clockwise adjacent cell IDs;
`hexDistance` measures geometric hex distance, independently of terrain.

## Current generator7: larger inland seas

Small and larger worlds retain generator6's external plate/coast/satellite stage,
then replace its small width-capped inland cuts with host-relative saltwater basins.
A fixed integer-bucket expansion grows connected, mildly warped and elongated
basins inside substantial landmasses. Three original land hexes separate every
carved cell from preexisting water; no straits are cut to the ocean. A basin is
retained only with at least two separated usable shoreline sectors, without
flattening mountains or granting founding locations.

Continents/Islands/Archipelago allow at most 3/2/1 basins. Their targets are
12–18% / 8–14% / 5–10% of the chosen host, capped collectively at 3% / 2% / 1.5%
of map cells and never more than 20% of one host. Excavation retains at least 15%
macro land before the separate freshwater-lake stage. Unsuitable sites are skipped,
not retried forever or forced into small islands. Tiny retains generator6's exact
physical arrays and starts for dense 48-seat test viability; it is not a giant-sea
demonstration at miniature scale.

Normal drainage, freshwater outlets, depth, climate and viable starts run afterward.
The larger seas have ordinary shallow margins/deep interiors and no freshwater lake
flag. Their new coast changes nearby climate and settlement opportunities, but not
the twelve-biome content contract, movement rules or five-array save shape. Existing
generator1–6 worlds stay on their exact historical branches.

`inspectV7Climate(world)` returns detached climate/elevation diagnostics plus
`inlandSeaCarvings` records (center, host size, target/actual cut size and usable shore
count). These are tooling data, never fog-limited observations. Basin creation uses
linear scratch arrays, at most eight candidate hosts and 8,192 fixed priority buckets;
it does not flood the whole world separately for every town or faction.

`node --import tsx scripts/benchmark-inland-seas.ts --overview` writes paired
generator6/7 diagnostic sheets for three seeds, top/bottom respectively.
`--output` instead measures twelve preset/layout cases and writes new
`diagnostics/v7-inland-seas.json`; it never overwrites preceding measurements.
The paired sheets deliberately focus on water bodies and starts, not river-line
rendering, artwork approval or gameplay performance. Coasts remain relatively smooth;
this is not erosion, salt budgets, tides or dynamically rising water.

The [isolated twelve-case run](diagnostics/v7-inland-seas.json) retains all 60 exact
generation repeats. At seed 20260905, largest actual inland saltwater bodies are:

| Preset | Continents, 6 → 7 | Islands, 6 → 7 | Archipelago, 6 → 7 |
| --- | ---: | ---: | ---: |
| Small | 97 → 1,074 | 65 → 345 | 65 → 245 |
| Huge | 844 → 5,155 | 317 → 1,706 | 317 → 1,470 |
| Legendary | 1,276 → 7,973 | 506 → 2,838 | 506 → 1,180 |

Mean complete generation is 73.2–86.4 ms on Small, 338.5–356.6 ms on Huge and
525.8–560.4 ms on Legendary across layouts, using Node26.7.0 on an i9-13900K.
Five samples per case are not a stable tail-latency estimate; raw maxima and all
samples are retained. This includes normal allocation, drainage, starts and topology
validation, but excludes diagnostic regeneration/hashing, simulation, saves and
rendering. Canonical geography remains five bytes per cell; final process memory
is not peak memory. All102 mapgen tests pass at this checkpoint, including prior
world seals, seeded starts, deep cores, shoreline guards and excavation budgets.

AI basin knowledge now uses a call-local, shared water-expansion budget of
`min(8192, max(1024, observedCellCount))`, replacing the fixed 1,024-node limit.
Each observed water node is expanded at most once across that helper's requests;
no canonical or persistent component cache is exposed. Status is explicitly
`open | enclosed | unknown`, and pairwise relation is
`connected | separate | unknown`. Observed paths can prove connection without
charting an entire basin; enclosure requires its complete known boundary. Unknown
shoreline or budget exhaustion remains uncertainty, never proof of ocean access
or a connection to a remote fleet.

The [actual generated-basin regression](../ai/src/large-basin.test.ts) proves the
1,074-cell Small sea enclosed from its complete observed chart, and unknown when
one shoreline cell is withheld, with repeat requests adding no expansions.
Larger bodies or a budget already spent elsewhere can still remain unknown, even
with substantial charting. These helper tests and generation diagnostics do not
establish successful AI voyages on every new inland sea.

## Played generator6 climate and relief

Generator6 retains the same five canonical array types and twelve biome IDs, but
adds asymmetric connected plate lobes, deep side bays and bounded offshore groups.
Small and larger maps inset/shrink boundary-near bodies to keep their full coastline
inside the map. Tiny retains its denser plate spacing to support all48 seats; its
coarse silhouette is not a miniature physical simulation of a giant map.

Additional qualifying upland basins become freshwater lakes with validated single
river outlets. Up to three suitably enclosed sea basins have lobed, notched shores;
small islands are never forced to contain them. More frequent graded saddles create
traversable land between mountain barriers. River classes still use actual accumulated
catchment flow, with layout-relative thresholds for connected main channels. Tiny
catchments need not contain major trunks or sea-sized enclosed water bodies.

Biomes now combine latitude and continuous upland cooling with a seeded prevailing
wind, marine moisture, decaying leeward rain shadows and actual river/lake proximity.
Freshwater greens a two-cell corridor without crossing saltwater; warm, low, flat
floodplains may become inland marsh. Ash/chalk substrate regions avoid fresh banks.
Physical mountains still require the existing alpine art; woodland classifications
remain constrained by forest terrain. This is not snow simulation, seasonal weather,
full erosion or dynamically changing terrain. Fertility/rainfall/drainage are not
recalculated from the later climate-label stage.

`deriveV6Climate(world, elevation)` returns detached temperature/moisture/rain-shadow
indices, bounded freshwater distances and the prevailing-wind direction from transient
relief. `deriveV6Biomes(world, elevation)` classifies those same inputs. Neither changes
its input. `inspectV6Climate(world)` explicitly regenerates the relief for diagnostics;
do not call it during per-cell gameplay or rendering. `geographicDiversity(world)`
reports biome counts, **east–west same-row land-edge** biome agreement, connected
river/trunk lengths and connected pass candidates with actual opposing mountain
barriers. `landBiomeNeighborAgreement` retains its historical field name and
calculation: matching biome pairs divided by sampled non-water east–west pairs,
excluding row wraps (zero when no such pairs exist). It is a directional sample,
**not all-six-neighbor hex cohesion**. Returned sampling metadata and matching/total
edge counts make that scope explicit. Its pass count is not proof of army pathfinding
between strategic theaters.

All 93 mapgen tests pass, including new6 full-range seed/start properties and the
sixteen retained generator1–4 seals plus all twelve played-generator5 benchmark seals.
The new isolated [twelve-case report](diagnostics/v6-geography-climate.json) includes
paired5/6 geography, but only6 generation timings; old raw reports remain unchanged.
The retained report's agreement ratios already use this same east–west-only sample;
the later labeling clarification does not revise its timings, ratios or world hashes.
Three independently reviewed Small overview strips cover every layout at seeds42,
74 and20260905, with corresponding Tiny strips. They are diagnostic pixels, not
production art approval or live-renderer evidence.

## Shared generator5–7 geography contract

`options.layout` accepts `continents` (default), `islands` or `archipelago`.
Continents have unequal branching landmasses, bays, peninsulas, offshore islets and
an enclosed interior sea where relief permits it. Islands vary in size and have
subsidiary tails; archipelagos follow seeded curved chains with uneven sizes and
spacing. Tiny uses a denser bounded island scale so its supported 48 seats still
have viable land, with actual sea straits along joining plate seams to retain
physically disconnected islands. It is not a scale-equivalent image of a giant world.

Integer relief creates ridges, foothills and passes. A FIFO integer-bucket flood
builds acyclic drainage; topological rainfall accumulation creates river networks.
Finite upland basins become fresh lakes, each with one spill outlet and an actual
downstream river. Lakes remain shallow inland water, whereas enclosed lowland
seas use the ordinary coastal/deep-water rule. Rainfall/elevation are generation
work arrays, not extra canonical campaign arrays or a full physical erosion model.

`World.hydrology` is one byte per cell: bits0–2 downstream direction, bits3–4
river size0–3, bit5 lake; bits6–7 must be zero. Direction0 means none; directions
1–6 mean E, SE, SW, W, NW, NE on the existing odd-row grid. A lake stores its
outlet-routing direction but river size0, so rendering need not draw a line across
the water surface. Ordinary ocean/inland-sea cells have hydrology0.

Use `riverDirection(value)`, `riverSize(value)`, `isLake(value)`,
`directionNeighbor(cell,width,height,direction)` and
`hydrologyDownstream(cell,width,height,value)` rather than compact neighbor-array
indexes at map boundaries. Missing/out-of-bounds directions return null.
`validateHydrology(world)` rejects malformed arrays, reserved bits, broken outlets,
shrinking river flows, cycles, non-inland lake bodies and multiple lake spills in
O(cells), without recursion. These lake invariants apply to imports, not only generation.

Starts are distributed across viable passable components, retain at least four
passable neighbors and a 75/70 food baseline, and have reachable coast and fresh
water (river/lake or an actual spring feature) within three land steps. No one-cell
island receives a major faction. Natural rivers/lakes grant the existing spring
feature on eligible nearby land only for gen5 and later. Simulation owns their economic,
movement, ownership, road and visibility effects.

Work is O(cells + 8192×factions) with fixed bounded land/bay counts, a fixed 4096-level
flood queue, and bounded basin neighborhoods. All temporary queues are iterative.
`describeGeography(world)` returns detached land/mountain component sizes, coast,
river/lake counts, boundary-disconnected inland-water bodies, starting-region
viability and actual canonical buffer bytes. These diagnostics are not discoveries
and must not be sent to a fog-limited player or AI wholesale.

`node --import tsx scripts/benchmark-world-geography.ts --v6 --output` measures all
three layouts at Tiny/Small/Huge/Legendary and retains new6 diagnostics. Omitting
`--v6` deliberately exercises the retained generator5 benchmark workflow.
`--overview` instead writes three whole-map diagnostic strips (seeds42/74/20260905)
with companion metadata: continents left, islands center, archipelago right.
These code-native overview pixels are not production art or browser-performance evidence.

## Historical generator1–6 contract

Explicit generator6 preserves all five arrays, starts and metadata against the
twelve independently retained benchmark SHA256 seals. Its existing unit goldens
and preceding reports are not rewritten to make generator7 pass. Campaign-level
generator6 save/archive capture and migration belong to simulation/chronicle.

Explicit generator5 retains its played terrain, biome, fertility, depth, hydrology,
layout and starts byte for byte. Its six unit goldens and twelve retained benchmark
worlds were not rewritten. Simulation/chronicle separately retain genuine schema12
generator5 campaign origins and command histories. A generator5 campaign never opts
into6 merely because it is loaded by a newer build.

Explicit versions1–4 reject layout options, return `layout:'legacy'` and zero
hydrology, and preserve every original terrain/fertility/biome/depth/start/feature
value. Pre-v5 capture tests retain SHA256 arrays and starts from clean b17900d.
Save migration must add empty hydrology, never regenerate rivers onto an authored
old map. Historical hash projections omit new fields and refuse unrepresentable
new geography; simulation/chronicle own those versioned projections.

The following describes the historical foundation; its generation behavior is
retained even where newer simulation and generator systems now go further.

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
change movement costs or fertility in the historical1–4 foundation: those four versions retain byte-identical
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
generatorVersion = 5)` retains its historical terrain-only classifier without mutating
the map. It rejects6 because that version requires relief/hydrology; use the explicit
V6 helper above instead. Both historical helpers are O(cells)
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

Historical generator 3 retained the prior geometry. Explicit version 1 generation preserves the historical
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

Generator4 subsequently added ash scrub/chalkland labels and deterministic local
features without changing physical geography. Generator5 above adds layouts and
hydrology. Named regions, wrapping, erosion/weather simulation, persisted elevation
lenses and resumable generation progress/cancellation remain unfinished. The layouts
are geographic tendencies, not a guarantee of an exact number of continents for
every seed. Individual mainland lobes/islands can join through natural isthmuses.

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
