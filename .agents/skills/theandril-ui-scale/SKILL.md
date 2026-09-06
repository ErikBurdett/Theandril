---
name: theandril-ui-scale
description: Use when building strategic UX, empire management, registries, alerts, map lenses, army/settlement automation controls, search, keyboard workflow, accessibility, or any UI that must remain usable with huge factions and hundreds of armies.
---

# Theandril Giant-Empire UX

The interface must become more efficient as the empire grows.

## Exception-driven management

The player should spend attention on:
- wars;
- frontier decisions;
- crises;
- important battles;
- unusual settlement problems;
- diplomacy;
- major characters.

Routine work should be delegable.

## Required large-scale patterns

Use:
- sortable/filterable army registry;
- sortable/filterable settlement registry;
- character registry;
- diplomacy ledger;
- war/front overview;
- multi-select;
- theater assignment;
- order templates;
- production templates;
- rally points;
- settlement governor policies;
- army automation;
- notification severity;
- map search;
- saved locations;
- map lenses;
- next-action shortcuts.

## Alerts

Alerts should answer:
- what happened?
- where?
- why does it matter?
- what can I do?

Group repeated low-severity events.

Do not show 73 separate popups for 73 settlements completing routine buildings.

## Selection

Support:
- click;
- box/drag or practical multi-select where appropriate;
- shift-add;
- registry-to-map jump;
- map-to-registry selection;
- army group selection.

## Progressive disclosure

Default panels show the few values needed for the current decision.

Detailed formulas belong in expandable tooltips/inspection views.

Do not hide important consequences.

## Keyboard

Provide efficient shortcuts for:
- end turn;
- next alert;
- next idle army;
- next idle settlement;
- search;
- map lenses;
- army stance;
- common camera navigation.

Keybinds must be remappable.

## Accessibility

Never encode:
- faction ownership;
- diplomacy state;
- danger;
- resource rarity

using color alone.

Critical strategic information rendered on canvas should have an accessible DOM representation or inspector when feasible.

## Testing

Create Playwright flows with a mature fixture containing:
- 100+ armies;
- dozens of settlements;
- multiple wars;
- many notifications.

Verify that the user can locate and resolve a problem without cycling through every entity.

