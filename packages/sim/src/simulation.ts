import { createResources, harvestSettlementResources, resourceObservation, resourceCommandSchema, applyResourceCommand } from './resources';
import { createDevelopmentState, developmentCommandSchema, chooseDevelopment, getDevelopmentObservation, hearthDevelopmentEffects, factionDevelopmentEffects, advanceDevelopment, pruneDevelopment, formationDevelopmentUpkeep, hearthDevelopmentUpkeep, factionDevelopmentUpkeep } from './development';
import { settlementGrowthFood, settlementFoodConsumption, foundingCoinCost, settlementCivicUpkeep, getGrowthObservation } from './growth-economy';
import { z } from 'zod';
import { accelerateRoad, accelerateRoadSchema, advanceRoads, emptyRoadState, observeRoads, reconcileRoads, roadMovementCost } from './roads';
import { BUILDINGS, CITY_STATES, FACTIONS, FACTION_ROSTERS, ROSTER_VERSION, UNIFICATION_VICTORY, UNITS, variantFactionColor, variantFactionName, campaignPaceSchema, factionRoster, rosterVersionSchema } from '@theandril/content';
import { GENERATOR_VERSION, MAP_TYPES, SeededRandom, generateWorld, isPassable, neighbors, type WorldLayout } from '@theandril/mapgen';
import type { Army, CommandResult, DomainEvent, GameState, NewGameOptions, Observation, PhaseObserver, Settlement } from './types';
import { cellsWithin, indexes, rebuildIndexes, updateSight, upgradeLandVisibility } from './visibility';
import { cloneCampaignBattle, declareCampaignWar, resolveCampaignBattle, settleCampaignAbility, startCampaignBattle } from './warfare';
import { advanceDiplomacy, createDiplomacy, getDiplomacyObservation, peaceCommandSchemas, proposePeace, respondPeace } from './diplomacy';
import { advanceClients, clientCommandSchemas, proposeClient, releaseClient, renounceClient, respondClient } from './clients';
import { arcaneSiteCommandSchemas, emptyArcaneSurveys, observeArcaneSites, searchArcane, SITE_SEARCH_COIN } from './arcane-sites';
import { advanceSieges, assaultSettlement, besiegeSettlement, captureOutcomeSchema, liftSettlementSiege, observeSieges, reconcileSieges, resolveSettlementCapture } from './siege';
import { advanceProgression, chooseProgression, createFactionProgression, doctrineEffects, getProgressionObservation, progressionYields, reconcileProjects, startVictoryProject } from './progression';
import { advanceMovement, cancelMovement, moveTo, pauseMovement, queueMovement, reconcileMovement, resumeMovement } from './movement';

import { armyCanFound, effectiveArmyMovement, armySight, armyUpkeep, createArmyFormation, getArmyView, splitArmyFormations, transferArmyFormations } from './army-composition';
import { armyTerrainBlocker, carriedArmyBlocker, disembarkArmy, embarkArmy, moveFleetCargo, navalLaunchCell, observeProductionOptions, productionRequirementBlocker } from './naval';
import { advanceCharters, charterCommandSchemas, observeCharters, setCharter } from './charters';
import { advancePostings, musterNewArmy, observePostings, postingCommandSchemas, setMuster, setPosting } from './postings';
import { advanceSupply, observeSupply, suppliedCells, SUPPLY_FATIGUE_RECOVERY, SUPPLY_MORALE_RECOVERY } from './supply';
import { abandonDepot, advanceDepots, buildDepot, depotAbandonSchemas, depotCommandSchemas, DEPOT_COIN, depotUpkeep } from './depots';
import { LEGACY_UNIT_IDS, PRE_SPECIALIST_UNIT_IDS, rulesVersion, withRules, type RulesVersion } from './rules';
import { factionStarts } from './faction-starts';
import { MAX_EVENTS, MAX_FACTIONS } from './save';
import { isCityState } from './seats';
import { sortedExploredCells } from './canonical-cells';
import { applyLandCommand, emptyLandState, getLandObservation, handleLandCapture, initializeSettlementLand, landCommandSchemas, landCommandV15Schemas, observeLandCell, refreshLandKnowledge, resolveLandTurn, settlementLandYield, type LandDetails } from './territory';
import { advanceCharacters, armyHasCharacterMission, assignCharacter, cancelCharacterMission, characterUpkeep, getCharacterObservation, observeCommanderAbilities, promoteCharacter, recruitCharacter, reconcileCharacterMissions, removeArmyCharacters, startCharacterMission, unassignCharacter, useCommanderAbility } from './characters';
import { emptyArcaneResearch, observeArcaneResearch, researchArcane } from './magic';
import { battleAbilityCommand, getBattleScene, observeBattleAbilities } from './battle-abilities';
import type { BattleFactObserver, BattlePresentationEvent, BattlePresentationObserver } from './combat/presentation';

