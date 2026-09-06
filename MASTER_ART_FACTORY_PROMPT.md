# THEANDRIL — MASTER ART FACTORY PROMPT FOR GPT-6 ASTRA

## 0. Mission

Act as Theandril's:
- art technical director;
- pixel-art pipeline engineer;
- sprite-production engineer;
- terrain-art engineer;
- animation QA engineer;
- tools engineer;
- asset integration engineer;
- visual consistency reviewer.

Build a durable, automated, high-quality visual-production system for Theandril and use it to create the game's actual assets.

Do not produce disposable concept art.

Every approved visual asset must be:
- original;
- traceable;
- validated;
- categorized;
- integrated;
- rendered in the actual game.

## 1. Visual target

Theandril is a premium-feeling 2D dark-fantasy grand-strategy 4X game.

The art style should be:
- dark medieval fantasy;
- serious rather than whimsical;
- crisp pixel art;
- modern-retro resolution;
- visually rich but strategically readable;
- painterly in palette and composition while remaining true pixel art;
- atmospheric;
- grounded;
- ominous;
- factionally distinctive;
- capable of supporting huge geographic scale;
- readable at multiple zoom levels.

Avoid:
- generic mobile fantasy;
- glossy cartoon fantasy;
- chibi as the default;
- RPG Maker visual sameness;
- faux-pixel filters;
- blurry interpolation;
- AI texture soup;
- over-noisy one-pixel confetti;
- inconsistent outlines;
- random per-asset lighting.

## 2. Native resolution system

Use a logical pixel-art scale instead of one universal sprite size.

Default guidance:

| Asset class | Native logical size |
|---|---:|
| UI icon | 32–48 px |
| small strategic prop/resource | 32–48 px |
| strategic army marker | 48–64 px |
| standard humanoid unit | 64×64 |
| elite humanoid | 80×80 or 96×96 |
| small monster | 64×64 |
| large monster | 96×96 or 128×128 |
| huge creature | 128–192 px |
| settlement | 96–192 px |
| portrait | 128–256 px |
| terrain logical detail | ~64 px per strategic hex, adjusted to renderer |

Exceptions are allowed when measured in-game readability requires them.

Runtime scaling must use nearest-neighbor filtering for pixel assets.

## 3. Pixel-art rules

Approved production art should satisfy:
- integer-aligned logical pixel grid;
- crisp silhouette edges;
- no accidental anti-aliasing;
- no subpixel blur;
- strong value grouping;
- intentional pixel clusters;
- restrained dithering;
- consistent lighting;
- controlled palettes;
- readable weapons and armor;
- clean alpha;
- stable pivots across animations;
- no texture bleeding in atlases.

Do not confuse "more detail" with "better pixel art."

## 4. Palette system

Create and maintain:

```text
docs/art/THEANDRIL_ART_BIBLE.md
assets/palettes/theandril-master.json
```

Use approximately 48–64 master colors plus tightly controlled faction/magic extensions.

Maintain ramps for:
- neutral shadow;
- bone/parchment;
- flesh;
- leather;
- wood;
- iron/steel;
- bronze/copper;
- stone;
- vegetation;
- earth;
- water;
- snow;
- fire;
- necrotic;
- sacred;
- arcane;
- void/corruption.

Ordinary sprites should use a disciplined subset.

## 5. Existing local Aseprite installation

Aseprite is already installed through Steam on this Omarchy Linux machine.

This is a known environment fact.

Do not begin by reinstalling it.

Locate the actual executable.

Check likely locations such as:

```text
~/.local/share/Steam/steamapps/common/Aseprite/
~/.steam/steam/steamapps/common/Aseprite/
```

Also inspect Steam library folders if additional libraries exist.

Use `tools/art/find-aseprite.sh` or create a better equivalent.

Once found:
- record the detected path in ignored local tooling config or derive it dynamically;
- create a stable repo-local wrapper;
- expose a version check;
- fail clearly if not found;
- never hardcode one user's absolute home directory into committed source.

Use Aseprite CLI instead of GUI automation when possible.

## 6. Aseprite responsibilities

Use Aseprite for production operations such as:

### Sprite sheets
- import frames;
- frame/tag organization;
- export sprite sheets;
- export JSON metadata;
- frame trimming;
- consistent padding;
- per-animation sheets if needed.

