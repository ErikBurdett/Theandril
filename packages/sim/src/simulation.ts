import { z } from 'zod';
import { BUILDINGS, FACTIONS, UNITS, campaignPaceSchema } from '@theandril/content';
import { GENERATOR_VERSION, generateWorld, isPassable, neighbors } from '@theandril/mapgen';
import type { Army, CommandResult, DomainEvent, GameState, NewGameOptions, Observation, PhaseObserver, Settlement } from './types';
import { cellsWithin, indexes, rebuildIndexes, updateSight } from './visibility';
import { cloneCampaignBattle, declareCampaignWar, resolveCampaignBattle, startCampaignBattle } from './warfare';
import { advanceDiplomacy, createDiplomacy, getDiplomacyObservation, peaceCommandSchemas, proposePeace, respondPeace } from './diplomacy';
import { advanceSieges, assaultSettlement, besiegeSettlement, captureOutcomeSchema, liftSettlementSiege, observeSieges, reconcileSieges, resolveSettlementCapture } from './siege';
import { advanceProgression, chooseProgression, createFactionProgression, doctrineEffects, getProgressionObservation, progressionYields, reconcileProjects, startVictoryProject } from './progression';
import { advanceMovement, cancelMovement, moveTo, pauseMovement, queueMovement, reconcileMovement, resumeMovement } from './movement';

import { armyCanFound, armyMovement, armySight, armyUpkeep, createArmyFormation, getArmyView, splitArmyFormations, transferArmyFormations } from './army-composition';
import { LEGACY_UNIT_IDS, rulesVersion, withRules, type RulesVersion } from './rules';
import { advanceCharacters, armyHasCharacterMission, assignCharacter, cancelCharacterMission, characterUpkeep, getCharacterObservation, observeCommanderAbilities, promoteCharacter, recruitCharacter, reconcileCharacterMissions, removeArmyCharacters, startCharacterMission, unassignCharacter, useCommanderAbility } from './characters';

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
export const commandSchema = z.discriminatedUnion('type', [
  ...version6CommandSchema.options,
  z.object({ type: z.literal('recruitCharacter'), factionId: identifier, settlementId: identifier, definitionId: identifier }).strict(),
  z.object({ type: z.literal('assignCharacter'), factionId: identifier, characterId: identifier, armyId: identifier }).strict(),
  z.object({ type: z.literal('unassignCharacter'), factionId: identifier, characterId: identifier, settlementId: identifier }).strict(),
  z.object({ type: z.literal('promoteCharacter'), factionId: identifier, characterId: identifier, skillId: identifier }).strict(),
  z.object({ type: z.literal('startCharacterMission'), factionId: identifier, characterId: identifier, missionId: identifier, targetCell: z.number().int().min(0).max(349_999).optional(), settlementId: identifier.optional() }).strict(),
  z.object({ type: z.literal('cancelCharacterMission'), factionId: identifier, characterId: identifier }).strict(),
  z.object({ type: z.literal('useCommanderAbility'), factionId: identifier, characterId: identifier, abilityId: identifier }).strict(),
]);
export const commandSchemaForVersion = (version: RulesVersion) => version === 4 ? legacyCommandSchema : version === 5 ? version5CommandSchema : version === 6 ? version6CommandSchema : commandSchema;

/** Historical singleton execution preserves old IDs, outcomes, messages and content access. */
export function applyCommandForVersion(state: GameState, input: unknown, version: RulesVersion): CommandResult {
  const parsed = commandSchemaForVersion(version).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Malformed command: ' + parsed.error.issues[0]?.message, events: [] };
  if (version < 7 && Object.keys(state.characters).length) throw new Error('Historical rules cannot execute a campaign containing characters.');
  if (version < 6 && Object.values(state.armies).some(army => army.formations.length !== 1 || army.formations[0]?.id !== `formation.${army.id.slice(5)}` || !LEGACY_UNIT_IDS.has(army.formations[0]?.unitId ?? ''))) throw new Error('Historical rules require an unmodified singleton-army campaign.');
  return withRules(state, version, () => applyCommand(state, input));
}