const identifier = z.string().min(1).max(100);
const name = z.string().trim().min(1).max(40).refine(value => [...value].every(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>'), 'Use plain text for names');
const version5CommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('found'), factionId: identifier, armyId: identifier, name }).strict(),
  z.object({ type: z.literal('move'), factionId: identifier, armyId: identifier, target: z.number().int().nonnegative().max(350_000) }).strict(),
  z.object({ type: z.literal('moveTo'), factionId: identifier, armyId: identifier, target: z.number().int().nonnegative().max(349_999) }).strict(),
  z.object({ type: z.literal('queueMovement'), factionId: identifier, armyId: identifier, target: z.number().int().nonnegative().max(349_999), append: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('cancelMovement'), factionId: identifier, armyId: identifier }).strict(),
  z.object({ type: z.literal('resumeMovement'), factionId: identifier, armyId: identifier }).strict(),
  z.object({ type: z.literal('queue'), factionId: identifier, settlementId: identifier, itemId: identifier }).strict(),
  z.object({ type: z.literal('endTurn'), factionId: identifier }).strict(),
  z.object({ type: z.literal('declareWar'), factionId: identifier, targetFactionId: identifier }).strict(),
  z.object({ type: z.literal('attack'), factionId: identifier, armyId: identifier, targetArmyId: identifier }).strict(),
  z.object({ type: z.literal('battleOrder'), factionId: identifier, order: z.enum(['advance', 'brace', 'flank', 'withdraw']) }).strict(),
  z.object({ type: z.literal('autoResolveBattle'), factionId: identifier }).strict(),
  z.object({ type: z.literal('besiege'), factionId: identifier, armyId: identifier, settlementId: identifier }).strict(),
  z.object({ type: z.literal('liftSiege'), factionId: identifier, settlementId: identifier }).strict(),
  z.object({ type: z.literal('assault'), factionId: identifier, settlementId: identifier }).strict(),
  z.object({ type: z.literal('resolveCapture'), factionId: identifier, settlementId: identifier, outcome: captureOutcomeSchema }).strict(),
  z.object({ type: z.literal('research'), factionId: identifier, technologyId: identifier }).strict(),
  z.object({ type: z.literal('adoptInstitution'), factionId: identifier, institutionId: identifier }).strict(),
  z.object({ type: z.literal('adoptDoctrine'), factionId: identifier, doctrineId: identifier }).strict(),
  z.object({ type: z.literal('startVictoryProject'), factionId: identifier, settlementId: identifier }).strict(),
  ...peaceCommandSchemas,
]);
// Freeze historical command options explicitly. Future commands do not enter old archives.
const version4Types = new Set(['found', 'move', 'queue', 'endTurn', 'declareWar', 'attack', 'battleOrder', 'autoResolveBattle', 'besiege', 'liftSiege', 'assault', 'resolveCapture', 'research', 'adoptInstitution', 'adoptDoctrine', 'startVictoryProject', 'proposePeace', 'respondPeace']);
const [firstLegacyCommand, ...otherLegacyCommands] = version5CommandSchema.options.filter(schema => version4Types.has(schema.shape.type.value));
if (!firstLegacyCommand) throw new Error('Missing legacy command definitions');
const legacyCommandSchema = z.discriminatedUnion('type', [firstLegacyCommand, ...otherLegacyCommands]);
const formationIds = z.array(identifier).min(1).max(12);
const armyName = z.string().trim().min(1).max(80).refine(value => [...value].every(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>'), 'Use plain text for names');
const version6CommandSchema = z.discriminatedUnion('type', [
  ...version5CommandSchema.options,
  z.object({ type: z.literal('mergeArmies'), factionId: identifier, sourceArmyId: identifier, targetArmyId: identifier }).strict(),
  z.object({ type: z.literal('transferFormations'), factionId: identifier, sourceArmyId: identifier, targetArmyId: identifier, formationIds }).strict(),
  z.object({ type: z.literal('splitArmy'), factionId: identifier, armyId: identifier, formationIds, name: armyName.optional() }).strict(),
]);
const version7CommandSchema = z.discriminatedUnion('type', [
  ...version6CommandSchema.options,
  z.object({ type: z.literal('recruitCharacter'), factionId: identifier, settlementId: identifier, definitionId: identifier }).strict(),
  z.object({ type: z.literal('assignCharacter'), factionId: identifier, characterId: identifier, armyId: identifier }).strict(),
  z.object({ type: z.literal('unassignCharacter'), factionId: identifier, characterId: identifier, settlementId: identifier }).strict(),
  z.object({ type: z.literal('promoteCharacter'), factionId: identifier, characterId: identifier, skillId: identifier }).strict(),
  z.object({ type: z.literal('startCharacterMission'), factionId: identifier, characterId: identifier, missionId: identifier, targetCell: z.number().int().min(0).max(349_999).optional(), settlementId: identifier.optional() }).strict(),
  z.object({ type: z.literal('cancelCharacterMission'), factionId: identifier, characterId: identifier }).strict(),
  z.object({ type: z.literal('useCommanderAbility'), factionId: identifier, characterId: identifier, abilityId: identifier }).strict(),
]);
const version8CommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('embarkArmy'), factionId: identifier, armyId: identifier, fleetId: identifier }).strict(),
  ...version7CommandSchema.options.filter(schema => schema.shape.type.value !== 'transferFormations' && schema.shape.type.value !== 'splitArmy'),
  z.object({ type: z.literal('transferFormations'), factionId: identifier, sourceArmyId: identifier, targetArmyId: identifier, formationIds: z.array(identifier).min(1).max(20) }).strict(),
  z.object({ type: z.literal('splitArmy'), factionId: identifier, armyId: identifier, formationIds: z.array(identifier).min(1).max(20), name: armyName.optional() }).strict(),
  z.object({ type: z.literal('disembarkArmy'), factionId: identifier, armyId: identifier, target: z.number().int().min(0).max(349_999) }).strict(),
]);
const version11CommandSchema = z.discriminatedUnion('type', [...version8CommandSchema.options, ...landCommandV15Schemas]);
const version13CommandSchema = z.discriminatedUnion('type', [...version11CommandSchema.options, accelerateRoadSchema]);
const version15CommandSchema = z.discriminatedUnion('type', [...version13CommandSchema.options,
  z.object({ type: z.literal('researchArcane'), factionId: identifier, discoveryId: identifier }).strict(),
  z.object({ type: z.literal('setBattleAbilityAuto'), factionId: identifier, battleId: identifier, sourceId: identifier, abilityId: identifier, automatic: z.boolean() }).strict(),
  z.object({ type: z.literal('useBattleAbility'), factionId: identifier, battleId: identifier, sourceId: identifier, abilityId: identifier, targetId: identifier.optional() }).strict(),
]);
const version21CommandSchema = z.discriminatedUnion('type', [resourceCommandSchema, developmentCommandSchema, ...landCommandSchemas, ...version15CommandSchema.options.filter(schema => !landCommandV15Schemas.some(land => land.shape.type.value === schema.shape.type.value))]);
/** Rules 22 adds the patronage commands and rules 23 the arcane survey; historical rules never accept them. */
const version22CommandSchema = z.discriminatedUnion('type', [...version21CommandSchema.options, ...clientCommandSchemas]);
const version23CommandSchema = z.discriminatedUnion('type', [...version22CommandSchema.options, ...arcaneSiteCommandSchemas]);
export { MAX_EVENTS };
/** Rules 25 adds the standing production charter and rules 26 the standing
 * posting and muster point; historical rules never accept them. */
const version25CommandSchema = z.discriminatedUnion('type', [...version23CommandSchema.options, ...charterCommandSchemas]);
const version26CommandSchema = z.discriminatedUnion('type', [...version25CommandSchema.options, ...postingCommandSchemas]);
/** Rules 28 adds the built depot and rules 29 the order to pull one down;
 * historical rules never accept either. */
const version28CommandSchema = z.discriminatedUnion('type', [...version26CommandSchema.options, ...depotCommandSchemas]);
export const commandSchema = z.discriminatedUnion('type', [...version28CommandSchema.options, ...depotAbandonSchemas]);
export const commandSchemaForVersion = (version: RulesVersion) => version === 4 ? legacyCommandSchema : version === 5 ? version5CommandSchema : version === 6 ? version6CommandSchema : version === 7 ? version7CommandSchema : version === 8 ? version8CommandSchema : version < 12 ? version11CommandSchema : version < 14 ? version13CommandSchema : version < 16 ? version15CommandSchema : version < 22 ? version21CommandSchema : version < 23 ? version22CommandSchema : version < 25 ? version23CommandSchema : version < 26 ? version25CommandSchema : version < 28 ? version26CommandSchema : version < 29 ? version28CommandSchema : commandSchema;

/** Explicit deterministic upgrade for pre-territory snapshots and historical execution. */
export function initializeLegacyLand(state: GameState): void {
  state.land = emptyLandState(state.factions.map(faction => faction.id), rulesVersion(state));
  for (const town of Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : 1)) initializeSettlementLand(state, town);
  for (const faction of state.factions) refreshLandKnowledge(state, faction.id, indexes(state).visible.get(faction.id) ?? new Map());
}

