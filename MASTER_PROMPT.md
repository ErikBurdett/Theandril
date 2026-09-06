# THEANDRIL — MASTER BUILD PROMPT FOR GPT-6 ASTRA

## 0. Mission

Act as the technical director, lead game engineer, systems designer, AI engineer, UX engineer, performance engineer, content-system designer, and release owner for **Theandril**.

Theandril is a **browser-native, turn-based, grand-scale 4X dark-fantasy strategy game**. It should combine the readable empire-building loop of a Civilization-style game with the geographic scale, faction density, political texture, military fronts, and strategic storytelling associated with grand-strategy games.

This is an implementation assignment, not merely a planning exercise.

Build toward a polished, playable, base-feature-complete **1.0**. The repository itself is the product. Documents are supporting artifacts, not substitutes for working systems.

When a requirement is underspecified:
- infer the player-facing intent;
- choose the simplest architecture that can safely scale to the stated 1.0 targets;
- prefer reversible, data-driven decisions;
- implement and validate rather than stopping for routine clarification.

Ask the user only when a decision is truly product-defining and cannot be safely reversed, or when authorization is needed for a destructive/external action. Otherwise proceed.

## 1. Product fantasy

The player rules a faction in the original dark-fantasy world of **Theandril**, competing against dozens of major and minor powers across giant continents, archipelagos, inland seas, mountain chains, river basins, frontier wilderness, haunted ruins, ancient roads, monster domains, and contested borderlands.

A campaign should support stories such as:

- founding a frontier settlement beyond the known map and watching it become a fortified city;
- discovering a lost river valley and racing another kingdom to settle it;
- starving an invasion by cutting its supply route instead of winning a direct battle;
- persuading three rivals to join a defensive league against an expansionist empire;
- installing a sympathetic ruler in a minor realm;
- sacking an enemy capital, carrying off wealth and relics, and leaving it devastated;
- razing a hated fortress and later resettling the site under a new culture;
- governing a multi-ancestry empire whose provinces have different loyalties and traditions;
- promoting an obscure captain into a famous field marshal;
- sending spies, envoys, scholars, priests, occultists, explorers, and governors on missions;
- commanding hundreds of strategic armies without needing to click every unit every turn;
- intervening personally in a decisive battle while allowing routine battles to resolve automatically;
- winning through conquest, prosperity, political hegemony, cultural legacy, or arcane mastery.

The game must preserve the fantasy of **scale + agency**.

## 2. Originality and IP boundary

Dungeons & Dragons is mood/inspiration only. Civilization and grand-strategy titles are genre references only.

Do not copy:
- protected setting names;
- named D&D worlds, gods, monsters unique to those settings, characters, factions, spells, exact stat blocks, narrative text, or artwork;
- Civilization VII art, UI, terminology where distinctive, leader content, civilization content, exact balance data, or proprietary text;
- copyrighted map art or scraped game assets.

Create original:
- world history;
- cosmology;
- factions;
- religions;
- cultures;
- institutions;
- magic;
- character names;
- visual language;
- mechanics terminology;
- icons and UI treatments;
- event writing.

Broad folkloric fantasy ancestries and creatures may be reinterpreted originally.

## 2A. Explicit strategy-game inspiration baseline

Use the following games/mods as **mechanical and structural inspiration**, never as a source of copied content:

### Dominions 6
Theandril should learn from Dominions 6 especially in:
- extreme faction asymmetry;
- nations having fundamentally different magical access rather than merely differently colored spell lists;
- individual mages/priests/occultists having personal magical aptitudes;
- the distinction between **what a faction has researched** and **what a specific caster is actually capable of using**;
- multiple magical traditions/paths intersecting with multiple research schools;
- battle magic versus strategic/world rituals;
- magical resource economies;
- summoning;
- magical item crafting;
- site searching and hidden magical geography;
- rare high-tier rituals that can change warfare or world conditions;
- supernatural units and commanders;
- national/faction-exclusive spells and rituals;
- counter-magic, dispelling, wards, resistance, and anti-magic;
- research strategy being a meaningful national build decision rather than a linear unlock ladder.

Do **not** reproduce Dominions' exact schools, paths, spells, gem names, numerical balance, UI, or terminology. Reinterpret the structural ideas into original Theandril systems.

### The Forgotten Realms — Total Conversion Mod for Dominions 6
Use it as high-level inspiration for:
- putting many radically different fantasy states, cultures, subterranean powers, city-states, cults, monster realms, and conventional kingdoms into one coherent grand-strategy world;
- giving recognizable fantasy archetypes strategic depth at the nation level;
- making geography and lore materially affect military, magical, political, and economic play;
- supporting surface, island, underground, hostile-environment, and unusual faction identities;
- faction-specific commanders, magical traditions, troops, summons, heroes, and strategic tools;
- letting lore-rich asymmetry create replayability.

Theandril must **not** copy Forgotten Realms names, places, factions, deities, spells, monsters unique to that setting, unit rosters, lore, text, artwork, maps, or mod content. The result must be a separate original world.

### Civilization-style 4X
Use as inspiration for:
- readable empire development;
- settlement growth;
- research planning;
- diplomacy;
- exploration;
- victory paths;
- strong UI feedback.

### Grand-strategy games
Use as inspiration for:
- map scale;
- geopolitical density;
- fronts/theaters;
- claims and diplomacy;
- vassals;
- strategic geography;
- many simultaneous actors;
- empire-scale registries and automation.

The final game should feel like **Theandril**, not a mash-up or reskin.

## 3. Non-negotiable technical architecture

Use this stack unless a measured prototype proves a specific substitution materially better:

### Workspace
- TypeScript in strict mode.
- pnpm workspace.
- Turborepo for task orchestration/caching.
- ESM-first.

### Applications
- `apps/web`: React + Vite application shell.
- `apps/server`: Node server for online multiplayer/cloud features.
- optional `apps/tools`: internal content/map/debug tooling if it materially improves production.

### Strategic renderer
Use **PixiJS v8** directly for the strategic map.

React owns:
- menus;
- panels;
- dialogs;
- HUD;
- tooltips;
- accessibility DOM;
- keyboard-command surfaces.

Pixi owns:
- terrain;
- borders;
- roads;
- rivers;
- settlements;
- armies/fleets;
- fog;
- map labels that need world transforms;
- map effects;
- selection/hover overlays.

Do not render the giant strategic map as React components.

Default to WebGL for production. Permit WebGPU only behind a capability/feature flag until compatibility and performance tests prove it safe on supported browsers.

### Simulation
Create `packages/sim` as a pure, deterministic, headless TypeScript engine:
- no React;
- no Pixi;
- no DOM;
- no localStorage/IndexedDB imports;
- no network dependency;
- no wall-clock dependence in gameplay rules.

