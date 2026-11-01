# Prompt report — 2026-10-31: AI seam column, seam hearth watch, rules 45, hearth events, chains, ages, alliances, landmarks, landmark events, crises, crisis events, migration, allied peace, the second landmark catalogue, the patron's guarantee, regional crises, city-state goods, tribute demands, the held ferry, the third event catalogue, relics, notable characters, offices, the fourth event catalogue, the ember host, hired companies, the second city-state roster, taxes, unrest, shared maps, the fifth and sixth event catalogues, durable settings, army deployment and cavalry wings

**Prompt:** "okay, continue closing the gap towards 1.0".

## Delivered

- AI seam column ([ADR 0072](../../architecture/0072-ai-seam-column.md)):
  a standing war is carried to the seam of the missing path (never a second
  front); the field companies within range gather on one rally hex and are
  concentrated into a column; the seam hearth is besieged by the strongest
  company beside it, its siege kept under a warding as the realm's quote of
  the walls and handed to a column that can storm them; no peace is offered
  to or accepted from the holder while the seam is pursued.
- Diagnosis from two new replays of the Epic headline campaign: the lost Rune
  seam hearth stood ungarrisoned under a warding recast every ten turns while
  Glass Tide laid twelve one-company sieges, lifted each as hopeless and made
  peace with the holder every eight turns of war.
- Evidence packet [docs/development/2026-10-31-ai-seam-column/](../2026-10-31-ai-seam-column/README.md);
  CHANGELOG, implementation status, the 1.0 plan's M7 section, the roadmap
  library (112 delivered, 49 remaining) and the release expectations updated.
- AI seam hearth watch ([ADR 0073](../../architecture/0073-ai-seam-watch.md)):
  the realm's own home watch adopts the hearths holding its seams with a spare
  company each. With seam hearths kept, the headline campaigns sealed the
  working on 283 / 226 / 148 at the rules 44 prices, so rules/save 45
  ([ADR 0074](../../architecture/0074-attunement-repricing-45.md)) re-prices
  Attunement to 7,200 / 12,000 / 18,000 from a measured sweep. Headline
  352 / 306 / 201, all by Attunement. Evidence packet
  [docs/development/2026-10-31-ai-seam-watch/](../2026-10-31-ai-seam-watch/README.md);
  roadmap library 114 delivered.
- Three-seed pacing matrix under rules 45 (Standard 201/184/181, Long
  306/269/251, Epic 352/360/315), recorded in that packet.
- Hearth events, rules/save 46 ([ADR 0075](../../architecture/0075-hearth-events.md)):
  the first slice of M6 — eight original templates, a seeded per-realm draw
  from turn forty, quoted answers, a lapse rule, the AI's answer, a Realm
  affairs panel and journal entries, save 46 with the rules 45 pack frozen.
  Its tests exposed a naval gap fixed in [ADR 0076](../../architecture/0076-ferry-landings-on-own-water.md).
  Evidence packet [docs/development/2026-10-31-hearth-events/](../2026-10-31-hearth-events/README.md);
  roadmap library 115 delivered, the epochs item now in progress.
- Hearth events II, rules/save 47 ([ADR 0077](../../architecture/0077-hearth-events-second-catalogue.md)):
  sixteen more templates with six new conditions and ashglass and garrison
  strength as effects; the rules 46 catalogue frozen. The chronicle journey's
  pinned victory turn moves 55 → 56, attributed headlessly. Evidence packet
  [docs/development/2026-10-31-hearth-events-ii/](../2026-10-31-hearth-events-ii/README.md).
- Hearth event chains, rules/save 48 ([ADR 0078](../../architecture/0078-hearth-event-chains.md)):
  an answer may schedule what follows at the same hearth; three chains of
  three, the AI looking two steps ahead; the pin moves back to 55, attributed.
  Evidence packet [docs/development/2026-10-31-hearth-event-chains/](../2026-10-31-hearth-event-chains/README.md);
  roadmap library 116 delivered.
- A mission-ordering fix for the refused survey order was measured, moved the
  Epic headline out of band, and was reverted
  ([experiment](../2026-10-31-missions-before-marches/README.md)).