/** Historical singleton execution preserves old IDs, outcomes, messages and content access. */
export function applyCommandForVersion(state: GameState, input: unknown, version: RulesVersion): CommandResult {
  const parsed = commandSchemaForVersion(version).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Malformed command: ' + parsed.error.issues[0]?.message, events: [] };
  if (version < 15 && (Object.values(state.armies).some(army => army.formations.some(item => !PRE_SPECIALIST_UNIT_IDS.has(item.unitId))) || Object.values(state.settlements).some(town => town.queue.some(item => item.itemId.startsWith('unit.') && !PRE_SPECIALIST_UNIT_IDS.has(item.itemId))) || [...(state.battle ? [state.battle] : []), ...state.battleReports].some(battle => [...battle.combat.attacker, ...battle.combat.defender].some(item => !PRE_SPECIALIST_UNIT_IDS.has(item.unitId))))) throw new Error('Historical rules cannot execute formations absent from their frozen pack.');
  if (version < 14 && (Object.values(state.arcaneResearch).some(items => items.length) || Object.values(state.characters).some(item => item.aptitudes || item.definitionId === 'character.waykeeper') || (state.battle?.rulesVersion ?? 0) >= 9 || state.battleReports.some(item => item.rulesVersion >= 9))) throw new Error('Historical rules cannot execute arcane research or modern battle abilities.');
  if (version < 13 && (state.rosterVersion > 3 || state.factions.some(faction => !(FACTION_ROSTERS[3] as readonly string[]).includes(faction.definitionId)))) throw new Error('Historical rules cannot execute cultures absent from their frozen roster.');
  if (version < 18 && state.world.generatorVersion > 7) throw new Error('Historical rules cannot execute generator-8 geography.');
  if (version < 19 && (state.victory?.path === 'unification' || state.projects.some(project => project.projectId === UNIFICATION_VICTORY.id))) throw new Error('Historical rules cannot execute unification bids.');
  if (version < 12 && (state.world.generatorVersion > 4 || Object.keys(state.roads.edges).length || Object.keys(state.roads.projects).length)) throw new Error('Historical rules cannot execute modern geography or roads.');
  const historicalRoster: readonly string[] = FACTION_ROSTERS[version < 9 || state.world.generatorVersion < 4 ? 1 : 2];
  if (version < 10 && state.factions.some(faction => !historicalRoster.includes(faction.definitionId))) throw new Error('Historical rules cannot execute cultures absent from their frozen roster.');
  if (version < 7 && Object.keys(state.characters).length) throw new Error('Historical rules cannot execute a campaign containing characters.');
  if (version < 8 && (Object.keys(state.transports).length || Object.values(state.characters).some(character => character.learnedSkillIds.length) || Object.values(state.armies).some(army => army.formations.length > 12 || army.formations.some(formation => units.get(formation.unitId)?.movementDomain === 'naval')))) throw new Error('Historical rules cannot execute modern command trees or naval armies.');
  if (version < 6 && Object.values(state.armies).some(army => army.formations.length !== 1 || army.formations[0]?.id !== `formation.${army.id.slice(5)}` || !LEGACY_UNIT_IDS.has(army.formations[0]?.unitId ?? ''))) throw new Error('Historical rules require an unmodified singleton-army campaign.');
  return withRules(state, version, () => {
    const result = applyCommand(state, input);
    if (result.ok && version < 9) initializeLegacyLand(state);
    return result;
  });
}

const MAX_RESOURCE = 1_000_000_000;
const buildings = new Map(BUILDINGS.map(item => [item.id, item]));
const units = new Map(UNITS.map(item => [item.id, item]));

export function createGame(options: NewGameOptions): GameState {
  const checked = z.object({
    rulesVersion: z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(10), z.literal(11), z.literal(12), z.literal(13), z.literal(14), z.literal(15), z.literal(16), z.literal(17), z.literal(18), z.literal(19), z.literal(20), z.literal(21), z.literal(22), z.literal(23), z.literal(24), z.literal(25), z.literal(26), z.literal(27), z.literal(28), z.literal(29)]).default(29),
    seed: z.number().int().min(0).max(0xffff_ffff),
    size: z.enum(['tiny', 'small', 'standard', 'huge', 'legendary']),
    factionCount: z.number().int().min(1).max(MAX_FACTIONS).default(4),
    factionDefinitionId: z.string().refine(id => FACTIONS.some(faction => faction.id === id), 'Unknown faction culture').optional(),
    pace: campaignPaceSchema.default('standard'),
    generatorVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8)]).optional(),
    layout: z.enum(MAP_TYPES.map(type => type.id) as [WorldLayout, ...WorldLayout[]]).optional(),
    rosterVersion: rosterVersionSchema.default(ROSTER_VERSION),
    cityStateCount: z.number().int().min(0).max(CITY_STATES.length).default(0),
  }).strict().parse(options);
  // Historical rules default to the last generator they can represent.
  const generatorVersion = checked.generatorVersion ?? (checked.rulesVersion < 18 ? 7 : GENERATOR_VERSION);
  if (checked.rulesVersion < 18 && generatorVersion > 7) throw new Error('Generator 8 worlds require rules 18.');
  if (checked.rulesVersion < 21 && checked.factionCount > 48) throw new Error('Historical rules seat at most 48 realms.');
  if (checked.rulesVersion < 21 && checked.cityStateCount > 0) throw new Error('City-states require rules 21.');
  if (checked.factionCount + checked.cityStateCount > MAX_FACTIONS) throw new Error(`A campaign seats at most ${MAX_FACTIONS} realms and city-states.`);
  // Physical generation never implicitly changes the roster used by a saved origin.
  const catalog = factionRoster(checked.rosterVersion);
  if (checked.factionDefinitionId) {
    const chosen = catalog.findIndex(faction => faction.id === checked.factionDefinitionId);
    if (chosen < 0) throw new Error('That culture is unavailable to this historical roster.');
    catalog.unshift(...catalog.splice(chosen, 1));
  }
  // Rules 21: realms beyond the authored cultures reuse their art under their own
  // name and colour, so a crowded map never shows two identical banners.
  const namedSeats = checked.rulesVersion >= 21;
  const selected: { id: string; definitionId: string; name: string; color: number }[] = Array.from({ length: checked.factionCount }, (_, index) => {
    const base = catalog[index % catalog.length];
    if (!base) throw new Error('No faction definitions are available');
    const variant = Math.floor(index / catalog.length);
    if (variant === 0) return { ...base, definitionId: base.id, id: base.id, name: base.name, color: base.color };
    return { ...base, definitionId: base.id, id: `${base.id}.${index + 1}`,
      name: namedSeats ? variantFactionName(base.name, variant) : `${base.name} ${index + 1}`,
      color: namedSeats ? variantFactionColor(base.color, index + 1) : base.color };
  });
  // City-states are independent single-city powers. They borrow a culture's art
  // and roster; their seat carries their own name, colour and lore.
  const pool = [...CITY_STATES];
  const picker = new SeededRandom(checked.seed ^ 0x43495459);
  const cityStates = Array.from({ length: checked.cityStateCount }, () => pool.splice(picker.nextInt(pool.length), 1)[0]!)
    .sort((a, b) => a.id < b.id ? -1 : 1)
    .map(item => ({ definitionId: item.cultureId, id: item.id, name: item.name, color: item.color }));
  selected.push(...cityStates);
  const owner = selected[0];
  if (!owner) throw new Error('A campaign requires a player faction');
  const world = generateWorld(checked.seed, checked.size, selected.length, generatorVersion, checked.layout ? { layout: checked.layout } : {});
  world.starts = factionStarts(world, selected.map(faction => faction.definitionId));
  const state: GameState = {
    resources: createResources(world, selected.map(faction => faction.id), checked.rulesVersion >= 16 ? 1 : 0),
    development: createDevelopmentState(),
    arcaneResearch: emptyArcaneResearch(selected.map(faction => faction.id)), arcaneSurveys: emptyArcaneSurveys(selected.map(faction => faction.id)), charters: [], postings: [], musters: [], depots: [],
    roads: emptyRoadState(selected.map(faction => faction.id)),
    rosterVersion: checked.rosterVersion,
    land: emptyLandState(selected.map(faction => faction.id), checked.rulesVersion),
    turn: 1, nextId: 1, turnOwnerId: owner.id, world, pace: checked.pace,
    factions: selected.map(faction => ({ id: faction.id, definitionId: faction.definitionId, name: faction.name, color: faction.color, treasury: 60, knowledge: 0 })),
    armies: {}, transports: {}, characters: {}, routes: {}, settlements: {}, explored: {}, events: [], wars: [], battle: null, battleReports: [],
    sieges: {}, pendingCapture: null, ruins: {}, diplomacy: createDiplomacy(),
    progression: Object.fromEntries(selected.map(faction => [faction.id, createFactionProgression()])), projects: [], victory: null,
  };
  selected.forEach((faction, i) => {
    const cell = world.starts[i];
    if (cell === undefined) throw new Error('World is missing a faction start');
    state.explored[faction.id] = new Set();
    // A city-state opens its gates with a guard instead of a scout: it settles where it stands.
    for (const unitId of isCityState(faction.id) ? ['unit.colonist', 'unit.guard'] : ['unit.colonist', 'unit.scout']) {
      const definition = units.get(unitId);
      if (!definition) throw new Error('Missing starting unit');
      const id = `army.${state.nextId++}`;
      state.armies[id] = { id, factionId: faction.id, name: definition.name, cell, movement: definition.movement, formations: [createArmyFormation(id, unitId)] };
    }
    state.events.push({ turn: 1, factionId: faction.id, type: 'campaign_started', message: 'Your hearth caravan awaits a place to settle.', cell });
  });
  withRules(state, checked.rulesVersion, () => rebuildIndexes(state));
  return state;
}

