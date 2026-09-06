# Asset and dependency provenance

The initial strategic map uses original procedural vector hexes, terrain silhouettes and entity marks drawn in PixiJS. The interface uses system fonts and original CSS. No raster game art, downloaded game assets, remote fonts or copied setting prose are present.

The official PixiJS repository skills are MIT-licensed and recorded in `skills-lock.json`. Their copyright/license text remains alongside the installed skills. They are development documentation and are not included in the web build.

Runtime dependency licenses are recorded by each package in the pnpm lockfile dependency graph: React, Vite, PixiJS, Zod, Dexie and fflate. A complete distributable third-party notice bundle remains a release-hygiene task before 1.0.
