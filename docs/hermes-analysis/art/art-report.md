# Theandril premium 1.0: art, audio and factory audit

## Verdict

**Preserve the established weathered-hearthlands pixel aesthetic and its existing culture designs. Do not restart the asset library.** The production foundation is substantial and technically coherent: **545 approved/published assets, 1,427 frames, 662 clips, 24 cultures and five atlas pages**. Fresh native validation passes every approval and all 19 existing Blender source imports. Approved frames match the runtime atlas pixels exactly.

Premium readiness is not the same as that technical completeness. The highest-value work is:

1. **Repair the current Waykeeper UI binding.** A paid appointment produces a `Generic` pawn even though an approved shared caster already exists. This needs **zero new images** for the immediate repair.
2. **Give the four playable strategic specialists distinct identities.** Current map/recruitment art aliases two roles to scout, one to spearman and one to cavalry. Start with four deliberate shared specialist sprites; full culture parity would be 96 qualified sprites, not an automatic first batch.
3. **Refine, rather than replace, the actual shared battle rigs and pixel silhouettes.** They have real articulation; several foot-role silhouettes are thin and materially simpler than the strategic figures. Pilot guard, cavalry and transport before expanding revisions.
4. **Unify biome originals with their quieter variants** and trial a native coast/interface kit against the actual map projection. Existing procedural geography remains a functioning fallback; this is presentation work, not missing terrain rules.
5. **Create a scoped audio subsystem and original sound identity.** No production audio files or playback implementation were found. Neither audited art factory supplies game Foley/music production.
6. **Synchronize the art contracts.** The visual bible still describes 12 cultures and obsolete production gaps, while the actual registry, current art status and runtime contain 24 cultures and the newer works/battle families.

There is **no missing live catalog ID in the audited allowlist**. That does **not** prove every UI consumer resolves its asset: Waykeeper is a concrete counterexample. The backlog therefore distinguishes missing dedicated identity, binding repair, quality revision, optional presentation expansion and future-only content.

## Scope and evidence boundaries

- Target: `/home/telephoneheater/Work/Theandril`.
- Snapshot commit: `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`.
- Exact catalog SHA-256: `e5a9b72658ab21b83e2a2b1dd7bbf07e2f7c0155b5baf9c97de5f03326d79630`.
- Exact audit time, per-asset/frame inventory, source paths, hashes, clips, editable headers, provenance and public/runtime comparisons: [inventory.json](inventory.json).
- Fresh production-validator and existing native-import results: [evidence/native-validation.json](evidence/native-validation.json).
- Actual opened images, hashes, subjects and observed limitations: [evidence/visual-observations.json](evidence/visual-observations.json).
- Factory capability matrix and recorded command handles: [factory-audit.json](factory-audit.json).
- Explicit planning queue: [art-backlog.json](art-backlog.json), [art-backlog.csv](art-backlog.csv). **27 rows: 11 P1, 11 P2, 5 P3.** The quantities are planning estimates, not new approved briefs or a canonical-content change.

This audit writes only `docs/hermes-analysis/art/`. It did not replace art, edit gameplay/renderer code, modify factory profiles/configuration, create review decisions, publish, generate images/audio, edit Blender scenes or commit. The game doctor briefly writes/removes its documented ignored cache probe. Native validators read retained production artifacts. Existing processing receipts were checked; all source renders or Aseprite exports were **not** regenerated.

I actually opened **15 of 17 generated audit sheets**, containing **164 distinct approved asset subjects and 236 distinct approved frames**, plus five additional images. The remaining two generated enlarged sheets are explicitly uninspected. Review includes all 24 guard first poses, all 24 city first poses, all 36 live biome tiles, all 31 works/deposit/civic first poses, all 13 shared battle first poses, a six-culture cross-role sample, and east-facing guard/cavalry/transport walk-or-sail, attack-or-fire and death-or-sink sequences. These overlapping scopes are deduplicated in code.

This is **representative pixel inspection, not blanket visual approval of all 545 assets or 1,427 frames**. Static contact sheets do not verify playback cadence, seamless loops, every direction, every background or full runtime readability. The retained battle/map screenshots were freshly viewed but remain historical executions. The fresh Waykeeper screenshot came from the parent agent's current campaign and is attributed separately; this subagent did not run that gameplay scenario. Gameplay and performance release audits belong to the other agents.

## Established aesthetic: what to preserve

The formal direction is **serious, original dark-medieval fantasy; modern-retro, deliberately clustered pixel art; painterly color/composition without painterly blur**. It depicts an old, dangerous, political world that is inhabited and worth rebuilding—not a uniformly black landscape or a parade of skull-armored villains.

The visible culture guards and towns substantiate this direction: dark cool iron, warm worked timber/leather, bone/linen highlights, muted colored cloth, worn brass/copper, masonry courts, peaked or stepped roofs, reed/root construction and restrained material accents. Equipment, shield shape, roof construction and negative space distinguish cultures better than a global tint. Keep the recognizable differences between square Ashen work gear, woven Reed equipment, rust/angular Cinder armor, pale/slate Glass Tide, broad Covenant plate, narrow Synod guardians and the later civic/coastal/underwood families.

