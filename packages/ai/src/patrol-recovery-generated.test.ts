import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { createJournal, replayArchive } from '../../chronicle/src';
import { planTurnWithReasons } from './index';
import { planPatrol } from './patrols';

/** Genuine pre-fix generated campaign, before Mire Courts' ordinary turn-58 plan.
 * The enabled patrol had remained paused for eight turns despite peace. */
const captured = () => {
  const bytes = readFileSync(new URL('../../../docs/development/2026-10-24-patrol-recovery/diagnosis-long/snapshot-1-turn-58.json', import.meta.url), 'utf8');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('c1c28ea92aca0919f084da92e4627984ec710924b27d98d7a4775dcd7eb55ca8');
  const game = deserializeGame(bytes);
  expect(stateHash(game)).toBe('17c538ce');
  return game;
};

describe('generated patrol interruption recovery', () => {
  it('reviews the genuine peace-time stalled leg, arrives through ordinary AI commands and replays exactly', () => {
    const game = captured(), factionId = 'faction.mire_courts', armyId = 'army.198';
    const view = getObservation(game, factionId), before = structuredClone(view);
    expect(view.wars).toEqual([]);
    expect(view.patrols?.find(patrol => patrol.armyId === armyId)).toMatchObject({ enabled: true, status: 'waiting', targetCell: 10368, lastAttemptTurn: 50 });
    const plan = planPatrol(view);
    expect(plan.commands).toEqual([{ type: 'resumeMovement', factionId, armyId }]);
    expect(plan.heldArmyIds.has(armyId)).toBe(true);
    expect(view).toEqual(before);
    const complete = planTurnWithReasons(view);
    expect(complete.commands).toContainEqual(plan.commands[0]);
    const mirror = deserializeGame(serializeGame(game));
    expect(planTurnWithReasons(getObservation(mirror, factionId))).toEqual(complete);
    const policy = structuredClone(game.patrols.find(patrol => patrol.armyId === armyId));
    const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    for (const command of complete.commands) {
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true);
      expect(applyCommand(mirror, command)).toEqual(result);
    }
    expect(game.armies[armyId]?.cell).toBe(10368);
    expect(game.routes[armyId]).toBeUndefined();
    expect(game.patrols.find(patrol => patrol.armyId === armyId)).toEqual(policy);
    expect(stateHash(mirror)).toBe(stateHash(game));
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('keeps the player-controlled canonical route paused without an explicit AI order', () => {
    const game = captured();
    const route = structuredClone(game.routes['army.198']);
    const result = applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId });
    expect(result.ok, result.error).toBe(true);
    expect(game.routes['army.198']).toEqual(route);
    expect(game.armies['army.198']?.cell).toBe(10146);
  });
});