The same simulation must run:
- in a browser Web Worker for single-player;
- in the authoritative Node process for online play;
- in unit/property tests;
- in headless benchmarks;
- in replay verification.

### Command boundary
Players and AI never mutate simulation state directly.

All gameplay changes occur through validated commands, for example:

```ts
type GameCommand =
  | MoveArmyCommand
  | FoundSettlementCommand
  | SettleCaptureCommand
  | SetProductionCommand
  | RecruitUnitCommand
  | ProposeTreatyCommand
  | RespondToTreatyCommand
  | DeclareWarCommand
  | AssignCharacterCommand
  | StartAgentMissionCommand
  | ChooseResearchCommand
  | ChooseTraditionCommand
  | TacticalBattleOrderCommand
  | EndTurnCommand;
```

The simulation:
1. validates a command;
2. resolves it deterministically;
3. emits typed domain events;
4. updates canonical state;
5. produces deltas/read models for clients.

AI must use these same command APIs.

### Determinism
Use:
- seeded PRNG with explicit stream ownership;
- stable iteration order;
- integer/fixed-point quantities for gameplay values where floating-point drift could matter;
- canonical serialization;
- stable IDs;
- deterministic command ordering.

A save reloaded at turn N and replayed with the same commands must produce the same state hash.

### Persistence
Use Dexie/IndexedDB for local:
- manual saves;
- autosaves;
- scenario saves;
- replays;
- campaign metadata;
- settings.

Support:
- versioned save schema;
- migrations;
- compressed export/import as a `.theandril` save;
- campaign thumbnails/metadata;
- content/version hash;
- recovery from interrupted autosave.

For online games, the server is authoritative and persists snapshots + command/event history.

### Networking
Use Colyseus for 1.0 online multiplayer:
- authoritative rooms;
- lobby/match discovery or invite codes;
- reconnect;
- validated commands;
- AI slots;
- save/resume;
- 2–8 human players on a campaign;
- simultaneous planning mode for humans;
- deterministic resolution on the server.

Never trust client state for authoritative multiplayer.

### Tests
Use:
- Vitest;
- Playwright;
- fast-check or an equivalent property-testing tool;
- deterministic benchmark fixtures.

## 4. Scale model

Do not achieve scale by giving every citizen or soldier a continuously updating object.

Use hierarchical abstractions.

### World
The world uses a chunked **hex grid**.

Required presets:
- Small: roughly 32k–50k land/water cells.
- Standard: roughly 80k–120k cells.
- Huge: roughly 160k–220k cells.
- Legendary/stress: roughly 250k–350k cells.

Exact width/height may vary by aspect ratio and wrap settings.

Use chunk sizes selected through profiling (start around 32×32 or 48×48 logical cells).

Maintain higher-level geography:
- continent;
- subcontinent;
- sea;
- region;
- basin;
- province/administrative area;
- strategic chokepoint;
- settlement hinterland.

Systems should usually reason at the coarsest level that preserves player choice.

### Factions
1.0 content target:
- at least **24 fully authored major factions**;
- at least **48 minor/independent powers** or robustly authored templates producing equivalent variety;
- at least **12 major ancestry/cultural families** across the roster;
- enough procedural minor powers, monster domains, free cities, cult enclaves, nomad hosts, and frontier communities that giant maps do not feel empty.

A campaign should be configurable up to approximately:
- 32–48 major factions;
- 80–150 minor/independent powers.

### Military
The strategic entity is the **army**, not the individual soldier.

An army contains:
- commander;
- 1–12 unit formations/regiments by default;
- manpower/strength;
- morale;
- fatigue;
- supplies;
- movement state;
- stance;
- experience;
- baggage/siege assets where relevant.

A late campaign must remain usable with **hundreds of armies per large empire** and thousands of armies world-wide.

Build army automation:
- theater assignment;
- rally points;
- defend-area order;
- patrol;
- escort;
- raid;
- reinforce-front;
- suppress-revolt;
- exploration;
- reserve stance;
- commander autonomy setting.

The player can always override an automated army.

### Characters
Characters are sparse, important entities—not one entity per citizen.

Roles include:
- ruler;
- heir;
- claimant;
- marshal;
- admiral;
- governor;
- steward;
- diplomat;
- spymaster;
- envoy;
- explorer;
- scholar;
- priest;
- occultist;
- engineer;
- champion;
- mercenary captain.

Characters can have:
- age/life stage where appropriate;
- traits;
- skill domains;
- experience;
- wounds;
- loyalty;
- ambition;
- relationships;
- office;
- faction;
- culture/ancestry;
- renown;
- secrets;
- mission assignment;
- temporary statuses.

## 5. Turn structure

Keep play recognizably turn-based while avoiding 30-minute waits caused by dozens of AI factions.

### Single-player
The player performs commands freely during their active decision phase. Background AI can prepare bounded plans from immutable snapshots while the player is thinking when doing so cannot reveal hidden information or break determinism.

After End Turn, resolve in canonical phases:

1. pending diplomacy and political commitments;
2. strategic orders/movement;
3. encounters and battles;
4. sieges/occupation/raids;
5. settlement economy and production;
6. trade/logistics;
7. research/institutions/magic;
8. character/agent missions;
9. independent powers/world simulation;
10. growth, migration, unrest, recovery;
11. events/crises;
12. visibility/intelligence;
13. victory/progression checks;
14. cleanup, snapshots, next-turn initialization.

The exact order may be tuned, but it must be documented, deterministic, tested, and save-compatible.

### Multiplayer
Use simultaneous planning with a deterministic resolution phase. Allow reasonable turn timers but support untimed/private campaigns.

## 6. 4X feature baseline

Do not clone another game. Match the **breadth and completeness expected of a modern premium 4X**, expressed through original Theandril systems.

### Explore
Implement:
- fog of war;
- line of sight;
- explored vs currently visible state;
- terrain movement rules;
- scouts/explorers;
- naval exploration;
- map discoveries;
- named natural landmarks;
- ancient ruins;
- lairs;
- relic sites;
- hidden routes;
- resource discovery;
- cartography/map trading or intelligence exchange;
- world-map lenses;
- minimap;
- search/jump-to entity;
- exploration events.

### Expand
Implement:
- settler/colonist or faction-appropriate founding mechanism;
- settlement-site evaluation;
- borders/hinterlands;
- staged settlement growth;
- administrative limits/soft caps;
- frontier pressure;
- migration;
- cultural integration;
- roads and routes;
- colonization beyond core lands;
- peaceful incorporation;
- conquest;
- occupation;
- liberation;
- vassalization;
- looting/sacking;
- razing;
- abandonment;
- resettlement.

Settlement progression should be approximately:

**Camp/Outpost → Village/Hold → Town → City → Great City/Metropolis**

Not every faction needs identical labels, but mechanics must map to shared schema.

