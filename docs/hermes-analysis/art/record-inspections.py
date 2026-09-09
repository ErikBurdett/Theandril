"""Retain actual inspection scope; this is not a visual-approval writer."""
from pathlib import Path
import hashlib, json
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
inventory=json.loads((OUT/'inventory.json').read_text())
notes={
 'guards-all-1x':'All 24 guard poses inspected at native size. Shield/head/cloth silhouettes vary by culture; brighter bone/brass accents carry much of their thumbnail identity. Thin weapons and dark boots need real-background review.',
 'guards-first12-4x':'Inspected enlarged native pixels. Ashen square buckler, Reed oval/reed gear, Cinder angular rust plate, Glass pale/slate equipment and the narrower Mire/warmer Morrow forms are not simple global palette swaps. Fine speckled armor/cloth detail is less decisive than broad silhouette and value.',
 'guards-last12-4x':'Inspected enlarged native pixels. Pale Cistern and Brine equipment contrasts with dark Unsealed/Vesper and compact Underhush. Narrow blades and lower limbs lose contrast on the dark sheet; keep small faction accents subordinate to material groups.',
 'cities-all-1x':'All 24 city silhouettes inspected at native128. The original four are compact blockier groups; later circular/terraced/canalled courts have dense high-view roof patterns. Mire is comparatively low-contrast. Distinct settlement material identities should be retained; this does not verify all village-to-town progressions.',
 'culture-crossroles-1x':'Six cultures x six roles inspected: scouts, spearmen, cavalry, villages, crests and transports. Complete horse/hull/building masses read better than fine weapons/rigging; later pale civic compositions differ from darker old factions. Only this cross-role sample, not all432 faction assets.',
 'biomes-all-1x':'All 36 engine-bound biome tiles inspected at native64. Base/variant changes can be stronger than within-biome variation, notably pale/green/snowy and wave highlights. No adjacency or seam acceptance follows from a separated sheet.',
 'biomes-desert-grassland-alpine-4x':'Explicitly inspected original plus two variants for desert, grassland, alpine. Orange desert base versus muted sand, bright foliage highlights in the grass base versus quieter fields, and larger high-contrast snowy alpine peaks versus lower rocky variants are visible cohesion risks.',
 'works-all-1x':'All31 current civic/improvement/deposit props inspected at native64. Low agricultural plots, industrial timber frames, archive masonry and raw deposits are distinguishable. This is existing complete coverage, not31 missing assets; small crop/ore details can become noise under map minification.',
 'works-sample-4x':'Iron/deposit-mine and grain/grange pairs, archive and observatory enlarged. Warm structural timber and cool rock/water retain setting coherence. Building masses and the water pool read; fine scattered edge/vegetation pixels need measured in-game scale rather than more detail.',
 'battle-roles-1x':'All13 shared battle first poses inspected. Foot figures are much narrower and plainer than strategic culture figures; helmets/torso/limb rods and edge-on equipment make some guard/polearm roles hard to distinguish at native size. Riders, long shafts and hulls separate more clearly.',
 'battle-roles-4x':'All13 shared battle first poses inspected; vision transport downscaled2040x1260 to1020x630 (effective2x, not exact4x). Geometry is simplified, with flatter material areas and minimal character-face/cloth detail versus the strategic family.',
 'battle-guard-actions-1x':'All24 east walk/attack/death frames viewed at native size. Relative leg and weapon changes and a falling terminal silhouette are visible; not a translated still. A contact sheet does not prove foot-contact timing or seamless loop playback.',
 'battle-guard-walk-4x':'Whole8-pose sheet loaded with transport downscale, then exact4x top-left816x420 crop inspected (two poses). Narrow body/limb masses and an almost edge-on shield deserve role-read refinement without discarding the real articulation.',
 'battle-cavalry-actions-1x':'All24 east walk/attack/death frames viewed. Hooves and weapon change relative to horse/rider; later death frames lower and rotate the mounted form. Dense strategic horse anatomy is not reproduced by this simple battle model; motion timing not played.',
 'battle-transport-actions-1x':'All24 east sail/fire/sink frames viewed. Oar/sail/equipment and waterline silhouette changes are visible; transport is far simpler than the elaborate culture hulls. This is not a loop or every-direction approval.'
}
sheets=[]
for sheet in inventory['contactSheets']:
 name=Path(sheet['path']).stem
 if name in notes:
  sheets.append({**sheet,'inspection':'Actually opened with vision_analyze in this audit','observations':notes[name]})
