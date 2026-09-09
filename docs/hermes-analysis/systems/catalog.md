# Executable content catalog

Baseline `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`; content hash `b79c78ed`.

Generated from actual TypeScript exports by `inventory.ts`; all rows describe current definitions, not lore-only proposals. Legacy duplicate entries and repeated faction seats are excluded. Full fields, requirements and evidence remain in `content.json`.

## Summary
| Catalog | Actual | Declared target or counting caution | Evidence |
| --- | --- | --- | --- |
| Major culture/faction definitions | 24 | 24 | `packages/content/src/factions.ts:3-43` |
| Independent ancestry/race definitions | 0 | Distinct from cultures; no separate numeric target assumed | `packages/content/src/index.ts:21-33`; `docs/lore/FACTION_BIBLE.md:9-28` |
| Minor/independent power templates | 0 | 48 | `packages/sim/src/types.ts:218-250`; exported catalog |
| Unit definitions | 13 | 100+ meaningful definitions/variants | `packages/content/src/index.ts:43-60` |
| Town buildings / tile improvements | 5 / 18 | Separate registries, not merged | `packages/content/src/index.ts:36-42`; `packages/content/src/ecology.ts:71-83` |
| Resource definitions | 8 | 40+ | `packages/content/src/resources.ts:10-36` |
| Mundane technologies | 10 | 80+ | `packages/content/src/progression.ts:51-69` |
| Institution choices | 2 | 70+ institutions/traditions: also see development, not double counting | `packages/content/src/progression.ts:70-73` |
| Doctrine choices | 2 | 50+ doctrines: also see linked development | `packages/content/src/progression.ts:74-77` |
| Development nodes | 25 | 8 formation + 9 hearth + 8 faction; not extra activated spells | `packages/content/src/development.ts:51-89` |
| Character roles / missions / skills | 4 / 3 / 17 | 120+ combined abilities/traits target is not met | `packages/content/src/characters.ts:38-68`; `packages/content/src/development.ts:95-101` |
| Commander / innate unit activated abilities | 1 / 1 | Rally / Set shields; counted separately from spells | `packages/content/src/characters.ts:71-74`; `packages/content/src/magic.ts:11-15` |
| Arcane research disciplines / discovery purchases | 0 / 2 | 8-10 disciplines; a purchase is not a discipline | `packages/content/src/magic.ts:16-21` |
| Personal magical paths / battle spells | 2 / 2 | 10-14 paths; 250+ cross-system magical effects | `packages/content/src/magic.ts:5-27` |
| Rituals / summons / items or recipes / sacred / occult | 0 / 0 / 0 / 0 / 0 | Required distinct systems; 80+ items/recipes | Exported catalog; `packages/sim/src/types.ts:175-250` |
| Legendary sites/wonders / event templates / quests | 0 / 0 / 0 | 24+ sites and 150+ event templates; no quest count invented | Exported catalog; `packages/sim/src/types.ts:218-250` |
| Biomes / physical terrain / depth / natural features | 12 / 5 / 3 / 7 | Different layers, not alternate biome counts | `packages/mapgen/src/index.ts:32-61`; `packages/content/src/ecology.ts:25-33` |
| Name pools / distinct unsuffixed combinations | 24 / 1536 | 150+ notable authored characters or robust faction-specific generation; names alone not biographies | `packages/content/src/characters.ts:75-109` |
| Biography-bearing authored character definitions | 0 | Lore seeds not executable definitions | `docs/lore/FACTION_BIBLE.md:18-18`; `packages/sim/src/characters.ts:226-232` |
| Terminal victory paths / projects | 1 / 1 | Gate B ≥3 tested; master product target 5 | `packages/sim/src/progression.ts:17-18,142-156` |

Target source: `GAME_1_0_SCOPE.md:341-359`; `MASTER_PROMPT.md:1821-1837`; `DEFINITION_OF_DONE.md:16-33,147-155`. “Exported catalog” refers to `packages/content/src/index.ts:1-15,91-105`, the imported exports recorded in `content.json`, and the canonical state/command absence scope above.

## Units
All cultures share these definitions and prices. Strength is soldiers for land and durability for one naval hull in current battles. Requirements must be earned/paid; art variants are not independent gameplay units. Coin is upfront recruitment cost; industry is queued production cost.