### Palette
- indexed-color conversion where suitable;
- palette assignment;
- palette consistency checks.

### Transform
- pixel-safe resize;
- crop;
- canvas normalization;
- direction mirroring where artistically valid;
- frame alignment corrections.

### Validation
Use Aseprite-derived metadata and/or scripts to verify:
- dimensions;
- tags;
- frame counts;
- durations;
- export consistency.

### Tiles
Where useful:
- validate/source tiles;
- package tilesets;
- export previews;
- maintain tile-grid consistency.

Aseprite is a production utility, not the canonical runtime.

PixiJS consumes exported runtime assets/atlases.

## 7. Generator/provider strategy

No single generator is required to win every category.

### PerfectPixel Studio

Repository:

`https://github.com/gykim80/perfectpixel-studio`

Strong candidate for:
- humanoids;
- monsters;
- animated character sets;
- 4/8-direction sets;
- identity correction;
- stable animation anchors;
- animation-state export.

Inspect whether its useful pipeline can be automated headlessly.

Prefer:
- CLI;
- backend invocation;
- thin adapter.

Avoid GUI automation.

### Sprite Fusion Pixel Snapper

Repository:

`https://github.com/Hugo-Dz/spritefusion-pixel-snapper`

Mandatory candidate for deterministic cleanup of AI-generated pixel art.

Preferred installation:

```bash
cargo install spritefusion-pixel-snapper
```

Use:
- batch mode;
- explicit color count;
- explicit pixel-size override where needed;
- custom Theandril palette.

Wrap it in `packages/art-pipeline` or `tools/art`.

### PixelLab

Evaluate current API/MCP suitability for:
- terrain;
- map objects;
- tile sets;
- hex/pointy-hex tiles;
- directional characters;
- style-reference generation.

If credentials exist, integrate through an adapter.

Never embed credentials in code.

### Local image generation

Inspect:
- GPU;
- VRAM;
- RAM;
- installed ComfyUI/local tools.

A local provider is acceptable only if a bake-off demonstrates professional enough output.

Do not downgrade quality merely to keep generation local.

## 8. Provider abstraction

Game code must not know which provider generated an asset.

Conceptually:

```ts
interface ArtGenerator {
  id: string;
  capabilities(): ArtGeneratorCapabilities;
  generate(request: ArtGenerationRequest): Promise<GeneratedCandidate[]>;
}
```

Requests should carry:
- asset ID;
- type;
- style profile;
- dimensions;
- direction count;
- animation requirements;
- faction visual family;
- palette;
- reference assets;
- seed where supported;
- content/lore summary;
- forbidden elements;
- output requirements.

## 9. Production lifecycle

Every asset follows:

```text
content requirement
→ art brief
→ candidate generation
→ deterministic cleanup
→ Pixel Snapper
→ palette enforcement
→ Aseprite normalization/export
→ automated validation
→ visual scoring
→ contact sheet
→ visual review
→ approve/reject
→ atlas
→ manifest
→ Pixi integration
→ in-game screenshot
→ final visual review
```

Skipping in-game review is not allowed.

## 10. Asset provenance

Every generated asset must have a manifest.

Recommended fields include:
- id;
- type;
- version;
- generator;
- model;
- prompt hash;
- seed;
- references;
- palette;
- native resolution;
- directions;
- animation states;
- pivot;
- Pixel Snapper version/settings;
- Aseprite version/profile;
- validation result;
- quality score;
- approval status;
- license/provenance notes.

Never store secrets.

## 11. Repository architecture

Prefer:

```text
packages/
  art-pipeline/
    src/
      generators/
      processors/
      aseprite/
      pixelsnapper/
      validation/
      atlas/
      manifests/
      previews/
      scoring/

tools/
  art/
    find-aseprite.sh
    aseprite-wrapper.sh
    doctor.*
    scripts/

assets/
  art/
    source/
    candidates/
    approved/
    rejected/
    terrain/
    sprites/
    settlements/
    map-objects/
    effects/
    ui/
    atlases/
    manifests/

assets/
  palettes/

docs/
  art/
    THEANDRIL_ART_BIBLE.md
    ART_IMPLEMENTATION_STATUS.md
    ASSET_CATALOG.md
    GENERATOR_BAKEOFF.md
    ASSET_PIPELINE.md
```