export function settlementYields(state: GameState, settlement: Settlement): { food: number; industry: number; coin: number; knowledge: number } {
  const yields = {
    food: 3 + Math.floor((state.world.fertility[settlement.cell] ?? 0) / 20),
    industry: 6 + (state.world.terrain[settlement.cell] === 3 ? 1 : 0),
    coin: 4 + settlement.population,
    knowledge: 1,
  };
  for (const id of settlement.buildings) {
    const building = buildings.get(id);
    if (building) {
      yields.food += building.food; yields.industry += building.industry;
      yields.coin += building.coin; yields.knowledge += building.knowledge;
    }
  }
  const recovery = Math.max(10, 100 - settlement.devastation);
  const land = rulesVersion(state) >= 9 ? settlementLandYield(state, settlement) : { food: 0, industry: 0, coin: 0, knowledge: 0 };
  const progression = progressionYields(state, settlement.factionId);
  const civic = hearthDevelopmentEffects(state, settlement), tradition = factionDevelopmentEffects(state, settlement.factionId);
  for (const yieldId of ['food', 'industry', 'coin', 'knowledge'] as const) {
    yields[yieldId] += progression[yieldId] + land[yieldId] + civic[yieldId] + tradition[yieldId];
    yields[yieldId] = Math.floor(yields[yieldId] * recovery / 100);
    if (settlement.occupationTurns > 0) yields[yieldId] = Math.floor(yields[yieldId] / 2);
    if (state.sieges[settlement.id]) yields[yieldId] = yieldId === 'food' ? 0 : Math.floor(yields[yieldId] / 2);
  }
  return yields;
}

function addArmy(state: GameState, factionId: string, cell: number, unitId: string): Army {
  const definition = units.get(unitId);
  if (!definition) throw new Error('Unknown recruitment definition');
  const index = indexes(state);
  const id = `army.${state.nextId++}`;
  const army: Army = { id, factionId, cell, name: definition.name, movement: definition.movement + doctrineEffects(state.progression[factionId]?.doctrineId ?? null).movement, formations: [createArmyFormation(id, unitId)] };
  state.armies[id] = army;
  const occupants = index.armies.get(cell) ?? new Set<string>();
  occupants.add(id); index.armies.set(cell, occupants);
  updateSight(state, factionId, cell, definition.sight, 1);
  return army;
}