### Exploit
Implement:
- food/provisions;
- production/industry;
- treasury/coin;
- knowledge;
- influence/authority;
- arcane or spiritual power;
- local resources;
- strategic resources;
- luxury/prestige resources;
- trade goods;
- local buildings;
- district-like specializations without copying Civilization terminology/design;
- construction queues;
- unit recruitment;
- maintenance;
- taxes;
- trade routes;
- roads;
- ports;
- markets;
- resource processing;
- population/growth;
- specialists/elite estates or equivalent;
- stability/unrest;
- devastation and reconstruction;
- supply generation;
- corruption/administrative friction at large scale;
- faction policies.

### Exterminate
Implement:
- land armies;
- fleets;
- commanders;
- movement/pathfinding;
- zones of control;
- interception;
- scouting;
- ambush where supported by terrain/traits;
- fortifications;
- sieges;
- blockades;
- raiding;
- pillaging;
- occupation;
- retreat;
- pursuit;
- reinforcement;
- morale;
- fatigue;
- supply;
- terrain;
- weather modifiers if they are readable and not busywork;
- commander advancement;
- veterancy;
- tactical abilities;
- autoresolve;
- optional player tactical intervention for important battles;
- war goals;
- peace terms;
- war exhaustion/support;
- claims/grievances.

## 7. Settlement and territorial design

A settlement should feel geographically situated.

Each settlement tracks:
- population band;
- growth;
- food security;
- prosperity;
- stability;
- fortification;
- devastation;
- local culture;
- dominant/secondary ancestries;
- religion/worldview if enabled;
- governing faction;
- occupation status;
- buildings;
- specializations;
- local resources;
- nearby controlled cells;
- trade connectivity;
- supply output;
- garrison;
- governor;
- strategic importance;
- construction/recruitment queues.

### Capture decisions
When a hostile settlement falls, present context-appropriate choices such as:
- occupy;
- annex;
- establish client rule;
- return/liberate;
- sack/loot;
- raze;
- abandon after stripping assets;
- resettle with the conqueror's population/culture when conditions permit.

Choices must have systemic consequences:
- treasury gain;
- population loss/displacement;
- devastation;
- diplomatic reputation;
- grievances;
- character traits/events;
- resistance;
- cultural conversion;
- migration/refugees;
- long-term economic recovery.

## 8. Economy and logistics

Use an economy deep enough for empire planning but readable enough for a browser 4X.

### Core empire currencies/yields
Start with:
- Provisions;
- Industry;
- Coin;
- Knowledge;
- Influence;
- Arcana/Devotion as a setting-specific supernatural resource.

Avoid adding more global currencies without a clear gameplay role.

### Supply
Military supply is essential because it creates meaningful geography.

Armies consume supply based on:
- unit composition;
- stance;
- terrain;
- weather if enabled;
- hostile territory;
- siege state.

Supply sources:
- settlements;
- forts;
- depots;
- fleets/ports;
- allied territory under treaty;
- controlled roads/rivers where appropriate.

Low supply causes readable penalties and eventual attrition. It should not require spreadsheet micromanagement.

## 9. Research, technology, institutions, and magic

Theandril must have **multiple genuinely different progression systems**.

Do not collapse all advancement into one generic technology tree.

A faction's long-term development should emerge from interacting systems:

1. **Mundane Technology / Knowledge**
2. **Institutions / Civic Traditions**
3. **Military Doctrine**
4. **Arcane Theory**
5. **Magical Traditions / Paths**
6. **Sacred / Divine Practice**
7. **Occult / Forbidden Practice**
8. **Crafting / Artifice**
9. **Faction-specific discoveries**
10. **World-site and character-gated discoveries**

A faction may be strong in some systems and weak, blocked, unconventional, or entirely absent in others.

### 9.1 Mundane Technology / Knowledge

This is practical non-magical development.

Possible branches:
- agriculture and irrigation;
- animal husbandry;
- forestry;
- mining;
- metallurgy;
- masonry;
- roads and bridges;
- navigation;
- shipbuilding;
- cartography;
- medicine;
- sanitation;
- siege engineering;
- logistics;
- accounting;
- currency/finance;
- bureaucracy;
- printing or information systems if appropriate to the era;
- architecture;
- crafts;
- mechanical devices.

Technology should unlock or improve:
- buildings;
- production methods;
- unit equipment;
- strategic movement;
- supply;
- trade;
- settlement capacity;
- fortifications;
- naval capability;
- exploration.

Do not make mundane technology irrelevant in magical factions. A powerful sorcerous empire should still care about roads, food, steel, logistics, administration, and ships unless its faction mechanics explicitly replace them.

### 9.2 Institutions / Civic Traditions

Institutions represent how a society organizes itself rather than what it knows.

Examples:
- clan law;
- codified courts;
- merchant charters;
- feudal obligations;
- oathbound vassalage;
- imperial bureaucracy;
- elective councils;
- temple administration;
- guild privilege;
- frontier marcher traditions;
- citizen militias;
- caste structures;
- magical colleges;
- monastic scholarship;
- slave economies where setting-appropriate and handled seriously;
- communal landholding;
- mercenary institutions.

Institutions affect:
- government;
- loyalty;
- tax extraction;
- diplomacy;
- vassalage;
- cultural integration;
- settlement administration;
- recruitment;
- agent capacity;
- internal politics.

They may be researched, adopted, reformed, spread, inherited, imposed, or resisted depending on the institution.

### 9.3 Military Doctrine

Military doctrine is a separate progression system from equipment technology.

Examples:
- shield-wall discipline;
- deep spear formations;
- mounted warfare;
- skirmish doctrine;
- ranger warfare;
- siegecraft doctrine;
- amphibious warfare;
- monster integration;
- battle-mage coordination;
- necromantic logistics;
- war-beast handling;
- professional officer corps;
- levied mass warfare;
- elite retinue warfare;
- raiding doctrine;
- naval boarding doctrine.

Doctrine modifies:
- formation behavior;
- army automation;
- tactical orders;
- commander abilities;
- reinforcement;
- morale;
- army composition;
- campaign stances.

### 9.4 Arcane Theory

Arcane Theory is the **national research layer** for magic.

It represents accumulated magical knowledge available to the faction.

Create original research disciplines rather than copying Dominions school names exactly. A strong initial model could include disciplines such as:

- **Calling** — summons, bindings, planar contact, spirit compacts;
- **Transmutation** — changing bodies, materials, terrain, and physical properties;
- **Projection** — direct battlefield manifestations and ranged destructive magic;
- **Warding** — barriers, resistance, protection, dispelling, anti-magic;
- **Artifice** — enchanted arms, constructs, relics, magical infrastructure;
- **Veilcraft** — illusion, concealment, dreams, perception, deception;
- **Malison** — curses, decay, soul-affliction, hostile enchantment;
- **Thaumic Dominion** — large strategic rituals, ley manipulation, weather, realm effects;
- **Forbidden Arts** — dangerous traditions that use corruption, sacrifice, souls, void influence, or other faction-specific costs.

