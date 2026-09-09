# Theandril systems and content audit

**Baseline:** `b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd`  
**Scope:** code-backed premium-1.0 assessment; no production edits, commit or push. This sub-audit owns only `docs/hermes-analysis/systems/`.

## Executive assessment

Theandril is **an integrated campaign foundation, not a premium 1.0 content-complete strategy game**. It is substantially more than a mock interface: land management, paid production, resource extraction, branching development, formation/character persistence, transport, real combat consequences, negotiated truces and one interruptible victory project are implemented in the canonical simulation. The release gap is mostly the breadth and interaction of strategic choices, not the absence of a command engine. The root README is honest about this status (`README.md:3-7`, `README.md:70-78`).

**Most urgent new rule finding:** a legal stack of **21 formations cannot be attacked or assaulted**. I reached a 21-scout town stack on turn 52 using only generated starting state, paid production and normal turns. Separate save-valid field/garrison probes establish the combat refusal, its exact twenty-versus-twenty-one boundary, and lack of a siege-attrition escape. This is a functional release blocker, not an opinion about content volume (`packages/sim/src/warfare.ts:84-107`; `packages/sim/src/siege.ts:64-82,117-125`; `probe-results.json`).

The exported catalog has **24 cultures, 13 unit definitions, 5 town buildings, 18 tile improvements, 8 resources, 10 technologies, 2 institutions, 2 doctrines, 25 development nodes, 4 character roles, 17 skills, 2 magic paths and 2 battle spells**. Those are distinct categories, not interchangeable evidence of depth. Culture choice currently changes ecology, names/presentation and AI composition preferences; all cultures share unit access, research, fixed caster aptitudes and victory rules. Prosperity is the **only** implemented terminal victory (`packages/content/src/index.ts:36-60,91-105`; `packages/content/src/factions.ts:53-84`; `packages/sim/src/characters.ts:226-232`; `packages/sim/src/progression.ts:17-18,142-156`).

No P0 catastrophe was established in this bounded audit. That is not a clean bill of health for security, performance, browsers, multiplayer or campaign completion; those are outside this sub-audit's fresh execution evidence.

## 1. Evidence and counting method

- Loaded repository rules and applicable local skills; reviewed root scope/architecture/release gates, current README/status and lore/research checkpoints. `GAME_1_0_SCOPE.md:3-3` says a system counts only when playable, integrated, AI-aware, saved and tested. `DEFINITION_OF_DONE.md:147-155` allows a documented non-filler equivalent, not silent abandonment of content targets.
- Ran `node_modules/.bin/tsx docs/hermes-analysis/systems/inventory.ts` successfully against the actual production exports. `validateContent()` passed and returned content hash **`b79c78ed`**. TypeScript AST indexing attaches source ranges to stable IDs; generated resources/improvements also retain their factory definition evidence. `content.json` contains the full imported definitions, derived counts, faction matrices, commands, absence scope and audio search.
- Ran `node_modules/.bin/tsx docs/hermes-analysis/systems/probes.ts > docs/hermes-analysis/systems/probe-run.log` successfully. `probe-results.json` retains the output of assertion-backed probes. The paid stack scenario is unmodified generated gameplay with AI inactive; the boundary/deficit scenarios explicitly author in-memory conditions and validate saves before exercising real commands. They are not presented as earned campaign trajectories.
- Counts exclude legacy catalogs, old roster versions, repeated seats, duplicate registry membership, art bindings and lore-only examples. Seventeen skills include shared Patient fieldcraft only once. Arcane discoveries unlock the same two spells; they do not add two more usable magical effects. Eight faction traditions are already included in the 25 development nodes. Generated names are not biographies.
- Zero means **no exported playable registry or relevant canonical command/state found within this audit**, not that the concept is absent from every document. Canonical boundary: `packages/sim/src/types.ts:175-250`; complete validator/catalog surface: `packages/content/src/index.ts:1-15,91-105`.
- No broad tests, benchmark, browser inspection, listening test or complete campaign was run by this subagent. Historical test totals in `docs/IMPLEMENTATION_STATUS.md:15-19` are prior project evidence, not new results. Parent/sibling audits own UI, art, campaign experiments and broad release/performance checks.

Current defaults read from code are campaign rules 16, roster 4, generator 7 and battle rules 10; old versions remain explicit (`packages/sim/src/simulation.ts:123-163`; `packages/content/src/factions.ts:31-43`; `packages/mapgen/src/index.ts:1-10`; `packages/sim/src/warfare.ts:72-81`). Import success and the small save roundtrips below do not certify every historical migration.

## 2. Precise shipped-content inventory

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

Full per-ID values and source evidence: [`content.json`](content.json). Human-readable unit, faction, progression, mission, skill, resource and geography tables: [`catalog.md`](catalog.md).

### What the numbers do—and do not—mean

**Cultures versus races.** There are 24 authored political/cultural definitions and zero independent executable ancestry/race definitions. That does not mean the lore is all-human. The faction bible explicitly separates political bargains from ancestry, and describes varied peoples; no ancestry registry confers different bodies, immunities, diets, underground travel or flight to the common unit schema. The Vesper Court's vampiric patrons are canonical lore, but feeding, life-steal, resurrection and night bonuses are not implemented. Repeated seats after the first 24 inherit existing definitions (`docs/lore/FACTION_BIBLE.md:9-28`; `README.md:22-22`; `packages/content/src/index.ts:21-33`; `packages/sim/src/simulation.ts:142-175`).

**Unit definitions versus variants.** The 13 are 10 land definitions, of which one is the founding caravan, and three naval hulls. There are nine land military roles: Wayfinder, Oath guard, Ash pike company, Cinder plate cohort, Charter outriders, Reed skirmishers, Witness arbalesters, Kiln halberdiers and Road lancers. The ships are Charter transport, Coastwatch galley and Deepwake warship. All 13 have different rule profiles, but faction artwork is not another mechanically distinct roster. The four specialist land roles have actual research/building gates (`packages/content/src/index.ts:43-60`).

**Buildings versus improvements.** Five town buildings—Root cellar, Cinder workshop, Charter market, Witness archive, Charter harbor—are distinct from the 18 tile improvements. Improvement names such as Grove archive, Oreworks or Ashglass refinery are not extra entries in the town-building queue. Likewise, visible housing/district spread does not create extra canonical buildings (`packages/content/src/index.ts:36-42`; `packages/content/src/ecology.ts:71-83`; `packages/content/src/resources.ts:21-36`; `README.md:42-42`).

