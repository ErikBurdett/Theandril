---
name: theandril-content-lore
description: Use when creating Theandril lore, factions, ancestries, characters, religions, magic, events, names, unit flavor, buildings, landmarks, narrative text, or balancing content packs.
---

# Original Theandril Content

Everything must feel like one original world.

## IP boundary

Do not copy protected D&D/Forgotten Realms/Dragonlance/etc.:
- setting names;
- gods;
- signature characters;
- distinctive monsters;
- spell lists/names;
- lore;
- prose;
- art.

Do not copy proprietary Civilization content or UI writing.

Use broad fantasy folklore as raw material, then transform it.

## Canon first

Before producing large content batches, read/update the lore bible.

Maintain:
- geography;
- historical chronology;
- naming rules;
- cosmology;
- magic rules;
- religions;
- cultures;
- political relationships.

New content must not casually contradict canon.

## Faction quality

Every major faction needs:
- strategic identity;
- internal tension;
- external rivals/interests;
- economic identity;
- military identity;
- diplomatic personality;
- supernatural relationship;
- visual/heraldic identity;
- notable characters.

Avoid monoculture stereotypes.

## Event writing

Events should emerge from state.

Prefer:
"Your governor and border clans dispute grazing rights after refugees arrive"

over:
"Random event: lose 50 gold."

Choices should have meaningful, previewable consequences and AI evaluation hooks.

## Names

Create culture-specific phonetic/name-generation rules.

Avoid apostrophe-heavy generic fantasy naming as a default.

## Data

All content:
- stable IDs;
- localization keys;
- schema validation;
- cross-reference validation;
- asset provenance.

## Expanding the formation roster

Append stable unit IDs without rewriting existing definitions or their ordering. A new paid recruit changes the content seal even when the canonical state shape is unchanged: retain an independently captured old save/archive, version the content/rules boundary, reject new IDs in resealed historical armies, queues and battle reports, and preserve historical command results and hash projections. Use `introducedInRules` and the rules-aware production catalog for new land formations; research/building blockers belong in simulation quotes.

Keep basic culture-preference fixtures scoped to `BASE_LAND_MILITARY_UNIT_IDS` when they test the original five-role balance. Separately exercise every new role through paid player recruitment, AI proposals, completed production, composition, upkeep, save continuation and replay. Do not grant research to turn a missing unlock into a passing recruitment test; label authored equal-force setups and also retain a generated, earned development scenario.

New gameplay roles may deliberately share a reviewed silhouette through `SHARED_UNIT_ART` / `unitArtRole` in the art-pipeline runtime module. Keep that presentation mapping separate from asset provenance and faction-qualified content bindings. Map, tactical scene and DOM cards must use the same source role, correct native dimensions and honest shared-art diagnostics or labels. Shared silhouettes are a documented visual limitation, not newly authored specialist artwork; never reuse land troop art for ships.
