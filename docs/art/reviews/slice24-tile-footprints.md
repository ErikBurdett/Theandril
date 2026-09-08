# Slice 24 — tile-footprint visual review

Reviewed 2026-09-07 from the passing targeted Chromium run. This is a review of map presentation using existing approved pixels, not a new asset approval or a claim that every culture/background combination has been visually reviewed.

## Evidence and scope

The coordinated `map-actions.spec.ts` + `tile-footprints.spec.ts` run passed **6/6 in 17.3 seconds**, as reported by the integrating agent. The two footprint scenarios cover a real save import, camera drags/zoom, entity selection, far markers, world overview, a 390px viewport and remembered foreign terrain. The broader browser run was still in progress when this review was written; no full-suite result is implied here.

The [fixture](../../../packages/test-fixtures/src/tile-footprints.ts) is explicitly authored: seed 17, generator 4, Tiny 48×32, two factions, selected Ashen Compact; terrain, resources, reconnaissance setup and stage populations are controlled. All ten improvements are bought and completed through ordinary simulation commands before strict save/load. Populations 8, 4 and 1 exercise city/capital, town and village/camp. This is not evidence that a campaign earned these populations, treasury or technologies.

The [browser regression](../../../tests/gameplay/tile-footprints.spec.ts) checks unchanged campaign hash across camera/selection operations, exact approved town/banner bindings, untinted sprites, all ten improvement presentations, selected-art contours, no new idle chunk rebuild across the sampled frames, and no later foreign construction leaking into previously scouted empty terrain. The authored foreign city is absent from live entity art. Separate focused checks passed 25 tests, whole typecheck and scoped lint before the targeted rerun.

## Actual screenshot observations

All links below point to the exact inspected targeted-run captures, retained by the integrating agent in `docs/art/reviews/slice24/` under their original basenames. These review copies are independent of disposable test output.

| Capture | Observed result |
| --- | --- |
| [All ten works and three stages](./slice24/all-ten-works-and-three-town-stages.png) | At initial 1× camera zoom, each work is confined to its own cell. The city is a compact dense miniature, with town and camp smaller. The nearby escort remains at its prior army scale. No building fills an adjacent tile or covers another settlement. |
| [Capital, 2.2×](./slice24/inset-capital-near.png) | The taller, denser city silhouette and separate crown remain recognizable. Roofs and walls fit inside the central hex; the selected contour follows the artwork rather than a large entity hex ring. Neighboring works remain distinct. |
| [Town, 2.2×](./slice24/inset-town-near.png) | A broader developed building cluster than the camp, but shorter and less dense than the capital. The horizontal line entering from the left is a separately rendered road, not an extended building canvas. The full town silhouette is retained. |
| [Camp, 2.2×](./slice24/inset-camp-near.png) | The smallest stage reads as a low, compact group. Its label and ownership tick are separate; no roof or wall is clipped. This uses the same camera magnification as the town and capital, not progressively different zooms. |
| [Three far markers](./slice24/three-town-far-markers.png) | At approximately 0.577×, approved Ashen banners replace all three buildings and remain contained. The test verifies every binding. Visually they are very small and blend into this warm terrain; this is **not** sufficient evidence of legible heraldic detail at far zoom. Only the selected camp retains its label here. |
| [Capital and works at 390px](./slice24/capital-and-works-390.png) | The 2.2× capital, crown, contour and label remain visible. No horizontal document overflow was detected. The lower map controls cover parts of neighboring works; this is not an unobstructed ten-improvement overview on a narrow display. |
| [Remembered foreign field](./slice24/remembered-field-no-hidden-work.png) | Dim remembered terrain and a selected empty hex are visible. Neither the later foreign field improvement nor the hidden foreign city appears. The memory test checks both the read-only terrain diagnostic and entity/footprint lists. |

## Containment contract

[Tile fitting](../../../packages/render/src/tile-footprint.ts) uniformly scales and positions the entire declared canvas inside an inset of the unchanged pointy hex (radius 29, inset 2). It does not crop textures, alter pivots in approved metadata, tint bodies, change canonical cells, or shrink armies. Non-square canvases use the actual inset-hex constraints. Current full-canvas size caps are village 26, town 30, city 34, improvement 30 and ruin 28 world units; opaque bodies are smaller where the native canvas contains transparent padding.

The [geometry regression](../../../packages/render/src/tile-footprint.test.ts) checks all 75 published settlement variants, the five approved improvement assets and the ruin against their retained validation bounds, plus all ten improvement mappings and procedural stroke envelopes. This is numerical coverage of the existing variants, not visual coverage of all 24 cultures.

Five works use approved artwork: terraced fields, managed woodlot, quarry, reedworks and shore fishery. Spring garden, polder, grove archive, oreworks and tide observatory still use distinct bounded code-native glyphs. Their high-contrast icon treatment is visibly different from the bitmap buildings. The runtime correctly says **partial pixel pack**; this review does not promote those glyphs to finished art.

## Limitations and follow-up

- Full-canvas fitting trades fine architectural detail for honest cell containment. At 1×, buildings are miniatures; near zoom is needed to distinguish smaller roofs and materials. The existing art was not repainted for this smaller display footprint.
- Far marker visibility deserves a dedicated later readability pass. Exact binding and containment do not establish easy identification against all terrain palettes.
- The authored improvement cluster uses intentionally varied adjacent terrain for complete coverage; its busy mix of hill cues, textures and procedural icons is not evidence that every ordinary landscape is visually cohesive.
- The narrow view demonstrates a usable selected capital, not simultaneous visibility of every work. Camera movement or management-panel controls remain necessary to inspect obscured neighbors.
- World overview deliberately omits entity art. The diagnostic now reports `world-overview` separately from `strategic-glyphs`; the regression tests both modes rather than mistaking raster omission for missing far markers.
- The pre-change named rendering baseline passed, but these screenshots are not a performance benchmark. No post-change frame-time improvement, full-suite success or release-gate closure is claimed in this review.

Review outcome: the observed near-zoom placement and stage progression meet the bounded containment goal without clipped or tinted assets. Far-marker readability, complete artwork for the five procedural works, and broad culture/background visual coverage remain limited as described above.
