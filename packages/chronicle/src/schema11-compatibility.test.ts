import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommandForVersion, deserializeGame, getObservation, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v10-archives.json';

const fixtureSchema = z.object({ archive: z.unknown(), save: z.string(), hash: z.string(), saveBytes: z.number().int(), saveSha256: z.string(), replaySha256: z.string() }).strict();
const names = ['twelveOrigin', 'activeImprovement', 'partialImprovement', 'improved', 'activeCultivation', 'cultivated', 'developmentOrigin', 'queuedConstruction', 'built', 'researched', 'activeMission', 'specialization', 'skilledMission', 'completed'] as const;
const captured = z.object({ capturedBefore: z.literal('Automatic city borders and expanded practical research'), saveVersion: z.literal(10), contentHash: z.literal('4c2fed32'), provenance: z.string(), ...Object.fromEntries(names.map(name => [name, fixtureSchema])) }).strict().parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));
const capturedFields = z.record(z.string(), z.unknown()).parse(captured);
const fixtures = z.record(z.enum(names), fixtureSchema).parse(Object.fromEntries(names.map(name => [name, capturedFields[name]])));
// Captured before schema11/content mutation; these are independent old-engine
// anchors, not future reconstructions. The source generator refuses new content.
const golden = {
  twelveOrigin: ['d90685b3', 27830, '3094736ba05d7b3aab4824a17b0939e6d6bb92b46925cf0edf47d12cbf3760ee'],
  activeImprovement: ['a1beca53', 41056, '574085d96b3cb727c706deebeff7bfca4e023e455c481740ea7d2ee3157995db'],
  partialImprovement: ['f4525518', 42524, '0feb51fb40edcb989a30e193ffbeadc212f701cb7177b9ad9f39d79943b0d255'],
  improved: ['16aa2ced', 44475, '3da009d62969e4a00305663bdaf35db85bc13f8a43b6b7cf6430a2635a516ffe'],
  activeCultivation: ['cf5f8a99', 51686, '719d27b1748512b066253bc92c328a02e786c31de1fe44029fecac2fe50f00a5'],
  cultivated: ['e090156e', 54962, '9e547cb00cf12bf1af70c9c3edbd553c0cdbd35cc623c024ff19bc7627456ba7'],
  developmentOrigin: ['9641fc9a', 14953, '9854fe24f1cbdc8d113e878f8a23018cf954c696857433245247934d6f253a49'],
  queuedConstruction: ['fa92d724', 16885, 'de213e34cc7b6809b648f0c29f8071a898a0238ad219c650795dc2d63d366fc4'],
  built: ['a994b30e', 19058, 'fb686d0205f4507d155d2370664b3529e885fd810e89152e8b793877facdfbd3'],
  researched: ['96b9a61c', 22101, '2de11ce337aa2651e1f75b2d6af113f730f6c982d80ab9e87c67404afc44205b'],
  activeMission: ['fea9866d', 23288, '5d32ecb3d1cade0e5fe564fbc38f9c8a99c932564815c067b1cad3d639bd9dd9'],
  specialization: ['b42cb97e', 27310, '863eed7e77e2d56b448f4e4ea4ffe6a7980b54b8f6cac20ac277440f6a81e81e'],
  skilledMission: ['b58c1455', 27949, '8c8e3630fadb29a19cfc79a9fba775a2034528a556d30173a2b19d050266084a'],
  completed: ['9d7b9d64', 28258, '7f62841c69471ed4800645b8d82352463fba4e1d8b3cd26cae393d432517e8af'],
} as const;
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