| ID | Name | Domain | Strength | Attack/armor/init/range | Move/sight | Coin/industry/upkeep | Required technologies/buildings | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| unit.colonist | Hearth caravan | land | 10 | 3/1/3/0 | 3/2 | 16/30/1 | none | `packages/content/src/index.ts:44-44` |
| unit.scout | Wayfinder | land | 20 | 7/2/10/2 | 5/4 | 8/16/1 | none | `packages/content/src/index.ts:45-45` |
| unit.guard | Oath guard | land | 60 | 14/5/6/0 | 3/2 | 12/24/2 | none | `packages/content/src/index.ts:46-46` |
| unit.spearman | Ash pike company | land | 65 | 12/4/5/1 | 3/2 | 10/22/2 | none | `packages/content/src/index.ts:47-47` |
| unit.heavy_infantry | Cinder plate cohort | land | 85 | 17/9/3/0 | 2/2 | 22/40/3 | none | `packages/content/src/index.ts:48-48` |
| unit.cavalry | Charter outriders | land | 50 | 18/3/12/0 | 5/3 | 18/36/3 | none | `packages/content/src/index.ts:49-49` |
| unit.transport | Charter transport | naval | 70 | 6/3/5/0 | 5/3 | 24/36/2 | technology.coastal_navigation, building.harbor | `packages/content/src/index.ts:50-50` |
| unit.coastal_warship | Coastwatch galley | naval | 90 | 18/6/10/2 | 6/4 | 30/44/3 | technology.coastal_navigation, building.harbor | `packages/content/src/index.ts:51-51` |
| unit.ocean_warship | Deepwake warship | naval | 120 | 24/9/7/3 | 5/4 | 48/64/4 | technology.coastal_navigation, technology.ocean_navigation, building.harbor | `packages/content/src/index.ts:52-52` |
| unit.skirmisher | Reed skirmishers | land | 40 | 13/1/14/1 | 4/3 | 14/26/2 | technology.stewardship, building.granary | `packages/content/src/index.ts:53-53` |
| unit.arbalester | Witness arbalesters | land | 45 | 20/3/4/3 | 3/2 | 22/38/3 | technology.cinder_masonry, building.workshop | `packages/content/src/index.ts:54-54` |
| unit.halberdier | Kiln halberdiers | land | 80 | 20/7/4/1 | 2/2 | 28/48/4 | technology.quarry_cranes, building.workshop | `packages/content/src/index.ts:55-55` |
| unit.lancer | Road lancers | land | 65 | 24/6/11/0 | 4/3 | 32/54/4 | technology.surveyed_estates, building.market | `packages/content/src/index.ts:56-56` |

## Factions and ecological asymmetry
Culture definitions are political identities, not an ancestry registry. Modifiers apply to worked tiles and are combined/clamped with other tile yield components. Every culture may recruit all shared units. AI preference changes are not player access restrictions. “Ocean” affinities do not authorize workers in deep water.

| ID | Culture | Positive worked-biome modifiers | Negative worked-biome modifiers | Paid cultivation targets | Highest AI weights |
| --- | --- | --- | --- | --- | --- |
| faction.ashen_compact | Ashen Compact | Temperate grassland: food +1; Temperate forest: industry +1 | Tundra: food -1; Desert: food -1 | Temperate grassland, Temperate forest | guard (weight 2) |
| faction.reedbound_council | Reedbound Council | Marsh: food +1; Rainforest: food +1 | Desert: food -1; Ash scrub: food -1 | Marsh, Rainforest | guard (weight 2) |
| faction.cinder_march | Cinder March | Ash scrub: industry +1; Steppe: industry +1 | Marsh: industry -1; Rainforest: industry -1 | Ash scrub, Steppe | guard (weight 2) |
| faction.glass_tide | Glass Tide | Ocean: coin +1; Chalkland: coin +1 | Tundra: food -1; Taiga: industry -1 | Chalkland | guard (weight 2) |
| faction.iron_covenant | Iron Covenant | Taiga: industry +1; Alpine: industry +1 | Marsh: food -1; Rainforest: industry -1 | Taiga | guard (weight 2) |
| faction.sepulchral_synod | Sepulchral Synod | Chalkland: knowledge +1; Desert: food +1 | Marsh: industry -1; Rainforest: industry -1 | Chalkland, Desert | guard (weight 2) |
| faction.mire_courts | Mire Courts | Marsh: food +1; Rainforest: knowledge +1 | Desert: food -1; Ash scrub: food -1 | Marsh, Rainforest | spearman, scout, skirmisher (weight 3) |
| faction.saltwind_remnant | Saltwind Remnant | Ocean: coin +1; Chalkland: industry +1 | Taiga: industry -1; Rainforest: coin -1 | Chalkland | guard (weight 3) |
| faction.wardhall_remnant | Wardhall Remnant | Chalkland: industry +1; Temperate grassland: knowledge +1 | Marsh: industry -1; Rainforest: industry -1 | Temperate grassland, Chalkland | spearman, heavy_infantry, halberdier (weight 3) |
| faction.rimehorn_clans | Rimehorn Clans | Tundra: food +1; Taiga: industry +1 | Desert: food -1; Marsh: industry -1 | Taiga, Tundra | guard (weight 3) |
| faction.sable_steppe | Sable Steppe | Steppe: food +1; Desert: coin +1 | Marsh: food -1; Taiga: coin -1 | Steppe, Desert | cavalry, lancer (weight 4) |
| faction.morrow_spore | Morrow Spore | Temperate forest: knowledge +1; Rainforest: food +1 | Chalkland: food -1; Ash scrub: coin -1 | Temperate forest, Rainforest | scout, skirmisher (weight 4) |
| faction.cistern_assembly | Cistern Assembly | Desert: industry +1; Chalkland: food +1 | Marsh: industry -1; Taiga: food -1 | Desert, Chalkland | spearman (weight 4) |
| faction.unsealed_companies | Unsealed Companies | Steppe: coin +1; Ash scrub: knowledge +1 | Rainforest: industry -1; Marsh: coin -1 | Steppe, Ash scrub | spearman, cavalry, lancer (weight 3) |
| faction.lantern_hospices | Lantern Hospices | Temperate grassland: knowledge +1; Chalkland: food +1 | Ash scrub: food -1; Rainforest: industry -1 | Temperate grassland, Chalkland | guard (weight 4) |
| faction.cairnwing_concord | Cairnwing Concord | Alpine: industry +1; Steppe: food +1 | Marsh: industry -1; Rainforest: coin -1 | Steppe | spearman, scout, skirmisher (weight 4) |
| faction.red_sluice | Red Sluice Directorate | Marsh: industry +1; Temperate grassland: food +1 | Alpine: food -1; Desert: industry -1 | Marsh, Temperate grassland | spearman, heavy_infantry, halberdier (weight 4) |
| faction.velvet_meridian | Velvet Meridian | Desert: knowledge +1; Chalkland: coin +1 | Rainforest: knowledge -1; Ash scrub: coin -1 | Desert, Chalkland | scout, skirmisher (weight 3) |
| faction.brine_choir | Brine Choir | Ocean: food +1; Marsh: coin +1 | Taiga: food -1; Desert: industry -1 | Marsh | guard, spearman (weight 3) |
| faction.emberwake_convocation | Emberwake Convocation | Ash scrub: knowledge +1; Steppe: industry +1 | Marsh: food -1; Rainforest: knowledge -1 | Ash scrub, Steppe | guard, heavy_infantry (weight 3) |
| faction.underhush_exchange | Underhush Exchange | Taiga: industry +1; Chalkland: coin +1 | Marsh: industry -1; Tundra: food -1 | Taiga, Chalkland | guard (weight 4) |
| faction.vesper_court | Vesper Court | Temperate forest: knowledge +1; Taiga: coin +1 | Desert: food -1; Ash scrub: coin -1 | Temperate forest, Taiga | heavy_infantry (weight 4) |
| faction.manytrack_moot | Manytrack Moot | Temperate forest: food +1; Steppe: coin +1 | Desert: food -1; Alpine: industry -1 | Temperate forest, Steppe | scout, skirmisher (weight 4) |
| faction.margin_observance | Margin Observance | Alpine: knowledge +1; Ash scrub: knowledge +1 | Rainforest: knowledge -1; Marsh: industry -1 | Ash scrub | scout, skirmisher (weight 4) |

