---
name: theandril-aseprite
description: Use whenever Aseprite CLI, sprite-sheet export, frame/tag handling, palette conversion, pixel-safe transforms, tile packaging, or Aseprite-based validation is involved.
---

# Theandril Aseprite Skill

Important environment fact:

**Aseprite is already installed through Steam on this Omarchy Linux machine.**

Do not blindly reinstall it.

First locate it using:
- `ASEPRITE_BIN`;
- `tools/art/find-aseprite.sh`;
- common Steam paths;
- Steam library metadata.

Create/use one repository adapter.

Do not scatter hardcoded Aseprite paths.

Prefer headless CLI.

Use Aseprite for:
- tag/frame export;
- sprite-sheet export;
- JSON metadata;
- indexed palettes;
- pixel-safe transforms;
- batch operations;
- tileset support where useful.

Do not commit Aseprite/Steam binaries.

Record Aseprite version/profile in asset manifests.
