import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, getObservation, serializeGame, stateHash, type ArmyView, type Observation } from '@theandril/sim';
import { getMapActionChoices } from './map-action-context';

const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'First hearth' }).ok).toBe(true);
const initial = getObservation(game, game.turnOwnerId);
const town = initial.settlements.find(item => item.factionId === initial.factionId)!;
const land = initial.land.settlements.find(item => item.settlementId === town.id)!;
const baseArmy = initial.armies.find(item => item.factionId === initial.factionId)!;
const army = (id: string, extra: Partial<ArmyView> = {}): ArmyView => ({ ...baseArmy, id, name: id, cell: 10, ...extra });
function fixture(): Observation {
  return { ...initial, cells: [], armies: [], settlements: [{ ...town, cell: 10 }],
    land: { ...initial.land, settlements: [{ ...land, claimed: [10, 11] }] } };
}

describe('map action inspection choices', () => {
  it('keeps every co-located owned army in stable order, then one town and tile; passengers stay in fleet controls', () => {
    const view = fixture();
    view.armies = [army('army.2'), army('army.10', { domain: 'naval' }), army('army.3', { carrierId: 'army.10' }), army('army.4', { factionId: 'foreign', name: 'Foreign secret' }), army('army.5', { cell: 12 })];
    const choices = getMapActionChoices(view, 10, undefined, { visible: true });
    expect(choices.map(choice => choice.id)).toEqual(['army.10', 'army.2', town.id, 'tile.10']);
    expect(choices[0]!.summary).toContain('Fleet');
    expect(choices.filter(choice => choice.kind === 'settlement')).toHaveLength(1);
    expect(choices.at(-1)!.selection).toEqual({ cell: 10, settlementId: town.id });
    expect(JSON.stringify(choices)).not.toContain('Foreign secret');
  });

  it('uses own claim summaries even with compact cells and fog, without confusing tile position with town center', () => {
    const choices = getMapActionChoices(fixture(), 11, undefined, { visible: false });
    expect(choices.map(choice => choice.kind)).toEqual(['settlement', 'tile']);
    for (const choice of choices) expect(choice.selection).toEqual({ cell: 11, settlementId: town.id });
    expect(getMapActionChoices(fixture(), 11)).toEqual(choices);
  });

  it('opens selected own-town quotes only for currently visible unclaimed expansion terrain, never inventing canClaim', () => {
    const view = fixture();
    expect(getMapActionChoices(view, 12, town.id, { visible: true })).toEqual([
      { id: 'tile.12', kind: 'tile', label: 'Hex 12', summary: `Land review · ${town.name}`, selection: { cell: 12, settlementId: town.id } },
    ]);
    for (const known of [undefined, { visible: false }, { visible: true, factionId: 'foreign' }, { visible: true, settlementId: 'foreign.missing' }]) {
      expect(getMapActionChoices(view, 12, town.id, known)[0]!.selection).toEqual({ cell: 12 });
    }
    expect(getMapActionChoices(view, 12, 'foreign.missing', { visible: true })[0]!.selection).toEqual({ cell: 12 });
  });

  it('keeps an owned army on foreign territory selectable without borrowing foreign names or own-town management', () => {
    const view = fixture(); view.armies = [army('army.2', { cell: 12 })];
    view.settlements.push({ ...town, id: 'foreign.town', factionId: 'foreign', cell: 12, name: 'Foreign hidden name' });
    const choices = getMapActionChoices(view, 12, town.id, { visible: true, factionId: 'foreign', settlementId: 'foreign.town' });
    expect(choices.map(choice => choice.id)).toEqual(['army.2', 'tile.12']);
    expect(choices.at(-1)!.selection).toEqual({ cell: 12 });
    expect(JSON.stringify(choices)).not.toContain('Foreign hidden name');
  });

  it('lets explicit renderer knowledge override headless cell records and rejects invalid coordinates', () => {
    const view = fixture(); view.cells = [{ cell: 12, terrain: 1, biome: 1, waterDepth: 0, fertility: 50, visible: true }];
    expect(getMapActionChoices(view, 12, town.id)[0]!.selection.settlementId).toBe(town.id);
    expect(getMapActionChoices(view, 12, town.id, { visible: false })[0]!.selection.settlementId).toBeUndefined();
    for (const cell of [-1, NaN, Infinity, 1.5, view.width * view.height]) expect(getMapActionChoices(view, cell)).toEqual([]);
  });

  it('is detached and leaves observation, canonical save and hash unchanged across repeated inspections', () => {
    const view = fixture(); view.armies = [army('army.2'), army('army.1')];
    const before = JSON.stringify(view), saved = serializeGame(game), hash = stateHash(game);
    const first = getMapActionChoices(view, 10), expected = structuredClone(first);
    first[0]!.label = 'Edited'; first[0]!.selection.cell = 99; first.splice(1, 1);
    expect(getMapActionChoices(view, 10)).toEqual(expected);
    for (const cell of [11, 12, 13]) getMapActionChoices(view, cell, town.id);
    expect(JSON.stringify(view)).toBe(before); expect(serializeGame(game)).toBe(saved); expect(stateHash(game)).toBe(hash);
  });
});
