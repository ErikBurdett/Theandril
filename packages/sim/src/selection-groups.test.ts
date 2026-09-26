import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { deriveWaterDepth, neighbors } from '@theandril/mapgen';
import { applyCommand, applyCommandForVersion, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, type GameCommand, type GameState } from './index';
import { characterCampaign } from '../../test-fixtures/src/character-fixture';
import { conquestCampaign, CONQUEST_FIXTURE as C } from '../../test-fixtures/src/conquest-fixture';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { rebaseAuthoredLand } from '../../test-fixtures/src/authored-land';
import { MAX_SELECTION_GROUPS_PER_FACTION, type SelectionGroup } from './selection-groups';

const issue = (state: GameState, command: GameCommand) => expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
const reject = (state: GameState, command: unknown) => { const before = serializeGame(state); expect(applyCommand(state, command).ok).toBe(false); expect(serializeGame(state)).toBe(before); };
function group(state: GameState, memberIds: string[], kind: 'armies' | 'settlements' = 'armies', name = 'Frontier', factionId = state.turnOwnerId) {
  issue(state, { type: 'setSelectionGroup', factionId, kind, name, memberIds });
  return state.selectionGroups.find(item => item.id === `selection-group.${state.nextSelectionGroupId - 1}`)!;
}
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
function gameplay(state: GameState) {
  const data = JSON.parse(serializeGame(state)).state;
  delete data.selectionGroups; delete data.nextSelectionGroupId;
  data.events = data.events.filter((event: { type: string }) => !event.type.startsWith('selection_group_'));
  return data;
}