export const MAX_EVENTS = 200;
const MAX_RESOURCE = 1_000_000_000;
const buildings = new Map(BUILDINGS.map(item => [item.id, item]));
const units = new Map(UNITS.map(item => [item.id, item]));

export function createGame(options: NewGameOptions): GameState {
  const checked = z.object({
    seed: z.number().int().min(0).max(0xffff_ffff),
    size: z.enum(['tiny', 'small', 'standard', 'huge', 'legendary']),
    factionCount: z.number().int().min(1).max(48).default(4),
    pace: campaignPaceSchema.default('standard'),
    generatorVersion: z.union([z.literal(1), z.literal(2)]).default(GENERATOR_VERSION),
  }).strict().parse(options);
  const selected = Array.from({ length: checked.factionCount }, (_, index) => {
    const base = FACTIONS[index % FACTIONS.length];
    if (!base) throw new Error('No faction definitions are available');
    return { ...base, definitionId: base.id, id: index < FACTIONS.length ? base.id : `${base.id}.${index + 1}`, name: index < FACTIONS.length ? base.name : `${base.name} ${index + 1}` };
  });
  const owner = selected[0];
  if (!owner) throw new Error('A campaign requires a player faction');
  const world = generateWorld(checked.seed, checked.size, checked.factionCount, checked.generatorVersion);
  const state: GameState = {
    turn: 1, nextId: 1, turnOwnerId: owner.id, world, pace: checked.pace,
    factions: selected.map(faction => ({ id: faction.id, definitionId: faction.definitionId, name: faction.name, color: faction.color, treasury: 60, knowledge: 0 })),
    armies: {}, characters: {}, routes: {}, settlements: {}, explored: {}, events: [], wars: [], battle: null, battleReports: [],
    sieges: {}, pendingCapture: null, ruins: {}, diplomacy: createDiplomacy(),
    progression: Object.fromEntries(selected.map(faction => [faction.id, createFactionProgression()])), projects: [], victory: null,
  };
  selected.forEach((faction, i) => {
    const cell = world.starts[i];
    if (cell === undefined) throw new Error('World is missing a faction start');
    state.explored[faction.id] = new Set();
    for (const unitId of ['unit.colonist', 'unit.scout']) {
      const definition = units.get(unitId);
      if (!definition) throw new Error('Missing starting unit');
      const id = `army.${state.nextId++}`;
      state.armies[id] = { id, factionId: faction.id, name: definition.name, cell, movement: definition.movement, formations: [createArmyFormation(id, unitId)] };
    }
    state.events.push({ turn: 1, factionId: faction.id, type: 'campaign_started', message: 'Your hearth caravan awaits a place to settle.', cell });
  });
  rebuildIndexes(state);
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
  const progression = progressionYields(state, settlement.factionId);
  for (const yieldId of ['food', 'industry', 'coin', 'knowledge'] as const) {
    yields[yieldId] += progression[yieldId];
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
  const factionById = new Map(state.factions.map(faction => [faction.id, faction]));
  // Canonical phases: settlement yields/production, growth, upkeep, movement refresh.
  // O(settlements + armies + built content), independent of global map dimensions.
  for (const settlement of Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
    const faction = factionById.get(settlement.factionId);
    if (!faction) throw new Error('Invalid settlement ownership');
    const yields = settlementYields(state, settlement);
    faction.treasury = Math.min(MAX_RESOURCE, faction.treasury + yields.coin);
    faction.knowledge = Math.min(MAX_RESOURCE, faction.knowledge + yields.knowledge);
    settlement.food = Math.max(0, Math.min(MAX_RESOURCE, settlement.food + yields.food - settlement.population * 2));
    let industry = yields.industry;
    while (industry > 0 && settlement.queue.length > 0) {
      const queued = settlement.queue[0];
      if (!queued) break;
      const building = buildings.get(queued.itemId);
      const unit = units.get(queued.itemId);
      const definition = building ?? unit;
      if (!definition) throw new Error('Invalid production reference');
      const spent = Math.min(industry, definition.cost - queued.progress);
      queued.progress += spent; industry -= spent;
      if (queued.progress < definition.cost) break;
      settlement.queue.shift();
      if (building) settlement.buildings.push(building.id);
      else addArmy(state, faction.id, settlement.cell, queued.itemId);
      emitted.push({ turn: state.turn, type: building ? 'building_completed' : 'unit_recruited', message: `${settlement.name} completed ${definition.name}.`, factionId: faction.id, cell: settlement.cell });
    }
    if (settlement.population < 20 && settlement.food >= settlement.population * 12) {
      settlement.food -= settlement.population * 12;
      settlement.population++;
      emitted.push({ turn: state.turn, type: 'settlement_grew', message: `${settlement.name} grew to population ${settlement.population}.`, factionId: faction.id, cell: settlement.cell });
    }
    if (!state.sieges[settlement.id]) {
      settlement.devastation = Math.max(0, settlement.devastation - 5);
      settlement.occupationTurns = Math.max(0, settlement.occupationTurns - 1);
    }
  }
  observe('settlements', 'end');
  observe('upkeep', 'start');
  const upkeep = new Map<string, number>();
  for (const army of Object.values(state.armies)) upkeep.set(army.factionId, (upkeep.get(army.factionId) ?? 0) + armyUpkeep(army));
  const unpaid = new Set<string>();
  for (const faction of state.factions) {
    const maintenance = (upkeep.get(faction.id) ?? 0) + characterUpkeep(state, faction.id);
    if (faction.treasury < maintenance) {
      unpaid.add(faction.id);
      emitted.push({ turn: state.turn, type: 'upkeep_shortfall', factionId: faction.id, message: 'The treasury cannot cover upkeep. Army movement is reduced by one next turn.' });
    }
    faction.treasury = Math.max(0, faction.treasury - maintenance);
  }
  observe('upkeep', 'end');
  // Missions count completed campaign turns; finishing work receives only this new turn's normal budget.
  if (rulesVersion(state) >= 7) {
    state.turn++;
    observe('characters', 'start');
    advanceCharacters(state, emitted);
    observe('characters', 'end');
  }
  observe('movement', 'start');
  for (const army of Object.values(state.armies)) {
    army.movement = armyHasCharacterMission(state, army.id) ? 0 : Math.max(1, armyMovement(army, state.progression[army.factionId]?.doctrineId ?? null) - (unpaid.has(army.factionId) ? 1 : 0));
    for (const formation of army.formations) {
      formation.morale = Math.min(units.get(formation.unitId)?.morale ?? 1, formation.morale + 10);
      formation.fatigue = Math.max(0, formation.fatigue - 15);
    }
  }
  if (rulesVersion(state) < 7) state.turn++;
  observe('movement', 'end');
  observe('travel', 'start');
  advanceMovement(state, emitted);
  observe('travel', 'end');
  observe('diplomacy', 'start');
  emitted.push(...advanceDiplomacy(state));
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
export function applyCommand(state: GameState, input: unknown, onPhase?: PhaseObserver): CommandResult {
  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Malformed command: ' + parsed.error.issues[0]?.message, events: [] };
  const command = parsed.data;
  const faction = state.factions.find(item => item.id === command.factionId);
  if (!faction) return { ok: false, error: 'Unknown faction.', events: [] };
  const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
  if (state.victory) return fail('This campaign has ended in victory.');
  if (state.pendingCapture && command.type !== 'resolveCapture') return fail('Resolve the settlement capture before issuing strategic commands.');
  if (state.battle && command.type !== 'battleOrder' && command.type !== 'autoResolveBattle' && command.type !== 'useCommanderAbility') {
    return command.type === 'endTurn' ? validateEndTurn(state, command) : fail('Resolve the pending battle before issuing strategic commands.');
  }
  const emitted: DomainEvent[] = [];
  const affectedArmies = state.battle ? [state.battle.attackerId, ...state.battle.defenderIds] : [];
  if (state.pendingCapture) affectedArmies.push(state.pendingCapture.armyId);
  const diagnostics: string[] = [];
  const index = indexes(state);
  if (command.type === 'found') {
    const army = state.armies[command.armyId];
    if (!army || army.factionId !== faction.id) return fail('You do not control that army.');
    if (armyHasCharacterMission(state, army.id)) return fail('Cancel this army’s active character mission before founding a settlement.');
    const foundingFormation = army.formations.find(item => units.get(item.unitId)?.canFound);
    if (!foundingFormation || !armyCanFound(army)) return fail('Only a hearth caravan can found a settlement.');
    if (army.movement < 1) return fail('The caravan has no movement remaining this turn.');
    if (!isPassable(state.world.terrain[army.cell] ?? 0)) return fail('This terrain cannot support a settlement.');
    if (cellsWithin(state, army.cell, 2).some(cell => index.settlements.has(cell))) return fail('Found settlements at least three hexes apart.');
    if (Object.values(state.settlements).some(item => item.factionId === faction.id && item.name === command.name)) return fail('Your faction already has a settlement with that name.');
    const id = `settlement.${state.nextId++}`;
    state.settlements[id] = { id, factionId: faction.id, name: command.name, cell: army.cell, population: 1, food: 0, buildings: [], queue: [], founderFactionId: faction.id, devastation: 0, occupationTurns: 0 };
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
  } else if (command.type === 'move') {
    const army = state.armies[command.armyId];
    if (!army || army.factionId !== faction.id) return fail('You do not control that army.');
    if (armyHasCharacterMission(state, army.id)) return fail('Cancel this army’s active character mission before moving it.');
    if (Object.values(state.sieges).some(siege => siege.armyId === army.id)) return fail('Lift this army’s siege before moving it.');
    if (command.target >= state.world.width * state.world.height) return fail('The destination is outside the world.');
    if (!neighbors(army.cell, state.world.width, state.world.height).includes(command.target)) return fail('Choose an adjacent hex.');
    if (!index.visible.get(faction.id)?.has(command.target)) return fail('The destination is not currently visible.');
    const terrain = state.world.terrain[command.target] ?? 0;
    if (!isPassable(terrain)) return fail('Water and mountains are impassable to these armies.');
    const cost = terrain === 2 || terrain === 3 ? 2 : 1;
    if (army.movement < cost) return fail('Not enough movement remains for this terrain.');
    const occupants = index.armies.get(command.target);
    if (occupants && [...occupants].some(id => state.armies[id]?.factionId !== faction.id)) return fail('Another faction occupies this hex.');
    const townId = index.settlements.get(command.target);
    if (townId && state.settlements[townId]?.factionId !== faction.id) return fail('Another faction controls this settlement.');
    const sight = armySight(army);
    updateSight(state, faction.id, army.cell, sight, -1);
    index.armies.get(army.cell)?.delete(army.id);
    army.cell = command.target; army.movement -= cost;
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
    if (settlement.queue.length >= 5) return fail('The production queue is full (five items).');
    if (building && (settlement.buildings.includes(building.id) || settlement.queue.some(item => item.itemId === building.id))) return fail('That building is already built or queued.');
    if (faction.treasury < definition.coinCost) return fail('Not enough coin to fund that order.');
    faction.treasury -= definition.coinCost;
    settlement.queue.push({ itemId: command.itemId, progress: 0 });
    emitted.push({ turn: state.turn, factionId: faction.id, type: 'production_queued', message: `${settlement.name} queued ${definition.name} for ${definition.coinCost} coin.`, cell: settlement.cell });
  } else if (command.type === 'declareWar' || command.type === 'attack' || command.type === 'battleOrder' || command.type === 'autoResolveBattle') {
    const result = command.type === 'declareWar' ? declareCampaignWar(state, faction.id, command.targetFactionId)
      : command.type === 'attack' ? startCampaignBattle(state, faction.id, command.armyId, command.targetArmyId)
        : resolveCampaignBattle(state, faction.id, command.type === 'battleOrder' ? command.order : undefined);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'besiege' || command.type === 'liftSiege' || command.type === 'assault' || command.type === 'resolveCapture') {
    const result = command.type === 'besiege' ? besiegeSettlement(state, faction.id, command.armyId, command.settlementId)
      : command.type === 'liftSiege' ? liftSettlementSiege(state, faction.id, command.settlementId)
        : command.type === 'assault' ? assaultSettlement(state, faction.id, command.settlementId)
          : resolveSettlementCapture(state, faction.id, command.settlementId, command.outcome);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'proposePeace' || command.type === 'respondPeace') {
    const result = command.type === 'proposePeace' ? proposePeace(state, faction.id, command.targetFactionId, command.terms) : respondPeace(state, faction.id, command.offerId, command.accept);
    if (!result.ok) return result;
    emitted.push(...result.events);
  } else if (command.type === 'research' || command.type === 'adoptInstitution' || command.type === 'adoptDoctrine' || command.type === 'startVictoryProject') {
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
  state.events.push(...emitted);
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
  return { ok: true, events: emitted.map(event => ({ ...event })), ...(diagnostics.length ? { diagnostics } : {}) };
}

export function getObservation(state: GameState, factionId: string): Observation {
  const faction = state.factions.find(item => item.id === factionId);
  if (!faction) throw new Error('Unknown observation faction');
  const visible = indexes(state).visible.get(factionId) ?? new Map<number, number>();
  const compareId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  const armies = Object.values(state.armies).filter(army => army.factionId === factionId || visible.has(army.cell)).sort(compareId);
  const settlements = Object.values(state.settlements).filter(settlement => settlement.factionId === factionId || visible.has(settlement.cell)).sort(compareId);
  const knownFactions = new Set([factionId, ...armies.map(army => army.factionId), ...settlements.map(settlement => settlement.factionId)]);
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
    turn: state.turn, factionId, factionCount: state.factions.length, pace: state.pace,
    factions: state.factions.filter(item => knownFactions.has(item.id)).map(item => ({ id: item.id, definitionId: item.definitionId, name: item.name, color: item.color })),
    treasury: faction.treasury, knowledge: faction.knowledge,
    armies: armies.map(army => ({ ...getArmyView(state, army), ...(army.factionId === factionId ? {} : { commander: null, agents: [], movementBlocker: null, reorganizationBlocker: null }) })),
    ...getCharacterObservation(state, factionId), commanderAbilities: observeCommanderAbilities(state, factionId),
    routes: Object.values(state.routes).filter(route => state.armies[route.armyId]?.factionId === factionId).sort((a, b) => a.armyId < b.armyId ? -1 : 1).map(route => ({ ...route, path: [...route.path], waypoints: [...route.waypoints], knownHostileIds: [...route.knownHostileIds] })),
    settlements: settlements.map(settlement => ({ ...settlement, buildings: [...settlement.buildings].sort(), food: settlement.factionId === factionId ? settlement.food : 0, queue: settlement.factionId === factionId ? settlement.queue.map(item => ({ ...item })) : [] })),
    events: state.events.filter(event => event.factionId === factionId).map(event => ({ ...event })),
    cells: [...(state.explored[factionId] ?? [])].sort((a, b) => a - b).map(cell => ({ cell, terrain: state.world.terrain[cell] ?? 0, biome: state.world.biome[cell] ?? 0, fertility: state.world.fertility[cell] ?? 0, visible: visible.has(cell) })),
    width: state.world.width, height: state.world.height, seed: state.world.seed,
    wars, battle: state.battle && involved(state.battle) ? cloneCampaignBattle(state.battle) : null,
    battleReports: state.battleReports.filter(involved).map(cloneCampaignBattle),
    diplomacy, sieges: observeSieges(state, factionId),
    visibleSiegeSettlementIds: settlements.filter(town => visible.has(town.cell) && state.sieges[town.id]).map(town => town.id),
    progression: getProgressionObservation(state, factionId), projects: state.projects.map(project => ({ ...project })), victory: state.victory ? { ...state.victory } : null,
    pendingCapture: state.pendingCapture?.factionId === factionId ? { ...state.pendingCapture, options: state.pendingCapture.options.map(option => ({ ...option })) } : null,
    ruins: Object.values(state.ruins).filter(ruin => visible.has(ruin.cell)).sort(compareId).map(ruin => ({ ...ruin })),
  };
}
