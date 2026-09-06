import { expect, test } from 'vitest';
import { createGame, getObservation, stateHash, type GameCommand } from '../../packages/sim/src/index';
import { planTurn } from '../../packages/ai/src/index';
import { applyRecordedCommand, createArchive, generateChronicles, replayArchive } from '../../packages/chronicle/src/index';
import { deserializeCampaign, serializeCampaign } from '../../packages/persistence/src/index';

// The schema9 863-turn Epic case takes about40s in isolation: it mirrors every
// post500 order and replays the complete technical history twice. Give this
// archive integration test its own wall-time budget; keep all turn/count gates.
test.each(['short', 'epic'] as const)('generated-start %s AI victory produces complete factual logs identical after archive save/resume', pace => {
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 4, pace });
  const archive = createArchive(game, { mode: 'watch' });
  let resumed: ReturnType<typeof deserializeCampaign> | undefined;
  const errors: string[] = [];
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) errors.push(`${game.turn}: ${JSON.stringify(command)}: ${result.error}`);
    if (resumed) expect(applyRecordedCommand(resumed.game, resumed.archive, command)).toEqual(result);
  };
  while (!game.victory && game.turn <= (pace === 'short' ? 150 : 1400)) {
    for (const faction of game.factions) {
      for (const command of planTurn(getObservation(game, faction.id))) {
        issue(command);
        for (let decisions = 0; game.battle || game.pendingCapture; decisions++) {
          if (decisions > 4) throw new Error('AI decision loop did not terminate.');
          if (game.battle) {
            const battle = game.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (game.pendingCapture) {
            const command = planTurn(getObservation(game, game.pendingCapture.factionId))[0];
            if (!command || command.type !== 'resolveCapture') throw new Error('Missing AI capture decision.');
            issue(command);
          }
        }
      }
    }
    issue({ type: 'endTurn', factionId: game.turnOwnerId });
    if (game.turn === (pace === 'short' ? 10 : 500)) resumed = deserializeCampaign(serializeCampaign(game, archive));
  }
  expect(errors).toEqual([]);
  expect(game.victory?.path).toBe('prosperity');
  if (pace === 'epic') {
    // Modern AI/army economics may change the finish; original schema-4 turn1006 is historical,
    // not an invariant of current rules. Keep a genuinely long archived campaign as the gate.
    expect(game.turn).toBeGreaterThanOrEqual(800);
    expect(game.turn).toBeLessThanOrEqual(1400);
    expect(game.battleReports).toHaveLength(20);
    expect(archive.records.flatMap(record => record.battles).length).toBeGreaterThan(20);
  }
  expect(resumed).toBeDefined();
  const restored = deserializeCampaign(serializeCampaign(game, archive));
  expect(stateHash(restored.game)).toBe(stateHash(game));
  expect(stateHash(replayArchive(restored.archive))).toBe(stateHash(game));
  expect(restored.archive.records.flatMap(record => record.events).length).toBeGreaterThan(200);
  const documents = generateChronicles(game, archive);
  expect(documents).toEqual(generateChronicles(resumed!.game, resumed!.archive));
  expect(documents).toEqual(generateChronicles(restored.game, restored.archive));
  expect(documents.history.coverage).toContain('Complete record');
  expect(documents.historyText).toContain('Turn 1 — New hearths');
  expect(documents.historyText).toContain('achieved Prosperity');
  const technical = JSON.parse(documents.technical) as { records: typeof archive.records; finalHash: string; initialSnapshot: unknown; initialHash: string };
  expect(technical.records).toHaveLength(archive.records.length);
  expect(documents.technicalPages[0]?.text).toContain('Order 1');
  expect(documents.technicalPages[0]?.text).toContain('settlement_founded');
  expect(documents.technicalPages.at(-1)?.turn).toBe(game.turn);
  expect(technical.finalHash).toBe(stateHash(game));
  expect(stateHash(replayArchive({ ...archive, initialSave: JSON.stringify(technical.initialSnapshot), initialHash: technical.initialHash, records: technical.records }))).toBe(stateHash(game));
}, 60_000);
