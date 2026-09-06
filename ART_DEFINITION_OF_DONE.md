# Theandril Art Factory — Definition of Done

## Gate A — Tooling
- Aseprite existing Steam install auto-detected.
- Aseprite version command works through repo wrapper.
- Sprite Fusion Pixel Snapper installed/detected.
- provider adapter system works.
- `art:doctor` reports environment accurately.

## Gate B — Palette
- master palette exists;
- machine-readable;
- visually documented;
- used in validation;
- used by Pixel Snapper/Aseprite paths where applicable.

## Gate C — Generation
- at least one provider can generate autonomously;
- candidates stored separately from approved assets;
- prompts/settings/provenance captured;
- failures reported clearly.

## Gate D — Processing
- Pixel Snapper integration works;
- Aseprite normalization/export works;
- deterministic output hashes captured.

## Gate E — Validation
- image validation;
- palette validation;
- grid validation;
- transparency validation;
- animation validation;
- tile validation;
- reports machine-readable.

## Gate F — Art Lab
- browse assets;
- play animations;
- nearest-neighbor zoom;
- show pivot;
- show palette;
- show manifest;
- show validation score;
- terrain repeat preview.

## Gate G — Atlas
- approved assets packed;
- padding/extrusion correct;
- deterministic metadata;
- PixiJS loads atlas;
- no texture bleeding.

## Gate H — Foundation Pack
Integrated:
- core terrain family;
- settlement stages;
- world objects;
- one faction unit family;
- undead;
- monster;
- large creature;
- core effects.

## Gate I — In-game review
- deterministic screenshot scenario exists;
- actual game uses approved assets;
- visual review performed;
- weak outputs corrected.

## Gate J — Provenance
Every approved generated asset has:
- asset ID;
- generator;
- model/tool;
- prompt/settings hash;
- palette version;
- Pixel Snapper settings;
- Aseprite version/profile;
- validation metrics;
- source references;
- license/provenance note.

## Gate K — Continuous production
Given an existing content asset ID, Astra can:
- compile brief;
- generate;
- process;
- validate;
- approve;
- atlas;
- integrate

without redesigning the pipeline.

