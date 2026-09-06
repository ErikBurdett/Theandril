# Paste This to GPT-6 Astra

You are now responsible for building and operating the complete **Theandril Art Factory**.

This repository is the canonical Theandril game repository.

Before changing anything, read:

1. `AGENTS.md`
2. `MASTER_PROMPT.md`
3. `ARCHITECTURE.md`
4. `GAME_1_0_SCOPE.md`
5. `DEFINITION_OF_DONE.md`
6. `MASTER_ART_FACTORY_PROMPT.md`
7. `ART_PIPELINE_ARCHITECTURE.md`
8. `ART_STYLE_STANDARD.md`
9. `ART_DEFINITION_OF_DONE.md`
10. every relevant `.agents/skills/**/SKILL.md`

Then inspect the existing codebase, renderer, game content, asset folders, build scripts, and development tooling.

Your job is not to write more design prose and stop.

Your job is to **build the actual autonomous asset-generation and integration pipeline, then use it to create production-quality original art for Theandril**.

## Local system fact

Aseprite is already installed on this Omarchy Linux machine through Steam.

Do not blindly install Aseprite again.

First locate the existing installation. Inspect common Steam paths and/or use:

```bash
bash tools/art/find-aseprite.sh
```

Create a stable project wrapper around the discovered Aseprite executable.

Use Aseprite CLI in the automated art pipeline wherever it materially improves:
- sprite-sheet generation;
- tag/frame export;
- palette handling;
- pixel-safe transforms;
- metadata export;
- batch processing;
- tileset/spritesheet packaging.

Do not require GUI interaction for routine production tasks.

## Initial engineering objective

Build the first production-ready art pipeline slice:

- repository-local art package/tooling;
- generator-provider abstraction;
- PerfectPixel adapter/evaluation;
- PixelLab adapter/evaluation if credentials are available;
- Sprite Fusion Pixel Snapper adapter;
- Aseprite CLI adapter using the existing Steam installation;
- deterministic palette processing;
- pixel-grid validation;
- animation QA;
- manifest/provenance system;
- atlas generation;
- PixiJS integration;
- development Art Lab;
- automated screenshot/visual QA;
- Visual Foundation Pack rendered in the actual game.

Create or update:

```text
docs/art/ART_IMPLEMENTATION_STATUS.md
docs/art/THEANDRIL_ART_BIBLE.md
docs/art/ASSET_CATALOG.md
docs/art/GENERATOR_BAKEOFF.md
```

Bias toward implementation.

Do not ask for permission for routine reversible engineering choices.

If a provider requires an unavailable external credential:
- implement the adapter boundary;
- document the exact environment variable required;
- continue with all work that does not depend on that credential.

Do not wait idly.

Continue until the art-pipeline release gates in `ART_DEFINITION_OF_DONE.md` pass.