Evidence for complete matrix: `packages/content/src/factions.ts:3-84`; `packages/content/src/ecology.ts:39-64`; actual rule aggregation: `packages/sim/src/territory.ts:351-361`. Names and full recruitment weights are preserved per culture in `content.json`.

## Buildings and tile improvements

| ID | Name | Registry | Base coin | Completion work | Base yield effects | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| building.granary | Root cellar | buildings | 8 | 18 industry | food +4 | `packages/content/src/index.ts:37-37` |
| building.workshop | Cinder workshop | buildings | 12 | 24 industry | industry +4 | `packages/content/src/index.ts:38-38` |
| building.market | Charter market | buildings | 10 | 24 industry | coin +5 | `packages/content/src/index.ts:39-39` |
| building.archive | Witness archive | buildings | 12 | 24 industry | knowledge +4 | `packages/content/src/index.ts:40-40` |
| building.harbor | Charter harbor | buildings | 20 | 36 industry | coin +2 | `packages/content/src/index.ts:41-41` |
| improvement.terraced_fields | Terraced fields | improvements | 18 | 2 active turns | food +2 | `packages/content/src/ecology.ts:72-72` |
| improvement.managed_woodlot | Managed woodlot | improvements | 24 | 3 active turns | food +1, industry +2 | `packages/content/src/ecology.ts:73-73` |
| improvement.quarry | Measured quarry | improvements | 28 | 3 active turns | food -1, industry +3 | `packages/content/src/ecology.ts:74-74` |
| improvement.reedworks | Reedworks | improvements | 22 | 2 active turns | food +1, industry +1, coin +1 | `packages/content/src/ecology.ts:75-75` |
| improvement.shore_fishery | Shore fishery | improvements | 24 | 2 active turns | food +2, coin +1 | `packages/content/src/ecology.ts:76-76` |
| improvement.spring_garden | Spring garden | improvements | 34 | 3 active turns | food +3, industry -1 | `packages/content/src/ecology.ts:77-77` |
| improvement.polder | Polder | improvements | 46 | 4 active turns | food +4, industry +1, coin -1 | `packages/content/src/ecology.ts:78-78` |
| improvement.grove_archive | Grove archive | improvements | 48 | 4 active turns | industry +1, knowledge +2 | `packages/content/src/ecology.ts:79-79` |
| improvement.oreworks | Oreworks | improvements | 52 | 4 active turns | food -1, industry +4, coin -1 | `packages/content/src/ecology.ts:80-80` |
| improvement.tide_observatory | Tide observatory | improvements | 56 | 4 active turns | coin +1, knowledge +3 | `packages/content/src/ecology.ts:81-81` |
| improvement.grange | Hearthgrain grange | improvements | 28 | 3 active turns | food +3 | `packages/content/src/ecology.ts:71-83` |
| improvement.iron_mine | Ironstone mine | improvements | 42 | 4 active turns | food -1, industry +3 | `packages/content/src/ecology.ts:71-83` |
| improvement.copper_mine | Copper mine | improvements | 34 | 3 active turns | industry +2, coin +1 | `packages/content/src/ecology.ts:71-83` |
| improvement.salt_house | Salt house | improvements | 30 | 3 active turns | food +1, coin +1 | `packages/content/src/ecology.ts:71-83` |
| improvement.timber_yard | Heartwood yard | improvements | 30 | 3 active turns | industry +3 | `packages/content/src/ecology.ts:71-83` |
| improvement.remount_yard | Remount yard | improvements | 38 | 4 active turns | food +1, coin +1 | `packages/content/src/ecology.ts:71-83` |
| improvement.silver_mine | Silver mine | improvements | 52 | 4 active turns | food -1, industry +1, coin +2 | `packages/content/src/ecology.ts:71-83` |
| improvement.glass_refinery | Ashglass refinery | improvements | 56 | 5 active turns | knowledge +3 | `packages/content/src/ecology.ts:71-83` |