- Campaign epochs, rules/save 49 ([ADR 0079](../../architecture/0079-campaign-epochs.md)):
  four ages read from facts of the world that only grow, announced as they
  happen, in the masthead and the chronicle; six events of the ages. A first
  design kept the age as canonical state and was replaced. Evidence packet
  [docs/development/2026-10-31-epochs/](../2026-10-31-epochs/README.md);
  roadmap library 117 delivered.
- Alliances, rules/save 50 ([ADR 0080](../../architecture/0080-alliances.md)):
  defensive pacts answered by a declaration of war, with the AI protecting
  allies and courting one when pressed; a first appetite swore 146 pacts and
  moved every pace out of band and was replaced before shipping. Commit
  `f7ef04a` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-10-31-publication-alliances/README.md)).
  Evidence packet [docs/development/2026-10-31-alliances/](../2026-10-31-alliances/README.md);
  roadmap library 118 delivered.
- Landmarks, rules/save 51 ([ADR 0081](../../architecture/0081-landmarks.md)):
  twelve original landmark kinds set from the campaign seed with no save field,
  seen when explored, read in the hex inspector and yielding with the land to
  the hearth that works the hex. Commit `face6a1` is deployed: both workflows
  succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-landmarks/README.md)).
  Evidence packet
  [docs/development/2026-10-31-landmarks/](../2026-10-31-landmarks/README.md);
  roadmap library 119 delivered.
- Landmark events, rules/save 52 ([ADR 0082](../../architecture/0082-landmark-events.md)):
  a `landmark` condition and six templates of the old places, one a chain;
  an AI claim planner was built, measured inert and removed. Commit `62fa475`
  is deployed: both workflows succeeded and the live readback matched the
  build ([publication packet](../2026-10-31-publication-landmark-events/README.md)).
  Evidence packet
  [docs/development/2026-10-31-landmark-events/](../2026-10-31-landmark-events/README.md);
  roadmap library 120 delivered.
- Crises of the ages, rules/save 53 ([ADR 0083](../../architecture/0083-crises.md)):
  one of each later age's two crises drawn from the seed as the age begins,
  a toll of every unsheltered hearth each turn, shelter once for a price,
  the AI sheltering when the toll outweighs it; terms and prices set from
  measurement after the first design moved the Epic headline to 429. A
  seam-expedition caravan now waits for the founding fee. Commit `4e5623b` is
  deployed: both workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-crises/README.md)).
  Evidence packet
  [docs/development/2026-10-31-crises/](../2026-10-31-crises/README.md);
  roadmap library 121 delivered.
- The crises' own events, rules/save 54 ([ADR 0084](../../architecture/0084-crisis-events.md)):
  one hearth event per crisis, offered to every realm with a free slot as
  the crisis comes and never drawn; a drawn version was measured inert and
  replaced; the AI's shelter is issued first in its batch. Commit `6f8c78e`
  is deployed: both workflows succeeded and the live readback matched the
  build ([publication packet](../2026-10-31-publication-crisis-events/README.md)).
  Evidence packet
  [docs/development/2026-10-31-crisis-events/](../2026-10-31-crisis-events/README.md);
  roadmap library 122 delivered.
- The migration a crisis leaves behind, rules/save 55 ([ADR 0085](../../architecture/0085-crisis-migration.md)):
  when a crisis passes, a hearth of three or more that bore the whole toll
  loses a household to the nearest sheltered hearth of another realm within
  twelve hexes; a first AI valuation made every realm shelter and was
  narrowed to what the realm can see. Commit `afb4b63` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-crisis-migration/README.md)).
  Evidence packet
  [docs/development/2026-10-31-crisis-migration/](../2026-10-31-crisis-migration/README.md);
  roadmap library 123 delivered.
- Allied peace, rules/save 56 ([ADR 0086](../../architecture/0086-allied-peace.md)):
  the call an ally answers is kept while the war lasts, and its partner's
  peace with the attacker ends the ally's war under the same truce; an
  ally's own peace releases its call. Commit `000bc04` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-allied-peace/README.md)).
  Evidence packet
  [docs/development/2026-10-31-allied-peace/](../2026-10-31-allied-peace/README.md);
  roadmap library 124 delivered.
