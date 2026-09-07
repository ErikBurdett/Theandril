# Theandril faction bible

## Authority, time and implementation

This is the out-of-world writing reference for faction identity. It is not another chapter narrated by Ilthen Vael. It may describe a present institution's competing interests; it must not put invented testimony, motives or newly discovered causes into his record. The [Book of Broken Roads](<The Book of Broken Roads/The Book of Broken Roads.md>) remains the authority for its witnessed chronology and explicitly unresolved questions.

The reference present is **RR 2447**. The Mire Courts withdrew from the Roads in RR 2289; the Reckoning began in 2291; the Failing silenced the network in 2311; the Ashfall followed in 2313. The Iron Covenant closed its passes but did not demonstrably fall. The Mire Courts and Sepulchral Synod endured. The Saltwind League collapsed, and the Null Throne fragmented within a decade of the Failing. Neither Remnant restores its predecessor by a change of name. The cause of the Ashfall, the nature of the stones' attestation and the world's creation remain disputed. See [the old powers](<The Book of Broken Roads/IV. The Age of Crowns.md>), [their catastrophes](<The Book of Broken Roads/VII. The Failing and the Ashfall.md>) and [the present hour](<The Book of Broken Roads/X. The Present Hour.md>).

There are two deliberately different registers here:

- **Part I: twelve registered cultures.** Their base identities are current setting canon. The current definitions, name pools, signed worked-biome affinities and paid AI recruitment preferences are implemented. Additional social detail and named character seeds below are writing foundations, not new runtime systems.
- **Part II: twelve proposed cultures.** These are a cohesive development proposal toward twenty-four, not an assertion that twenty-four factions are playable. Their identifiers are proposed, not registered. None has a completed faction art kit or implemented faction-specific rules by virtue of this document. Their histories, peoples and regional names remain proposed until adopted explicitly.

The executable authorities are [factions](../../packages/content/src/factions.ts), [ecology](../../packages/content/src/ecology.ts) and [characters](../../packages/content/src/characters.ts). All current cultures can use the common land troops and ordinary naval rules; a culturally suggestive unit name is not an exclusive recruitment right. Current identity does not include faction-specific spells, magical immunities, undead logistics, flying armies or new diplomacy commands. Existing paid improvement/cultivation and officer rules are not supernatural aptitude. Consult the [implementation status](../IMPLEMENTATION_STATUS.md) for newly integrated systems, rather than treating a lore hook as a feature flag.

Current faction art qualification is tracked in the [asset catalog](../art/FACTION_ASSET_CATALOG.md) and [art status](../art/ART_IMPLEMENTATION_STATUS.md). Palette and silhouette notes below guide consistency; they neither supersede approved pixels nor certify animation, naval variants or future assets. Campaign seats repeating a definition are not additional cultures.

Every **character seed** below is a proposed person for later authored stories: no unique runtime entity, fixed appointment, biography-bearing generated character or bespoke statistics are implemented here. A current procedural name can coincide with a seed without importing that biography. No proposed person replaces the Book's named witnesses, rulers or unnamed Provost.

## Shared world grammar

A faction is a political bargain, not an ancestry with one opinion. Households can migrate, intermarry, dissent and serve another banner. Ancestry informs bodies and inherited aptitudes; it does not determine loyalty or moral worth. Poverty, coercion and sincere public service can coexist inside any institution below.

The [fourteen traditions](<The Book of Broken Roads/Appendix — The Fourteen Traditions.md>) are inheritances of blood, place or pact; the nine disciplines are learned knowledge. A culture's favored traditions are neither a universal aptitude nor a monopoly. A scholar may know workings they cannot perform. No entry adds a fifteenth spring, makes Void comprehensible, proves a creation story, or declares the Witness Roads secretly restored.

Geography in this bible supplies regional relationships, not fixed coordinates on generated maps. The Anvilheights, Deepfen, Reedfen margin, Middle Reach, Outer Isles, southern chalklands, Sallow and Glass Coast come from the Book. Proposed regions in Part II occupy its incompletely described margins; they do not become a sixth ancient great power by retrospective assertion. All campaign borders, founding dates, wars and victories still emerge from the actual campaign.

Names favor pronounceable personal names and meaningful household, work or geographic names. Preserve the registered cultures' current name pools when writing game content. New pools need their own reviewed fragments; the few examples here are not a license to reuse one culture's generator for another.

## Part I — The twelve registered cultures

### 1. Ashen Compact

`faction.ashen_compact` — **Keep the hearth. Keep the oath.**

**Origin and culture.** Descendants of craft households displaced from upland towns by the Ashfall built a federation of open-square oaths. A maker's mark is a public liability: the household repairs work that fails. Apprentices carry skills between hearths, but older workshops disagree about whether a newcomer should inherit the common store before contributing to it. The Compact is a new power, not a surviving crown.

**Strategy, livelihood and force.** Reliable workshops support sustained settlement and mixed field columns. Grain reserves connect established towns to risky new hearths. Oath guards protect markets and caravans; craftsmen's competence does not give every soldier enchanted equipment. The implemented recruitment policy remains balanced and guard-centered, not an exclusive artisan army.

**Fault line and diplomacy.** Frontier households demand seed and tools; old hearth councils demand evidence that each new site can endure. Cinder mine contracts are useful but make the Compact dependent on wardens whose tolls it contests. It favors public, limited obligations over secret undertakings. An open hearing can expose a bad bargain without making its outcome fair to everyone.

**Supernatural outlook.** The First Bargain and remembrance remain household practices. Oath, Spirit and practical Rune study are natural future hooks, not proof that a public promise is magically enforced. Dream practitioners can find employment as craftspeople and still face suspicion as witnesses.

**Material and ecological identity.** Hearth-gold, soot brown and warm unglazed clay; squared aprons, broad work belts, repaired shields, low kiln courts and modular masonry. The hearth mark should read as a tended enclosure, not a royal sun. Grassland food and forest industry support its current ecology; see the exact table below.

**Character seeds.** Mera Kilnbound, a workshop auditor whose own family supplied defective frontier tools; Aven Oathweft, a caravan organizer asking the council to judge survival before repayment. Short given names and craft-house surnames place obligation close to daily work.

### 2. Reedbound Council

`faction.reedbound_council` — **No river belongs to one shore.**

**Origin and culture.** Reedfen-margin villages once paid tribute to the Mire Courts. They retained seasonal assemblies while rejecting their former landlords' authority. Boat households, reed cutters, garden holders and refugees need different water levels; assembly procedure is how they remain a polity between incompatible livelihoods. Their grievances do not erase the Deepfen's documented sheltering of refugees during the Long Ash.

