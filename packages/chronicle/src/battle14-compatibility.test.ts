import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommandForVersion, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v13-battle-history.json';

const entry = z.object({ save: z.string(), archive: z.unknown(), hash: z.string(), saveBytes: z.number(), saveSha256: z.string(), replaySha256: z.string() }).strict();
const data = z.object({ saveVersion: z.literal(13), contentHash: z.literal('07a58d4f'), provenance: z.string(), cases: z.record(z.string(), entry) }).strict()
  .parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString()));

describe('genuine pre-ability field, assault and generated twenty-four-culture history', () => {
  it.each(Object.keys(data.cases))('retains %s exact old save bytes, results and replay checkpoints', name => {
    const fixture = data.cases[name]!, game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(fixture.hash).toBe((packed.hashes as Record<string, string>)[name]);
    expect(Buffer.byteLength(fixture.save)).toBe(fixture.saveBytes);
    expect(createHash('sha256').update(fixture.save).digest('hex')).toBe(fixture.saveSha256);
    expect(fixture.replaySha256).toBe(fixture.saveSha256);
    expect(stateHashForVersion(game, 13)).toBe(fixture.hash);
    expect(serializeGameForVersion(game, 13)).toBe(fixture.save);
    expect(serializeGameForVersion(replayArchive(archive), 13)).toBe(fixture.save);
    expect(archive.initialSaveVersion).toBe(13);
    expect(archive.records.every(record => record.rulesVersion === 13 && record.ok)).toBe(true);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    expect(Object.values(game.arcaneResearch).every(discoveries => discoveries.length === 0)).toBe(true);
    if (game.battle) expect(game.battle.rulesVersion).toBe(8);
  });

  it('regenerates the actual old Vesper24 origin without inventing a modern historical checkpoint', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 24, factionDefinitionId: 'faction.vesper_court', generatorVersion: 7, rosterVersion: 4, pace: 'short', rulesVersion: 13 });
    expect(serializeGameForVersion(game, 13)).toBe(data.cases.generatedOrigin!.save);
    expect(new Set(game.factions.map(faction => faction.definitionId)).size).toBe(24);
  });

  it.each(['fieldRoundOne', 'siegeRoundOne'] as const)('appends modern commands to %s without changing the old battle outcome or history', name => {
    const source = data.cases[name]!, game = deserializeGame(source.save), journal = resumeJournal(game, source.archive), before = journal.materialize();
    const expected = deserializeGame(data.cases[name === 'fieldRoundOne' ? 'fieldCompleted' : 'siegeCompleted']!.save);
    expect(journal.record(game, { type: 'autoResolveBattle', factionId: game.turnOwnerId }).ok).toBe(true);
    expect(game.battleReports).toEqual(expected.battleReports);
    const archive = journal.materialize();
    expect(archive.initialSave).toBe(before.initialSave);
    expect(archive.records.slice(0, before.records.length)).toEqual(before.records);
    expect(archive.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: null });
    expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  });

  it('refuses checksum-valid magic/battle9 injections into a frozen schema13 save', () => {
    for (const target of ['research', 'battle', 'policy'] as const) {
      // Preserve original key order when resealing, so this tests the frozen schema, not a checksum mismatch.
      const raw = JSON.parse(data.cases.fieldPending!.save) as { stateChecksum: string; state: { arcaneResearch?: unknown; battle: { rulesVersion: number; abilityState?: unknown } } };
      if (target === 'research') raw.state.arcaneResearch = [];
      if (target === 'battle') raw.state.battle.rulesVersion = 9;
      if (target === 'policy') raw.state.battle.abilityState = { sources: [] };
      raw.stateChecksum = checksum(JSON.stringify(raw.state));
      expect(() => deserializeGame(JSON.stringify(raw))).toThrow();
    }
  });

  it('refuses modern research, auto policy and spell commands under old campaign rules without mutation', () => {
    const game = deserializeGame(data.cases.fieldPending!.save), before = serializeGame(game), factionId = game.turnOwnerId;
    for (const command of [
      { type: 'researchArcane', factionId, discoveryId: 'arcane.ember_projection' },
      { type: 'setBattleAbilityAuto', factionId, battleId: game.battle!.id, sourceId: 'character.1', abilityId: 'spell.cinder_thread', automatic: false },
      { type: 'useBattleAbility', factionId, battleId: game.battle!.id, sourceId: 'character.1', abilityId: 'spell.cinder_thread', targetId: 'formation.1' },
    ]) {
      expect(applyCommandForVersion(game, command, 13)).toMatchObject({ ok: false, error: expect.stringContaining('Malformed command') });
      expect(serializeGame(game)).toBe(before);
    }
  });
});