- The second landmark catalogue and its events, rules/save 57
  ([ADR 0087](../../architecture/0087-landmarks-ii.md)): twelve more kinds
  placed from the seed for the campaign's rules, six more events of the old
  places. Commit `128fd07` is deployed: both workflows succeeded and the live
  readback matched the build
  ([publication packet](../2026-10-31-publication-landmarks-ii/README.md)).
  Evidence packet
  [docs/development/2026-10-31-landmarks-ii/](../2026-10-31-landmarks-ii/README.md);
  roadmap library 125 delivered.
- A patron stands for its client, rules/save 58 ([ADR 0088](../../architecture/0088-guarantee.md)):
  a war declared on a client calls its patron unless bound to the attacker;
  the call is kept so the client's peace ends the patron's war. Commit
  `7c6cca0` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-10-31-publication-guarantee/README.md)).
  Evidence packet [docs/development/2026-10-31-guarantee/](../2026-10-31-guarantee/README.md);
  roadmap library 126 delivered.
- Regional crises, rules/save 59 ([ADR 0089](../../architecture/0089-regional-crises.md)):
  one regional crisis per later age, centred on a hearth drawn from the seed
  and reaching only the hearths within its radius for the toll, the quote,
  the event and the migration. Commit `5a8c587` is deployed: both workflows
  succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-regional-crises/README.md)).
  Evidence packet
  [docs/development/2026-10-31-regional-crises/](../2026-10-31-regional-crises/README.md);
  roadmap library 127 delivered.
- The goods a client city-state sends, rules/save 60 ([ADR 0090](../../architecture/0090-city-state-trade.md)):
  every city-state trades in one good, delivered to its patron with each
  paid tribute and named in Realm affairs; the AI courts the good it lacks.
  Commit `86fb735` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-10-31-publication-trade-goods/README.md)).
  Evidence packet [docs/development/2026-10-31-trade-goods/](../2026-10-31-trade-goods/README.md);
  roadmap library 128 delivered.
- Pressing a city-state for tribute, rules/save 61 ([ADR 0091](../../architecture/0091-tribute-demands.md)):
  a company at a city-state's gate demands tribute without war, paid when it
  outweighs the walls' garrison and refused when not, remembered either way;
  the AI presses when short of coin. Commit `2b56ba2` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-tribute-demands/README.md)).
  Evidence packet
  [docs/development/2026-10-31-tribute-demands/](../2026-10-31-tribute-demands/README.md);
  roadmap library 129 delivered.
- A held ferry puts its passengers ashore ([ADR 0092](../../architecture/0092-ferry-ashore.md)):
  an AI ferry in a proved-enclosed basin with no landing of its own lands
  its caravan instead of holding it for the campaign; the crossing scenario
  moves to seed 83 with every assertion kept. Commit `dc548dd` and its roadmap
  correction `a0e97a7` (the bullet had landed in the item's remaining list and
  the roadmap test caught it after the push) are deployed: both workflows
  succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-ferry-ashore/README.md)).
  Evidence packet
  [docs/development/2026-10-31-ferry-ashore/](../2026-10-31-ferry-ashore/README.md);
  roadmap library 130 delivered.
- The third hearth-event catalogue, rules/save 62 ([ADR 0093](../../architecture/0093-hearth-events-iii.md)):
  fifteen more templates, seventy-five in all; every headline course of
  every seed in band. Commit `0e14a39` is deployed: both workflows succeeded
  and the live readback matched the build
  ([publication packet](../2026-10-31-publication-hearth-events-iii/README.md)).
  Evidence packet
  [docs/development/2026-10-31-hearth-events-iii/](../2026-10-31-hearth-events-iii/README.md);
  roadmap library 131 delivered.
- Relics of the old places, rules/save 63 ([ADR 0094](../../architecture/0094-relics.md)):
  one relic for every landmark kind, brought up by the first hearth to work
  the landmark's hex, bestowed on a character whose company gains its
  leadership; the AI bestows on its strongest company's rider. Commit
  `5c78283` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-10-31-publication-relics/README.md)).
  Evidence packet [docs/development/2026-10-31-relics/](../2026-10-31-relics/README.md);
  roadmap library 132 delivered.
- Notable characters, rules/save 64 ([ADR 0095](../../architecture/0095-notable-characters.md)):
  one figure of the age for every culture, answering the realm's first
  appointment of their role with their name, their specialization already
  theirs and their story on the character sheet. Commit `da4b8ab` is
  deployed: both workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-notables/README.md)).
  Evidence packet [docs/development/2026-10-31-notables/](../2026-10-31-notables/README.md);
  roadmap library 133 delivered.
