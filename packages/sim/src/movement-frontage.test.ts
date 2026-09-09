import { describe, expect, it } from 'vitest';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, replayGame, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { withRules } from './rules';

/** Authored 21-company border encounter; actual sight, commands and saves decide the outcome. */
function field(sizes = Array.from({ length: 21 }, () => 1)): GameState {
  const state = borderBattleCampaign(), defender = state.armies['army.4']!;
  const ids = sizes.map((_, index) => index ? `army.${state.nextId++}` : defender.id);
  for (const [index, size] of sizes.entries()) {
    const id = ids[index]!;
    state.armies[id] = { ...defender, id, formations: Array.from({ length: size }, (_, formation) => ({
      ...createArmyFormation(formation ? `army.${state.nextId++}` : id, 'unit.scout'), strength: 1, morale: 1,
    })).sort((a, b) => a.id < b.id ? -1 : 1) };
  }
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state));
  expect(applyCommand(checked, { type: 'declareWar', factionId: checked.turnOwnerId, targetFactionId: defender.factionId }).ok).toBe(true);
  return checked;
}

function issue(state: GameState, command: GameCommand): void {
  expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
}

describe('contingent-aware movement routing', () => {
  it('quotes a reachable 21-company attack and executes the quoted moveTo with exact replay', () => {
    const state = field(), factionId = state.turnOwnerId, target = state.armies['army.4']!.cell;
    const initial = serializeGame(state), before = stateHash(state), view = getObservation(state, factionId);
    expect(view.armies.find(army => army.id === 'army.4')?.battleDefense).toEqual({ engagedFormations: 20, engagedStrength: 20, reserveFormations: 1, reserveStrength: 1 });
    const query = getMovementQuery(view, 'army.2', target);
    expect(query.preview).toMatchObject({ action: 'attack', canMoveNow: true, canQueue: false, path: [target], blocker: null });
    expect(query.reachable).toContainEqual({ cell: target, cost: query.preview!.cost });
    expect(stateHash(state)).toBe(before);
    expect(applyCommand(state, { type: 'queueMovement', factionId, armyId: 'army.2', target }).ok).toBe(false);
    expect(stateHash(state)).toBe(before);
    const move: GameCommand = { type: 'moveTo', factionId, armyId: 'army.2', target };
    issue(state, move);
    expect(state.battle?.combat.defender).toHaveLength(20);
    expect(state.armies['army.2']!.cell).not.toBe(target);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(stateHash(replayGame(initial, [move]))).toBe(stateHash(state));
    const direct = deserializeGame(initial), selected = [...view.armies.filter(army => army.cell === target)].sort((a, b) => a.id < b.id ? -1 : 1)[0]!;
    issue(direct, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: selected.id });
    expect(stateHash(direct)).toBe(stateHash(state));
  });

  it('routes against whole mixed containers without splitting or moving the nine-company reserve', () => {
    const state = field([12, 9, 8]), factionId = state.turnOwnerId, target = state.armies['army.4']!.cell;
    const view = getObservation(state, factionId), original = structuredClone(state.armies);
    expect(view.armies.find(army => army.id === 'army.4')?.battleDefense).toEqual({ engagedFormations: 20, engagedStrength: 20, reserveFormations: 9, reserveStrength: 9 });
    expect(getMovementQuery(view, 'army.2', target).preview).toMatchObject({ action: 'attack', canMoveNow: true });
    issue(state, { type: 'moveTo', factionId, armyId: 'army.2', target });
    expect(state.battle?.defenderIds).toEqual(['army.4', 'army.8']);
    expect(state.battle?.combat.defender).toHaveLength(20);
    expect(state.armies['army.7']).toEqual(original['army.7']);
    issue(state, { type: 'autoResolveBattle', factionId });
    expect(state.armies['army.7']).toEqual(original['army.7']);
    expect(state.armies['army.2']!.cell).toBe(original['army.2']!.cell);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('retains rule-16 query and command rejection with no state mutation', () => {
    const state = field(), factionId = state.turnOwnerId, target = state.armies['army.4']!.cell, before = stateHash(state);
    withRules(state, 16, () => {
      const view = getObservation(state, factionId), query = getMovementQuery(view, 'army.2', target);
      expect(view.armies.every(army => army.battleDefense === undefined)).toBe(true);
      expect(query.preview).toMatchObject({ action: 'blocked', canMoveNow: false, canQueue: false, blocker: 'This field battle supports at most twenty defending formations.' });
      expect(query.reachable.some(cell => cell.cell === target)).toBe(false);
      for (const command of [
        { type: 'moveTo', factionId, armyId: 'army.2', target },
        { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' },
      ]) expect(applyCommand(state, command)).toMatchObject({ ok: false, error: 'This field battle supports at most twenty defending formations.' });
    });
    expect(stateHash(state)).toBe(before);
  });

  it('keeps no-preview observations conservative even when current execution supports contingents', () => {
    const state = field(), view = getObservation(state, state.turnOwnerId), target = state.armies['army.4']!.cell;
    for (const army of view.armies) delete army.battleDefense;
    const query = getMovementQuery(view, 'army.2', target);
    expect(query.preview).toMatchObject({ action: 'blocked', canMoveNow: false });
    expect(query.reachable.some(cell => cell.cell === target)).toBe(false);
  });
});