**Strategy, livelihood and force.** Wetland food and diverse reed work sustain dispersed holdings. Patrols, ferries and guarded crossings matter culturally; the current army still pays ordinary movement, transport and recruitment costs. The implemented guard-centered mix is not an amphibious racial ability.

**Fault line and diplomacy.** Upstream drainage benefits fields while depriving downstream families of navigable water. Mire diplomats offer restoration of old protections with old obligations attached. The Council negotiates reciprocal use rather than one shore's absolute title, but a dominant upstream delegation can turn that language into delay while its own works proceed.

**Supernatural outlook.** Tide and Spirit hedge practice coexist with cautious borrowings from Mire Verdancy. No court may simply declare a river's wishes on behalf of everyone downstream. Speaking with an ancestor is not an implemented ownership test or a substitute for paid cultivation.

**Material and ecological identity.** Reed green, pale rush, river clay and weathered timber; practical woven layers, narrow boats, open stilt galleries and long low rooflines. Split-bank and tied-reed forms distinguish assemblies from the Mire's enclosed court ceremonial. Marsh and rainforest food are strengths; dry ash and desert are difficult.

**Character seeds.** Neri Lowwater, a downstream boatwright elected by households without fields; Vessa Fordkeeper, an upstream negotiator whose new gardens would feed the council and strand her cousins. Names keep banks, ferries and water stages rather than noble titles.

### 3. Cinder March

`faction.cinder_march` — **We hold what the fire spared.**

**Origin and culture.** Pass-fort families held the burnt uplands through four unpaid generations of the Long Ash. Their hereditary wardenship is built on service that genuinely kept people alive. Reopened mines now pay for the walls, making mine labor, transport households and creditors politically indispensable to offices that once answered chiefly to inheritance.

**Strategy, livelihood and force.** Ash-country industry and pass fortifications favor deliberate concentrations, engineers and dependable shield lines. Cinder drill is a lore reputation, not an additional faction armor modifier. Its current paid recruitment uses the original balanced policy; heavy infantry is available to every culture.

**Fault line and diplomacy.** Mine masters seek command proportional to the coin they provide; workers question why either mine owner or warden should speak for them. The Compact needs ore, and the Covenant controls alternative mountain suppliers. The March offers dependable passage and defense but treats unpaid transit promises as a direct threat to the next winter's garrison.

**Supernatural outlook.** Flame can mean useful furnace heat or an intolerable reminder of the Ashfall. Stone and Warding scholarship appeal to wardens; miners distrust any proposed protection whose costs are collected only from the pit. Neither a local kiln cult nor an enemy accusation establishes who caused the catastrophe.

**Material and ecological identity.** Burnt rose, charcoal, dark iron and exposed clinker; compact shield walls, layered repair plates, thick pass gates and cropped banners that do not catch ridge winds. Fire scars are maintained surfaces, not universal glowing cracks. Ash scrub and steppe industry thrive more readily than wet extraction.

**Character seeds.** Kesta Ironstair, a pass captain required to collect tolls from a starving allied caravan; Dren Redquarry, a mine delegate funding fort repairs while organizing a challenge to hereditary command. Names join hard, short personal forms to actual work sites.

### 4. Glass Tide

`faction.glass_tide` — **Every horizon is a promise.**

**Origin and culture.** Charter towns of the vitrified coast inherited the League's commercial grammar without inheriting a functioning League. Their inhabitants gather Ashfall glass from beaches where sea-fire once struck. Route charters, shared voyages and public arguments about exposure bind towns that otherwise compete for the same landing fees.

**Strategy, livelihood and force.** Coastal exchange, chalkland trade and reopened horizons define the aspiration. Guarded ports and scouts protect the landward side of ordinary fleets. Transport, ocean navigation and naval construction retain their shared costs and requirements; a maritime name grants no deep-water access by itself.

**Fault line and diplomacy.** Every town wants the next dangerous route reopened and prefers another town to absorb its first loss. Saltwind successor crews dispute wreck rights and the legitimacy of surviving claims. Glass negotiators like divisible commitments and several partners, which can distribute risk or conceal who will act when help is needed.

**Supernatural outlook.** Tide aptitude is common in the coastal lore, with schooling still limited; Storm and Star learning attract investment. The Drowned Star is a religious account, not a discovered power source. Glass recovered from the shore supplies evidence and craft material, not proof of the Ashfall's author.

**Material and ecological identity.** Sea grey, muted blue, sea-glass accents and pale coastal stone; rounded glass fittings, open harbor courts and sail-like roofs. Keep it distinct from Saltwind's angular tar-and-rigging silhouette. Ocean and chalkland coin favor worked coastal domains; cold inland provisioning is less comfortable.

**Character seeds.** Seren Tideledger, a route assessor asked to certify a voyage whose first survey is incomplete; Lessa Shoreglass, a quay organizer demanding that deck families share the profits they risk their lives to earn. Charter and shore surnames link civic office to maritime work.

### 5. Iron Covenant

`faction.iron_covenant` — **The hold endures. The valley is owed.**

**Origin and culture.** The enduring Anvilheights estate joins deep-folk holds and human client valleys under the Kiln faith. Its mountain closure after the Failing is established; its hidden councils' every decision is not. Craft obligations, inspection marks and long service records sustain a polity whose valley suppliers can be essential without being treated as equals.

**Strategy, livelihood and force.** Metallurgy, masonry and durable mountain supply underpin its strategic identity. Heavy works require food and charcoal from outside the deepest holds. Common guards, engineers and heavier formations express that identity without an implemented exclusive Rune arsenal or passive fortress bonus.

**Fault line and diplomacy.** Valley delegates demand a voice equal to the obligations placed on their harvests. Hold elders argue that opening records and passes exposes unfinished debts and strategic works. Cinder buys and competes with Covenant craft; Wardhall successors inherit equipment associated with the Severing. Guarantees of workmanship come more readily than explanations of history.

**Supernatural outlook.** Rune and Stone are attested strengths. Kiln doctrine treats maintenance as worship. The old boast against Dream and Verdancy is cultural dogma, not permission to write every individual as incapable of imagination, dissent or care. Null-anchors remain a historical responsibility, not current recruitable equipment.

**Material and ecological identity.** Aged brass, iron black and basalt, with compact load-bearing forms; deep breastplates, squared tools, recessed doors and massive stepped buttresses. Use forged joints rather than Wardhall's exposed planar bracing. Taiga and alpine industry are favorable; wet heat strains established working methods.

