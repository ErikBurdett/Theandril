import { describe, expect, it } from 'vitest';
import { applyCommand, applyCommandForVersion, createGame, getObservation } from './simulation';
import { musterFor, postingFor } from './postings';
import { deserializeGame, serializeGame, SAVE_VERSION, stateHash } from './save';
import { cellsWithin } from './visibility';
import type { GameCommand, GameState } from './types';

const run = (state: GameState, command: GameCommand): void => { const result = applyCommand(state, command); expect(result.error ?? 'ok').toBe('ok'); };
const endTurn = (state: GameState): void => { run(state, { type: 'endTurn', factionId: state.turnOwnerId }); };
/** One hearth on clear ground with coin to raise companies, so the journey is the posting. */
function start(): GameState {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'standard' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 4)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  run(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Muster Hearth' });
  state.factions[0]!.treasury = 2000;
  return deserializeGame(serializeGame(state));
}

describe('standing postings and muster points', () => {
  it('marches a posted army to its hex and joins the force standing there', () => {
    const state = start();
    const factionId = state.turnOwnerId;
    const town = Object.values(state.settlements)[0]!;
    const garrison = Object.values(state.armies).find(army => army.cell === town.cell)!;
    // Send the standing force two hexes off, then post a raised company after it.
    const rally = [...cellsWithin(state, town.cell, 2)].find(cell => cell !== town.cell && cell !== garrison.cell)!;
    run(state, { type: 'setPosting', factionId, armyId: garrison.id, cell: rally, mode: 'hold' });
    for (let turn = 0; turn < 4 && state.armies[garrison.id]!.cell !== rally; turn++) endTurn(state);
    expect(state.armies[garrison.id]!.cell).toBe(rally);

    const before = new Set(Object.keys(state.armies));
    run(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.guard' });
    for (let turn = 0; turn < 8 && Object.keys(state.armies).length === before.size; turn++) endTurn(state);
    const raised = Object.values(state.armies).find(army => !before.has(army.id))!;
    run(state, { type: 'setPosting', factionId, armyId: raised.id, cell: rally, mode: 'join' });
    expect(postingFor(state, raised.id)).toEqual({ armyId: raised.id, factionId, cell: rally, mode: 'join' });

    for (let turn = 0; turn < 6 && state.armies[raised.id]; turn++) endTurn(state);
    // It marched under an ordinary travel order and merged into the force it found.
    expect(state.armies[raised.id]).toBeUndefined();
    expect(state.postings.some(posting => posting.armyId === raised.id)).toBe(false);
    expect(state.events.some(event => event.type === 'formations_transferred')).toBe(true);
  });

  it('refuses an unexplored hex, is cleared, and reports why an arrived posting is idle', () => {
    const state = start();
    const factionId = state.turnOwnerId;
    const army = Object.values(state.armies)[0]!;
    const hidden = state.world.terrain.findIndex((_, cell) => !state.explored[factionId]!.has(cell));
    expect(applyCommand(state, { type: 'setPosting', factionId, armyId: army.id, cell: hidden, mode: 'hold' }).error).toBe('You have not explored that hex.');

    run(state, { type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'join' });
    const observed = getObservation(state, factionId).postings[0]!;
    expect(observed.arrived).toBe(true);
    expect(observed.blocker).toBe('No other force of this realm stands here to join.');

    run(state, { type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'none' });
    expect(postingFor(state, army.id)).toBeUndefined();
    expect(applyCommand(state, { type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'none' }).error).toBe('That army holds no posting.');
  });

  it('posts every company a mustering hearth raises, and survives a save and historical rules', () => {
    const state = start();
    const factionId = state.turnOwnerId;
    const town = Object.values(state.settlements)[0]!;
    const rally = [...cellsWithin(state, town.cell, 3)].find(cell => cell !== town.cell)!;
    run(state, { type: 'setMuster', factionId, settlementId: town.id, cell: rally });
    expect(musterFor(state, town.id)).toEqual({ settlementId: town.id, factionId, cell: rally });

    const before = Object.keys(state.armies).length;
    run(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.guard' });
    for (let turn = 0; turn < 6 && Object.keys(state.armies).length === before; turn++) endTurn(state);
    const raised = Object.values(state.armies).find(army => army.cell !== town.cell || state.postings.some(item => item.armyId === army.id))!;
    expect(state.postings.some(posting => posting.armyId === raised.id && posting.cell === rally && posting.mode === 'join')).toBe(true);

    const save = serializeGame(state);
    expect(JSON.parse(save).version).toBe(SAVE_VERSION);
    const loaded = deserializeGame(save);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(serializeGame(loaded)).toBe(save);
    expect(loaded.postings).toEqual(state.postings);
    expect(loaded.musters).toEqual(state.musters);

    expect(applyCommandForVersion(state, { type: 'setMuster', factionId, settlementId: town.id, cell: rally }, 25).error).toContain('Malformed command');
  });
});
