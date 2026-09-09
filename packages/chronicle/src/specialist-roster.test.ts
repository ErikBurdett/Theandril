import { expect, test } from 'vitest';
import { checksum, UNITS } from '@theandril/content';
import { applyCommand, applyCommandForVersion, armyMovement, armyUpkeep, createGame, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, type GameCommand } from '@theandril/sim';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive, resumeJournal, type CampaignArchive } from './index';
import captured from './fixtures/v14-specialist-baseline.json';

const specialists = UNITS.filter(unit => unit.introducedInRules === 15);

test('a generated campaign pays to unlock and recruit every specialist, then merges and replays exact saved continuation', () => {
  const game = createGame({ seed: 20260908, size: 'tiny', factionCount: 1, pace: 'epic' });
  const archive = createArchive(game, { mode: 'player' }), factionId = game.turnOwnerId;
  let mirror = deserializeGame(serializeGame(game));
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
    expect(applyCommand(mirror, command)).toEqual(result);
    expect(stateHash(mirror)).toBe(stateHash(game));
  };
  const advance = () => issue({ type: 'endTurn', factionId });
  const until = (ready: () => boolean) => { for (let turns = 0; !ready() && turns < 100; turns++) advance(); expect(ready()).toBe(true); };
  issue({ type: 'found', factionId, armyId: 'army.1', name: 'Long hearth' });
  const town = Object.values(game.settlements)[0]!;
  const option = (unitId: string) => getObservation(game, factionId).productionOptions.find(item => item.settlementId === town.id && item.itemId === unitId)!;
  for (const unit of specialists) {
    expect(option(unit.id)).toMatchObject({ canQueue: false, blocker: expect.stringContaining('Research') });
    const saved = serializeGame(game);
    expect(applyCommand(game, { type: 'queue', factionId, settlementId: town.id, itemId: unit.id }).ok).toBe(false);
    expect(serializeGame(game)).toBe(saved);
  }
  for (const itemId of ['building.granary', 'building.workshop', 'building.market', 'building.archive']) issue({ type: 'queue', factionId, settlementId: town.id, itemId });
  until(() => town.queue.length === 0);
  for (const technologyId of ['technology.cinder_masonry', 'technology.stewardship', 'technology.quarry_cranes', 'technology.surveyed_estates']) {
    until(() => getObservation(game, factionId).progression.technologyChoices.find(item => item.id === technologyId)?.available === true);
    const knowledge = game.factions[0]!.knowledge;
    issue({ type: 'research', factionId, technologyId });
    expect(game.factions[0]!.knowledge).toBeLessThan(knowledge);
  }
  for (const unit of specialists) {
    until(() => option(unit.id).canQueue);
    const coin = game.factions[0]!.treasury;
    issue({ type: 'queue', factionId, settlementId: town.id, itemId: unit.id });
    expect(game.factions[0]!.treasury).toBe(coin - unit.coinCost);
  }
  expect(town.queue.map(item => item.itemId)).toEqual(specialists.map(unit => unit.id));
  mirror = deserializeGame(serializeGame(game));
  until(() => town.queue.length === 0);
  const recruited = specialists.map(unit => Object.values(game.armies).find(army => army.formations[0]?.unitId === unit.id)!);
  for (const [index, army] of recruited.entries()) expect(army.formations[0]).toMatchObject({ unitId: specialists[index]!.id, strength: specialists[index]!.strength });
  const formationIds = recruited.flatMap(army => army.formations.map(item => item.id)).sort(), target = recruited[0]!;
  for (const source of recruited.slice(1)) issue({ type: 'mergeArmies', factionId, sourceArmyId: source.id, targetArmyId: target.id });
  expect(target.formations.map(item => item.id)).toEqual(formationIds);
  expect(armyMovement(target)).toBe(2);
  expect(armyUpkeep(target)).toBe(specialists.reduce((sum, unit) => sum + unit.upkeep, 0));
  expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
});

test('an independently captured rules14 archive retains its original content seal and immutable history', () => {
  const game = replayArchive(captured.archive as CampaignArchive), archive = parseArchive(captured.archive, game), initial = deserializeGame(archive.initialSave);
  expect(captured.contentHash).toBe('b6e3bce2');
  expect(archive.initialSaveVersion).toBe(14);
  expect(serializeGameForVersion(initial, 14)).toBe(archive.initialSave);
  expect(stateHashForVersion(initial, 14)).toBe(archive.initialHash);
  const journal = resumeJournal(game, archive);
  expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
  const continued = journal.materialize();
  expect(continued.records.slice(0, archive.records.length)).toEqual(archive.records);
  expect(continued.records.at(-1)).toMatchObject({ rulesVersion: 16, checkpointVersion: 16 });
  expect(serializeGame(replayArchive(continued))).toBe(serializeGame(game));
});

test.each(specialists)('$id cannot enter a resealed old snapshot or execute under historical rules', unit => {
  const game = replayArchive(captured.archive as CampaignArchive), factionId = game.turnOwnerId;
  const town = Object.values(game.settlements)[0]!, saved = serializeGame(game);
  expect(applyCommandForVersion(game, { type: 'queue', factionId, settlementId: town.id, itemId: unit.id }, 14)).toMatchObject({ ok: false, error: 'Unknown construction or recruitment item.' });
  expect(serializeGame(game)).toBe(saved);
  for (const location of ['army', 'queue'] as const) {
    const raw = JSON.parse(serializeGameForVersion(game, 14)) as { stateChecksum: string; state: { armies: { formations: { unitId: string }[] }[]; settlements: { queue: { itemId: string; progress: number }[] }[] } };
    if (location === 'army') raw.state.armies[0]!.formations[0]!.unitId = unit.id;
    else raw.state.settlements[0]!.queue.push({ itemId: unit.id, progress: 0 });
    raw.stateChecksum = checksum(JSON.stringify(raw.state));
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow('frozen pre-specialist pack');
  }
  game.armies['army.2']!.formations[0]!.unitId = unit.id;
  expect(() => serializeGameForVersion(game, 14)).toThrow('frozen pre-specialist pack');
  expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 14)).toThrow('frozen pack');
});