These names are placeholders until Theandril's lore bible establishes final terminology.

Researching a discipline does **not** mean every faction can use every discovery in it.

### 9.5 Magical Traditions / Paths

Separate magical **research disciplines** from magical **power traditions**.

A caster must have the appropriate personal tradition/path aptitude to use an effect.

Create a flexible original set of traditions such as:

- Flame
- Storm
- Tide
- Stone
- Verdancy
- Grave
- Star
- Dream
- Shadow
- Radiance
- Spirit
- Rune
- Blood/Oath
- Void

These are examples, not mandatory final names.

Important design principle:

> National research determines what the civilization understands.  
> Individual magical aptitude determines who can actually perform it.

A powerful ritual may require:
- a researched discipline level;
- one or more magical path levels;
- a specific site/building;
- a resource cost;
- an artifact;
- multiple cooperating casters;
- a faction trait;
- a rare character;
- a world condition.

This creates Dominions-like build depth without copying Dominions' exact system.

### 9.6 Individual casters

Mage-like characters have personal magical profiles.

A character may have:
- one primary tradition;
- one or more secondary traditions;
- rare random or inherited affinities;
- priestly authority;
- occult corruption;
- research ability;
- ritual skill;
- battle-casting skill;
- crafting skill;
- site-search ability.

Faction rosters define typical access, but exceptional characters can create strategic opportunities.

Examples:
- a dwarven-like mountain polity may have abundant Rune/Stone artificers but almost no Dream practitioners;
- a forest confederacy may excel in Verdancy/Spirit and have weak heavy artifice;
- an undead empire may have deep Grave magic, ritual logistics, and corpse-based economies;
- an island mageocracy may combine Tide/Storm/Star paths and advanced navigation;
- an anti-magic human kingdom may have weak conventional spellcasters but exceptional Warding, relic hunters, and mage-suppression doctrines.

### 9.7 Magical discovery access

A spell/ritual/effect definition should support:

```ts
interface ArcaneDiscoveryDefinition {
  id: string;
  disciplineRequirements: Record<string, number>;
  pathRequirements: Record<string, number>;
  resourceCosts?: ResourceCost[];
  requiredTags?: string[];
  requiredSiteTags?: string[];
  factionRequirements?: string[];
  forbiddenFactionTags?: string[];
  worldConditions?: ConditionDefinition[];
  kind:
    | "battle_spell"
    | "ritual"
    | "summoning"
    | "enchantment"
    | "item_recipe"
    | "site_action"
    | "world_effect";
}
```

The actual schema can differ, but the conceptual separation must remain.

### 9.8 Battle magic

Battle magic should be tactically meaningful but readable.

Casters may:
- buff formations;
- debuff enemies;
- create terrain effects;
- summon temporary or persistent units;
- attack at range;
- disrupt morale;
- conceal troops;
- ward against specific threats;
- dispel hostile effects;
- heal or preserve units where tradition allows;
- manipulate weather/visibility locally;
- counter enemy casters.

Battle casting must interact with:
- fatigue/strain;
- limited magical resources where relevant;
- initiative;
- range;
- formation;
- commander scripting/AI;
- resistances;
- friendly-fire or risk for dangerous magic;
- counter-magic.

Do not turn combat into uncontrolled spell spam.

### 9.9 Strategic rituals

Strategic/world magic is a major 4X layer.

Rituals may:
- summon armies or monsters;
- create elite commanders;
- search for hidden magical sites;
- reveal distant territory;
- spy magically;
- curse enemy settlements;
- bless harvests;
- alter climate locally;
- raise fortifications;
- open temporary routes;
- travel through magical networks;
- create undead;
- awaken ancient beings;
- bind spirits;
- conceal regions;
- protect cities;
- disrupt supply;
- trigger migration or fear;
- create magical resources;
- transform terrain;
- create faction-wide enchantments;
- contest or dispel enemy global effects.

High-tier rituals should create geopolitical events that other factions notice and react to.

### 9.10 Great works and global enchantments

Late-game magic may produce rare persistent world-scale effects.

Examples:
- supernatural winter;
- realm-wide ward;
- celestial navigation network;
- ley-line awakening;
- deadlands expansion;
- prophetic vision network;
- continent-spanning storm;
- arcane trade roads;
- planar breach;
- magical golden age.

Rules:
- expensive;
- visible or discoverable;
- politically consequential;
- counterable;
- limited in number or opportunity;
- capable of becoming war objectives.

### 9.11 Magic resources and magical geography

Magic should be geographically grounded.

The world may contain:
- ley nexuses;
- haunted battlefields;
- starfall craters;
- sacred springs;
- ancient standing stones;
- deep-earth forges;
- dragon graves;
- spirit woods;
- shattered towers;
- void scars;
- subterranean crystal fields.

Sites can produce original magical resource categories.

Avoid copying Dominions' exact gem economy.

Possible Theandril resource model:
- Essences by broad magical family;
- Catalysts;
- Relics;
- Souls/echoes for morally dark systems;
- Sacred favor;
- Rare alchemical materials.

Resources power:
- rituals;
- crafting;
- summons;
- magical buildings;
- unit upkeep;
- faction projects.

Site searching and magical exploration should matter.

### 9.12 Artifice, items, and relics

Magical crafting must be a real progression path.

Support:
- enchanted weapons;
- armor;
- banners;
- staves;
- grimoires;
- talismans;
- commander equipment;
- army relics;
- settlement artifacts;
- magical constructs;
- legendary one-of-a-kind relics.

Crafting may require:
- Artifice research;
- caster path;
- forge/workshop;
- magical resources;
- recipe/discovery;
- rare site.

Items should materially change characters and armies without requiring an inventory-management nightmare.

### 9.13 Summoning and supernatural recruitment

Some factions should recruit almost entirely conventionally.

Others may depend strongly on:
- summons;
- rituals;
- bound spirits;
- undead creation;
- constructs;
- pacts;
- monster recruitment;
- sacred orders.

Summoned units may be:
- temporary;
- permanent;
- commander-led;
- upkeep-free but resource-bound;
- unstable;
- mindless;
- difficult to replenish;
- politically dangerous.

Faction asymmetry is desired.

### 9.14 Sacred and divine practice

Sacred power is not merely Arcane Theory with a different icon.

Support:
- temples/shrines;
- priestly hierarchy;
- holy sites;
- faith/authority;
- blessings;
- consecration;
- exorcism;
- sacred units;
- divine rites;
- doctrinal schisms;
- holy wars where emergent from politics;
- anti-undead/anti-corruption mechanics where appropriate.

Different religions/philosophies can use distinct rules.

Some factions may have:
- state cults;
- ancestor rites;
- philosophical sacred traditions;
- animism;
- god-kings;
- no organized religion;
- explicitly anti-theistic institutions.

