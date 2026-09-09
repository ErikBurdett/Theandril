# Resource, development and world-map browser review

Reviewed the exact eight retained PNGs from the final five-flow Chromium run.
The run passed **5/5 in 26.4s** with one Playwright worker; output is
[0039-resource-development-browser.txt](../../../performance/0039-resource-development-browser.txt).
Other functional browser work overlapped briefly, so this is functional evidence,
not a frame-rate measurement.

## Resource art and paid extraction

- [Generated grain deposit](generated-grain-deposit.png): a seed17 Tiny world has
  its actual native Hearthgrain sprite on the claimed tile. Terrain and initial
  resources were generated; only starting-force relocation was authored.
- [Completed worked grange](completed-worked-grange.png): the same tile changes
  to its approved grange sprite after the real 28-coin improvement, worker
  assignment and three completed turns. The native deposit prop disappears.
  Another ordinary turn adds exactly three grain to the realm stockpile.
- [Market ledger](resource-market-ledger.png) and
  [390px resource ledger](resource-market-390.png): all eight resource cards load
  their actual art. The desktop uses two columns, narrow view one; labels,
  quantities and sell actions remain readable without horizontal overflow.
  Selling two grain deducts two stock and credits four coin, then the exact
  campaign hash survives save/reload. Vertical scrolling exposes later resources.

The small, warm grain silhouette and roofed grange remain distinguishable from
the larger hearth center at the captured normal zoom. These screenshots cover
one actual extraction type in the world; all eight runtime bindings and all
eight ledger assets are asserted separately by tests.

## Earned development

- [Acquired hearth branch at 390px](earned-hearth-development-390.png): focused
  prerequisite inspection exposes the acquired Common store and next locked
  level with real costs, recurring upkeep and effects. The focused card retains
  its outline; links only inspect and do not issue orders.
- [Surviving formation training](earned-formation-training.png): actual battle
  survivors spend their three earned experience and eight coin on Field habits,
  retain their casualties and reload the same acquired training. This screenshot
  shows the selected company, spent balance, scope controls and branch directory;
  node cards extend below the first screen and use the dialog's vertical scroll.

The third flow searches the last army in a 100-army fixture through a 20-item
directory, loads only its selected tree and verifies one additional worker query.
The graphs retain explicit branch names, acquired/locked states and costs instead
of relying only on color. The 38 focused character/development tests also pass:
[unit output](../../../performance/0039-development-character-tests.txt).

The later whole-suite run retained an additional
[visible formation branch graph](earned-formation-branches.png). Its scrolled
view shows the acquired Field habits foundation and separate Assault and Line
successors, including prerequisite inspection, experience, coin and effects.
This complements the initial directory screenshot rather than implying every
card fits in one screen.

The focused follow-up also exercises the expanded officer graph:
[all eight marshal nodes](commander-whole-skill-roadmap.png) preserve the three
named branches and expose both advanced third-tier choices. The
[purchased command tree](commander-prerequisite-tree.png) follows real paid
prerequisites through Witnessed assault and preserves save/reload. The
[390px engineer tree](engineer-tree-narrow.png) keeps the acquired workshop card,
its learned prerequisite, spent experience and concrete repair effect legible
within the dialog. Its real refit restores the asserted ten strength.

## Political overview

- [Known realms on desktop](known-realm-political-overview.png) shows both
  contacted realms in their own colors and leaves unexplored land hidden.
- [390px legend](political-overview-390.png) keeps the complete two-realm legend,
 44px controls and realm checkboxes within the actual map bounds. The open legend
  covers part of the map as a temporary overlay; its summary closes it.

Terrain/Realms selection, individual filtering, clear/all and Fit world map
change only renderer presentation. Hash, explored cells, turn, events, command
timing and worker transfer counts remain unchanged through the complete flow.

The later [closed overview at 390px](political-map-390.png) shows both contacted
settlement markers at the whole-world fit with controls below the map. A real
battle transition also passes: the control hides during battle, then restores
the selected Realms mode and own-realm filter after autoresolve.

## Large-hearth tile pages

The final [24-tile first page](mature-empire-24-tile-page.png) and
[last 13-tile page](mature-empire-final-tile-page.png) capture the actual visible
dialog, with its title, paging controls, two-column tile list and selected-tile
facts. The list scrolls within the dialog; the first and last navigation buttons
are disabled at their respective bounds. The earlier full-element capture was
[rejected for clipping outside the scroll container](rejected/mature-land-panel-element-clip.png).

The final evidence rerun passed **1/1 in 7.9s**, after the broader final
land/resource/development run passed **9/9 in 39.5s**. Its explicitly written
[browser transfer report](../../../performance/0039-land-browser-transfer.json)
records all 109 candidate cells, nine page queries across backward and forward
navigation, and no additional query for already loaded tile selections. Full
24-cell pages transfer 178,666–179,363 bytes; the final 13 cells transfer 97,702
bytes. All pages preserve the existing 200,000-byte budget and campaign hash.
The [comparison measurement](../../../performance/0039-land-page-budget.json)
retains the original 64-cell request, which returned 45 rows and 335,098 bytes,
and the oversized full 32-cell alternatives. Canonical query capacity remains 64;
the player's page size is 24.

Review of the [earlier first-page status](rejected/mature-empire-page-status-before.png)
exposed misleading copy: the selected center was on a later page, although the
status called it outside the settlement's known options. The corrected final
image says that the current page has no details and invites choosing a listed
tile. Selection and query behavior are unchanged; 20 focused component/query
tests pass, and the final one-case browser rerun retains all-page access,
unchanged hash and exact transfer measurements.

## Rejected first pass

The [first run](rejected/first-browser.txt) passed all three development flows
but exposed two actual integration defects; neither expectation was weakened.

- [Missing resource art](rejected/missing-resource-art.png): RuntimeArt's live
  allowlist omitted resource and extraction IDs despite published assets. The
  allowlist now derives all eight resource/extraction pairs from canonical content.
- [Unreachable map menu](rejected/world-map-menu-outside-viewport.png): an
  unanchored full-width summary opened its popover above the viewport. The
  control now anchors above camera tools, constrains its opened height to the
  real canvas and scrolls within that available area.
