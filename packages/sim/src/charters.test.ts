import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, applyCommandForVersion, createGame, getObservation } from './simulation';
import { CHARTER_RESERVE, charterFor } from './charters';
import { deserializeGame, serializeGame, SAVE_VERSION, stateHash } from './save';
import type { GameCommand, GameState } from './types';

const run = (state: GameState, command: GameCommand): void => { expect(applyCommand(state, command).ok).toBe(true); };
const ownTown = (state: GameState, factionId: string) => Object.values(state.settlements).find(town => town.factionId === factionId)!;
/** Two realms, each with a founded hearth and coin enough to place standing orders. */
function start(): GameState {
  const state = createGame({ seed: 41, size: 'small', factionCount: 2, pace: 'standard' });
  for (const faction of state.factions) {
    const colonist = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    run(state, { type: 'found', factionId: faction.id, armyId: colonist.id, name: `${faction.name} Hearth` });
    faction.treasury = 400;
  }
  return state;
}
const endTurn = (state: GameState): void => { run(state, { type: 'endTurn', factionId: state.turnOwnerId }); };

describe('standing production charters', () => {
  it('orders for an idle hearth, stays inside its ceiling and leaves the reserve alone', () => {
    const state = start();
    const factionId = state.factions[0]!.id;
    const town = ownTown(state, factionId);
    run(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'works', ceiling: 12 });
    expect(charterFor(state, town.id)).toEqual({ settlementId: town.id, factionId, focus: 'works', ceiling: 12 });
    endTurn(state);
    // Works ranks food and industry alike, so the cheaper of the two goes first.
    expect(town.queue.map(item => item.itemId)).toEqual(['building.granary']);

    // The same hearth under Wealth reaches past the cheap work for the market.
    const other = state.factions[1]!.id;
    const theirs = ownTown(state, other);
    run(state, { type: 'setCharter', factionId: other, settlementId: theirs.id, focus: 'wealth', ceiling: 24 });
    expect(getObservation(state, other).charters[0]!.itemId).toBe('building.market');

    // A ceiling below every candidate stops the charter and says why.
    run(state, { type: 'setCharter', factionId: other, settlementId: theirs.id, focus: 'wealth', ceiling: 4 });
    const stalled = getObservation(state, other).charters[0]!;
    expect(stalled.itemId).toBeNull();
    expect(stalled.blocker).toBe('Nothing this charter builds costs 4 coin or less; raise the ceiling.');

    // A treasury at its reserve waits rather than spending the realm dry.
    state.factions.find(faction => faction.id === other)!.treasury = CHARTER_RESERVE;
    run(state, { type: 'setCharter', factionId: other, settlementId: theirs.id, focus: 'wealth', ceiling: 24 });
    expect(getObservation(state, other).charters[0]!.blocker).toContain('reserve');
  });

  it('never overrides a hand-placed order, and is revoked, exhausted and lost like any obligation', () => {
    const state = start();
    const factionId = state.factions[0]!.id;
    const town = ownTown(state, factionId);
    run(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'building.granary' });
    run(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'learning', ceiling: 32 });
    endTurn(state);
    // The player's own order stands alone; the charter waits for an empty queue.
    expect(town.queue.map(item => item.itemId)).toEqual(['building.granary']);

    town.buildings.push(...['building.granary', 'building.workshop', 'building.market', 'building.archive', 'building.harbor'].filter(id => !town.buildings.includes(id)));
    town.queue.length = 0;
    expect(getObservation(state, factionId).charters[0]!.blocker).toBe('Every building already stands at this hearth.');

    run(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'none', ceiling: 8 });
    expect(charterFor(state, town.id)).toBeUndefined();
    expect(applyCommand(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'none', ceiling: 8 }).error).toBe('That hearth holds no charter.');
    expect(applyCommand(state, { type: 'setCharter', factionId, settlementId: ownTown(state, state.factions[1]!.id).id, focus: 'works', ceiling: 8 }).error).toBe('You do not control that settlement.');

    // A hearth that changes hands ends its charter rather than serving a conqueror.
    run(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'works', ceiling: 32 });
    town.factionId = state.factions[1]!.id;
    endTurn(state);
    expect(state.charters).toEqual([]);
    expect(state.events.some(event => event.type === 'charter_lost')).toBe(true);
  });

  it('survives a save, replays exactly, and is refused by historical rules', () => {
    const state = start();
    const factionId = state.factions[0]!.id;
    const town = ownTown(state, factionId);
    run(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'muster', ceiling: 64 });
    endTurn(state);
    // Muster raises the most capable company the ceiling allows, never a colonist or a hull.
    expect(town.queue[0]?.itemId).toBe('unit.heavy_infantry');

    const save = serializeGame(state);
    expect(JSON.parse(save).version).toBe(SAVE_VERSION);
    const loaded = deserializeGame(save);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(serializeGame(loaded)).toBe(save);
    expect(loaded.charters).toEqual(state.charters);
    expect(JSON.parse(save).contentHash).toBe(CONTENT_HASH);

    expect(applyCommandForVersion(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'works', ceiling: 12 }, 24).error)
      .toContain('Malformed command');
  });
});
