import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { checksum, UNITS } from '@theandril/content';
import { deriveBiomes, deriveWaterDepth } from '@theandril/mapgen';
import { applyCommand, applyCommandForVersion, armyCanAttack, armyCanFound, armyMovement, armySight, armyStrength, armyUpkeep, battleReportForVersion, createArmyFormation, createGame, deserializeGame, getMovementQuery, getObservation, replayGame, serializeGame, serializeGameForVersion, settlementYields, stateHash, stateHashForVersion, type Army, type GameCommand, type GameState } from './index';
import { rebuildIndexes } from './visibility';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { characterCampaign } from '../../test-fixtures/src/character-fixture';
import { armyCommandCapacity } from './characters';
import legacy from './fixtures/v5-army-replay.json';

const factionId = 'faction.ashen_compact';
const end: GameCommand = { type: 'endTurn', factionId };
const merge: GameCommand = { type: 'mergeArmies', factionId, sourceArmyId: 'army.1', targetArmyId: 'army.2' };
const issue = (state: GameState, command: GameCommand): void => { expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true }); };
const reject = (state: GameState, command: unknown): void => { const hash = stateHash(state); expect(applyCommand(state, command).ok).toBe(false); expect(stateHash(state)).toBe(hash); };
function field(rulesVersion: 15 | 16 = 16): GameState {
  const state = createGame({ rulesVersion, seed: 88, size: 'tiny', factionCount: 1, pace: 'short', generatorVersion: 2 });
  state.resources.deposits = {}; // The entire physical map is authored below.
  state.world.terrain.fill(1); state.world.biome = deriveBiomes(state.world.seed, state.world.width, state.world.height, state.world.terrain, state.world.generatorVersion);
  state.world.waterDepth = deriveWaterDepth(state.world.width, state.world.height, state.world.terrain);
  for (const army of Object.values(state.armies)) army.cell = 100;
  state.armies['army.1']!.formations = [createArmyFormation('army.1', 'unit.guard')];
  state.explored[factionId] = new Set(state.world.terrain.keys());
  rebuildIndexes(state); return deserializeGame(serializeGame(state));
}
function addDetachment(state: GameState, template: Army, unitId: string): string {
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: template.factionId, name: UNITS.find(item => item.id === unitId)!.name, cell: template.cell, movement: 0, formations: [createArmyFormation(id, unitId)] };
  rebuildIndexes(state); return id;
}