**Resources versus yields.** Food, industry, coin and knowledge are yield categories, not four additional deposit types. Influence is a faction development currency; formation XP, civic points and personal XP are separate progress stores. The eight deposits have four category labels, but labels alone do not implement luxury happiness or strategic magic. Ashglass is real extracted stock; no current spell consumes it (`packages/content/src/resources.ts:4-36`; `packages/sim/src/resources.ts:69-103`; `packages/sim/src/development.ts:12-24,176-211`; `packages/sim/src/magic.ts:20-37`).

**Names versus people.** Each culture supplies eight given and eight family fragments. The imported generator produces 1,536 distinct unsuffixed names across the pools and adds cycle suffixes after each pool's combinations. This satisfies a real faction-specific naming foundation, not 1,536 authored notable characters. Appointments derive identical role templates and a global entity serial; lore character seeds are explicitly future writing foundations (`packages/content/src/characters.ts:75-109`; `packages/sim/src/characters.ts:226-232`; `docs/lore/FACTION_BIBLE.md:18-28`).

**Events versus narrative content.** Actual campaign domain events describe founding, movement, research, sieges, casualties and other actions. They are not a registry of branching events, quests or crises. Current ruins record towns the campaign razed, not authored ancient-site encounters. The architecture's illustrative event store is design, while the actual canonical state holds `DomainEvent[]` and no event-choice/epoch registry (`ARCHITECTURE.md:134-155`; `packages/sim/src/types.ts:218-250`; `packages/sim/src/simulation.ts:373-388,523-524`; `packages/sim/src/siege.ts:164-168`).

## 3. Faction asymmetry: real ecological differences, shared strategic chassis

The complete 24-culture matrix is in `catalog.md`; every positive and negative biome modifier, cultivation destination, AI recruitment weight and profile is preserved in `content.json`. The first six cultures share the same recruitment vector; the remaining catalog produces nineteen distinct vectors overall. These are **AI preferences**, not human recruitment permissions or cost discounts (`packages/content/src/factions.ts:53-84`).

Three useful existing contrasts:

- **Ashen Compact versus Reedbound Council:** grassland food/temperate-forest industry versus marsh/rainforest food, with different unsuitable biomes and cultivation destinations. Site choice and worker/improvement allocation differ even though their military preference vector is identical (`packages/content/src/ecology.ts:39-43`).
- **Sable Steppe versus Vesper Court:** steppe food/desert coin with mounted preference versus temperate-forest knowledge/taiga coin with heavy-retainer preference. These are genuine different economic starting incentives. They are not nomadic settlement rules, vampiric sustain or exclusive mounted/undead rosters (`packages/content/src/ecology.ts:50-61`; `packages/content/src/factions.ts:70-81`; `README.md:22-22`).
- **Glass Tide versus Iron Covenant:** ocean/chalkland coin versus taiga/alpine industry. The ocean bonus is subject to ordinary worked-tile/depth legality, and alpine affinity does not make mountains traversable or cultivable (`packages/content/src/ecology.ts:43-44`; `packages/sim/src/territory.ts:326-344`; `packages/sim/src/naval.ts:46-59`).

The effects are read from the settlement owner's definition on each worked tile; they can therefore change the value of captured developed land under a new owner. Cultivated biome overlays persist, so conquest is not merely a building transfer. However, negative components are summed with the other tile components and clamped at zero; an advertised drawback does not always reduce an already-zero final yield. This limits the magnitude of some affinities without making them fake (`packages/sim/src/territory.ts:351-361,447-466`).

What is missing for deep asymmetric replay is **a different constraint or opportunity**, not just another +1. Current new factions start with the same caravan, scout, treasury and knowledge; production prerequisites have no faction gates; every Waykeeper receives the same aptitude dictionary; all progression choices and victory eligibility are common. Lore tensions, external rivals and supernatural outlooks have no separate runtime agendas yet (`packages/sim/src/simulation.ts:151-175`; `packages/content/src/index.ts:20-33`; `packages/sim/src/characters.ts:226-232`; `packages/sim/src/progression.ts:72-110`). This is SYS-003, not a claim that the existing ecology and original writing lack value.

## 4. System depth and actual loop connections

The labels here are qualitative code assessments, not a numerical completion percentage. **Integrated foundation** means multiple genuine rule links exist; it is not an assertion that every 1.0 gate or browser flow has passed.

### 4.1 Exploration, land and settlement development — integrated foundation, strongest current economic layer

The working chain is:

`charted geography → connected owned claim → legal paid improvement → active construction turns → actual worker assignment → tile yield / deposit stock → research, development or coin → expansion and military funding`.

Ownership, worker capacity and improvements are separate. The town center works automatically; owned outer tiles do not automatically produce. Improvement eligibility checks actual terrain/biome/features/deposit and research, not just an icon. Paid cultivation changes a sparse biome overlay, not physical mountain/water access, river crossings or historical battle terrain. Claiming, improvements and cultivation have visible canonical quotes; distance and completed works raise costs. Capital designation is independent of population tier and adds a small center yield (`packages/sim/src/territory.ts:286-344,351-380`; `packages/sim/src/resources.ts:69-81`).

Growth now uses increasing food requirements/consumption, founding fees and civic upkeep rather than the old 20-population/six-worker/37-claim ceilings. This is a meaningful foundation for wide versus tall planning; it is not a completed stability, governor or taxation model (`packages/sim/src/growth-economy.ts:9-42`; `packages/sim/src/territory.ts:296-306`; `packages/sim/src/simulation.ts:262-275`). The severe counterweight limitation is discussed under SYS-007: deficit food never reduces existing population.

Map scale is genuine data, not a content multiplier: Tiny 1,536 cells, Small 40,960, Standard 98,304, Huge 196,608 and Legendary 307,200; twelve biomes coexist with five physical terrain classes, three depth classes and seven natural features. Three modern layouts exist. These figures are generated from exported dimensions, not measured performance or a claim that every generated world has equal strategic quality (`packages/mapgen/src/index.ts:8-61`; `catalog.md`). Independent powers, legendary site interactions, discoverable narrative choices and magical geography remain absent from the executable catalog/state (SYS-006).

### 4.2 Economy and progression — genuine opportunity costs, shallow long-term variety

Production spends coin upfront, consumes industry over a FIFO queue of at most five, and produces real buildings or singleton formation armies. There is no production cancel/reorder command. Research is an immediate knowledge purchase after prerequisites, not a research queue or workforce allocation. Both have coherent current consumers rather than mock progress bars (`packages/sim/src/simulation.ts:245-260,442-455`; `packages/sim/src/progression.ts:72-110`; `packages/sim/src/types.ts:175-216`).