**Character seeds.** Dova Valleybond, a valley assessor presenting the hold with generations of unpaid obligations; Hedra Seamkeeper, a deep-folk engineer whose safety report would halt the only forge meeting an ally's contract. Names carry seam, measure and bond, not interchangeable grandiose titles.

### 6. Sepulchral Synod

`faction.sepulchral_synod` — **No measure ends at the grave.**

**Origin and culture.** The enduring southern chalkland priest-state inherited bone terraces older than its own explanations. It houses, ranks and employs the dead. Its seed caravans helped the hungry margins survive, and its lawful calling of soul-collateral helped make the Hollowing. Neither account cancels the other. The Ninth Terrace's Provost remains unnamed and unexplained here.

**Strategy, livelihood and force.** Measured dry-country provisioning and archives anchor the current playable identity. The Book's tireless labor and waterless caravans are attested setting powers, but the game does not implement undead supply exemption, free labor or death-proof troops. Its current armies and economy pay ordinary costs.

**Fault line and diplomacy.** Living dependents ask whether an inherited duty can ever be discharged when the office issuing it never dies. Terrace administrators disagree about what an old instrument permits without agreeing that outside courts may inspect it. Reedbound and Compact households may need seed while refusing collateral over their dead. Synod diplomacy prefers precise instruments and remembered obligations to public reassurance.

**Supernatural outlook.** Grave, Star and Shadow are established traditions; the Second Interment also involves Rune and a Forbidden art. Petition and aptitude matter: lichdom is not a routine career promotion. No new explanation is supplied for why the Synod grants a petition.

**Material and ecological identity.** Bone chalk, muted lilac, dark bindings and restrained brass; layered burial terraces, veils, measured tablets and processional verticals. Death appears as administered continuity, not piles of random skulls. Chalkland knowledge and desert provisions contrast with difficulty organizing wetland industry.

**Character seeds.** Naia Quietgrain, a living caravan overseer refusing to accept a starving town's family recitations as payment; Erel Lastmeasure, a terrace clerk who finds two mutually valid claims upon the same dead worker. Their offices do not reveal or replace the Provost.

### 7. Mire Courts

`faction.mire_courts` — **The season returns. The court remembers.**

**Origin and culture.** Elder fenfolk courts of the Deepfen govern through season, ceremony and household rights. They withdrew from the Roads before the catastrophe and endured it. Their patience is an institutional resource, not universal wisdom: a seasonal hearing can preserve careful judgment or postpone a tenant's freedom for another lifetime.

**Strategy, livelihood and force.** Marsh provision and rainforest knowledge support dispersed court domains. Spear lines and wayfinders suit watched approaches better than indiscriminate heavy construction. Those preferences influence ordinary paid AI recruitment; home wetlands are not mechanically unconquerable and grant no special movement.

**Fault line and diplomacy.** Some households would recognize Reedbound independence to secure a cooperative margin; others consider recognition the surrender of a still-valid inheritance. Reedbound families remember both abandonment and refuge. Courts offer long guarantees with ceremonial conditions, preferring the slow accumulation of consent to an urgent rival's timetable.

**Supernatural outlook.** Verdancy, Spirit and Dream are attested strengths, including formidable historical defensive workings. Who may speak for a grove or an ancestor is contested within the courts. Rooted walls and dream rites are future mechanics, not powers represented by the existing spear unit.

**Material and ecological identity.** Moss green, subdued plum, bark brown and copper bindings; long leaf shields, woven armor, swept roofs and elevated rootwood chambers. Distinguish enclosed, layered court ceremony from Reedbound's open working platforms. Ash scrub and desert food are ecological difficulties.

**Character seeds.** Nethra Seasonroot, an envoy willing to recognize a former tenant's title without obtaining every household seal; Orell Duskpool, a refuge keeper whose surviving admission rolls contradict both sides' favorite account of the Long Ash. Flowing given names meet seasonal and rooted household forms.

### 8. Saltwind Remnant

`faction.saltwind_remnant` — **A keel is pledged only once.**

**Origin and culture.** Surviving charter households and crews formed smaller compacts after the League's collapse. They do not restore the Anchorage, the High Charter or Aldery's line. A ship's present company and an old creditor may possess incompatible, carefully preserved claims. Limited pledges are an effort to prevent a familiar catastrophe, not proof that maritime finance is now harmless.

**Strategy, livelihood and force.** Quay workshops, ocean trade and accountable transport support guarded landings. Guards receive the strongest current preference, with spear and scouting support; ordinary harbor and technology requirements still govern every hull. Unlike the Glass Tide's coalition of route-opening towns, the Remnant centers the obligations of particular ships and the households behind them.

**Fault line and diplomacy.** Crews insist their work cannot repay unborn obligations sold by vanished offices. Charter heirs fear that repudiating every old claim will destroy honest property alongside fraudulent debt. Glass Tide towns compete for harbor legitimacy. Remnant negotiators favor named guarantors and short, explicit exposure, sometimes excluding a poor but reliable partner unable to offer security.

**Supernatural outlook.** Tide, Storm and Star learning survive unevenly from the League. Practical sounding and weather records remain essential; lineage is not a replacement for training or payment. A missing pilot's prophecy cannot authenticate an old pledge.

**Material and ecological identity.** Muted petrol and auburn sailcloth, tar-black leather and practical brass rigging; narrow nautical equipment, angular broken-keel seals, broad weathered stilt quays and low sail roofs. Town development adds dense occupied workshops, not a flag so tall that the buildings shrink. Distinct from Glass Tide's rounded glass fittings.

**Character seeds.** Alda Keelwrit, a charter keeper returning a profitable but multiply pledged hull; Cerrel Ropemeasure, a crew delegate who needs credit while campaigning against hereditary liability. Names refer to sounding, rigging and limited pledges, not restored royal styles.

### 9. Wardhall Remnant

`faction.wardhall_remnant` — **Let the work stand witness.**

**Origin and culture.** Human work halls in the fragmented Middle Reach preserve engineering, inspection and defensive practice associated with Wardhall. Their alliance is not the Null Throne returned, and no new monarch repairs the obscure end of Ossric's line. A functioning wall can unite households that disagree completely about the legitimacy of the state that once ordered it.

**Strategy, livelihood and force.** Chalk workshops and grassland study support deliberate spear-and-heavy-infantry concentrations. Measured construction and command discipline matter more than speed. These are current recruitment preferences over shared troops, not an innate defensive advantage or a rule that prevents magic from affecting them.