describe('genuine schema10 campaigns preserved through city research', () => {
  it.each(names)('retains %s exact source bytes, command results and old-rule replay', name => {
    const fixture = fixtures[name], [hash, bytes, sha] = golden[name];
    expect(packed.encoding).toBe('gzip-base64'); expect(packed.hashes[name]).toBe(hash);
    expect(fixture.hash).toBe(hash); expect(fixture.saveBytes).toBe(bytes);
    expect(Buffer.byteLength(fixture.save)).toBe(bytes); expect(sha256(fixture.save)).toBe(sha);
    expect(fixture.saveSha256).toBe(sha); expect(fixture.replaySha256).toBe(sha);
    const game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(archive.coverage).toBe('complete'); expect(archive).toEqual(fixture.archive);
    expect(game.rosterVersion).toBe(3); expect(game.world.generatorVersion).toBe(4);
    expect(Object.values(game.land.settlements).every(land => land.borderGrowth === 0)).toBe(true);
    expect(stateHashForVersion(game, 10)).toBe(hash); expect(serializeGameForVersion(game, 10)).toBe(fixture.save);
    expect(serializeGameForVersion(replayArchive(archive), 10)).toBe(fixture.save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it.each([['activeImprovement', 'improved'], ['activeCultivation', 'cultivated'], ['queuedConstruction', 'built'], ['activeMission', 'specialization'], ['skilledMission', 'completed']] as const)('continues %s through its real original suffix to %s', (start, end) => {
    const game = deserializeGame(fixtures[start].save), first = parseArchive(fixtures[start].archive, game);
    const final = parseArchive(fixtures[end].archive, deserializeGame(fixtures[end].save));
    expect(final.records.slice(0, first.records.length)).toEqual(first.records);
    for (const record of final.records.slice(first.records.length)) {
      const result = applyCommandForVersion(game, record.command, 10);
      expect(result.ok).toBe(record.ok); expect(result.events).toEqual(record.events);
      expect(result.error ?? null).toBe(record.error);
    }
    expect(serializeGameForVersion(game, 10)).toBe(fixtures[end].save);
  });

  it('preserves paid infrastructure, practical knowledge and mission-earned specialization', () => {
    const queued = deserializeGame(fixtures.queuedConstruction.save), completed = deserializeGame(fixtures.completed.save);
    const town = Object.values(completed.settlements)[0]!, character = Object.values(completed.characters)[0]!;
    expect(Object.values(queued.settlements)[0]!.queue.some(item => item.progress > 0)).toBe(true);
    expect(town.buildings).toEqual(['building.archive', 'building.granary', 'building.market', 'building.workshop']);
    expect(completed.progression[completed.turnOwnerId]).toEqual({ technologies: ['technology.cinder_masonry', 'technology.civic_accounts', 'technology.coastal_navigation', 'technology.ocean_navigation'], institutionId: 'institution.common_stewardship', doctrineId: 'doctrine.march_columns' });
    expect(character).toMatchObject({ definitionId: 'character.surveyor', skillId: 'skill.fieldcraft', learnedSkillIds: [], experience: 4, mission: null });
    expect(completed.world).toEqual(queued.world);
    const archive = parseArchive(fixtures.completed.archive, completed);
    expect(archive.records.flatMap(record => record.events).filter(event => event.type === 'character_mission_completed')).toHaveLength(4);
    expect(archive.records.some(record => (record.command as { type: string }).type === 'moveTo')).toBe(true);
  });

  it.each(['activeImprovement', 'activeCultivation', 'skilledMission'] as const)('appends modern %s continuation without changing an old record or seal', name => {
    const game = deserializeGame(fixtures[name].save), journal = resumeJournal(game, fixtures[name].archive);
    const original = journal.materialize(), prefix = JSON.stringify(original.records);
    const mirror = deserializeGame(serializeGame(game)), mirrored = resumeJournal(mirror, original);
    for (let step = 0; step < 4; step++) {
      const command = { type: 'endTurn', factionId: game.turnOwnerId } as const;
      expect(journal.record(game, command)).toEqual(mirrored.record(mirror, command));
    }
    const archive = journal.materialize(), suffix = archive.records.slice(original.records.length);
    expect(JSON.stringify(archive.records.slice(0, original.records.length))).toBe(prefix);
    expect(archive.initialSave).toBe(original.initialSave); expect(archive.initialSaveVersion).toBe(10);
    expect(suffix.every(record => record.rulesVersion === SAVE_VERSION && record.checkpointVersion === SAVE_VERSION)).toBe(true);
    expect(suffix.at(-1)?.checkpoint).toBe(stateHash(game));
    expect(archive).toEqual(mirrored.materialize()); expect(serializeGame(game)).toBe(serializeGame(mirror));
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
  });

  it('rejects checksum-valid new research, improvements and border state inside old schema10', () => {
    const old = z.object({ stateChecksum: z.string(), state: z.object({ progression: z.array(z.object({ technologies: z.array(z.string()) }).passthrough()), land: z.object({ settlements: z.record(z.string(), z.object({ improvements: z.record(z.string(), z.string()) }).passthrough()) }).passthrough() }).passthrough() }).passthrough();
    const read = (save: string): z.infer<typeof old> => {
      const raw: unknown = JSON.parse(save); old.parse(raw);
      // Keep original canonical field order after independently checking shape.
      return raw as z.infer<typeof old>;
    };
    const technology = read(fixtures.researched.save);
    technology.state.progression[0]!.technologies.push('technology.stewardship'); technology.state.progression[0]!.technologies.sort();
    technology.stateChecksum = checksum(JSON.stringify(technology.state));
    expect(() => deserializeGame(JSON.stringify(technology))).toThrow(/v10.*frozen/);
    const improvement = read(fixtures.improved.save);
    const town = Object.values(improvement.state.land.settlements).find(land => Object.keys(land.improvements).length)!;
    town.improvements[Object.keys(town.improvements)[0]!] = 'improvement.polder'; improvement.stateChecksum = checksum(JSON.stringify(improvement.state));
    expect(() => deserializeGame(JSON.stringify(improvement))).toThrow(/v10.*frozen/);
    const growth = read(fixtures.improved.save);
    Object.values(growth.state.land.settlements)[0]!.borderGrowth = 1; growth.stateChecksum = checksum(JSON.stringify(growth.state));
    expect(() => deserializeGame(JSON.stringify(growth))).toThrow(/borderGrowth/);
  });

  it('refuses modern actions under old rules without silently changing campaign state', () => {
    const game = deserializeGame(fixtures.researched.save), before = stateHash(game), factionId = game.turnOwnerId;
    expect(applyCommandForVersion(game, { type: 'research', factionId, technologyId: 'technology.stewardship' }, 10).ok).toBe(false);
    const town = Object.values(game.settlements)[0]!, cell = game.land.settlements[town.id]!.claimed.find(cell => cell !== town.cell)!;
    expect(applyCommandForVersion(game, { type: 'improveTile', factionId, settlementId: town.id, cell, improvementId: 'improvement.polder' }, 10).ok).toBe(false);
    expect(stateHash(game)).toBe(before);
    expect(getObservation(game, factionId, { landDetails: 'none' }).land.settlements[0]?.borderExpansion).toMatchObject({ progress: 0 });
    game.land.settlements[town.id]!.borderGrowth = 1;
    expect(() => serializeGameForVersion(game, 10)).toThrow(/border progress/);
    game.land.settlements[town.id]!.borderGrowth = 0;
    game.progression[factionId]!.technologies.push('technology.stewardship');
    expect(() => serializeGameForVersion(game, 10)).toThrow(/v10.*frozen/);
  });
});