- Offices of the realm, rules/save 65 ([ADR 0096](../../architecture/0096-offices.md)):
  one office for every character role, held from a hearth by a character of
  the role and paying that hearth a yield of two while held; a holder
  resigns before riding; death vacates; AI realms seat idle characters when
  they keep another of the role for the road. Commit `e8379ce` is deployed:
  both workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-offices/README.md)).
  Evidence packet [docs/development/2026-10-31-offices/](../2026-10-31-offices/README.md);
  roadmap library 134 delivered.
- The fourth hearth-event catalogue, rules/save 66 ([ADR 0097](../../architecture/0097-hearth-events-iv.md)):
  fifteen more templates across the conditions and the ages, ninety in all,
  the rules 65 catalogue frozen. Commit `9a54302` is deployed: both workflows
  succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-hearth-events-iv/README.md)).
  Evidence packet [docs/development/2026-10-31-hearth-events-iv/](../2026-10-31-hearth-events-iv/README.md);
  roadmap library 135 delivered.
- The ember host, rules/save 67 ([ADR 0098](../../architecture/0098-ember-host.md)):
  the first summoning rite, a lodged Flame Waykeeper raising a company of
  Oath guard from the hearth's seam at eight ashglass, at once; the AI
  raises one at a besieged hearth once the standing rites are up and no
  company of the realm stands within. Commit `47f4385` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-ember-host/README.md)).
  Evidence packet [docs/development/2026-10-31-ember-host/](../2026-10-31-ember-host/README.md);
  roadmap library 136 delivered.
- Companies hired from city-states, rules/save 68 ([ADR 0099](../../architecture/0099-hired-companies.md)):
  a company at a city-state's gate buys a company of Ash pike for a price
  set by the city's size, once every ten turns; the AI hires at war when it
  keeps a reserve. Commit `ad620af` is deployed: both workflows succeeded and
  the live readback matched the build
  ([publication packet](../2026-11-01-publication-hires/README.md)).
  Evidence packet [docs/development/2026-11-01-hires/](../2026-11-01-hires/README.md);
  roadmap library 137 delivered.
- The second city-state roster, rules/save 69 ([ADR 0100](../../architecture/0100-city-states-ii.md)):
  twenty-four more city-states, forty-eight in all, drawn by the rules a
  campaign knows so older seeds seat what they seated before. Commit
  `9bb719b` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-11-01-publication-city-states-ii/README.md)).
  Evidence packet [docs/development/2026-11-01-city-states-ii/](../2026-11-01-city-states-ii/README.md);
  roadmap library 138 delivered.
- Taxes, rules/save 70 ([ADR 0101](../../architecture/0101-taxes.md)): a realm
  sets lean, steady or heavy taxes, trading every hearth's coin against the
  mending of its lanes; the AI sets heavy taxes when short and lean ones
  when rich with scarred hearths. Commit `8a2578f` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-11-01-publication-taxes/README.md)).
  Evidence packet [docs/development/2026-11-01-taxes/](../2026-11-01-taxes/README.md);
  roadmap library 139 delivered.
- Unrest in the hearths, rules/save 71 ([ADR 0102](../../architecture/0102-unrest.md)):
  heavy taxes, occupation and deep scars raise a hearth's unrest, lean taxes
  ease it; at fifty the industry halves and at a hundred the hearth riots;
  the AI stops pressing restless lanes. Commit `5375229` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-11-01-publication-unrest/README.md)).
  Evidence packet [docs/development/2026-11-01-unrest/](../2026-11-01-unrest/README.md);
  roadmap library 140 delivered.
- Allies share their maps, rules/save 72 ([ADR 0103](../../architecture/0103-map-sharing.md)):
  each ally learns every hex the other has explored, once every twenty
  turns for the pair; the AI does not share on its own yet. Commit `90e48ed`
  is deployed: both workflows succeeded and the live readback matched the
  build ([publication packet](../2026-11-01-publication-map-sharing/README.md)).
  Evidence packet [docs/development/2026-11-01-map-sharing/](../2026-11-01-map-sharing/README.md);
  roadmap library 141 delivered.
