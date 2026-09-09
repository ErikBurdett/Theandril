# Theandril art implementation status

Updated: 2026-09-08. A real end-to-end **foundation** runs from original generation through native processing, individual visual review, deterministic atlas publication and live gameplay. This is not full visual-production or game 1.0 signoff.

## Published result

545 individually reviewed assets / 1,427 frames / five atlas pages. The world uses a 2048² foundation and 512² map-works page. Battle effects use a deferred 1024² page; eight foot roles and five mounted/hull roles use two additional deferred 2048² pages. The new battle family supplies 832 actual rendered frames / 130 directional clips across 13 shared original role rigs. Sixteen new original deposits/extraction works cover the eight canonical resources. The preceding ten improvement/civic originals and six battlefield clips remain published. Twenty-four cultures retain 432 qualified faction assets, including 72 static naval hulls; those strategic culture assets are not newly animated. Generic guard/scout/caravan idle clips, the Ashen scout pilot and 24 biome variants remain intact. [Exact coverage](ASSET_CATALOG.md), [faction coverage](FACTION_ASSET_CATALOG.md), [visual bible](THEANDRIL_ART_BIBLE.md).

The foundation PNG remains 2,628,301 bytes, SHA-256 `e32c73be1b8789f8c554eea7c6b7204d40fae20e3347be36ccbd76de8a9740de`; all five published PNGs total 4,150,190 bytes. Reversed-input reconstruction remains byte-identical, including every native frame. The two map pages decode to 17,825,792 bytes (17 MiB); first battle adds 36 MiB (53 MiB total atlas residency). Native DOM icons can separately decode another page. This is not total presentation memory. Earlier static pack sources, approvals, briefs, editable exports and exact reviews remain retained.

## Individual battle rigs and resource works — current slice

The [shared battle production and review](reviews/BATTLE_UNIT_ANIMATION.md)
retains original editable Blender rigs, all five Actions, actual raw/native
renders, Pixel Snapper and Aseprite exports, exact processing receipts and
individual visual approvals. Guard, cavalry and transport received independent
art-direction review before the full batch. All ten land roles and three hull
roles have two independently rendered facings and idle/walk/attack/hit/death
or equivalent sail/fire/sink clips. Per-member render pools follow canonical
movement, source/target IDs and exact deaths; no animation applies damage.
The coordinated runtime browser review passes 7/7, including all land/hull roles,
exact casualties, actual effects and an isolated 2,240-soldier workload. A separate
390px tactical-camera and battlefield follow-up passes 5/5. Fit/2×/3×/4×, Focus
selected and bounded pan enlarge actual sprite pixels while preserving paused
frames, pointer selection and the canonical state hash. Exact accepted images
and JSON are retained in the [runtime manifest](reviews/battle-units/runtime/manifest.json).
The isolated Fit sample runs on actual SwiftShader at frame p50 50 ms / p95
66.7 ms; this is not 60 FPS or physical-GPU approval. The camera follow-up is
functional evidence, not a replacement performance sample.

All 18 canonical improvements, five civic buildings and eight deposits have
registered exact opaque-pixel unions contained in the inset hex. The new
resource source/processing workflow uses sixteen independent raster originals,
with real native/Aseprite processing and exact approvals. Live runtime bindings
include both every deposit and every paired extraction building. Generic
fallbacks remain available for all completed works if approved artwork cannot
load. Source/native art approval is separate from resource economy and browser
integration evidence in the [overall status](../IMPLEMENTATION_STATUS.md).

## Growing hearths, tile assets and readable zoom — slice 26

All ten tile improvements now have approved original sprites. Five new civic
assets represent the actual Root cellar, Cinder workshop, Charter market,
Witness archive and Charter harbor. Exact sources, prompts, approvals, editable
Aseprite files, native/4× review and deterministic publication are retained in
[the production record](reviews/HEARTH_IMPROVEMENTS.md). The foundation atlas is
byte-identical; all ten new originals fit the additional 1 MiB map-works page.

Fifteen improvement/civic assets now fit their all-frame opaque silhouettes at
85% of the inset hex, typically 36–40 world pixels wide. The current town fits
remain unchanged. Army scaling is uniform and bounded in screen pixels; far
heraldry has independent screen-sized backing, separated garrisons and explicit
entity hit tests. Shared specialist silhouettes retain the actual approved
source IDs and do not count as four new dedicated asset families.

Observed population creates culture housing blocks inside known claims;
completed buildings add civic districts, active work adds scaffolds, and worker
assignments/finished improvements change the ground. Sparse approach lanes are
cosmetic and tracked separately from canonical roads. Districts remain cached
with their tiles. Hidden queues and unseen current enemy upgrades never enter
the layout. [Actual paid construction, final near/far/narrow images, rejected
first visual pass and selection evidence](reviews/slice26/README.md) have been
inspected. Housing reuses culture villages, not ten unique residential models.

The [offline compiler](reviews/hearth-art-compiler.json) validates all516
approvals and preserves exact reverse-order packing. Native geometry/core/CLI
checks pass33/33; focused final development/marker browser scenarios pass7/7.
Whole integration verification and renderer performance are recorded in the
[game status](../IMPLEMENTATION_STATUS.md). Continuous fractional camera zoom,
broad directional animation and biome transitions remain future work.