Improvement quotes add distance/cultivation/mismatch costs to the catalog base; requirements, signed feature modifiers and deposit conditions are retained in `content.json` (`packages/sim/src/territory.ts:286-337`).

## Resources

| ID | Name | Category | Stock per worked source/turn | Sale coin/unit | Matching extraction improvement | Current material consumers | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| resource.grain | Hearthgrain | provisions | 3 | 2 | improvement.grange | training.breakthrough, hearth.granary_rotations, hearth.seed_exchange, tradition.harvest_councils, tradition.standing_reserve | `packages/content/src/resources.ts:11-11` |
| resource.iron | Ironstone | material | 2 | 4 | improvement.iron_mine | training.breakthrough, training.held_line, hearth.kiln_guilds, hearth.master_workyards, tradition.standing_reserve | `packages/content/src/resources.ts:12-12` |
| resource.copper | Red copper | material | 2 | 3 | improvement.copper_mine | training.countershot, hearth.kiln_guilds, tradition.disciplined_momentum | `packages/content/src/resources.ts:13-13` |
| resource.salt | White salt | provisions | 2 | 3 | improvement.salt_house | training.veteran_service, hearth.granary_rotations, tradition.harvest_councils | `packages/content/src/resources.ts:14-14` |
| resource.timber | Heartwood | material | 2 | 3 | improvement.timber_yard | training.held_line, training.countershot | `packages/content/src/resources.ts:15-15` |
| resource.horses | Steppe horses | material | 1 | 5 | improvement.remount_yard | hearth.seed_exchange, hearth.exchange_quarter, tradition.itinerant_courts, tradition.disciplined_momentum | `packages/content/src/resources.ts:16-16` |
| resource.silver | Witness silver | luxury | 1 | 7 | improvement.silver_mine | training.veteran_service, hearth.charter_ledger, hearth.exchange_quarter, tradition.itinerant_courts | `packages/content/src/resources.ts:17-17` |
| resource.ashglass | Ashglass | arcane | 1 | 6 | improvement.glass_refinery | hearth.master_workyards, hearth.charter_ledger | `packages/content/src/resources.ts:18-18` |

The listed consumers are development nodes; unit and spell costs do not consume these stocks. Terrain-suitable deposits are seed-generated; output needs matching completed improvements and worker assignment (`packages/sim/src/resources.ts:20-49,69-103`).

## National progression
Technology costs below are base content values. Civic accounts actually quotes 40/400/800/1600 knowledge for Short/Standard/Long/Epic. Other costs are not multiplied by pace (`packages/content/src/progression.ts:25-49`; `packages/sim/src/progression.ts:72-89`).

