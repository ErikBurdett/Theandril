import { describe, expect, it } from 'vitest';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import fc from 'fast-check';
import { checksum } from '@theandril/content';
import { WATER_DEPTH, deriveWaterDepth, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, serializeGame, stateHash, type CampaignBattle, type GameCommand, type GameState } from './index';
import { chooseBattleOrder } from './combat';
import { fleetCargo, fleetTransportCapacity, fleetTransportUsed, reconcileFleetCargo } from './naval';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';

const factionId = 'faction.ashen_compact', rival = 'faction.reedbound_council';
const end: GameCommand = { type: 'endTurn', factionId };
const embark: GameCommand = { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId };
const ocean: GameCommand = { type: 'research', factionId, technologyId: 'technology.ocean_navigation' };
function issue(state: GameState, command: GameCommand): void { const result = applyCommand(state, command); expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true); }
function reject(state: GameState, command: unknown, reason?: RegExp): void {
  const before = stateHash(state), result = applyCommand(state, command);
  expect(result.ok, JSON.stringify(command)).toBe(false); if (reason) expect(result.error).toMatch(reason); expect(stateHash(state)).toBe(before);
}
const restore = (state: GameState): GameState => deserializeGame(serializeGame(state));
function addFormations(state: GameState, armyId: string, count: number, unitId: string): void {
  const army = state.armies[armyId]!;
  for (let i = 0; i < count; i++) army.formations.push(createArmyFormation('army.' + state.nextId++, unitId));
  army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
}