### 9.15 Forbidden/occult systems

Dark fantasy needs dangerous power.

Some research should carry real costs:
- corruption;
- unrest;
- sacrifice;
- character mutation;
- dangerous summons;
- diplomatic penalties;
- spiritual pollution;
- catastrophe risk;
- world-threat escalation.

Powerful occult strategies should be viable, not merely "evil choices with bad rewards."

They must also create counterplay for other factions.

### 9.16 Faction-specific magical systems

Do not force all nations into the same magic screen.

Examples of valid asymmetry:
- a rune culture learns formulae and forges artifacts rather than casting many battlefield spells;
- a witch confederacy gains knowledge through covens, pacts, and discovered places;
- a necromantic state gains research from death, tombs, and captured lore;
- a sacred empire advances through theological councils and pilgrimage sites;
- a druidic polity unlocks power through living landmarks and seasonal rites;
- a mage republic uses academies, specialist researchers, libraries, and competing schools;
- a giant culture learns ancient chants through rare elder characters;
- a subterranean civilization discovers deep-earth secrets through excavation;
- a technologically sophisticated anti-magic realm progresses through engineering, chemistry, wards, and nullification.

Under the hood these may share reusable primitives, but the player-facing progression should feel faction-specific.

### 9.17 Research workforce

Research is generated by characters, institutions, buildings, sites, and policies rather than passively appearing from nowhere.

Possible researchers:
- scholars;
- artificers;
- mages;
- priests;
- alchemists;
- engineers;
- sages;
- scribes;
- captured specialists;
- ancient advisors.

The player can decide how scarce elite characters spend their time:
- research;
- govern;
- lead armies;
- perform rituals;
- search sites;
- craft;
- spy;
- teach apprentices.

This creates opportunity cost.

### 9.18 Research queues and specialization

Each research system should support:
- queueing;
- priorities;
- previewed unlocks;
- faction affinities;
- catch-up mechanisms;
- espionage/theft;
- event-based breakthroughs;
- discovered ancient knowledge;
- character bonuses.

Research should have meaningful branching and timing choices.

Avoid "research everything in a predetermined order."

### 9.19 Cross-system discoveries

Some breakthroughs should require combinations.

Examples:
- Metallurgy + Rune Artifice → enchanted siege engines;
- Navigation + Storm magic → supernatural fleet movement;
- Medicine + Verdancy → battlefield restoration rites;
- Bureaucracy + Divination → intelligence administration;
- Siege Engineering + Projection → arcane bombardment doctrine;
- Necromancy + Logistics → tireless undead supply rules;
- Shipbuilding + Tide magic → deep-sea expedition capability.

These combinations should help mundane and magical development feel interconnected.

### 9.20 Faction progression identity

Every launch faction must specify:
- mundane technology strengths/weaknesses;
- institutional strengths/weaknesses;
- military doctrine preferences;
- magical path access;
- magical discipline priorities;
- sacred/occult access;
- unique research;
- unique rituals or equivalents;
- unique strategic magical resource pressures;
- AI research plan;
- alternate research plan for changing circumstances.

Two factions of the same ancestry should still play differently.

### 9.21 Research AI

AI must understand:
- required caster access;
- resource availability;
- current wars;
- enemy composition;
- planned unit roster;
- strategic goals;
- available sites;
- victory path;
- near-term breakpoint discoveries.

It should not research a powerful ritual that none of its characters can ever cast unless it is deliberately preparing to obtain that capability.

### 9.22 Research UX

Provide:
- separate but linked progression views;
- filters by unlock type;
- "who can use this?" inspection;
- required caster/path display;
- resource requirements;
- faction-exclusive indicators;
- research queue;
- recommended synergies;
- dependency graph;
- unlocked-but-currently-unusable warnings;
- strategic ritual browser;
- magical site browser;
- artifact crafting browser.

The depth should be discoverable rather than hidden.

### 9.23 Research content targets for 1.0

Target at least:

#### Mundane technology
- 80+ discoveries across practical branches.

#### Institutions/civics
- 70+ institutions/traditions/policies.

#### Military doctrine
- 50+ doctrine unlocks/upgrades.

#### Arcane disciplines
- 8–10 research disciplines, each with meaningful progression.

#### Magical paths/traditions
- 10–14 broad magical traditions, with factions accessing different subsets.

#### Magical effects
At least **250+ total magical discoveries/effects** across:
- battle spells;
- strategic rituals;
- summons;
- enchantments;
- wards;
- site actions;
- item recipes;
- world-scale effects.

These do not all need to be universally accessible.

#### Sacred/occult content
- multiple distinct sacred traditions;
- multiple distinct forbidden/occult traditions;
- faction-specific exceptions.

#### Artifacts
- 80+ craftable or discoverable magical items/relics across tiers.

Use systemic generation/templating carefully, but do not pad counts with trivial +1 clones.

## 10. Diplomacy, politics, and negotiation

Diplomacy must be a real game system.

Track AI-relevant relationship dimensions such as:
- trust;
- fear;
- respect;
- affinity;
- rivalry;
- grievances;
- claims;
- recent promises kept/broken;
- ideological/cultural/religious friction;
- border tension;
- strategic dependence.

Expose a simplified player-facing summary plus drill-down detail.

Support:
- trade agreements;
- open borders/military access;
- non-aggression pacts;
- alliances;
- defensive leagues;
- guarantees;
- vassalage/tributary relations;
- resource trades;
- coin;
- settlement transfer where appropriate;
- prisoners/hostages where appropriate;
- war reparations;
- peace treaties;
- joint war requests;
- embargoes;
- intelligence sharing;
- map information;
- diplomatic favors/obligations;
- denunciations/condemnations;
- demands;
- ultimatums.

### Negotiation interface
The player should be able to build offers from treaty clauses and see:
- likely acceptance;
- important objections;
- non-negotiable red lines;
- relationship impact.

Do not reveal the entire hidden AI score. Communicate understandable reasons.

### Internal politics
At minimum:
- ruler legitimacy/authority;
- governors and commanders with loyalty;
- cultural/religious tension;
- factional interests or estates;
- succession/leadership changes for factions where appropriate;
- rebellions/secession when systemic conditions justify them.

Do not turn internal politics into an unbounded character-simulation project. It exists to create strategic consequences.

## 11. Independent powers and world actors

Populate the map with actors that are not standard empires:
- free cities;
- clans;
- monster domains;
- monasteries;
- cult enclaves;
- mercenary companies;
- pirate havens;
- nomad hosts;
- ancient guardians;
- trade leagues;
- frontier confederacies.

They can:
- trade;
- raid;
- be influenced;
- become clients;
- grant unique bonuses;
- hire units;
- offer quests/contracts;
- become larger states;
- collapse;
- join wars;
- be annexed;
- resist outsiders.

