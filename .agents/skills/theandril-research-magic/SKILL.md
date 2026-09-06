---
name: theandril-research-magic
description: Use whenever implementing or designing Theandril mundane technology, institutions, military doctrine, Arcane Theory, magical paths, individual casters, battle magic, rituals, summons, sacred magic, occult systems, magical sites/resources, artifice, artifacts, or research AI.
---

# Theandril Research & Magic

Read `docs/RESEARCH_MAGIC_SYSTEMS.md` and the progression section of `MASTER_PROMPT.md`.

## Core rule

Never collapse national magical research and individual caster capability into one number.

A magical effect may require:
- national research discipline;
- one or more caster path aptitudes;
- resource;
- site/building;
- item;
- faction tag;
- character tag;
- world condition.

## Separate advancement systems

Maintain distinct systems for:
- mundane Technology/Knowledge;
- Institutions/Civic Traditions;
- Military Doctrine;
- Arcane Theory;
- personal Magical Paths;
- Sacred Practice;
- Forbidden/Occult Practice;
- Artifice/Relics.

Share infrastructure under the hood where useful, but preserve meaningful player-facing differences.

## Dominions-inspired structural principles

Use high-level structural inspiration only:
- asymmetric path access;
- multiple research disciplines;
- caster-specific capability;
- battle versus strategic magic;
- magical resources;
- site searching;
- summons;
- crafting;
- world-scale enchantments;
- counter-magic;
- faction-exclusive magic.

Do not copy Dominions terminology, spell lists, paths, numerical balance, content, art, or UI.

## Forgotten Realms conversion inspiration boundary

Use only the concept of a lore-rich total-conversion-scale roster where radically different fantasy nations and subterranean/surface powers can coexist with bespoke:
- troops;
- commanders;
- heroes;
- magic;
- summons;
- geography;
- strategic identities.

Do not copy any Forgotten Realms or mod names, lore, factions, places, characters, gods, spells, monsters unique to the setting, maps, art, or text.

## Implementation model

Definitions should be data-driven.

Suggested components:
- `ResearchDisciplineDefinition`;
- `TechnologyDefinition`;
- `InstitutionDefinition`;
- `DoctrineDefinition`;
- `MagicPathDefinition`;
- `ArcaneDiscoveryDefinition`;
- `RitualDefinition`;
- `BattleSpellDefinition`;
- `SummonDefinition`;
- `ArtifactRecipeDefinition`;
- `SacredTraditionDefinition`;
- `OccultTraditionDefinition`.

A compiled content layer resolves requirements into efficient runtime data.

## Character magic

Characters should carry their own aptitude data.

Do not infer caster ability solely from faction tech.

Support:
- primary/secondary paths;
- rare random paths;
- path growth/empowerment only under explicit rules;
- research skill;
- ritual skill;
- battle casting;
- crafting;
- sacred authority.

## World integration

Magic must touch the strategic map:
- sites;
- ley geography;
- rituals;
- wards;
- summoned armies;
- magical infrastructure;
- terrain/world effects;
- resource extraction;
- magical intelligence.

Avoid making magic merely another combat projectile system.

## Testing

For every major magical feature test:
- locked when research missing;
- locked when caster path missing;
- locked when resource/site requirement missing;
- succeeds when all requirements present;
- deterministic outcome;
- save/load;
- AI recognition;
- counterplay when relevant.

## Performance

Do not rescan every character against every magical discovery every turn.

Cache:
- caster capability indexes;
- unlocked research;
- candidate rituals;
- site/resource eligibility.

Invalidate incrementally when:
- research changes;
- caster changes;
- site control changes;
- relevant resources change.