| ID | Name | Registry | Base cost | Actual defined role/effect | Evidence |
| --- | --- | --- | --- | --- | --- |
| technology.cinder_masonry | Cinder masonry | technologies | 24 knowledge | Reusable kiln forms strengthen hearthland workshops. Every settlement gains 2 industry before devastation, occupation and blockade penalties. | `packages/content/src/progression.ts:52-52` |
| technology.civic_accounts | Civic accounts | technologies | 40 knowledge | Public ledgers reconnect the bargains once carried by the Witness Roads. Every settlement gains 1 coin and 1 knowledge before penalties; enables the Hearth Exchange. | `packages/content/src/progression.ts:53-53` |
| technology.coastal_navigation | Coastal navigation | technologies | 30 knowledge | Soundings and shore charts reconnect coastal hearthlands. Enables Charter harbors, transports and Coastwatch galleys; vessels can travel coastal shallows. This practical knowledge does not confer magical aptitude. | `packages/content/src/progression.ts:54-54` |
| technology.ocean_navigation | Ocean navigation | technologies | 80 knowledge | Deep-water charts and long-voyage rigging open the ocean. Ocean-capable transports and Deepwake warships may cross deep water; coastal galleys remain restricted to shallows. | `packages/content/src/progression.ts:55-55` |
| technology.stewardship | Seasonal stewardship | technologies | 36 knowledge | Record planting and water-sharing obligations. Unlocks Spring gardens on fresh-water land; opens the waterworks, forestry and surveyed-estates branches. Knowledge alone does not build or work a tile. | `packages/content/src/progression.ts:56-56` |
| technology.waterworks | Sluice waterworks | technologies | 64 knowledge | Controlled sluices support worked wetland Polders. They can feed crowded settlements, but old growth and Ashfall glass make intensive planting less productive. Physical terrain and natural features remain intact. | `packages/content/src/progression.ts:57-57` |
| technology.surveyed_estates | Surveyed estates | technologies | 60 knowledge | Witnessed boundary surveys add one civic progress per active settlement turn toward automatic border expansion. Claims still require connected, charted land within the settlement’s reach; siege and occupation halt expansion. | `packages/content/src/progression.ts:58-58` |
| technology.charter_forestry | Charter forestry | technologies | 72 knowledge | Bind cutting rights to the preservation of living records. Unlocks Grove archives on old-growth woodland: knowledge and modest industry instead of the woodlot’s stronger extraction. | `packages/content/src/progression.ts:59-59` |
| technology.quarry_cranes | Counterweighted cranes | technologies | 60 knowledge | Reusable lifting frames unlock Oreworks on mineral seams. Worked Oreworks favor industry at the cost of food and coin; wet ground complicates extraction. | `packages/content/src/progression.ts:60-60` |
| technology.deep_soundings | Deep soundings | technologies | 120 knowledge | Observations from the shore compare returning ships’ ocean records. Unlocks Tide observatories on coastal shallows; knowledge replaces the food-focused role of a fishery. Does not extend worker reach into deep ocean. | `packages/content/src/progression.ts:61-61` |
| institution.charter_compact | Charter compact | institutions | 30 coin | Recognize shared market charters. Every settlement gains 2 coin before penalties; enables the Hearth Exchange. Permanently excludes Common stewardship. | `packages/content/src/progression.ts:71-71` |
| institution.common_stewardship | Common stewardship | institutions | 30 coin | Communal stores take priority over merchant privileges. Every settlement gains 3 food before penalties; enables the Hearth Exchange. Permanently excludes Charter compact. | `packages/content/src/progression.ts:72-72` |
| doctrine.shield_cohesion | Shield cohesion | doctrines | 24 coin | Train formations to cover one another. Armies gain 2 armor in battle. Permanently excludes March columns. | `packages/content/src/progression.ts:75-75` |
| doctrine.march_columns | March columns | doctrines | 24 coin | Organize disciplined marching relays. Armies regain 1 additional strategic movement each turn. Permanently excludes Shield cohesion. | `packages/content/src/progression.ts:76-76` |
| arcane.ember_projection | Contained ember projection | arcaneDiscoveries | 36 knowledge | National Arcane Theory for Cinder thread. A personally Flame-gifted Waykeeper is still required; research alone cannot cast it. | `packages/content/src/magic.ts:19-19` |
| arcane.rune_binding | Measured rune binding | arcaneDiscoveries | 48 knowledge | National Arcane Theory for Bound ward. A personally Rune-gifted Waykeeper is still required; wards absorb damage, not casualties already suffered. | `packages/content/src/magic.ts:20-20` |

## Development: formation, hearth and faction