## Layered fantasy HUD and visible town scale — slice 25

Existing approved town art now fills its tile using exact opaque-pixel support geometry instead of its padded source canvas. All 75 settlement variants retain uncropped, untinted pixels and stable animation-union fitting; village/town/city fill 82%/92%/100% of the inset. Main inspected equal-2.2× stages, all ten paid works, narrow capital view and four six-culture city galleries. Improvements, ruins, armies/fleets and far markers retain their preceding sizes. The 506-asset/569-frame atlas publication is unchanged. [Sizing, screenshots and visual limits](reviews/slice25-hud-and-towns.md).

The map fills the width between top and bottom campaign bars; actual management windows open from floating labelled buttons. Army popups condense to 320 pixels while town popups retain 420 pixels. Three already-reviewed Hearth & Card material WebPs are copied byte-identically into DOM UI, with original approval/hash/license records retained: 68,784 download bytes and 2.0625 MiB potential separate decoding, not new Pixi atlas assets. Main reviewed actual desktop/narrow enlarged-text layouts and retained the rejected float-induced narrow column before correction. [Material provenance](reviews/slice25-hearth-materials.json).

Final Huge rolling frame p95 stays 16.7–16.8 ms at the same saved state; the newly wider/shorter canvas changes the visible workload and maximum chunk backing, so no matched-camera speedup is claimed. Browser checkpoints and corrected follow-ups cover all current scenarios, and the actual built bundle passes 3/3. The three existing headless release gates remain open. [Exact verification, measurements and limits](../performance/0037-layered-hud.md).

## Tile containment and map interaction — slice 24

Existing town, ruin and improvement canvases now fit uniformly inside an inset of their canonical hex, without clipping or tinting approved pixels. Village/town/city caps progress through 26/30/34 world units; armies and fleets retain their original scale. Numerical coverage checks all 75 published settlement variants and retained opaque bounds. Actual retained screenshots show all ten paid improvements, equal 2.2× settlement stages, narrow layout and remembered foreign terrain; far raster overview is distinguished from actual town banners. [Tile review and visual limits](reviews/slice24-tile-footprints.md).

The floating map inspector reuses real paid management controls, with bounded desktop height, narrow enlarged-text/footer checks and side-panel alternatives. Main review corrected overly narrow text buttons and an actual footer overlap. [Map UI review](reviews/slice24-map-management.md). No raster source, approval or atlas was regenerated for this presentation slice. Five advanced works remain procedural identifiers; small far heraldry, fine detail under minification and disabled-card clutter remain polish work.

The final isolated matched Huge sample retains the same campaign hash and transfer bytes, 16.7–16.8 ms rolling frame p95 and unchanged 16 MiB map atlas. Full browser coverage is 117/122 followed by 19/19 corrected scenarios; actual production passes 3/3. These are separate runs, not a single full-suite or universal visual signoff. [Verification and performance evidence](../performance/0036-map-management.md).

## Blender battlefield clips — slice 23 native and scoped gameplay review

Actual project-owned Blender recipes produce five compact effects (melee, projectile, ember, ward, rally) and one modest-detail Waykeeper cast pilot. All are native64²/eight100ms southeast one-shot frames. Spell effects/caster use the actual cast tag, other effects attack. Effects register at32,32; caster feet register32,56 with planted boot pixels across frames. Every accepted source and processed output has main native1x/4x visual review before exact-input approval. The actual factory uses Blender5.2.1LTS, retained keyframed scenes and dependencies, then exact-palette output, Pixel Snapper1.0.0 and Aseprite1.3.18.3-x64. No stock static-facing recipe is misrepresented as animation. [Reproducible production and retained rejections](../../tools/art/blender-battle/README.md).

The source importer verifies bounded paths, retained file hashes, native/raw frames, palette identity and fixed action/pivot contracts. Source import never grants approval. Active brief revision requires an explicit exact-old-hash guard; prior source/import/review folders remain intact. The source pipeline now preserves supplied attack/cast tags rather than forcing idle. Offline focused source/atlas tests pass32/32 and local Blender evidence checks12/12. The full 116-scenario Chromium run passes, including genuine midclip casts, saved field/siege/naval battles and existing galleries; final portrait/target-reveal changes pass17/17, and actual production checks pass2/2. Main review corrected actual sprite/label overlap and narrow footer obstruction. Final isolated battlefield frame p95 is33.4ms on Chromium's actual SwiftShader software backend, leaving optimization and physical-GPU validation open. [Review and limitations](reviews/slice23-battlefield.md), [final measurements](../performance/0035-battlefield.md). Full action/direction coverage and60fps signoff are not implied.

**Preceding slice-22 gate:** all 216 additional original culture assets are individually approved, published and covered by passing 24-culture browser galleries after root original/native/enlarged and actual gameplay review. All 72 hulls have exact native framing/fog/cargo checks; every culture's six land roles, three town stages and strategic heraldry are covered. The full Chromium run passed 109/111; a later 10/10 follow-up corrected two stale contact/selection assertions without changing runtime or time limits. All 111 scenarios therefore have passing evidence across runs, not one 111/111 invocation. Production smoke passes 1/1. Native terrain palette/value differences remain, especially old orange desert and snowy alpine versus new quieter variants. This is not complete animation, every biome combination or game 1.0 signoff.

