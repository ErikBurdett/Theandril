# Content Schema Guide

All content is schema validated and referenced by stable IDs.

## ID convention

Examples:

```text
faction.ember_crown
unit.ember_crown.ash_guard
ability.shieldwall
building.market_hall
knowledge.river_navigation
institution.oathbound_vassalage
arcana.warding.circle_of_salt
event.border_dispute.001
character.ember_crown.marshal_vaelor
```

IDs are data keys, not player-facing localized names.

## Unit definition

Recommended fields:
- id
- localization keys
- tags
- role
- tier
- recruit requirements
- costs
- upkeep
- strength/manpower
- attack profiles
- defense/armor/resistance
- range
- mobility
- morale
- discipline
- initiative
- supply
- terrain modifiers
- abilities
- upgrades
- art/icon references
- AI role weights

## Faction definition

- id
- display/localization
- heraldry
- starting preferences
- culture/ancestry mix
- government
- traits
- roster unlocks
- unique units
- unique structures
- progression affinities
- diplomacy personality
- AI agenda
- character pool
- event pool
- visual theme
- lore references

## Events

An event should declare:
- trigger;
- scope;
- cooldown;
- weight;
- conditions;
- visibility;
- text keys;
- choices;
- deterministic effects;
- AI evaluation hooks;
- follow-up chains.

Do not hard-code narrative event logic in UI components.

## Balance

Store balance values in content definitions/config where possible.

Simulation owns formulas.

Content owns parameters.

Tests should detect:
- missing references;
- impossible prerequisites;
- cyclic upgrades;
- negative costs unless explicitly allowed;
- units with invalid roles;
- events with no valid choice;
- duplicate IDs.
