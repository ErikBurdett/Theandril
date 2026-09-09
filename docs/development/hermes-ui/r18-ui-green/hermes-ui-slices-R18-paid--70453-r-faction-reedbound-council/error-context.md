# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hermes-ui-slices.spec.ts >> R18 paid Waykeeper resolves shared art for faction.reedbound_council
- Location: tests/gameplay/hermes-ui-slices.spec.ts:17:3

# Error details

```
Error: Invalid save: faction color differs from content
```

# Test source

```ts
  296 | 
  297 | /** Serialize the validated projection once, preserving every historical byte. */
  298 | function serializeEnvelope(version: RulesVersion, contentHash: string, payload: object): string {
  299 |   const [header, stateText, end] = envelopeParts(version, contentHash, payload);
  300 |   return header + stateText + end;
  301 | }
  302 | 
  303 | /** Same FNV-1a UTF-16 fold as checksum(), without joining/flattening a full envelope.
  304 |  * The payload checksum is still computed first and included in the outer hash. */
  305 | function hashEnvelope(version: RulesVersion, contentHash: string, payload: object): string {
  306 |   let hash = 2166136261;
  307 |   for (const part of envelopeParts(version, contentHash, payload)) {
  308 |     for (let index = 0; index < part.length; index++) hash = Math.imul(hash ^ part.charCodeAt(index), 16777619);
  309 |   }
  310 |   return (hash >>> 0).toString(16).padStart(8, '0');
  311 | }
  312 | 
  313 | /** Exact old envelope projection, never a silently rewritten archive seal. */
  314 | export function serializeGameForVersion(state: GameState, version: RulesVersion): string {
  315 |   const latest = canonicalPayload(state);
  316 |   if (version === 16) return serializeEnvelope(SAVE_VERSION, CONTENT_HASH, latest);
  317 |   if (latest.resources.version || Object.keys(latest.resources.deposits).length || Object.values(latest.resources.stockpiles).some(stock => Object.values(stock).some(Boolean)) || Object.values(latest.development).some(records => Object.keys(records).length)) throw new Error('This campaign has resources or development unavailable in historical rules.');
  318 |   const { resources: _resources, development: _development, ...historical } = latest;
  319 |   const { visibilityVersion: _visibility, ...historicalLand } = historical.land;
  320 |   const canonical = stateV15Schema.parse({ ...historical, land: historicalLand });
  321 |   assertPreDevelopmentContent(canonical);
  322 |   if (version === 15) return serializeEnvelope(15, PRE_DEVELOPMENT_CONTENT_HASH, canonical);
  323 |   assertPreSpecialistContent(canonical);
  324 |   if (version === 14) return serializeEnvelope(14, PRE_SPECIALIST_CONTENT_HASH, canonical);
  325 |   if (canonical.arcaneResearch.some(item => item.discoveries.length) || canonical.characters.some(item => item.aptitudes || !v9Characters.has(item.definitionId))) throw new Error('This campaign has magic unavailable in the frozen pre-ability pack.');
  326 |   const { arcaneResearch: _arcane, ...beforeAbilities } = canonical;
  327 |   const modernPayload = { ...beforeAbilities, battle: beforeAbilities.battle ? schema13CampaignBattleSchema.parse(beforeAbilities.battle) : null, battleReports: beforeAbilities.battleReports.map(battle => schema13CampaignBattleSchema.parse(battle)) };
  328 |   if (version === 13) return serializeEnvelope(13, PRE_BATTLE_CONTENT_HASH, modernPayload);
  329 |   assertLegacyRoster(modernPayload);
  330 |   if (version === 12) return serializeEnvelope(12, PRE_EXPANDED_ROSTER_CONTENT_HASH, modernPayload);
  331 |   if (state.world.generatorVersion > 4 || state.world.layout !== 'legacy' || state.world.hydrology.some(value => value !== 0) || Object.keys(state.roads.edges).length || Object.keys(state.roads.projects).length || Object.values(state.roads.known).some(cells => Object.keys(cells).length)) throw new Error('This campaign has geography or roads unavailable in historical rules.');
  332 |   const { roads: _roads, ...priorPayload } = modernPayload;
  333 |   const { layout: _layout, hydrology: _hydrology, ...priorWorld } = priorPayload.world;
  334 |   const currentPayload = { ...priorPayload, world: worldSchema.parse(priorWorld) };
  335 |   if (version === 11) return serializeEnvelope(11, PRE_GEOGRAPHY_CONTENT_HASH, currentPayload);
  336 |   if (Object.values(currentPayload.land.settlements).some(land => land.borderGrowth !== 0)) throw new Error('This campaign has border progress unavailable in pre-city-growth rules.');
  337 |   const previousLand = { ...currentPayload.land, settlements: Object.fromEntries(Object.entries(currentPayload.land.settlements).map(([id, { borderGrowth: _growth, ...land }]) => [id, land])) };
  338 |   const beforeCityGrowth = { ...currentPayload, land: landStateV10Schema.parse(previousLand) };
  339 |   assertV9Content(beforeCityGrowth, 10);
  340 |   if (version === 10) return serializeEnvelope(10, PRE_CITY_RESEARCH_CONTENT_HASH, beforeCityGrowth);
  341 |   const { rosterVersion: _rosterVersion, ...beforeRoster } = beforeCityGrowth;
  342 |   assertV9Content(beforeRoster);
  343 |   if (version === 9) return serializeEnvelope(9, PRE_ROSTER_CONTENT_HASH, beforeRoster);
  344 |   if (state.world.generatorVersion > 3 || state.factions.some(faction => !FACTIONS.slice(0, 4).some(definition => definition.id === faction.definitionId)) || Object.keys(state.land.biomes).length || Object.values(state.land.settlements).some(land => land.work || Object.keys(land.improvements).length) || Object.values(state.land.cultivation).some(count => count > 0)) throw new Error('This campaign cannot be represented by pre-territory rules.');
  345 |   const { land: _land, ...modern } = beforeRoster;
  346 |   if (version === 8) return serializeEnvelope(8, PRE_TERRITORY_CONTENT_HASH, modern);
  347 |   if (modern.transports.length || modern.characters.some(character => character.learnedSkillIds.length) || modern.armies.some(army => army.formations.length > 12 || armyDomain(army) === 'naval') || modern.settlements.some(town => town.buildings.includes('building.harbor') || town.queue.some(item => item.itemId === 'building.harbor' || UNITS.find(unit => unit.id === item.itemId)?.movementDomain === 'naval')) || modern.progression.some(progress => progress.technologies.some(id => id === 'technology.coastal_navigation' || id === 'technology.ocean_navigation'))) throw new Error('This campaign cannot be represented by pre-naval rules.');
  348 |   if (modern.world.generatorVersion > 2) throw new Error('This world cannot be represented by pre-naval generator rules.');
  349 |   const { transports: _transports, ...withoutTransport } = modern;
  350 |   const { waterDepth: _depth, ...oldWorld } = modern.world;
  351 |   const schema7 = { ...withoutTransport, world: oldWorld, characters: modern.characters.map(({ learnedSkillIds: _learned, ...character }) => character), battle: state.battle ? battleReportForVersion(state.battle, version) : null, battleReports: state.battleReports.map(report => battleReportForVersion(report, version)) };
  352 |   if (version === 7) return serializeEnvelope(7, PRE_NAVAL_CONTENT_HASH, schema7);
  353 |   if (modern.characters.length) throw new Error('This campaign contains characters and cannot be represented by pre-character rules.');
  354 |   const { characters: _characters, ...beforeCharacters } = schema7;
  355 |   const current = { ...beforeCharacters, battle: state.battle ? battleReportForVersion(state.battle, version) : null, battleReports: state.battleReports.map(report => battleReportForVersion(report, version)) };
  356 |   if (version < 6) {
  357 |     const unavailable = Object.values(state.armies).some(army => army.formations.some(item => !LEGACY_UNIT_IDS.has(item.unitId)))
  358 |       || Object.values(state.settlements).some(town => town.queue.some(item => UNITS.some(unit => unit.id === item.itemId) && !LEGACY_UNIT_IDS.has(item.itemId)));
  359 |     if (unavailable) throw new Error('This content cannot be represented by the legacy content pack.');
  360 |     const armies = state.armies;
  361 |     const previous = {
  362 |       ...current,
  363 |       armies: current.armies.map(army => {
  364 |         const item = army.formations[0];
  365 |         if (army.formations.length !== 1 || !item || item.id !== `formation.${army.id.slice(5)}`) throw new Error('This army cannot be represented by legacy singleton rules.');
  366 |         return { id: army.id, factionId: army.factionId, name: army.name, unitId: item.unitId, cell: army.cell, movement: armies[army.id]!.movement, strength: item.strength, morale: item.morale, fatigue: item.fatigue };
  367 |       }),
  368 |       battle: state.battle ? battleReportForVersion(state.battle, version) : null,
  369 |       battleReports: state.battleReports.map(report => battleReportForVersion(report, version)),
  370 |     };
  371 |     if (version === 4) {
  372 |       if (state.world.generatorVersion !== 1 || Object.keys(state.routes).length) throw new Error('This campaign cannot be represented by the legacy schema-4 rules.');
  373 |       const { routes: _routes, ...rest } = previous;
  374 |       const { biome: _biome, generatorVersion: _generatorVersion, ...world } = previous.world;
  375 |       const payload = { ...rest, world };
  376 |       return serializeEnvelope(4, PRE_TRAVEL_CONTENT_HASH, payload);
  377 |     }
  378 |     return serializeEnvelope(5, PRE_ARMY_CONTENT_HASH, previous);
  379 |   }
  380 |   return serializeEnvelope(6, PRE_CHARACTER_CONTENT_HASH, current);
  381 | }
  382 | 
  383 | export function serializeGame(state: GameState): string {
  384 |   return serializeGameForVersion(state, SAVE_VERSION);
  385 | }
  386 | export function stateHashForVersion(state: GameState, version: RulesVersion): string {
  387 |   if (version === SAVE_VERSION) return hashEnvelope(SAVE_VERSION, CONTENT_HASH, canonicalPayload(state));
  388 |   return checksum(serializeGameForVersion(state, version));
  389 | }
  390 | 
  391 | export function stateHash(state: GameState): string {
  392 |   return stateHashForVersion(state, SAVE_VERSION);
  393 | }
  394 | 
  395 | function assert(condition: unknown, message: string): asserts condition {
> 396 |   if (!condition) throw new Error('Invalid save: ' + message);
      |                         ^ Error: Invalid save: faction color differs from content
  397 | }
  398 | 
  399 | function assertLegacyRoster(state: { rosterVersion: number; factions: readonly { definitionId: string }[] }): void {
  400 |   assert(state.rosterVersion <= 3 && state.factions.every(faction => (FACTION_ROSTERS[3] as readonly string[]).includes(faction.definitionId)), 'culture or roster unavailable in the frozen pre-expansion pack');
  401 | }
  402 | 
  403 | /** IDs, not the current pack's length: later additions cannot masquerade as old content. */
  404 | const v9Units = PRE_SPECIALIST_UNIT_IDS;
  405 | const v9Buildings = new Set(['building.granary', 'building.workshop', 'building.market', 'building.archive', 'building.harbor']);
  406 | const v9Technologies = new Set(['technology.cinder_masonry', 'technology.civic_accounts', 'technology.coastal_navigation', 'technology.ocean_navigation']);
  407 | const v9Institutions = new Set(['institution.charter_compact', 'institution.common_stewardship']);
  408 | const v9Doctrines = new Set(['doctrine.shield_cohesion', 'doctrine.march_columns']);
  409 | const v9Characters = new Set(['character.marshal', 'character.surveyor', 'character.engineer']);
  410 | const v9Missions = new Set(['mission.survey', 'mission.refit', 'mission.sabotage']);
  411 | const v9Skills = new Set(['skill.steadfast', 'skill.decisive', 'skill.fieldcraft', 'skill.siegecraft', 'skill.muster_rolls', 'skill.field_orders', 'skill.measured_advance', 'skill.unbroken_line', 'skill.horizon_studies', 'skill.column_workshops', 'skill.sapper_watch']);
  412 | const v9Improvements = new Set(['improvement.terraced_fields', 'improvement.managed_woodlot', 'improvement.quarry', 'improvement.reedworks', 'improvement.shore_fishery']);
  413 | function assertV9Content(state: Pick<z.infer<typeof stateV9Schema>, 'world' | 'factions' | 'armies' | 'settlements' | 'progression' | 'characters' | 'battle' | 'battleReports' | 'land'>, version: 9 | 10 = 9): void {
  414 |   const roster: readonly string[] = FACTION_ROSTERS[version === 10 ? 3 : state.world.generatorVersion < 4 ? 1 : 2];
  415 |   const battles = [...(state.battle ? [state.battle] : []), ...state.battleReports];
  416 |   const oldCharacter = (character: { definitionId: string; skillId: string | null; learnedSkillIds: string[] }) => v9Characters.has(character.definitionId)
  417 |     && (character.skillId === null || v9Skills.has(character.skillId)) && character.learnedSkillIds.every(id => v9Skills.has(id));
  418 |   assert(state.factions.every(faction => roster.includes(faction.definitionId))
  419 |     && state.armies.every(army => army.formations.every(item => v9Units.has(item.unitId)))
  420 |     && state.settlements.every(town => town.buildings.every(id => v9Buildings.has(id)) && town.queue.every(item => v9Buildings.has(item.itemId) || v9Units.has(item.itemId)))
  421 |     && state.progression.every(progress => progress.technologies.every(id => v9Technologies.has(id)) && (progress.institutionId === null || v9Institutions.has(progress.institutionId)) && (progress.doctrineId === null || v9Doctrines.has(progress.doctrineId)))
  422 |     && state.characters.every(character => oldCharacter(character) && (!character.mission || v9Missions.has(character.mission.definitionId)))
  423 |     && battles.every(battle => [...battle.combat.attacker, ...battle.combat.defender].every(item => v9Units.has(item.unitId)) && battle.characterSnapshots.every(oldCharacter) && battle.usedAbilities.every(item => item.abilityId === 'ability.rally')
  424 |       && (battle.attackerDoctrineId === null || v9Doctrines.has(battle.attackerDoctrineId)) && (battle.defenderDoctrineId === null || v9Doctrines.has(battle.defenderDoctrineId)))
  425 |     && Object.values(state.land.settlements).every(land => Object.values(land.improvements).every(id => v9Improvements.has(id)) && (!land.work || land.work.kind === 'terraform' || v9Improvements.has(land.work.improvementId)))
  426 |     && Object.values(state.land.known).every(cells => Object.values(cells).every(cell => cell.improvementId === null || v9Improvements.has(cell.improvementId))), `v${version} references content absent from its frozen pack or roster`);
  427 | }
  428 | 
  429 | function assertPreSpecialistContent(state: Pick<z.infer<typeof stateSchema>, 'armies' | 'settlements' | 'battle' | 'battleReports'>): void {
  430 |   const battles = [...(state.battle ? [state.battle] : []), ...state.battleReports];
  431 |   assert(state.armies.every(army => army.formations.every(item => PRE_SPECIALIST_UNIT_IDS.has(item.unitId)))
  432 |     && state.settlements.every(town => town.queue.every(item => v9Buildings.has(item.itemId) || PRE_SPECIALIST_UNIT_IDS.has(item.itemId)))
  433 |     && battles.every(battle => [...battle.combat.attacker, ...battle.combat.defender].every(item => PRE_SPECIALIST_UNIT_IDS.has(item.unitId))), 'formation content unavailable in the frozen pre-specialist pack');
  434 | }
  435 | 
  436 | function assertPreDevelopmentContent(state: z.infer<typeof stateV15Schema>): void {
  437 |   const skills = new Set(CHARACTER_SKILLS.filter(skill => !skill.introducedInRules).map(skill => skill.id));
  438 |   assert(state.characters.every(character => character.learnedSkillIds.every(id => skills.has(id))) && [...(state.battle ? [state.battle] : []), ...state.battleReports].every(battle => battle.rulesVersion <= 9 && battle.characterSnapshots.every(character => character.learnedSkillIds.every(id => skills.has(id)))), 'development content unavailable in the frozen pre-development pack');
  439 |   const works = new Set(IMPROVEMENTS.filter(item => (item.introducedInRules ?? 9) <= 15).map(item => item.id));
  440 |   assert(Object.values(state.land.settlements).every(land => Object.values(land.improvements).every(id => works.has(id)) && (!land.work || land.work.kind !== 'improve' || works.has(land.work.improvementId))) && Object.values(state.land.known).every(cells => Object.values(cells).every(cell => !cell.improvementId || works.has(cell.improvementId))), 'resource works unavailable in the frozen pre-development pack');
  441 | }
  442 | 
  443 | function parseSave(raw: unknown): z.infer<typeof saveSchema> {
  444 |   const version = z.object({ version: z.number().int() }).parse(raw).version;
  445 |   const migrateV15 = (prior: z.infer<typeof saveV15Schema>): z.infer<typeof saveSchema> => {
  446 |     assert(prior.contentHash === PRE_DEVELOPMENT_CONTENT_HASH, 'v15 content hash is not a recognized compatible pack');
  447 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v15 snapshot checksum does not match its contents');
  448 |     assertPreDevelopmentContent(prior.state);
  449 |     const state = stateSchema.parse({ ...prior.state, land: { ...prior.state.land, visibilityVersion: 0 }, resources: { version: 0, deposits: {}, stockpiles: Object.fromEntries(prior.state.factions.map(faction => [faction.id, {}])) }, development: createDevelopmentState() });
  450 |     return { ...prior, version: 16, contentHash: CONTENT_HASH, state, stateChecksum: checksum(JSON.stringify(state)) };
  451 |   };
  452 |   const migrateV14 = (prior: z.infer<typeof saveV14Schema>): z.infer<typeof saveSchema> => {
  453 |     assert(prior.contentHash === PRE_SPECIALIST_CONTENT_HASH, 'v14 content hash is not a recognized compatible pack');
  454 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v14 snapshot checksum does not match its contents');
  455 |     assertPreSpecialistContent(prior.state);
  456 |     return migrateV15({ ...prior, version: 15, contentHash: PRE_DEVELOPMENT_CONTENT_HASH });
  457 |   };
  458 |   const migrateV13 = (prior: z.infer<typeof saveV13Schema>): z.infer<typeof saveSchema> => {
  459 |     assert(prior.contentHash === PRE_BATTLE_CONTENT_HASH, 'v13 content hash is not a recognized compatible pack');
  460 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v13 snapshot checksum does not match its contents');
  461 |     assert([...prior.state.characters, ...[...(prior.state.battle ? [prior.state.battle] : []), ...prior.state.battleReports].flatMap(battle => battle.characterSnapshots)].every(character => v9Characters.has(character.definitionId)), 'v13 references a character absent from its frozen pack');
  462 |     const state = stateV15Schema.parse({ ...prior.state, arcaneResearch: prior.state.factions.map(faction => ({ factionId: faction.id, discoveries: [] })).sort((a, b) => a.factionId < b.factionId ? -1 : 1) });
  463 |     return migrateV14({ ...prior, version: 14, contentHash: PRE_SPECIALIST_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  464 |   };
  465 |   const migrateV12 = (prior: z.infer<typeof saveV12Schema>): z.infer<typeof saveSchema> => {
  466 |     assert(prior.contentHash === PRE_EXPANDED_ROSTER_CONTENT_HASH, 'v12 content hash is not a recognized compatible pack');
  467 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v12 snapshot checksum does not match its contents');
  468 |     assertLegacyRoster(prior.state);
  469 |     return migrateV13({ ...prior, version: 13, contentHash: PRE_BATTLE_CONTENT_HASH });
  470 |   };
  471 |   const migrateV11 = (prior: z.infer<typeof saveV11Schema>): z.infer<typeof saveSchema> => {
  472 |     assert(prior.contentHash === PRE_GEOGRAPHY_CONTENT_HASH, 'v11 content hash is not a recognized compatible pack');
  473 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v11 snapshot checksum does not match its contents');
  474 |     assertLegacyRoster(prior.state);
  475 |     const state = stateV12Schema.parse({ ...prior.state, world: { ...prior.state.world, layout: 'legacy', hydrology: Array<number>(prior.state.world.terrain.length).fill(0) }, roads: emptyRoadState(prior.state.factions.map(faction => faction.id)) });
  476 |     return migrateV12({ version: 12, gameVersion: '0.1.0', contentHash: PRE_EXPANDED_ROSTER_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  477 |   };
  478 |   const migrateV10 = (prior: z.infer<typeof saveV10Schema>): z.infer<typeof saveSchema> => {
  479 |     assert(prior.contentHash === PRE_CITY_RESEARCH_CONTENT_HASH, 'v10 content hash is not a recognized compatible pack');
  480 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v10 snapshot checksum does not match its contents');
  481 |     assertV9Content(prior.state, 10);
  482 |     const state = stateV11Schema.parse({ ...prior.state, land: { ...prior.state.land, settlements: Object.fromEntries(Object.entries(prior.state.land.settlements).map(([id, land]) => [id, { ...land, borderGrowth: 0 }])) } });
  483 |     return migrateV11({ version: 11, gameVersion: '0.1.0', contentHash: PRE_GEOGRAPHY_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  484 |   };
  485 |   const migrateV9 = (prior: z.infer<typeof saveV9Schema>): z.infer<typeof saveSchema> => {
  486 |     assert(prior.contentHash === PRE_ROSTER_CONTENT_HASH, 'v9 content hash is not a recognized compatible pack');
  487 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v9 snapshot checksum does not match its contents');
  488 |     assertV9Content(prior.state);
  489 |     const historicalRoster: readonly string[] = FACTION_ROSTERS[prior.state.world.generatorVersion < 4 ? 1 : 2];
  490 |     assert(prior.state.factions.every(faction => historicalRoster.includes(faction.definitionId)), 'v9 references a faction absent from its frozen roster');
  491 |     const state = stateV10Schema.parse({ ...prior.state, rosterVersion: prior.state.world.generatorVersion < 4 ? 1 : 2 });
  492 |     return migrateV10({ version: 10, gameVersion: '0.1.0', contentHash: PRE_CITY_RESEARCH_CONTENT_HASH, stateChecksum: checksum(JSON.stringify(state)), state });
  493 |   };
  494 |   const migrateV8 = (prior: z.infer<typeof saveV8Schema>): z.infer<typeof saveSchema> => {
  495 |     assert(prior.contentHash === PRE_TERRITORY_CONTENT_HASH, 'v8 content hash is not a recognized compatible pack');
  496 |     assert(prior.stateChecksum === checksum(JSON.stringify(prior.state)), 'v8 snapshot checksum does not match its contents');
```