## Twenty-four distinct faction kits — slice 22

Each new kit has six land formations, three characters, three settlement development stages, three heraldic assets and three naval roles. Twelve cultures add216 selected originals from224 actual built-in image-generation calls; eight rejected originals remain retained rather than silently repaired or approved. Vesper Court uses blood-wine cloth, pale stone, iron and restrained nocturnal court imagery, distinct from the Synod's dry funerary bureaucracy. The other eleven cultures retain their own documented silhouettes, materials and heraldry. These visuals do not grant unimplemented feeding, flight, tunneling or amphibious rules.

Main review examined each full original and its exact processed native1x/enlarged sprite. Real Pixel Snapper/Aseprite preparation, immutable input hashes, editable exports, individual review decisions and selected/rejected provenance are retained. The final Velvet badge revision improves its readable native plumb silhouette; its actual2px cord and14×27px native body are documented, not the unachieved3px prompt target. The independent [216-source/432-binding audit](reviews/slice22-faction-provenance.json) reports no findings and explicitly does not substitute for browser visual review. [Complete kits and approvals](FACTION_ASSET_CATALOG.md).

[Main gameplay review](reviews/slice22-faction-gameplay.md) records all four six-culture land/town and naval galleries, full 24-crest reference, narrow cards and Vesper's real saved/paid economy. [Naval framing counters](../performance/0034-naval-art-inspection.json) preserve all 72 exact bindings, untinted geometry and fog-hidden/carried-unit exclusions. Authored grassland/shallow-water galleries do not demonstrate every possible background. Dark sails and armor rely on lighter edges; fine rigging remains texture, and terrain behind troops remains busy.

The isolated Huge renderer check passes 1/1 with rolling frame p95 16.7–16.8 ms, at most 26 cached chunks/104 MiB estimated backing and one 16 MiB atlas. Packed/total worker bytes remain 1,769,695/1,973,677 in the same authored count/geometry workload; current seal `6effe876` is not the older schema/roster save seal. Warm seven-sample validation, packing/encode and decode medians are 148.745/304.906/74.174 ms, versus 88.960/195.120/59.365 ms for the preceding 284-asset animated pack. More artwork costs additional compiler work and PNG bytes, not a claimed speedup. Process max RSS 609.570 MiB is not GPU residency. [Offline compiler](../performance/0034-art-factions.json), [isolated renderer](../performance/0034-art-render.json).

Whole typecheck/lint/content/build pass; full headless is 1,318/1,321 with zero skips and complete exact-pixel/provenance/uniqueness coverage passing. The two large-map contact targets and Epic parallel timing are separately open in [game status](../IMPLEMENTATION_STATUS.md); no test was disabled or its time limit raised.

## Biome originals and first faction idle — slice 21

Twenty-six actual biome generation calls produced 24 selected originals, with one alpine silhouette and one marsh edge-alpha source rejected and retained. The original base, variant1 and variant2 are distinct authored images, not recolors or random shader noise. Root reviewed every original and all native1x/nearest4x mixed-repeat sheets before individual exact-hash approval. Stable seed/cell/biome selection changes neither saves nor camera-dependent appearance; missing variants fall back only to the original biome. Full geometry, source hashes, alpha/palette processing, real Pixel Snapper/Aseprite exports and all decisions are retained in [source indexes](../../assets/art/source/biome-variants/generation.json) and [review decisions](reviews/slice21-biome-decisions.json). Existing bright bases can still look patchy beside new variants; transitions/seasonal blending are not supplied.

The Ashen scout pilot uses one original four-pose sheet and a second built-in edit to replace its rejected opaque checkerboard with real alpha. Both original prompts/images/hashes remain in [animation provenance](../../assets/art/source/animations/unit.scout.ashen_compact-idle-generation.json). A measured common47/369 scale and four explicit foot anchors preserve source motion at64², pivot32,56, followed by actual Snapper/Aseprite processing. Four250ms southeast idle frames vary cloak/body pixels without walking; old staticv4 remains recoverable. Root inspected all native/enlarged poses and loop order before approval. Fine pixel changes remain visible enlarged; this first pilot is not a complete action/directional or all-faction animation set.

Selected armies/towns now use faction-colored alpha-silhouette contours and at most three fixed glints on a slow4.8-second fade, not a full-hex selection stroke. Original artwork is untinted. Reduced motion/far zoom hold the contour steady; hidden/carried/unselected entities receive no effect. One visible renderer clock can play approved near idle clips for units, towns/ruins and animated improvements; terrain remains static and static props stay cached. The read-only animation inventory separates exact clip/frame coverage from real consumers and future work; differing pixels alone never grant visual approval. Final per-frame gameplay, cache and performance evidence belongs to the following checkpoint.

## Twelve-culture naval publication and quiet overlays — slice 18

