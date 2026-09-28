import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { deserializeGame, serializeGame, type GameCommand } from '@theandril/sim';
import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
import { historical33 } from '../../chronicle/src/fixtures/reinforcement-logistics33';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from './index';

test('modern reinforcement survives database reopen and portable export without rewriting rules33 routes or history', async () => {
  const prior = historical33('theaters-allocated'), game = deserializeGame(prior.save), journal = resumeJournal(game, prior.archive);
  const theater = game.theaters[0]!, factionId = game.turnOwnerId;
  expect(journal.record(game, { type: 'setTheater', factionId, theaterId: theater.id, name: theater.name,
    settlementIds: theater.settlementIds, armyIds: theater.armyIds, reserveCell: theater.reserveCell,
    guardsPerSettlement: theater.guardsPerSettlement, enabled: true, reinforcementLimit: 2 }).ok).toBe(true);
  expect(journal.record(game, { type: 'endTurn', factionId }).ok).toBe(true);
  const saved = serializeGame(game), name = 'reinforcement-logistics-mixed-history'; let db = new SaveStore(name);
  try {
    await db.saveCampaign(game, journal, 'manual'); db.close(); db = new SaveStore(name);
    const restored = await db.loadLatestCampaign('manual'), archive = restored.journal.materialize();
    expect(serializeGame(restored.game)).toBe(saved);
    expect(archive.initialSave).toBe(prior.archive.initialSave);
    expect(archive.records.slice(0, prior.entry.records)).toEqual(prior.archive.records);
    expect(archive.records.at(-1)).toMatchObject({ rulesVersion: 34, checkpointVersion: 34 });
    const imported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(restored.game, archive))));
    expect(imported.archive).toEqual(archive); expect(serializeGame(imported.game)).toBe(saved);
    expect(serializeGame(replayArchive(imported.archive))).toBe(saved);
    expect(imported.game.routes).toEqual(game.routes); expect(imported.game.postings).toEqual(game.postings);
    expect(imported.game.selectionGroups).toEqual(game.selectionGroups);
  } finally { await db.delete(); }
});

test('real paid supply offer and accepted agreement retain their fee, source, counter and replay after database reopen', async () => {
  const game = navalCampaign({ enemyFleet: false }), factionId = game.turnOwnerId, providerId = game.factions[1]!.id;
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const issue = (command: GameCommand) => expect(journal.record(game, command), JSON.stringify(command)).toMatchObject({ ok: true });
  issue({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  issue({ type: 'queueMovement', factionId, armyId: N.fleetId, target: N.voyageCell });
  for (let turns = 0; game.armies[N.fleetId]!.cell !== N.voyageCell && turns < 5; turns++) issue({ type: 'endTurn', factionId });
  expect(game.armies[N.fleetId]!.cell).toBe(N.voyageCell);
  issue({ type: 'proposeSupplyAccess', factionId, targetFactionId: providerId, settlementId: N.islandId, feeCoin: 10, termTurns: 5 });
  const offer = game.supplyAccess.offers[0]!; expect(offer).toMatchObject({ buyerId: factionId, providerId, feeCoin: 10, termTurns: 5 });
  const name = 'supply-access-paid-history'; let db = new SaveStore(name);
  try {
    await db.saveCampaign(game, journal, 'manual'); db.close(); db = new SaveStore(name);
    const pending = await db.loadLatestCampaign('manual'); expect(pending.game.supplyAccess.offers).toEqual([offer]);
    const buyerBefore = pending.game.factions.find(faction => faction.id === factionId)!.treasury;
    const providerBefore = pending.game.factions.find(faction => faction.id === providerId)!.treasury;
    expect(pending.journal.record(pending.game, { type: 'respondSupplyAccess', factionId: providerId, offerId: offer.id, accept: true }).ok).toBe(true);
    expect(pending.game.factions.find(faction => faction.id === factionId)!.treasury).toBe(buyerBefore - 10);
    expect(pending.game.factions.find(faction => faction.id === providerId)!.treasury).toBe(providerBefore + 10);
    expect(pending.game.supplyAccess).toMatchObject({ offers: [], nextId: 3 });
    const agreement = pending.game.supplyAccess.agreements[0]!;
    expect(agreement).toMatchObject({ source: offer.source, feeCoin: 10, startedTurn: pending.game.turn, expiresTurn: pending.game.turn + 5 });
    await db.saveCampaign(pending.game, pending.journal, 'manual'); db.close(); db = new SaveStore(name);
    const restored = await db.loadLatestCampaign('manual'), saved = serializeGame(restored.game), archive = restored.journal.materialize();
    const imported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(restored.game, archive))));
    expect(imported.game.supplyAccess).toEqual(restored.game.supplyAccess);
    expect(serializeGame(imported.game)).toBe(saved); expect(serializeGame(replayArchive(imported.archive))).toBe(saved);
    expect(imported.game.supplyAccess.agreements).toEqual([agreement]);
  } finally { await db.delete(); }
});