describe('real army formation containers', () => {
  it('inherits a marshal on full merge, preserves over-command troops after reassignment and permits repair without free movement', () => {
    const state = characterCampaign(), source = state.armies['army.2']!, target = Object.values(state.armies).find(item => item.id !== source.id)!;
    issue(state, { type: 'recruitCharacter', factionId, settlementId: 'settlement.5', definitionId: 'character.marshal' });
    const marshal = Object.values(state.characters)[0]!;
    issue(state, { type: 'assignCharacter', factionId, characterId: marshal.id, armyId: source.id });
    while (source.formations.length < 10) source.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.guard'));
    while (target.formations.length < 6) target.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.guard'));
    source.formations.sort((a, b) => a.id < b.id ? -1 : 1); target.formations.sort((a, b) => a.id < b.id ? -1 : 1);
    const option = getObservation(state, factionId).armies.find(item => item.id === source.id)!.mergeOptions.find(item => item.armyId === target.id)!;
    expect(option).toMatchObject({ canMerge: true, resultCapacity: 16, transferLimit: 6 });
    issue(state, { type: 'mergeArmies', factionId, sourceArmyId: source.id, targetArmyId: target.id });
    expect(target.formations).toHaveLength(16); expect(target.movement).toBe(3); expect(armyCommandCapacity(state, target)).toBe(16);
    reject(state, { type: 'splitArmy', factionId, armyId: target.id, formationIds: target.formations.slice(0, 13).map(item => item.id) });
    issue(state, { type: 'unassignCharacter', factionId, characterId: marshal.id, settlementId: 'settlement.5' });
    expect(target.formations).toHaveLength(16); expect(target.movement).toBe(1);
    expect(getObservation(state, factionId).armies.find(item => item.id === target.id)).toMatchObject({ overCommand: true, maxMovement: 1, formationCapacity: 12 });
    const extra = addDetachment(state, target, 'unit.guard'); reject(state, { type: 'mergeArmies', factionId, sourceArmyId: extra, targetArmyId: target.id });
    issue(state, { type: 'assignCharacter', factionId, characterId: marshal.id, armyId: target.id });
    expect(target.movement).toBe(1); expect(armyCommandCapacity(state, target)).toBe(16);
    issue(state, { type: 'unassignCharacter', factionId, characterId: marshal.id, settlementId: 'settlement.5' });
    const ids = target.formations.map(item => item.id);
    issue(state, { type: 'splitArmy', factionId, armyId: target.id, formationIds: ids.slice(0, 4) });
    expect(target.formations).toHaveLength(12); expect(target.movement).toBe(1);
    expect(Object.values(state.armies).flatMap(army => army.formations).map(item => item.id).sort()).toEqual([...ids, state.armies[extra]!.formations[0]!.id].sort());
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });
  it('recruits a formation through normal production, merges it, and charges summed upkeep', () => {
    const state = createGame({ seed: 88, size: 'tiny', factionCount: 1 });
    issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Mixed Hearth' });
    const town = Object.values(state.settlements)[0]!;
    issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.guard' });
    for (let turn = 0; turn < 4; turn++) issue(state, end);
    const guard = Object.values(state.armies).find(army => army.formations[0]?.unitId === 'unit.guard')!;
    const guardId = guard.formations[0]!.id;
    issue(state, { type: 'mergeArmies', factionId, sourceArmyId: guard.id, targetArmyId: 'army.2' });
    expect(state.armies[guard.id]).toBeUndefined();
    const army = state.armies['army.2']!;
    expect(army.formations.map(item => item.id)).toContain(guardId);
    expect(armyStrength(army)).toBe(80); expect(armyMovement(army)).toBe(3); expect(armySight(army)).toBe(4); expect(armyUpkeep(army)).toBe(3);
    const treasury = state.factions[0]!.treasury; const income = settlementYields(state, town).coin;
    const civicUpkeep = getObservation(state, factionId).growth!.civicUpkeep;
    issue(state, end); expect(state.factions[0]!.treasury).toBe(treasury + income - 3 - civicUpkeep);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('pauses shared queued travel on merge and never refunds movement on split or transfer', () => {
    const state = field(); state.armies['army.2']!.movement = 0;
    issue(state, { type: 'queueMovement', factionId, armyId: 'army.2', target: 110 });
    issue(state, merge);
    expect(state.routes['army.2']).toMatchObject({ status: 'paused', origin: 100 });
    expect(state.armies['army.2']!.movement).toBe(0);
    const id = `army.${state.nextId}`;
    issue(state, { type: 'splitArmy', factionId, armyId: 'army.2', formationIds: ['formation.1'], name: 'Separate guard' });
    expect(state.armies[id]).toMatchObject({ movement: 0, cell: 100, name: 'Separate guard' });
    expect(state.armies[id]!.formations[0]!.id).toBe('formation.1');
    issue(state, end); expect(state.armies['army.2']!.cell).toBe(100);
    issue(state, { type: 'resumeMovement', factionId, armyId: 'army.2' });
    expect(state.armies['army.2']!.cell).toBe(105);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('uses the slowest formation for range and exposes a detached authoritative mixed roster', () => {
    const state = field();
    const id = addDetachment(state, state.armies['army.2']!, 'unit.heavy_infantry');
    issue(state, { type: 'mergeArmies', factionId, sourceArmyId: id, targetArmyId: 'army.2' }); issue(state, end);
    const hash = stateHash(state); const view = getObservation(state, factionId); const army = view.armies.find(item => item.id === 'army.2')!;
    expect(view.factionCount).toBe(1);
    expect(army).toMatchObject({ movement: 2, maxMovement: 2, sight: 4, upkeep: 4, strength: 105, maxStrength: 105, canAttack: true, canFound: false });
    expect(getMovementQuery(view, army.id, 103).preview?.canMoveNow).toBe(false);
    army.formations[0]!.strength = 1; army.formations.length = 0; army.strength = 999;
    expect(stateHash(state)).toBe(hash);
  });

  it('consumes only one caravan when a mixed escort army founds a settlement', () => {
    const state = createGame({ seed: 77, size: 'tiny', factionCount: 1 });
    issue(state, merge);
    const army = state.armies['army.2']!;
    expect(armyCanFound(army)).toBe(true); expect(armyCanAttack(army)).toBe(true);
    issue(state, { type: 'found', factionId, armyId: army.id, name: 'Escorted Hearth' });
    expect(state.armies[army.id]?.formations.map(item => item.id)).toEqual(['formation.2']);
    expect(army.movement).toBe(0); expect(armyCanFound(army)).toBe(false);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('recomputes visible sight after transferring the only scouting formation away and moving it', () => {
    const state = field(); issue(state, merge);
    const army = state.armies['army.2']!;
    const id = `army.${state.nextId}`;
    issue(state, { type: 'splitArmy', factionId, armyId: army.id, formationIds: ['formation.2'] });
    issue(state, end); issue(state, { type: 'moveTo', factionId, armyId: id, target: 105 });
    expect(armySight(army)).toBe(2);
    const rebuilt = deserializeGame(serializeGame(state));
    expect(getObservation(state, factionId).cells).toEqual(getObservation(rebuilt, factionId).cells);
  });

  it.each([
    { ...merge, factionId: 'faction.missing' }, { ...merge, targetArmyId: 'army.unknown' },
    { ...merge, targetArmyId: 'army.1' }, { ...merge, formations: [] },
    { type: 'transferFormations', factionId, sourceArmyId: 'army.1', targetArmyId: 'army.2', formationIds: [] },
    { type: 'transferFormations', factionId, sourceArmyId: 'army.1', targetArmyId: 'army.2', formationIds: ['formation.1', 'formation.1'] },
    { type: 'transferFormations', factionId, sourceArmyId: 'army.1', targetArmyId: 'army.2', formationIds: ['formation.2'] },
    { type: 'splitArmy', factionId, armyId: 'army.1', formationIds: ['formation.1'] },
    { type: 'splitArmy', factionId, armyId: 'army.1', formationIds: ['formation.1'], name: '<script>' },
  ])('rejects invalid composition order atomically: %j', command => { reject(field(), command); });

  it('enforces ownership, co-location, battle and twelve-formation capacity', () => {
    const separated = field(); separated.armies['army.1']!.cell = 101; rebuildIndexes(separated); reject(separated, merge);
    const state = field();
    for (let i = 0; i < 11; i++) {
      const id = addDetachment(state, state.armies['army.2']!, 'unit.guard');
      issue(state, { type: 'mergeArmies', factionId, sourceArmyId: id, targetArmyId: 'army.2' });
    }
    expect(state.armies['army.2']!.formations).toHaveLength(12); reject(state, merge);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    const battle = borderBattleCampaign();
    reject(battle, { type: 'mergeArmies', factionId, sourceArmyId: 'army.4', targetArmyId: 'army.2' });
    issue(battle, { type: 'declareWar', factionId, targetFactionId: battle.factions[1]!.id });
    issue(battle, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' });
    reject(battle, { type: 'splitArmy', factionId, armyId: 'army.2', formationIds: ['formation.2'] });
  });

  it('conserves formation identities and state across deterministic merge/split/replay sequences', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), seed => {
      const state = createGame({ seed, size: 'tiny', factionCount: 1 }); const initial = serializeGame(state);
      const commands: GameCommand[] = [merge]; issue(state, merge);
      for (let n = 0; n < 8; n++) {
        const id = `army.${state.nextId}`;
        const split: GameCommand = { type: 'splitArmy', factionId, armyId: 'army.2', formationIds: ['formation.1'] };
        const reunite: GameCommand = { type: 'transferFormations', factionId, sourceArmyId: id, targetArmyId: 'army.2', formationIds: ['formation.1'] };
        for (const command of [split, end, reunite]) { commands.push(command); issue(state, command); }
        expect(state.armies['army.2']!.formations.map(item => item.id)).toEqual(['formation.1', 'formation.2']);
        expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
      }
      expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
    }), { seed: 602, numRuns: 12 });
  });
});

describe('formation save invariants and preserved historical rules', () => {
  it.each(['duplicate', 'unknown-unit', 'empty', 'over-capacity', 'order', 'counter', 'strength', 'aggregate'] as const)('rejects recomputed-checksum corruption: %s', mutation => {
    const state = field(); issue(state, merge);
    const save = JSON.parse(serializeGame(state)) as { state: { armies: Army[]; nextId: number }; stateChecksum: string };
    const army = save.state.armies[0]!;
    if (mutation === 'duplicate') army.formations[1]!.id = army.formations[0]!.id;
    if (mutation === 'unknown-unit') army.formations[0]!.unitId = 'unit.missing';
    if (mutation === 'empty') army.formations = [];
    if (mutation === 'over-capacity') army.formations.push(...Array.from({ length: 12 }, () => ({ ...army.formations[0]! })));
    if (mutation === 'order') army.formations.reverse();
    if (mutation === 'counter') army.formations[0]!.id = `formation.${save.state.nextId}`;
    if (mutation === 'strength') army.formations[0]!.strength = 999;
    if (mutation === 'aggregate') Object.assign(army, { strength: 999 });
    save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });

  it('replays the real pre-change schema-5 fixture with every original outcome and checkpoint', () => {
    const state = deserializeGame(legacy.initialSave);
    expect(serializeGameForVersion(state, 5)).toBe(legacy.initialSave);
    for (const record of legacy.records) {
      expect(applyCommandForVersion(state, record.command, 5)).toEqual(record.result);
      expect(stateHashForVersion(state, 5)).toBe(record.hash);
      expect(state.battleReports.map(report => battleReportForVersion(report, 5))).toEqual(record.reports);
    }
  });

  it('does not reinterpret new commands/content as legacy rules or fabricate old seals for transferred formations', () => {
    const state = createGame({ rulesVersion: 15, seed: 2, size: 'tiny', factionCount: 1, generatorVersion: 1, rosterVersion: 1 });
    const before = stateHash(state);
    expect(applyCommandForVersion(state, merge, 5).ok).toBe(false); expect(stateHash(state)).toBe(before);
    issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Legacy Hearth' });
    const settlementId = Object.values(state.settlements)[0]!.id;
    const command: GameCommand = { type: 'queue', factionId, settlementId, itemId: 'unit.cavalry' };
    const old = stateHash(state); expect(applyCommandForVersion(state, command, 5).ok).toBe(false); expect(stateHash(state)).toBe(old);
    issue(state, command);
    expect(() => serializeGameForVersion(state, 5)).toThrow(/legacy content/);
    const mixed = field(15); mixed.rosterVersion = 1; issue(mixed, merge);
    expect(() => serializeGameForVersion(mixed, 5)).toThrow(/legacy singleton/);
    issue(mixed, { type: 'splitArmy', factionId, armyId: 'army.2', formationIds: ['formation.1'] });
    expect(() => serializeGameForVersion(mixed, 5)).toThrow(/legacy singleton/);
  });
});