- The fifth hearth-event catalogue, rules/save 73 ([ADR 0104](../../architecture/0104-hearth-events-v.md)):
  fifteen more templates across the conditions and the ages, one hundred
  and five in all, the rules 72 catalogue frozen. Commit `e18d7a1` is
  deployed: both workflows succeeded and the live readback matched the build
  ([publication packet](../2026-11-01-publication-hearth-events-v/README.md)).
  Evidence packet [docs/development/2026-11-01-hearth-events-v/](../2026-11-01-hearth-events-v/README.md);
  roadmap library 142 delivered.
- The sixth hearth-event catalogue, rules/save 74 ([ADR 0105](../../architecture/0105-hearth-events-vi.md)):
  fifteen more templates across the conditions and the ages, one hundred
  and twenty in all, the rules 73 catalogue frozen. Commit `0ee6ed2` is
  deployed: both workflows succeeded and the live readback matched the build
  ([publication packet](../2026-11-01-publication-hearth-events-vi/README.md)).
  Evidence packet [docs/development/2026-11-01-hearth-events-vi/](../2026-11-01-hearth-events-vi/README.md);
  roadmap library 143 delivered.
- Durable client settings ([ADR 0106](../../architecture/0106-durable-settings.md)):
  the text scale and a Reduce motion choice survive a reload through the
  browser's storage, with an unreadable store reported; web client only.
  Commit `f384c93` is deployed: both workflows succeeded and the live
  readback matched the build
  ([publication packet](../2026-11-01-publication-durable-settings/README.md)).
  Evidence packet [docs/development/2026-11-01-durable-settings/](../2026-11-01-durable-settings/README.md);
  roadmap library 144 delivered.
- Army deployment, rules/save 75 ([ADR 0107](../../architecture/0107-deployment.md)):
  a land army draws up as the line, a shield wall, pikes forward or a
  skirmish, chosen in its composition panel; battles without a doctrined
  army are unchanged. Commit `00ef0a3` is deployed: both workflows succeeded
  and the live readback matched the build
  ([publication packet](../2026-11-01-publication-deployment/README.md)).
  Evidence packet [docs/development/2026-11-01-deployment/](../2026-11-01-deployment/README.md);
  roadmap library 145 delivered.
- Cavalry wings, rules/save 76 ([ADR 0108](../../architecture/0108-cavalry-wings.md)):
  a fifth deployment puts the mounted companies on the outer columns of
  every rank. Evidence packet
  [docs/development/2026-11-01-wings/](../2026-11-01-wings/README.md);
  roadmap library 146 delivered.

## Verified

Durable settings: unit 2,378 / 309 files, build, the durable-settings and campaign-menu
journeys; no pacing or chronicle run (web client only).
Deployment: unit 2,380 / 310 files, campaigns 57, build, the deployment and
battlefield journeys and the chronicles journey (pin 56 unmoved); headline
**329 / 301 / 219**, the other seeds 355 / 383, 286 / 315, 194 / 204, proxies 379 / 461 / 353 / 209.
Wings: unit 2,380 / 310 files, campaigns 57, build, the deployment journey and the
chronicles journey (pin 56 unmoved); Headline pacing 329 / 301 / 219 and every other course identical to rules 75, since the AI keeps the line; the chronicle pin at 56 holds.

