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

Screen-sized strategic markers can overhang their canonical hex. Pick their
actual rendered bounds in painter order and carry the entity identity through
inspection; clicking a displaced friendly or foreign badge must not silently
become a movement order for an already selected army. Keep deliberate movement
and append-waypoint inputs intact. Verify co-located town/garrison markers,
foreign inspection, and zoom transitions through actual pointer input.

Default panels show the few values needed for the current decision.

Detailed formulas belong in expandable tooltips/inspection views.

Do not hide important consequences.

For development trees, retain bounded rotating candidates in AI observations, but
set `developmentCandidates: false` for player worker summaries. The UI uses only
the faction tree and selected-subject queries; computing/transferring unused AI
trees wastes both CPU and the startup packet budget. Preserve the same canonical
quotes and default AI observations when choosing this lighter read model;
request detailed costs for only the selected hearth or formation using
`getDevelopmentEntity` and the worker's `developmentQuery` protocol. Keep a single
detached result keyed by scope, entity ID, canonical hash and campaign epoch. Hide
old purchase actions during render when that key changes; consume superseded query
errors separately from command errors. `use-development-query.ts` covers reversed
responses, same-turn spending, reload and worker failure. Do not build every tree
for all companies just to display a subject directory.

Show the authoritative costs, acquired/excluded/dormant states, real effects and
prerequisite links. Prerequisite inspection changes focus without issuing commands.
The directory can paginate existing entities without limiting campaign entities;
verify access to the last army of a large fixture, keyboard subject tabs, and a
390px layout. Retain the active entity and discard its prices after paid commands.

A land tile selection may locate a paginated quote window, but selecting another
tile already present in that ready window must reuse its existing request key.
Only reuse within the same settlement, canonical hash, campaign epoch and page
request; explicit pagination, uncached cells and pending replies require their
own request. Verify query counts through real repeated tile clicks and compare
the displayed quote hash with the current worker hash in one browser evaluation,
so an asynchronous command cannot turn a valid refresh into a stale test target.

Player land detail pages request 24 cells; the canonical query maximum remains
64 for other consumers. With the eight extraction choices, the 32-town fixture's
full 32-cell pages cost about 238 KB, while 24-cell pages cost at most 180 KB.
Measure every page against the existing 200 KB player-detail budget, including
the selected-cell anchor, all-page navigation and repeated loaded-cell selection;
testing only a short final page can hide oversized earlier pages.
Missing selected-tile details in a paged response do not imply missing ownership,
knowledge or eligibility. State that the current page has no details and offer
a listed tile; do not turn a paging boundary into a territorial refusal.

Map-lens menus must fit the actual canvas, whose height changes with the command
bar and mobile toolbar. Anchor the trigger above camera controls and constrain
the opened menu to that canvas; a viewport-only limit can still clip it. Keep
overlay controls at least 44px high and let the menu scroll. Political filters
consume only permitted faction data and call renderer presentation methods;
verify unchanged campaign hash, fog, commands and worker transfer counters.

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