Production rules to retain:

- Readable adult anatomy; separately legible head/helmet, torso, weapon, off-hand and identifying accent. More microtexture is not automatically better.
- Fixed screen-upper-left material light, readable middle values and restrained highlights. Magic is locally luminous because most of the world is subdued.
- Selective **darker local-color** separation, not universal black sticker outlines. Texture follows material planes; avoid salt-and-pepper stone and isolated highlight confetti.
- Exact `theandril-master-v1`: **64 colors**, binary alpha for the current native runtime. The Blender factory's copied palette is byte-identical to the game palette. Aseprite RGB documents do not exempt final visible pixels from palette checks.
- Original culture identity follows stable faction definitions, not renamed kingdoms, seats or owner tints. Preserve heraldry and keep ownership rings/text separate from skin, steel and cloth.
- Complete roofs, blades, pole tips, horse extremities and rigging inside their registered canvas; stable ground/waterline pivots across motion.
- Warm wood, aged brass/gold framing, parchment and legible responsive DOM text are part of the current UI language. Do not rasterize body text or turn the whole app into a low-resolution framebuffer.
- Preserve the unresolved Ashfall and successor institutions. More impressive art must not reveal its cause, restore fallen institutions or imply unimplemented flight, tunneling, blood magic, new monsters or supernatural culture rules.

The current project registry and observed pixels override the older installed compact guide's 12-current/12-proposed roster. This audit does not rewrite those references. Sources: [style standard](../../../ART_STYLE_STANDARD.md), [master art direction](../../../MASTER_ART_FACTORY_PROMPT.md), [project art-direction reference](../../../.agents/skills/theandril-pixel-art/references/art-direction.md), [visual bible](../../art/THEANDRIL_ART_BIBLE.md), [current art status](../../art/ART_IMPLEMENTATION_STATUS.md), [faction registry](../../../packages/art-pipeline/src/faction-art.ts).

## Inventory and technical integrity

### Catalog coverage

| Measure | Fresh result |
|---|---:|
| Briefs / candidate pointers / durable approvals / published assets | 545 each |
| Native frames / clips | 1,427 / 662 |
| Single-frame static / multiframe assets | 519 / 26 |
| Culture-qualified assets | 432: 24 cultures × 18 roles |
| Culture-qualified static / multiframe assets | 431 / 1 |
| Live-allowlisted assets / published but reserved assets | 528 / 17 |
| Missing live catalog IDs | 0 |
| Retained editable `.aseprite` documents for current approvals | 545 |
| Current approval validation failures / stale input hashes | 0 / 0 |
| Native/runtime frame pixel mismatches | 0 |
| Illegal-palette / nonbinary-alpha assets | 0 / 0 |
| Missing referenced source/review files | 0 |
| Existing Blender source imports passing | 19 / 19 |

Candidate pointers are workflow pointers, **not another 545 finished designs**. The current technical audit validates durable approvals, not the artistic quality of every unapproved candidate or rejected historical source. Editable document headers match expected dimensions/frame counts; that is not a new interactive editing review of all documents.

| Native square canvas | Published assets |
|---|---:|
| 32×32 | 24 |
| 64×64 | 342 |
| 96×96 | 153 |
| 128×128 | 26 |

By schema type: 310 unit-type assets (including characters and battlefield roles), 34 map objects, 10 effects, 3 monsters, 75 settlements, 41 terrain assets and 72 UI assets. These schema categories are not counts of canonical recruitable unit types.

The common culture kit is already complete: six land units, three naval hulls, marshal/surveyor/engineer, village/town/city, crest/banner/badge for each culture. All 72 culture hulls remain static strategic poses. **All 18 improvements, five civic buildings and eight deposits exist**. A cluttered or mostly unavailable improvement catalog is UI hierarchy work, not a request for 18 missing sprites.

### Actual animation, not filenames

- **13 shared battle unit sets:** eight foot sets at 64×64 `(32,56)` and five mounted/hull sets at 96×96 `(48,80)`. Each has separately rendered east/west directions, five states, **64 frames and ten clips**. Combined: **832 frames / 130 clips**. Idle has four 200 ms frames; walk/attack/death have eight 100 ms frames; hit has four 100 ms frames. Hulls use sail/fire/sink. Idle/movement loop; attack/hit/death/sink are terminating clips.
- **Six battlefield pilot assets:** five effects and `character.waykeeper`, each eight 100 ms southeast one-shot frames. Effect pivot `(32,32)`; caster feet `(32,56)`. Waykeeper uses `cast`; it is not a full idle/walk/attack/hit/death character set.
- **Four strategic idle sets:** shared guard/scout/colonist and the qualified Ashen scout, four 250 ms southeast frames each. Other culture-qualified artwork is static.
- **Three older multiframe effects:** `effect.magic`, `effect.melee`, `effect.projectile`; currently reserved rather than live battle effects. The other two old overlays are static.

