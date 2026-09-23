import type { Evidence, ReleaseGate, RoadmapItem, RoadmapStage, ScopeEntry } from './types';

/** Current reference/roadmap evidence; historical dispatches retain their own pins. */
export const libraryRevision = 'b623c2c91d4d852cba710f2d996c28a6b1b5d624';

/** A selected decision/gate ledger, not a substitute for the complete DoD. */
export const scopeLedger: ScopeEntry[] = [
  { id: 'accepted-scope', state: 'Accepted scope', title: 'The agreed game, not a moving finish line', description: 'The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.', path: 'GAME_1_0_SCOPE.md' },
  { id: 'campaign-integrity', state: 'Current / partial', title: 'Gates E & F · Save integrity and combat', description: 'Campaign-safety corrections retain their historical evidence. Rules31 adds saved fleet stores, with exact rules30 replay and mixed-history local storage and export/import. Independent persistence review found no actionable defect in that boundary; whole save, combat and release gates remain open.', path: 'docs/development/2026-09-23-fleet-provisions/persistence-review.md' },
  { id: 'playable-foundation', state: 'Current / partial', title: 'Gates B, F2 & J · A playable foundation', description: 'Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.', path: 'docs/IMPLEMENTATION_STATUS.md' },
  { id: 'ai-integration', state: 'Open gate', title: 'Gate C & integration · Remaining campaign proof', description: 'The rules31 checkpoint passes 1,861 headless tests and nine affected Chromium journeys. Fleets return to observed supply and can fund staging harbors; a generated island campaign still records one fleet and one passenger attrition turn. Headline Standard/Long pacing and broader logistics remain open alongside M0 and overall integration.', path: 'docs/development/2026-09-23-fleet-provisions/README.md' },
  { id: 'scale-browsers', state: 'Open gate', title: 'Gates D, K & L · Scale and browser confidence', description: 'Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.', path: 'docs/development/review-fix-2/persistence-REPORT.md' },
  { id: 'proposed-followups', state: 'Proposal / deferred', title: 'Suggested follow-ups, not new release promises', description: 'Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.', path: 'docs/development/post-fix-review/persistence.verdict.json' },
  { id: 'not-this-update', state: 'Not this update', title: 'Gate M, full magic and a 1.0 announcement', description: 'No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.', path: 'DEFINITION_OF_DONE.md' },
];

