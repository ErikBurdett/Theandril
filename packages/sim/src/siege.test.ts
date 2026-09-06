import { createArmyFormation } from './army-composition';
import { describe, expect, it } from 'vitest';
import { checksum, FACTIONS, UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, deserializeGame, getObservation, replayGame, serializeGame, settlementYields, stateHash, validateEndTurn } from './index';
import type { CaptureDecision, CaptureOutcome, GameCommand, GameState, Ruin, Siege } from './index';
import { rebuildIndexes } from './visibility';

const player = CONQUEST_FIXTURE.playerFactionId;
const rival = CONQUEST_FIXTURE.enemyFactionId;
const townId = CONQUEST_FIXTURE.settlementId;
const armyId = CONQUEST_FIXTURE.playerArmyId;
const war: GameCommand = { type: 'declareWar', factionId: player, targetFactionId: rival };
const besiege: GameCommand = { type: 'besiege', factionId: player, armyId, settlementId: townId };
const assault: GameCommand = { type: 'assault', factionId: player, settlementId: townId };
const auto: GameCommand = { type: 'autoResolveBattle', factionId: player };
const end: GameCommand = { type: 'endTurn', factionId: player };
const command = (state: GameState, command: GameCommand) => expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });

function blockaded(state = conquestCampaign()): GameState {
  command(state, war); command(state, besiege);
  return state;
}
function fallen(state = conquestCampaign(), beforeResolution?: (state: GameState) => void): GameState {
  blockaded(state);
  for (let turn = 0; turn < 3; turn++) command(state, end);
  command(state, assault);
  beforeResolution?.(state);
  command(state, auto);
  expect(state.pendingCapture?.settlementId).toBe(townId);
  return state;
}
function capture(state: GameState, outcome: CaptureOutcome): void {
  command(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome });
}
function reject(state: GameState, input: unknown): void {
  const before = stateHash(state);
  expect(applyCommand(state, input).ok).toBe(false);
  expect(stateHash(state)).toBe(before);
}
function requireTown(state: GameState) {
  const town = state.settlements[townId];
  if (!town) throw new Error('Missing fixture town');
  return town;
}