Typecheck, lint, unit 2,321 / 285 files, campaigns 57, build, three covering
gameplay journeys (6 of 6) and the `@scale` chronicles journey alone (1 of 1).
Pacing: headline **379 / 300 / 203**, every campaign in band; Long and Standard
unchanged. Seam watch and rules 45: unit 2,323, campaigns 57, build, the
covering journeys and the chronicles journey; headline **352 / 306 / 201**,
proxies 372 / 393 / 307 / 199. Hearth events: unit 2,329 / 288 files, campaigns
57, build, three covering journeys (one new) and the chronicles journey;
headline **393 / 301 / 210**, proxies 385 / 412 / 270 / 182. Hearth events II:
unit 2,330, campaigns 57, build, the same journeys; headline **388 / 313 /
216**, proxies 344 / 401 / 300 / 194. Chains: unit 2,331, campaigns 57, build,
the same journeys; headline **385 / 306 / 211**, proxies 345 / 469 / 311 / 193.
Epochs: unit 2,335, campaigns 57, build, four journeys and the chronicles
journey; headline **419 / 293 / 211**, the other seeds 352 / 340, 270 / 274,
193 / 193, proxies 333 / 365 / 294 / 189. Alliances: unit 2,339, campaigns 57,
build, four journeys and the chronicles journey; headline **359 / 314 / 222**,
the other seeds 341 / 339, 263 / 280, 196 / 196, proxies 307 / 388 / 333 / 189.
Landmarks: unit 2,342 / 292 files, campaigns 57, build, three journeys (one
new) and the chronicles journey; headline **413 / 320 / 216**, the other seeds
379 / 332, 260 / 284, 197 / 201, proxies 314 / 424 / 309 / 189.
Landmark events: unit 2,342, campaigns 57, build, three journeys (one new) and
the chronicles journey; headline **394 / 356 / 216**, the other seeds
381 / 332, 260 / 284, 197 / 201, proxies 326 / 420 / 300 / 189.
Crises: unit 2,346 / 294 files, campaigns 57, build, four journeys (one new)
and the chronicles journey (pin 55 → 53, attributed); headline
**366 / 304 / 220**, the other seeds 367 / 385, 315 / 312, 208 / 190, proxies
442 / 371 / 298 / 213. Crisis events: unit 2,346, campaigns 57, build, two
journeys (one new) and the chronicles journey (pin 53 → 56, attributed);
headline **408 / 275 / 215**, the other seeds 344 / 313, 308 / 246,
211 / 176, proxies 353 / 448 / 323 / 204. Migration: unit 2,347, campaigns
57, build, two journeys (one new) and the chronicles journey; every pacing
figure identical to rules 54, eight and seven households crossing on the
Epic and Long headline. Allied peace: unit 2,348, campaigns 57, build, three
journeys (one new) and the chronicles journey; headline **418 / 295 / 211**,
the other seeds 347 / 305, 296 / 246, 209 / 185, proxies 353 / 468 / 323 / 204,
thirteen of twenty-three answered calls on the Epic headline ending with the
partner's peace. Landmarks II: unit 2,348, campaigns 57, build, three journeys
and the chronicles journey (pin attributed); headline **382 / 329 / 195**, the
other seeds 366 / 322, 299 / 251, 215 / 179, proxies 366 / 439 / 302 / 203. Guarantee: unit 2,349, campaigns 57, build,
four journeys (one new) and the chronicles journey; headline **411 / 336 / 209**,
the other seeds 351 / 313, 285 / 246, 218 / 175, proxies 358 / 451 / 302 / 204,
eighteen guarantees answered on the Epic headline. Regional crises: unit
2,350, campaigns 57, build, two journeys (one new) and the chronicles
journey; headline **395 / 302 / 203**, the other seeds 338 / 338, 268 / 287,
185 / 199, proxies 307 / 431 / 302 / 181, every headline course in band.
City-state goods: unit 2,351, campaigns 57, build, two journeys (one new) and
the chronicles journey; every pacing figure identical to rules 59; thirty
bonds with city-states on the Epic headline with six seated. Tribute
demands: unit 2,354, campaigns 57, build, two journeys (one new) and the
chronicles journey; every pacing figure identical; two paid and four refused
demands on the Epic headline with six city-states seated. Ferry ashore:
unit 2,355, campaigns 57, build, the chronicles journey; every pacing figure
identical. Hearth events III: unit 2,355, campaigns 57, build, two journeys
(one new) and the chronicles journey (pin 54 → 53, attributed); headline
**386 / 305 / 214**, the other seeds 390 / 362, 295 / 282, 183 / 202, proxies
336 / 440 / 289 / 197. Relics: unit 2,358, campaigns 57, build, the characters
and relics journeys and the chronicles journey; headline **376 / 316 / 213**,
the other seeds 390 / 365, 304 / 282, 189 / 202, proxies 336 / 440 / 290 / 197.
Notable characters: unit 2,360, campaigns 57, build, the characters and
notables journeys and the chronicles journey (pin 53 → 57, attributed); headline **380 / 305 / 207**,
the other seeds 306 / 349, 256 / 326, 192 / 218, proxies 307 / 467 / 290 / 189.
Offices: unit 2,363, campaigns 57, build, the characters and offices
journeys and the chronicles journey (pin 57 unmoved); headline
**380 / 305 / 207**, the other seeds 306 / 349, 256 / 326, 192 / 218, proxies 307 / 467 / 290 / 189.
Hearth events IV: unit 2,363 / 301 files, campaigns 57, build, the three hearth-event
journeys and the chronicles journey (pin 57 → 56, attributed to the Council’s turn-40 draw); headline
**380 / 296 / 199**, the other seeds 344 / 336, 276 / 266, 190 / 191, proxies 327 / 440 / 301 / 201.
Ember host: unit 2,365 / 301 files, campaigns 57, build, the ember host and seam
warding journeys and the chronicles journey (pin 56 unmoved); headline
**380 / 296 / 197**, the other seeds 344 / 336, 276 / 266, 190 / 191, proxies 327 / 476 / 301 / 201.
Hires: unit 2,368 / 303 files, campaigns 57, build, the hires and tribute journeys
and the chronicles journey (pin 56 unmoved); headline **380 / 296 / 197**,
the other seeds 344 / 336, 276 / 266, 190 / 191, proxies 327 / 476 / 301 / 201.
City-states II: unit 2,370 / 304 files, campaigns 57, build, the city-states II,
hires and tribute journeys and the chronicles journey (pin 56 unmoved);
headline **380 / 296 / 197**, the other seeds 344 / 336, 276 / 266, 190 / 191, proxies
327 / 476 / 301 / 201.
Taxes: unit 2,373 / 306 files, campaigns 57, build, the taxes and tribute journeys and
the chronicles journey (pin 56 unmoved); headline **388 / 296 / 198**, the
other seeds 345 / 344, 309 / 286, 191 / 196, proxies 370 / 478 / 293 / 207.
Unrest: unit 2,375 / 307 files, campaigns 57, build, the unrest, taxes and conquest
journeys and the chronicles journey (pin 56 unmoved); headline
**388 / 296 / 198**, the other seeds 339 / 344, 283 / 286, 191 / 196, proxies 370 / 478 / 305 / 207.
Shared maps: unit 2,377 / 308 files, campaigns 57, build, the map-sharing and
alliances journeys and the chronicles journey (pin 56 unmoved); headline
**388 / 296 / 198**, the other seeds 339 / 344, 283 / 286, 191 / 196, proxies 370 / 478 / 305 / 207.
Hearth events V: unit 2,377 / 308 files, campaigns 57, build, the four hearth-event
journeys and the chronicles journey (pin 56 unmoved though the turn-40 draw differs); headline
**375 / 317 / 207**, the other seeds 367 / 321, 290 / 266, 187 / 198, proxies 403 / 422 / 367 / 209.
Hearth events VI: unit 2,377 / 308 files, campaigns 57, build, the five hearth-event
journeys and the chronicles journey (pin 56 unmoved though the turn-40 draw differs); headline
**329 / 301 / 219**, the other seeds 355 / 383, 286 / 315, 194 / 204, proxies 379 / 461 / 353 / 209.
Epic replay: Glass Tide retakes the seam hearth on turn 246, holds
it to 373, seals the working on about 353, and Saltwind's Prosperity completes
first on 379.

