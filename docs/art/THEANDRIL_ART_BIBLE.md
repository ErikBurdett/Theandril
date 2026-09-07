# Theandril visual bible

Production direction for the original setting; read alongside [native asset standards](../../ART_STYLE_STANDARD.md), the repository pixel-art skill and [measured implementation status](ART_IMPLEMENTATION_STATUS.md). These standards describe intended assets, not proof that every animation or gameplay system exists.

## Mood and readability

Weathered dark fantasy inhabited by practical people: repaired iron, linen, timber, stone and deliberate traces of fire. Use adult proportions and clear equipment silhouettes. Grim does not mean uniformly black: keep readable medium-value bodies and reserve the deepest local-color outlines for separation. Light comes softly from upper left. Avoid glossy gradients, antialiasing, random single-pixel noise, enormous heads and symbols or costumes copied from other games.

The original `theandril-master-v1` palette has 64 colors in material ramps. Native runtime sprites use that exact palette and hard alpha. Generation supplies source designs; explicit geometric extraction, nearest fitting, palette normalization, real Pixel Snapper processing and editable Aseprite export produce candidates. Machine-valid pixels still require native/enlarged visual review and actual gameplay inspection.

## Authored cultures

Generated campaign seats inherit their actual stable faction definition. Player-edited realm names, numeric seat IDs and owner colors must never determine art identity. There are twelve authored cultures, not twenty-four; repeated seats are not distinct cultural production. The original six directions below remain unchanged. The six additions follow the [regional cohort lore](../lore/FACTION_COHORT_12.md), including the Saltwind and Wardhall successor identities rather than undoing the Book's fallen institutions.

| Culture | Materials and silhouette | Original heraldry |
| --- | --- | --- |
| Ashen Compact | Repaired charcoal iron, ochre/bone cloth, dull brass, square bucklers, aprons, patched cloaks, kiln-brick chimneys and low gabled workshops | Open square hearth with central ember diamond |
| Reedbound Council | Woven oval shields, weathered green cloth, reed/straw roofs, raised timber dwellings and river-working equipment | Three upright reeds within an open oval |
| Cinder March | Broad angular iron, rust-red cloth, squared shields, stepped masonry, practical watchtowers and forge hearths | Stepped watch-wall around a single ember |
| Glass Tide | Slate-blue and salt-linen cloth, curved shields, light stone, rigging details, blue gables and beacon towers | Hollow sail diamond above two broad horizontal bars |
| Iron Covenant | Anvilheights deep-folk and human craft valleys; blue-black riveted iron, dull brass, charcoal leather, broad infantry, squared stone workshops and sealed forge halls | Split anvil with broad top, narrow divided stem and block base |
| Sepulchral Synod | Living veiled caretakers and housed ancestors; chalk-pale plates, indigo cloth, aged bronze, narrow guardians and terraced limestone halls | Hollow ring above three broad terrace steps |
| Mire Courts | Deepfen elder fenfolk; lean adult figures, woven bark lamellar, moss leather, plum cloth, copper bindings and long leaf shields; rootwood halls with swept leaf roofs | Forked root |
| Saltwind Remnant | Maritime charter households and crews; tarred leather, petrol sailcloth, auburn canvas, practical brass rigging and guarded quay halls; distinct from Glass Tide's blue stone/beacons | Broken keel |
| Wardhall Remnant | Human reconstruction work halls; slate-violet cloth, chalk masonry, straight black iron, kite shields and squared workshops; not a resurrected Null Throne | Open square |
| Rimehorn Clans | Human and giantkin shelter households; broad adult proportions, dusky blue, grey fur, weathered ivory and restrained bone fittings; stone winter lodges with snow-support beams, not giant horned helmets | Crossed shelter beams |
| Sable Steppe | Mixed human camp assemblies; rust felt, dull ochre, indigo bindings and dark lamellar; lean horses, dry yurt clusters, tension-roof halls and camp-derived walled enclosures | Three wind notches |
| Morrow Spore | Human and fungal-symbiont underwood households; umber layered carapace, dusty mauve and pale lichen seams; grown timber ribs and broad shelf roofs, not whimsical mushroom figures | Hollow crescent cradling three seeds |

Identity belongs in equipment, buildings and heraldry, not a whole-body tint that recolors skin and steel. Separate ownership outlines, selection rings, faction labels and accessible UI remain authoritative interaction cues. Public culture reference cards reveal no campaign locations or armies.

## Static culture kits

Each of the twelve authored cultures has six land-troop roles, three naval hulls, three real character roles, three settlement-stage presentations, crest, banner and badge: **18 individually approved assets per culture / 216 qualified assets**. The historical land/UI kit remains 15 roles; its original sheet mappings are not expanded or reinterpreted to supply ships. The [Covenant/Synod briefs](SLICE12_SOURCE_BRIEFS.md), all six regional land additions and all 36 naval assets use separate original calls per role. All faction frames are static southeast poses, not complete animation sets. The 260-asset/278-frame publication contains those 216 roles and 44 shared assets on one 2048² atlas. Earlier corrected land galleries and current naval integration gates remain distinct in [art status](ART_IMPLEMENTATION_STATUS.md). Native/enlarged approval and the tested naval runtime scope are accepted: all 36 full hulls in shallow-water galleries, exact untinted bindings, fog, strategic badges and native narrow roster, with a separate actual deep-water transport scenario. This is not every culture/biome/action combination or overall UI signoff. Future roster art must remain marked as future until a canonical consumer exists.