describe('siege economy, combat and control', () => {
  it('exposes visible third-party blockade presence without revealing its private siege record', () => {
    const state = conquestCampaign(); const definition = FACTIONS[2]; const town = requireTown(state);
    const template = state.armies[armyId]!;
    const cell = neighbors(town.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !Object.values(state.armies).some(army => army.cell === cell) && !Object.values(state.settlements).some(town => town.cell === cell));
    if (cell === undefined) throw new Error('Missing third-party deployment position');
    state.factions.push({ id: definition.id, definitionId: definition.id, name: definition.name, color: definition.color, treasury: 60, knowledge: 0 });
    state.progression[definition.id] = { technologies: [], institutionId: null, doctrineId: null };
    state.explored[definition.id] = new Set();
    state.world.starts.push(state.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && !state.world.starts.includes(cell)));
    const thirdArmyId = `army.${state.nextId++}`;
    state.armies[thirdArmyId] = { ...template, id: thirdArmyId, factionId: definition.id, cell, formations: [createArmyFormation(thirdArmyId, template.formations[0]!.unitId)] };
    rebaseAuthoredLand(state);
    command(state, { type: 'declareWar', factionId: definition.id, targetFactionId: rival });
    command(state, { type: 'besiege', factionId: definition.id, armyId: thirdArmyId, settlementId: town.id });
    const view = getObservation(state, player);
    expect(view.sieges).toEqual([]); expect(view.visibleSiegeSettlementIds).toEqual([town.id]);
    const before = stateHash(state); view.visibleSiegeSettlementIds.length = 0; expect(stateHash(state)).toBe(before);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(before);
    // Move only authored sight sources away: explored-but-unseen siege presence is not disclosed.
    const home = Object.values(state.settlements).find(town => town.factionId === player)!;
    home.cell = state.world.starts[1]!; template.cell = home.cell; rebaseAuthoredLand(state);
    expect(state.explored[player]?.has(town.cell)).toBe(true);
    expect(getObservation(state, player).visibleSiegeSettlementIds).toEqual([]);
    expect(getObservation(state, player).sieges).toEqual([]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('blockades actual yields and wears down defenses and stores over three turns', () => {
    const state = conquestCampaign();
    const yields = settlementYields(state, requireTown(state));
    blockaded(state);
    expect(settlementYields(state, requireTown(state))).toEqual({ food: 0, industry: Math.floor(yields.industry / 2), coin: Math.floor(yields.coin / 2), knowledge: Math.floor(yields.knowledge / 2) });
    expect(state.sieges[townId]).toMatchObject({ defenses: 30, supplies: 3 });
    expect(getObservation(state, player).sieges[0]?.canAssault).toBe(false);
    for (let turn = 0; turn < 3; turn++) command(state, end);
    expect(state.sieges[townId]).toMatchObject({ defenses: 0, supplies: 0, militiaMorale: 65 });
    expect(getObservation(state, player).sieges[0]?.canAssault).toBe(true);
    expect(getObservation(state, rival).sieges[0]?.canAssault).toBe(false);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('rejects illegal siege, assault and capture requests atomically', () => {
    const state = conquestCampaign();
    reject(state, besiege); reject(state, assault);
    reject(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'raze' });
    command(state, war);
    reject(state, { ...besiege, factionId: rival });
    reject(state, { ...besiege, settlementId: 'settlement.unknown' });
    reject(state, { ...besiege, armyId: 'army.unknown' });
    command(state, besiege);
    reject(state, besiege); reject(state, assault);
    reject(state, { type: 'liftSiege', factionId: rival, settlementId: townId });
    reject(state, { type: 'move', factionId: player, armyId, target: requireTown(state).cell });
    reject(state, { ...assault, waiveCost: true });
  });

  it('lifting the siege restores settlement yields without awarding capture', () => {
    const state = conquestCampaign();
    const yields = settlementYields(state, requireTown(state));
    blockaded(state);
    command(state, { type: 'liftSiege', factionId: player, settlementId: townId });
    expect(state.sieges[townId]).toBeUndefined();
    expect(settlementYields(state, requireTown(state))).toEqual(yields);
    expect(state.pendingCapture).toBeNull();
  });

  it('assaults an empty settlement through real militia formations and saves tactical progress', () => {
    const state = blockaded();
    const initial = serializeGame(state);
    const commands: GameCommand[] = [end, assault, { type: 'battleOrder', factionId: player, order: 'brace' }];
    for (const value of commands) command(state, value);
    expect(state.battle?.settlementId).toBe(townId);
    expect(state.battle?.militiaId).toBe(`militia.${townId}`);
    expect(state.battle?.fortification).toBe(2);
    expect(state.battle?.combat.defender[0]?.armor).toBe((UNITS.find(unit => unit.id === 'unit.guard')?.armor ?? 0) + 2);
    expect(state.battle?.combat.round).toBe(1);
    const resumed = deserializeGame(serializeGame(state));
    command(state, auto); command(resumed, auto);
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(stateHash(replayGame(initial, [...commands, auto]))).toBe(stateHash(state));
  });

  it('routes a besieger when a relief army wins and removes the blockade', () => {
    const state = blockaded();
    const besieger = state.armies[armyId];
    const guard = UNITS.find(unit => unit.id === 'unit.guard');
    if (!besieger || !guard) throw new Error('Missing relief fixture unit');
    const id = `army.${state.nextId++}`;
    state.armies[id] = { ...besieger, id, factionId: rival, cell: requireTown(state).cell, movement: guard.movement, formations: [createArmyFormation(id, guard.id)] };
    rebuildIndexes(state);
    command(state, { type: 'attack', factionId: rival, armyId: id, targetArmyId: armyId });
    command(state, { type: 'battleOrder', factionId: player, order: 'withdraw' });
    expect(state.sieges[townId]).toBeUndefined();
    expect(state.pendingCapture).toBeNull();
    expect(settlementYields(state, requireTown(state)).food).toBeGreaterThan(0);
    expect(state.events.some(event => event.type === 'siege_lifted')).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('requires a siege to attack stationed garrisons and preserves every fortified formation', () => {
    const state = conquestCampaign();
    const attacker = state.armies[armyId];
    if (!attacker) throw new Error('Missing attacker');
    const defenderIds: string[] = [];
    for (const unitId of ['unit.guard', 'unit.scout']) {
      const unit = UNITS.find(unit => unit.id === unitId);
      if (!unit) throw new Error('Missing garrison definition');
      const id = `army.${state.nextId++}`;
      state.armies[id] = { ...attacker, id, name: unit.name, factionId: rival, cell: requireTown(state).cell, movement: unit.movement, formations: [createArmyFormation(id, unitId)] };
      defenderIds.push(id);
    }
    refreshAuthoredSight(state);
    command(state, war);
    reject(state, { type: 'attack', factionId: player, armyId, targetArmyId: defenderIds[0] });
    const initial = serializeGame(state);
    const commands: GameCommand[] = [besiege, end, assault, { type: 'battleOrder', factionId: player, order: 'brace' }];
    for (const value of commands) command(state, value);
    expect(state.battle?.militiaId).toBeNull();
    expect(state.battle?.defenderIds).toEqual(defenderIds.sort());
    expect(state.battle?.combat.defender).toHaveLength(2);
    expect(state.battle?.fortification).toBe(2);
    for (const formation of state.battle?.combat.defender ?? []) {
      expect(formation.armor).toBe((UNITS.find(unit => unit.id === formation.unitId)?.armor ?? 0) + 2);
      const binding = state.battle?.formationBindings.find(item => item.battleFormationId === formation.id);
      expect(state.armies[binding?.armyId ?? '']?.movement).toBe(0);
    }
    const resumed = deserializeGame(serializeGame(state));
    command(state, auto); command(resumed, auto);
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(stateHash(replayGame(initial, [...commands, auto]))).toBe(stateHash(state));
  });

  it('ends blockades when a validated peace agreement removes the war', () => {
    const state = blockaded();
    command(state, { type: 'proposePeace', factionId: player, targetFactionId: rival, terms: { offerCoin: 10, requestCoin: 0, truceTurns: 5 } });
    const offer = state.diplomacy.offers[0];
    if (!offer) throw new Error('Missing offer');
    command(state, { type: 'respondPeace', factionId: rival, offerId: offer.id, accept: true });
    expect(state.sieges).toEqual({});
    expect(state.wars).toEqual([]);
    reject(state, assault); reject(state, war);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });
});

describe('settlement capture consequences', () => {
  it('requires the capturer to choose a valid consequence before further strategy', () => {
    const state = fallen();
    reject(state, end);
    reject(state, { type: 'resolveCapture', factionId: rival, settlementId: townId, outcome: 'occupy' });
    reject(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'liberate' });
    reject(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'client' });
    expect(validateEndTurn(state, end).ok).toBe(false);
    expect(getObservation(state, rival).pendingCapture).toBeNull();
    const view = getObservation(state, player);
    if (view.pendingCapture?.options[0]) view.pendingCapture.options[0].coinGain = 999;
    expect(state.pendingCapture?.options[0]?.coinGain).toBe(0);
  });

  it('occupies intact settlements with recovery penalties and transfers vision', () => {
    const state = fallen();
    const town = requireTown(state);
    const population = town.population; const buildings = [...town.buildings];
    const originalFood = settlementYields(state, town).food;
    capture(state, 'occupy');
    expect(town.factionId).toBe(player); expect(town.founderFactionId).toBe(rival);
    expect(town.population).toBe(population); expect(town.buildings).toEqual(buildings.sort());
    expect(town).toMatchObject({ devastation: 20, occupationTurns: 3, queue: [] });
    expect(state.armies[armyId]?.cell).toBe(town.cell);
    expect(state.sieges[townId]).toBeUndefined(); expect(state.pendingCapture).toBeNull();
    expect(settlementYields(state, town).food).toBeGreaterThanOrEqual(originalFood);
    expect(getObservation(state, rival).settlements.some(other => other.id === townId)).toBe(false);
    for (let turn = 0; turn < 4; turn++) command(state, end);
    expect(town.devastation).toBe(0); expect(town.occupationTurns).toBe(0);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('sacks with exact bounded loot, population and building loss', () => {
    const state = fallen(undefined, campaign => {
      const capturer = campaign.factions.find(faction => faction.id === player);
      if (capturer) capturer.treasury = 1_000_000_000 - 5;
    });
    const town = requireTown(state);
    const option = state.pendingCapture?.options.find(option => option.outcome === 'sack');
    const victim = state.factions.find(faction => faction.id === rival);
    if (!option || !victim) throw new Error('Missing sack option');
    expect(option.coinGain).toBe(5);
    const population = town.population; const buildings = town.buildings.length; const treasury = victim.treasury;
    capture(state, 'sack');
    expect(state.factions.find(faction => faction.id === player)?.treasury).toBe(1_000_000_000);
    expect(victim.treasury).toBe(treasury - 5);
    expect(town.population).toBe(population - option.populationLoss);
    expect(town.buildings).toHaveLength(buildings - option.buildingsLost);
    expect(town).toMatchObject({ devastation: 60, occupationTurns: 5, food: 0, queue: [], factionId: player });
    expect(state.diplomacy.relations[0]?.grievances).toBeGreaterThan(15);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('liberates only to a distinct original founder and keeps the attacker outside', () => {
    const state = conquestCampaign();
    const definition = FACTIONS[2];
    const start = state.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && !state.world.starts.includes(cell));
    state.factions.push({ id: definition.id, definitionId: definition.id, name: definition.name, color: definition.color, treasury: 60, knowledge: 0 });
    state.progression[definition.id] = { technologies: [], institutionId: null, doctrineId: null };
    state.world.starts.push(start); state.explored[definition.id] = new Set();
    requireTown(state).founderFactionId = definition.id;
    rebaseAuthoredLand(state);
    fallen(state);
    expect(state.pendingCapture?.options.some(option => option.outcome === 'liberate')).toBe(true);
    expect(getObservation(state, player).factions.some(faction => faction.id === definition.id && faction.name === definition.name)).toBe(true);
    capture(state, 'liberate');
    const town = requireTown(state);
    expect(town).toMatchObject({ factionId: definition.id, founderFactionId: definition.id, devastation: 10, occupationTurns: 1 });
    expect(state.armies[armyId]?.cell).not.toBe(town.cell);
    expect(getObservation(state, definition.id).settlements.some(other => other.id === townId)).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('razes to a visible ruin and consumes it through normal caravan founding', () => {
    const state = fallen();
    const town = requireTown(state);
    const cell = town.cell;
    capture(state, 'raze');
    expect(state.settlements[townId]).toBeUndefined();
    expect(state.ruins[townId]).toMatchObject({ cell, name: town.name, founderFactionId: rival, razedByFactionId: player });
    expect(getObservation(state, player).ruins).toHaveLength(1);
    expect(getObservation(state, rival).ruins).toEqual([]);
    const home = Object.values(state.settlements).find(town => town.factionId === player);
    if (!home) throw new Error('Missing home');
    command(state, { type: 'queue', factionId: player, settlementId: home.id, itemId: 'unit.colonist' });
    for (let turn = 0; turn < 6; turn++) command(state, end);
    const caravan = Object.values(state.armies).find(army => army.formations[0]?.unitId === 'unit.colonist');
    if (!caravan) throw new Error('Missing caravan');
    const previous = new Map([[caravan.cell, caravan.cell]]); const frontier = [caravan.cell];
    for (let index = 0; index < frontier.length && !previous.has(cell); index++) {
      const next = frontier[index];
      if (next === undefined) break;
      for (const adjacent of neighbors(next, state.world.width, state.world.height)) if (!previous.has(adjacent) && isPassable(state.world.terrain[adjacent] ?? 0)) { previous.set(adjacent, next); frontier.push(adjacent); }
    }
    const path: number[] = []; let cursor = cell;
    while (cursor !== caravan.cell) { path.unshift(cursor); cursor = previous.get(cursor) ?? caravan.cell; }
    for (const target of path) {
      const cost = state.world.terrain[target] === 1 ? 1 : 2;
      if (caravan.movement < cost) command(state, end);
      command(state, { type: 'move', factionId: player, armyId: caravan.id, target });
    }
    if (caravan.movement < 1) command(state, end);
    command(state, { type: 'found', factionId: player, armyId: caravan.id, name: 'New Reedwatch' });
    expect(state.ruins).toEqual({}); expect(state.armies[caravan.id]).toBeUndefined();
    const rebuilt = Object.values(state.settlements).find(town => town.cell === cell);
    expect(rebuilt).toMatchObject({ factionId: player, founderFactionId: player, population: 1, devastation: 0 });
    expect(rebuilt?.id).not.toBe(townId);
    expect(state.events.some(event => event.type === 'settlement_resettled')).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });
});

interface SiegeSave {
  stateChecksum: string;
  state: { sieges: Siege[]; pendingCapture: CaptureDecision | null; ruins: Ruin[]; turn: number; armies: GameState['armies'][string][] };
}
describe('siege save integrity', () => {
  const corruptions: [string, (save: SiegeSave) => void][] = [
    ['unknown besieger', save => { if (save.state.sieges[0]) save.state.sieges[0].armyId = 'army.999'; }],
    ['wrong siege owner', save => { if (save.state.sieges[0]) save.state.sieges[0].factionId = rival; }],
    ['duplicated siege', save => { if (save.state.sieges[0]) save.state.sieges.push(save.state.sieges[0]); }],
    ['future siege', save => { if (save.state.sieges[0]) save.state.sieges[0].startedTurn = 999; }],
    ['forged capture options', save => { if (save.state.pendingCapture?.options[0]) save.state.pendingCapture.options[0].coinGain = 999; }],
    ['capture from previous turn', save => { save.state.turn++; }],
    ['wrong capturer', save => { if (save.state.pendingCapture) save.state.pendingCapture.factionId = rival; }],
    ['unspent capturer movement', save => { if (save.state.armies[0]) save.state.armies[0].movement = 3; }],
  ];
  it.each(corruptions)('rejects %s despite a recomputed checksum', (_label, mutate) => {
    const save: SiegeSave = JSON.parse(serializeGame(fallen()));
    mutate(save); save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });
});