extras=[
 ('docs/art/reviews/battle-units/runtime/land/roles-deployment.png','Retained historical runtime capture, freshly inspected, not freshly executed. Dense small soldier formations read as repeated pin-like marks with cultural flags above; low-detail battlefield backdrop is restrained, while individual native identity needs detail zoom.'),
 ('docs/art/reviews/battle-units/runtime/camera/soldiers-focused-4x-390.png','Retained historical narrow detail view, freshly inspected. Large repeated soldiers expose simple pale helmets/wood-dark equipment and tubular limbs; the existing controls make magnification possible but cannot add missing silhouette/material authorship.'),
 ('docs/art/reviews/slice27/generated-grain-deposit.png','Retained historical map capture, freshly inspected. Gold/brown wood UI and parchment fields fit the setting. Bright detailed biomes create a patchwork around small objects; this is not a new map-session or all-zoom review.'),
 ('docs/hermes-analysis/ui/24-waykeeper-appointment.png','Fresh parent gameplay evidence, actually opened by this subagent. Edrin Coalstead 2, Waykeeper, has a pawn icon labelled Generic in both roster row and selected character sheet; known working is Cinder thread. Parent supplied Small/12 Continents seed20260909 Ashen turn20 after paid research and appointment. Not the subagent running this scenario.'),
 ('/home/telephoneheater/Projects/BlenderArtFactory/published/theandril-pixel-2d/shrine/666c60afc1e165eb34fa8ebf5ac789ef384bc773407daf3b6af021db91f4192c/previews/contact-sheet.png','Actual stock shrine study inspected; vision transport downscaled2364x1188 to1182x594. Eight static orientations of a geometric stone/flame assembly, not animation. Broad cubic masses contrast with the denser organic/architectural game sprites; stock output is reference, not a native game import.')
]
other=[]
for path,note in extras:
 p=Path(path) if path.startswith('/') else ROOT/path
 other.append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'inspection':'Actually opened with vision_analyze','observations':note})
seen_assets={e['assetId'] for s in sheets for e in s['entries']}
seen_frames={e['frameId'] for s in sheets for e in s['entries']}
summary={'auditContactSheetsProduced':len(inventory['contactSheets']),'auditContactSheetsActuallyOpened':len(sheets),'uniqueApprovedAssetSubjectsInOpenedSheets':len(seen_assets),'uniqueApprovedFramesInOpenedSheets':len(seen_frames),'additionalImagesActuallyOpened':len(other),'limits':'Representative current pixel inspection; no new visual approval, no full432-family/all1427-frame review, no animation playback or complete light/dark/game-background matrix, no fresh gameplay run by this subagent. Retained runtime screenshots remain historical; parent Waykeeper evidence is separately attributed.'}
result={'schemaVersion':1,'basisCatalogSha256':inventory['catalogSha256'],'summary':summary,'auditSheets':sheets,'otherImages':other,'unopenedAuditSheets':[s['path'] for s in inventory['contactSheets'] if Path(s['path']).stem not in notes]}
(OUT/'evidence/visual-observations.json').write_text(json.dumps(result,indent=2)+'\n')
inventory['visualInspectionSummary']=summary
inventory['consumerAuditFindings']=[{'id':'WAYKEEPER-UI-BINDING','priority':'P1','finding':'Live allowlist completeness does not imply individual UI consumers resolve every asset. FactionArt rejects unregistered character.waykeeper before trying its already published shared sprite; current paid gameplay shows Generic pawn.','evidence':'docs/hermes-analysis/ui/24-waykeeper-appointment.png','code':['apps/web/src/faction-art.tsx:68-82','packages/art-pipeline/src/faction-art.ts:8-18'],'missingNewAssetsForImmediateBindingFix':0,'optionalDedicatedIdlePortrait':1}]
(OUT/'inventory.json').write_text(json.dumps(inventory,indent=2)+'\n')
print(json.dumps(summary,indent=2))