Charter transports, Coastwatch galleys and Deepwake warships now each resolve an independent original for all twelve registered cultures in both near-map and recruitment/army UI consumers. Native hull canvases are 96×96 with pivot (48,80), a maximum 78-pixel fitted subject height and one static southeast frame. The three roles distinguish roomy single-square-sail cargo bodies, low triangular-sail oared escorts and twin-square-sail raised fighting decks. Materials and muted sail fields follow the existing faction families; tiny generated sail marks are decorative rather than certified exact crest copies. Static art does not grant new unit rules or animations.

There were 37 actual built-in image-generation calls for 36 selected originals. The first Synod ocean ship had a clipped mast finial and was rejected, not silently cropped or repaired; a second complete generated source replaced it. [Exact prompts and selected sources](../../assets/art/source/faction-expansion/naval/generation.json), [rejected source record](../../assets/art/source/faction-expansion/naval/rejected-sources.json), and [36 main-review decisions](../../assets/art/source/faction-expansion/naval/root-review-decisions.json) retain source paths, hashes and genuine exposed metadata. Model/seed and itemized cost were not exposed and were not invented. Genuine source alpha is normalized during the documented native fitting/palette stage, followed by actual Pixel Snapper and Aseprite processing; each approval retains editable source, export and durable review evidence.

The main reviewer inspected all selected generated images and every processed native/enlarged family before approval. Candidate and approved review commands require a complete selected cohort and strict hashes, and never create approvals. [Complete approved native contact sheet](reviews/slice18-naval-all-1x.png) and its [exact order/hashes](reviews/slice18-naval-all-order.json) supplement the durable per-approval evidence. Actual-water/fog/ownership, missing-variant and 390-pixel troop-card acceptance are separate browser gates, not inferred from these contact sheets.

Map overlays now suppress ambient grid strokes and internal realm ownership lines; range/selection remain contextual, while collision-filtered settlement/selected-army labels are bounded to 32. These presentation changes do not edit canonical terrain or sprite inputs. They reduce overlay clutter but do not produce terrain variation/transition families or eliminate fractional map scaling.

The expanded compiler remains deterministic: warmed median validation 67.34→77.84 ms, packing/PNG encoding 152.91→178.70 ms and decode 52.48→59.50 ms. This is the measured cost of 224→260 assets, not an optimization speedup. [Before](../performance/0025-art-before.json), [after](../performance/0025-art-after.json). The first integrated Huge renderer capture retains 16.7–16.8 ms rolling frame p95, at most 26 cached chunks with 837×711 bounds and 104 MiB estimated cache backing, separate from the 16 MiB map atlas and potential DOM decode. [Measured workload and limits](../performance/0025-ui-navies.md). Five researched-site production sprites, multi-facing/action animation and the proposed twelve additional playable culture kits remain unfinished.

In-game review: [first six cultures](../screenshots/slice18-navies-first-six.png), [regional six](../screenshots/slice18-navies-regional-six.png), [strategic badges](../screenshots/slice18-navies-strategic.png) and [native 96-pixel transport roster](../screenshots/slice18-transport-roster-narrow.png). Both near galleries retain all eighteen complete native hull canvases using real measured camera drags, without shrinking sprites or hiding interface overlays. All 36 exact IDs are untinted, hidden reserves stay absent and a genuinely embarked guard has no duplicate map marker. The all-culture gallery uses authored shallow-water lanes; the separate naval gameplay scenario exercises a real researched Ashen transport voyage through deep water. This is not every culture reviewed against every ocean/biome combination. Dark Mire/Saltwind and iron hulls retain visible pale timber/metal edges and distinct sail shapes, but fine rigging remains texture and repetitive waves/terrain remain busy.

Final integration passes **all 82 Chromium scenarios** (5.6 minutes), full typecheck/lint/content validation and production build. [Exact hull framing/bindings](../performance/0025-naval-art-inspection.json), [overlay/unchanged-state proof](../performance/0025-map-overlays.json), and [final Huge renderer counters](../performance/0025-art-render-final.json) are retained. Main screenshot review includes corrected map perimeters, selected ranges, native ship cards and unobstructed narrow recruitment. The broad automated suite remains 965/966 because of the independent parallel Epic timing gate; its isolated replay/mirror file passes. See [game status](../IMPLEMENTATION_STATUS.md) rather than inferring whole-project signoff from art acceptance.

## Twelve-culture cohort publication

### Slice 17 gameplay additions — no new sprite approvals

The [faction bible](../lore/FACTION_BIBLE.md) documents all twelve registered cultures and twelve explicitly proposed cultures, including distinct ecological/material aesthetics. Those proposed societies are not registered definitions or completed art kits. Slice 17 left the then-published 224 approvals, frame count and atlas pixels unchanged; slice 18 adds the naval batch separately.

Five newly playable researched improvements—Spring garden, Polder, Grove archive, Oreworks and Tide observatory—currently use five distinct bounded code-native map glyphs. Native-size and real-game coverage are retained in the [five-site scene](../screenshots/slice17-five-researched-sites.png); the UI reports a partial pixel pack. These are explicit fallback identifiers, not generated candidates, reviewed sprite approvals or substitute production artwork. The original five improvements retain their existing approved props. Production sprite briefs/generation/processing/approval for the new five and directional/action animation remain outstanding; naval hulls are supplied separately in slice 18.