| ID | Name | Scope | Branch | Coin/progress/upkeep | Prerequisites | Exclusive group | Effects | Materials |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| training.field_habits | Field habits | formation | Service | 8/3/0 | none | none | morale +4 | none |
| training.pressure_drill | Pressure drill | formation | Assault | 16/5/0 | ALL training.field_habits | company_method | attack +2 | none |
| training.breakthrough | Breach timing | formation | Assault | 28/8/1 | ALL training.pressure_drill | none | attack +3, initiative +1 | resource.iron ×4, resource.grain ×2 |
| training.shield_partners | Covering partners | formation | Line | 16/5/0 | ALL training.field_habits | company_method | armor +1 | none |
| training.held_line | Held line | formation | Line | 28/8/1 | ALL training.shield_partners | none | armor +2, morale +4 | resource.iron ×4, resource.timber ×3 |
| training.measured_sights | Measured sights | formation | Missile | 16/5/0 | ALL training.field_habits; range 1 | company_method | initiative +2 | none |
| training.countershot | Countershot | formation | Missile | 28/8/1 | ALL training.measured_sights; range 1 | none | attack +1, range +1 | resource.copper ×3, resource.timber ×3 |
| training.veteran_service | Witnessed service | formation | Service | 36/12/1 | ANY training.breakthrough, training.held_line, training.countershot | none | armor +1, morale +6 | resource.silver ×2, resource.salt ×2 |
| hearth.common_store | Common store | hearth | Provisions | 24/4/1 | building.granary; population 2 | none | food +2 | none |
| hearth.granary_rotations | Granary rotations | hearth | Provisions | 42/8/1 | ALL hearth.common_store; building.granary; population 4 | hearth_specialization | food +3 | resource.grain ×4, resource.salt ×2 |
| hearth.seed_exchange | Seed exchange | hearth | Provisions | 70/14/2 | ALL hearth.granary_rotations; building.granary; building.market; population 8 | none | food +4, knowledge +1 | resource.horses ×2, resource.grain ×6 |
| hearth.craft_courts | Craft courts | hearth | Craft | 28/4/1 | building.workshop; population 3 | none | industry +2 | none |
| hearth.kiln_guilds | Kiln guilds | hearth | Craft | 46/8/2 | ALL hearth.craft_courts; building.workshop; population 5 | hearth_specialization | industry +3, coin +1 | resource.iron ×3, resource.copper ×2 |
| hearth.master_workyards | Master workyards | hearth | Craft | 80/14/3 | ALL hearth.kiln_guilds; building.workshop; building.archive; population 8 | none | industry +4, knowledge +2 | resource.iron ×6, resource.ashglass ×2 |
| hearth.witness_counter | Witness counter | hearth | Commerce | 28/4/1 | building.market; population 3 | none | coin +3 | none |
| hearth.charter_ledger | Charter ledger | hearth | Commerce | 46/8/2 | ALL hearth.witness_counter; building.market; building.archive; population 5 | hearth_specialization | coin +3, knowledge +2 | resource.silver ×2, resource.ashglass ×2 |
| hearth.exchange_quarter | Exchange quarter | hearth | Commerce | 80/14/3 | ALL hearth.charter_ledger; building.market; building.archive; population 8 | none | coin +5, knowledge +3 | resource.horses ×3, resource.silver ×4 |
| tradition.store_pledges | Store pledges | faction | Common stewardship | 60/6/2 | institution.common_stewardship | none | food +2 | none |
| tradition.harvest_councils | Harvest councils | faction | Common stewardship | 120/12/3 | ALL tradition.store_pledges; institution.common_stewardship | none | food +2, industry +1 | resource.grain ×4, resource.salt ×2 |
| tradition.open_ledgers | Open ledgers | faction | Charter compact | 60/6/2 | institution.charter_compact | none | coin +2, knowledge +1 | none |
| tradition.itinerant_courts | Itinerant courts | faction | Charter compact | 120/12/3 | ALL tradition.open_ledgers; institution.charter_compact | none | industry +1, coin +2 | resource.horses ×4, resource.silver ×3 |
| tradition.watched_ranks | Watched ranks | faction | Shield cohesion | 60/6/2 | doctrine.shield_cohesion | none | armor +1, morale +4 | none |
| tradition.standing_reserve | Standing reserve | faction | Shield cohesion | 120/12/3 | ALL tradition.watched_ranks; doctrine.shield_cohesion | none | attack +1, armor +1 | resource.iron ×6, resource.grain ×6 |
| tradition.dispatch_cells | Dispatch cells | faction | March columns | 60/6/2 | doctrine.march_columns | none | initiative +2 | none |
| tradition.disciplined_momentum | Disciplined momentum | faction | March columns | 120/12/3 | ALL tradition.dispatch_cells; doctrine.march_columns | none | attack +2, morale +4 | resource.horses ×6, resource.copper ×2 |

Evidence: `packages/content/src/development.ts:33-89`; costs and effect application: `packages/sim/src/development.ts:64-121,152-211,224-233`. Formation progress is battle XP, hearth progress civic points, faction progress influence. These are not paid from personal character XP.

## Characters, missions and skills

### characterRoles
| ID | Name | Current description | Evidence |
| --- | --- | --- | --- |
| character.marshal | Hearth marshal | An appointed field commander. Leads the attached army, rallies shaken formations once per battle, and earns experience from its outcomes. | `packages/content/src/characters.ts:39-39` |
| character.surveyor | Road witness | A travelling surveyor who charts terrain from an escorted camp. Surveys preserve geographic knowledge, not the positions of unseen foreign troops. | `packages/content/src/characters.ts:40-40` |
| character.engineer | March engineer | A field specialist who must travel with an army. Refits replenish real formation losses; siege sabotage trades coin and exposure for damage to defenses. | `packages/content/src/characters.ts:41-41` |
| character.waykeeper | Waykeeper | A paid travelling practitioner with personal Flame and Rune aptitude. Researched Cinder thread and Bound ward consume limited battle strain. Occupies a companion slot, not an army command. | `packages/content/src/characters.ts:42-42` |

