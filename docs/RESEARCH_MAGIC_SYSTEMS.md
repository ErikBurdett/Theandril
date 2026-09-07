# Theandril Magic, Technology & Research Design

## Implementation checkpoint — slice 17, 2026-09-06

This checkpoint describes playable rules, not completion of the specification below. Current definitions are in [practical progression](../packages/content/src/progression.ts), [land improvements](../packages/content/src/ecology.ts) and [character skills](../packages/content/src/characters.ts). Overall verification and remaining release gates belong to [implementation status](IMPLEMENTATION_STATUS.md).

There are **ten mundane technology nodes**, grouped into four branches. Research immediately spends accumulated knowledge once its prerequisites are met; there is no research queue or assigned research workforce yet. Costs below are knowledge, not coin.

| Branch | Actual nodes and prerequisites | Implemented effect |
|---|---|---|
| Craft | Cinder masonry (24) → Counterweighted cranes (60) | Masonry adds 2 industry per settlement; cranes unlock paid Oreworks on mineral seams. |
| Stewardship | Seasonal stewardship (36) → Sluice waterworks (64) or Charter forestry (72) | Unlocks Spring gardens, Polders and Grove archives respectively, with distinct site requirements and signed yield tradeoffs. Both child branches may be researched. |
| Navigation | Coastal navigation (30) → Ocean navigation (80) → Deep soundings (120) | Unlocks harbors/coastal vessels, eligible ocean traversal, then paid Tide observatories on shallow water. Coastal-only hulls and deep-water worker restrictions remain. |
| Civic | Civic accounts (40/400/800/1600 for Short/Standard/Long/Epic); Surveyed estates (60, requires Seasonal stewardship) | Accounts adds 1 coin and 1 knowledge per settlement and helps qualify for the Hearth Exchange. Surveyed estates adds 1 civic border progress per eligible settlement-turn. |

An improvement unlock does not construct or work a tile: coin, a suitable owned site, active construction turns and worker assignment are still required. Automatic border growth grants claims, not workers or free tile income; siege, occupation and unavailable local frontier block it. The six added technologies and five added improvements execute under rules 11; genuine earlier command histories retain their original eligibility and outcomes.

The **eleven distinct earned character skills** are a separate personal progression system, not eleven technologies or magical Paths. Four 12-XP specializations lead to seven prerequisite-based upgrades (18 XP each, except Field orders at 24 XP):

- Marshals choose Keeper of the line or Decisive orders. Either opens Muster rolls → Field orders, raising healthy command capacity from 16 to 18 to 20 formations. Unbroken line follows Keeper of the line; Measured advance follows Decisive orders. These armor/attack branches can coexist with command expansion, but the two specializations remain exclusive.
- Surveyors take Patient fieldcraft → Horizon studies, extending the actual survey radius from 6 to 7 to 8 hexes without revealing hidden armies.
- Engineers choose Patient fieldcraft → Column workshops (refit capacity 5 → 7 → 10 missing strength per surviving formation), or Siege craft → Sapper watch (sabotage failure risk 25% → 10% → 0%). Enemy action can still interrupt missions; destroyed formations are not recreated. Patient fieldcraft is shared with surveyors and counted once in the eleven definitions.

Experience comes from actual missions/battle outcomes and is spent on eligible skills; it is not national knowledge. Marshal leadership and the once-per-battle Rally ability are implemented mundane command effects. The two coin-paid institutional choices and two coin-paid doctrine choices also remain separate, permanently exclusive within their respective slots.

**Not implemented:** national Arcane Theory, individual caster aptitudes/Paths, battle spells, strategic rituals, summons, magical-resource economies, sacred/occult progression, or magical crafting. Paid biome cultivation, frontier surveys, Rally and practical research do not stand in for these systems. The examples and larger targets below remain an aspirational design, not selectable content or a 1.0 signoff.

## Design goal

Theandril's progression should combine:
- readable 4X planning;
- deep faction asymmetry;
- character-level magical capability;
- strategic magic that changes the map;
- meaningful non-magical technology;
- societal institutions;
- military doctrine;
- lore-driven faction exceptions.

The strongest reference is the **structural depth** of Dominions 6: research determines what a nation knows, while individual magical paths determine which casters can actually use that knowledge. Dominions also distinguishes battle magic, rituals, crafting, divine magic, magical resources, and powerful global effects. Theandril should reinterpret those structural ideas with original terminology and rules.

The Forgotten Realms total conversion for Dominions 6 is a useful reference for the *breadth* of fantasy faction representation in one strategic sandbox: conventional kingdoms, city-states, magical nations, cultic powers, subterranean realms, monster civilizations, and culturally distinct states. Theandril should pursue comparable asymmetry in an entirely original setting.

## The four core advancement layers

### 1. Material knowledge
What the society knows how to make and build.

### 2. Social institutions
How the society organizes power, law, economy, war, religion, and administration.

