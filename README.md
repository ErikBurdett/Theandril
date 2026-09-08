# Theandril

A browser-native dark-fantasy 4X, under active development. This checkout now contains the first campaign implementation. It is **not Theandril 1.0**; see [implementation status](docs/IMPLEMENTATION_STATUS.md) for the actual release gaps.

## Run locally

Play the [hosted development demo](https://erikburdett.github.io/Theandril/). Updates pushed to `master` automatically build, smoke-test and publish through GitHub Actions. This is the current single-player/AI-watch development game, not a 1.0 release or an online multiplayer server. See [deployment and recovery](docs/DEPLOYMENT.md).

Saves stay in the browser where you play. To bring a localhost campaign to the hosted game, export its `.theandril` file locally, then import it on the hosted site. Those sites do not share browser storage.

Requires Node 22.12+ and pnpm 10.32.1.

If pnpm is not installed, use `npm exec --yes --package=pnpm@10.32.1 -- pnpm install --frozen-lockfile` to bootstrap dependencies, and `npm exec --yes --package=pnpm@10.32.1 -- pnpm dev` to start this checkout.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local Vite address, choose a seed, world size, faction count and player culture, and begin a campaign. Size changes suggest 4/12/24/32/40 seats. New campaigns use roster version 4: all twenty-four authored cultures are available, with distinct definitions used before any repeated seats. Campaigns with 24 or more realms include all 24 cultures; additional seats inherit those cultures rather than becoming new identities. Each culture has explicit biome benefits, drawbacks and cultivation targets; generated starts prefer suitable existing sites without rewriting the physical world. Select the hearth caravan to found a settlement. Select the settlement to build or recruit. Click an army, then a highlighted hex to move along its known route within the current movement budget; hover previews the path and cost. Clicking a reachable hostile army approaches and attacks, without declaring war automatically. Click stacked friendly armies to cycle selection; dragging pans, and Escape clears selection. End turn resolves the economy and AI orders. Manual saves and three rotating autosaves use IndexedDB. Exported campaigns use the compressed `.theandril` format.

The [Vesper Court](docs/lore/FACTION_BIBLE.md#22-vesper-court--registered) includes genuine vampiric patrons and living valley households, not merely vampire-themed clothing. Its implemented economy gains one knowledge on worked temperate forest and one coin on worked taiga, with food penalties in desert and coin penalties in ash scrub. Paid cultivation can establish forest or taiga on eligible claimed land; recruitment preferences favor costly heavy retainers and mounted escorts using the same recruitment, upkeep, refit and transport rules as other cultures. Blood dependence and disputed provisions belong to the lore: feeding, life-steal, resurrection and night bonuses are not implemented systems.

The campaign map fills the space between the treasury/navigation bar and the bottom command tray. Floating **Armies & fleets**, **Settlements**, **Characters**, **Research**, **Diplomacy** and **Campaign journal** buttons open their actual management windows. The army and settlement registry supports search, filters and paging; choosing an entry returns you to that location on the map. **Show selected orders** opens the full management window for the current selection. Close a window or press Escape to return to the map; dialogs keep keyboard shortcuts from issuing accidental orders.

Click a nearby army, settlement or tile to open a floating **Map orders** inspector. **At this location** distinguishes armies sharing a hex, its settlement and the land beneath it. Army popups are compact: **Plan route**, **Battle orders** and **Transport** reveal the relevant controls on demand; composition and officers have their own tabs. Town popups retain construction, recruitment and tile work. **Move on map** closes the inspector while retaining the army for destination clicks; Escape first closes the inspector, then clears selection. Keyboard users can press Enter on the focused map or use **Open map actions**. **Open full orders** opens the same selection in a larger window. **Map guide** explains the controls and can hide the selection tray; **Map click menus** in Campaign & settings disables automatic popups without removing the explicit action button. Dragging and scrolling still navigate the map without issuing orders.

The map inspector's **Diplomacy** tab keeps encountered-faction war and peace controls available without opening the realm-wide window. Foreign and uncharted tiles never grant building or army-management authority.

With a settlement selected, click a surrounding map hex or use **Select tiles** to inspect its land. The floating **Land & tiles** tab puts the selected tile's real actions and prices first; the full orders window retains the complete settlement overview. The center works automatically; assign up to six population-supported workers to claimed tiles. Population 1–2 is a colony, 3–7 a settlement, and 8+ a city, increasing claim reach from one to three hexes. **Designate capital** is a separate paid choice, not a fourth population stage. Outer realm borders mark ownership; the selected town's land inspector identifies its own claims without drawing an ambient internal grid. They allocate worked land and improvements, not military access rights.

Tile inspection explains biome, natural features, culture affinity, improvements and their positive or negative yield effects. Build fields, woodlots, quarries, reedworks or shallow-water fisheries on legal sites. **Cultivate biome** adapts a claimed land tile to one of your culture's traditions. Work is paid upfront and takes active turns; distance, completed faction works and off-affinity ground raise costs. Each town has one land-work order, separate from its building queue. Siege and occupation pause it; cancellation or capture gives no refund. Captured improvements survive, while razing removes them and releases claims. Cultivated biomes persist. Cultivation does not change physical relief, water depth or movement, and fog keeps rival changes last-seen until observed again.

Large empires publish compact town summaries; selecting a town requests its complete current tile details. Loading and retry states keep outdated prices from becoming actionable. Selecting another tile in the same town reuses its details, while paid orders, save loads and campaign changes invalidate them. Map updates transfer packed observed-cell deltas without changing fog or saved geography.

An unled army commands twelve formations. A healthy attached marshal commands sixteen; earned **Muster rolls** and **Field orders** raise that to eighteen and twenty. Recruit companies, gather them on the same hex and open **Army composition** to merge, transfer or split checked formations into a named detachment. The slowest formation sets movement, the best scout sets sight, and upkeep adds across the roster. Losing the commander preserves every formation but limits an oversized army to one movement until a replacement or reorganization restores command. Reorganizing never restores movement or losses. Nearby map armies show one figure for a single formation, two for two–five, and three for six or more; inspect the roster for exact composition. Co-located friendly forces share one representative group and a small ×N army count; the selected army is shown, otherwise the largest. Click repeatedly to cycle the separate armies, without merging their rosters. Fleets group separately and count their hull formations, without drawing embarked passengers again. Far zoom keeps compact faction badges.

Open **Appoint characters & officers** at an owned town to appoint a named Hearth marshal, Road witness, March engineer, or Waykeeper. **Characters & agents** opens a searchable, paginated roster with assignments, mission costs and blockers, recovery and earned skill branches. Specializations are exclusive; later prerequisite-based command, battlecraft and field-work nodes can be combined. Purchases spend experience, not a resettable level counter. An army supports one marshal and two agents; attachments normally require the same hex, with fleet officers also able to board from an adjacent owned harbor for one fleet movement. Marshals add leadership and can **Rally** active formations once per battle. Surveyors chart remembered terrain without revealing hidden armies; engineers refit surviving formations or sabotage a besieged town. Missions cost coin and hold the carrier for two turns; cancellation or hostile interruption gives no refund. Sabotage can wound its engineer. Experience, learned skills, wounds, deaths and battle testimony survive saves. AI uses these same commands. Waykeepers are the first paid caster role; their Flame/Rune aptitude is separate from national Arcane Theory and they occupy an agent slot. They currently have no experience skill tree. Further casters, covert agents, offices and full character politics remain unfinished.

For sea travel, research **Coastal navigation**, build a **Charter harbor** in a coastal settlement, and recruit ships from its naval list. Each transport formation carries eight land formations: a full twenty-formation army needs three transport hulls. Put the land army on a shore next to your fleet and use **Embark**. Select the fleet to sail; passengers move with it and cannot act or scout independently. **Ocean navigation** plus ocean-capable hulls in *every* fleet formation unlock deep water; Coastwatch galleys stay in shallow water. Use **Disembark** onto an adjacent visible, unoccupied shore. Boarding uses all passenger movement and one fleet movement; landing uses one fleet movement and passengers wait until the next turn to move. Destroyed transport hulls can drown excess passengers, and a sunk fleet loses all cargo and its attached officers. Fleets fight other fleets through the normal manual/autoresolve battle system; land assaults require landing first. All twenty-four playable cultures have independently approved transport, galley and warship sprites: 72 distinct hull assets. All hulls are static southeast poses; full directional/action animation remains unfinished.

For longer travel, click a known destination and choose **Queue route**. Shift-click or enable **Add waypoint mode** to extend the order. **Destination hex → Review route** provides a keyboard/touch alternative. Queues spend available movement immediately and continue after turn refresh; new hostile sightings, blocked passages, combat, composition changes and displacement pause them for review. The army registry marks active/interrupted orders and distinguishes ashore, fleet and embarked forces; **Resume route** replans safely, and **Cancel route** stops travel. Queues survive saves and never automatically attack. Routes are limited to 256 hexes/eight waypoints and explored geography permitted to that army or fleet; a bounded search may require a closer destination.

Use **Next army needing orders** (N) or **Next idle settlement** (S) to jump directly to a decision; Shift selects the previous entry, and arrow buttons provide the same controls on touch screens. The cycle clears registry filters and centers the selection without issuing orders. Active journeys, siege duty, embarked troops and stationary missions are skipped; paused routes still need review. Towns qualify only when their production queue is empty and a real production order is available. Remap the three letter shortcuts in **Campaign & settings**; valid, distinct bindings persist in this browser independently of campaign saves. Typing, dialogs and busy/locked campaigns do not trigger navigation.

New maps distinguish twelve climate biomes, including ash scrub and chalkland, from the five physical terrain classes. Biomes and natural features contribute land yields; physical terrain still governs movement. All twenty-four playable cultures have distinct troop, character, settlement, heraldry and naval kits selected by actual faction definition, including repeated seats: 432 qualified faction assets, 18 per culture. The published pack contains 506 approved assets / 569 frames; five researched-site improvements still use distinct procedural map glyphs rather than finished sprites. Native UI icons appear in recruitment, army composition, character controls and diplomacy; far-view armies use grouped faction badges. The setup's culture selector changes the actual player seat; public culture reference cards do not reveal hidden enemies. Development builds include **Art Lab** for native previews, animation, atlas rectangles and QA. The [art factory guide](docs/art/README.md) explains processing and review; [coverage](docs/art/ASSET_CATALOG.md) separates 489 actual map/UI/battle/fallback bindings from 17 future-only assets. Each biome has three deterministically placed tile designs: its retained base plus two independently generated variants. Five Blender-authored battlefield effects and the shared Waykeeper cast have eight-frame one-shot clips. The qualified Ashen scout has a genuine four-frame idle loop; the other 431 faction assets remain static. All 506 native approvals are published. In-game review now covers all 24 cultures' units and settlement stages, all 72 hulls, strategic views, public crests and narrow controls; the related faction, roster, naval, UI and character browser scenarios passed. [Retained galleries and acceptance scope](docs/art/FACTION_ASSET_CATALOG.md#current-in-game-review) include Vesper's actual paid economy. This does not imply 24 distinct supernatural rule systems. Full directional/action animation, biome-transition production and game 1.0 signoff remain unfinished.

Start a new campaign to use generator 7. **World layout** selects Continents (unequal mainlands and offshore islands), Islands (several larger island realms), or Archipelago (curved chains of differently sized islands). Every layout includes offshore satellite groups, with branching coasts, bays, peninsulas, mountain saddles, larger mainland-relative enclosed inland seas, freshwater mountain lakes and connected rivers draining to salt water where the terrain supports them. Ocean moisture, mountain rain shadows, altitude and freshwater corridors influence the existing twelve biomes. Freshwater affects natural-feature yields; rivers do not yet impose bridge or crossing penalties. Old saves, including generator5/6 campaigns, preserve their original geography and recorded history without gaining invented rivers or a different climate.

Scroll down or use **Zoom out** all the way to fit the entire world inside the map window. Distant zoom switches to a lightweight cartographic view; **World overview** goes directly to the same fit. Zoom back in continuously, or click a location and **Focus selection** to return to its detailed map. Overview clicks inspect locations, not issue movement orders. Unknown land remains hidden unless you explicitly reveal an AI-watch spectator map.

Your settlements gradually survey roads to an older nearby owned settlement across known passable land. Road work is separate from production and tile construction. Open **Road connections** in a settlement's land panel to see completed segments and the next work front; **Hasten road** spends the quoted crowns (treasury coin) to complete that segment immediately. Hills require four active turns per segment, forest three, and plains two; longer connections increase the hiring price. Both ends of the current segment need sight, so escort workers beyond town sight. Siege, occupation, foreign claims and blocking foreign armies pause work. Completed road segments remain after conquest or razing and cost one movement point to traverse, including queued journeys. The map draws completed connections at local zoom; distant overview omits them for clarity.

When foreign forces come into sight, declare war from the encountered factions list and attack with an adjacent army. Choose tactical orders or autoresolve; both use the same battle rules. Besiege neighboring enemy settlements, maintain the blockade to reduce defenses, then assault and choose occupation, sack, raze or context-legal liberation. Ruins can be resettled by a caravan. Capture choices show their persistent economic consequences and can be saved before deciding.

Field battles, siege assaults and naval engagements open a simple formation battlefield. It shows one sprite per actual formation, its remaining strength, and attached officers; transported passengers are not extra naval combatants. Choose **Watch battle**, pause, change playback speed, or **Step one battle round**. Tactical orders and **Auto-resolve** use the same deterministic kernel. Open **Formation details & round account** for the full roster and round ledger. **Watch recorded battle actions** replays the latest retained participant battle without changing the campaign; loading restores the current battle, not unrecorded past animations.

Abilities are automatic by default. While paused, use the per-source controls to disable automatic use, choose a legal target and trigger the ability yourself. Oath guard can set shields; marshals rally morale. To cast spells, appoint and attach a **Waykeeper**, build a functioning **Witness archive**, then open **Realm progression → Arcane Theory** and purchase **Contained ember projection** or **Measured rune binding**. Both national discovery and personal aptitude are required. **Cinder thread** damages an enemy formation; **Bound ward** absorbs damage to an ally. Costs, remaining uses and strain are enforced equally for manual and automatic casting. These two spells are a playable foundation, not the full planned magic system.

Use **Negotiate peace** to review a coin payment and binding truce. Offers to AI are considered on End turn; incoming offers can be accepted or rejected. Coin is transferred only on acceptance, and unfundable terms display a blocker. New campaigns use save schema 14, rules version 14 (new tactical battles use battle rules 9) and independently versioned roster 4. Saves preserve culture identities, geography, hydrology and remembered roads alongside claimed/worked land, civic growth, cultivation, armies, characters, fleets, wars and progression. Historical roster versions 1–3 retain their original 4/6/12 definitions; loading an older campaign does not insert the new cultures or regenerate its geography. Archive format 2 retains historical recorded orders/checksums under their explicit rules/save versions, including genuine schema-13 field/siege battles and pre-expansion schema-12 generator-7 campaigns, pre-territory naval campaigns and earlier mixed-battle archives. Pre-expansion save formats reject new-roster/new-culture payloads instead of silently discarding them.

Open **Realm progression** to spend knowledge on technology and choose separate permanent institutions and military doctrine. The first victory path, Prosperity, requires three unoccupied towns with markets and archives, Civic accounts, an institution, and a funded Hearth Exchange. Its public host can be besieged to pause progress or conquered to cancel it. Other intended victory paths are not implemented yet.

Choose **Standard** campaign pace for hundreds of turns; Long and Epic raise late economic commitments and give opponents a longer project response window. The richer worked-land economy has modern Standard/Long/Epic project commitments of 18,000/80,000/240,000 coin; Epic retains 60 active response turns. Historical rules retain their original prices. There is no minimum-turn victory lock, and conquest can still earn an earlier finish. The AI compares observed threats and supporting towns when choosing its project host. Short is explicitly a test/skirmish profile. Pace does not yet change AI strength or provide the full planned difficulty system. The intended 1.0 game should remain strategically engaging for hundreds of turns, potentially around 1,000 at higher difficulties; duration alone does not satisfy that design goal.

Choose **AI watch** to let all factions play through the same rules. It begins paused; resume or step one round, and pause whenever needed. Victory automatically opens **Campaign chronicles**, with a chaptered History tome and a separate technical ledger. Both can be downloaded. The technical JSON preserves the initial snapshot, every submitted command/result, events, tactical reports and replay checkpoints; the tome chronicles recorded events without inventing earlier history. Full archives survive save/load and compressed export. Imported older raw saves explicitly label history as partial. All-faction logs are revealed only after victory, not as mid-game intelligence.

While watching, use **Reveal spectator map** / **Restore fog of war**, or run this in the browser's developer console:

```js
await window.theandril.toggleFogOfWar()
```

`await window.theandril.setWatchFog(false)` explicitly reveals the map; `true` restores faction sight. These controls pause AI watch so you can inspect the result; resume when ready. They work in development and production, only in an active AI-watch campaign. They never change AI knowledge, campaign saves, orders or technical history; loading or replacing a campaign restores fog. The revealed map exposes public map identities and representative formation counts, not private army rosters or character missions.

Local DB2 saves append new history chunks instead of re-encoding the full campaign on every turn. Retained generations share verified immutable history with three payload replicas and atomic recovery. Existing DB1 saves still load; portable exports keep the same complete format. The 64 MiB logical archive limit remains explicit, and large current snapshots/full exports still have measurable costs. See [storage measurements](docs/performance/0009-incremental-storage.md).

```sh
pnpm typecheck
pnpm lint
pnpm content:validate
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:gameplay
pnpm test:production # run after pnpm build; uses the actual production bundle
pnpm bench
pnpm bench:chronicles
pnpm bench:characters
pnpm bench:storage
pnpm art:validate
pnpm bench:art
```

To use a locally installed Chromium for gameplay tests, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Benchmarks print deterministic campaign hashes and actual measurements; [performance notes](docs/PERFORMANCE.md) identify fixture limitations.

For continued agent development, the repository-local [Unlazy skill](.agents/skills/unlazy/SKILL.md) defines `/unlazy` / `$unlazy`: implement a complete playable slice, verify it, record the evidence and continue within the authorized task. It does not launch background jobs or imply permission to publish or deploy.

## Original build handoff

This package is intended to be copied into the root of the Theandril repository and handed to GPT-6 Astra as the standing build brief.

## Recommended stack

- **Language:** TypeScript, strict mode everywhere.
- **Workspace:** pnpm workspaces + Turborepo.
- **Web shell/UI:** React + Vite.
- **2D strategic renderer:** PixiJS v8.
  - Production default: WebGL.
  - WebGPU may be exposed behind an opt-in feature flag after benchmark and compatibility tests.
  - Do not make the strategic map React-rendered. React owns menus/panels/HUD; Pixi owns the canvas.
- **Simulation:** pure/headless TypeScript package, deterministic, no DOM access.
- **Single-player execution:** dedicated Web Worker.
- **AI planning:** worker pool using immutable/read-only snapshots and validated command proposals.
- **Local persistence:** IndexedDB via Dexie.
- **Online multiplayer:** Colyseus authoritative server, using the same shared simulation package.
- **Validation:** Zod for external/content boundaries.
- **State/UI:** Zustand or equivalent small UI-only store; never make it the canonical simulation.
- **Testing:** Vitest + Playwright + fast-check/property tests.
- **Server persistence if cloud features are enabled:** PostgreSQL + Drizzle ORM.
- **Observability:** structured logs, deterministic replay logs, browser performance counters.

## Install the official PixiJS Agent Skills

PixiJS maintains an official Agent Skills collection. Install it in the development environment alongside the Theandril-specific skills in this package:

```bash
npx skills add https://github.com/pixijs/pixijs-skills
```

If the installed skill set conflicts with repository-specific Theandril instructions, the repository instructions and current user request win.

## Handoff

1. Copy this package into the repository root.
2. Keep `.agents/skills/**` exactly where it is so agents can discover the repository-scoped skills.
3. Give Astra `BOOTSTRAP_PROMPT.md` as the first message.
4. Astra should read `MASTER_PROMPT.md`, `AGENTS.md`, `ARCHITECTURE.md`, `GAME_1_0_SCOPE.md`, and `DEFINITION_OF_DONE.md`.
5. Astra should also read `docs/RESEARCH_MAGIC_SYSTEMS.md` before implementing progression, factions, characters, combat magic, rituals, or research AI.
6. Astra should immediately inspect the repository, create/update `docs/IMPLEMENTATION_STATUS.md`, then begin implementation.
7. The project is not complete because a prototype exists. The release target is the `1.0` gate in `DEFINITION_OF_DONE.md`.

## Design philosophy

Theandril should feel enormous without simulating every grain of wheat or every soldier as an independent actor. It gets scale by using the right abstraction at each zoom level:

- the world is tile/chunk based;
- strategic administration is settlement/region based;
- military movement is army/fleet based;
- armies contain unit formations rather than thousands of individual soldier entities;
- battles expose a compact formation battlefield for tactical choices;
- distant map visuals collapse into cached/aggregated layers;
- AI plans hierarchically rather than brute-forcing every possible action.

The result should be a serious, deep browser 4X rather than a reduced mobile-style interpretation of one.

## Originality requirement

Theandril may draw high-level inspiration from tabletop dark fantasy and established 4X conventions, but all lore, setting names, characters, factions, visual designs, flavor text, exact mechanics, spell names, stat blocks, UI art, and narrative content must be original. Do not copy Dungeons & Dragons settings or Civilization VII proprietary content.

Classical fantasy concepts with broad folkloric roots—humans, elves, dwarves, goblins, orcs, dragons, undead, witches, giants, spirits, etc.—may be used in original ways.