### characterMissions
| ID | Name | Current description | Evidence |
| --- | --- | --- | --- |
| mission.survey | Survey the frontier | Hold the escort in place for two turns to chart terrain within six hexes. Unseen armies remain hidden. Moving or fighting interrupts the work without a refund. | `packages/content/src/characters.ts:49-49` |
| mission.refit | Refit the column | Hold the column for two turns to restore up to five missing strength per formation. Refit cannot exceed a formation’s normal capacity or recreate a destroyed formation. | `packages/content/src/characters.ts:50-50` |
| mission.sabotage | Undermine the defenses | Work from the besieging army for two turns. Success removes thirty siege defense; failure wounds the engineer. Relief, peace or displacement interrupts the operation. | `packages/content/src/characters.ts:51-51` |

### characterSkills
| ID | Name | Current description | Evidence |
| --- | --- | --- | --- |
| skill.steadfast | Keeper of the line | The marshal’s formations gain one armor; Rally restores five additional morale. This permanent specialization excludes Decisive orders. | `packages/content/src/characters.ts:54-54` |
| skill.decisive | Decisive orders | The marshal’s formations gain two additional attack. This permanent specialization excludes Keeper of the line. | `packages/content/src/characters.ts:55-55` |
| skill.fieldcraft | Patient fieldcraft | A surveyor charts one hex farther; an engineer restores two additional strength per formation during refit. Engineers choose this instead of Siege craft. | `packages/content/src/characters.ts:56-56` |
| skill.siegecraft | Siege craft | Careful preparation lowers the risk of a sabotage failure and wounds. Choose this permanent engineering specialization instead of Patient fieldcraft. | `packages/content/src/characters.ts:57-57` |
| skill.muster_rolls | Muster rolls | Organized formation officers raise this healthy marshal’s command capacity from sixteen to eighteen. Compatible with either specialization and its battlecraft branch. | `packages/content/src/characters.ts:61-61` |
| skill.field_orders | Field orders | A practiced chain of officers raises this healthy marshal’s command capacity from eighteen to twenty formations. The command remains vulnerable to the marshal’s wounds or absence. | `packages/content/src/characters.ts:62-62` |
| skill.measured_advance | Measured advance | Build on Decisive orders: every formation under this healthy marshal gains one more attack. This battlecraft branch can be learned alongside command expansion. | `packages/content/src/characters.ts:63-63` |
| skill.unbroken_line | Unbroken line | Build on Keeper of the line: every formation under this healthy marshal gains one more armor. This battlecraft branch can be learned alongside command expansion. | `packages/content/src/characters.ts:64-64` |
| skill.horizon_studies | Horizon studies | A practiced Road witness extends Patient fieldcraft by another hex, charting terrain within eight hexes. Hidden armies are still not revealed. | `packages/content/src/characters.ts:65-65` |
| skill.column_workshops | Column workshops | Build on Patient fieldcraft: organized repair parties restore three additional missing strength per formation, for ten in a completed refit. Lost formations cannot be recreated. | `packages/content/src/characters.ts:66-66` |
| skill.sapper_watch | Sapper watch | Build on Siege craft: guarded working parties remove the remaining ten percentage points of sabotage-failure risk. Enemy relief or displacement can still interrupt the operation. | `packages/content/src/characters.ts:67-67` |
| skill.witnessed_assault | Witnessed assault | Build on Measured advance: the marshal adds 1 attack and restores 2 more morale with Rally. | `packages/content/src/development.ts:96-96` |
| skill.last_standard | Last standard | Build on Unbroken line: the marshal adds 1 armor and restores 3 more morale with Rally. | `packages/content/src/development.ts:97-97` |
| skill.route_memory | Route memory | Extend Horizon studies with an additional hex of actual survey reach. Unseen armies remain hidden. | `packages/content/src/development.ts:98-98` |
| skill.far_witness | Far witness | The surveyor reads the distant ground through recorded journeys. Adds one further hex to survey missions. | `packages/content/src/development.ts:99-99` |
| skill.traveling_arsenal | Travelling arsenal | Develop Column workshops into a travelling stores practice. Refit restores 4 more missing strength per surviving formation; destroyed units stay destroyed. | `packages/content/src/development.ts:100-100` |
| skill.breach_accounts | Breach accounts | Apply Sapper watch to the survival of the siege column. The engineer adds 1 armor to the escorted formations. | `packages/content/src/development.ts:101-101` |

### commanderAbilities
| ID | Name | Current description | Evidence |
| --- | --- | --- | --- |
| ability.rally | Rally the line | Once per battle, restore up to twelve morale to the marshal’s surviving formations, capped by their normal morale. Rally does not heal casualties or change the battle’s random stream. | `packages/content/src/characters.ts:72-72` |

## Magic paths and battle effects
National purchases above unlock the same two battle spells below, not two additional usable magical effects. Waykeepers share Flame 1/Rune 1 at recruitment; max caster strain is 10.

### magicPaths
| ID | Name | Description | Evidence |
| --- | --- | --- | --- |
| path.flame | Flame | Personal aptitude for bounded heat and ember workings. | `packages/content/src/magic.ts:6-6` |
| path.rune | Rune | Personal aptitude for inscribed bindings and protective workings. | `packages/content/src/magic.ts:7-7` |