## 12. Characters and agents

Characters create narrative texture and strategic specialization.

### Agent missions
Implement data-driven missions such as:
- establish intelligence network;
- steal research;
- sabotage fortifications;
- incite unrest;
- counterintelligence;
- improve relations;
- negotiate access;
- survey frontier;
- search ruins;
- spread doctrine;
- recruit mercenaries;
- suppress corruption;
- improve settlement administration;
- train army;
- investigate secret.

Mission resolution must be deterministic from seed/state/choices and expose predicted risk bands rather than exact hidden rolls where appropriate.

## 13. Army composition and unit system

Use data-driven unit definitions.

A unit formation should include:
- stable content ID;
- class;
- role;
- tier;
- manpower/strength;
- attack profile;
- defense/armor;
- ranged capability;
- mobility;
- morale;
- discipline;
- initiative;
- supply cost;
- recruitment cost/time;
- upkeep;
- terrain affinities;
- tags;
- resistances;
- abilities;
- upgrade paths;
- culture/faction requirements.

Useful roles include:
- line infantry;
- spear/pike;
- shock infantry;
- skirmisher;
- archer;
- crossbow/gunpowder only if setting permits later;
- light cavalry;
- heavy cavalry;
- monstrous infantry;
- beasts;
- flyers;
- battle mages;
- support;
- engineers;
- siege;
- summoned/undead formations;
- naval vessels.

Faction rosters should share readable role grammar but have meaningful asymmetry.

## 14. Tactical combat: simple to operate, deep to master

Do not create a real-time total-war simulator.

Use a compact, deterministic **formation battlefield**.

Baseline:
- 5 columns × 3 ranks per side, adjustable after prototyping;
- Front / Main / Rear or Vanguard / Line / Reserve role behavior;
- flank relationships;
- terrain slots;
- commander;
- 6–12 formations per army by default;
- battle lasts a small number of rounds unless siege/特殊 mechanics extend it.

Player decisions:
- deployment;
- formation placement;
- stance;
- target priorities;
- a limited number of commander/unit abilities;
- reserve commitment;
- retreat;
- pursuit.

Example order vocabulary:
- Hold;
- Brace;
- Advance;
- Assault;
- Skirmish;
- Volley;
- Flank;
- Screen;
- Breakthrough;
- Withdraw;
- Pursue.

Resolve:
- initiative;
- targeting;
- accuracy/effect;
- armor/resistance;
- morale;
- cohesion;
- casualties;
- routing;
- commander effects;
- terrain;
- fatigue.

### Autoresolve
Autoresolve MUST call the same combat rules engine using AI tactical choices at accelerated/headless speed.

Do not maintain a separate magic formula that produces contradictory outcomes.

### Battle UX goal
A player should be able to:
- autoresolve a trivial battle in one click;
- inspect expected outcome/risk;
- intervene in a major battle;
- finish a typical intervention in roughly 30–120 seconds of active decision time.

## 15. Siege and conquest

Sieges need:
- fortification value;
- garrison;
- blockade/encirclement;
- supplies;
- assault;
- bombardment/siege engineering;
- relief army;
- surrender;
- breach;
- civilian/economic consequences.

Sieges should matter but should not create dozens of mandatory tactical screens per turn.

## 16. AI architecture

The AI must be competent at the actual game and scale to dozens of factions.

Use hierarchical planning.

### Layer 1 — Grand strategy
Chooses:
- expansion priority;
- victory orientation;
- rivals;
- allies;
- economic focus;
- military posture;
- research/institution direction;
- acceptable risks.

### Layer 2 — Theater strategy
Groups geography into theaters/fronts and assigns:
- defend;
- invade;
- raid;
- reinforce;
- contain;
- naval control;
- frontier settlement;
- reserve.

### Layer 3 — Operational planning
Chooses:
- army goals;
- routes;
- target settlements;
- supply staging;
- force concentration;
- siege timing.

### Layer 4 — Tactical battle
Chooses formation/deployment/orders from the same battle APIs a player uses.

### Layer 5 — Functional governors
Economic, settlement, diplomacy, research, character, and agent planners create bounded proposals.

Use a pragmatic hybrid of:
- utility scoring;
- goal decomposition/HTN-style plans;
- heuristics;
- cached influence maps;
- limited search for high-value decisions.

Do not use expensive unconstrained tree search for every unit.

### Parallel AI
Parallel workers may calculate proposals from immutable snapshots.

Canonical state mutation happens only in one deterministic resolution order.

Never let worker completion timing alter gameplay outcomes.

### AI personalities
Each major faction/leader has:
- strategic preferences;
- risk tolerance;
- aggression;
- honor/reliability;
- expansion appetite;
- preferred terrain;
- trade posture;
- supernatural posture;
- diplomatic agenda.

Personality changes weights, not rules.

### Difficulty
Default difficulties should improve:
- planning depth;
- tactical quality;
- budgeting;
- coordination.

Avoid hidden omniscience.

If higher difficulties use modest economic bonuses, disclose them.

## 17. World generation

World generation must create plausible, strategically interesting geography rather than random colored noise.

Use seeded layered generation:

1. continental plates / macro landmasses;
2. elevation fields;
3. tectonic/mountain tendencies;
4. ocean depth/coast shaping;
5. temperature by latitude/elevation;
6. prevailing wind/moisture approximation;
7. rainfall;
8. biome classification;
9. drainage/flow accumulation;
10. rivers/lakes/wetlands;
11. erosion/coast cleanup approximations;
12. fertility/resources;
13. natural wonders/ruins;
14. settlement suitability;
15. strategic chokepoint evaluation;
16. starting-region generation;
17. faction/minor-power placement;
18. final fairness and reachability checks.

Required map features:
- multiple continents;
- meaningful islands and archipelagos;
- inland seas;
- peninsulas;
- river systems;
- mountain chains with passes;
- deserts/steppe/tundra/forests/marshes/grasslands;
- natural harbors;
- chokepoints;
- isolated valleys;
- frontier zones.

Support:
- deterministic seed entry;
- replayable generation;
- world wrap setting;
- map preview;
- reroll;
- generation progress;
- cancellation;
- debug biome/elevation/rainfall/flow lenses.

### Fairness
Do not make all starting positions identical.

Validate that each major start has a survivable baseline:
- fresh water or equivalent;
- food access;
- production access;
- reachable expansion option;
- no impossible isolation unless chosen by scenario/faction.

## 18. Rendering architecture

Use zoom-dependent representation.

### Far zoom
Show:
- terrain macro color/texture;
- political borders;
- region labels;
- large rivers/coasts;
- settlement icons;
- army aggregates;
- war/front overlays.

Use cached/render-texture chunk layers where appropriate.

### Mid zoom
Add:
- terrain detail;
- roads;
- resources;
- armies;
- forts;
- settlement names;
- trade/supply lines.

