import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { characterBattleCampaign } from '../../test-fixtures/src/character-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, serializeGame, stateHash, stateHashForVersion, type GameCommand, type GameState } from './index';
import trace from './fixtures/v16-trained-battle-trace.json';
import { battleDevelopmentEffects } from './combat/development-snapshot';

const initialSave = () => gunzipSync(readFileSync(new URL('./fixtures/v16-trained-battle.json.gz', import.meta.url))).toString('utf8');

describe('strategic morale after trained combat', () => {
  it('round-trips after every accepted command from a captured ordinary battle', () => {
    let game = deserializeGame(initialSave());
    for (const entry of trace.records) {
      expect(applyCommand(game, entry.command as GameCommand)).toMatchObject({ ok: true });
      const hash = stateHash(game);
      game = deserializeGame(serializeGame(game));
      expect(stateHash(game)).toBe(hash);
    }
    expect(game.armies['army.8']!.formations[0]!.morale).toBe(55);
  });

  it('manual rounds and withdrawal save at the same boundary as autoresolve', () => {
    let game = deserializeGame(initialSave());
    const factionId = trace.records[0]!.command.factionId;
    expect(applyCommand(game, trace.records[0]!.command)).toMatchObject({ ok: true });
    const commands: GameCommand[] = [trace.records[0]!.command as GameCommand];
    for (let round = 0; game.battle && round < 100; round++) {
      const command: GameCommand = { type: 'battleOrder', factionId, order: round === 0 ? 'brace' : 'withdraw' };
      commands.push(command);
      expect(applyCommand(game, command)).toMatchObject({ ok: true });
      const saved = serializeGame(game);
      game = deserializeGame(saved);
      expect(serializeGame(game)).toBe(saved);
    }
    expect(game.battle).toBeNull();
    const replay = deserializeGame(initialSave());
    for (const command of commands) expect(applyCommand(replay, command).ok).toBe(true);
    expect(stateHash(replay)).toBe(stateHash(game));
  });

  it('does not compound training when the same company defends twice without an end turn', () => {
    // Authored forces and prior experience; training, battles and withdrawals are ordinary paid commands.
    let game = characterBattleCampaign();
    const factionId = game.turnOwnerId, defender = game.armies['army.4']!;
    defender.formations = [createArmyFormation(defender.id, 'unit.arbalester')];
    const formationId = defender.formations[0]!.id;
    game.development.formations[formationId] = { experience: 3, nodeIds: [] };
    const reserveId = `army.${game.nextId++}`;
    game.armies[reserveId] = { ...game.armies['army.2']!, id: reserveId, formations: [createArmyFormation(reserveId, 'unit.scout')] };
    refreshAuthoredSight(game);
    game = deserializeGame(serializeGame(game));
    const issue = (state: GameState, command: GameCommand) => expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
    issue(game, { type: 'develop', factionId: defender.factionId, scope: 'formation', entityId: formationId, nodeId: 'training.field_habits' });
    issue(game, { type: 'declareWar', factionId, targetFactionId: defender.factionId });
    const turn = game.turn;
    for (const armyId of ['army.2', reserveId]) {
      issue(game, { type: 'attack', factionId, armyId, targetArmyId: defender.id });
      expect(game.battle!.combat.defender.find(item => item.id === formationId)!.morale).toBe(74);
      issue(game, { type: 'battleOrder', factionId, order: 'withdraw' });
      expect(game.armies[defender.id]!.formations[0]!.morale).toBe(70);
      const saved = serializeGame(game);
      game = deserializeGame(saved);
      expect(serializeGame(game)).toBe(saved);
    }
    expect(game.turn).toBe(turn);
    expect(game.battleReports).toHaveLength(2);
  });

  it('removes only the training morale actually granted at the tactical cap', () => {
    // Authored veteran strength, experience and funding; development and combat use real commands.
    let game = characterBattleCampaign();
    const factionId = game.turnOwnerId, defender = game.armies['army.4']!;
    defender.formations = [createArmyFormation(defender.id, 'unit.heavy_infantry')];
    defender.movement = 2;
    const formationId = defender.formations[0]!.id;
    game.factions.find(faction => faction.id === defender.factionId)!.treasury = 1000;
    game.development.formations[formationId] = { experience: 40, nodeIds: [] };
    game.development.factions[defender.factionId] = { influence: 6, nodeIds: [] };
    Object.assign(game.resources.stockpiles[defender.factionId]!, {
      'resource.iron': 4, 'resource.timber': 3, 'resource.silver': 2, 'resource.salt': 2,
    });
    refreshAuthoredSight(game);
    game = deserializeGame(serializeGame(game));
    const issue = (command: GameCommand) => {
      expect(applyCommand(game, command), JSON.stringify(command)).toMatchObject({ ok: true });
      const saved = serializeGame(game);
      game = deserializeGame(saved);
      expect(serializeGame(game)).toBe(saved);
    };
    const trainingIds = ['training.field_habits', 'training.shield_partners', 'training.held_line', 'training.veteran_service'];
    for (const nodeId of trainingIds) issue({ type: 'develop', factionId: defender.factionId, scope: 'formation', entityId: formationId, nodeId });
    issue({ type: 'adoptDoctrine', factionId: defender.factionId, doctrineId: 'doctrine.shield_cohesion' });
    issue({ type: 'develop', factionId: defender.factionId, scope: 'faction', entityId: defender.factionId, nodeId: 'tradition.watched_ranks' });
    issue({ type: 'declareWar', factionId, targetFactionId: defender.factionId });
    issue({ type: 'attack', factionId, armyId: 'army.2', targetArmyId: defender.id });
    const snapshot = game.battle!.developmentSnapshots!.find(item => item.formationId === formationId)!;
    expect(snapshot).toEqual({ formationId, trainingIds: [...trainingIds].sort(), traditionIds: ['tradition.watched_ranks'] });
    expect(battleDevelopmentEffects(snapshot).morale).toBe(18);
    expect(game.battle!.combat.defender.find(item => item.id === formationId)).toMatchObject({ morale: 100, strength: 85, fatigue: 0 });
    // Pending combat preserves the entering strategic morale, including after save/load.
    expect(game.armies[defender.id]!.formations[0]).toMatchObject({ morale: 85, strength: 85, fatigue: 0 });
    const pendingHash = stateHash(game);
    expect(applyCommand(game, { type: 'endTurn', factionId })).toMatchObject({ ok: false });
    expect(stateHash(game)).toBe(pendingHash);
    issue({ type: 'battleOrder', factionId, order: 'withdraw' });
    expect(game.battle).toBeNull();
    expect(game.battleReports.at(-1)!.combat.defender.find(item => item.id === formationId)).toMatchObject({ morale: 100, strength: 85, fatigue: 0 });
    expect(game.armies[defender.id]!.formations[0]).toMatchObject({ morale: 85, strength: 85, fatigue: 0 });
  });

  it('retains independently captured rule-16 results rather than silently rewriting history', () => {
    const game = deserializeGame(initialSave());
    expect(stateHashForVersion(game, 16)).toBe(trace.initialHash);
    for (const entry of trace.records) {
      expect(applyCommandForVersion(game, entry.command, 16)).toEqual(entry.result);
      expect(stateHashForVersion(game, 16)).toBe(entry.hash);
    }
  });
});