**Fault line and diplomacy.** Hall wardens want uniform authority over roads and fortifications; working households want standards without a new throne. Ashen councils welcome accountable craft but resist imposed jurisdiction. Covenant contracts raise uncomfortable questions about old null-anchors. The Remnant offers inspectable works and bounded responsibilities, yet inspectors can become rulers if nobody can appeal their findings.

**Supernatural outlook.** Some preserve the Throne's distrust of the springs; others distinguish dangerous coercion from useful healing and craft. Historical Warding is neither the absence of magic nor a current immunity. No ability called nullification exists merely because a shield bears a ward-grid.

**Material and ecological identity.** Chalk grey, slate violet, black riveted reinforcements and exposed straight braces; kite shields, squared hall masses, low crenellated enclosures and an open-square seal. Avoid the Covenant's anvil language and the Synod's mortuary terraces. Wetland industry is a known adaptation cost.

**Character seeds.** Reva Linewright, an inspector refusing a politically convenient certificate for an unsafe gate; Hadran Plainsward, a hall captain seeking unified defense while denying that he is founding another crown. Level, line, brace and reach shape household names.

### 10. Rimehorn Clans

`faction.rimehorn_clans` — **Share the shelter. Answer the horn.**

**Origin and culture.** Human and giantkin shelter households of the high cold are a present regional society, not a newly revealed ancient empire. Their clan obligations follow winter shelter, shared stores and the labor of maintaining approaches. A distant household can belong by contribution without living under a permanent central authority.

**Strategy, livelihood and force.** Cold-country food and taiga industry support durable guarded routes between settlements. Guards, spears and heavy infantry receive the implemented preferences. Giantkin identity is not an implemented giant-sized combat class, immunity to winter costs or exemption from the common formation rules.

**Fault line and diplomacy.** Store keepers seek predictable contributions; remote shelters demand autonomy over reserves they might never survive long enough to deliver. Covenant buyers want timber and secure passes, while Sable caravans need seasonal access. A shelter promise carries weight, but a clan gathering may refuse to let one generous host bind every other household.

**Supernatural outlook.** Spirit and Stone teachings suit remembered shelter obligations; Storm practice is respected and feared where bad forecasts kill. These are cultural hooks, not an attested explanation of every northern phenomenon. Book accounts of giants do not establish the date or ancestry of every clan.

**Material and ecological identity.** Weathered ivory, grey fur and dusky blue, with restrained bone fittings and dark stone; supported roofs, broad shelter beams and compact cold-weather layers. Heraldry joins crossed shelter beams rather than making every clan a horned warrior cult. Desert and marsh demand unfamiliar provision and extraction methods.

**Character seeds.** Ruva Wintershare, a store keeper accused of favoring the shelters nearest her ledger; Torrin Snowbeam, a giantkin bridge mender who wants distant hearths represented before the next levy. Short, sturdy given names pair with shelter and winter work.

### 11. Sable Steppe

`faction.sable_steppe` — **The road moves with the camp.**

**Origin and culture.** Mixed human camp assemblies hold grazing, passage and meeting rights across open country. Their mobility is an organized livelihood, not refusal of law or an inevitable desire to raid. Fixed towns support winter stores, markets and repairs; their residents cannot simply claim to represent households that spend most of the year elsewhere.

**Strategy, livelihood and force.** Steppe food and desert exchange favor reach, scouting and mounted concentration. Cavalry has the strongest implemented recruitment weight, with scouts and spears supporting it. Horses still require money, upkeep and suitable movement; no mobile-city or free-pasture mechanic is implied.

**Fault line and diplomacy.** A town's fenced fields may feed a caravan and close its return route. Camp speakers want renewable passage agreements; town councils want borders that remain legible after the assembly leaves. Rimehorn shelter bargains and Cinder pass tolls are necessities that can become dependency. Sable diplomacy distinguishes temporary use from permanent surrender of a route.

**Supernatural outlook.** Storm and Spirit teachings accompany seasonal travel. Oath traditions divide those who see a sworn route as mutual protection from those who hear the old debt machinery returning. These beliefs grant neither supernatural horses nor private knowledge of unseen territory.

**Material and ecological identity.** Rust felt, dull ochre, indigo bindings and dark lamellar; long layered riding shapes, tension-roof halls and camp-derived enclosures. Three wind notches mark shared passage. Do not reduce the culture to an undifferentiated horse army or borrowed steppe regalia. Wet marsh and dense taiga complicate familiar livelihoods.

**Character seeds.** Ivara Grazingmark, a camp speaker defending a route across her sibling's new farmland; Odan Openmile, a town repair master trying to secure winter stores without buying a permanent voice over the camps. Soft two-syllable names meet practical route and tack surnames.

### 12. Morrow Spore

`faction.morrow_spore` — **What falls shall feed what follows.**

**Origin and culture.** Human and fungal-symbiont underwood households share managed growth and living records. Their present political union is a new authored region beyond the Book's main account. Symbiosis does not eliminate privacy, dissent or the choice to refuse a practice; a shared record is not a universal shared mind.

**Strategy, livelihood and force.** Forest knowledge and rainforest food support dispersed holdings, survey and managed woodlands. Wayfinders receive the strongest current recruitment preference, with guards and spears maintaining the settled network. Timber, colonists and troop replenishment still require real work and costs; there is no automatic fungal expansion.

**Fault line and diplomacy.** Archive keepers seek continuity of mature growth; new settlements need timber, light and space. Mire households may recognize stewardship while rejecting the Union's way of recording it, and Iron purchasers value wood more readily than the obligations attached to its harvesting. Morrow negotiators want replenishment and access terms that remain meaningful after the buyer leaves.

**Supernatural outlook.** Verdancy and Spirit are plausible fields of practice; living records may combine craft, inherited aptitude and interpretations that households dispute. They do not prove that every remembered account is true. Dream research is an aspiration, not implemented collective surveillance.

**Material and ecological identity.** Umber layered carapace, dusty mauve and pale lichen seams; grown timber ribs, low broad shelf roofs and a hollow crescent sheltering three seeds. Retain visible human tools and individual clothing among symbiotic forms. Chalkland food and ash-country trade are difficult adaptations.

**Character seeds.** Ovenna Rootwitness, an archive keeper asked to preserve a grove whose shade is starving a new field; Nelun Fallenbough, a forester defending necessary cutting against a record his household helped maintain. Gentle doubled consonants and growth-related surnames distinguish the current pool.

## Current ecological reference

These are the registered culture contributions to **worked** tiles, not their entire yields. Unlisted biomes are neutral. Apply all signed contributions through the canonical rules; a penalty does not establish racial inability to live somewhere. Cultivation is paid, takes work time and does not change physical relief, ocean depth or natural-feature identity. The targets below are land-biome choices, not instant homeland creation.