Fresh validation retains **16 intentional-hold warnings across eight battle assets**, one per east/west attack clip: arbalester, colonist, guard, halberdier, heavy infantry, scout, skirmisher and spearman. They pass validation and have fresh prior approvals. Repeated poses within an otherwise articulated clip can be intentional holds; they are not proof of fake animation or proof of correct timing. Revisit them during real playback review rather than deleting held frames automatically.

The current Blender importer was actually called read-only for every active source. It verifies registered contracts, retained hashes, raw/native frames and source articulation evidence. The 13 battle units have weighted mesh/armature source production. The six older effects/caster use object-keyed geometry; **Waykeeper must not be described as the same weighted unit rig system**. Fixed source rendering, real relative limb/equipment changes and retained Actions distinguish the battle workflow from translated stills. No new Blender render was executed in this audit.

### Atlas and source provenance

| Page | Dimensions | PNG bytes | Decoded RGBA |
|---|---|---:|---:|
| foundation | 2048×2048 | 2,628,301 | 16 MiB |
| map-works | 512×512 | 89,796 | 1 MiB |
| battle | 1024×1024 | 26,100 | 4 MiB |
| battle-foot | 2048×2048 | 626,544 | 16 MiB |
| battle-mounted | 2048×2048 | 779,449 | 16 MiB |
| **All pages** | | **4,150,190** | **53 MiB** |

Every atlas PNG hash/dimension matches its catalog, the public PNG/JSON copies match retained runtime files, and the two catalogs are byte-identical. Map pages total 17 MiB; battle pages are designed to be deferred. This is **decoded atlas storage**, not a fresh measurement of GPU residency, total browser memory, DOM decoding or frame time. The audit compared published bytes; it did not repack atlases or remeasure performance.

Current provenance declares **518 `codex-imagegen`, 19 `blender-art-factory`, and eight `theandril-integer-overlay` assets**. These are attribution counts, not API-call totals. All 545 retain actual Pixel Snapper/Aseprite processing evidence; the 13 large battle sets retain their full hash-bound processing receipts.

The source tree contains **6,454 files**, including **4,917 PNGs and 34 `.blend` files**, across originals, rejected/revised sources, raw/native frames and frozen dependencies. Fifteen exact `generation.json` indexes contain **429 selected source records / 429 unique paths** with matching declared source hashes. Those indexes exclude earlier sheet originals, the differently named animation index and Blender recipes; do not call 429 the entire historical generation count. The source inventory lists the physical files separately so revisions cannot inflate finished-asset totals. Retained license notes and unknown model/seed declarations are provenance, not a fresh legal opinion or proof of provider account access.

Outside the Pixi catalog are three existing DOM material WebPs: `ornament.corner-idle.webp` (128×128), `parchment.webp` and `wood.webp` (512×512 each). They total 68,784 download bytes and are not three new game illustrations. Their earlier Hearth & Card provenance record remains linked in [slice25 material evidence](../../art/reviews/slice25-hearth-materials.json).

## Findings from actual pixels and consumers

### Culture strategic art: retain identity, prioritize native readability

The enlarged guard sheets show differentiated shield/head/cloth shapes and material families rather than mere palette swaps. Pale bone/brass edges often carry thumbnail readability. Dark boots, narrow blades and some lower limbs are harder to separate on the dark inspection background. Review a failing subject against its actual terrain before making a blanket brightness change. The later pale civic/harbor cities have dense circular/terraced roof structures, while earlier cities are more compact blocky groups; these differences can be cultural strengths. Test village-to-town-to-city mass separately rather than assuming this all-city sheet validates every progression.

- [Guard overview at 1×](evidence/guards-all-1x.png)
- [First twelve guards at nearest 4×](evidence/guards-first12-4x.png)
- [Remaining guards at nearest 4×](evidence/guards-last12-4x.png)
- [All cities at native size](evidence/cities-all-1x.png)
- [Six-culture cross-role sample](evidence/culture-crossroles-1x.png)

### Battle art: genuine motion, a visible stylistic gap

Native battle first poses are noticeably narrower and plainer than strategic culture sprites. Small pale helmets, thin lower limbs and edge-on shields make several foot-role bodies similar at a glance. Long polearms, rider/horse masses and hulls distinguish some classes more clearly. Enlarged historical battle views expose the simplified construction rather than adding new detail. A denser strategic silhouette pasted into the battlefield is not automatically a solution: the two scenes have different scale and population constraints.

The static action sheets do show relative guard leg/weapon changes, horse/hoof/rider changes, and transport sail/oar/waterline changes. Falling/sinking silhouettes vary through their sequences. Preserve this real articulation and exact casualty identity; improve large body/equipment value groups and silhouette first. Do not replace the rigs with bobbing images or commission 312 culture battle rigs to solve a shared-role readability problem.

- [All 13 battle first poses at 1×](evidence/battle-roles-1x.png)
- [Battle roles enlarged](evidence/battle-roles-4x.png)
- [Guard actions](evidence/battle-guard-actions-1x.png), [cavalry actions](evidence/battle-cavalry-actions-1x.png), [transport actions](evidence/battle-transport-actions-1x.png)

