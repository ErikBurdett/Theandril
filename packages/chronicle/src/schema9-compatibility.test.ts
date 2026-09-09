import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum, FACTIONS } from '@theandril/content';
import { applyCommandForVersion, createGame, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive } from './index';
import packed from './fixtures/v8-archives.json';

const capturedCase = z.object({ archive: z.unknown(), save: z.string(), hash: z.string() }).strict();
const captured = z.object({ capturedBefore: z.literal('Schema9 territories and dynamic faction ecology'), contentHash: z.literal('257e1e91'), journey: capturedCase, landing: capturedCase, battle: capturedCase, aftermath: capturedCase, growth: capturedCase, epic: capturedCase }).strict()
  .parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));
const golden = { journey: '5d7cc9d7', landing: '6e539669', battle: '3e96296f', aftermath: '59436979', growth: '4dcb29a8', epic: '97d13b69' } as const;

describe('genuine schema-8 evidence through territory rules', () => {
  it.each(Object.keys(golden) as (keyof typeof golden)[])('preserves the original %s save, every command and exact seal', name => {
    const fixture = captured[name], game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(packed.hashes).toEqual(golden); expect(fixture.hash).toBe(golden[name]);
    expect(stateHashForVersion(game, 8)).toBe(golden[name]); expect(serializeGameForVersion(game, 8)).toBe(fixture.save);
    expect(archive).toEqual(fixture.archive);
    expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });
  it('continues an old naval journey into paid land work without rewriting the old prefix', () => {
    const game = deserializeGame(captured.journey.save), archive = parseArchive(captured.journey.archive, game), prefix = structuredClone(archive.records);
    const town = Object.values(game.settlements).find(town => town.factionId === game.turnOwnerId)!;
    const cell = game.land.settlements[town.id]!.claimed.find(cell => cell !== town.cell && game.world.terrain[cell] === 1)!;
    expect(applyRecordedCommand(game, archive, { type: 'setWorkedTiles', factionId: game.turnOwnerId, settlementId: town.id, cells: [cell] }).ok).toBe(true);
    expect(applyRecordedCommand(game, archive, { type: 'improveTile', factionId: game.turnOwnerId, settlementId: town.id, cell, improvementId: 'improvement.terraced_fields' }).ok).toBe(true);
    for (let turn = 0; turn < 4; turn++) expect(applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    expect(archive.records.slice(0, prefix.length)).toEqual(prefix);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    expect(() => serializeGameForVersion(game, 8)).toThrow(/pre-territory|border progress|resources or development/);
  });
  it('rejects modern land orders under old rules without mutation and rejects forged new cultures in old envelopes', () => {
    const game = deserializeGame(captured.growth.save), hash = stateHash(game);
    expect(applyCommandForVersion(game, { type: 'setCapital', factionId: game.turnOwnerId, settlementId: Object.keys(game.settlements)[0] }, 8).ok).toBe(false);
    expect(stateHash(game)).toBe(hash);
    const forged = JSON.parse(captured.growth.save) as { state: { factions: { definitionId: string }[] }; stateChecksum: string };
    forged.state.factions[0]!.definitionId = 'faction.iron_covenant'; forged.stateChecksum = checksum(JSON.stringify(forged.state));
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow(/frozen pack/);
  });
});

describe('selected culture complete campaign provenance', () => {
  it.each(FACTIONS.map(faction => faction.id))('reconstructs the generated %s seat and its actual paid land orders', factionDefinitionId => {
    const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 6, factionDefinitionId });
    const archive = createArchive(game, { mode: 'player' }), factionId = game.turnOwnerId;
    expect(game.factions[0]!.definitionId).toBe(factionDefinitionId);
    expect(archive.coverage).toBe('complete');
    expect(applyRecordedCommand(game, archive, { type: 'found', factionId, armyId: 'army.1', name: 'Culture witness' }).ok).toBe(true);
    const town = getObservation(game, factionId).land.settlements[0]!;
    const site = town.cells.find(cell => cell.improvementOptions.some(option => option.canStart));
    expect(site).toBeDefined();
    const option = site!.improvementOptions.find(option => option.canStart)!;
    expect(applyRecordedCommand(game, archive, { type: 'improveTile', factionId, settlementId: town.settlementId, cell: site!.cell, improvementId: option.improvementId }).ok).toBe(true);
    for (let turn = 0; turn < option.turns; turn++) expect(applyRecordedCommand(game, archive, { type: 'endTurn', factionId }).ok).toBe(true);
    expect(game.land.settlements[town.settlementId]!.improvements[site!.cell]).toBe(option.improvementId);
    const restored = deserializeGame(serializeGame(game));
    expect(serializeGame(replayArchive(parseArchive(archive, restored)))).toBe(serializeGame(game));
  });
});