export const library: Evidence[] = [
  { label: 'Start playing & run locally', path: 'README.md', note: 'Controls, setup, save transfer and the actual single-player development build.' },
  { label: 'Implementation status', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Implemented, partial, blocked and historical work. The source of truth behind the headlines.' },
  { label: 'Agreed 1.0 scope', path: 'GAME_1_0_SCOPE.md', note: 'The accepted game and content targets. A feature only counts when it is integrated.' },
  { label: 'Definition of done', path: 'DEFINITION_OF_DONE.md', note: 'Named release gates, required evidence and the final signoff contract.' },
  { label: 'Development workflow', path: 'docs/1.0-DEVELOPMENT.md', note: 'Canonical M0–M10 development sequence, with dependencies and acceptance for the existing scope.' },
  { label: 'World & faction bible', path: 'docs/lore/FACTION_BIBLE.md', note: 'Twenty-four societies, disputed history and the boundary between lore and runtime.' },
  { label: 'Art status & provenance', path: 'docs/art/ART_IMPLEMENTATION_STATUS.md', note: 'Reviewed pixels, real bindings, animation scope and unresolved production limits.' },
  { label: 'Campaign-safety architecture', path: 'docs/architecture/0037-campaign-safety.md', note: 'Canonical ownership, morale correction, reserves and historical compatibility.' },
  { label: 'Fleet provisions architecture', path: 'docs/architecture/0038-fleet-provisions.md', note: 'Canonical stores, shared passenger outcomes, naval staging and versioned persistence.' },
];

/** The roadmap is another view of this journal's canonical scope ledger.
 * The snapshot pins evidence for delivered checkpoints, not verification of the
 * remaining development plan. Reconcile it when new reviewed evidence is committed;
 * preserve historical dispatch claims and do not link uncommitted evidence. */
export const roadmapSnapshot = { date: '2026-09-23', revision: libraryRevision, rules: 31 };

export const roadmapStages: RoadmapStage[] = [
  { id: 'foundations', title: 'Playable foundations delivered', description: 'Checked items are bounded, implemented checkpoints. Their wider 1.0 systems still have work below.' },
  { id: 'current-work', title: 'Complete the playable systems', description: 'Client obligations and unification, magical discovery, standing orders and supply now have playable portions. Complete their remaining strategic choices, coordinated logistics and integrated verification in the order recorded by the development workflow.' },
  { id: 'missing-systems', title: 'Build the missing release systems', description: 'Accepted 1.0 work with no complete playable implementation. These are release obligations, not newly added promises.' },
  { id: 'release-proof', title: 'Prove the release together', description: 'Verify the final integrated revision. Earlier successful checkpoints and deployment do not clear these gates.' },
];

const statusEvidence: Evidence = { label: 'Implementation status', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Reviewed campaign foundations, earlier playable slices and known gaps at the pinned evidence snapshot. Historical test totals remain separate.' };
const scopeEvidence: Evidence = { label: 'Accepted 1.0 scope', path: 'GAME_1_0_SCOPE.md', note: 'The agreed gameplay and content targets; no scope cut is made by this roadmap.' };
const gateEvidence: Evidence = { label: 'Release acceptance criteria', path: 'DEFINITION_OF_DONE.md', note: 'The full objective gate, including integration, AI, saving and verification requirements.' };
const reviewEvidence: Evidence = { label: 'Independent review reconciliation', path: 'docs/development/post-fix-review/summary.json', note: 'Scoped backend, storage and UI approvals; overall integration and release remain unapproved.' };
const campaignEvidence: Evidence = { label: 'Historical campaign foundation verification', path: 'docs/development/2026-09-21-epic-baseline/README.md', note: 'The dated rules17 checkpoint retains its 1,857/1,858 result and scoped browser checks. Later successful runs are recorded separately.' };
const fleetEvidence: Evidence = { label: 'Rules31 fleet provisions verification', path: 'docs/development/2026-09-23-fleet-provisions/README.md', note: '1,861 headless tests and nine affected Chromium journeys pass; measured Standard/Long pacing, remaining naval losses and bounded planner costs remain explicit.' };

export const roadmapItems: RoadmapItem[] = [
  {
    id: 'world-and-exploration', stage: 'foundations', status: 'completed', title: 'Seeded worlds, exploration and saved journeys',
    summary: 'Generate a world, explore through fog, inspect the map and give an army a paid route that survives saving.',
    delivered: ['Seeded maps include continents, islands, biomes, shallow shelves, deep ocean and remembered geography.', 'Seven chosen map types — continents, pangaea, fractal, islands, archipelago, earthlike and inland sea — generate at Civilization-scale dimensions with recommended realm counts per size.', 'Reachable-hex movement, explicit attacks, waypoints and saved interruptions use canonical commands; map search, lenses and the overview expose permitted information.'],
    remaining: [], gates: ['B', 'D'], evidence: [statusEvidence],
  },
  {
    id: 'authored-cultures', stage: 'foundations', status: 'completed', title: 'Twenty-four authored playable cultures',
    summary: 'Choose among twenty-four original cultures with their own names, visual families and lore. This checks off the major-culture roster, not the full content gate.',
    delivered: ['Twenty-four culture definitions, naming pools and reviewed eighteen-role visual kits are integrated with the roster.', 'Public lore and compendium entries distinguish authored worldbuilding from runtime mechanics.'],
    remaining: [], gates: ['J'], evidence: [statusEvidence, { label: 'Faction bible', path: 'docs/lore/FACTION_BIBLE.md', note: 'Original societies and the distinction between lore and playable rules.' }],
  },
  {
    id: 'hearth-economy', stage: 'foundations', status: 'completed', title: 'Found, build and develop a hearth',
    summary: 'Found settlements, work surrounding land, pay for cultivation and extraction, and develop companies, hearths and faction traditions.',
    delivered: ['Population, connected claims and settlement count grow through scaling costs and upkeep.', 'Eight resource economies have generated deposits, paid extraction, stocks and material costs; twenty-five development nodes have actual saved effects.'],
    remaining: [], gates: ['B', 'I', 'J'], evidence: [statusEvidence, { label: 'Growth and development evidence', path: 'docs/performance/0039-growth-resources-and-battles.md', note: 'Slice-27 implementation, bounded player queries, compatibility checks and measured limits.' }],
  },
  {
    id: 'armies-and-fleets', stage: 'foundations', status: 'completed', title: 'General-led armies, sea transport and playable battles',
    summary: 'Recruit real formations, earn officer skills, transport troops by sea and resolve field, siege and naval battles with persistent consequences.',
    delivered: ['General capacity and earned skills preserve troops after leader loss; fleets obey coastal and ocean access rules.', 'Tactical intervention and autoresolve use the same battle engine. Individual soldiers, hulls, losses, morale and carried passengers retain identity through saving.'],
    remaining: [], gates: ['F'], evidence: [statusEvidence, { label: 'General and fleet construction', path: 'docs/architecture/0018-generals-and-sea-travel.md', note: 'The implemented military foundation and historical compatibility boundary.' }],
  },
  {
    id: 'campaign-records', stage: 'foundations', status: 'completed', title: 'Local saves and factual campaign records',
    summary: 'Resume a local campaign, transfer a portable archive and read a technical record and history tome after an AI victory.',
    delivered: ['Manual saves, rotating autosaves, versioned import/export and deterministic replay have retained scenario evidence.', 'Incremental local history preserves complete records; older imports disclose missing earlier history. Reviewed corruption fixes protect the last readable generation.'],
    remaining: [], gates: ['B', 'E'], evidence: [statusEvidence, reviewEvidence, { label: 'Retained large archive evidence', path: 'docs/development/hermes-archive/README.md', note: 'Actual Chromium storage, portable transfer and historical replay; broader capacity and durability remain open.' }],
  },
  {
    id: 'development-reference', stage: 'foundations', status: 'completed', title: 'Public development journal and reference library',
    summary: 'Browse substantial reviewed updates, the generated Git change ledger, lore and a runtime-aware compendium beside the game.',
    delivered: ['Separate static pages provide searchable dispatches with source evidence, limitations and image provenance.', 'The same site exposes the source scope ledger, contributor workflow and current implementation status.'],
    remaining: [], gates: ['N'], evidence: [{ label: 'Journal authoring contract', path: 'docs/updates/CONTRIBUTING.md', note: 'Version-controlled content, immutable evidence and independent review requirements.' }, { label: 'Public site routes', path: 'apps/web/src/updates/site.ts', note: 'Existing journal, home, lore and compendium static entries at this source snapshot.' }],
  },
  {
    id: 'campaign-safety-review', stage: 'current-work', status: 'in-progress', title: 'Close the remaining campaign-safety review',
    summary: 'The original findings have reviewed corrections, the Epic archive runtime no longer fails the suite, and every retained scenario now runs against the rules that ship. M0 is still in progress.',
    delivered: ['Rule 17 repairs capped training morale, trained-battle saves and defending frontage without rewriting historical rule-16 campaigns.', 'Pending-assault validation and the original storage durability findings have independently reviewed corrections.', 'Queued second-harbor funding and shared founder geography now have ordinary-command regressions and independent review.', 'Movement, observation, save ordering, technical formatting and lazy naval preparation preserve their captured outputs.', 'Exact engine work removed the Epic archive runtime failure; the whole local suite of unit, campaign and repository tests passes, and continuous integration verifies the build while those suites and the browser journeys run locally.', 'Every retained campaign-safety scenario \u2014 training morale, whole-army frontage, movement and quote parity, pending-assault validation, both storage durability defects, fresh current-version origins and the two naval AI findings \u2014 re-runs against the rules that ship, 66 checks across ten files. The pending-assault regression built its garrison, siege and turn at rules 17 only; it now proves the same scenario under today\u2019s food-store sieges as well.'],
    remaining: ['Keep each retained scenario running against the rules that ship, rather than the rules it was first closed under; a regression pinned to a historical version proves only history.', 'Retain exact source-linked results and historical failures; scoped review and deployment do not complete M0.'],
    gates: ['A', 'C', 'E', 'F'], evidence: [fleetEvidence, campaignEvidence, reviewEvidence, statusEvidence],
  },
  {
    id: 'victory-and-pacing', stage: 'current-work', status: 'in-progress', title: 'Give long campaigns several ways to end',
    summary: 'Prosperity and Unification are playable. The measured rules31 Epic headline is inside its target band; Standard and Long remain above their approximate targets.',
    delivered: ['One Prosperity victory path has human controls, AI pursuit, long-campaign fixtures and saved technical/history records.', 'A public, contestable Unification bid wins by holding two thirds of the world’s hearths and its host capital through the pace’s response window; losing either ends the bid, and rivals see it on the public ledger.', 'Political support counts toward that bid: a client’s hearths stand behind its patron, so unification can be negotiated as well as conquered.', 'The rules31 Standard-map, twelve-realm headline at seed 20260905 ends on turn 234 at Standard, 342 at Long and 379 at Epic. All seven headline/proxy measurements finish with zero refused orders and unchanged pace prices.'],
    remaining: ['Bring Standard and Long closer to their approximate 200- and 300-turn targets and broaden representative seed coverage; one Epic result inside 350–400 is not general pacing acceptance.', 'Let a bid be lost to politics as well as to arms: today only held hearths and the host capital interrupt visible progress.', 'After the complete magic loop, implement distinct arcane mastery and meet at least three tested victory paths. All intended paths need real human controls, AI pursuit and specific counterplay.', 'Prove engaging representative long campaigns and disclosed difficulty behavior without treating funding waits as depth.'],
    gates: ['B', 'C'], evidence: [fleetEvidence, statusEvidence, gateEvidence],
  },
  {
    id: 'diplomacy-and-conquest', stage: 'current-work', status: 'in-progress', title: 'Deepen diplomacy and settlement outcomes',
    summary: 'Wars, grievances, coin-plus-truce peace, persistent conquest consequences and client obligations exist. The wider negotiation game — trade, access, alliances and joint wars — remains unfinished.',
    delivered: ['AI can consider peace offers; coin transfers on acceptance and binding truces survive saves.', 'Settlement occupation, sacking, razing and reconstruction have distinct saved consequences.', 'A realm may take another as its client: a subsidy paid on acceptance, tribute each turn for an agreed term, no war between patron and client, and the client’s hearths standing behind its patron’s unification bid. Every term is disclosed before consent, and the AI proposes, accepts and refuses with stated reasons.', 'A client may be released by its patron or renounce the oath itself — lawfully once the term ends, or as a breach that ends the peace between them and is remembered as a grievance.'],
    remaining: ['Add client capture outcomes and permitted settlement transfers between patron and client; extend eligible liberation with explainable AI acceptance and saved consequences.', 'Then implement trade/access/alliance relationships, guarantees, joint wars, map sharing and wider negotiated terms alongside supply and trade.', 'Verify conquest choices, AI behavior and diplomatic commands through save/replay and the eventual authoritative multiplayer boundary.'],
    gates: ['G', 'H', 'B'], evidence: [statusEvidence, gateEvidence],
  },
  {
    id: 'research-and-magic', stage: 'current-work', status: 'in-progress', title: 'Build complete research and magical progression',
    summary: 'Practical research, institutions, doctrines and a paid Waykeeper battle-magic loop exist. Personal aptitude is distinct from national research.',
    delivered: ['Waykeepers use culture-specific Flame/Rune aptitudes, Arcane Theory discoveries and paid battle workings through shared player/AI commands.', 'Arcane seams are hidden under Ashfall glass and derived from the world itself. Any company may pay to survey the ground it stands on; a survey reveals seams within two hexes to that realm alone, and an empty survey says so and still costs.', 'A surveyed seam inside a realm\u2019s borders draws ashglass each turn and is taken with the hearth that holds it. Arcane Theory now needs such a seam, so magic begins with geography a realm must find, take and keep.', 'Unbinding answers a working with a working: it strips a ward from an enemy formation and costs the Waykeeper holding it the coming round. It is paid in strain, used once a battle, refused when there is nothing to undo, and its interruption survives save and replay.', 'Cultures train their own tradition. Only the second degree of the Rune path can unbind, two cultures reach it, two others reach the second degree of Flame, and a discovery inside a realm\u2019s own tradition costs three quarters of its price.'],
    remaining: ['Let a cast be answered as it happens rather than only on your own round, and let a caster\u2019s personal paths grow within a campaign.', 'Then add rituals, summons, artifice/relics, multiple sacred and occult implementations, magical geography and cross-system unlocks; major effects need meaningful counterplay.', 'Meet every accepted progression target with implemented choices and AI planning. Prove a mundane-plus-magic unlock and save/replay through the full research, caster and counter-magic loop.'],
    gates: ['F2', 'J'], evidence: [statusEvidence, scopeEvidence, gateEvidence],
  },
  {
    id: 'military-depth', stage: 'current-work', status: 'in-progress', title: 'Finish tactical choice and sustained military operations',
    summary: 'Armies, battles, officers and naval expeditions now include finite shared fleet stores and bounded AI staging. Coordinated large wars remain incomplete.',
    delivered: ['Field, siege and naval combat expose actual participants and reserves, with manual abilities, replay and exact-rules autoresolve.', 'Standing army postings and settlement muster points continue ordinary travel orders and expose their blocked reasons.', 'Eight provision turns feed a fleet and its passengers beyond harbor reach; the AI can return, replenish, complete an immediate landing and fund a nearby owned staging harbor. A generated island campaign records six landings and two transported foundings, with one remaining fleet/passenger attrition turn each.'],
    remaining: ['Add editable deployment, coordinated attacking armies and reinforcements, and broader faction-specific abilities.', 'Extend standing orders into coordinated theaters, escorts and reinforcement, and prove sustained naval operations through interrupted supply.', 'Verify destroyed ports, treaty access, blockades, leader loss, retreat and cargo consequences through human controls, observation-limited AI, saves and historical replay. Two nearby return candidates do not prove every obstructed or lost-port route.'],
    gates: ['C', 'F', 'I'], evidence: [fleetEvidence, statusEvidence, gateEvidence],
  },
  {
    id: 'empire-management', stage: 'current-work', status: 'in-progress', title: 'Make large empires practical to govern',
    summary: 'Searchable registries, map lenses, paged details, budgeted hearth charters and standing army orders are available. Wider coordination and mature-realm acceptance remain open.',
    delivered: ['Map-first management and paged source queries let players inspect entities without duplicating the entire simulation into React.', 'Standing hearth charters fill an empty queue within a stated coin ceiling and treasury reserve; direct player work takes precedence and stalled policies explain why.', 'Army postings and settlement muster points retain ordinary routes, arrival behavior and blocked reasons. Working policies leave the next-action list; stalled ones remain actionable.', 'Narrow capture controls have scoped 390px and 130% text-scale review evidence; fleet and passenger supply panels have separate 390px review.'],
    remaining: ['Extend existing charters and postings with broader governor decisions, army groups, bounded theaters and coordinated orders, keeping inspectable blockers and clear overrides.', 'Complete onboarding, multi-select, accessible keyboard/tooltip workflows, durable settings and critical canvas alternatives for all major systems.', 'Verify real delegation and override journeys in a saved mature realm with 100+ armies and many settlements; profile query transfers and virtualize large registries where needed.'],
    gates: ['I'], evidence: [statusEvidence, gateEvidence],
  },
  {
    id: 'characters-and-politics', stage: 'current-work', status: 'in-progress', title: 'Connect characters to the politics of a realm',
    summary: 'Named marshals, witnesses, engineers and Waykeepers have real assignments and consequences. The wider political cast is still missing.',
    delivered: ['Officer skills, paid survey/refit/sabotage missions, wounds, deaths and saved testimony are playable.'],
    remaining: ['Build on client relationships and delegation to add rulers, offices, legitimacy, loyalty, faction-appropriate succession, cultural unrest and internal-interest consequences at strategic scope.', 'Complete diplomacy/espionage/counterintelligence, scholarly and governor roles with paid risks, AI use and saved character events.', 'Verify deaths, reassignment, capture, rebellion and secession without invalid ownership or hidden-information leaks; connect political consequences to later world crises.'],
    gates: ['B', 'C', 'J'], evidence: [statusEvidence, scopeEvidence],
  },
  {
    id: 'content-and-art', stage: 'current-work', status: 'in-progress', title: 'Meet the full authored content and art targets',
    summary: 'Twenty-four cultures, thirteen shared formation types, resource works and individual battle animations are implemented. Culture skins are not extra unit definitions.',
    delivered: ['Reviewed culture kits, civic/improvement art, seventy-two culture-specific hulls and thirteen animated battlefield roles have real consumers.', 'The published lore library carries a twenty-four entry city-state register beside the faction bible; those powers reuse approved culture art under their own banner colour rather than claiming unmade assets.'],
    remaining: ['Deepen all twenty-four major factions and fill the forty-eight-plus independent/template roster. Meet every quantitative target in GAME_1_0_SCOPE.md with implemented units, traits, resources, progression, relics, landmarks, events and notable characters or a demonstrably non-filler documented equivalent.', 'Build discoveries, ruins, lairs and faction interactions alongside their real consumers; complete required faction/action/directional animation, terrain variants and readable dense/narrow battle presentation.', 'Validate IDs, localization, prerequisites, release assets and provenance; retain counted manifests, original sources and inspected runtime evidence. Finish reference/onboarding and roster-wide balance without counting skins as units.'],
    gates: ['J', 'N'], evidence: [statusEvidence, scopeEvidence, { label: 'Art implementation and review', path: 'docs/art/ART_IMPLEMENTATION_STATUS.md', note: 'Real runtime bindings, reviewed assets and unfinished animation/presentation coverage.' }],
  },
  {
    id: 'giant-scale', stage: 'current-work', status: 'in-progress', title: 'Prove sustained performance at giant scale',
    summary: 'Huge and Legendary fixtures, compact observations and renderer measurements exist. A short or synthetic workload does not prove a thousand-turn mature empire.',
    delivered: ['Packed map transfers, bounded land/development queries and measured Huge camera workloads have retained evidence.'],
    remaining: ['Measure retained memory, full turn phases, AI, routing, transfer costs and archive behavior in sustained giant mature campaigns.', 'Finish hierarchical routing and bounded turn continuation; address army/character/naval observation costs and saturated renderer-cache behavior.', 'Resolve severe regressions and publish current isolated Huge/Legendary results, including dense individual-battle costs.'],
    gates: ['D', 'K'], evidence: [statusEvidence, { label: 'Performance record', path: 'docs/PERFORMANCE.md', note: 'Measured workloads and their limits; results must match the candidate release revision.' }, gateEvidence],
  },
  {
    id: 'durable-archives', stage: 'current-work', status: 'in-progress', title: 'Finish archive durability and capacity proof',
    summary: 'The original storage correctness findings are closed. Save publication still reads the history prefix and garbage-collection proof scans the store.',
    delivered: ['Digest-verified publication and reference discovery refuse unsafe writes while preserving the last readable generation.'],
    remaining: ['Profile large-store garbage collection, streaming exports and full archive memory, including documented availability costs.', 'Verify real quota exhaustion, interrupted/process-killed writes, sustained mobile memory and large-case UI controls.', 'Complete Gate E at the final integrated revision, retaining exact historical records and safe recovery.'],
    gates: ['E', 'K'], evidence: [reviewEvidence, { label: 'Storage report and limits', path: 'docs/development/review-fix-2/persistence-REPORT.md', note: 'Scoped correctness approval, O(prefix bytes) publication, retained samples and unverified durability/performance cases.' }, gateEvidence],
  },
  {
    id: 'supply-and-trade', stage: 'current-work', status: 'in-progress', title: 'Make supply and trade shape strategy',
    summary: 'Hearths, paid depots, roads and harbors carry supply. Fleets have finite stores and AI resupply; the wider material, trade and treaty economy remains unfinished.',
    delivered: ['Hearth supply follows passable land, roads extend its reach, paid depots support expeditions and hostile companies can cut or raze supply. Visible shortages cause bounded attrition and slower recovery.', 'Harbors carry their own supply over water. Fleets share eight turns of provisions with their passengers outside that reach, replenish at the supply phase and retain stores through reorganization, saves and replay.', 'The map supply overlay and selected-force explanations consume canonical information. The AI builds eligible depots, raids nearby enemy posts, plans naval returns and can pay for coastal staging harbors.'],
    remaining: ['Add material and composition-sensitive supply costs, wider fort/logistics options and disruption recovery without duplicating simulation rules in the UI or AI.', 'Complete paid trade routes, resource processing, taxation/economic policy and treaty access with player/AI/save integration.', 'Prove sustained invasions and economies through disrupted and restored land/sea connections, lost ports, escorts and reinforcement; profile supply invalidation on giant maps and preserve fog boundaries.'],
    gates: ['B', 'C', 'I'], evidence: [fleetEvidence, statusEvidence, scopeEvidence],
  },
  {
    id: 'world-epochs', stage: 'missing-systems', status: 'pending', title: 'Bring epochs, crises and a changing world into play',
    summary: 'Campaign epochs and world crises remain accepted scope without a complete playable system.',
    delivered: [], remaining: ['After logistics and political actors, build visible epoch progression and contextual crises with meaningful prevention, response and recovery.', 'Integrate migration/refugees, regional upheaval, rebellion, monster activity and controlled faction collapse/emergence with AI response and persistence.', 'Prove different eligible crises, saved mid-crisis continuation and factual history through short labelled regressions and representative long campaigns.'],
    gates: ['B', 'C', 'J'], evidence: [statusEvidence, scopeEvidence],
  },
  {
    id: 'independent-powers', stage: 'missing-systems', status: 'in-progress', title: 'Populate the world with independent powers',
    summary: 'Twenty-four city-states are authored and playable neighbours. The wider roster and its distinct contracts and relations are not built, and repeated major-faction seats do not satisfy them.',
    delivered: ['Twenty-four chartered city-states, each with its own name, banner colour, motto and published history, seat beside the realms; they keep one hearth, open no war and pursue no victory, but build, defend, hold territory and answer peace offers through the ordinary commands.', 'City-states borrow an existing culture\u2019s art and unit roster under their own colour, and repeated culture seats take their own epithet and colour, so a crowded map never shows two identical banners.'],
    remaining: ['Build on clients and trade to author at least forty-eight minor powers/templates or a demonstrably varied equivalent.', 'Implement clans, pirates, mercenaries, monster/cult enclaves, nomads and trade communities with distinct relations, contracts, recruitment/trade and client outcomes; city-states currently differ only in name, colour and their single hearth.', 'Verify nonviolent and hostile human/AI interactions, saved actor evolution and fog-safe observation; repeated major seats do not satisfy this roster.'],
    gates: ['B', 'C', 'J'], evidence: [statusEvidence, scopeEvidence],
  },
  {
    id: 'online-campaigns', stage: 'missing-systems', status: 'pending', title: 'Build authoritative online campaigns',
    summary: 'The deployed game is single-player. No multiplayer server, rooms, seat authentication or reconnect flow exists.',
    delivered: [], remaining: ['Build on shared command/observation contracts: host/create/join, authenticated seats, 2–8 humans with AI seats, simultaneous planning and canonical resolution.', 'Validate commands on the authoritative server, filter the wire itself for hidden information and support disconnect/reconnect and durable save/resume.', 'Pass real two-client match, rejected ownership/phase commands, duplicate/out-of-order delivery and saved resume tests plus the server build against the same deterministic simulation.'],
    gates: ['A', 'G', 'M'], evidence: [statusEvidence, gateEvidence],
  },
  {
    id: 'integrated-campaign-proof', stage: 'release-proof', status: 'in-progress', title: 'Verify the complete campaign on one release candidate',
    summary: 'Scoped tests and reviewed checkpoints are retained. There is no overall integrated 1.0 acceptance report.',
    delivered: ['Headless campaigns, battle-boundary saves, history replay and targeted production journeys have checkpoint-specific evidence.', 'The rules31 fleet checkpoint passes 1,861 headless tests across 232 files, nine affected Chromium journeys and the Pages-subpath production build. These totals do not combine separate historical runs.', 'The dated 21 September evidence retains its original 25 gameplay/27 Pages results and former Epic timing failure; it is historical context, not the latest full-suite result.'],
    remaining: ['Run install, typecheck, lint, unit/property checks, content/art validation, production and server builds from a clean checkout.', 'Complete human and automated journeys through every intended victory path, AI long soaks and final save/combat/diplomacy/conquest acceptance.', 'Record failures and non-overlapping results against one exact candidate revision.'],
    gates: ['A', 'B', 'C', 'E', 'F', 'F2', 'G', 'H'], evidence: [fleetEvidence, campaignEvidence, reviewEvidence, gateEvidence],
  },
  {
    id: 'browser-certification', stage: 'release-proof', status: 'pending', title: 'Certify the supported browsers and accessibility',
    summary: 'Chromium checkpoint coverage exists. Current stable Firefox and Safari/WebKit release certification remains open.',
    delivered: [], remaining: ['Run the final WebGL game and public site on current Chromium, Firefox and Safari/WebKit where practical.', 'Verify graceful optional-feature fallback, keyboard paths, text scaling, reduced motion and non-color cues across major UI.'],
    gates: ['I', 'L'], evidence: [statusEvidence, gateEvidence],
  },
  {
    id: 'release-signoff', stage: 'release-proof', status: 'pending', title: 'Publish the evidence required for Theandril 1.0',
    summary: 'Development deployment remains separate from release acceptance. No overall 1.0 gate is signed off.',
    delivered: [], remaining: ['Clear every named gate, retain a license/asset inventory and useful error paths, and confirm production excludes debug mutation APIs.', 'Produce docs/RELEASE_1_0_REPORT.md with the exact commit, versions, performance table, browsers, content counts, screenshots and deterministic soak evidence.'],
    gates: ['A', 'B', 'C', 'D', 'E', 'F', 'F2', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'], evidence: [gateEvidence],
  },
];

export const roadmapGates: ReleaseGate[] = [
  { id: 'A', title: 'Clean build', status: 'in-progress', remaining: 'Pass the complete clean-checkout checks at the final integrated revision, including the online server.' },
  { id: 'B', title: 'Complete campaign', status: 'in-progress', remaining: 'Complete epochs, several human-playable victory paths and strategically engaging long campaigns.' },
  { id: 'C', title: 'AI competency', status: 'in-progress', remaining: 'Retain reviewed AI corrections, complete missing strategic systems and prove representative long soaks and disrupted logistics.' },
  { id: 'D', title: 'Giant scale', status: 'in-progress', remaining: 'Verify Huge 100+ turns and Legendary stress with deterministic hashes and bounded retained memory.' },
  { id: 'E', title: 'Save integrity', status: 'in-progress', remaining: 'Finish integrated replay/recovery coverage and the remaining real-browser durability proof.' },
  { id: 'F', title: 'Combat', status: 'in-progress', remaining: 'Complete combat breadth and integrated player/AI land, siege and naval acceptance.' },
  { id: 'F2', title: 'Research and magic depth', status: 'in-progress', remaining: 'Complete rituals, items, paths, sacred/occult play, cross-system unlocks and counterplay.' },
  { id: 'G', title: 'Diplomacy', status: 'in-progress', remaining: 'Finish rule-bearing treaties, client relationships, broader negotiations and server validation.' },
  { id: 'H', title: 'Settlement conquest', status: 'in-progress', remaining: 'Finish supported liberation/client outcomes and prove distinct saved consequences with AI understanding.' },
  { id: 'I', title: 'UX at scale', status: 'in-progress', remaining: 'Complete delegation and verify an accessible mature realm with 100+ armies.' },
  { id: 'J', title: 'Content', status: 'in-progress', remaining: 'Meet all accepted gameplay/content targets and validate references, localization and release assets.' },
  { id: 'K', title: 'Performance', status: 'in-progress', remaining: 'Publish current isolated turn, AI, route, transfer, map and archive results with no severe open regression.' },
  { id: 'L', title: 'Browser support', status: 'pending', remaining: 'Certify current Chromium, Firefox and Safari/WebKit where practical against the release candidate.' },
  { id: 'M', title: 'Multiplayer', status: 'pending', remaining: 'Build and verify real authoritative online campaigns with two-client coverage.' },
  { id: 'N', title: 'Release hygiene', status: 'in-progress', remaining: 'Finish the release-wide placeholder, license, version, error-path and production-debug audit.' },
];