The vision transport downscaled the large battle-role and guard-walk 4× sheets by half. Native 1× sheets were inspected separately, and the guard sheet's top-left crop was reopened at exact 4×. Do not describe the downscaled whole-image displays as exact 4× inspection. No clips were played here.

### Terrain and works: value cohesion before more variation

The desert original is strongly orange with bright dune lines beside muted sand variants. The alpine original has taller, larger high-contrast snowy peaks beside lower, rockier variants. Grassland's original uses stronger small foliage highlights than the quieter variants. The all-biome view also warrants triage of taiga/ocean balance. Large regions risk reading as alternating unrelated stamps. This is directly visible in the pixels; the separated sheet alone does not establish seams or broken adjacency.

All 31 existing works/deposits/civic silhouettes were inspected at native size, with selected enlarged pairs. Agricultural plots, timber extraction frames, masonry archives and raw ore masses are distinguishable. Warm wood and cool stone/water fit the world. Fine crops, scattered edge pixels and dark detail may lose value under minification; more texture is not the remedy. Keep the existing opaque-union/inset-hex fitter and review real map scale. Do not manufacture duplicate resource assets because the UI has many unavailable choices.

Current shores/river curves/roads and construction scaffolds include procedural graphics. Five old terrain overlays are published but excluded from the live art allowlist; their mere existence is not an integrated coast/river/road kit. The renderer's current regular hex has radius 29 and row step 43.5, while the reference's 56×64 integer layout is a proposed presentation grid. A new kit must honor current projection/picking/fog or explicitly coordinate a later projection conversion—never alter canonical neighbors to fit art.

- [Biome original/variant comparison](evidence/biomes-desert-grassland-alpine-4x.png)
- [All 36 biome tiles](evidence/biomes-all-1x.png)
- [All 31 works](evidence/works-all-1x.png), [selected works enlarged](evidence/works-sample-4x.png)
- Historical map-context example: [grain deposit capture](../../art/reviews/slice27/generated-grain-deposit.png), not a new scenario from this audit.

### Confirmed P1 consumer defect: Waykeeper `Generic`

Parent campaign evidence: Small / 12 cultures / Continents / seed `20260909`, Ashen turn 20, after paid Contained ember projection research and an own Waykeeper appointment. The screenshot visibly shows **Edrin Coalstead 2**, **Waykeeper**, **Known workings: Cinder thread**, and a pawn labelled **Generic** in both roster and selected sheet.

The cause is visible in code: `loadFactionArtFrame` computes a qualified ID and rejects immediately when `factionArtId` cannot register the role, **before** its later generic fallback lookup. `character.waykeeper` is absent from the faction-role registry, although the shared approved sprite is published. `characters.tsx` routes the role through this UI component. Thus an asset-complete allowlist still yields a visible fallback.

Repair routing to the truthful approved shared image first, testing that the deferred effects page's DOM loading remains bounded. A dedicated idle/portrait would be a one-asset presentation pilot; 24 culture variants are an optional later expansion. Do not make this P1 binding repair wait for those variants. Also distinguish a truthful `shared` role label from the current failed-load `Generic` pawn.

Evidence: [fresh parent screenshot](../ui/24-waykeeper-appointment.png), [scenario text](../ui/24-waykeeper-appointment.txt); code: [faction-art.tsx lines 68–82, 137–151](../../../apps/web/src/faction-art.tsx), [role registry lines 8–18, 26–28](../../../packages/art-pipeline/src/faction-art.ts), [character views](../../../apps/web/src/characters.tsx).

### Contract drift is a production risk

The current visual bible says “twelve authored cultures, not twenty-four,” 216 qualified assets and a 260-asset publication, and still treats researched improvements as unproduced. Those statements conflict with current registered production. `docs/art/README.md` line 8 still says one facing/idle, despite the actual `sourceClips` implementation and later battle documentation. The older resolution reference proposes 96/128 tactical canvases, while current weighted battle production deliberately uses 64/96. The older art-direction reference permits graded effect alpha; current runtime contracts enforce binary alpha. Treat these as historical/proposed guidance, not permission to change shipped canvases/alpha.

Make one current contract table authoritative; label earlier milestones explicitly. This audit records the discrepancies without modifying those documents.

## Factory audit: actual supported capability, not a wish list

### Paths and tool readiness

| Requested path | Verified result | Checkout actually inspected |
|---|---|---|
| `/projects/BlenderArtFactory` | **Does not exist** | `/home/telephoneheater/Projects/BlenderArtFactory` |
| `/pixel-art-factory` | **Does not exist** | `/home/telephoneheater/Projects/pixel-art-factory` |

Recorded commands: `python3 -B -m factory --help`, `doctor`, `list`; `./paf --help`, `./paf doctor`; game `node --import tsx scripts/art.ts doctor`; and `python3 -B tools/blender_mcp.py status`.