### Near zoom
Add:
- detailed sprites;
- improvements;
- unit banners;
- local effects;
- small labels.

### Performance techniques
Use:
- viewport culling;
- chunk dirty flags;
- object pooling;
- texture atlases;
- sprite batching;
- BitmapText where useful;
- render textures for static chunk layers;
- reduced detail at distance;
- no per-frame allocation in hot loops;
- no React state update per entity;
- spatial indexes for picking/querying;
- workerized expensive map/simulation work.

UI resolution and Pixi render resolution may be managed separately if this improves map performance without reducing text clarity.

## 19. UX for giant empires

Massive scale fails if the player must manually inspect 400 armies.

Implement:
- strategic alerts;
- end-turn blocker/warning settings;
- next-idle-army;
- next-idle-settlement;
- multi-select;
- army groups;
- theaters;
- automation policies;
- rally points;
- production templates;
- recruitment templates;
- settlement governors;
- filters;
- sortable registries;
- searchable entity lists;
- map lenses;
- map pins;
- saved camera locations;
- diplomacy ledger;
- war overview;
- supply overlay;
- trade overlay;
- unrest overlay;
- resource overlay;
- intelligence overlay;
- character roster;
- notification history.

Automation must remain transparent and overridable.

## 20. Visual direction

Theandril is **2D gritty dark-fantasy pixel art**, not pixel-noise soup and not a bright cartoon. The current user-directed visual target supersedes the initial hand-painted/engraved asset technique; the procedural renderer is a foundation, not the completed visual update.

Aim for:
- deliberate native-pixel clusters, weathered materials, weighty animation and strong silhouettes;
- dark parchment, oxidized metal, ash, stained vellum, old ink, subdued heraldic color;
- readable faction colors;
- strong silhouettes;
- original heraldry;
- atmospheric coastlines, forests, mountains, ruins, and settlements;
- restrained particle effects;
- portraits and banners that feel like the same world.

At far zoom, clarity beats detail.

At close zoom, texture sells the world.

Never sacrifice ownership/border readability for mood.

Use `.agents/skills/theandril-pixel-art/SKILL.md` for asset-family resolution, sprite-sheet metadata, animation timing, original art direction and pixel-rendering acceptance. Referenced games convey atmosphere and craft, not assets or distinctive designs to copy. Verify native-size, near/mid/far LOD, responsive UI and atlas residency before mass-producing assets.

If image-generation tooling is available, generate only original assets and keep an asset-provenance manifest. If it is not, build coherent procedural/vector/iconography assets sufficient to ship a visually consistent build rather than scraping copyrighted art.

## 21. Lore and content

Before mass-producing content, establish a concise canonical lore bible containing:
- cosmology;
- creation myths vs known history;
- major historical eras;
- present political era;
- magic rules;
- religions/philosophies;
- ancestry distribution;
- continents;
- climate/geography;
- trade networks;
- collapsed empires;
- current existential threats;
- naming conventions by culture.

Then author factions against it.

### Major faction minimum
Each launch major faction needs:
- name;
- adjective/demonym;
- crest/heraldry direction;
- capital/start-region preference;
- ancestry/cultural composition;
- government;
- economy identity;
- military identity;
- diplomatic personality;
- supernatural relationship;
- 2–4 faction traits;
- at least 2 distinctive unit lines or transformations;
- distinctive building/institution;
- faction progression hooks;
- 6–10 notable characters;
- 4–8 authored narrative events plus access to global events;
- AI agenda;
- player-facing strategy summary.

Avoid "humans are generic, fantasy ancestries are gimmicks." Every faction needs a point of view.

## 22. Content quantity targets for 1.0

Quality and systemic coverage are more important than raw count, but the base game must not feel like a tech demo.

Target at least:
- 24 major factions;
- 48 minor/independent powers or equivalently varied generated minor actors;
- 100+ unit definitions/meaningful variants across shared and unique rosters;
- 120+ unit/commander/agent abilities and traits combined;
- 80+ mundane Knowledge/Technology discoveries;
- 70+ Institutions/Traditions;
- 50+ Military Doctrine discoveries;
- 8–10 Arcane research disciplines;
- 10–14 magical traditions/paths distributed asymmetrically across factions;
- 250+ magical effects/discoveries across battle magic, rituals, summons, wards, enchantments, crafting, site actions, and world effects;
- multiple distinct Sacred and Forbidden/Occult progression traditions;
- 80+ magical items/relics/recipes;
- 40+ resource types across strategic/luxury/trade categories;
- 24+ major landmarks/wonders/legendary sites;
- 150+ event templates, with context filters and branching outcomes;
- 150+ notable named character definitions or robust faction-specific generation pools;
- multiple victory paths.

If these numbers create filler, improve procedural composition and authored templates rather than shipping duplicated content with renamed stats.

## 23. Victory and campaign progression

Provide at least five original victory paths:

1. **Dominion** — overwhelming territorial/military supremacy.
2. **Hegemony** — political network, vassals/allies, influence, recognized high authority.
3. **Prosperity** — trade, wealth, infrastructure, economic leverage.
4. **Legacy** — culture, institutions, great works/legendary achievements, world prestige.
5. **Ascendancy** — arcane/sacred mastery culminating in a dangerous endgame project.

Every path must:
- have progress indicators;
- create counterplay;
- create map interaction;
- avoid being a passive meter.

Support score/legacy resolution at a campaign turn limit if enabled.

## 24. Campaign "ages" without copying Civilization

The world may progress through 3 original campaign epochs, for example:
- Age of Fracture;
- Age of Crowns;
- Age of Reckoning.

These are world-state progressions, not mandatory civilization replacements.

An epoch transition can:
- introduce crises;
- unlock institutions/unit tiers;
- alter diplomacy;
- awaken threats;
- change minor powers;
- unlock victory projects.

A faction should retain its identity across epochs unless narrative/player choices transform it.

## 25. Multiplayer scope

1.0 multiplayer:
- 2–8 humans;
- remaining slots may be AI;
- private invite-code room;
- reconnect;
- simultaneous planning;
- host-configurable turn timer;
- save/resume;
- deterministic authoritative resolution;
- chat/pings optional if inexpensive;
- spectator/replay support desirable after core 1.0 gates.

Single-player must never require the multiplayer server.

## 26. Mod/content architecture

Content must be data-driven.

Use:
- stable string IDs;
- schema validation;
- content packs;
- localization keys;
- references validated at startup/build time;
- deterministic load order;
- content hash in saves.

At minimum, make it reasonably possible to add:
- faction;
- unit;
- ability;
- building;
- technology;
- institution;
- resource;
- event;
- character;
- map landmark

without editing core simulation switch statements.

Build a content validation CLI/test.

## 27. Accessibility and settings