Visual identity must support the societies' practical equipment, different construction traditions and public heraldry without claiming unimplemented mechanics. The current shared troop roster and actual marshal/surveyor/engineer rules remain authoritative. Mire spiritual traditions, Wardhall anti-magic heritage and Morrow symbiosis are not permission to depict an existing spell, immunity or automatic expansion mechanic that the simulation does not implement.

| Asset role | Native canvas | Anchor |
| --- | --- | --- |
| Colonist, scout, guard, spearman, heavy infantry; marshal, surveyor, engineer | 64×64 | Ground `(32,56)` |
| Cavalry; village and town | 96×96 | Ground `(48,80)` |
| Transport, coastal warship, ocean warship | 96×96 | Hull/waterline `(48,80)` |
| City | 128×128 | Ground `(64,112)` |
| Crest | 64×64 | Center `(32,32)` |
| Banner, including pole foot | 64×64 | Ground `(32,56)` |
| Strategic badge | 32×32 | Center `(16,16)` |

Humanoid strategic figures may use approximately 50 painted pixels of height for readability; this is the foundation's explicit exception to the proposed smaller body target. Wider civilians/carts and full long spears fit by whole-silhouette scale rather than stretching anatomy. Pullers remain on the cart's screen-right side and cavalry faces screen right, with the entire horse and equipment retained. Keep tips, poles, hooves and buildings enclosed in transparent native padding. Settlement progression must read as increasing building mass/organization at native size; a tall flag must not shrink a town below its village. The Saltwind/Wardhall town version-2 sources explicitly corrected that failed progression. Sable roofs remain dry; snow belongs to the Rimehorn winter direction, not a generic stamp for every culture.

Source sheets are not guaranteed to honor their requested grid: source-hash-bound, visually reviewed explicit rectangles are preferable to silently cutting off parts or including a neighbor. New cohort roles use individual sources, not sheet crops or recolored old roles. Never erase a painted background by treating a visible checkerboard as transparency, crop a multi-subject montage into a claimed original single-role generation, or mirror asymmetric equipment without an explicit reviewed revision.

### Naval silhouettes

The naval set uses the same twelve practical material/heraldry traditions, without changing the shared transport and combat rules. Distinguish a broad cargo-bearing transport from a lean, single triangular-sail coastal warship and a heavier two-mast ocean warship. Hulls face southeast/screen-right with complete prows, oars, mast finials and rigging inside transparent padding. The native fitter preserves the entire silhouette, at most 78 painted pixels high; taller source perspectives may produce narrower hulls. Inspect that relative size at 1× rather than assuming a larger unit's source canvas guarantees a larger painted ship.

Each hull has its own retained original, exact prompt and unavailable model/seed metadata in the [naval index](../../assets/art/source/faction-expansion/naval/generation.json). There are 36 selected originals and one retained clipped-source rejection, not 37 additional approved designs. Palette-normalized binary alpha does not prove readability: dark iron/wood hulls and fine rigging need inspection against actual shallow/deep water as well as native/enlarged checkerboards. Do not brighten a whole culture through owner tint or silently erase a source edge defect. Near maps and real naval roster/recruitment controls use the correct qualified hull; far maps use that culture's existing badge. Missing or failed hull loads remain explicit ship-shaped procedural fallbacks, never another culture's ship or an infantry icon. Carried armies must not gain duplicate map sprites.

The current naval frame is static `idle/se/0`, 250 ms, non-looping. Sailing, oar cycles, attacks, sinking, wakes and other facings are not implemented by repeating this pose. A functioning naval battle is not evidence that those animations exist.

## Animation, terrain and integration

Keep original source, revision/rejection reasons, exact prompt, unavailable model/seed fields, extraction bounds, processing hashes, Aseprite tags/timings and individual review evidence. New pixels invalidate review. Do not invent animation by repeating one frame or mirror asymmetric weapons/heraldry without explicit review. Future walk/attack/hurt/death and additional facings retain the same canvas, anchors and directional conventions; review each clip's actual motion.

The twelve biome tiles use 64×64 native hex masks, including flat ash scrub and chalkland. Five approved land-improvement props use 64×64 transparent canvases, `(32,48)` ground anchors and exact half-native presentation where possible. The five later researched sites—spring garden, polder, grove archive, oreworks and tide observatory—currently use distinct procedural glyphs; their approved pixel props remain production work. Terrain variations, shore/river/road junctions and transition families remain separate work too. Buildings may deliberately overhang a hex; their ground anchors, ownership cues and selection hit regions must remain stable. Art never alters topology or canonical movement rules.

UI icons use native or exact half-size nearest-neighbor sampling. Art Lab uses integer 1/2/4/8× previews. The current world camera still fits art fractionally to its regular hex geometry: do not call it pixel-perfect. Far view groups actual observed armies into small faction badges and uses town banners; hidden enemies must never acquire render objects. Measure viewport/chunk pools and map atlas residency separately from the DOM's verified image cache. Publication is approved-only; missing assets retain explicit playable fallbacks.
