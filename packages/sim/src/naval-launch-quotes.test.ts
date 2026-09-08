import { expect, test } from 'vitest';
import { applyRecordedCommand, createArchive, replayArchive } from '../../chronicle/src/index';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { deserializeGame, getObservation, serializeGame, type GameCommand } from './index';

test('naval quotes report the actual visible berth without exposing rival production or mutating state', () => {
  const game = navalCampaign(), before = serializeGame(game), view = getObservation(game, game.turnOwnerId);
  const own = view.productionOptions.filter(option => option.kind === 'naval');
  expect(own.length).toBeGreaterThan(0);
  expect(view.productionOptions.every(option => option.settlementId === N.homeId)).toBe(true);
  for (const option of own) {
    if (option.canQueue) {
      expect(option.launchCell).toBeTypeOf('number');
      expect(view.cells.find(cell => cell.cell === option.launchCell)).toMatchObject({ terrain: 0, visible: true });
    } else expect(option.launchCell).toBe(null);
  }
  expect(view.productionOptions.filter(option => option.kind !== 'naval').every(option => !Object.hasOwn(option, 'launchCell'))).toBe(true);
  expect(serializeGame(game)).toBe(before);
});

test('a funded hull launches at its quoted berth, or rechecks when another faction occupies it before completion', () => {
  for (const interrupt of [false, true]) {
    let game = navalCampaign();
    // Authored initial foreign position beside Reedwatch's first berth; subsequent movement,
    // payment, production and alternate launch all use actual public commands.
    game.armies[N.fleetId]!.cell = 739;
    refreshAuthoredSight(game);
    game = deserializeGame(serializeGame(game));
    const owner = game.factions[1]!.id;
    const view = getObservation(game, owner);
    const quote = view.productionOptions.find(option => option.settlementId === N.islandId && option.itemId === 'unit.transport')!;
    expect(quote).toMatchObject({ canQueue: true, launchCell: 740 });
    const archive = createArchive(game, { mode: 'player', coverage: 'from-save' }), mirror = deserializeGame(serializeGame(game));
    const mirrorArchive = createArchive(mirror, { mode: 'player', coverage: 'from-save' });
    const issue = (command: GameCommand) => {
      const result = applyRecordedCommand(game, archive, command);
      expect(result.ok, result.error).toBe(true);
      expect(applyRecordedCommand(mirror, mirrorArchive, command)).toEqual(result);
    };
    const beforeIds = new Set(Object.keys(game.armies)), treasury = game.factions[1]!.treasury;
    issue({ type: 'queue', factionId: owner, settlementId: N.islandId, itemId: 'unit.transport' });
    expect(game.factions[1]!.treasury).toBeLessThan(treasury);
    if (interrupt) issue({ type: 'move', factionId: game.turnOwnerId, armyId: N.fleetId, target: 740 });
    const nextQuote = getObservation(game, owner).productionOptions.find(option => option.settlementId === N.islandId && option.itemId === 'unit.transport')!;
    expect(nextQuote.launchCell).toBe(interrupt ? 788 : 740);
    for (let turn = 0; turn < 20 && game.settlements[N.islandId]!.queue.length; turn++) issue({ type: 'endTurn', factionId: game.turnOwnerId });
    const recruited = Object.values(game.armies).filter(army => !beforeIds.has(army.id));
    expect(recruited).toHaveLength(1);
    expect(recruited[0]).toMatchObject({ cell: nextQuote.launchCell });
    expect(recruited[0]!.formations[0]!.unitId).toBe('unit.transport');
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(mirror));
    expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  }
});
