# Slice 12 source briefs and review boundary

This batch commissions new original raster sources for two additional authored cultures, two biome stamps and five canonical land improvements. It does not modify the preceding 97 approved assets, and source/candidate approval is not atlas publication or gameplay acceptance.

## Canon and visual decisions

The Iron Covenant follows the Anvilheights deep-folk holds and human craft valleys described in Book IV, with the Kiln faith expressed through practical masonry, riveted iron and disciplined workmanship. Blue-black metal, dull brass, charcoal leather and muted gold belong to different material planes. Broad deep-folk infantry contrast with human valley scouts and mounted outriders. Architecture uses squared stone, sealed lintels and compact forge chimneys. Its original split-anvil seal is a geometric motif, not readable runic lettering.

The Sepulchral Synod follows Book IV's southern chalklands, bone terraces and housed dead. Living caretakers retain veiled faces and practical tools; heavy sentinels may be fully enclosed ancestral armor, without exposed remains or spectacle. Chalk-pale plates, indigo cloth and aged bronze separate its values and silhouettes from the Covenant. Settlements ascend in terraces; a hollow ring over three steps forms original heraldry. The kit does not claim implemented necromantic mechanics or disclose any hidden world entities.

Books IX and X place these inherited identities in a rebuilt, contested present. Neither kit reproduces another game's dwarf or undead faction. Art communicates culture; simulation definitions remain authoritative about current people, units, abilities and mechanics.

Each culture receives six existing land-unit roles, the three actual field-officer roles, three settlement-size presentations and crest/banner/badge: 15 independent static assets. They use the existing [native canvas and ground-anchor contracts](THEANDRIL_ART_BIBLE.md#first-complete-culture-kit). One facing and one idle frame are not a walk cycle, combat animation or complete directional release. Naval hull artwork is outside this batch.

The biome IDs are `terrain.ash_scrub` and `terrain.chalkland`, matching the existing underscore-qualified terrain catalog convention. Both use the current 64×64 pointy-hex ground-mask contract. Improvement props are `improvement.terraced_fields`, `improvement.managed_woodlot`, `improvement.quarry`, `improvement.reedworks` and `improvement.shore_fishery`; they use 64×64 transparent canvases with ground anchor `(32,48)`. No road or watchtower is substituted for these actual canonical improvement definitions.

## Actual production and gates

Every original uses its own distinct built-in image-generation call. Exact prompts, the provider name, the unavailable model/seed declaration and source PNGs live under `assets/art/source/slice12/`. `generation.json` indexes the current chosen source revision; immutable per-asset revision records bind crops, source SHA-256, native SHA-256, palette processing and pivots. Rejected originals remain retained. There is no API-key fallback, borrowed culture sheet or hue-only variant.

`scripts/art-slice12.ts` performs offline source inspection and native preparation only. Genuine transparent margins and full silhouettes are required; it refuses clipped source boundaries instead of hiding them with padding. Nearest fitting and palette normalization precede the existing actual Pixel Snapper 4× and Aseprite pipeline. The existing palette and binary-alpha checks are mandatory. Source preparation does not approve anything.

Each candidate receives a separate native 1× and enlarged 4× visual inspection, exact-hash decision, readable notes and retained evidence. The first Synod cart was rejected for leftward orientation; the first Synod heavy sentinel was stopped before preparation because its helmet ornament touches the source edge. Neither is quietly treated as accepted.

All 37 targets passed individual native/enlarged review; the main reviewer also accepted both culture sheets, all land assets and both biome repeat views. Public integration was then authorized: 134 total approved assets / 152 frames, one 2048² page after the explicit 1024² capacity failure. Existing 97 approved frame pixels remain unchanged. [Durable complete review pack](reviews/slice12-all-1x.png), [exact input-hash order](reviews/slice12-all-order.json), [publication status](ART_IMPLEMENTATION_STATUS.md).

Full game view, Art Lab acceptance and measured integration remain explicit subsequent gates coordinated with the main implementation. No file in `apps/web/public/art` is produced by this preparation script; the approved-only art integration CLI performs publication separately.