Implement:
- remappable keyboard shortcuts;
- scalable UI;
- text size options;
- reduced motion;
- color-independent ownership cues/patterns;
- colorblind-safe alternative palettes or strong customization;
- pause/animation speed where applicable;
- tooltip delay;
- confirmation settings for destructive actions;
- accessible DOM alternatives for critical canvas-only information where reasonable.

## 28. Debug/test interface

In development/test builds expose a narrow browser test interface such as:

```ts
window.__THEANDRIL__ = {
  version,
  getSummary(),
  getPerformanceCounters(),
  getSelection(),
  getStateHash(),
  getTurn(),
  loadScenario(id),
  runTurns(count),
  setDebugLens(id),
  exportReplay(),
};
```

Do not expose unsafe mutation helpers in production.

Create named deterministic test scenarios:
- `smoke-tiny`;
- `settlement-growth`;
- `settlement-capture-options`;
- `diplomacy-treaty`;
- `war-and-peace`;
- `field-battle`;
- `siege`;
- `agent-mission`;
- `trade-supply`;
- `save-load-replay`;
- `ai-expansion`;
- `huge-map-camera`;
- `32-faction-stress`;
- `legendary-world-stress`.

Playwright must use these to verify actual gameplay.

## 29. Performance budgets

Treat performance as a feature.

Reference target: modern mainstream desktop/laptop browser, not only a high-end workstation.

### Interactive map
- target 60 FPS during normal pan/zoom;
- avoid sustained drops below 30 FPS under expected 1.0 gameplay load;
- interaction response should feel immediate;
- no long main-thread stalls during normal camera movement.

### Standard/Huge campaign
Benchmark with roughly:
- 160k+ cells;
- 24–32 major factions;
- 50+ minor powers;
- 1,500–3,000 armies/fleets;
- thousands of settlements/characters/agents/content entities as campaign matures.

End-turn goal:
- common cases: a few seconds;
- stress cases: remain bounded and visibly progressing;
- no algorithm whose practical behavior explodes as the map matures.

### Legendary stress
Use a deterministic fixture around:
- 250k–350k cells;
- 40+ majors;
- 100+ minor powers;
- 4,000–6,000 armies/fleets.

This fixture does not need every UI animation active. It exists to catch scaling regressions.

Maintain `docs/PERFORMANCE.md` with measured numbers and hardware/browser notes.

Never "optimize" by silently deleting simulation depth or making AI inert.

## 30. Security and integrity

For online play:
- validate every command server-side;
- authorize faction ownership;
- rate-limit abusive command patterns;
- do not trust client-supplied costs/outcomes;
- sanitize player text;
- avoid leaking hidden-map information;
- keep secrets server-side;
- validate save/content uploads;
- pin/scan dependencies in CI.

## 31. Repository structure

Prefer:

```text
apps/
  web/
  server/
packages/
  sim/
  protocol/
  content/
  mapgen/
  ai/
  render/
  ui/
  persistence/
  test-fixtures/
  tooling/
docs/
  design/
  lore/
  architecture/
  IMPLEMENTATION_STATUS.md
  PERFORMANCE.md
.agents/
  skills/
```

Package boundaries should prevent render/UI/network code from leaking into deterministic simulation.

## 32. Execution strategy

### Phase A — Inspect, establish guardrails
- inspect repository;
- run existing app/tests;
- map current modules;
- create/update implementation status;
- identify risky architectural debt;
- do not rewrite working code without measured reason.

### Phase B — Vertical slice
Produce one end-to-end playable loop:
- generate small world;
- spawn factions;
- explore;
- found settlement;
- grow/build;
- recruit;
- move army;
- fight;
- meet AI;
- negotiate;
- end turns;
- save/load;
- reach a simple victory trigger.

This proves boundaries before scaling.

### Phase C — Deterministic simulation + giant-map foundations
- commands/events;
- state hash;
- seeded RNG;
- chunks;
- worker boundary;
- pathfinding;
- visibility;
- snapshots/deltas;
- benchmark harness.

### Phase D — Complete economic/settlement/progression systems
### Phase E — Complete military/siege/combat systems
### Phase F — Diplomacy/internal politics/agents
### Phase G — Hierarchical AI and automation
### Phase H — World generation/content/lore depth
### Phase I — UX/map modes/render polish
### Phase J — Multiplayer
### Phase K — balance, accessibility, performance, release hardening

Do not wait until Phase K to test. Every phase must add automated gameplay tests.

## 33. Subagent strategy

Delegate when work can be cleanly partitioned.

Good concurrent assignments:
- deterministic sim + save/replay;
- mapgen;
- Pixi rendering;
- economic systems;
- diplomacy;
- AI;
- content authoring;
- combat;
- Playwright/performance fixtures.

Before delegation:
- specify exact files/packages the subagent owns;
- state interfaces it must not break;
- give test requirements.

After delegation:
- review diffs;
- integrate;
- run tests;
- resolve design conflicts centrally.

Never allow two agents to independently invent incompatible canonical state models.

## 34. Engineering rules

- No `any` in core gameplay without documented justification.
- No giant mutable singleton game object exposed to UI.
- No direct random calls in gameplay.
- No per-frame full-map scans.
- No O(Factions × Tiles × Armies) recurring loop when a spatial/cache solution exists.
- No JSON deep clone in hot paths.
- No render object per unseen tile.
- No unbounded event-list growth in memory.
- No hidden coupling from content IDs to array positions.
- No network call required to play single-player.
- No core gameplay feature represented by a dead button.
- No "TODO = complete".
- No silent catch blocks in gameplay/persistence.
- No save format without version.
- No schema migration without test.
- No AI-only mutation path.
- No visually pretty benchmark that disables the real simulation.

## 35. Definition of a completed feature

A feature is complete only when:
- its game rules exist in simulation;
- data/content exists;
- player UI exists;
- AI can use/respond to it where relevant;
- save/load preserves it;
- multiplayer command validation supports it where relevant;
- tests cover core happy path and critical edge cases;
- it is observable/debuggable;
- performance is acceptable;
- there is no placeholder behavior in the normal path.

## 36. Release behavior

Do not stop at "MVP".

The 1.0 release is the first **complete base game**:
- all major 4X loops interact;
- campaign can be played from generated start to multiple victory types;
- AI can complete campaigns;
- saves work;
- giant maps work;
- combat works;
- diplomacy works;
- empire automation works;
- content has breadth;
- UX is coherent;
- performance is measured;
- tests are meaningful.

Use `DEFINITION_OF_DONE.md` as the final release gate.

## 37. Standing operating instruction

For every task:
1. read the relevant repository skill;
2. inspect existing code before proposing replacement;
3. implement the smallest coherent slice that advances 1.0;
4. test actual behavior;
5. profile when touching hot paths;
6. update implementation status;
7. continue until the current slice is genuinely complete.

Bias toward action and working software.

Theandril should feel like a game someone can lose a weekend to—not a technology demo.