## Left open

- A warden for every seam hearth (rites 40–42) is not built; the watch does
  not garrison every seam hearth at once.
- Only Sepulchral Synod reaches the path, on one seed, on every pace.
- Hearth events: thirty-nine templates against a target of one hundred and
  fifty; chains and the ages are built; no world crises, migration or
  collapse yet. The Epic headline course ends on 419, above its band, while
  the two other Epic seeds end inside it; recorded as a drift of one course.
- Alliances: an ally called into a war makes its own peace; no shared peace,
  guarantees or passage rights.
- Landmarks: twelve kinds, yield only; no events, rewards, intelligence or
  faction interactions, and the AI does not seek them. The Epic headline
  course ends on 413, above band for the third slice running, while the other
  Epic seeds end inside it.
- Landmark events: rare (two or three per headline campaign); the AI does not
  seek landmarks, and paid AI claims of any hex are almost absent from
  measured play, which also bounds the seam claim planner. The Long headline
  course moves 320 → 356 by re-rolled draws alone.
- Crises: world-wide and identical for every realm; no regional crisis,
  migration, collapse or crisis event at a hearth; two per age. The
  enclosed-basin ferry scenario (seed 74) is sensitive to the crisis of the
  Age of Roads.
- Crisis events: one per crisis, offered once; a realm already answering an
  event misses it. The Epic headline course sits at 408 with the other Epic
  seeds below band and the Long courses under target.
