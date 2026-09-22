import { expect, test } from 'vitest';
import { deepStrictEqual } from 'node:assert';
import { createGame, deserializeGame, getObservation, stateHash, type GameCommand } from '../../packages/sim/src/index';
import { aiObservationOptions, planTurn } from '../../packages/ai/src/index';
import { applyRecordedCommand, createArchive, generateChronicles, replayArchive } from '../../packages/chronicle/src/index';
import { deserializeCampaign, serializeCampaign } from '../../packages/persistence/src/index';

// The Epic case plays a full rules-18 campaign (about 350–400 turns): it mirrors
// every order after turn 200 and replays the complete history once.
test.each(['short', 'epic'] as const)('generated-start %s AI victory produces complete factual logs identical after archive save/resume', pace => {
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 4, pace });
  const archive = createArchive(game, { mode: 'watch' });
  let resumed: ReturnType<typeof deserializeCampaign> | undefined;
  const errors: string[] = [];
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) errors.push(`${game.turn}: ${JSON.stringify(command)}: ${result.error}`);
    // Compare the complete result (including absent/undefined distinctions) without
    // a general matcher wrapper for every mirrored command in a thousand-turn run.
    if (resumed) deepStrictEqual(applyRecordedCommand(resumed.game, resumed.archive, command), result);
  };
  while (!game.victory && game.turn <= (pace === 'short' ? 150 : 450)) {
    for (const faction of game.factions) {
      for (const command of planTurn(getObservation(game, faction.id, aiObservationOptions(game.turn)))) {
        issue(command);
        for (let decisions = 0; game.battle || game.pendingCapture; decisions++) {
          if (decisions > 4) throw new Error('AI decision loop did not terminate.');
          if (game.battle) {
            const battle = game.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (game.pendingCapture) {
            const command = planTurn(getObservation(game, game.pendingCapture.factionId, aiObservationOptions(game.turn)))[0];
            if (!command || command.type !== 'resolveCapture') throw new Error('Missing AI capture decision.');
            issue(command);
          }
        }
      }
    }
    issue({ type: 'endTurn', factionId: game.turnOwnerId });
    if (game.turn === (pace === 'short' ? 10 : 200)) resumed = deserializeCampaign(serializeCampaign(game, archive));
  }
  expect(errors).toEqual([]);
  expect(game.victory?.path).toBe('prosperity');
  if (pace === 'epic') {
    expect(game.turn).toBeGreaterThanOrEqual(300);
    expect(game.turn).toBeLessThanOrEqual(450);
    expect(game.battleReports).toHaveLength(20);
    expect(archive.records.flatMap(record => record.battles).length).toBeGreaterThan(20);
  }
  expect(resumed).toBeDefined();
  const restored = deserializeCampaign(serializeCampaign(game, archive));
  expect(stateHash(restored.game)).toBe(stateHash(game));
  expect(stateHash(replayArchive(restored.archive))).toBe(stateHash(game));
  expect(restored.archive.records.flatMap(record => record.events).length).toBeGreaterThan(200);
  const documents = generateChronicles(game, archive);
  deepStrictEqual(documents, generateChronicles(resumed!.game, resumed!.archive));
  deepStrictEqual(documents, generateChronicles(restored.game, restored.archive));
  expect(documents.history.coverage).toContain('Complete record');
  expect(documents.historyText).toContain('Turn 1 — New hearths');
  expect(documents.historyText).toContain('achieved Prosperity');
  const technical = JSON.parse(documents.technical) as { records: typeof archive.records; finalHash: string; initialSnapshot: unknown; initialHash: string };
  expect(technical.records).toHaveLength(archive.records.length);
  expect(documents.technicalPages[0]?.text).toContain('Order 1');
  expect(documents.technicalPages[0]?.text).toContain('settlement_founded');
  expect(documents.technicalPages.at(-1)?.turn).toBe(game.turn);
  expect(technical.finalHash).toBe(stateHash(game));
  // The technical download must carry the complete replay input. Its key-sorted
  // snapshot must load to the archived starting seal, and its records must equal
  // the restored archive that was already replayed to the final seal above.
  // Replay parses each command and compares results order-insensitively, so this
  // proves the download replays identically without a second full replay.
  expect(technical.initialHash).toBe(archive.initialHash);
  expect(stateHash(deserializeGame(JSON.stringify(technical.initialSnapshot)))).toBe(archive.initialHash);
  deepStrictEqual(technical.records, restored.archive.records);
}, 60_000);