- Background Blender discovery succeeds: **Blender 5.2.1 LTS**.
- Aseprite discovery/version succeeds: **1.3.18.3-x64** from the existing Steam install.
- Actual upstream Pixel Snapper discovery/version succeeds: **spritefusion-pixel-snapper 1.0.0**.
- Pixel factory also discovers ImageMagick and hyprcursor-util. No reinstall was necessary.
- Game doctor reports `readyForProcessing: true`.
- **Blender MCP connection refused.** No live scene was touched. This does not block the independent background Blender workflow and is not a reason to discard existing source rigs.
- Optional provider credentials/configuration were absent or unverified. Only presence booleans were read; no credential values were printed or retained, and no provider request was made.

### Standalone BlenderArtFactory

Four profiles are actually listed: `modern-warfare` (service-crate study), `theandril-pixel-2d`, `theandril-pixel-3d`, and `theandril-fantasy-realism` (shrine studies). Changing `--asset` alone changes identity/output naming, **not the recipe subject**. An arbitrary new sword, citizen or terrain tile needs an authored/adapted recipe or supported source workflow.

The stock 2D profile renders **384×384 raw → 96×96 native, eight static facings**, with nearest reduction, 0.5 alpha threshold and the exact 64-color palette. It requests orthographic 45° azimuth / 35.2643897° elevation. The generic code consumes sprite size/facing count, raw render resolution, preview scale and alpha threshold. The role overrides document 64 infantry, 96 cavalry/town, 128 city, 64 improvement and 32 badge conventions—but **do not automatically apply those roles or anchors**. The stock rotating-camera study does not automate fixed screen-upper-left light and ground-anchor placement across facings. Motion-blur/depth-of-field profile flags are also not wired to all generic review cameras; the game-owned driver explicitly fixes its own camera behavior.

Output includes editable `.blend`, PNG evidence/native facings and optional reference GLB. Runtime for the 2D profile is PNG, not GLB. Generic technical validation checks native sizes, actual facing set, legal colors, binary alpha, transparent outer border and retained file hashes; GLB workflows add geometry/material/embedded-resource/budget checks. It does not prove sufficient interior padding, attractive clusters, anatomy, loop quality or engine binding. Requested production texture channels, LODs and bakes are not generated merely because a profile mentions them.

The actual standalone shrine contact sheet was opened: eight views of the same geometric stone/flame assembly. Its broad cubic forms differ from the organic/detail-rich strategic sprites. It is a study/reference, **not new canonical shrine gameplay, not an animation set and not a drop-in native import**. Exact inspected image is listed in `visual-observations.json` under the factory's immutable published archive.

### pixel-art-factory / `paf`

This is an **Aseprite-first processing/packaging wrapper**, not local generative pixel authorship.

| Command/capability | Actual boundary |
|---|---|
| `pixelate` | Width 8–4096; proportional rounded height; nearest resize. Optional 2–256 derived colors; `--colors 0` retains RGB. It does not select Theandril's exact palette by saying `--colors 64`. |
| `scale` | Integer enlargement factor 2–32. |
| `palette` / `recolor` | Extract GPL palette; load a supplied GPL and convert indexed with `none` or `ordered` dither. No game-specific fixed palette is bundled/enforced by these commands. |
| `source` | Opens a PNG and saves `.aseprite`. It does not invent layers, missing poses, timing or clean clusters. |
| `export` | Saves Aseprite to PNG, factor default 1. Native Aseprite can do more, but this wrapper does not expose the game's deterministic tags/durations/sheet-JSON/pivot validation workflow. |
| Cursor/background/theme | Useful unrelated packaging tools; not sprite atlas publication or game integration. |
| `provider` | Optional Pixflux-v2 still-image prompt/size request. No reference, animation or seed flags in this wrapper; key absent. |

`paf pixelate` cannot turn an unstructured image into finished authored pixel anatomy or a coherent animation. GPL recoloring also does not replace binary-alpha, anchor, frame and engine validation. The provider wrapper's error text advertises 16–400 dimensions, but its code only enforces a two/three-digit size string; it should not be relied on as the robust game-side validator. No network test was attempted.

### Existing game-native Blender → pixel → Aseprite import is already real

The game-owned `tools/art/blender-battle/` and `units/` extension uses actual BlenderArtFactory geometry/profile/PNG helpers, **not the stock shrine turntable as pretend animation**. It adds authored rigs or keyed objects, **256×256 raw rendering**, fixed whole-motion camera/anchor projection, independent directions, palette-reduced 64/96 native frames and immutable source manifests. Active source imports cover the 13 battle units plus five effects and Waykeeper; arbitrary unregistered new roles still need explicit contracts/adapters.

The game's source processing invokes real Pixel Snapper and Aseprite. It deliberately enlarges normalized native clusters before Snapper rather than blindly re-snapping single-pixel art. Explicit frame lists, durations and `state.direction` tags are preserved. Aseprite source creation supports 1–256 supplied frames and at most 64 tags; frame durations are bounded at 1–60,000 ms. Native profiles include 32², 64², 96², 128² and a library-level 384×216 vignette profile. **The current main CLI selector accepts only square 32/64/96/128**, so portrait/vignette/menu recommendations need an export-routing change; a library constant is not an end-to-end feature.