Mire Courts, Saltwind Remnant, Wardhall Remnant, Rimehorn Clans, Sable Steppe and Morrow Spore add 90 independently generated originals selected from 95 actual built-in image calls: Mire 16, Saltwind/Wardhall 32, Rimehorn/Sable 31 and Morrow 16. These are twelve authored cultures toward the requested twenty-four, not twenty-four completed factions. Repeated campaign seats are not new cultures. [Regional societies, conflicts and material identities](../lore/FACTION_COHORT_12.md) distinguish the additions without rewriting the Book: Saltwind and Wardhall are successors to fallen institutions, not resurrected states.

Every new role uses a separate genuine-alpha source, exact prompt/source hash, explicit unavailable model/seed metadata, role-sized nearest fitting, palette normalization, actual Pixel Snapper 1.0.0 and Aseprite 1.3.18.3-x64 processing. Root inspected all selected processed assets at 1× and 4× before individual exact-hash approval. [All 90 review decisions](../../assets/art/source/faction-expansion/root-review-decisions.json) link the inspected evidence; each approval also retains its byte-identical frame, editable/export files and durable evidence outside ignored caches. Source indexes: [Mire](../../assets/art/source/faction-expansion/miremorrow/generation.json), [Saltwind/Wardhall](../../assets/art/source/faction-expansion/saltward/generation.json), [Rimehorn/Sable](../../assets/art/source/faction-expansion/rimesable/generation.json), [Morrow](../../assets/art/source/faction-expansion/morrow/generation.json). Planned prompt lists are not generation counts.

Five rejected originals remain retained: a left-facing Mire spearman; Saltwind and Wardhall towns whose first native silhouettes reversed the intended village→town progression; a snowy Sable village inconsistent with the dry-steppe direction; and a Morrow badge montage containing multiple subjects. All five selected replacements are version 2 generated originals, not silent mirrors, background erasure or montage crops. The two replacement towns were independently re-reviewed at native size against their village/city stages.

Faction-specific clothing, buildings, names, ecological preferences and paid AI recruitment tendencies do not imply exclusive unit statistics, spell systems, supernatural transport or complete asymmetric rosters. All nine common unit definitions remain shared. The new artwork covers the six land troops, three existing character roles, three settlement presentations and three heraldic roles; fleets still need their own qualified art. Animation beyond the single southeast pose and remaining 1.0 art/gameplay gates are unfinished.

## Twelve-culture integration checkpoint (slice 16, historical)

All 224 asset validations, 802 automated tests, full typecheck/lint, content validation and production build pass. The final corrected Chromium run passes all 71 functional scenarios in 3.9 minutes. Passing functional tests does not close every visual gate. The main reviewer separately inspected all eight retained gallery images at their original 1680-pixel width and accepted definition-based kit bindings, untinted role materials, settlement-stage silhouettes and near/far presentation. Corrected framing keeps the first town clear of the neutral hint/title and retains complete canvas edges; earlier obscured or trial-menu captures are not the accepted gallery evidence.

| Tested cultures | Units and villages | Towns | Cities | Strategic badges/banners |
| --- | --- | --- | --- | --- |
| Original six | [Gallery](../screenshots/slice16-cohort-1-units-villages.png) | [Gallery](../screenshots/slice16-cohort-1-towns.png) | [Gallery](../screenshots/slice16-cohort-1-cities.png) | [Gallery](../screenshots/slice16-cohort-1-strategic.png) |
| Six regional additions | [Gallery](../screenshots/slice16-cohort-2-units-villages.png) | [Gallery](../screenshots/slice16-cohort-2-towns.png) | [Gallery](../screenshots/slice16-cohort-2-cities.png) | [Gallery](../screenshots/slice16-cohort-2-strategic.png) |

Retained narrow presentation evidence: [twelve-culture reference](../screenshots/slice16-twelve-cultures-narrow.png), [faction profile](../screenshots/slice16-faction-profile-narrow.png), and [paid recruitment preferences](../screenshots/slice16-recruitment-preferences-narrow.png). These document the tested content controls, not a blanket acceptance of every narrow menu state.

The [matched compiler measurements](../performance/0022-faction-art.md) record the cost of expanding 134→224 assets: warmed median validation 41.874→65.914 ms, atlas construction/PNG encoding 105.833→155.270 ms, and decode 49.785→55.978 ms. Both packs use one 16 MiB decoded atlas; no optimization speedup is claimed. The [final isolated renderer capture](../performance/0022-art-render-final.json) retains canonical seal `892b6614`, rolling frame p95 16.7–16.8 ms, 267.2 ms art load and 38.9 ms first-render CPU. This is the synthetic fully explored Huge workload with 32 seats, 1,500 global armies and 32 towns, without advancing turns. It draws 1,024–4,096 terrain cells and at most 48 near entity sprites; strategic home aggregates use two heraldic sprites. Maximum cached chunk bounds remain 837×712, with 26 cached chunks / 104 MiB estimated power-of-two backing at the final stage, additional to the map atlas and possible separate DOM decode. Single browser timings, SwiftShader allowance and uncounted texture-pool/GPU allocations limit the conclusions.