| Culture | Positive contribution | Negative contribution | Current cultivation targets |
| --- | --- | --- | --- |
| Ashen Compact | Grassland +1 food; temperate forest +1 industry | Tundra and desert −1 food | Grassland, temperate forest |
| Reedbound Council | Marsh and rainforest +1 food | Desert and ash scrub −1 food | Marsh, rainforest |
| Cinder March | Ash scrub and steppe +1 industry | Marsh and rainforest −1 industry | Ash scrub, steppe |
| Glass Tide | Ocean and chalkland +1 coin | Tundra −1 food; taiga −1 industry | Chalkland |
| Iron Covenant | Taiga and alpine +1 industry | Marsh −1 food; rainforest −1 industry | Taiga |
| Sepulchral Synod | Chalkland +1 knowledge; desert +1 food | Marsh and rainforest −1 industry | Chalkland, desert |
| Mire Courts | Marsh +1 food; rainforest +1 knowledge | Desert and ash scrub −1 food | Marsh, rainforest |
| Saltwind Remnant | Ocean +1 coin; chalkland +1 industry | Taiga −1 industry; rainforest −1 coin | Chalkland |
| Wardhall Remnant | Chalkland +1 industry; grassland +1 knowledge | Marsh and rainforest −1 industry | Grassland, chalkland |
| Rimehorn Clans | Tundra +1 food; taiga +1 industry | Desert −1 food; marsh −1 industry | Taiga, tundra |
| Sable Steppe | Steppe +1 food; desert +1 coin | Marsh −1 food; taiga −1 coin | Steppe, desert |
| Morrow Spore | Temperate forest +1 knowledge; rainforest +1 food | Chalkland −1 food; ash scrub −1 coin | Temperate forest, rainforest |

## Part II — Twelve proposed cultures toward twenty-four

**Everything in this part is planned, not playable or art-complete.** Proposed IDs are reserved in this document only, not in a runtime registry. Biome interests are qualitative design directions, not balanced numerical bonuses or granted cultivation choices. Regional names and new ancestries are proposed additions, not claims that Ilthen already attested them. Each concept must earn its place through distinct paid choices, AI behavior and reviewed art before implementation.

### 13. Cistern Assembly — proposed

Proposed ID: `faction.cistern_assembly`. Proposed region: the dry basins beyond the cultivated southern chalk, connected to existing caravan routes rather than replacing the Synod's heartland.

**Origin and culture.** Well keepers, displaced gardeners and caravan households pooled cistern maintenance during the Long Ash. Membership rests on work and residence, not ownership of a spring. Households read a public water measure before each allocation; readers can be challenged, but the committee choosing them can still entrench its own interests.

**Strategy, economy and military.** Make difficult dry sites productive through paid, feature-aware land investment, then defend a modest network of dependable stops. Patient spear-and-guard columns and engineers fit this first implementation direction. The concept needs neither simulated aquifers nor free irrigation; reserve trading or water ration commands would be later systems.

**Conflict and diplomacy.** Founding well families demand inherited priority; newly admitted gardeners say maintenance buys an equal voice. Synod caravans offer reliable seed with terms the Assembly wants made public. Sable camps need temporary access rather than permanent membership. Diplomacy favors measured shares and reviewable drought exceptions, not an assertion that every outsider is stealing water.

**Supernatural outlook.** Tide and Stone practice is welcome when its results can be inspected. A spring is not deemed limitless because a priest blesses it. Rain calling remains an aspiration, not a starting power.

**Art, ecology and names.** Limewashed stone, muted turquoise, rust-red cord and dark glazed jars; squat cistern rings, shade galleries and broad lidded-vessel shields. A three-notch water measure is the seal. Favor desert and chalkland with springs; waterlogged marsh and cold taiga require costly adaptation. Names use clear vowels and offices that can change: **Demin Thirdmeasure**, a reader exposing his founding house's extra draw; **Alta Sillkeeper**, a gardener arguing that emergency guests must become members, not permanent supplicants.

### 14. Unsealed Companies — proposed

Proposed ID: `faction.unsealed_companies`. Proposed range: ruined toll corridors between established hearthlands, not the land or government of every road company.

**Origin and culture.** A coalition of companies traces parts of its membership to soldiers erased during the Reckoning, joined by families who survived on transport, repair and hired defense. It rejects inherited oath-debt without rejecting obligations made by living people. A pay roll records work owed; it is deliberately not a pledge of descendants or remembrance.

**Strategy, economy and military.** Paid combined-arms columns protect new market bases and sell dependable service in the fiction. Existing recruitment, officer development and finite contracts suggest a grounded first slice; a mercenary-hire market, portable settlement or extra loot is not already present. Quartermasters and stable supplies matter as much as veteran shock troops.

**Conflict and diplomacy.** Veteran companies resist being taxed by the fixed towns that now house their families. New residents refuse to fund campaigns without a vote. Cinder wardens view unchartered road power as a threat, while Ashen settlers may need its escort. Diplomacy favors short written terms and clear exit conditions; reliability does not require submitting to someone else's account of ancestral guilt.

**Supernatural outlook.** Spirit remembrance remains meaningful even where institutions once erased names. Oath practitioners must distinguish consensual present bonds from soul-collateral. Shadow talent is neither universal nor proof that a company is secretly treacherous.

**Art, ecology and names.** Faded vermilion, undyed canvas, pewter and reused dark plate; asymmetrical repair panels, broad roll cases, wagon-court buildings and banners cut open at the foot. Favor steppe exchange and ash-scrub salvage work; rainforest logistics and marsh extraction are harder. Keep the broken-seal mark distinct from Saltwind's broken keel. Earned names can be refused: **Berr Oncepaid**, a veteran refusing an illicit bonus; **Sova Rollkeeper**, a town-born quartermaster demanding a civilian audit.

### 15. Lantern Hospices — proposed

Proposed ID: `faction.lantern_hospices`. Proposed region: a chain of inhabited hospice towns at former plague-road junctions, not an intact continent-wide service.

**Origin and culture.** Households that maintained refuge, burial and clean stores during recurrent ash-lung joined care houses across several traditions. Their charter protects the sick and makes sanitation a civic duty. Admission is a decision with real costs; there are reformers, exhausted attendants, wealthy donors and officials who mistake control for care.

**Strategy, economy and military.** Sustained population, disciplined refit and defensible knowledge centers are the design direction. Guard escorts and engineers protect supplies and shelter. Actual disease simulation, faction healing, asylum diplomacy and cross-border aid would each need separate rules; current refit can provide a modest grounded military expression first.