Exports are untrimmed RGB, retain tags/timing, use JSON-array metadata and a bounded 4096×4096 sheet. Wide 96px/64-frame documents use rows, not an oversized horizontal strip. After export the game validates dimensions, frames, pivots, palette/alpha, source/processing hashes and review-input freshness. Individual approval, explicit scene-page packing, integration and actual consumer review are separate gates. This is stronger and more game-specific than `paf source`/`export` alone.

### Optional generators: implemented adapters versus present access

| Lane | Implemented adapter capability | Current audit status |
|---|---|---|
| Game PixelLab | Pixflux-v2 stills; 16–400 per side, minimum area 1024; safe-integer seed; one init image in library adapter. No character/hex/animation API. Main CLI does not forward reference images. Above 200², no-background is not guaranteed alpha. | No usable key; no request. |
| PerfectPixel | Upstream `ppvalidate` **base-only** mode; request bound 1024²; no seed/reference/animation support in this adapter. Upstream result still needs native palette/size normalization. | Headless executable/provider setup unavailable. Do not confuse GUI or upstream directional features with this adapter. |
| ComfyUI | Loopback text-to-image, up to 2048²; explicit prompt/seed/size bindings, installed model/workflow and license notes. No reference/animation or guaranteed transparent workflow. | No configured working workflow/backend verified; no model download. |
| Historical Codex source | Retained original source/prompt bridge; 518 current assets declare `codex-imagegen`. | A previous session's built-in generation tool is not callable through this Node CLI or inherited by Hermes merely because docs mention it. |

No optional lane was used for this audit. Provider/tool licenses do not automatically establish rights to every generated result or supplied reference.

## Supported unified production workflow

Use a **shared contract and evidence chain**, not a new monolithic generator:

1. **Brief the current consumer:** exact stable ID, current mechanics, role silhouette, material groups, one distinguishing detail, native canvas/pivot, frame/state/direction matrix, footprint and scene residency. Resolve conflicts against the actual registered production, not obsolete guide totals.
2. **Author the source deliberately:** reuse/adapt the existing game Blender rig lane for real battle motion; use original architecture/volume recipes where helpful; use native Aseprite/hand pixel authorship for small icons, masks and edge kits. A legitimately available raster provider supplies a source candidate, not approval.
3. **Controlled rendering:** one camera/scale/anchor over the full motion union; separately rendered asymmetrical directions; fixed screen-space light, alpha, no motion blur/DOF. Preserve `.blend`, recipe, dependencies, raw frames and precise transforms. Do not crop/recenter every pose independently.
4. **Pixel finishing:** documented nearest reduction, exact palette and binary-alpha normalization, deliberate native cluster/outline work, then the actual game Snapper stage. `paf` is optional tooling for defined transforms, not a replacement for this authorship or the game's processing receipts. Retain edited sources so a future regeneration cannot erase manual work.
5. **Aseprite assembly/export:** supplied true frames, explicit tags/durations, fixed pivots, bounded row sheets and JSON. Use the game adapter where it already exists; add the missing profile/role route before promising non-square portraits, menu art or new IDs.
6. **Native validation and individual visual review:** check every revised frame, light/dark/game backgrounds, native and true integer views, weapon handedness, motion/holds/loops and source rights. Fresh bytes require fresh individual review; old approvals remain recoverable.
7. **Approved-only game integration:** current live binding/fallback/DOM/Pixi resolution, explicit atlas scene partitions, opacity geometry refresh for changed props, actual paid gameplay and land/naval/cast/casualty scenarios. Verify pause/skip/reduced motion, fog, saved replay hashes and budgets. A factory publication is not a browser test.

These are supported components with explicitly identified adaptation work. There is **no existing one-command BlenderArtFactory → paf → arbitrary Theandril asset auto-publisher**, and none was created or invoked.

## Explicit backlog for premium 1.0

P1 means a current-consumer issue or premium priority, not necessarily a missing file. P2 is targeted polish/optional extension of current presentation. P3 must not be included in a current engine-consumed missing-assets claim. Full assumptions, resolutions, animation requirements, pipeline applicability, dependencies and acceptance checks are in the JSON/CSV.

### P1 visual and pipeline work