Remaining visual issues are explicit: busy repetitive terrain, colliding long army labels in the dense gallery, fractional gameplay pixel fit, one static southeast pose per faction role, and 36 missing qualified naval assets. Separately, narrow-menu screenshots can show a ghost artifact even with normal wheel scrolling while raw canvas captures remain clean; its cause is not established. This unresolved UI defect prevents all-UI visual signoff and is not hidden by the 71 passing functional scenarios. Neither this checkpoint nor the approved static kits complete game 1.0.

## Slice 12 publication checkpoint (historical)

This preceding release published 134 assets / 152 frames / 117 current bindings: 692,034 PNG bytes, SHA-256 `7a22a84c0c4623cea16327af27313e6796560024f38fbafde1491a0afe27ceb7`. Its 1024² attempt explicitly overflowed; the move to 2048² preserved the preceding 97 approved images byte-for-byte. Ashen revisions 1–3 were rejected for missing roles/opaque backgrounds; genuine-alpha revision 4 was selected. Reed/Cinder/Glass use sheet version 1. Reviewed rectangles preserve every visible source pixel; only Glass surveyor/city require exact disconnected-component masks.

The Iron Covenant and Sepulchral Synod add 30 independent static role sources; ash scrub/chalkland and the five canonical improvements add seven. All 37 have individual 1×/4× pixel reviews and exact-hash approvals. Two additional source revisions were rejected and retained: a left-facing Synod cart and a clipped heavy-sentinel helmet ornament. Both received new generated originals rather than a silent mirror/crop. There were 39 actual built-in generation calls; model, seed and itemized cost were not exposed. [Source briefs and constraints](SLICE12_SOURCE_BRIEFS.md).

The main reviewer inspected the [complete native pack](reviews/slice12-all-1x.png), enlarged [Iron kit](reviews/slice12-iron_covenant-4x.png), [Synod kit](reviews/slice12-sepulchral_synod-4x.png), [land assets](reviews/slice12-land-4x.png) and both [ash-scrub](reviews/slice12-terrain.ash_scrub-repeat-4x.png) / [chalkland](reviews/slice12-terrain.chalkland-repeat-4x.png) repeat previews before publication. Each sheet has a companion order JSON with the exact approval input hashes. Repeat masks have no transparent seams; conspicuous single-stamp repetition remains a production limit, not a finished transition/variation family.

All 134 offline pixel checks and durable approval freshness checks pass. The 18 focused faction binding/extraction/published-coverage tests pass, as do publication-stage typecheck and scoped lint. Reversed-input atlas rebuilds are exact. The final integration run passes all 54 Chromium gameplay scenarios, including all six culture bindings, all 12 biomes and all five real improvement props with explicit fallbacks. Final whole-workspace verification also passes all 638 tests across 70 files, full typecheck/lint, content validation and production build. [Implementation status](../IMPLEMENTATION_STATUS.md) records the complete checkpoint; the earlier checkpoints below remain historical evidence.

The main reviewer inspected and retained the corrected fully explored Huge [strategic view](../screenshots/slice12-fully-explored-strategic.png) and [near view](../screenshots/slice12-fully-explored-near.png), [six-culture gallery](../screenshots/slice12-six-cultures-near.png), [territory and improvement map](../screenshots/slice12-territory-and-improvement.png), [five approved improvement props](../screenshots/slice12-five-approved-improvements.png), and [390-pixel worked-land/yield controls](../screenshots/slice12-worked-territory-narrow.png). An empty border Graphics object at world origin had enlarged distant chunk cache bounds and produced black terrain; that defect was corrected and regression-tested before this run. The [rejected black-terrain image](../screenshots/slice12-rejected-empty-border-cache.png) remains evidence of the failed rendering, not an accepted presentation.

The isolated browser run measures rolling frame p95 of 16.7–16.8 ms with one 16 MiB map atlas. Cached chunk bounds stay within 837 × 712 pixels; the measured peak is 26 chunks / 104 MiB estimated power-of-two cache texture allocation. That cache estimate is additional to the map atlas and the separate potential 16 MiB DOM atlas decode, not a 16 MiB total presentation budget. [Raw viewport/LOD measurements](../performance/0016-territory-browser.json) retain the tested camera stages and counters; these synthetic fully explored Huge results do not establish every late-game workload.

## Previous published checkpoint

The final integrated checkpoint passes 458 tests / 52 files, typecheck/lint/content validation/build and all 43 Chromium scenarios (2.3 minutes). The five new art scenarios cover four observed cultures, renamed realm identity, real troop/character UI consumers, hidden enemies/characters, far aggregation and missing-variant fallbacks. Screenshot review identified and corrected a narrow recruitment CSS-cascade defect; final computed-layout, readable-width and unobstructed-card assertions pass with the real sticky footer enabled. [Current game status](../IMPLEMENTATION_STATUS.md) records final gates; this is not game 1.0 or full visual-production signoff.