The ten technologies split into Craft, Stewardship, Navigation and Civic branches. They link to improved yields, special land works, frontier growth, new troops, harbors/ocean travel and victory preparation. Institutions and doctrines are not merely more technology nodes: one permanent institution spends coin for a food/coin orientation, and one permanent doctrine chooses armor versus strategic movement. Four institution-linked and four doctrine-linked traditions later spend faction influence, coin and sometimes materials (`packages/content/src/progression.ts:51-82`; `packages/content/src/development.ts:79-88`).

The 25 development nodes add more depth than a catalog limited to the older two institutions/two doctrines suggests:

- **Eight formation nodes:** battle XP follows surviving formation identity; Assault/Line/Missile specializations are exclusive, with an advanced shared veteran endpoint. Actual attack, armor, initiative, range and opening morale effects reach combat snapshots.
- **Nine hearth nodes:** local civic points, population/building gates and exclusive advanced Provisions/Craft/Commerce specialization. Higher output can incur recurring upkeep; building-dependent bonuses become dormant if the building is lost, and development remains with a captured town.
- **Eight realm traditions:** influence earned from functioning developed towns, tied to permanent institution/doctrine choices. This is separate from practical knowledge, personal XP and the arcane discovery list.

Quotes enforce prerequisites, costs, scope, ownership and blockers before payment. Formation XP is only awarded to surviving actual battle participants; siege/occupation pause civic gains (`packages/content/src/development.ts:51-89`; `packages/sim/src/development.ts:64-121,152-211,224-233`; `packages/sim/src/warfare.ts:55-65`). All current effects remain additive economy/combat bonuses, not transformations of government or faction-specific law. The AI scores bounded candidates rather than possessing a long-horizon specialization plan (`packages/sim/src/development.ts:258-269`).

Resource production is contingent on matching deposit, completed work and a genuinely worked tile; siege/occupation suspend extraction. Materials buy fourteen advanced development nodes, or sell at a fixed per-resource price through an active owned market. There are no rival trading partners or price dynamics in this sale, no material gate for cavalry/heavy troops, no supply-route network, and no luxury happiness or magical expenditure tied to the category names (`packages/sim/src/resources.ts:51-103`; `packages/content/src/development.ts:33-48`; `packages/content/src/index.ts:20-56`). Resource count expansion without additional competing uses would multiply similar stockpiles rather than strategic interdependence (SYS-010).

### 4.3 Armies, fleets and tactical combat — substantial integrated core, bounded player control

Formation identity, strength, morale and fatigue survive merge/split/transfer. The slowest formation sets march speed, best scout sets sight, upkeep sums across formations, and reorganization takes the minimum already-spent movement. A detachment supports twelve formations; healthy marshal skill progression supports larger armies up to twenty, and leader loss preserves excess formations with a movement penalty instead of deleting them (`packages/sim/src/army-composition.ts:8-46,82-120`; `packages/sim/src/characters.ts:70-89`; `packages/content/src/characters.ts:61-64`).

Transport is a real relationship between existing land armies and a fleet. Shore adjacency, movement and capacity are validated; every hull must be ocean-capable plus national Ocean navigation to cross deep water. Land/water domains stay distinct. A transport contributes eight formation spaces, and cargo losses are tied to hull loss rather than invisible teleporting passengers (`packages/content/src/index.ts:50-52`; `packages/sim/src/naval.ts:35-85,90-140`). This is more depth than simply enabling all land units to embark for free.

Current battles use up to twenty formations per side, five columns/four ranks and twelve rounds. Land soldiers have persistent identities **within the battle** and actual target/casualty facts; the campaign persists formation strength rather than permanent cross-battle soldier biographies. A naval formation is one hull whose strength is durability. Automatic and manual tactical rounds use the same kernel, with separate genuine battle-ability handling in the campaign wrapper (`packages/sim/src/combat/index.ts:6-32,155-245`; `packages/sim/src/combat/individual.ts:12-32,53-90`; `packages/sim/src/warfare.ts:199-227,285-330`).

Role differences are mechanically meaningful: arbalesters halve target armor in the individual attack calculation; pikes/halberdiers screen mounted charges and gain an anti-mounted bonus; unprotected flanks, cohesion, fatigue, support, terrain and firing frontage change attacks. Morale routes, pursuit and legal retreat cells produce persistent losses; no retreat route destroys the formation container and attached-character consequences follow (`packages/sim/src/combat/individual.ts:53-90`; `packages/sim/src/combat/index.ts:90-123,199-218`; `packages/sim/src/warfare.ts:228-246`; `packages/sim/src/characters.ts:377-395`).

The limits matter: formation deployment follows lexicographic creation IDs, not player-selected front/rear roles; the four orders apply to the whole side. There is no general multi-army reinforcement pipeline or supply map. All units on a defending hex participate together, and above twenty the whole battle is refused—SYS-001, not merely a desired extra feature. A bounded, role-aware deployment/reserve system would add more agency than copying real-time Total War control or adding visual soldier count (SYS-009).

### 4.4 Siege, conquest and occupation — integrated outcomes, not a political simulation

A besieging adjacent land army imposes zero food yield and halves other town yields; defense and supply values decline on real turns. Occupy, sack, raze and context-legal liberation are distinct persistent choices. Occupation preserves buildings with temporary penalties; sack transfers finite victim coin, loses population/buildings and food; raze produces a resettleable ruin; liberation returns a town to its original founder if that is a third faction. Land, capital, development, characters and victory projects reconcile with the ownership change (`packages/sim/src/siege.ts:39-53,117-192`; `packages/sim/src/territory.ts:447-466`; `packages/sim/src/simulation.ts:462-519`).

There is no client/vassal outcome and no cultural loyalty or rebellion risk underneath the timers. At zero siege supplies only militia morale declines: real garrison formations do not suffer supply casualties, while general turn refresh repairs morale/fatigue. All sieges start from the same defense/supply baseline, not a developed fort/wall building chain (`packages/sim/src/siege.ts:20-31,51-51,117-125`; `packages/sim/src/simulation.ts:297-304`; `packages/content/src/index.ts:36-42`). These omissions restrict conquest counterplay and political variety (SYS-005/SYS-007).

### 4.5 Diplomacy and politics — a functional peace transaction, very narrow strategic scope

The working loop is `observed contact → formal war → possible conquest grievances → proposed one-way coin payment + truce duration → AI/player acceptance → actual transfer and war removal → binding no-war period → peaceful expiry`. Coins are checked again at acceptance, so offers are not automatically escrowed. Acceptance releases incompatible sieges via the ordinary reconciliation path. AI reasons refer to observed military pressure, war duration, coin terms and grievances (`packages/sim/src/diplomacy.ts:71-189`; `packages/sim/src/simulation.ts:471-474,512-514`).