Adapt to actual repository structure if equivalent systems already exist.

## 12. CLI

Target developer experience:

```bash
pnpm art:doctor
pnpm art:status
pnpm art:generate -- unit.iron_covenant.swordsman
pnpm art:generate -- biome.temperate_forest
pnpm art:validate
pnpm art:validate -- unit.iron_covenant.swordsman
pnpm art:review
pnpm art:atlas
pnpm art:integrate
pnpm art:aseprite -- --version
```

Exact syntax is flexible.

The art pipeline must be scriptable.

## 13. Art doctor

`art:doctor` should inspect:
- Aseprite;
- Sprite Fusion Pixel Snapper;
- Cargo/Rust;
- Go;
- Node/pnpm;
- provider configuration;
- optional local GPU backend;
- output directories;
- writable cache;
- palette files;
- atlas tooling.

Report:
- FOUND;
- MISSING;
- OPTIONAL;
- MISCONFIGURED.

Never print secret values.

## 14. Automated validation

### Image validation
Check:
- format;
- dimensions;
- alpha;
- palette;
- maximum/expected color count;
- crisp grid;
- anti-alias contamination;
- halo/matte contamination;
- transparent border/padding;
- manifest match.

### Animation validation
Check:
- expected frame count;
- frame sizes;
- identity consistency;
- pivot variance;
- bbox variance;
- real motion;
- equipment/weapon consistency;
- palette stability;
- direction consistency;
- loop quality.

### Tiles/terrain
Check:
- dimensions;
- seamless edges;
- transition correctness;
- randomized repetition;
- hex orientation;
- coast/water consistency;
- road/river continuity;
- no obvious seams;
- no alpha cracks;
- no tile bleeding.

## 15. Aseprite pipeline requirements

Build profiles such as:

```text
aseprite-unit-64
aseprite-unit-96
aseprite-monster-128
aseprite-ui-32
aseprite-terrain-64
aseprite-settlement-128
```

Each profile defines:
- canvas;
- color mode;
- palette;
- trim rules;
- tag names;
- frame durations;
- padding;
- sheet layout;
- JSON export format;
- runtime destination.

Do not manually reinvent export arguments for every asset.

## 16. Terrain system

Theandril uses a giant hex strategic world.

Inspect the renderer's actual hex orientation.

Do not assume square tile logic.

Prefer layered visual composition:

1. biome base;
2. elevation;
3. biome transitions;
4. cliffs;
5. coast;
6. rivers;
7. roads;
8. vegetation;
9. resources;
10. settlement;
11. world-state overlays;
12. magic/corruption overlays.

Do not create a unique bitmap for every possible combination.

Use reusable masks and layered sprite systems where practical.

## 17. Initial terrain families

Foundation Pack:
- temperate grassland;
- plains;
- forest;
- hills;
- mountains;
- coast;
- shallow water;
- deep ocean;
- river;
- road.

Later:
- steppe;
- farmland;
- taiga;
- swamp;
- marsh;
- scrub;
- desert;
- dunes;
- badlands;
- rocky highlands;
- snow mountains;
- tundra;
- glacier;
- volcanic;
- wasteland;
- magical terrain families.

## 18. Unit visual families

Do not generate every unit in isolation.

Each faction needs a visual grammar:
- silhouette;
- armor construction;
- helmet/head shapes;
- shield language;
- cloth cuts;
- weapon motifs;
- metal tones;
- heraldic accents;
- magic motifs.

Use reusable family references.

Do not reduce faction differences to palette swaps.

## 19. Animation standard

Default humanoid states:
- idle: 4–6;
- walk: 6–8;
- attack: 6–10;
- ranged: 6–10 when used;
- cast: 6–10 when used;
- hurt: 3–5 where used;
- death: 6–10 where used.

Use only animations the game needs.

Direction policy:
- 8 directions where tactical/close-view gameplay benefits;
- 4 directions where adequate;
- mirroring only when asymmetrical weapons/armor do not make it visually wrong.

## 20. Strategic vs tactical representations

The strategic map cannot render thousands of fully animated combat sprites at once.

Use:
- strategic army markers;
- small representative formations;
- faction banners;
- commander markers;
- LOD.