| ID | Existing | Proposed missing/revision scope | Dependency |
|---|---|---|---|
| ART-07 | One shared 64² Waykeeper cast | **Binding fix: zero new images**; optional one idle/portrait pilot, then optional 24 culture versions | Current UI route/fallback repair; validate paid appointment/attachments and deferred loading |
| ART-01 | Four current battle specialists, but strategic role aliases | **Four distinct shared strategic pilots**; up to **96 qualified** sprites for full parity, 64² foot / 96² lancer | Qualified role registry/bindings; no new units |
| ART-02 | 13 animated shared battle roles / 832 frames | Revise **three pilots**, at most 13 sets if actual review warrants; **zero absent sets** | Preserve rigs, state matrix, casualty identity and memory budget |
| ART-03 | 36 live biome tiles | Triage **five original bases**, review all 36; **zero absent live tiles** | Same deterministic presentation choice and physical geography |
| ART-04 | Procedural shores/roads/rivers; five old unbound terrain assets | **Six coast-edge pilot pieces**, then estimated **30–48** native modular interface pieces at 64² | New presentation mask/compositor, current radius-29 projection, seam/fog tests; no topology change |
| ART-05 | Conflicting historical/current contracts | Synchronize at least **three contract documents**; no images | Current registry/runtime evidence; retain history as history |

ART-04 starter arithmetic is six coast edges + six corner pieces + six biome edges + six river-bank pieces + six road/bank joining pieces. This is **not** proof that 30 pieces cover every topology; actual adjacency design may reduce or expand it. Reject a failing six-edge pilot before multiplying production.

### P2 targeted premium polish

| ID | Existing coverage | Proposed scope, with native target |
|---|---|---|
| ART-06 | Five battle effects + Waykeeper, all eight-frame clips | Review two pilots; refine up to six sets at 64² only if warranted. No missing effects for the two current spells. |
| ART-08 | 432 qualified culture assets | **Zero missing common-kit assets**; targeted fixes only after concrete native/runtime review. |
| ART-09 | Three tiles per biome | Optional **12** additional 64² tiles after cohesion; requires another presentation variant slot. |
| ART-10 | Housing reuses 24 village sprites; scaffolds procedural | Optional **48** housing variants at 96² and **four** shared construction stages at 64²; not new building rules. |
| ART-11 | 72 qualified officer stills | **Three shared animated officer sets** at 64²; actual response/casualty presentation contracts first. |
| ART-12 | 72 heraldic assets, no dedicated small status/action family | **24–40** deliberate 16/24/32px icons; starter eight resource, eight status, eight action shapes. Add missing small profiles as needed; retain text cues. |
| ART-13 | No dedicated character bust family | Optional **four shared role busts**, 128×160 with 64×80 thumbnail; non-square route/slot required. Not an automatic 96-portrait commission. |
| ART-14 | Procedural battle floor and siege bar | **8–14** restrained ground/fortification pieces: 64² repeats / 128² modules; do not imply simulated cover or passable gates. |
| ART-15 | Three DOM materials, no dedicated screen illustrations | **5–8** illustrations: 640×360 menu/victory, 384×216 chronicle and 256×144 narrow exports; new non-square routing required. |
| ART-16 | Four strategic idle sets, only one qualified culture scout | Start **23** other-culture scout idle clips; optional upper **215** remaining qualified base-unit idles. Four supplied 250 ms southeast poses; no unconsumed actions. |
| AUD-05 | No ambience | **Six** quiet loop masters/beds, after audio integration; details below. |

Housing, officer and illustration rows are premium options, not falsely declared missing catalog IDs. For the idle upper bound, 24 cultures × nine existing strategic unit roles minus the one qualified scout is 215; it is not “animate all 431 static assets,” which would include static heraldry and buildings.

### P3: exclude from current binding-gap totals

- **ART-17:** additional strategic facings, movement/action families—quantity **TBD** until consumers and LOD/direction contracts exist.
- **ART-18:** full culture-qualified battle identity—**312 qualified sets / 19,968 frames** if 24 × 13 × 64 were explicitly commissioned. The current 13 shared sets remain valid fallbacks and are not 13 of those culture originals. This is a large optional future expansion.
- **ART-19:** seven already-present reserved subjects: three monsters, `unit.mage`, `unit.commander`, `map.resource`, `map.watchtower`. **Zero missing images** for this listed group; mechanics/content/consumer decisions come first.
- **ART-20:** more magic schools, rituals, weather and disasters—quantity **TBD** from accepted mechanics. Current Cinder thread and Bound ward do not justify an invented schools-by-spells quota.
- **AUD-07:** voice acting, culture chants and future magic sound—quantity **TBD** after scripts, languages, casting, rights and actual consumers.

The full 17 reserved published IDs are in the inventory. They include five older effects and five terrain overlays as well as ART-19's subjects. Reserved does not mean corrupt or safe to delete; some current procedural features may later use revised versions.

## Audio audit and explicit commissioning proposal

### What exists

The source/public-file scan found **zero audio files** for `.mp3`, `.ogg`, `.wav`, `.flac`, `.opus`, `.m4a`, `.aac`, `.mid`, `.midi`, `.aif`, `.aiff` and `.webm` in its production scope. It scanned **719 implementation/config files** for Web Audio/HTML Audio construction, common library identifiers, `<audio>`, playback hooks and common audio extensions and found **zero playback matches**. Dependencies, build outputs, caches, handoff duplicates and audit artifacts were excluded. The list and scope are retained in `inventory.json.audio`.

This supports “no audio assets or playback system found in the project,” not “I listened and it failed.” No audio playback/listening test was possible on a nonexistent audio catalog. The art factories do not provide a game Foley/music/mastering pipeline; installed image tooling is not audio support.