This is not a general negotiation builder: there is no resource/settlement clause, alliance, access, guarantee, intelligence exchange or subject relationship. Claimed borders do not block military passage, so open borders are neither required nor negotiable. Trust and respect are saved but do not influence the present evaluator; the executed comparison returned identical assessments at opposite trust extremes (`packages/sim/src/diplomacy.ts:9-40,169-189`; `packages/sim/src/territory.ts:296-306`; `probe-results.json`). Rulers, succession, loyalty and internal cultural pressure are designed but have no canonical system yet (`packages/sim/src/types.ts:218-250`; `GAME_1_0_SCOPE.md:187-196`).

### 4.6 Characters and magic — real personal state, limited identity and effects

The four roles are Hearth marshal, Road witness, March engineer and Waykeeper. Survey, refit and sabotage commit real coin and stationary turns; combat/movement/peace can interrupt applicable work. Refit restores existing formation strength but not destroyed formations, and survey reveals remembered geography rather than hidden armies. Missions award XP only for actual changes; wounds/death follow explicit consequences. Seventeen skill nodes include exclusivity/prerequisites and six current advanced branches (`packages/content/src/characters.ts:38-68`; `packages/content/src/development.ts:95-101`; `packages/sim/src/characters.ts:265-281,325-395`).

The magical foundation correctly separates national discovery from personal ability. A functioning Witness archive and knowledge buy Contained ember projection or Measured rune binding; a healthy attached Waykeeper still needs Flame/Rune aptitude. Cinder thread damages an enemy formation; Bound ward absorbs later damage, not past casualties. Both have range, use limits and shared strain; Set shields is a separate mundane Oath-guard fatigue action, and Rally is a separate commander morale action. There are two usable spells, not a four-spell system counting their discoveries twice (`packages/content/src/magic.ts:5-27`; `packages/sim/src/magic.ts:17-60`; `README.md:70-70`).

Every recruited caster starts with the same Flame 1/Rune 1 dictionary and no skill tree. There is no personal path growth, asymmetric spell access, ritual, summons, artifice, sacred/occult system or magical-site loop. Ashglass extraction does not close those missing links. This is an architecturally sensible slice of a much larger required system, not a completed Dominions-like combinatorial magic economy (SYS-004/SYS-011).

### 4.7 AI and long-campaign strategy — integrated functional planners, insufficient strategic differentiation

There is genuine cross-system AI plumbing: observations feed legal command proposals; shared budget accounting reserves founder/project/naval funding; land planning sees real site quotes; characters, ships, merging, research and project host safety have explicit policies. The planner can target observed enemy project hosts and considers host threat/support rather than always choosing the first town (`packages/ai/src/index.ts:20-145,145-191`; `packages/ai/src/progression.ts:20-95`). These are foundations worth retaining.

The current policy still has common structural rails: first missing common building, specifically Charter compact as institution, doctrine selected from current war/no-war, local military strength tests and per-pass candidate limits. It is a stateless proposal API rather than a saved theater/operation/long-horizon faction agenda. No difficulty setting exists in campaign creation; pace scales late payments/response windows, not AI skill. Existing status admits a Standard/four-seat contact failure, but this subagent has not independently measured it (`packages/ai/src/index.ts:128-145,194-235`; `packages/ai/src/progression.ts:118-164`; `packages/sim/src/simulation.ts:123-134`; `docs/IMPLEMENTATION_STATUS.md:15-19`). The sibling campaign audit must determine observed engagement and competence; legal one-turn proposals alone do not establish either.

### 4.8 Victory — one real interruptible path, not five implemented paths

Prosperity requires Civic accounts, either institution, and at least three unoccupied towns each containing a market and archive. The chosen host must be free of siege. Payment is upfront; current Standard/Long/Epic commitments are 18,000/80,000/240,000 coin and the response windows are 20/40/60 active turns. Short is the explicitly small test/skirmish profile. Supporting occupied towns cease to qualify; a besieged supporting town still counts toward infrastructure if unoccupied, while siege of the host pauses the project. Capture/raze of the host cancels it without refund (`packages/content/src/progression.ts:30-49,78-82`; `packages/sim/src/progression.ts:46-68,90-156`).

A successful project sets the only `Victory` variant and locks further commands. Conquering all rivals is not independently checked for Dominion. Hegemony, Legacy and Ascendancy are named design targets, not hidden implemented modes. Gate B requires at least three tested paths while the master product brief asks for five; neither is met by the current single path, and three tests would not silently satisfy the five-path specification (`packages/sim/src/progression.ts:17-18,142-156`; `packages/sim/src/simulation.ts:320-342`; `DEFINITION_OF_DONE.md:16-33`; `MASTER_PROMPT.md:1821-1837`).

### 4.9 Audio — no implementation found in the bounded scan

`audio-search.json` records all 179 non-test production TypeScript/TSX files and exact patterns: browser audio APIs, common audio-library names, audio file extensions and audio/music/sfx/volume/mute terms. There were **zero source hits** and **zero tracked audio filenames** across the repository. This supports “no implemented audio found,” not a browser listening claim or proof about untracked/external media. The scan implementation is `inventory.ts:15-16,50-52,69-71`. Coordinate SYS-013 with the art audit instead of double-counting it.

## 5. Principles from the reference games, without cloning

These are comparison criteria, not claims that Theandril should reproduce proprietary systems, content or numerical scale. The repository explicitly permits structural inspiration and forbids copied terminology/content (`MASTER_PROMPT.md:43-50,69-125`; `.agents/skills/theandril-research-magic/SKILL.md:59-87`).

| Quality principle | Current foothold | Missing premium-depth connection |
|---|---|---|
| Readable 4X planning: site choices, opportunity cost, several ways to win | Signed tile yields, paid queues, specialist land works, permanent choices | Only one terminal objective; thin late unlock set; famine/arrears weakly constrain growth already achieved |
| Asymmetric fantasy strategy: national knowledge × scarce personal capability × geography/resources × counters | Separate national research and saved personal aptitude; damage/ward interaction | Identical caster access, two effects, no ritual/site/artifact/sacred/occult competition |
| Army-level operational strategy: organization, positioning, combined arms and enduring casualties | Persistent companies, earned commander capacity, naval cargo risk, real pike/mounted/missile rules | ID-ordered deployment, no bounded reserves above cap, no strategic supply or persistent theater plan |
| Political strategic storytelling: obligations and internal/external pressures create changing goals | War, timed truces, paid peace, conquest grievances, distinct aftermath | No alliance/client/access system, no loyalty or crises, no independent powers or authored event choices |

The preceding system sections supply the code evidence for each foothold/gap. The priority is to connect existing systems into competing strategies, not to reach a content number by renaming otherwise equivalent entries.

## 6. Prioritized release findings