function resolveTurn(state: GameState, emitted: DomainEvent[], observe: PhaseObserver): void {
  observe('sieges', 'start');
  advanceSieges(state, emitted);
  observe('sieges', 'end');
  observe('settlements', 'start');
  advanceRoads(state, emitted);
  const version = rulesVersion(state);
  const balanceLimit = version >= 16 ? Number.MAX_SAFE_INTEGER : MAX_RESOURCE;
  const townsByFaction = new Map<string, number>();
  for (const town of Object.values(state.settlements)) townsByFaction.set(town.factionId, (townsByFaction.get(town.factionId) ?? 0) + 1);
  const civicUpkeep = new Map<string, number>();
  const factionById = new Map(state.factions.map(faction => [faction.id, faction]));
  // Canonical phases: settlement yields/production, growth, upkeep, movement refresh.
  // O(settlements + armies + built content), independent of global map dimensions.
  for (const settlement of Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
    const faction = factionById.get(settlement.factionId);
    if (!faction) throw new Error('Invalid settlement ownership');
    const yields = settlementYields(state, settlement);
    harvestSettlementResources(state, settlement);
    const maintenance = settlementCivicUpkeep(settlement.population, state.land.settlements[settlement.id]?.claimed.length ?? 0, townsByFaction.get(faction.id) ?? 0, version).total + hearthDevelopmentUpkeep(state, settlement.id);
    civicUpkeep.set(faction.id, (civicUpkeep.get(faction.id) ?? 0) + maintenance);
    faction.treasury = Math.min(balanceLimit, faction.treasury + yields.coin);
    faction.knowledge = Math.min(balanceLimit, faction.knowledge + yields.knowledge);
    settlement.food = Math.max(0, Math.min(balanceLimit, settlement.food + yields.food - settlementFoodConsumption(settlement.population, version)));
    let industry = yields.industry;
    while (industry > 0 && settlement.queue.length > 0) {
      const queued = settlement.queue[0];
      if (!queued) break;
      const building = buildings.get(queued.itemId);
      const unit = units.get(queued.itemId);
      const definition = building ?? unit;
      if (!definition) throw new Error('Invalid production reference');
      const productionBlocker = unit?.movementDomain === 'naval' ? productionRequirementBlocker(state, settlement, queued.itemId) : null;
      if (productionBlocker) { emitted.push({ turn: state.turn, type: 'production_paused', factionId: faction.id, cell: settlement.cell, message: `${settlement.name}: ${definition.name} is paused. ${productionBlocker}` }); break; }
      const spent = Math.min(industry, definition.cost - queued.progress);
      queued.progress += spent; industry -= spent;
      if (queued.progress < definition.cost) break;
      settlement.queue.shift();
      if (building) settlement.buildings.push(building.id);
      else musterNewArmy(state, settlement.id, addArmy(state, faction.id, navalLaunchCell(state, settlement, queued.itemId) ?? settlement.cell, queued.itemId).id);
      emitted.push({ turn: state.turn, type: building ? 'building_completed' : 'unit_recruited', message: `${settlement.name} completed ${definition.name}.`, factionId: faction.id, cell: settlement.cell });
    }
    const growthFood = settlementGrowthFood(settlement.population, version);
    if ((version >= 16 || settlement.population < 20) && settlement.food >= growthFood && settlement.population < Number.MAX_SAFE_INTEGER) {
      settlement.food -= growthFood;
      settlement.population++;
      emitted.push({ turn: state.turn, type: 'settlement_grew', message: `${settlement.name} grew to population ${settlement.population}.`, factionId: faction.id, cell: settlement.cell });
    }
    if (rulesVersion(state) >= 9) resolveLandTurn(state, settlement, emitted);
    if (!state.sieges[settlement.id]) {
      settlement.devastation = Math.max(0, settlement.devastation - 5);
      settlement.occupationTurns = Math.max(0, settlement.occupationTurns - 1);
    }
  }
  advanceDevelopment(state);
  pruneDevelopment(state);
  observe('settlements', 'end');
  observe('upkeep', 'start');
  const upkeep = new Map<string, number>();
  for (const army of Object.values(state.armies)) upkeep.set(army.factionId, (upkeep.get(army.factionId) ?? 0) + armyUpkeep(army) + army.formations.reduce((sum, formation) => sum + formationDevelopmentUpkeep(state, formation.id), 0));
  const unpaid = new Set<string>();
  for (const faction of state.factions) {
    const maintenance = (upkeep.get(faction.id) ?? 0) + characterUpkeep(state, faction.id) + (civicUpkeep.get(faction.id) ?? 0) + factionDevelopmentUpkeep(state, faction.id) + depotUpkeep(state, faction.id);
    if (faction.treasury < maintenance) {
      unpaid.add(faction.id);
      emitted.push({ turn: state.turn, type: 'upkeep_shortfall', factionId: faction.id, message: 'The treasury cannot cover upkeep. Army movement is reduced by one next turn.' });
    }
    faction.treasury = Math.max(0, faction.treasury - maintenance);
  }
  // Standing charters are answered once upkeep is paid, so a policy never starves a wage.
  advanceCharters(state, emitted);
  observe('upkeep', 'end');
  // Missions count completed campaign turns; finishing work receives only this new turn's normal budget.
  if (rulesVersion(state) >= 7) {
    state.turn++;
    observe('characters', 'start');
    advanceCharacters(state, emitted);
    observe('characters', 'end');
  }
  observe('movement', 'start');
  // Rules 27: an army outside its realm's supply wastes away and rests on nothing.
  const starving = advanceSupply(state, emitted);
  for (const army of Object.values(state.armies)) {
    army.movement = state.transports[army.id] || armyHasCharacterMission(state, army.id) ? 0 : Math.max(1, effectiveArmyMovement(state, army, state.progression[army.factionId]?.doctrineId ?? null) - (unpaid.has(army.factionId) ? 1 : 0));
    const fed = !starving.has(army.id);
    for (const formation of army.formations) {
      formation.morale = Math.min(units.get(formation.unitId)?.morale ?? 1, formation.morale + (fed ? 10 : SUPPLY_MORALE_RECOVERY));
      formation.fatigue = Math.max(0, formation.fatigue - (fed ? 15 : SUPPLY_FATIGUE_RECOVERY));
    }
  }
  if (rulesVersion(state) < 7) state.turn++;
  observe('movement', 'end');
  observe('travel', 'start');
  advanceMovement(state, emitted);
  // Postings act only after ordinary travel, so an army with its own order keeps it.
  advancePostings(state, emitted);
  advanceDepots(state, emitted);
  observe('travel', 'end');
  observe('diplomacy', 'start');
  emitted.push(...advanceDiplomacy(state));
  emitted.push(...advanceClients(state));
  observe('diplomacy', 'end');
  observe('progression', 'start');
  advanceProgression(state, emitted);
  observe('progression', 'end');
  if (!state.victory) for (const faction of state.factions) emitted.push({ turn: state.turn, type: 'turn_started', factionId: faction.id, message: `Turn ${state.turn}: orders are ready.` });
}

/** Preflight before AI proposals: uses the same strict schema and rules as resolution. */
export function validateEndTurn(state: GameState, input: unknown): CommandResult {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Malformed command: ' + parsed.error.issues[0]?.message, events: [] };
  const command = parsed.data;
  if (command.type !== 'endTurn') return { ok: false, error: 'Expected an end-turn command.', events: [] };
  if (state.victory) return { ok: false, error: 'This campaign has ended in victory.', events: [] };
  if (!state.factions.some(faction => faction.id === command.factionId)) return { ok: false, error: 'Unknown faction.', events: [] };
  if (command.factionId !== state.turnOwnerId) return { ok: false, error: 'Only the campaign turn owner may resolve the turn.', events: [] };
  if (state.battle) return { ok: false, error: 'Resolve the pending battle before ending the turn.', events: [] };
  if (state.pendingCapture) return { ok: false, error: 'Resolve the settlement capture before ending the turn.', events: [] };
  if (state.turn >= 1_000_000) return { ok: false, error: 'This campaign has reached the supported turn limit.', events: [] };
  return { ok: true, events: [] };
}