### Premium starter scope—not existing filenames

| ID / priority | Proposed principal output | Quantity and assumption |
|---|---|---|
| AUD-01 / P1 | Audio runtime, manifest and rights contract | **One subsystem**, not a sound file |
| AUD-02 / P1 | UI one-shots | **10** clean cues: selection, confirmation, cancellation, error, tab/window/navigation and save/load/end-turn distinctions; exact binding taxonomy reviewed before naming |
| AUD-03 / P1 | Campaign Foley/notifications | **24** rendered variations: 12 event families × two; movement, construction/completion, recruitment/research, survey/refit, economy and diplomacy/war/siege contexts |
| AUD-04 / P1 | Battle Foley/effect sounds | **48** variations: 16 material/action families × three; metal/wood/projectile/horse/hull/water/hit/death/rally/ember/ward contexts, not one sound per soldier or frame |
| AUD-05 / P2 | Ambience | **Six** loop beds: settled hearth, open field, woodland, wetland, high cold, coast/sea |
| AUD-06 / P1 | Original starter score | **Five** compositions: menu, quiet campaign, tension campaign, battle, aftermath/current victory; durations/stems scoped after audition |

That is **93 principal outputs** across the proposed one-shots, beds and compositions, excluding source stems, alternative encodings and future voices. They are **not equivalent-cost work units**, and a global art-plus-audio “missing total” would be misleading. No filenames, composers, recording rights or delivered minutes are invented by this audit.

Suggested production contract: original/licensed 48 kHz / 24-bit WAV masters; mono for small positional effects, restrained stereo for ambience/music; test actual browser encodings and loop seams. Store stable cue ID, source/creator, origin/license, reference rights, tool/project versions, source/export hashes, duration, loudness/peak targets, loop bounds and variants. Review on headphones and speakers at quiet levels before claiming a final mix. A numeric loudness target should follow listening and mix design, not be invented as a passed measurement.

Preserve the aesthetic acoustically: paper, cloth, worked wood, weathered iron/brass, water and restrained ember/ward gestures; modal/acoustic/bowed warmth and uncertainty rather than constant cinematic triumph. These are proposed art-direction choices, not existing compositions.

Runtime acceptance must include user-gesture unlock, master/music/SFX/ambience controls, persistent mute/volume, safe missing-file behavior, bounded simultaneous voices, cancellation on pause/skip/seek, visibility policy and crossfades. Sounds observe only permissible local/visible events: no fog leak through enemy construction or movements. Audio must never affect simulation RNG, damage, turns or replay hashes; preserve visual/text equivalents and test reduced-motion/pause policies explicitly.

## Recommended production order and exit gates

1. **Binding/contract pass:** fix Waykeeper and consolidate current contracts. Verify one paid appointment, a second culture, shared/failure labels and deferred-page behavior. Do not generate anything for a routing defect.
2. **Art-direction pilots:** one specialist identity set, guard/cavalry/transport refinements, original-versus-variant terrain pair and six coast-edge pieces. Preserve approved originals. Review source, native, temporal and actual UI/map/battle context independently.
3. **Sound vertical slice:** audio manifest/player controls plus a small UI/campaign/battle cue sample and one score audition. Confirm observation safety and fatigue/mix before commissioning the full 93-output proposal.
4. **Scale only accepted families:** multiply the demonstrated specialist/terrain/audio direction, not arbitrary factory names. Optional housing/portraits/vignettes wait for their real consumer and export routes.
5. **Release evidence:** all revised frames and clips reviewed at native and integer scale on light/dark/game backgrounds; actual land/naval/character/works/fog/narrow scenarios; unchanged deterministic replay; bounded scene/DOM residency and measured frame-time gates. No claim that previous visual approvals or a 53 MiB atlas total establishes these fresh release gates.

## Reproducing this audit without production writes

From the verified game root:

```sh
node --import tsx docs/hermes-analysis/art/audit-native.ts
python3 -B docs/hermes-analysis/art/audit-inventory.py
python3 -B docs/hermes-analysis/art/record-inspections.py
python3 -B docs/hermes-analysis/art/build-backlog.py
```

The native script calls the actual validator and existing Blender source importers without preparation/publication. The inventory matches frame IDs rather than assuming manifest/atlas order, compares all native pixels to atlas rectangles, checks retained editable headers, hashes source references, scans audio and creates nearest-neighbor evidence sheets. `record-inspections.py` records **this audit's actually inspected subject list**; rerunning it is not a new human/agent visual review. If pixels change, reopen them and update the evidence scope before making new judgments. `backlog-spec.json` is planning data, and the builder verifies all referenced existing IDs before rendering JSON/CSV.

Known limits remain: MCP unavailable; optional generators unconfigured/unexercised; no new background renders or audio output; no fresh subagent gameplay/animation playback, all-background review, GPU performance, full-catalog visual approval or commercial-rights determination. Those are explicit remaining gates, not fabricated successes.