- Migration: only at a crisis's end, only to another realm's sheltered
  hearth within twelve hexes; collapse and regional crises remain.
- Allied peace: an ally leaves with its partner's peace whatever its own
  reasons; guarantees, passage rights and joint war aims remain.
- The enclosed-basin ferry scenario moves to seed 55 whenever the world's
  content changes what its tiny map yields; it is seed-specific by nature.
- Guarantee: a patron is called whatever its strength or distance; passage
  rights and joint war aims remain.
- Regional crises are centred on hearths only, with fixed radii; collapse
  remains.
- City-state goods: a flat amount per paid tribute; no market, no price, no
  trade between realms; the wider roster of independent powers remains.
- Tribute demands: the walls are only the companies on the hearth, and a
  refused demand costs nothing but trust; mercenary contracts and raiding
  remain.
- The ferry fallback fires only in a proved-enclosed basin; a basin whose
  shores open later is not waited for.
- Hearth events: one hundred and twenty templates against one hundred and
  fifty.
- Two client settings are durable; fog colours, non-colour cues and
  keyboard workflows beyond the shortcuts remain.
- A deployment orders the ranks only; column choice, per-formation
  placement and a reserve line remain, and the AI keeps the line.
- Headline Epic pacing under rules 74 sits at 329, under its band, while both
  other Epic seeds are in band; recorded as a drift of one course with the
  neutralised-effects and valuation evidence in the sixth catalogue's packet.
  A nine-seed survey under rules 75 runs 325 to 488 turns, median 355,
  three in band, four under by 8 to 25 and two over by 32 and 88
  ([survey](../2026-11-01-epic-pacing-survey/README.md)): the spread is
  wider than the band. A re-pricing of the Epic pace with the pack frozen
  is the owner's call.
- Relics lead and nothing more; none is lost, stolen or traded. One
  summoning of one path exists; rituals beyond the four rites and a third
  magical path remain.
- A notable figure is a named, specialized appointment and nothing more;
  rulers, legitimacy and the wider political cast remain.
- An office pays its hearth and keeps its holder, nothing more; the AI
  fills offices but never resigns one.
- A hired company is one kind at one price; no contracts outlast the sale
  and no mercenary bands walk the map.
- Forty-eight city-states of one kind; clans, pirates, cults and nomads
  remain.
- Taxes touch coin and devastation only; trade routes, processing and
  the wider economic policy remain.
- Unrest knows three pressures and two consequences; legitimacy, secession
  and rebels on the map remain.
- Shared maps are the whole explored set between allies; joint war aims
  and the wider negotiated terms remain.
  Commit `91172b7` (rules 49) is deployed: both workflows succeeded and the
  live readback matched the build
  ([publication packet](../2026-10-31-publication-epochs/README.md)).
  Commit `7447299` (rules 48) is deployed: both workflows succeeded and the
  live readback matched the build
  ([publication packet](../2026-10-31-publication-hearth-event-chains/README.md)). One survey mission refused on
  the Epic headline at turn 130, a same-batch race, is recorded and open; a
  reordering fix was measured, moved the Epic headline out of band, and was
  reverted ([experiment](../2026-10-31-missions-before-marches/README.md)).
  Commit `605196e` (rules 47) is deployed: both workflows succeeded and the
  live readback matched the build
  ([publication packet](../2026-10-31-publication-hearth-events-ii/README.md)). Commit `594ffdf` is deployed: both
  workflows succeeded and the live readback matched the build
  ([publication packet](../2026-10-31-publication-hearth-events/README.md)).
- Three-seed pacing coverage per pace under rules 44 remains unmeasured.
- Commit `68f4f5b` is deployed: both workflows succeeded and the live readback
  matched the build ([publication packet](../2026-10-31-publication-seam-column/README.md)).
- Commit `0e3c26b` (seam hearth watch, rules 45) is deployed the same way
  ([publication packet](../2026-10-31-publication-seam-watch/README.md)).
- Owner decisions unchanged: the e103a72 history purge; the other session's
  uncommitted Playwright config edits and reliability packet.
