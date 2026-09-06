import { expect, test } from 'vitest';
import { createGame, getMovementQuery, getObservation, stateHash, type GameCommand } from '../../packages/sim/src/index';
import { applyRecordedCommand, createArchive, replayArchive } from '../../packages/chronicle/src/index';
import { deserializeCampaign, serializeCampaign } from '../../packages/persistence/src/index';

test.each([17, 42, 74, 99, 20260905])('generated seed %i preserves real queued travel and all route events through archive save/replay', seed => {
  const game = createGame({ seed, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'player' });
  const factionId = game.turnOwnerId;
  const scout = Object.values(game.armies).find(army => army.factionId === factionId && army.formations.some(item => item.unitId === 'unit.scout'))!;
  const origin = scout.cell;
  const range = getMovementQuery(getObservation(game, factionId), scout.id).reachable;
  const farthest = [...range].sort((a, b) => b.cost - a.cost || b.cell - a.cell)[0];
  expect(farthest).toBeDefined();
  expect(applyRecordedCommand(game, archive, { type: 'moveTo', factionId, armyId: scout.id, target: farthest!.cell }).ok).toBe(true);
  // Only ordinary commands: travel back across newly explored terrain after spending this turn's budget.
  const queued = applyRecordedCommand(game, archive, { type: 'queueMovement', factionId, armyId: scout.id, target: origin });
  expect(queued.ok).toBe(true);
  expect(game.routes[scout.id]?.path.length).toBeGreaterThan(0);
  const restored = deserializeCampaign(serializeCampaign(game, archive));
  expect(restored.game.routes).toEqual(game.routes);
  const orders: GameCommand[] = Array.from({ length: 8 }, () => ({ type: 'endTurn', factionId }));
  for (const command of orders) {
    const result = applyRecordedCommand(game, archive, command);
    expect(result.ok).toBe(true);
    expect(applyRecordedCommand(restored.game, restored.archive, command)).toEqual(result);
    expect(stateHash(restored.game)).toBe(stateHash(game));
  }
  expect(scout.cell).toBe(origin);
  expect(game.routes[scout.id]).toBeUndefined();
  expect(archive.records.flatMap(record => record.events).some(event => event.type === 'movement_completed')).toBe(true);
  expect(restored.archive).toEqual(archive);
  expect(stateHash(replayArchive(restored.archive))).toBe(stateHash(game));
});