| Priority | ID | Finding | Effort |
| --- | --- | --- | --- |
| P1 | SYS-001 | Legal stacks above twenty formations become unattackable | L |
| P1 | SYS-002 | Prosperity is the only terminal victory path | XL |
| P1 | SYS-003 | Twenty-four cultures do not yet provide twenty-four strategic rule identities | XL |
| P1 | SYS-004 | Magic is a correct two-spell battle foundation, not the promised strategic system | XXL |
| P1 | SYS-005 | Diplomacy stops at war and paid truces; political relationships are not executable | XL |
| P1 | SYS-006 | The middle and late campaign have no independent actors, authored event choices or epochs | XL |
| P1 | SYS-007 | Starvation and insolvency barely constrain an already-built empire | L |
| P1 | SYS-008 | Functional AI is integrated but strategic personalities, theaters and difficulty are not | XL |
| P2 | SYS-009 | Tactical deployment is fixed by creation IDs rather than player intent | M |
| P2 | SYS-010 | Material economy has extraction but few strategic dependencies and no bilateral trade | L |
| P2 | SYS-011 | Generated names and skill trees do not yet create political or narrative characters | L |
| P2 | SYS-012 | Production queues cannot be cancelled or reprioritized through a public command | M |
| P2 | SYS-013 | No audio implementation or tracked audio assets found in bounded production scan | L |
| P3 | SYS-014 | Research design checkpoint predates the current resource/development expansion | XS |

P0: 0, P1: 8, P2: 5, P3: 1; 14 entries. P0 means demonstrated catastrophic integrity/security failure or general unplayability; none established here. P1 blocks premium 1.0 or requires an explicit scope decision. XS/S/M/L/XL/XXL are increasing relative scope, from contained text to a multi-system program.

Priorities distinguish severity/order from scope membership: a P2 feature may still be required by the declared release gate, but should not displace a P1 game-breaking rule or missing defining loop. Efforts are relative engineering/content scope, not calendar promises. No production implementation is performed here. Detailed machine-readable entries with dependencies, evidence, verification limits and recommended acceptance are in [`findings.json`](findings.json).

### SYS-001 — P1 / L — Legal stacks above twenty formations become unattackable
**Status:** verified-rule-defect.
**Impact:** A player can deny field combat and settlement conquest by keeping at least twenty-one formations on a hex. This removes intended victory-project counterplay and can freeze fronts; army-container capacity does not constrain total co-located formations.
**Current code:** Field attack sums all defenders and rejects above twenty. Siege assault does the same; direct field attacks on town garrisons are forbidden. Normal queue production creates singleton armies on their town without a stack-wide limit. Siege supplies only affect militia morale, not the twenty-one actual garrison formations.
**Evidence:** `packages/sim/src/warfare.ts:84-107`; `packages/sim/src/siege.ts:64-82`; `packages/sim/src/siege.ts:117-125`; `packages/sim/src/simulation.ts:245-260`; `packages/sim/src/simulation.ts:442-455`.
**Fresh verification / limit:** probes.ts succeeded. A fresh generated world reached twenty-one co-located scouts on turn 52 using twenty paid recruitments, three paid buildings and real turns, no injected state. Separate save-valid authored field fixture rejected twenty-one and accepted twenty; authored garrison stayed at twenty-one / 1260 strength after ten siege turns and still rejected assault at zero defenses and supplies. Rejections did not mutate the state hash; saved continuations validated.
**Recommended bounded action:** Define bounded battle participation plus reserves/reinforcement or an explicit legal strategic stacking policy. Never silently delete excess troops. Preserve a way to attack every reachable hostile stack and siege every reachable town; test 20, 21 and larger field/garrison/fleet stacks through paid production, save/load and AI.
**Dependencies:** Battle capacity/performance budget; Historical battle/save compatibility; AI force assembly and target selection. **Related gates:** F, H, B.

### SYS-002 — P1 / XL — Prosperity is the only terminal victory path
**Status:** implemented-foundation-with-release-gap.
**Impact:** All strategies converge on the same three-town economic project. Military conquest is an input to Prosperity, not an implemented Dominion victory, and elimination is not a separate ending.
**Current code:** Victory schema literally permits only prosperity, set only when the Hearth Exchange completes. Gates require at least three distinct tested victories; MASTER_PROMPT asks for five named paths. Standard/Long/Epic mainly increase Civic accounts and project prices/response windows, not the strategic systems between them.
**Evidence:** `packages/sim/src/progression.ts:17-29`; `packages/sim/src/progression.ts:46-68`; `packages/sim/src/progression.ts:112-156`; `packages/content/src/progression.ts:25-49`; `packages/sim/src/simulation.ts:319-330`; `DEFINITION_OF_DONE.md:16-33`; `MASTER_PROMPT.md:1821-1837`.
**Fresh verification / limit:** Imported victory schema and traced project eligibility, pause/cancellation, progress and end-turn guard. No complete campaign was run by this subagent.
**Recommended bounded action:** Agree the release path set before content expansion. Implement genuinely distinct progress, public warnings, terminal predicates and recoverable counterplay for the agreed additional paths; verify at least three under Gate B without silently dropping the five-path product target. Add explicit defeat/elimination handling and earned long-game outcome evidence.
**Dependencies:** SYS-001; Diplomatic and supernatural rules for paths that rely on them; Campaign engagement/balance evidence. **Related gates:** B, C, J.

### SYS-003 — P1 / XL — Twenty-four cultures do not yet provide twenty-four strategic rule identities
**Status:** depth-and-content-gap.
**Impact:** Faction selection changes ecological optimization, presentation and AI recruitment preference, but not access to units, casters, research, victory conditions or political obligations. Replay differences are much narrower than the lore promises.
**Current code:** Twenty-four stable culture definitions, signed biome affinities and name pools are real. All recruit the same thirteen units at the same prices. All Waykeepers start Flame 1/Rune 1. Nineteen recruitment-weight vectors exist; the first six cultures share one. Extra campaign seats repeat definitions, not new cultures or ancestries.
**Evidence:** `packages/content/src/factions.ts:3-84`; `packages/content/src/ecology.ts:39-64`; `packages/content/src/index.ts:20-60`; `packages/sim/src/simulation.ts:123-175`; `packages/sim/src/characters.ts:226-232`; `packages/content/src/magic.ts:5-9`; `docs/lore/FACTION_BIBLE.md:9-28`.
**Fresh verification / limit:** Imported all definitions and deduplicated weight vectors; traced initial state, production prerequisites and caster recruitment.
**Recommended bounded action:** Build a small contrast cohort of original faction mechanics, each with an economic constraint, military or magical exception and opponent counterplay, before expanding all cultures. Retain the shared engine; add data-driven capabilities rather than faction-specific engine forks. Treat count targets as unmet until distinct decisions or a documented non-filler equivalent are demonstrated.
**Dependencies:** SYS-004; SYS-005; AI valuation of new capability data; Content/save versioning and lore canon. **Related gates:** F2, J.