Slice 7 activates the already-approved spearman, heavy-infantry and cavalry assets through real recruitment/composed-army gameplay and removes oversized hill triangles obscuring approved biome art. Pixel inputs, approval receipts and atlas PNG remain byte-identical. The following original art-factory verification is the slice-6 baseline; current integrated checks are tracked in [implementation status](../IMPLEMENTATION_STATUS.md).

The new repository skills were installed alongside the original pixel-art references; all eight pass structural validation. They required genuine native/enlarged and in-game review, explicit provenance, actual tool runs, and measured renderer integration. The original detached-tablet revenant and an attempted checkerboard alpha correction were rejected; version-2 revenant and corrected 4× Pixel Snapper processing were reviewed before publication.

## Foundation environment and gate evidence (historical)

| Gate | Exercised evidence / limits |
|---|---|
| A — tooling | Existing Steam Aseprite 1.3.18.3-x64 auto-discovered and batch-tested. Pixel Snapper 1.0.0 pinned/project-local. Doctor reports actual tools, directories, palette, credential presence and hardware without secrets. Provider contracts tested; external services are not configured. |
| B — palette | Machine-readable original 64-color / 16-material-ramp master palette, visible in Art Lab and used in exact validation/native processing. |
| C — generation | Session built-in generation actually produced four original sheets plus revised revenant; exact prompts/source hashes retained. Model/seed/cost unavailable, not invented. Source CLI reprocessing is not a fake AI call; other live-provider bake-offs need configuration. |
| D — processing | Real fixed-4-pixel Snapper pass after nearest 4× enlargement, native canvas/palette/alpha normalization, editable Aseprite construction and lossless tagged/timed export. Repeated native-tool PNG exports are byte-identical. |
| E — validation | Strict PNG CRC/chunk/inflation/dimension checks, palette/alpha/grid/canvas, indices/timing/motion/pivots, terrain hex-mask coverage, bounded paths/cache receipts and exact-input review hashes. Anatomy, identity and convincing terrain continuity require visual judgment. |
| F — Art Lab | Browse/search, native 1/2/4/8×, backgrounds, alpha/pivot/bounds/palette metrics, clips/step/play, manifest/report/provenance, atlas rectangles and terrain repeat. Four real browser scenarios verify operation, responsive layout, input-hash stability and bad-image failures. DEV-only, omitted from production. |
| G — atlas | Approved-only 37/55 pack, 2-pixel extrusion plus 2-pixel clear gutters, no trim/rotation, exact anchors/clips. Reversed-input compiler and real published pixels match hashes. Pixi loads the approved atlas; malformed/missing packs fail visibly into playable procedural fallback. Automatic multi-page grouping remains future scale work. |
| H — foundation coverage | **Partial in gameplay:** core existing terrain/settlements/units/ruins integrated. Future roster/monsters/resources/roads/rivers/effects inspected in Lab, not fabricated as new canonical systems. Full faction families, directional states and terrain variation/transitions are unfinished. |
| I — in-game review | Deterministic generated and imported frontier views inspected, including native animation, city overhang/ownership, fog/ranges, near/far LOD and 390-pixel Lab. Weak revenant corrected; redundant Alpine mountain glyph suppressed. Repeated terrain stamps and limited biome contrast are documented production issues. |
| J — provenance | Durable source prompts/hashes, actual tool versions/profiles/settings hashes, validation reports and exact review evidence; rejected revisions retained separately. [Tool/source/license inventory](TOOLCHAIN_PROVENANCE.md) distinguishes original assets, software licenses and unverified provider/model rights. |
| K — continuous production | Existing registered one-facing/one-clip assets can be reprocessed, validated, reviewed/rejected, atlased and published with the documented commands. Session tool supplies new original AI sources; optional Node provider adapters require operator configuration. Multi-state/directional source compilation and broader autonomous provider production remain incomplete. |

RTX 4080 with 16,376 MiB VRAM, 31,774 MiB RAM and i9-13900K were verified. No ComfyUI workflow/models or external provider credentials are configured; no paid-provider quality comparison or rights guarantee is claimed. Local Rust/Cargo was used only for the ignored Snapper build; Steam files/global shell configuration were not modified.

## Foundation verification (historical)

Full typecheck, lint, frozen offline install, content validation, production build and **311 tests / 33 files pass**. All **25 Chromium gameplay scenarios pass** (about 1.2 minutes), including existing movement queues, actual foreign interruption, combat, conquest, diplomacy, saved continuation, AI-watch victory and downloaded technical-log replay. Production contains approved PNG/catalog metadata but no Art Lab catalog/code or debug hook. Zod comment and large-main-chunk build warnings remain non-fatal.

Native processing verification uses four distinct frames and checks real tags, 250 ms timing, repeated Aseprite export and Snapper equality. Offline compilation validates all 37 retained approvals and rebuilds the 55-frame atlas identically: warmed median 14.96 ms validation / 33.05 ms packing+encode / 10.96 ms PNG decode. The 1,000-frame candidate stress validation median is 96.76 ms; it does not invent additional approved artwork.