describe('canonical shore, deep-ocean and transport travel', () => {
  it('saves an interrupted deep-water route after merging a coastal hull and replans with current hull restrictions', () => {
    const state = navalCampaign({ enemyFleet: false }); issue(state, ocean);
    for (const target of [N.shallowCell, N.fleetCell, N.shallowCell, N.fleetCell]) issue(state, { type: 'move', factionId, armyId: N.fleetId, target });
    issue(state, { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell });
    issue(state, { type: 'moveTo', factionId, armyId: N.coastalId, target: N.fleetCell });
    issue(state, { type: 'mergeArmies', factionId, sourceArmyId: N.coastalId, targetArmyId: N.fleetId });
    expect(state.routes[N.fleetId]).toMatchObject({ status: 'paused', pauseReason: expect.stringMatching(/composition/i) });
    const resumed = restore(state); expect(stateHash(resumed)).toBe(stateHash(state));
    issue(resumed, end); expect(resumed.armies[N.fleetId]!.cell).toBe(N.fleetCell);
    reject(resumed, { type: 'resumeMovement', factionId, armyId: N.fleetId });
    issue(resumed, { type: 'cancelMovement', factionId, armyId: N.fleetId });
    expect(stateHash(restore(resumed))).toBe(stateHash(resumed));
  });
  it('uses the same domain and researched hull rules for previews and immediate movement', () => {
    const state = navalCampaign({ enemyFleet: false });
    expect(state.world.waterDepth[N.shallowCell]).toBe(WATER_DEPTH.shallow);
    expect(state.world.waterDepth[N.deepCell]).toBe(WATER_DEPTH.deep);
    expect(getMovementQuery(getObservation(state, factionId), N.fleetId, N.shallowCell).preview).toMatchObject({ canMoveNow: true, cost: 1 });
    expect(getMovementQuery(getObservation(state, factionId), N.fleetId, N.deepCell).preview).toMatchObject({ canMoveNow: false, canQueue: false, blocker: expect.stringMatching(/Deep ocean/) });
    reject(state, { type: 'moveTo', factionId, armyId: N.cargoId, target: N.fleetCell }, /transport|Water/);
    reject(state, { type: 'moveTo', factionId, armyId: N.fleetId, target: N.homeCell }, /water/);
    issue(state, { type: 'move', factionId, armyId: N.fleetId, target: N.shallowCell });
    reject(state, { type: 'move', factionId, armyId: N.fleetId, target: N.deepCell }, /Deep ocean/);
    const before = state.factions[0]!.knowledge; issue(state, ocean);
    expect(state.factions[0]!.knowledge).toBe(before - 80);
    issue(state, { type: 'move', factionId, armyId: N.fleetId, target: N.deepCell });
    expect(getObservation(state, factionId).armies.find(army => army.id === N.fleetId)).toMatchObject({ domain: 'naval', canEnterDeepWater: true });
    expect(getMovementQuery(getObservation(state, factionId), N.coastalId, N.deepCell).preview).toMatchObject({ canMoveNow: false, canQueue: false });
    expect(stateHash(restore(state))).toBe(stateHash(state));
  });

  it('preserves mixed formations, an officer and spent movement through a saved queued ocean voyage', () => {
    const state = navalCampaign({ enemyFleet: false });
    issue(state, { type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
    const roster = structuredClone(state.armies[N.cargoId]!.formations), officer = structuredClone(state.characters[N.marshalId]);
    issue(state, ocean); issue(state, embark);
    expect(state.transports).toEqual({ [N.cargoId]: N.fleetId });
    expect(state.armies[N.fleetId]!.movement).toBe(3); expect(state.armies[N.cargoId]!.movement).toBe(0);
    expect(getObservation(state, factionId).armies.find(army => army.id === N.cargoId)).toMatchObject({ carrierId: N.fleetId, canFound: false, canAttack: false });
    for (const command of [
      { type: 'found', factionId, armyId: N.cargoId, name: 'Impossible hearth' },
      { type: 'move', factionId, armyId: N.cargoId, target: N.homeCell },
      { type: 'queueMovement', factionId, armyId: N.cargoId, target: N.landingCell },
      { type: 'splitArmy', factionId, armyId: N.cargoId, formationIds: [roster[0]!.id] },
      { type: 'splitArmy', factionId, armyId: N.fleetId, formationIds: [state.armies[N.fleetId]!.formations[0]!.id] },
    ]) reject(state, command);
    issue(state, { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell });
    expect(state.armies[N.cargoId]!.cell).toBe(state.armies[N.fleetId]!.cell);
    const mirrored = restore(state);
    for (const game of [state, mirrored]) {
      for (let turns = 0; turns < 4 && (game.routes[N.fleetId] || !game.armies[N.fleetId]!.movement); turns++) issue(game, end);
      issue(game, { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell });
    }
    expect(stateHash(state)).toBe(stateHash(mirrored)); expect(state.transports).toEqual({});
    expect(state.armies[N.cargoId]).toMatchObject({ cell: N.landingCell, movement: 0, formations: roster });
    expect(state.characters[N.marshalId]).toEqual(officer);
    expect(state.armies[N.fleetId]!.movement).toBe(4);
    reject(state, { type: 'move', factionId, armyId: N.cargoId, target: N.landingCell + 1 }, /movement/);
    issue(state, end); issue(state, { type: 'move', factionId, armyId: N.cargoId, target: N.landingCell + 1 });
    expect(stateHash(restore(state))).toBe(stateHash(state));
  });

  it('enforces whole-army space, ownership, movement, blocked landings and no mixed land/hull containers', () => {
    let state = navalCampaign({ enemyFleet: false });
    state.armies[N.fleetId]!.formations.splice(1); addFormations(state, N.cargoId, 7, 'unit.guard'); state = restore(state);
    reject(state, embark, /spaces/);
    reject(state, { ...embark, factionId: rival }, /control/);
    state.armies[N.cargoId]!.formations.pop(); state = restore(state);
    issue(state, embark); reject(state, embark, /embarked/);
    reject(state, { type: 'mergeArmies', factionId, sourceArmyId: N.cargoId, targetArmyId: N.fleetId });
    reject(state, { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.shallowCell }, /land/);
    reject(state, { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell }, /adjacent/);
    const view = getObservation(state, factionId).armies.find(army => army.id === N.fleetId)!;
    expect(view.transportUsed).toBe(8); expect(view.transportCapacity).toBe(8);
    issue(state, { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.homeCell });
    reject(state, embark, /movement/);
  });

  it('pauses a sailing route on newly sighted hostiles and preserves passengers across save and cancellation', () => {
    const state = navalCampaign(); issue(state, ocean); issue(state, embark);
    // Contact and war are ordinary public rules; a coastal ship spots the distant fleet first.
    state.armies[N.coastalId]!.cell = N.landingWaterCell + 48;
    refreshAuthoredSight(state);
    const scouted = restore(state); issue(scouted, { type: 'declareWar', factionId, targetFactionId: rival });
    scouted.armies[N.coastalId]!.cell = N.coastalCell; refreshAuthoredSight(scouted); const game = restore(scouted);
    issue(game, { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.voyageCell });
    issue(game, end);
    expect(game.routes[N.fleetId]).toMatchObject({ status: 'paused', pauseReason: expect.stringMatching(/hostile|enemy/i) });
    expect(game.armies[N.cargoId]!.cell).toBe(game.armies[N.fleetId]!.cell);
    expect(stateHash(restore(game))).toBe(stateHash(game));
    issue(game, { type: 'cancelMovement', factionId, armyId: N.fleetId });
    expect(game.routes[N.fleetId]).toBeUndefined(); expect(fleetTransportUsed(game, N.fleetId)).toBe(2);
  });
});

describe('funded harbors and actual naval recruitment', () => {
  it('checks coastal construction, technologies and harbor facilities before taking coin; launches real hulls on water', () => {
    const state = navalCampaign({ enemyFleet: false }), town = state.settlements[N.homeId]!;
    const coin = state.factions[0]!.treasury;
    reject(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.ocean_warship' }, /Ocean navigation/);
    town.buildings = town.buildings.filter(id => id !== 'building.harbor');
    reject(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.transport' }, /harbor/i);
    expect(state.factions[0]!.treasury).toBe(coin);
    issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'building.harbor' });
    for (let i = 0; i < 10 && !town.buildings.includes('building.harbor'); i++) issue(state, end);
    expect(town.buildings).toContain('building.harbor');
    const before = new Set(Object.keys(state.armies)); issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.transport' });
    for (let i = 0; i < 10 && town.queue.length; i++) issue(state, end);
    const fleet = Object.values(state.armies).find(army => !before.has(army.id))!;
    expect(fleet.formations[0]!.unitId).toBe('unit.transport'); expect(state.world.terrain[fleet.cell]).toBe(0);
    expect(fleetTransportCapacity(fleet)).toBe(8); expect(stateHash(restore(state))).toBe(stateHash(state));
  });
});

/** Explicit near-wreck trapped in a cove by intact warships. Only setup is authored; loss is real combat. */
function doomedConvoy(): GameState {
  let state = navalCampaign();
  delete state.armies[N.coastalId];
  for (const cell of neighbors(N.fleetCell, state.world.width, state.world.height)) if (cell !== N.shallowCell) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.fertility[cell] = 65;
  }
  state.world.waterDepth = deriveWaterDepth(state.world.width, state.world.height, state.world.terrain);
  state.armies[N.fleetId]!.formations.splice(1);
  state.armies[N.fleetId]!.formations[0]!.strength = 1;
  state.armies[N.fleetId]!.formations[0]!.morale = 1;
  state.armies[N.enemyFleetId]!.cell = N.shallowCell;
  addFormations(state, N.enemyFleetId, 2, 'unit.coastal_warship');
  rebaseAuthoredLand(state);
  state = restore(state);
  issue(state, { type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
  issue(state, embark); issue(state, { type: 'declareWar', factionId, targetFactionId: rival });
  issue(state, { type: 'attack', factionId, armyId: N.fleetId, targetArmyId: N.enemyFleetId });
  return state;
}

describe('naval combat, hidden cargo and casualty evidence', () => {
  it('uses the same manual/autoresolve kernel, destroys actual cargo/officers after sinking, and seals its report', () => {
    const state = doomedConvoy(), mirrored = restore(state);
    expect(state.battle).toMatchObject({ domain: 'naval', transportSnapshots: [{ armyId: N.cargoId, fleetId: N.fleetId, factionId }] });
    expect(state.battle!.characterSnapshots).toEqual([]); // Passengers do not command the fleet.
    expect(getObservation(state, rival).battle!.transportSnapshots).toEqual([]);
    expect(getObservation(state, rival).armies.some(army => army.id === N.cargoId)).toBe(false);
    issue(state, { type: 'autoResolveBattle', factionId });
    while (mirrored.battle) issue(mirrored, { type: 'battleOrder', factionId, order: chooseBattleOrder(mirrored.battle.combat, 'attacker') });
    expect(stateHash(state)).toBe(stateHash(mirrored));
    expect(state.armies[N.fleetId]).toBeUndefined(); expect(state.armies[N.cargoId]).toBeUndefined(); expect(state.transports).toEqual({});
    expect(state.characters[N.marshalId]).toMatchObject({ dead: true, location: null });
    const report = state.battleReports.at(-1)!;
    expect(report.transportAftermath).toEqual([{ armyId: N.cargoId, name: N.cargoName, outcome: 'lost', lostFormationIds: [...report.transportSnapshots[0]!.formationIds].reverse() }]);
    expect(getObservation(state, rival).battleReports.at(-1)!.transportAftermath).toEqual([]);
    expect(getObservation(state, factionId).battleReports.at(-1)!.transportAftermath).toEqual(report.transportAftermath);
    expect(stateHash(restore(state))).toBe(stateHash(state));
  });

  it('loses only unsupported formations, in stable order, as surviving hull capacity decreases', () => {
    fc.assert(fc.property(fc.integer({ min: 2, max: 12 }), count => {
      let state = navalCampaign({ enemyFleet: false });
      state.armies[N.fleetId]!.formations.splice(2); addFormations(state, N.cargoId, count - 2, 'unit.guard'); state = restore(state); issue(state, embark);
      const original = state.armies[N.cargoId]!.formations.map(item => item.id);
      state.armies[N.fleetId]!.formations.splice(1); // Unit-level input: one hull survived the battle.
      const aftermath = reconcileFleetCargo(state, N.fleetId, []);
      expect(fleetTransportUsed(state, N.fleetId)).toBe(Math.min(count, 8));
      expect(aftermath.flatMap(item => item.lostFormationIds)).toEqual([...original].reverse().slice(0, Math.max(0, count - 8)));
      expect(fleetCargo(state, N.fleetId)[0]!.formations.map(item => item.id)).toEqual(original.slice(0, Math.min(count, 8)));
      expect(stateHash(restore(state))).toBe(stateHash(state));
    }), { numRuns: 12, seed: 20260905 });
  });

  it('rejects forged drowned formation evidence even with a recomputed save checksum', () => {
    const state = doomedConvoy(); issue(state, { type: 'autoResolveBattle', factionId });
    for (const mutate of [
      (battle: CampaignBattle) => { battle.transportAftermath = []; },
      (battle: CampaignBattle) => { battle.transportAftermath[0]!.lostFormationIds.pop(); },
      (battle: CampaignBattle) => { battle.transportSnapshots[0]!.fleetId = N.cargoId; },
      (battle: CampaignBattle) => { battle.transportSnapshots[0]!.formationIds.push(battle.formationBindings[0]!.formationId); },
    ]) {
      const save = JSON.parse(serializeGame(state)); mutate(save.state.battleReports[0]); save.stateChecksum = checksum(JSON.stringify(save.state));
      expect(() => deserializeGame(JSON.stringify(save))).toThrow(/cargo/i);
    }
  });
});

describe('strict saved naval state', () => {
  it.each(['duplicate', 'wrong owner', 'missing hull', 'cargo movement', 'cargo location', 'hull on land', 'coastal hull in deep water', 'mixed domain', 'depth on land'] as const)('rejects %s without repairing it', kind => {
    const state = navalCampaign(); issue(state, embark);
    const save = JSON.parse(serializeGame(state));
    const cargo = save.state.armies.find((army: { id: string }) => army.id === N.cargoId), fleet = save.state.armies.find((army: { id: string }) => army.id === N.fleetId);
    switch (kind) {
      case 'duplicate': save.state.transports.push({ ...save.state.transports[0] }); break;
      case 'wrong owner': cargo.factionId = rival; break;
      case 'missing hull': save.state.transports[0].fleetId = 'army.99999'; break;
      case 'cargo movement': cargo.movement = 1; break;
      case 'cargo location': cargo.cell = N.homeCell; break;
      case 'hull on land': fleet.cell = N.homeCell; break;
      case 'coastal hull in deep water': fleet.cell = N.deepCell; cargo.cell = N.deepCell; break;
      case 'mixed domain': fleet.formations[0].unitId = 'unit.guard'; break;
      case 'depth on land': save.state.world.waterDepth[N.homeCell] = WATER_DEPTH.shallow; break;
    }
    save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });
});