**Conflict and diplomacy.** Open-door attendants oppose governors who use quarantine to exclude competitors and unwanted migrants. The Synod supplies expertise in death that some hospices need and others denounce. Wardhall's inspectable engineering can protect a ward or become its cage. Diplomacy seeks temporary safe passage and reciprocal care, without an automatic moral or peace bonus.

**Supernatural outlook.** Radiance is respected but does not make its practitioners infallible or erase the need for Grave and Verdancy expertise. Care houses disagree about exorcism, consent and the rights of a housed dead person. There is no implemented disease immunity or resurrection.

**Art, ecology and names.** Beeswax yellow, washed blue, soot-black lantern cages and plain linen; hooded service coats, shielded lamps, open courtyards and wide ventilated roofs. A lamp behind two protective shutters replaces a triumphant sunburst. Favor grassland provisions and chalkland learning; ash scrub and rainforest damp complicate storage. Service names stay modest: **Enna Wickward**, an attendant protecting a foreign patient from her own governor; **Tovel Cleanstep**, a burial officer challenging a profitable quarantine.

### 16. Cairnwing Concord — proposed

Proposed ID: `faction.cairnwing_concord`. Proposed region and ancestry: cliff settlements of the Broken Escarpments, inhabited by newly authored feathered cairnfolk and human lift-port households. Neither ancestry nor polity is retroactively attributed to the Book's named witnesses.

**Origin and culture.** Communities sharing ledges, landing courts and load-bearing lifts formed a concord when surface routes failed. Membership depends on maintaining both upper roosts and lower supply yards. Cairnfolk wing anatomy and any capacity for gliding remain design decisions; feathers on art must not silently become a strategic flight rule.

**Strategy, economy and military.** Observation, secure approaches and exchange between difficult sites define the proposal. Spear watches, scouts and ground supply columns can work under ordinary movement initially. Flight, cliff-only movement and separate aerial combat are larger, explicitly unimplemented systems.

**Conflict and diplomacy.** Upper councils claim the skyward settlements founded the concord; lower port workers answer that nobody aloft survives without their labor. Rimehorn shelters need access through the escarpments, and Covenant buyers want exclusive lift rights. The Concord prefers reciprocal maintenance and shared passage but disputes whether a route can be owned vertically.

**Supernatural outlook.** Storm and Stone teachings address dangerous weather and structures; Star scholars seek reliable distance measurements. An omen is not a legal weather guarantee. No aerial omniscience follows from these interests.

**Art, ecology and names.** Tawny feathers, oxblood cord, oxidized copper and pale scree; folded layered wings, narrow harnesses and bracketed buildings hung beneath broad ledges. A stepped feather serves as seal, not a royal eagle. Favor alpine industry and adjacent steppe supply; marsh and dense rainforest challenge established construction. Clipped names join named ledges: **Kirr Lowbracket**, a lift inspector from the lower ports; **Sevet Redledge**, a roost delegate returning an inherited exclusive landing claim.

### 17. Red Sluice Directorate — proposed

Proposed ID: `faction.red_sluice`. Proposed region: the Red Channels, an eastern wet-lowland reconstruction district outside the Book's described Reedfen assemblies.

**Origin and culture.** Canal labor communes consolidated their emergency boards into a directorate. Authority is justified by water levels, maintenance schedules and the ability to deliver a harvest. Some boards are genuinely answerable to working crews; others preserve emergency powers long after the immediate crisis has passed.

**Strategy, economy and military.** Concentrated wetland industry, deliberate improvement placement and engineered defensive lines are the identity. Spear-and-heavy columns protect fixed investments. Existing paid marsh works can express the opening; physically redirecting rivers, flooding enemy armies or changing sea level cannot be inferred from a sluice-shaped building.

**Conflict and diplomacy.** Upstream pumping schedules protect the central works while leaving marginal households with the overflow. Reedbound negotiators share the problem but reject the Directorate's permanent command structure. Cinder furnaces supply machinery whose maintenance consumes scarce funds. Diplomacy favors quantified delivery and joint inspection, with the danger that measurable output obscures unmeasured losses.

**Supernatural outlook.** Rune and Tide specialists must publish operating limits. A board may distrust spontaneous magic while depending on inherited workers' aptitudes. Mechanized water control remains a proposed project, not a secret property of cultivation.

**Art, ecology and names.** Brick red, dull celadon, tarred oak and blackened chain; horizontal gate housings, broad rectangular rain shields, visible wheel braces and low maintenance gantries. The seal is a barred spillway, not Wardhall's open square. Favor marsh industry and grassland food; alpine access and desert maintenance are difficult. Work-register names become household forms: **Pella Gatefive**, a scheduler publishing the cost to outlying farms; **Rusk Barwright**, a crew representative asked to enforce another emergency extension.

### 18. Velvet Meridian — proposed

Proposed ID: `faction.velvet_meridian`. Proposed region: dry upland observatory towns called the Night Measures, linked by ordinary roads and seasonal scholar caravans.

**Origin and culture.** Weavers, night navigators and sleep-house teachers established competing schools whose cloth measures and observation records became reliable trade goods. Their association protects multiple interpretations rather than declaring one academy the owner of truth. Wealthy sponsors nevertheless decide which questions get measured.

**Strategy, economy and military.** Knowledge investment, careful scouting and trade-funded guarded towns are the proposed strengths. The army needs ordinary spears, guards and escorts even if court fashion prizes subtlety. Espionage, predictive battle powers and diplomatic manipulation are aspirations, not an excuse for hidden-state AI.

**Conflict and diplomacy.** Public observers demand open records; private schools sell exclusive interpretations and call their rivals careless. Glass Tide pilots want shared charts, and Synod scholars claim older measures without accepting reciprocal inspection. Meridian diplomacy permits several provisional agreements where a neighboring court demands a single final judgment.

**Supernatural outlook.** Dream and Star aptitudes can make a gifted practitioner without making a dream true. Scholars sharply distinguish recorded sky observations from inward experience. Shared dreams, fate prediction and veiled ambassadors would require actual costs and counterplay before implementation.

**Art, ecology and names.** Madder red, smoke silver and blue-black woven cloth; weighted hems, small calibrated discs, long sleeved silhouettes and low round observatory roofs. The seal is a plumb line crossing three unequal stitches, not a generic magical eye. Favor desert knowledge and chalkland exchange; wet rainforest storage and ash scrub's abrasive dust are drawbacks. Flowing given names pair with measured objects: **Aveline Hemscale**, a weaver whose disputed standard was copied abroad; **Orel Pendline**, a teacher publishing a patron's failed prediction.