/** Every rejection occurs before any mutation. AI and players use this same boundary. */
export function applyCommand(state: GameState, input: unknown, onPhase?: PhaseObserver, onBattle?: BattlePresentationObserver): CommandResult {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Malformed command: ' + parsed.error.issues[0]?.message, events: [] };
  const command = parsed.data;
  const faction = state.factions.find(item => item.id === command.factionId);
  if (!faction) return { ok: false, error: 'Unknown faction.', events: [] };
  const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
  if (state.victory) return fail('This campaign has ended in victory.');
  if (state.pendingCapture && command.type !== 'resolveCapture') return fail('Resolve the settlement capture before issuing strategic commands.');
  if (state.battle && command.type !== 'battleOrder' && command.type !== 'autoResolveBattle' && command.type !== 'useCommanderAbility' && command.type !== 'useBattleAbility' && command.type !== 'setBattleAbilityAuto') {
    return command.type === 'endTurn' ? validateEndTurn(state, command) : fail('Resolve the pending battle before issuing strategic commands.');
  }
  const emitted: DomainEvent[] = [];
  // Only this bounded command's actual facts are collected. No callback receives live state.
  const presentedBattle = onBattle && (state.battle?.rulesVersion ?? 0) >= 9 ? state.battle : null;
  const beforeScene = presentedBattle ? getBattleScene(state, presentedBattle) : null;
  const battleFacts: BattlePresentationEvent[] = [];
  const observeFact: BattleFactObserver | undefined = presentedBattle ? fact => { if (battleFacts.length >= 4096) throw new Error('Battle fact bound exceeded.'); battleFacts.push({ ...fact, sequence: battleFacts.length, targetIds: [...fact.targetIds], changes: fact.changes.map(change => ({ ...change })) }); } : undefined;
  const affectedArmies = state.battle ? [state.battle.attackerId, ...state.battle.defenderIds] : [];
  if (state.pendingCapture) affectedArmies.push(state.pendingCapture.armyId);
  const diagnostics: string[] = [];
  const index = indexes(state);
  if (command.type === 'found') {
    const army = state.armies[command.armyId];
    if (!army || army.factionId !== faction.id) return fail('You do not control that army.');
    if (carriedArmyBlocker(state, army.id)) return fail(carriedArmyBlocker(state, army.id)!);
    if (armyHasCharacterMission(state, army.id)) return fail('Cancel this army’s active character mission before founding a settlement.');
    const foundingFormation = army.formations.find(item => units.get(item.unitId)?.canFound);
    if (!foundingFormation || !armyCanFound(army)) return fail('Only a hearth caravan can found a settlement.');
    if (army.movement < 1) return fail('The caravan has no movement remaining this turn.');
    if (!isPassable(state.world.terrain[army.cell] ?? 0)) return fail('This terrain cannot support a settlement.');
    if (cellsWithin(state, army.cell, 2).some(cell => index.settlements.has(cell))) return fail('Found settlements at least three hexes apart.');
    if (rulesVersion(state) >= 9 && observeLandCell(state, faction.id, army.cell).settlementId) return fail('This tile already belongs to a settlement.');
    if (Object.values(state.settlements).some(item => item.factionId === faction.id && item.name === command.name)) return fail('Your faction already has a settlement with that name.');
    const foundingCost = foundingCoinCost(Object.values(state.settlements).filter(town => town.factionId === faction.id).length, rulesVersion(state));
    if (faction.treasury < foundingCost) return fail(`Founding this hearth requires ${foundingCost} coin.`);
    faction.treasury -= foundingCost;
    const id = `settlement.${state.nextId++}`;
    state.settlements[id] = { id, factionId: faction.id, name: command.name, cell: army.cell, population: 1, food: 0, buildings: [], queue: [], founderFactionId: faction.id, devastation: 0, occupationTurns: 0 };
    if (rulesVersion(state) >= 9) initializeSettlementLand(state, state.settlements[id]!);
    index.settlements.set(army.cell, id);
    updateSight(state, faction.id, army.cell, 3, 1);
    updateSight(state, faction.id, army.cell, armySight(army), -1);
    index.armies.get(army.cell)?.delete(army.id);
    army.formations = army.formations.filter(item => item.id !== foundingFormation.id);
    if (!army.formations.length) { removeArmyCharacters(state, army.id, emitted, id); delete state.armies[army.id]; delete state.routes[army.id]; }
    else {
      index.armies.get(army.cell)?.add(army.id); army.movement = 0;
      updateSight(state, faction.id, army.cell, armySight(army), 1);
      pauseMovement(state, army.id, 'A founding caravan left this army; review its travel order.', emitted);
    }
    const ruin = Object.values(state.ruins).find(ruin => ruin.cell === army.cell);
    if (ruin) delete state.ruins[ruin.id];
    emitted.push({ turn: state.turn, factionId: faction.id, type: ruin ? 'settlement_resettled' : 'settlement_founded', message: `${command.name} was ${ruin ? 'resettled on the ruins of ' + ruin.name : 'founded'}. The hearth caravan has settled.`, cell: army.cell });
  } else if (command.type === 'develop') {
    const result = chooseDevelopment(state, command);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'sellResource') {
    const blocker = applyResourceCommand(state, command, emitted);
    if (blocker) return fail(blocker);
  } else if (command.type === 'move') {
    const army = state.armies[command.armyId];
    if (!army || army.factionId !== faction.id) return fail('You do not control that army.');
    if (carriedArmyBlocker(state, army.id)) return fail(carriedArmyBlocker(state, army.id)!);
    if (armyHasCharacterMission(state, army.id)) return fail('Cancel this army’s active character mission before moving it.');
    if (Object.values(state.sieges).some(siege => siege.armyId === army.id)) return fail('Lift this army’s siege before moving it.');
    if (command.target >= state.world.width * state.world.height) return fail('The destination is outside the world.');
    if (!neighbors(army.cell, state.world.width, state.world.height).includes(command.target)) return fail('Choose an adjacent hex.');
    if (!index.visible.get(faction.id)?.has(command.target)) return fail('The destination is not currently visible.');
    const terrainBlocker = armyTerrainBlocker(state, army, command.target);
    if (terrainBlocker) return fail(terrainBlocker);
    const cost = roadMovementCost(state, army.cell, command.target);
    if (army.movement < cost) return fail('Not enough movement remains for this terrain.');
    const occupants = index.armies.get(command.target);
    if (occupants && [...occupants].some(id => state.armies[id]?.factionId !== faction.id)) return fail('Another faction occupies this hex.');
    const townId = index.settlements.get(command.target);
    if (townId && state.settlements[townId]?.factionId !== faction.id) return fail('Another faction controls this settlement.');
    const sight = armySight(army);
    updateSight(state, faction.id, army.cell, sight, -1);
    index.armies.get(army.cell)?.delete(army.id);
    army.cell = command.target; army.movement -= cost;
    moveFleetCargo(state, army.id);
    const destination = index.armies.get(army.cell) ?? new Set<string>();
    destination.add(army.id); index.armies.set(army.cell, destination);
    updateSight(state, faction.id, army.cell, sight, 1);
    delete state.routes[army.id];
    emitted.push({ turn: state.turn, factionId: faction.id, type: 'army_moved', message: `${army.name} explored hex ${army.cell}.`, cell: army.cell });
  } else if (command.type === 'moveTo' || command.type === 'queueMovement' || command.type === 'cancelMovement' || command.type === 'resumeMovement') {
    const result = command.type === 'moveTo' ? moveTo(state, faction.id, command.armyId, command.target)
      : command.type === 'queueMovement' ? queueMovement(state, faction.id, command.armyId, command.target, command.append)
        : command.type === 'cancelMovement' ? cancelMovement(state, faction.id, command.armyId) : resumeMovement(state, faction.id, command.armyId);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'accelerateRoad') {
    const result = accelerateRoad(state, faction.id, command.settlementId);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'embarkArmy' || command.type === 'disembarkArmy') {
    const result = command.type === 'embarkArmy' ? embarkArmy(state, faction.id, command.armyId, command.fleetId) : disembarkArmy(state, faction.id, command.armyId, command.target);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'mergeArmies' || command.type === 'transferFormations' || command.type === 'splitArmy') {
    const result = command.type === 'splitArmy' ? splitArmyFormations(state, faction.id, command.armyId, command.formationIds, command.name)
      : transferArmyFormations(state, faction.id, command.sourceArmyId, command.targetArmyId, command.type === 'transferFormations' ? command.formationIds : undefined);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'queue') {
    const settlement = state.settlements[command.settlementId];
    if (!settlement || settlement.factionId !== faction.id) return fail('You do not control that settlement.');
    const building = buildings.get(command.itemId);
    const definition = building ?? units.get(command.itemId);
    if (!definition || rulesVersion(state) < 6 && !building && !LEGACY_UNIT_IDS.has(command.itemId)) return fail('Unknown construction or recruitment item.');
    const requirement = productionRequirementBlocker(state, settlement, command.itemId);
    if (requirement) return fail(requirement);
    if (settlement.queue.length >= 5) return fail('The production queue is full (five items).');
    if (building && (settlement.buildings.includes(building.id) || settlement.queue.some(item => item.itemId === building.id))) return fail('That building is already built or queued.');
    if (faction.treasury < definition.coinCost) return fail('Not enough coin to fund that order.');
    faction.treasury -= definition.coinCost;
    settlement.queue.push({ itemId: command.itemId, progress: 0 });
    emitted.push({ turn: state.turn, factionId: faction.id, type: 'production_queued', message: `${settlement.name} queued ${definition.name} for ${definition.coinCost} coin.`, cell: settlement.cell });
  } else if (command.type === 'setCharter') {
    const result = setCharter(state, faction.id, command.settlementId, command.focus, command.ceiling);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'buildDepot' || command.type === 'abandonDepot') {
    const result = command.type === 'buildDepot' ? buildDepot(state, faction.id, command.armyId) : abandonDepot(state, faction.id, command.cell);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'setPosting' || command.type === 'setMuster') {
    const result = command.type === 'setPosting'
      ? setPosting(state, faction.id, command.armyId, command.cell, command.mode)
      : setMuster(state, faction.id, command.settlementId, command.cell);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'declareWar' || command.type === 'attack' || command.type === 'battleOrder' || command.type === 'autoResolveBattle') {
    const result = command.type === 'declareWar' ? declareCampaignWar(state, faction.id, command.targetFactionId)
      : command.type === 'attack' ? startCampaignBattle(state, faction.id, command.armyId, command.targetArmyId)
        : resolveCampaignBattle(state, faction.id, command.type === 'battleOrder' ? command.order : undefined, observeFact);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'besiege' || command.type === 'liftSiege' || command.type === 'assault' || command.type === 'resolveCapture') {
    const previousOwner = state.settlements[command.settlementId]?.factionId;
    const result = command.type === 'besiege' ? besiegeSettlement(state, faction.id, command.armyId, command.settlementId)
      : command.type === 'liftSiege' ? liftSettlementSiege(state, faction.id, command.settlementId)
        : command.type === 'assault' ? assaultSettlement(state, faction.id, command.settlementId)
          : resolveSettlementCapture(state, faction.id, command.settlementId, command.outcome);
    if (!result.ok) return result;
    emitted.push(...result.events);
    if (command.type === 'resolveCapture' && previousOwner && rulesVersion(state) >= 9) handleLandCapture(state, command.settlementId, previousOwner, emitted);
  } else if (command.type === 'searchArcane') {
    const result = searchArcane(state, faction.id, command.armyId);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'proposeClient' || command.type === 'respondClient' || command.type === 'releaseClient' || command.type === 'renounceClient') {
    const result = command.type === 'proposeClient' ? proposeClient(state, faction.id, command.targetFactionId, command.terms)
      : command.type === 'respondClient' ? respondClient(state, faction.id, command.offerId, command.accept)
      : command.type === 'releaseClient' ? releaseClient(state, faction.id, command.clientId) : renounceClient(state, faction.id);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'proposePeace' || command.type === 'respondPeace') {
    const result = command.type === 'proposePeace' ? proposePeace(state, faction.id, command.targetFactionId, command.terms) : respondPeace(state, faction.id, command.offerId, command.accept);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'researchArcane') {
    const result = researchArcane(state, faction.id, command.discoveryId);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'setBattleAbilityAuto' || command.type === 'useBattleAbility' || command.type === 'useCommanderAbility' && (state.battle?.rulesVersion ?? 0) >= 9) {
    const input = command.type === 'useCommanderAbility' ? { type: 'useBattleAbility' as const, factionId: faction.id, battleId: state.battle!.id, sourceId: command.characterId, abilityId: command.abilityId } : command;
    const error = battleAbilityCommand(state, input, emitted, observeFact);
    if (error) return fail(error);
    if (command.type !== 'setBattleAbilityAuto') settleCampaignAbility(state, emitted, observeFact);
  } else if (command.type === 'research' || command.type === 'adoptInstitution' || command.type === 'adoptDoctrine' || command.type === 'startVictoryProject') {
    if (rulesVersion(state) < 8 && command.type === 'research' && (command.technologyId === 'technology.coastal_navigation' || command.technologyId === 'technology.ocean_navigation')) return fail('Unknown progression choice.');
    const result = command.type === 'startVictoryProject' ? startVictoryProject(state, faction.id, command.settlementId)
      : chooseProgression(state, faction.id, command.type, command.type === 'research' ? command.technologyId : command.type === 'adoptInstitution' ? command.institutionId : command.doctrineId);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'recruitCharacter' || command.type === 'assignCharacter' || command.type === 'unassignCharacter' || command.type === 'promoteCharacter' || command.type === 'startCharacterMission' || command.type === 'cancelCharacterMission' || command.type === 'useCommanderAbility') {
    const result = command.type === 'recruitCharacter' ? recruitCharacter(state, faction.id, command.settlementId, command.definitionId)
      : command.type === 'assignCharacter' ? assignCharacter(state, faction.id, command.characterId, command.armyId)
        : command.type === 'unassignCharacter' ? unassignCharacter(state, faction.id, command.characterId, command.settlementId)
          : command.type === 'promoteCharacter' ? promoteCharacter(state, faction.id, command.characterId, command.skillId)
            : command.type === 'startCharacterMission' ? startCharacterMission(state, faction.id, command.characterId, command.missionId, command.targetCell, command.settlementId)
              : command.type === 'cancelCharacterMission' ? cancelCharacterMission(state, faction.id, command.characterId)
                : useCommanderAbility(state, faction.id, command.characterId, command.abilityId);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'claimCell' || command.type === 'setWorkedTiles' || command.type === 'improveTile' || command.type === 'terraformTile' || command.type === 'cancelLandWork' || command.type === 'setCapital') {
    const error = applyLandCommand(state, command, emitted);
    if (error) return fail(error);
  } else {
    const validation = validateEndTurn(state, command);
    if (!validation.ok) return validation;
    resolveTurn(state, emitted, (phase, edge) => {
      if (!onPhase) return;
      try { onPhase(phase, edge); }
      catch (error) { diagnostics.push(`Phase observer failed at ${phase}/${edge}: ${error instanceof Error ? error.message : String(error)}`); }
    });
  }
  if (command.type === 'respondPeace' || emitted.some(event => event.type === 'battle_finished')) reconcileSieges(state, emitted);
  if (command.type === 'resolveCapture' || command.type === 'liftSiege' || command.type === 'respondPeace' || emitted.some(event => event.type === 'battle_finished')) reconcileCharacterMissions(state, emitted);
  if (command.type === 'resolveCapture' || command.type === 'besiege' || command.type === 'liftSiege' || command.type === 'respondPeace' || emitted.some(event => event.type === 'battle_finished')) reconcileProjects(state, emitted);
  if (state.battle) affectedArmies.push(state.battle.attackerId, ...state.battle.defenderIds);
  if (command.type === 'besiege') pauseMovement(state, command.armyId, 'This army is maintaining a siege.', emitted);
  reconcileMovement(state, emitted, affectedArmies);
  if (rulesVersion(state) >= 12 && command.type === 'resolveCapture') reconcileRoads(state);
  if (rulesVersion(state) >= 9 && (command.type === 'found' || command.type === 'resolveCapture' || command.type === 'claimCell' || command.type === 'endTurn')) {
    for (const party of state.factions) refreshLandKnowledge(state, party.id, index.visible.get(party.id) ?? new Map());
  }
  upgradeLandVisibility(state);
  state.events.push(...emitted);
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
  if (onBattle && presentedBattle && beforeScene) {
    try { onBattle({ battleId: presentedBattle.id, before: beforeScene, after: getBattleScene(state, presentedBattle), events: battleFacts }); }
    catch (error) { diagnostics.push(`Battle presentation observer failed: ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (rulesVersion(state) >= 16 && ['found', 'resolveCapture', 'battleOrder', 'autoResolveBattle', 'useBattleAbility'].includes(command.type)) pruneDevelopment(state);
  return { ok: true, events: emitted.map(event => ({ ...event })), ...(diagnostics.length ? { diagnostics } : {}) };
}

export interface ObservationOptions { landDetails?: LandDetails; developmentCandidates?: boolean }

export function getObservation(state: GameState, factionId: string, options: ObservationOptions = {}): Observation {
  const faction = state.factions.find(item => item.id === factionId);
  if (!faction) throw new Error('Unknown observation faction');
  const visible = indexes(state).visible.get(factionId) ?? new Map<number, number>();
  const modern = rulesVersion(state) >= 16, world = state.world, knownLand = state.land.known[factionId], knownRoads = state.roads.known[factionId];
  // Computed once: the same reach answers every army's supply and draws the map.
  const supplyReach = suppliedCells(state, factionId);
  const compareId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  const armies = Object.values(state.armies).filter(army => army.factionId === factionId || !state.transports[army.id] && visible.has(army.cell)).sort(compareId);
  const settlements = Object.values(state.settlements).filter(settlement => settlement.factionId === factionId || visible.has(settlement.cell)).sort(compareId);
  const knownFactions = new Set([factionId, ...armies.map(army => army.factionId), ...settlements.map(settlement => settlement.factionId)]);
  // A witnessed border identifies its public culture even when the town center
  // has not been reached. Last-seen ownership never reveals its current changes.
  for (const land of Object.values(state.land.known[factionId] ?? {})) if (land.factionId) knownFactions.add(land.factionId);
  const wars = state.wars.filter(pair => pair.includes(factionId)).map(pair => pair[0] === factionId ? pair[1] : pair[0]).sort();
  const diplomacy = getDiplomacyObservation(state, factionId);
  for (const relation of diplomacy.relations) for (const party of relation.parties) knownFactions.add(party);
  if (state.pendingCapture?.factionId === factionId) {
    for (const option of state.pendingCapture.options) if (option.recipientFactionId) knownFactions.add(option.recipientFactionId);
  }
  for (const enemy of wars) knownFactions.add(enemy);
  for (const project of state.projects) knownFactions.add(project.factionId);
  const involved = (battle: { attackerFactionId: string; defenderFactionId: string }): boolean => battle.attackerFactionId === factionId || battle.defenderFactionId === factionId;
  return {
    ...(rulesVersion(state) >= 16 ? { resources: resourceObservation(state, factionId), development: getDevelopmentObservation(state, factionId, undefined, options.developmentCandidates ?? true), growth: getGrowthObservation(state, factionId) } : {}),
    battleScene: state.battle && involved(state.battle) ? getBattleScene(state, state.battle) : null,
    battleAbilities: observeBattleAbilities(state, factionId), arcaneResearch: observeArcaneResearch(state, factionId),
    arcaneSites: observeArcaneSites(state, factionId), arcaneSearchCoinCost: SITE_SEARCH_COIN,
    roads: observeRoads(state, factionId),
    layout: state.world.layout,
    land: getLandObservation(state, factionId, visible, options.landDetails),
    turn: state.turn, factionId, factionCount: state.factions.length, pace: state.pace,
    factions: state.factions.filter(item => knownFactions.has(item.id)).map(item => ({ id: item.id, definitionId: item.definitionId, name: item.name, color: item.color })),
    treasury: faction.treasury, knowledge: faction.knowledge,
    armies: armies.map(army => ({ ...getArmyView(state, army), ...(state.transports[army.id] ? { movementBlocker: carriedArmyBlocker(state, army.id), canFound: false, canAttack: false, maxMovement: 0 } : {}), ...(army.factionId === factionId ? {} : { commander: null, agents: [], movementBlocker: null, reorganizationBlocker: null,
      formationCapacity: Math.max(12, army.formations.length), overCommand: false, commandBlocker: null, capacityReason: 'Foreign command organization is private.', splitFormationLimit: 0, mergeOptions: [], mergeOptionsTruncated: false,
      cargo: [], transportUsed: 0, carrierId: null, canEnterDeepWater: false, embarkOptions: [], disembarkOptions: [], transportOptionsTruncated: false }) })),
    productionOptions: observeProductionOptions(state, factionId),
    charters: observeCharters(state, factionId),
    postings: observePostings(state, factionId),
    musters: state.musters.filter(muster => muster.factionId === factionId),
    supply: observeSupply(state, factionId, supplyReach),
    suppliedCells: [...supplyReach.keys()].sort((a, b) => a - b),
    depots: state.depots.filter(depot => depot.factionId === factionId || indexes(state).visible.get(factionId)?.has(depot.cell)),
    depotCoinCost: rulesVersion(state) >= 28 ? DEPOT_COIN : 0,
    ...getCharacterObservation(state, factionId), commanderAbilities: observeCommanderAbilities(state, factionId),
    routes: Object.values(state.routes).filter(route => state.armies[route.armyId]?.factionId === factionId).sort((a, b) => a.armyId < b.armyId ? -1 : 1).map(route => ({ ...route, path: [...route.path], waypoints: [...route.waypoints], knownHostileIds: [...route.knownHostileIds] })),
    settlements: settlements.map(settlement => ({ ...settlement, buildings: [...settlement.buildings].sort(), food: settlement.factionId === factionId ? settlement.food : 0, queue: settlement.factionId === factionId ? settlement.queue.map(item => ({ ...item })) : [] })),
    events: state.events.filter(event => event.factionId === factionId).map(event => ({ ...event })),
    cells: sortedExploredCells(state.explored[factionId] ?? []).map(cell => {
      const known = knownLand?.[cell], resourceId = modern ? state.resources.deposits[cell] : undefined;
      // Build one detached object without spreading several temporary objects per
      // explored cell. Preserve optional-field presence and publication key order.
      const observed = { cell } as Observation['cells'][number];
      if (resourceId) observed.resourceId = resourceId;
      observed.terrain = world.terrain[cell] ?? 0;
      observed.biome = known?.biome ?? world.biome[cell] ?? 0;
      observed.waterDepth = world.waterDepth[cell] ?? 0;
      observed.fertility = world.fertility[cell] ?? 0;
      observed.visible = visible.has(cell);
      const hydrology = world.hydrology[cell], roadMask = knownRoads?.[cell];
      if (hydrology) observed.hydrology = hydrology;
      if (roadMask) observed.roadMask = roadMask;
      if (known?.settlementId) { observed.settlementId = known.settlementId; observed.factionId = known.factionId; }
      if (known?.improvementId) observed.improvementId = known.improvementId;
      return observed;
    }),
    width: state.world.width, height: state.world.height, seed: state.world.seed,
    wars, battle: state.battle && involved(state.battle) ? cloneCampaignBattle(state.battle, factionId) : null,
    battleReports: state.battleReports.filter(involved).map(battle => cloneCampaignBattle(battle, factionId)),
    diplomacy, sieges: observeSieges(state, factionId),
    visibleSiegeSettlementIds: settlements.filter(town => visible.has(town.cell) && state.sieges[town.id]).map(town => town.id),
    progression: getProgressionObservation(state, factionId), projects: state.projects.map(project => ({ ...project })), victory: state.victory ? { ...state.victory } : null,
    pendingCapture: state.pendingCapture?.factionId === factionId ? { ...state.pendingCapture, options: state.pendingCapture.options.map(option => ({ ...option })) } : null,
    ruins: Object.values(state.ruins).filter(ruin => visible.has(ruin.cell)).sort(compareId).map(ruin => ({ ...ruin })),
  };
}
