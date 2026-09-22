import type { Dispatch } from './types';

/** Editorial sequence, not release dates. Historical evidence is pinned below. */
export const sourceRevision = '8b3b8c148b7e8ee3689001210033fee7a1b8a6ef';
export const repository = 'https://github.com/ErikBurdett/Theandril';
const entries: Dispatch[] = [
  {
    publication: 'published', sourceRevision: '1e41ec24965e46e8035c57b4f54632a690b8b712', sequence: 4,
    id: 'campaign-foundation-and-development-order', edition: '04', title: 'A funded expedition and a practical route to 1.0',
    subtitle: '21 September 2026 · Campaign foundations & the next playable systems',
    summary: 'An island realm now counts the harbor it has already paid for. Fleet planning, explored land and campaign records take less repeated work, while the remaining Epic timing failure stays visible.',
    topic: 'Engineering', tags: ['AI', 'Naval expeditions', 'Performance', 'Records', 'Roadmap'],
    status: 'Reviewed checkpoint', checkpoint: 'Campaign foundation · rules 17', image: 'technical-ledger',
    takeaways: ['A paid second harbor counts toward the two-outlet commitment limit, even while construction is queued.', 'Routes, observations, save bytes and recorded decisions retain their verified results through the reviewed optimizations.', 'M0 and all fifteen whole release gates remain open. Client contracts and unification are next systems to develop, not features in this checkpoint.'],
    sections: [
      { id: 'fund-the-expedition', title: 'Spend on the expedition already under way', paragraphs: [
        'An isolated realm could pay for an unnecessary third harbor while its second was still being built. The naval planner now counts paid queued construction toward its two-outlet commitment limit. Ordinary payment, blocked scout funding and a saved caravan journey through arrival and founding have explicit regression coverage.',
        'Waiting founders also shared a chart but repeatedly rebuilt its geography. Selection now precedes shared assessment. Later work delays shoreline, home-land and navigation preparation until a plan actually uses it. Complete captured naval plans retain the same orders, reasons, held armies and expenditure. These corrections close the two original naval review findings; they do not certify every strategic AI behavior.',
        'The narrow image shows an authored human-command regression: after paid Ocean navigation and a saved deep-ocean journey, the passenger can select a legal shore and disembark. The test verifies its formations and saves again. It is not an organically planned AI colony.',
      ], image: 'transport-landing' },
      { id: 'same-journey', title: 'Keep the journey, remove repeated work', paragraphs: [
        'Movement searches skip edges that cannot improve a route, reuse local neighbor storage and omit unused predecessor maps in range searches. Fleet planning asks for a destination preview without publishing an unused reachable overlay. The preliminary search and shared 4,096-node budget remain intact; map controls still receive their complete movement results.',
        'Explored-land observations avoid temporary object copies, while eligible unordered explored-cell lists use native unsigned sorting for saves. Captured complete observations preserve optional fields, fog memory and historical rules. Callers still cannot mutate the campaign through a returned observation. An authored eight-turn paid voyage retains all 22 accepted commands, save mirrors and final hash fa29672f.',
      ] },
      { id: 'keep-the-record', title: 'Keep every order and the same saved history', paragraphs: [
        'Replay compares ordinary event and battle JSON trees directly instead of encoding both trees for each comparison. Technical records use direct sorted formatting without an intermediate parse and copy. Complete comparisons, corruption rejection and exact technical-export bytes remain covered. Current campaign rules and save version stay at 17; content remains b79c78ed. There is no migration.',
        'The ledger image comes from the generated Short AI-watch campaign with seed 20260905 after saved continuation and victory. It displays actual accepted orders and the complete JSON download control. The screenshot illustrates the existing record; it is not a new UI feature or proof that Epic archives meet their timing budget.',
        'Measurements have different boundaries. A prior generated Epic before/after sample retained 22,914 commands, 249 battles and final hash 1e4534db while campaign time changed from 32.443 to 27.161 seconds. Later query and detached-plan gains were modest or mixed. These local samples do not establish a universal whole-campaign speedup.',
      ] },
      { id: 'checked-and-open', title: 'What passed, and what still fails', paragraphs: [
        'The final 21 September local checkpoint passed typecheck, lint, content and art validation, the production build, 25 affected Chromium gameplay scenarios and 27 production Pages scenarios. Those browser counts are scoped journeys, not complete gameplay or cross-browser certification. Independent reviews found no blocking issue in the bounded changes and their factual and visual account.',
        'The unchanged default headless run passed 1,857 of 1,858 tests across 220 of 221 files. Epic archive verification remained the sole failure at 64.779 seconds against its 60-second limit. Eight-worker and four-worker diagnostics also failed that limit; neither cap was adopted. No assertion, timeout, historical seal, activity requirement or rendering budget was relaxed. These are retained checkpoint executions, not a claim about subsequent hosted CI.',
        'Broader hash caching, alternate hash kernels and a different pathfinding heap were investigated and rejected. A validation wrapper changed rejection formatting and was rejected too. None ships in the runtime. Browser compendium captures now write to current test output so later runs preserve historical review images.',
      ] },
      { id: 'development-order', title: 'A concrete order for the remaining game', paragraphs: [
        'The existing roadmap now orders the accepted work into M0–M10, with dependencies, owners, playable outcomes and acceptance. No gameplay scope is added or cut. M0 remains in progress, and all fifteen whole release gates remain open. Deployment makes a development checkpoint available; it does not turn that checkpoint into Theandril 1.0.',
        'First resolve the actual Epic archive runtime under the existing gate. Then M1 connects client-state diplomacy to a distinct, contestable unification victory. A genuine pre-change rules-17 treaty and pending-offer archive, plus interface handoffs, prepare compatibility work. Client contracts, tribute and unification are not implemented here.',
        'M2 follows with a complete magical-site, qualified-caster and counterplay loop; M3 adds practical empire delegation and coordinated orders. Supply and trade, independent powers and politics, epochs, deeper progression, authored breadth, online campaigns and integrated release proof follow the same canonical plan. Contributors should start from the linked development workflow and preserve simulation ownership in packages/sim.',
      ] },
    ],
    evidence: [
      { label: 'Campaign foundation work packet', path: 'docs/updates/campaign-foundation-work-packet.md', note: 'Full three-pass account and imagery, retained at its pre-publication reviewed checkpoint.' },
      { label: 'Paid harbor and founder corrections', path: 'docs/development/2026-09-21-roadmap-start/naval/README.md', note: 'Original naval findings, ordinary-command regressions and bounded geography measurements.' },
      { label: 'First campaign and replay measurements', path: 'docs/development/2026-09-21-roadmap-start/performance/README.md', note: 'Generated Epic sample and comparison-only timings, with their separate limits.' },
      { label: 'Observation, save and preview continuation', path: 'docs/development/2026-09-21-campaign-continuation/README.md', note: 'Exact-output evidence, paid-voyage checks and rejected hash-cache investigation.' },
      { label: 'Current checkpoint checks and limits', path: 'docs/development/2026-09-21-epic-baseline/README.md', note: '1,857/1,858 headless, scoped browser passes, movement/naval measurements and unsuccessful worker-cap diagnostics.' },
      { label: 'Independent factual and visual review', path: 'docs/development/2026-09-21-epic-baseline/review/final.md', note: 'Exact source/image readback and bounded approval; Epic, M0 and all release gates remain open.' },
      { label: 'Current image provenance', path: 'docs/development/2026-09-21-epic-baseline/screens/provenance.json', note: 'Exact original Playwright PNGs, capture contexts, dimensions and hashes.' },
      { label: 'Development sequence and acceptance', path: 'docs/1.0-DEVELOPMENT.md', note: 'The existing canonical M0–M10 plan, not a second roadmap or a release promise.' },
      { label: 'Implementation status', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Delivered, partial and historical systems at this exact checkpoint.' },
    ],
  },
  {
    publication: 'published', sourceRevision, sequence: 3,
    id: 'r17-campaign-safety', edition: '01', title: 'A campaign worth keeping',
    subtitle: 'Rule 17 · Save integrity, contested battles & the work still open',
    summary: 'Training should not break a save. A crowded garrison should not make a town untouchable. This checkpoint repairs both, without rewriting the history of older campaigns.',
    topic: 'Engineering', tags: ['R17', 'Campaign safety', 'Combat', 'Saves', 'Review'],
    status: 'Reviewed checkpoint', checkpoint: 'Audit remediation · rule 17', image: 'campaign',
    takeaways: ['New saves use version 17; historical rule-16 commands keep their recorded behavior.', 'Defending armies that do not fit the battle remain on the campaign map as reserves.', 'Backend, storage and UI have scoped approvals. AI findings and full integration remain open.'],
    sections: [
      { id: 'why-this-work', title: 'The campaign must survive its own battles', paragraphs: [
        'The failure was not a hypothetical malformed save. A genuine turn-236 checkpoint loaded correctly, then a trained battle left strategic morale outside the save validator’s allowed range. A command could be accepted and still leave the player with a campaign that would not load.',
        'Rule 17 separates temporary battle training from the morale carried home by survivors. It removes only the bonus actually granted under the tactical cap. In the capped regression, strategic morale stays 85 → 85: subtracting a nominal bonus that was never fully applied would invent a loss. This is a save-integrity correction, not a new healing mechanic.',
      ] },
      { id: 'contested-ground', title: 'A full battlefield is not an invulnerable town', paragraphs: [
        'The twenty-formation battle budget has not grown. Instead, current rules select whole defending armies that fit that budget. A named field target receives priority; a settlement assault uses stable army-ID order. Armies that do not fit remain strategic reserves with their formations, officers and cargo intact.',
        'Those reserves do not take part invisibly. They receive no battle losses or experience, and can still prevent an attacker from occupying the tile. An assault offers capture only after the actual garrison is cleared. A surviving reserve keeps the siege contested until a later engagement. This is successive bounded fighting, not mid-round reinforcement.',
        'Movement quotes, executable routes and the public committed/reserve readout use the canonical selection. Pending battle saves must validate that exact contingent; a resealed save cannot omit inconvenient defenders. The later assault correction closes that omission-validation finding while preserving named field-target priority.',
      ], image: 'battle' },
      { id: 'save-compatibility', title: 'New rules, old history', paragraphs: [
        'Current campaign saves use version 17. Valid version-16 snapshots migrate their envelope without rewriting the recorded campaign payload. Explicit historical rule-16 commands retain their original behavior and exact historical hashes. The tactical battle kernel remains version 10; this change does not introduce a new content roster or world generator.',
        'Already-invalid historical saves are still rejected rather than silently repaired. Keep a prior valid export, and use a build that supports save version 17 when moving a current campaign. Localhost and the hosted game have separate browser storage: export a .theandril file in one, then import it in the other.',
      ] },
      { id: 'evidence', title: 'What the checkpoint actually proves', paragraphs: [
        'After the assault and storage corrections, the recorded parent verification passed 753 non-AI simulation, chronicle, persistence and worker tests across 67 files. It also replayed 125,150 historical rule-16 commands across eight campaigns with exact results and final bytes. One originally invalid historical final save remained rejected.',
        'These are checkpoint evidence, not tests rerun to write this journal. Independent backend review passed 152 tests; independent storage review passed 52 tests and 14 temporary probes. The UI’s separate evidence records 28 development cases and four built-production cases, followed by a byte-faithful review of its captured patch. These scopes overlap: they must not be added into a new grand total.',
        'Earlier stable-source generated campaigns are useful, different evidence. Tiny/4 seed 99 reached a Glass Tide prosperity victory on turn 217; Standard/24 seed 74 reached a Mire Courts prosperity victory on turn 225. Both retained exact saves, midpoint continuation and full replay at that earlier checkpoint. They are actual automated campaign trajectories, not authored combat fixtures, and were not rerun for this page or the latest fix review.',
      ] },
      { id: 'limits', title: 'Approved checkpoints are not a release', paragraphs: [
        'The backend, storage and UI checkpoints are independently approved. This is not a 1.0 signoff. AI still has open queued second-harbor funding and repeated founder geography/chart-scan findings. Further AI checks and fixes were authorization-blocked in the source record; this journal does not retry them or imply they passed.',
        'A corrected supplemental backend probe and a final all-artifact freshness sweep were also consent-blocked. Their unexecuted assertions remain unexecuted. Full integration after further source changes, cross-browser support, sustained-memory behavior and release-scale performance require their own evidence.',
        'The storage repairs favor keeping readable history over availability: an unverifiable unrelated branch can refuse an otherwise valid save when garbage collection is queued. Append and no-op publication read, hash and parse O(prefix bytes); queued garbage-collection proof scans all stored payloads and manifests. The 64-item cap bounds deletions only. Zero history writes does not mean zero work.',
      ] },
    ],
    evidence: [
      { label: 'Campaign-safety decision', path: 'docs/architecture/0037-campaign-safety.md', note: 'R01/R03 behavior, historical compatibility and authored regression boundaries.' },
      { label: 'Post-fix review reconciliation', path: 'docs/development/post-fix-review/summary.json', note: 'Scoped approvals, retained failed verdicts and unresolved AI/integration work.' },
      { label: '753-test post-fix verification', path: 'docs/development/review-fix-2/parent-post-fix-verification.json', note: 'Recorded non-AI execution; not a full-suite total.' },
      { label: 'Historical replay verification', path: 'docs/development/legacy-replays-post-fix-2/summary.json', note: '125,150 rule-16 commands; one invalid historical final save remains rejected.' },
      { label: 'Stable campaign checkpoint', path: 'docs/development/stable-checkpoint.json', note: 'Earlier generated campaigns. Use contemporaneous metrics.jsonl for historical progression; retrospective checkpoint arrays alias live data.' },
      { label: 'UI review and pixels', path: 'docs/development/ui-review-current/parent-visual-review.md', note: 'Narrow capture and actual renderer evidence, separate from backend tests.' },
    ],
  },
  {
    publication: 'published', sourceRevision, sequence: 1,
    id: 'twenty-four-cultures', edition: '03', title: 'Twenty-four ways to keep a hearth',
    subtitle: 'The playable baseline · People, places & material identity',
    summary: 'A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.',
    topic: 'World & culture', tags: ['Culture', 'Lore', 'Art', 'Ecology', 'Baseline'],
    status: 'Playable baseline', checkpoint: 'Roster 4 · slices 22–27', image: 'cultures',
    takeaways: ['Twenty-four authored cultures are selectable; repeated campaign seats are not new cultures.', 'Biome affinities and paid cultivation are implemented, while many supernatural hooks remain lore.', 'Gallery images are authored in-game review fixtures, not scenes from an organic campaign.'],
    sections: [
      { id: 'political-bargains', title: 'More than a color on the map', paragraphs: [
        'The faction bible treats each culture as a political bargain between households and institutions. People migrate, dissent and serve other banners. Material choices and ecological traditions should make those bargains legible without turning ancestry into a single personality.',
        'The Ashen Compact brings hearth-gold, soot brown, repaired shields and workshop obligations. The Reedbound Council belongs to the river margins. The Vesper Court includes genuine vampiric patrons alongside living valley households; it is not simply a costume theme. These identities share a fractured world without settling the disputed causes of the Ashfall or the nature of the Witness Roads.',
        'Twenty-four selectable definitions now have stable IDs, name pools, worked-biome benefits and drawbacks, cultivation targets and paid AI recruitment preferences. A campaign uses distinct definitions before repeated seats. Larger seat counts can repeat a culture; they do not create new authored societies.',
      ] },
      { id: 'land-and-livelihood', title: 'Identity becomes a decision about land', paragraphs: [
        'A faction’s preferred ground changes explicit yields on worked land. For example, the Vesper Court gains knowledge from temperate forest and coin from taiga, while desert and ash scrub carry documented penalties. Paid cultivation can establish eligible preferred biomes on claimed land; it does not rewrite physical relief, water depth or movement rules.',
        'The slice-27 baseline also supports eight generated resource economies, paid extraction works, household assignment and branching development for companies, hearths and factions. Older worlds retain their original geography instead of gaining retroactively placed deposits. The baseline is substantive, but it is not the full economy or content target in the 1.0 scope.',
      ] },
      { id: 'material-record', title: 'An art kit is a promise with evidence', paragraphs: [
        'The current art record qualifies distinct settlement, heraldic, land-role and naval assets for all twenty-four cultures. Campaign-map hulls use static southeast poses; battles use shared animated role sheets. A separate source, review and runtime binding matter more than a renamed file or a tint.',
        'The image here is a retained, authored in-game city gallery from the culture review. Its deliberate arrangement lets a reviewer compare silhouettes and materials. It is illustrative/regression evidence, not an organic campaign cityscape, and it does not demonstrate every culture in every biome.',
      ], image: 'cultures' },
      { id: 'world-limits', title: 'Where the fiction stops and the rules begin', paragraphs: [
        'These are not twenty-four separate rules engines. Common troops, paid recruitment, upkeep, transport and combat rules are shared. The Vesper Court’s blood dependence is lore: feeding, life-steal, resurrection and night bonuses are not implemented systems. A proposed named character in the bible is not a unique runtime entity.',
        'Further faction asymmetry, exclusive rosters, full supernatural progression and the remaining 1.0 content targets require authored data, canonical rules, AI understanding, persistence and tests. The public journal will distinguish those additions from a new painting or a writing hook rather than counting them early.',
      ] },
    ],
    evidence: [
      { label: 'Faction bible', path: 'docs/lore/FACTION_BIBLE.md', note: 'Canonical identities, implementation boundaries and proposed character seeds.' },
      { label: 'Executable faction definitions', path: 'packages/content/src/factions.ts', note: 'Stable registered definitions, not a future roster wishlist.' },
      { label: 'Faction asset catalog', path: 'docs/art/FACTION_ASSET_CATALOG.md', note: 'Approved culture kit coverage and source provenance.' },
      { label: 'Art implementation status', path: 'docs/art/ART_IMPLEMENTATION_STATUS.md', note: 'Published assets, animation scope and visual/performance limitations.' },
      { label: 'Playable baseline and remaining work', path: 'docs/IMPLEMENTATION_STATUS.md', note: 'Slice-27 systems and later campaign-safety corrections.' },
    ],
  },
  {
    publication: 'published', sourceRevision, sequence: 2,
    id: 'keeping-the-record', edition: '02', title: 'Keeping the whole record',
    subtitle: 'R02 · A bounded archive, not an unlimited promise',
    summary: 'A long campaign is more than its final snapshot. The archive work preserves the orders, battles and provenance needed to tell its history—and replay it.',
    topic: 'Archives', tags: ['R02', 'Storage', 'Replay', 'Saves', 'Performance'],
    status: 'Bounded verification', checkpoint: 'Archive capacity · durability follow-up', image: 'archipelago',
    takeaways: ['The retained Long campaign contains 114,244 orders and 1,496 recorded battles.', 'Capacity execution and later durability review are different checkpoints.', 'Complete-or-error bounds protect history; they do not certify unlimited archives or mobile memory.'],
    sections: [
      { id: 'more-than-a-snapshot', title: 'The last turn is not the whole campaign', paragraphs: [
        'The retained Standard/24 Long campaign, seed 748291, reached victory on turn 446. Its archive contains 114,244 orders and 1,496 recorded battles under the original rule-16 victory seal 0f0b85f5. These are records from the captured campaign, not invented filler or newly replayed battles.',
        'At the capacity checkpoint, actual Chromium IndexedDB save/load, a downloaded portable export, re-import and full historical replay had retained execution evidence. Later checks compared the complete retained archive and original hashes. The large full replay was not rerun during the latest fix pass or independent re-review; that review did not rerun Chromium either.',
      ] },
      { id: 'bounded-storage', title: 'Keep everything—or refuse clearly', paragraphs: [
        'Immutable history chunks and atomic rotation let manifest version 2 reuse an existing prefix. Larger portable envelopes use bounded TAC2 gzip. Snapshot, record, file and logical-envelope limits are explicit; the system must refuse an oversized archive instead of quietly truncating its early history.',
        'The subsequent durability fixes verify the origin and every prefix dependency inside publication. Garbage collection derives references from digest-verified payload links and manifests, including orphan-successor leases, rather than trusting a resealed count. A failed transaction preserves the previous readable generation and retry cursor.',
      ] },
      { id: 'safety-cost', title: 'Safety has a cost you should be able to see', paragraphs: [
        'Append and no-op saves still read, hash and parse O(prefix bytes) inside the publication transaction. When garbage is queued, proof scans all stored payloads and manifests. The 64-item cap limits deletion, not the proof scan. Writing no new history payloads is not constant-time work.',
        'An unverifiable unrelated branch can atomically refuse an otherwise valid save when garbage collection is queued. That deliberately conservative choice preserves history at an availability cost. Overcounts without queued garbage are not proactively scrubbed, and large-store garbage-collection proof needs separate profiling.',
        'The retained Chromium cold/no-op/append samples are single diagnostics, not a performance certificate. Real quota exhaustion, process-kill durability, cross-browser behavior, sustained memory and large-case player controls remain unverified. Checksums detect integrity problems; they are not authentication.',
      ] },
      { id: 'review-boundary', title: 'Read the review, not just the green number', paragraphs: [
        'Independent re-review passed 52 storage-related tests and 14 additional probes. Those temporary probes are retained evidence, not yet permanent regression tests, and the parent recounted rather than reran them. The original failed verdict remains failed historical evidence beside the later scoped approval.',
        'The large append example added one real refused post-victory order. It did not manufacture extra gameplay to make the history larger. The useful claim is that complete historical values survive the tested paths within explicit bounds—not that all long campaigns, browsers or devices are now certified.',
      ] },
    ],
    evidence: [
      { label: 'Archive capacity report', path: 'docs/development/hermes-archive/README.md', note: 'Original retained campaign, actual browser roundtrip and historical replay execution.' },
      { label: 'Storage format and recovery decision', path: 'docs/development/hermes-archive/ADR-R02.md', note: 'Exact bounds, formats, migration and recovery policy.' },
      { label: 'Durability correction report', path: 'docs/development/review-fix-2/persistence-REPORT.md', note: 'Full-prefix and reference-proof corrections with performance and availability costs.' },
      { label: 'Independent persistence verdict', path: 'docs/development/post-fix-review/persistence.verdict.json', note: 'Scoped approval and explicit limits; not a new large replay.' },
    ],
  },
];

export const dispatches = [...entries].sort((a, b) => b.sequence - a.sequence);