### SYS-004 — P1 / XXL — Magic is a correct two-spell battle foundation, not the promised strategic system
**Status:** designed-unimplemented-release-systems.
**Impact:** The core fantasy strategy differentiation is missing: map-changing magical competition, scarce caster access and supernatural counterplay cannot arise from two universal battle actions.
**Current code:** Two Arcane Theory purchases, two personal paths, two spells (damage and ward), one fixed caster role. No exported rituals, summons, recipes/items/relics, sacred/occult progression or discoverable magical sites. Ashglass is an arcane-category resource, but its current material consumers are civic development, not spells or rituals.
**Evidence:** `packages/content/src/magic.ts:5-38`; `packages/sim/src/magic.ts:17-60`; `packages/content/src/resources.ts:10-35`; `packages/content/src/development.ts:33-48`; `packages/sim/src/types.ts:175-250`; `packages/content/src/index.ts:91-105`; `DEFINITION_OF_DONE.md:90-107`.
**Fresh verification / limit:** Validated exported content, inspected complete canonical command/state shapes and traced actual national/personal checks plus resource-cost consumers. No browser casting claim.
**Recommended bounded action:** First close one original map-level magical loop: site discovery, paid resource/caster eligibility, strategic effect, visible warning and counteraction, with AI/save/replay. Then extend schools, faction access, artifice and sacred/occult content in tested batches; do not inflate counts by treating research unlocks and their same spells as independent effects.
**Dependencies:** Magic geography/event hooks; Caster capability progression; Resource consumption and counterplay; SYS-003. **Related gates:** F2, J.

### SYS-005 — P1 / XL — Diplomacy stops at war and paid truces; political relationships are not executable
**Status:** depth-and-release-gap.
**Impact:** No alternate way to organize power, negotiate access, form coalitions or make a client network. Internal tensions authored in the lore have no political rule consequences.
**Current code:** Only one-way coin peace terms plus 5-30 turn binding truces. Trust/respect are recorded but absent from peace utility and war selection. Grievances and war age do affect peace. No access, alliance, guarantee, tribute/client, settlement/resource exchange or intelligence clauses; four capture outcomes omit client rule. No ruler/loyalty/succession/rebellion state.
**Evidence:** `packages/sim/src/diplomacy.ts:9-40`; `packages/sim/src/diplomacy.ts:71-88`; `packages/sim/src/diplomacy.ts:117-189`; `packages/ai/src/diplomacy.ts:11-41`; `packages/ai/src/index.ts:208-232`; `packages/sim/src/siege.ts:20-31`; `packages/sim/src/types.ts:218-250`; `GAME_1_0_SCOPE.md:164-196`.
**Fresh verification / limit:** Traced complete diplomacy state and evaluator, AI diplomatic policy, capture enum and canonical state. Detached observations with trust -100/respect 0 and trust 100/respect 100 returned identical peace assessments in an executed probe.
**Recommended bounded action:** Deliver a bounded clause/obligation foundation beginning with access, exchange and client/tribute relationships, including breach and AI valuation. Connect meaningful relationship memory to actual decisions. Add only strategically scoped internal pressure needed by the selected factions/path, not a life-simulation wishlist.
**Dependencies:** Movement/territory rule hooks; SYS-002; SYS-003; Observation privacy and save compatibility. **Related gates:** G, H, B.

### SYS-006 — P1 / XL — The middle and late campaign have no independent actors, authored event choices or epochs
**Status:** absent-release-content-and-systems.
**Impact:** Exploration finds geography, resources and peer realms but no independent political ecology or authored discoveries. Once common development is exhausted, the remaining activity is expansion, repeated war and funding the same project.
**Current code:** No exported minor-power, landmark, quest or branching-event registries, and no corresponding canonical actor/event/epoch state. Ruins are generated by razing existing towns, not authored dungeon/site content. Domain events are factual action logs; they are not 150 context-aware event templates. Turn resolution advances the existing economy, combat support and project systems only.
**Evidence:** `packages/content/src/index.ts:1-15`; `packages/content/src/index.ts:91-105`; `packages/sim/src/types.ts:218-250`; `packages/sim/src/simulation.ts:220-317`; `packages/sim/src/simulation.ts:373-388`; `packages/sim/src/siege.ts:164-168`; `GAME_1_0_SCOPE.md:258-285`; `GAME_1_0_SCOPE.md:341-359`.
**Fresh verification / limit:** Imported all content exports, indexed the strict command/state boundary and inspected founding/raze and turn phase code. Absence is bounded to the audited production architecture; no claim that lore lacks these ideas.
**Recommended bounded action:** Author one bounded independent-power/site/event loop with persistent consequences and AI choices, then a state-triggered epoch/crisis that changes priorities rather than just prices. Establish decision-density and counterplay evidence before targeting hundreds of turns. Expand templates only after the runtime loop works.
**Dependencies:** SYS-005; SYS-004; Event persistence/AI evaluation; Campaign pacing evidence. **Related gates:** B, J.

### SYS-007 — P1 / L — Starvation and insolvency barely constrain an already-built empire
**Status:** verified-rule-behavior-and-design-risk.
**Impact:** Food deficits only stop growth; depleted treasuries only subtract one movement (minimum one). Unpaid troops retain strength and recover morale/fatigue. Supply pressure cannot defeat a stranded field force or real garrison, weakening economic, siege and logistics counterplay.
**Current code:** Food is clamped to zero with no starvation loss. Upkeep is clamped to zero debt, and the sole shortfall hook is movement -1. Morale +10 and fatigue -15 are unconditional for formations each turn. Siege supply depletion affects militia morale only.
**Evidence:** `packages/sim/src/growth-economy.ts:9-19`; `packages/sim/src/simulation.ts:237-287`; `packages/sim/src/simulation.ts:297-304`; `packages/sim/src/siege.ts:117-125`.
**Fresh verification / limit:** An explicitly authored save-valid population-200 town with food yield 11 versus consumption 800 and zero treasury remained population 200 for ten real turns. One unpaid heavy formation stayed strength 85, recovered morale from 20 to 85/fatigue from 60 to 0, and kept movement 1. This proves rules behavior, not earned population-200 reachability or campaign exploit frequency.
**Recommended bounded action:** Choose explicit, telegraphed famine/arrears/supply consequences with a recovery path and bounded implementation. Make siege isolation affect actual defending formations. Avoid adding punishing attrition without logistics UI and AI planning; test sustained deficits, recovery and no insolvency softlock.
**Dependencies:** Shared economy forecast; AI sustainable budgets; SYS-001; Historical rules versioning. **Related gates:** B, C, F.