### 3. Military doctrine
How the society turns people, monsters, magic, ships, fortifications, and logistics into military power.

### 4. Supernatural knowledge
What magical/sacred/occult principles the society understands.

Supernatural knowledge itself splits into:
- national Arcane Theory;
- personal magical paths;
- sacred authority;
- forbidden traditions;
- artifacts/ritual infrastructure.

## Why separate them?

Because a realm can be:
- technologically sophisticated but magically weak;
- magically brilliant but administratively primitive;
- culturally decentralized yet militarily disciplined;
- rich in magical theory but lacking qualified casters;
- poor in formal research but able to awaken ancient knowledge from sacred sites;
- resistant to magic and specialized in nullification technology.

Those differences should be real strategic identities.

## Example magic matrix

These are provisional concepts only:

| Tradition | Strategic identity |
|---|---|
| Flame | destruction, heat, forging, purification |
| Storm | lightning, wind, weather, flight |
| Tide | water, cold, navigation, sea control |
| Stone | earth, fortification, metal, endurance |
| Verdancy | growth, beasts, healing, wilderness |
| Grave | death, spirits, undead, decay |
| Star | divination, distance, portals, fate |
| Dream | illusion, morale, sleep, deception |
| Shadow | concealment, curses, infiltration |
| Radiance | wards, revelation, sacred fire |
| Spirit | ancestors, possession, pacts, shamanism |
| Rune | binding, artifacts, constructs, inscriptions |
| Blood/Oath | sacrifice, lineage, bonds, coercive rites |
| Void | dangerous extradimensional power and corruption |

Final names should be created from Theandril's lore.

## Example research disciplines

| Discipline | Typical effects |
|---|---|
| Calling | summons, bindings, planar contact |
| Transmutation | physical transformation, terrain/body modification |
| Projection | ranged/direct battle magic |
| Warding | protection, anti-magic, dispelling |
| Artifice | items, constructs, magical infrastructure |
| Veilcraft | illusion, concealment, dreams |
| Malison | curses, afflictions, hostile enchantments |
| Thaumic Dominion | strategic/global magic |
| Forbidden Arts | high-risk occult systems |

A Flame caster does not automatically know all Flame magic. The faction must have researched the relevant discipline, and the caster must satisfy the path requirements.

## Example unlock

`Rite of the Ember Host` could require:
- Calling 4;
- Flame 3;
- Spirit 1;
- a Greater Brazier magical site or equivalent infrastructure;
- Ember Essence;
- a caster not currently leading an army.

It might permanently summon a small fire-spirit army but increase local devastation or unrest.

This illustrates the intended multi-axis requirement system.

## Faction research identity examples

### The Iron Covenant
- strong mundane metallurgy and logistics;
- Rune/Stone access;
- exceptional Artifice;
- weak Dream/Verdancy;
- anti-magic siege tools.

### The Mire Courts
- weak heavy engineering;
- strong Verdancy, Spirit, Dream;
- research tied to living sacred wetlands;
- summons and terrain control;
- decentralized institutions.

### The Sepulchral Synod
- Grave/Star/Shadow;
- undead creation;
- research from tomb complexes and captured scholars;
- can replace some food logistics with necromantic infrastructure;
- risks spiritual pollution and diplomatic isolation.

### The Saltwind League
- advanced navigation/trade;
- Tide/Storm/Star;
- magical sea lanes and weather prediction;
- fleet-focused institutions.

### The Null Throne
- modest spell access;
- strong mundane engineering;
- Warding/nullification;
- counter-mage agents;
- technology-magic hybrid weaponry.

These are examples of system possibilities, not final canon.

## Research should create dilemmas

A player should ask:
- Do I rush better steel or new administrative institutions?
- Do I research Calling so my rare Star/Spirit caster can unlock a major summon?
- Do I divert my best mage from battlefield command to research?
- Do I spend rare essence on an artifact or a strategic ritual?
- Do I pursue dangerous occult knowledge because I am losing the war?
- Do I capture a magical site because it unlocks an entirely new branch?
- Do I steal enemy research or recruit a foreign specialist?
- Do I invest in anti-magic instead of magic?

If research is merely "wait N turns for +5%," the system has failed.

## AI requirement

AI should select progression based on capability.

It needs to reason about:
- who can cast each unlock;
- resource economy;
- sites;
- current war threats;
- unit composition;
- victory plans;
- faction identity;
- short-term breakpoints;
- long-term combinations.

Research plans should change when:
- a key mage dies;
- a new path becomes available;
- a magical site is discovered;
- the faction gains a new vassal/culture;
- the enemy fields a major threat;
- a victory project becomes viable.

## UI requirement

The player needs to see:
- researched versus castable;
- which characters can use an effect;
- missing requirements;
- likely resource burden;
- synergy with current units/buildings;
- faction-specific unlocks;
- global/strategic rituals separately from battle spells;
- site-based and artifact-based discoveries.

Depth should be legible.