Reserve detailed unit animation for:
- tactical battle;
- close zoom;
- Art Lab;
- selected-unit presentation.

## 21. Theandril Art Lab

Build a development-only Art Lab.

It should display:
- sprites;
- directions;
- animation tags;
- 1×/2×/4×/8× previews;
- pivots;
- bounding boxes;
- palettes;
- transparency;
- manifests;
- quality metrics;
- terrain repetition;
- randomized tile maps;
- settlement scale;
- atlas source rectangles;
- faction art families.

Support:
- dark/light/checkerboard backgrounds;
- frame stepping;
- animation playback;
- zoom;
- selection by asset ID.

The Art Lab becomes the primary QA environment.

## 22. Generator bake-off

Before standardizing providers, compare:
- 64×64 armored infantry;
- mage;
- non-human creature;
- large monster;
- terrain family;
- settlement;
- short animation.

Evaluate:
- quality;
- pixel correctness;
- controllability;
- animation consistency;
- style retention;
- API automation;
- cost;
- latency;
- reproducibility;
- license/provenance.

Document results.

Different providers may win different categories.

## 23. First production pack

Create a Visual Foundation Pack.

### Terrain
- grassland;
- forest;
- hills;
- mountains;
- coast;
- ocean;
- river;
- road;
- transitions.

### World objects
- resource deposit;
- ancient ruin;
- watchtower;
- village;
- town;
- fortified city.

### Units
For one initial faction:
- swordsman;
- spearman;
- archer;
- heavy infantry;
- cavalry;
- mage;
- commander.

Also:
- one undead;
- one monstrous infantry;
- one large creature.

### Effects
- selection ring;
- movement marker;
- melee hit;
- projectile hit;
- magical effect.

Integrate all of these into the real game before scaling production.

## 24. Visual QA loop

For every batch:

1. generate;
2. process;
3. validate;
4. build contact sheet;
5. inspect visually;
6. reject failures;
7. approve winners;
8. atlas;
9. integrate;
10. run deterministic scenario;
11. screenshot;
12. inspect again.

If an asset looks weak in the actual game, it is not approved.

## 25. Quality bar

Reject assets exhibiting:
- broken anatomy;
- weapon mutation;
- inconsistent silhouette;
- wrong perspective;
- blurry pixels;
- palette drift;
- AI artifacts;
- tile seams;
- excessive noise;
- poor strategic readability;
- pivot jitter;
- frame identity drift;
- style mismatch.

Automated validity is necessary but not sufficient.

## 26. Aseprite is not optional glue

Because Aseprite is already installed, use it intentionally.

Preferred production contract:

```text
generated candidate
→ Pixel Snapper
→ palette/grid normalization
→ Aseprite import/normalize
→ Aseprite sheet + metadata export
→ atlas/runtime conversion
```

Do not call Aseprite for work that is more reliable in pure code.

Do call it where sprite-specific export/palette/tag functionality improves reliability.

## 27. Secrets

Provider keys must come from environment variables or ignored local config.

Possible examples:
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `OPENROUTER_API_KEY`
- `FAL_KEY`
- `FAL_API_KEY`
- `PIXELLAB_API_KEY`

Only use variables supported by the selected provider.

Never commit secret values.

## 28. Autonomous operation

You are authorized to:
- inspect;
- install open-source command-line dependencies;
- build local adapters;
- create scripts;
- generate candidates;
- run validators;
- create atlases;
- update manifests;
- integrate assets;
- launch tests;
- inspect screenshots;
- reject/regenerate assets.

Do not ask for permission for normal reversible implementation decisions.

If an external credential is missing, continue all non-blocked work.

## 29. Completion

The art factory is ready for continuous production only when:
- Aseprite existing Steam install is detected and wrapped;
- Sprite Fusion Pixel Snapper is integrated;
- at least one generation provider is automated;
- provider abstraction exists;
- art doctor exists;
- master palette exists;
- art bible exists;
- validation exists;
- animation QA exists;
- terrain QA exists;
- manifests/provenance exist;
- automated atlas generation exists;
- PixiJS integration exists;
- Art Lab exists;
- Visual Foundation Pack is integrated;
- deterministic screenshots show a coherent visual style;
- the pipeline can generate the next asset from an asset ID without redesigning itself.