### SYS-008 — P1 / XL — Functional AI is integrated but strategic personalities, theaters and difficulty are not
**Status:** implemented-foundation-with-depth-gap.
**Impact:** The engine can legally use many systems, but major rivals tend toward a common economic plan and local opportunistic war. Pacing choices cannot substitute for skilled, differentiated opposition over a long campaign.
**Current code:** Observation-only planner coordinates budgets, research, land, officers, fleets, merging, target movement and victory-host safety. It adopts Charter compact specifically, chooses doctrine from current war/no-war, builds the first missing non-coastal building in shared order, and attacks adjacent unprotected forces when their observed strength fits. No persistent national-goal/theater/operation state or difficulty setting is present in the audited canonical/options/planner interfaces.
**Evidence:** `packages/ai/src/index.ts:20-49`; `packages/ai/src/index.ts:80-145`; `packages/ai/src/index.ts:163-235`; `packages/ai/src/progression.ts:47-95`; `packages/ai/src/progression.ts:118-164`; `packages/sim/src/simulation.ts:123-134`; `docs/IMPLEMENTATION_STATUS.md:15-19`; `GAME_1_0_SCOPE.md:287-303`.
**Fresh verification / limit:** Code review, not an AI competency soak. Existing status documents a Standard/four-seat contact regression; this audit does not reclassify that historical report as a fresh test result.
**Recommended bounded action:** Retain the legal proposal architecture. Add bounded, saved strategic commitments and theater coordination tied to distinct victory threats/faction capabilities; expose disclosed difficulty policy separately from pace. Validate multiple earned campaign trajectories and contact/overseas counterplay, not only one-turn command presence.
**Dependencies:** Sibling campaign/testing results; SYS-001; SYS-002; SYS-003; SYS-007. **Related gates:** C, B.

### SYS-009 — P2 / M — Tactical deployment is fixed by creation IDs rather than player intent
**Status:** depth-and-control-gap.
**Impact:** Composition and positioning matter, yet the player cannot deliberately place the pike screen ahead of missiles or arrange a reserve. Identical role purchases can occupy different ranks based on unrelated serial allocation.
**Current code:** Deployment sorts formation IDs lexicographically then assigns row=floor(index/5), column=index%5. Four army-wide orders exist. Individual soldiers are canonical casualties, not individually commanded tactical agents. Arbalester, pike and mounted rules have real effects.
**Evidence:** `packages/sim/src/warfare.ts:55-71`; `packages/sim/src/combat/index.ts:6-18`; `packages/sim/src/combat/index.ts:134-175`; `packages/sim/src/combat/individual.ts:53-90`; `packages/sim/src/types.ts:175-216`; `GAME_1_0_SCOPE.md:241-255`.
**Fresh verification / limit:** Traced deployment and command schemas plus tactical kernel. No outcome comparison from renamed identities was run, so the claim concerns layout control, not a measured win-rate change.
**Recommended bounded action:** Provide a compact deployment policy/formation-slot control with preview and a sensible role-aware default, plus matching AI placement. Keep the shared fast deterministic kernel; an RTS command layer is not necessary.
**Dependencies:** SYS-001; Battle snapshot/schema compatibility; Battle UI review. **Related gates:** F.

### SYS-010 — P2 / L — Material economy has extraction but few strategic dependencies and no bilateral trade
**Status:** depth-gap.
**Impact:** Deposits create site decisions and progression costs, but denying horses does not prevent cavalry, denying iron does not prevent heavy recruitment, and luxury/arcane labels do not produce distinct happiness or casting systems. Late surpluses funnel into an unlimited fixed-price coin sink.
**Current code:** Eight resources, eight extraction improvements, fourteen material-cost development nodes; sales consume own stock at an owned active market. Unit/building schemas have coin and industry costs but no material costs. No buy, bilateral resource exchange, route demand or processing-chain commands.
**Evidence:** `packages/content/src/resources.ts:4-36`; `packages/content/src/development.ts:33-48`; `packages/sim/src/resources.ts:69-103`; `packages/sim/src/development.ts:88-104`; `packages/content/src/index.ts:20-56`; `packages/sim/src/simulation.ts:442-455`.
**Fresh verification / limit:** Imported registries and traced all production material-cost consumers; compared with production and sale implementations. No balance claim about dominant income sources without sibling campaign measurements.
**Recommended bounded action:** Before multiplying resources to forty, connect a few to meaningful substitution, recruitment/equipment or ritual choices and one genuine exchange/access mechanism. Give every new resource a distinct contestable use; preserve affordability and catch-up options.
**Dependencies:** SYS-005; SYS-007; SYS-004; Economy balance and observation-safe AI. **Related gates:** J, B, F2.

### SYS-011 — P2 / L — Generated names and skill trees do not yet create political or narrative characters
**Status:** depth-gap.
**Impact:** Officers are valuable military attachments but culturally named replacements share the same role parameters. Lore biographies do not become campaign relationships, choices or notable people.
**Current code:** Four roles, three missions, seventeen skill definitions, one Rally; twenty-four 8x8 name pools yield 1536 distinct unsuffixed names. Naming uses global serial and appends cycles. No authored biography-bearing characters, trait/loyalty/relationship/office systems; Waykeeper has no skill nodes and fixed aptitude.
**Evidence:** `packages/content/src/characters.ts:7-51`; `packages/content/src/characters.ts:75-109`; `packages/content/src/development.ts:95-101`; `packages/sim/src/characters.ts:17-27`; `packages/sim/src/characters.ts:226-232`; `packages/sim/src/characters.ts:325-395`; `docs/lore/FACTION_BIBLE.md:18-24`.
**Fresh verification / limit:** Programmatic distinct-name count; role/skill imports; canonical character schema, recruitment and mission inspection. Names are a real procedural naming pool, not proof of 1536 unique biographies.
**Recommended bounded action:** Attach a small set of original, state-triggered traits/relationships or office conflicts to actual mission and battle histories. Give caster differentiation real eligibility/cost effects. Do not expand names alone to claim notable-character depth.
**Dependencies:** SYS-006; SYS-005; SYS-004; Lore canon and factual chronicle constraints. **Related gates:** J, B.