### battleSpells
| ID | Name | Description | Evidence |
| --- | --- | --- | --- |
| spell.cinder_thread | Cinder thread | A narrow ember working strikes one active enemy formation. Armor reduces its strength damage; a ward absorbs damage first. Costs four strain, at most twice per battle. | `packages/content/src/magic.ts:25-25` |
| spell.bound_ward | Bound ward | Bind up to eight protective points around one active friendly formation. Protection is consumed by incoming damage and never restores strength or routed morale. Costs three strain, at most twice per battle. | `packages/content/src/magic.ts:26-26` |

### innateBattleAbilities
| ID | Name | Description | Evidence |
| --- | --- | --- | --- |
| ability.set_shields | Set shields | Once per battle, an active Oath guard pays eight fatigue for six damage-absorbing protection. Shield drill does not heal casualties or restore routed morale. | `packages/content/src/magic.ts:14-14` |

## Geography
| Biome ID | Name | Base worked-tile yield |
| --- | --- | --- |
| 0 | Ocean | food +1, coin +1 |
| 1 | Temperate grassland | food +2 |
| 2 | Temperate forest | food +1, industry +1 |
| 3 | Taiga | industry +2 |
| 4 | Tundra | food +1 |
| 5 | Desert | industry +1 |
| 6 | Steppe | food +1, coin +1 |
| 7 | Marsh | food +1, coin +1 |
| 8 | Rainforest | food +2, industry +1 |
| 9 | Alpine | industry +2 |
| 10 | Ash scrub | industry +2 |
| 11 | Chalkland | food +1, industry +1 |

| Size | Width | Height | Cells | Suggested faction seats |
| --- | --- | --- | --- | --- |
| tiny | 48 | 32 | 1536 | 4 |
| small | 256 | 160 | 40960 | 12 |
| standard | 384 | 256 | 98304 | 24 |
| huge | 512 | 384 | 196608 | 32 |
| legendary | 640 | 480 | 307200 | 40 |

Evidence: `packages/mapgen/src/index.ts:13-61`; `packages/content/src/ecology.ts:17-21`. Suggested seats above 24 reuse definitions. These dimensions are not performance measurements.

| Natural feature ID | Name | Description | Evidence |
| --- | --- | --- | --- |
| feature.spring | Fresh spring | Reliable fresh water feeds a worked hex. It does not create a navigable river. | `packages/content/src/ecology.ts:26-26` |
| feature.ore | Ore seam | Exposed mineral seams provide industry and reward careful quarrying. | `packages/content/src/ecology.ts:27-27` |
| feature.old_growth | Old growth | Ancient woodland preserves living records. Its knowledge remains valuable under managed cutting. | `packages/content/src/ecology.ts:28-28` |
| feature.waterlogging | Waterlogged ground | Saturated ground slows ordinary extraction and field drainage. | `packages/content/src/ecology.ts:29-29` |
| feature.peat | Peat bed | Wet organic beds supply modest fuel; reedworks can use them more effectively. | `packages/content/src/ecology.ts:30-30` |
| feature.rich_shoals | Rich shoals | Productive coastal shallows sustain fish and reward a shore fishery. | `packages/content/src/ecology.ts:31-31` |
| feature.glass_shards | Ashfall glass | Vitrified fragments hamper food gathering but preserve evidence of the disputed Ashfall. | `packages/content/src/ecology.ts:32-32` |

## Public command inventory
46 current command discriminants, imported from `commandSchema`; complete canonical interface at `packages/sim/src/types.ts:175-216`.

`accelerateRoad`, `adoptDoctrine`, `adoptInstitution`, `assault`, `assignCharacter`, `attack`, `autoResolveBattle`, `battleOrder`, `besiege`, `cancelCharacterMission`, `cancelLandWork`, `cancelMovement`, `claimCell`, `declareWar`, `develop`, `disembarkArmy`, `embarkArmy`, `endTurn`, `found`, `improveTile`, `liftSiege`, `mergeArmies`, `move`, `moveTo`, `promoteCharacter`, `proposePeace`, `queue`, `queueMovement`, `recruitCharacter`, `research`, `researchArcane`, `resolveCapture`, `respondPeace`, `resumeMovement`, `sellResource`, `setBattleAbilityAuto`, `setCapital`, `setWorkedTiles`, `splitArmy`, `startCharacterMission`, `startVictoryProject`, `terraformTile`, `transferFormations`, `unassignCharacter`, `useBattleAbility`, `useCommanderAbility`

## Victory and diplomacy
Only `prosperity` is a terminal victory; one Hearth Exchange project. Peace is one-way coin transfer plus a 5–30 turn binding truce. Capture outcomes are `occupy`, `sack`, `raze`, `liberate`; context determines whether liberation is legal. Full schemas/actual pace values are preserved in `content.json` (`packages/sim/src/progression.ts:17-18,112-156`; `packages/sim/src/diplomacy.ts:9-40`; `packages/sim/src/siege.ts:128-147`).