Fully explored Huge (196,608 cells, synthetic 1,500 global armies / 32 towns) renders 1,024–2,304 chunk cells in tested camera positions, 48 visible entities / 47 near idle animations, 9–16 cached chunks and one 4 MiB atlas. Rolling frame p95 is 16.8 ms in this Chromium configuration; initial full observation is 13.36 MB and first art render is 34.9 ms. These costs and fixture restrictions are explicit, not hidden behind a fog-limited startup test. [Full measurements](../performance/0006-art-factory.md).

The original art-only slice did not change simulation/content/save/archive versions. Slice 7 separately introduces army schema 6 and new troop content, with old archive compatibility tests; its presentation changes still do not alter canonical rules or hashes.

## Slice 7 integration verification

The slice-7 integration passed **367 tests / 41 files and all 32 Chromium gameplay scenarios**, full typecheck/lint, content validation and production build. The three newly live troop sprites appear through real observed entities; tests also cover every biome, compact physical hill relief and explicit missing-art fallback. Atlas pixels remained unchanged at that checkpoint: 217,073 PNG bytes, SHA-256 `8886caf97516bcdb12971b4e861a1c842b3766df2c1f0abc5938437805388982`.

The final fully explored Huge repeat retains one 4 MiB atlas, 9–16 cached chunks and 1,024–2,304 drawn terrain cells. Rolling frame p95 is 16.7–16.8 ms; 48 visible entities / 47 near idle animations; first art render 32.5 ms, initial observation 13,371,207 bytes. Camera motion leaves canonical hash `fbf52e40` unchanged. These are synthetic renderer measurements, not proof of late-game strategy or 1,000-turn giant archives. [Current workload measurements](../performance/0007-contact-and-armies.md).

Reviewed and retained: [all biome art and hill relief](screenshots/slice7-biomes.png), [recorded-seed contact at turn 30](screenshots/slice7-contact.png), [mixed roster](screenshots/slice7-mixed-army.png), [actual formation battle](screenshots/slice7-mixed-battle.png), [390-pixel split controls](screenshots/slice7-army-narrow.png), [390-pixel transfer controls](screenshots/slice7-transfer-narrow.png), [fully explored Huge near sprites](screenshots/slice7-huge-near.png). The narrow screenshots use the real viewport and sticky turn bar; tests click Split and Transfer successfully. Repetition, fractional terrain fit and missing directional/animation coverage remain explicit production limits.

## Slice 10 integration verification

All 60 faction variants are approved and placed across actual map/UI consumers; all 97 retained approvals validate. Native source/processed reviews, individual seals and previous metadata-only approvals are indexed in [durable review evidence](reviews/faction-base-kits.json). None of the rejected Ashen sheets is a runtime source.

Final in-game screenshots were inspected and retained: [all four cultures near](screenshots/slice10-cultures-near.png), [strategic badges and banners](screenshots/slice10-cultures-far.png), [390-pixel public crests](screenshots/slice10-public-cultures-narrow.png), [readable narrow recruitment](screenshots/slice10-recruitment-narrow.png), and [native character controls](screenshots/slice10-character-narrow.png). Narrow recruitment uses one readable column; every public culture card is tested clear of the real footer. The dense synthetic gallery still exposes noisy terrain and label overlap; it is coverage evidence, not a final composition-quality claim.

The isolated final Huge renderer fixture retains 1,024–2,304 drawn terrain cells, 9–16 cached chunks and one 4 MiB map page. Rolling frame p95 is 16.7–16.8 ms with static faction poses; first art render CPU is 26.6 ms, pack load 282.1 ms and initial world observation 13,375,621 bytes. Camera interaction preserves canonical hash `727da879`. Far home view represents 48 observed entities with one army badge and one town banner. This does not measure full animation, saturated caches or late-game turns. [Final measurements, raw data and build limits](../performance/0010-faction-art.md).

## Review evidence and next production work

[Native animation](screenshots/art-lab-native-animation.png), [atlas rectangles](screenshots/art-lab-atlas-rectangles.png), [terrain repetition](screenshots/art-lab-terrain-repeat.png), [390-pixel Lab](screenshots/art-lab-narrow.png), [guard/city frontier](screenshots/art-guard-city-frontier.png), [fully explored near](screenshots/fully-explored-near.png), [fully explored far](screenshots/fully-explored-strategic.png). Exact native/enlarged approval evidence also remains under assets/art/reviews and is referenced by each manifest.

All twelve current cultures now have individually approved static land/naval kits and the corrected in-game gallery/renderer checkpoints above. Remaining production includes authentic directional/action animation, five researched-improvement pixel props, less repetitive biome/shore/road transitions, and the remaining distinct cultures toward twenty-four. The independent narrow-menu painting defect remains open. A measured camera contract is still needed if true integer-pixel gameplay is required. The current map deliberately retains its regular hex topology and exposes fractional sprite fit; native Lab views alone are pixel-perfect. Collision-filtered contextual names now reduce the dense-label problem; high-frequency terrain stamps remain a visible readability limit. Future assets never imply new gameplay. Full provider-specific generation/identity bake-offs require configured capabilities and verified rights, not assumptions.