### 19. Brine Choir — proposed

Proposed ID: `faction.brine_choir`. Proposed region and people: coastal shelf communities of newly authored brinefolk alongside human shore households. This is not proof of the Book's unspecified deep-water powers' identity.

**Origin and culture.** Interdependent shore and sheltered-pool households formed a political choir: public response establishes that all represented settlements heard a proposal. Speaking together is a procedure, not a hive mind. Tide-dependent residence and care for young make access to suitable shore as important as ownership of a house.

**Strategy, economy and military.** Productive shallows, measured coastal expansion and protected transport offer a distinct focus. Guards, spears and ships keep supply lines intact. Brinefolk physiology, underwater settlement and amphibious combat are unresolved future rules; neither costume nor ancestry grants free embarkation or deep-ocean access.

**Conflict and diplomacy.** Shore traders want permanent quays that disturb the pools used by other households. Saltwind pledges can fund safer crossings while enclosing shared landing rights. The Glass Tide wants charts the Choir regards as evidence of usage, not goods to be sold without their users' assent. Agreements favor several acknowledged voices rather than one signature.

**Supernatural outlook.** Tide and Spirit practices coexist with competing versions of the Drowned Star. Singing is not inherently spellcasting. No version is privileged as the actual source of the Ashfall or the sea's will.

**Art, ecology and names.** Coral clay, pale eelgrass, wet slate and matte shell inlay; broad fin-fold collars, low crescent shields, perforated wind walls and paired pool courts. A broken concentric ripple distinguishes it from the coastal cultures' keels and sails. Favor ocean provisions and marsh exchange; taiga storage and desert settlement demand adaptation. Resonant personal names meet shore forms: **Olumi Poolmouth**, a delegate refusing a lucrative exclusive quay; **Dessa Ringlow**, a human repairer seeking a vote for year-round shore workers.

### 20. Emberwake Convocation — proposed

Proposed ID: `faction.emberwake_convocation`. Proposed region: communities among the outer ash belts, not an asserted birthplace of the Ashfall.

**Origin and culture.** Seed keepers, kiln workers and survivor congregations organized recurring gatherings around recovery from repeated local burns. Some regard controlled loss as necessary renewal; others see that doctrine used to destroy inconvenient property and records. They remember disaster without possessing privileged knowledge of its cause.

**Strategy, economy and military.** Careful ash-country rehabilitation, ceramic work and investment in damaged frontiers distinguish them from Cinder's pass wardens. Guarded working parties and engineers come before any specialized flame army. Destructive land magic and scorched-earth bonuses are not part of the proposed starting implementation.

**Conflict and diplomacy.** Traveling renewal teachers urge villages to abandon exhausted sites; resident seed keepers bear the cost when the promised recovery does not arrive. Cinder accuses careless burners of endangering routes, while Compact workshops buy kiln products. Diplomacy seeks timed access to recovery grounds and evidence of safe practice, but charismatic teachers sometimes offer certainty they cannot justify.

**Supernatural outlook.** Flame, Verdancy and Warding offer useful but hazardous study. The Convocation contains rival explanations of the Ashfall; none becomes canon through faction belief. A useful local burn cannot prove a world-ending fire was benevolent.

**Art, ecology and names.** Ash white, smoked orange and muted sulfur green; ceramic face screens, split kiln vents, seed jars and low firebreak compounds. A half-blackened seed wheel replaces Cinder's military masonry. Favor ash-scrub knowledge and dry steppe recovery; wet marsh and rainforest make established methods unreliable. Plain names take recovery crafts: **Isca Seedwheel**, a keeper refusing to surrender a viable garden to ritual burning; **Toren Claybreath**, a furnace teacher publishing his own failed safeguard.

### 21. Underhush Exchange — proposed

Proposed ID: `faction.underhush_exchange`. Proposed region and people: inhabited shallow galleries beneath the eastern wooded escarpments, including newly authored broad-handed burrowfolk and surface trading households. They are not another name for the Covenant's deep-folk.

**Origin and culture.** Refuge galleries became linked markets where leases include obligations concerning vibration, smoke and structural disturbance. Different bodies and trades need different conditions; quiet is a negotiated public resource rather than a mystical lack of speech. Market translators work through voice, touch marks and written tallies.

**Strategy, economy and military.** Modest extractive sites, repair skills and carefully defended exchange towns form the first playable direction. Spear watches and compact guards protect entrances. Subterranean maps, tunnel shortcuts and tremor detection remain separate future systems; the current surface map must not hide an unmodeled second empire.

**Conflict and diplomacy.** Furnace traders demand louder, hotter works; dwelling wards defend conditions that make the galleries habitable. Covenant merchants offer standard fittings while expecting privileged terms, and Morrow households dispute the effect of shallow excavation on managed roots. Agreements attach maintenance and habitability duties to access.

**Supernatural outlook.** Stone and Shadow practices are studied as tools, not a universal aptitude or an alignment. Accurate listening does not become remote knowledge of unseen armies. Claims that the deepest galleries open onto the Void remain rumors, not a resolved cosmology.

**Art, ecology and names.** Clay brown, pewter, pale lime and tiny amber markers; rounded work shields, tactile tally beads, low keyhole arches and nested vent stacks. Avoid the Covenant's massive square buttresses and Morrow's living roofs. Favor taiga craft and chalkland exchange; marsh saturation and exposed tundra are difficult. Compact names use work sounds and passage names: **Demm Softcut**, a fitter challenging an unsafe furnace lease; **Luva Neararch**, a surface translator demanding equal dwelling rights.

### 22. Testament Union — proposed

Proposed ID: `faction.testament_union`. Proposed region: mixed farming towns on the living margins of the southern chalklands, not a secession declared to have conquered the Synod's terraces.

**Origin and culture.** Living families, mortuary workers and remembrance societies formed a union around a disputed rule: a continuing obligation must remain open to challenge by those carrying it. Representatives read household testaments alongside present needs. The union disputes the interpretation and ownership of the dead's labor without treating the dead as a uniform political party.

**Strategy, economy and military.** Patient settlement, public knowledge and dependable food support a defense-first polity. Guards and ordinary officers protect household autonomy. Ancestral voting, consent-bound undead service and inheritance litigation are future systems; the existing game does not turn a memorial into an extra worker or a permanent council seat.