### SYS-012 — P2 / M — Production queues cannot be cancelled or reprioritized through a public command
**Status:** control-gap.
**Impact:** A player can commit up to five orders, but cannot undo a mistaken queue or switch priorities during an emerging war; conquest clears it, ordinary management does not.
**Current code:** The only production command is queue; upfront coin payment, progress accumulation and FIFO completion are implemented. There is no cancel/reorder production command in the complete current discriminated command schema. Land work and travel have explicit cancellation, so the omission is specific to production.
**Evidence:** `packages/sim/src/types.ts:175-216`; `packages/sim/src/simulation.ts:245-260`; `packages/sim/src/simulation.ts:442-455`; `packages/sim/src/siege.ts:169-176`.
**Fresh verification / limit:** Imported complete command schema and traced queue and completion code. Browser affordance audit remains with parent.
**Recommended bounded action:** Define cancellation/reordering with explicit coin refund and sunk-industry policy, then add canonical commands and UI/AI consumers. Test partial construction, naval berth interruption, capture and save/replay so cancellation cannot mint value.
**Dependencies:** Production/UI ownership; Historical command versioning. **Related gates:** I.

### SYS-013 — P2 / L — No audio implementation or tracked audio assets found in bounded production scan
**Status:** bounded-absence.
**Impact:** No evidenced music, ambience, command feedback or battle sound layer supports premium presentation. Visual animation alone cannot supply the missing audio feedback.
**Current code:** Scanned 179 tracked non-test production TypeScript/TSX files for browser audio APIs, common audio libraries, audio extensions and audio/music/sfx/volume/mute terms: zero hits. All tracked repository filenames contain no matched audio extension.
**Evidence:** `docs/hermes-analysis/systems/inventory.ts:15-16`; `docs/hermes-analysis/systems/inventory.ts:50-52`; `docs/hermes-analysis/systems/inventory.ts:69-71`.
**Fresh verification / limit:** Reproducible source/filename scan in inventory.ts; exact file set and regexes retained in audio-search.json. Not a browser listening or network-capture test; CSS/HTML, external streaming or untracked assets are outside the source scan.
**Recommended bounded action:** Coordinate with art audit: specify a restrained original audio palette, user-gesture activation, separate music/effects volumes and mute, saved preferences and bounded voice counts. Trigger playback from confirmed presentation/domain facts, never from a second combat simulation; record licensing/provenance.
**Dependencies:** Art/audio direction; Presentation events; Browser playback and accessibility verification. **Related gates:** premium presentation criterion, no explicit audio gate assumed.

### SYS-014 — P3 / XS — Research design checkpoint predates the current resource/development expansion
**Status:** documentation-drift.
**Impact:** A reader can mistake the slice-23 checkpoint's eleven skills and absent magical-resource economy language for a current content inventory, despite slice-27 having seventeen skills and an arcane-category deposit.
**Current code:** The checkpoint is explicitly dated and aspirational sections are honestly labeled, so it is not a fraudulent completion claim. README and current status are newer and correctly state the two-spell and broader-release limitations.
**Evidence:** `docs/RESEARCH_MAGIC_SYSTEMS.md:3-35`; `docs/IMPLEMENTATION_STATUS.md:7-19`; `packages/content/src/characters.ts:59-68`; `packages/content/src/resources.ts:18-18`.
**Fresh verification / limit:** Compared checkpoint wording with current imports and implementation status; no root documentation changed.
**Recommended bounded action:** Refresh the checkpoint or prominently mark it historical and link the executable inventory. Distinguish arcane-category Ashglass extraction from an actual spell/ritual resource economy, and retain the original future-only labels.
**Dependencies:** Current source inventory. **Related gates:** N.


## 7. Bounded delivery sequence—not an unlimited wishlist

1. **Restore valid military/economic counterplay.** Resolve over-cap combat before expanding the roster. Define recoverable deficit/supply rules and test real garrisons, not just militia. Add queue correction as a contained usability change. Preserve old rules and existing formation identities.
2. **Agree and prove the release ending model.** Implement the agreed additional victory/defeat predicates, public progress and counterplay. Test earned campaigns and saved continuation; price inflation alone is not engagement. Keep the master five-path versus Gate B three-path distinction explicit until product scope is formally resolved.
3. **Close a small set of contrasting strategic loops before mass authoring.** An original political obligation/client loop, a geographical magical-resource/ritual/counteraction loop and an independent actor/event loop can support genuinely different factions. These are proposed implementation packages, not current features. Every package needs AI valuation, UI, save/replay and counterplay before adding many entries.
4. **Expand content against demonstrated decision roles, then polish.** Use the existing validated registries and lore; reject duplicate-role filler. Reassess the large content targets or document an approved non-filler equivalent. Complete audio/presentation and broad release verification with the other audit workstreams; this sub-audit does not sign off those gates.

A rewrite of the worker/simulation architecture, an RTS battle layer, dozens of new currencies or unrestricted life-simulation politics is not justified by these findings. Existing legal command boundaries, separate progress currencies and observation-based AI are valuable constraints to preserve (`AGENTS.md:29-46,70-84`; `ARCHITECTURE.md:201-259`; `packages/sim/src/development.ts:76-104`).

## 8. Fresh verification and limitations

| Executed verification | Actual result |
| --- | --- |
| Current content import and validateContent() | Passed; `b79c78ed`; counts shown above |
| Field attack capacity boundary | 21 rejected; 20 accepted; rejection hash unchanged |
| Paid stack reachability | 20 paid scouts plus initial scout; 21 co-located formations on turn 52; no injected state; save roundtrip exact |
| Authored garrison isolation | 10 turns: 21 formations / 1260 strength remain; assault refused at zero defenses/supplies; hash/save checks pass |
| Authored food/upkeep deficit | 10 turns of shortfalls; population 200, food and treasury zero; heavy strength retained and morale/fatigue recover; save roundtrip exact |
| Detached relationship valuation | Identical peace assessment with trust/respect at opposite extremes |
| Audio scan | 179 production TS/TSX files; 0 source hits; 0 tracked audio filenames |

- Fresh verification covers content import/validation, five bounded probe groups, selected unchanged-hash rejection checks and save roundtrips. It is not the full unit suite, historical replay matrix or a premium balance verdict.
- The deficit state is intentionally extreme and authored. Its consequence rules are proven; how often ordinary campaigns reach an equivalent constraint failure is not measured here. The 21-stack production scenario, separately, requires no injected money, units, population or research.
- No visual/audio runtime observation is borrowed from other agents or project prose. Current art counts in README/status are outside this systems inventory; faction art variants are never counted as mechanical units.
- No networking/security review, browser compatibility, full localization review or performance benchmark is claimed. Static text searches cannot certify the absence of external/untracked integrations beyond the recorded scope.
- All audit artifacts are confined to this directory. Final scope verification is recorded in `verification.json`; production files were not edited by this subagent. Parent may combine findings with sibling evidence, but should retain these distinctions between implemented foundations, demonstrated defects, design gaps and unmeasured risks.
