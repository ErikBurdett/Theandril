# Theandril — GPT-6 Astra Art Factory Handoff Pack

Copy this pack into the Theandril repository root:

```text
/Work/Theandril
```

The purpose of this pack is to turn GPT-6 Astra into the ongoing visual-production agent for Theandril.

The goal is not merely to generate individual sprites. The goal is to establish a reusable **Theandril Art Factory** that can:

- generate original dark-fantasy pixel art;
- produce coherent faction visual families;
- create unit sprites and animation sets;
- create terrain, hex-tile, settlement, prop, effect, and UI art;
- use deterministic pixel cleanup;
- validate animation identity and pivots;
- run Aseprite CLI batch operations;
- pack atlases;
- generate manifests;
- integrate assets into PixiJS;
- launch the game and visually inspect results;
- reject/regenerate poor assets;
- maintain provenance.

## Important local-machine fact

**Aseprite is already installed on this Omarchy machine through Steam.**

Astra must **not** blindly reinstall Aseprite.

It should first locate the existing Steam installation and create a stable project-local adapter.

Likely Linux/Steam locations include:

```text
~/.local/share/Steam/steamapps/common/Aseprite/
~/.steam/steam/steamapps/common/Aseprite/
```

The exact path must be detected rather than assumed.

Use:

```bash
bash tools/art/find-aseprite.sh
```

or an equivalent repository script.

## Recommended toolchain

### PerfectPixel Studio
Best candidate for:
- animated characters;
- directional sprite sheets;
- humanoids;
- monsters;
- identity/anchor correction;
- animation states.

Repository:
`https://github.com/gykim80/perfectpixel-studio`

### PixelLab
Strong candidate for:
- terrain;
- map objects;
- tiles;
- hex-tile workflows where supported;
- style-reference generation;
- some directional character generation.

Treat it as optional when API credentials are unavailable.

### Sprite Fusion Pixel Snapper
Repository:
`https://github.com/Hugo-Dz/spritefusion-pixel-snapper`

Use for:
- pixel-grid snapping;
- palette enforcement;
- batch cleanup;
- faux-pixel correction;
- reproducible post-processing.

### Aseprite via Steam
Already installed locally.

Use Aseprite CLI for:
- sprite-sheet generation;
- frame/tag export;
- palette handling;
- pixel-safe transforms;
- metadata export;
- batch processing;
- tileset/spritesheet operations where useful.

Do not depend on GUI automation when CLI can do the work.

## Handoff

Start Astra from:

```bash
cd /Work/Theandril
```

Give it `BOOTSTRAP_PROMPT.md`.

Future sessions can use `CONTINUATION_PROMPT.md`.

## Recommended first outcome

Do not begin by generating hundreds of assets.

First prove:

1. art pipeline;
2. Aseprite adapter;
3. Pixel Snapper integration;
4. provider adapters;
5. Art Lab;
6. automated validation;
7. a small Visual Foundation Pack rendered in the real game.