**Conflict and diplomacy.** Older households use preserved testaments to secure advantages; newly admitted families ask who speaks for people whose records were erased. Synod officers reject some Union interpretations while continuing useful seed exchange. Ashen auditors admire public procedure but question authority attributed to absent speakers. Diplomacy favors revocable guarantees and named avenues of appeal.

**Supernatural outlook.** Spirit, Grave and Oath traditions make testimony possible in lore without making every purported ancestor trustworthy. Protection against soul-collateral must not be written as proof that all binding magic is harmless when the Union uses it.

**Art, ecology and names.** Warm russet, linen cream, faded verdigris and pale wood; paired testimony tablets, knotted household cords, low garden pavilions and communal remembrance courts. A reopened folded testament replaces the Synod's ranked processional forms. Favor chalkland food and grassland knowledge; alpine supply and rainforest preservation are harder. Clear personal names carry chosen household forms: **Marel Newleaf**, a delegate for erased families; **Iven Twowitness**, a mortuary reader asked to discredit his own ancestor's claim.

### 23. Manytrack Moot — proposed

Proposed ID: `faction.manytrack_moot`. Proposed region and peoples: the Bough Marches, a forest-steppe boundary inhabited by several newly authored speaking horned and furred lineages alongside human households. These are political persons, not units owned by beast handlers. Their presence develops the Book's unenumerated far domains without claiming a previously named empire.

**Origin and culture.** Communities with incompatible sizes, diets and seasonal routes negotiated shared gathering grounds. The moot recognizes use by maintained obligations rather than one household's permanent enclosure. Its common law is young; a powerful lineage can still call its own habits the natural order.

**Strategy, economy and military.** Distributed provisions and guarded movement between complementary sites distinguish the proposal from a single fortress realm. Scouts, spears and mixed defensive formations can express it initially. New body plans need real art and combat readability; natural weapons, beast mounts or special pathfinding are not free consequences of lore.

**Conflict and diplomacy.** Crop growers want protected fields; traveling households need routes the new fences cut. Sable assemblies offer a useful model but may treat nonhuman usage as empty grazing land, while Morrow foresters want cutting terms the moot has not delegated anyone to sell. Diplomacy begins by establishing who must be heard, not by assuming one elder speaks for every species.

**Supernatural outlook.** Verdancy and Spirit are respected without reducing personhood to magical awakening. The origins of these lineages remain locally disputed. No spring makes the moot a single beast mind.

**Art, ecology and names.** Bark black, pale tawny hide, moss blue and stitched raw linen; varied body silhouettes united by crossed path cords, open gathering rings and broad clearance arches. A fork of three unlike tracks is the seal. Favor temperate forest provisions and steppe exchange; desert water and alpine storage are difficulties. Names are translated civic forms, not animal jokes: **Venn Broadpath**, a horned field negotiator; **Seli Reedstride**, a human route keeper opposing her town's new fence.

### 24. Margin Observance — proposed

Proposed ID: `faction.margin_observance`. Proposed region: sparse archive stations along the cold, ash-scarred edges of renewed settlement, with no claimed access to the machinery beneath the world.

**Origin and culture.** Copyists, surviving ruin custodians and families who maintain their supplies formed an observance around preserving contradictions, missing pages and the conditions under which a record was found. They are not the Witnessry restored, Ilthen's authorized successors or keepers of the definitive answer to the Failing.

**Strategy, economy and military.** Deliberate survey, costly knowledge centers and guarded supply lines create an isolated but useful frontier identity. Scouts and ordinary defenders precede any specialized caster. Research toward containment or ascendancy would require explicit decisions, risk and counterplay; possession of a burned page is not an implemented victory shortcut.

**Conflict and diplomacy.** Custodians would preserve dangerous material without opening it; experimenters say refusal merely leaves ignorance to the next catastrophe. Resident households object that both factions spend their grain on other people's mysteries. Wardhall work halls want inspectable safeguards, and Synod scholars seek records the Observance cannot easily replace. Diplomacy exchanges bounded copies and access, not universal trust in an institution's neutrality.

**Supernatural outlook.** Star, Rune and Warding are fields of study. Void is the object of prohibition and disagreement, never a mastered fifteenth discipline or a resolved explanation of the Ashfall. A censored gap may be evidence of censorship, not evidence that a theory about its contents is true.

**Art, ecology and names.** Parchment grey, dull cinnabar, matte ink black and weathered lead; narrow document cases, interrupted stripe patterns, slab-roof stations and protected empty recesses. A broken bracket is the seal; avoid both Wardhall's open-square emblem and a generic all-black sorcerer silhouette. Favor alpine knowledge and ash-scrub study; rainforest preservation and marsh foundations are difficult. Names retain ordinary birth forms plus chosen archive work: **Edda Foldmark**, a custodian refusing an unrecorded experiment; **Ravel Lastmargin**, a supply delegate demanding the school publish its failures.

## Relationships and implementation order

The proposed cohort should enlarge the existing political web rather than arrive as twelve unrelated enemies. Cistern, Testament and Lantern communities make different claims on Synod knowledge and obligations. Unsealed companies challenge the meaning of law along Cinder and Ashen routes. Cairnwing, Underhush and Manytrack societies contest what settled powers call unused space. Red Sluice and Brine institutions complicate Reedbound and coastal arguments over shared water. Meridian and Margin schools disagree over what counts as knowable; Emberwake communities give the aftermath of fire a politics beyond hereditary pass defense.

These are relationships for future authored encounters, not preloaded wars, hidden trust values or mandatory alliances. A campaign must be able to produce cooperation across an apparent rivalry and conflict between apparently compatible societies.

Recommended next implementation order:

1. **Cistern Assembly and Unsealed Companies.** Existing feature-aware paid land work and general-led combined arms provide credible first expressions without inventing a second water or mercenary simulation. Their resource duties and contract politics distinguish them from the current dryland, maritime and mobile cultures.
2. **Lantern Hospices and Cairnwing Concord.** The former can begin with practical refit, learning and supplies while magical care remains aspirational. The latter adds a genuinely different body/settlement silhouette, but needs explicit anatomy and movement decisions before any artist or UI implies flight.
3. **The remaining eight, in reviewed pairs.** Numerical affinity, recruitment and research differences must be justified and tested, not mechanically copied from a neighbor merely to reach twenty-four. Art briefs, approved kits, name pools, player setup, AI use, save origins and integration evidence are separate gates.

This bible adds no registered faction, localization key, exclusive unit, technology, spell, diplomatic command or approved asset. When a proposal enters executable content, assign and validate its stable references there, preserve historical roster identities, and move its entry from proposed to current only after the corresponding implementation has been verified.