describe('canonical saved selections', () => {
  it('uses independent IDs, stable detached own read models, and never issues orders', () => {
    const state = createGame({ seed: 20260925, size: 'tiny', factionCount: 2 });
    const before = gameplay(state), nextId = state.nextId, factionId = state.turnOwnerId;
    const saved = group(state, ['army.2', 'army.1'], 'armies', '  Frontier  ');
    expect(saved).toEqual({ id: 'selection-group.1', factionId, kind: 'armies', name: 'Frontier', memberIds: ['army.1', 'army.2'] });
    expect(state.nextId).toBe(nextId); expect(gameplay(state)).toEqual(before);
    const observed = getObservation(state, factionId).selectionGroups;
    observed[0]!.memberIds.length = 0; observed[0]!.name = 'Client mutation';
    expect(saved.memberIds).toHaveLength(2); expect(saved.name).toBe('Frontier');
    expect(getObservation(state, state.factions[1]!.id).selectionGroups).toEqual([]);
    issue(state, { type: 'setSelectionGroup', factionId, groupId: saved.id, kind: saved.kind, name: 'FRONTIER', memberIds: [] });
    expect(state.selectionGroups[0]?.memberIds).toEqual([]);
    issue(state, { type: 'deleteSelectionGroup', factionId, groupId: saved.id });
    expect(group(state, ['army.2']).id).toBe('selection-group.2');
    expect(gameplay(state)).toEqual(before);
  });

  it('rejects malformed, foreign, missing, duplicate and changed-kind requests atomically', () => {
    const state = createGame({ seed: 41, size: 'tiny', factionCount: 2 }), factionId = state.turnOwnerId;
    const saved = group(state, ['army.2']);
    const command = { type: 'setSelectionGroup', factionId, kind: 'armies', name: 'Other', memberIds: ['army.2'] };
    for (const edit of [
      { memberIds: [] }, { memberIds: ['army.2', 'army.2'] }, { memberIds: ['army.missing'] }, { memberIds: ['army.4'] },
      { memberIds: Array.from({ length: 129 }, () => 'army.2') }, { name: '  ' }, { name: 'x'.repeat(41) },
      { name: 'bad\nname' }, { name: '<group>' }, { kind: 'fleets' }, { extra: true }, { groupId: 'selection-group.99' }, { groupId: saved.id, kind: 'settlements' },
      { name: 'fRoNtIeR' }, { factionId: state.factions[1]!.id, groupId: saved.id, memberIds: ['army.4'] },
    ]) reject(state, { ...command, ...edit });
    reject(state, { type: 'deleteSelectionGroup', factionId: state.factions[1]!.id, groupId: saved.id });
    reject(state, { type: 'deleteSelectionGroup', factionId, groupId: 'selection-group.99' });
    const naval = navalCampaign();
    reject(naval, { ...command, factionId: naval.turnOwnerId, memberIds: [N.fleetId] });
    reject(naval, { ...command, factionId: naval.turnOwnerId, kind: 'settlements', memberIds: [N.islandId] });
  });

  it('bounds combined group capacity and membership while allowing replacement at capacity', () => {
    const state = characterCampaign(130), factionId = state.turnOwnerId;
    const ids = Object.keys(state.armies).sort();
    const first = group(state, ids.slice(0, 128));
    reject(state, { type: 'setSelectionGroup', factionId, kind: 'armies', name: 'Too many', memberIds: ids.slice(0, 129) });
    const town = Object.values(state.settlements).find(item => item.factionId === factionId)!;
    group(state, [town.id], 'settlements', first.name); // Names are scoped by kind.
    for (let i = 2; i < MAX_SELECTION_GROUPS_PER_FACTION; i++) group(state, [ids[0]!], 'armies', `Group ${i}`);
    reject(state, { type: 'setSelectionGroup', factionId, kind: 'settlements', name: 'Overflow', memberIds: [town.id] });
    issue(state, { type: 'setSelectionGroup', factionId, groupId: first.id, kind: 'armies', name: 'Replaced', memberIds: [] });
    expect(state.selectionGroups.map(item => item.id)).toEqual(state.selectionGroups.map(item => item.id).sort());
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it('refuses tampered semantic metadata even when the save is resealed', () => {
    const state = characterCampaign(), saved = group(state, Object.keys(state.armies));
    type Data = { selectionGroups: SelectionGroup[]; nextSelectionGroupId: number };
    const edits: Array<(data: Data) => void> = [
      data => { data.nextSelectionGroupId = 1; },
      data => { data.selectionGroups.push(structuredClone(saved)); },
      data => { data.selectionGroups[0]!.memberIds.reverse(); },
      data => { data.selectionGroups[0]!.memberIds = ['army.999']; },
      data => { data.selectionGroups[0]!.memberIds.push(data.selectionGroups[0]!.memberIds[0]!); },
      data => { data.selectionGroups[0]!.factionId = 'faction.unknown'; },
      data => { data.selectionGroups[0]!.name = ' untrimmed '; },
      data => { Object.assign(data.selectionGroups[0]!, { unknown: true }); },
    ];
    for (const edit of edits) {
      const raw = JSON.parse(serializeGame(state)); edit(raw.state);
      raw.stateChecksum = checksum(JSON.stringify(raw.state));
      expect(() => deserializeGame(JSON.stringify(raw))).toThrow();
    }
    const raw = JSON.parse(serializeGame(state)); raw.state.selectionGroups[0].name = 'Unsealed';
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/checksum/);
  });

  it('preserves gameplay and later entity identity through create, rename, delete and real turns', () => {
    const state = createGame({ seed: 20260925, size: 'tiny', factionCount: 2 }), control = deserializeGame(serializeGame(state));
    const saved = group(state, ['army.1', 'army.2']);
    issue(state, { type: 'setSelectionGroup', factionId: state.turnOwnerId, groupId: saved.id, kind: 'armies', name: 'Renamed', memberIds: ['army.1'] });
    const found: GameCommand = { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Same hearth' };
    issue(state, found); issue(control, found);
    expect(state.selectionGroups[0]!.memberIds).toEqual([]);
    issue(state, { type: 'deleteSelectionGroup', factionId: state.turnOwnerId, groupId: saved.id });
    for (let turn = 0; turn < 3; turn++) { end(state); end(control); }
    expect(gameplay(state)).toEqual(gameplay(control));
    expect(state.nextId).toBe(control.nextId);
  });

  it.each(['mergeArmies', 'transferFormations'] as const)('prunes a disappearing source immediately after %s without adding the receiver', type => {
    const state = characterCampaign(), source = Object.values(state.armies).find(army => army.id !== 'army.2')!;
    const saved = group(state, [source.id]);
    issue(state, type === 'mergeArmies' ? { type, factionId: state.turnOwnerId, sourceArmyId: source.id, targetArmyId: 'army.2' }
      : { type, factionId: state.turnOwnerId, sourceArmyId: source.id, targetArmyId: 'army.2', formationIds: source.formations.map(item => item.id) });
    expect(state.armies[source.id]).toBeUndefined(); expect(saved.memberIds).toEqual([]);
    expect(deserializeGame(serializeGame(state)).selectionGroups).toEqual(state.selectionGroups);
  });

  it('does not inherit split children, and prunes a posting-driven merge at the end-turn boundary', () => {
    const state = characterCampaign(), factionId = state.turnOwnerId, saved = group(state, ['army.2']);
    issue(state, { type: 'splitArmy', factionId, armyId: 'army.2', formationIds: [state.armies['army.2']!.formations[0]!.id] });
    const detached = `army.${state.nextId - 1}`;
    expect(saved.memberIds).toEqual(['army.2']); expect(state.armies[detached]).toBeDefined();
    const second = group(state, [detached], 'armies', 'Reinforcements');
    issue(state, { type: 'setPosting', factionId, armyId: detached, cell: state.armies['army.2']!.cell, mode: 'join' });
    end(state); expect(state.armies[detached]).toBeUndefined(); expect(second.memberIds).toEqual([]);
  });

  it.each(['occupy', 'raze'] as const)('removes hearth membership through an actual %s capture decision', outcome => {
    const state = conquestCampaign();
    const saved = group(state, [C.settlementId], 'settlements', 'Border hearths', C.enemyFactionId);
    issue(state, { type: 'declareWar', factionId: C.playerFactionId, targetFactionId: C.enemyFactionId });
    issue(state, { type: 'besiege', factionId: C.playerFactionId, armyId: C.playerArmyId, settlementId: C.settlementId });
    for (let turn = 0; turn < 3; turn++) end(state);
    issue(state, { type: 'assault', factionId: C.playerFactionId, settlementId: C.settlementId });
    issue(state, { type: 'autoResolveBattle', factionId: C.playerFactionId });
    expect(state.pendingCapture).not.toBeNull();
    reject(state, { type: 'deleteSelectionGroup', factionId: C.enemyFactionId, groupId: saved.id });
    issue(state, { type: 'resolveCapture', factionId: C.playerFactionId, settlementId: C.settlementId, outcome });
    expect(saved.memberIds).toEqual([]);
    expect(deserializeGame(serializeGame(state)).selectionGroups).toEqual(state.selectionGroups);
  });

  it('keeps boarded land members and removes actual drowned cargo after a naval battle', () => {
    let state = navalCampaign(); const factionId = state.turnOwnerId;
    delete state.armies[N.coastalId];
    for (const cell of neighbors(N.fleetCell, state.world.width, state.world.height)) if (cell !== N.shallowCell) {
      state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.fertility[cell] = 65;
    }
    state.world.waterDepth = deriveWaterDepth(state.world.width, state.world.height, state.world.terrain);
    state.armies[N.fleetId]!.formations.splice(1); Object.assign(state.armies[N.fleetId]!.formations[0]!, { strength: 1, morale: 1 });
    state.armies[N.enemyFleetId]!.cell = N.shallowCell;
    for (let i = 0; i < 2; i++) state.armies[N.enemyFleetId]!.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.coastal_warship'));
    state.armies[N.enemyFleetId]!.formations.sort((a, b) => a.id < b.id ? -1 : 1);
    rebaseAuthoredLand(state); state = deserializeGame(serializeGame(state));
    issue(state, { type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
    issue(state, { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
    const saved = group(state, [N.cargoId]);
    end(state); expect(saved.memberIds).toEqual([N.cargoId]);
    issue(state, { type: 'declareWar', factionId, targetFactionId: state.factions[1]!.id });
    issue(state, { type: 'attack', factionId, armyId: N.fleetId, targetArmyId: N.enemyFleetId });
    issue(state, { type: 'autoResolveBattle', factionId });
    expect(state.armies[N.cargoId]).toBeUndefined(); expect(saved.memberIds).toEqual([]);
    expect(state.selectionGroups[0]!.name).toBe('Frontier');
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it('does not traverse group membership on an ordinary command or a refusal', () => {
    const state = characterCampaign(), saved = group(state, ['army.2']);
    const members = saved.memberIds;
    Object.defineProperty(saved, 'memberIds', { configurable: true, get() { throw new Error('Unexpected group membership scan'); } });
    issue(state, { type: 'setPosting', factionId: state.turnOwnerId, armyId: 'army.2', cell: state.armies['army.2']!.cell, mode: 'hold' });
    expect(applyCommand(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.missing', name: 'Impossible' }).ok).toBe(false);
    Object.defineProperty(saved, 'memberIds', { configurable: true, enumerable: true, writable: true, value: members });
  });

  it('refuses legacy commands/exports when metadata exists, even after all groups were deleted', () => {
    const state = createGame({ seed: 4, size: 'tiny', factionCount: 1 }), factionId = state.turnOwnerId;
    const command = { type: 'setSelectionGroup' as const, factionId, kind: 'armies' as const, name: 'Old rule refusal', memberIds: ['army.2'] };
    const before = stateHash(state);
    for (const version of [29, 30, 31] as const) expect(applyCommandForVersion(state, command, version).ok).toBe(false);
    expect(stateHash(state)).toBe(before);
    const saved = group(state, ['army.2']);
    expect(() => serializeGameForVersion(state, 31)).toThrow(/saved selection groups/);
    issue(state, { type: 'deleteSelectionGroup', factionId, groupId: saved.id });
    expect(() => serializeGameForVersion(state, 31)).toThrow(/identifier history/);
    expect(() => applyCommandForVersion(state, { type: 'endTurn', factionId }, 31)).toThrow(/identifier history/);
  });
});
