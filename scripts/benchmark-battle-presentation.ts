/** Real paid commands on an explicitly funded authored combat laboratory; no battle outcome injection. */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cpus } from 'node:os';
import { isDeepStrictEqual } from 'node:util';
import { CONTENT_HASH, ARCANE_DISCOVERIES } from '@theandril/content';
import { applyCommand, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type BattlePresentation, type GameCommand } from '@theandril/sim';
import { createJournal, replayArchive } from '@theandril/chronicle';
import { characterBattleCampaign, CHARACTER_FIXTURE as C } from '../packages/test-fixtures/src/character-fixture';
import { chooseBattleOrder } from '../packages/sim/src/combat';
import { benchmarkArmiesFleets } from './benchmark-armies-fleets';

const args = process.argv.slice(2), output = args[0];
if (args.length !== 1 || !output || !/^docs\/performance\/0035-[a-z-]+\.json$/.test(output)) throw new Error('Usage: tsx scripts/benchmark-battle-presentation.ts docs/performance/0035-<name>.json');
function requireValue(value: unknown, message: string): asserts value { if (!value) throw new Error('Battle benchmark: ' + message); }
function stats(samplesMs: number[]) {
  const ordered = [...samplesMs].sort((a, b) => a - b);
  return { samplesMs, medianMs: ordered[Math.floor(ordered.length / 2)]!, p95Ms: ordered[Math.ceil(ordered.length * .95) - 1]!, maxMs: ordered.at(-1)!, meanMs: ordered.reduce((a, b) => a + b, 0) / ordered.length };
}
const game = characterBattleCampaign(); game.factions[0]!.knowledge = 300;
const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
const issue = (command: GameCommand) => { const result = journal.record(game, command); requireValue(result.ok, `${command.type}: ${result.error}`); };
issue({ type: 'queue', factionId: C.playerFactionId, settlementId: C.homeId, itemId: 'building.archive' });
for (let turn = 0; turn < 20 && !game.settlements[C.homeId]!.buildings.includes('building.archive'); turn++) issue({ type: 'endTurn', factionId: C.playerFactionId });
requireValue(game.settlements[C.homeId]!.buildings.includes('building.archive'), 'paid archive did not complete');
const casterId = `character.${game.nextId}`;
issue({ type: 'recruitCharacter', factionId: C.playerFactionId, settlementId: C.homeId, definitionId: 'character.waykeeper' });
issue({ type: 'assignCharacter', factionId: C.playerFactionId, characterId: casterId, armyId: C.armyId });
for (const discovery of ARCANE_DISCOVERIES) issue({ type: 'researchArcane', factionId: C.playerFactionId, discoveryId: discovery.id });
issue({ type: 'declareWar', factionId: C.playerFactionId, targetFactionId: C.enemyFactionId });
issue({ type: 'attack', factionId: C.playerFactionId, armyId: C.armyId, targetArmyId: C.enemyArmyId });
const pending = serializeGame(game), origin = journal.materialize();
requireValue(serializeGame(replayArchive(origin)) === pending, 'paid setup replay mismatch');
const finish: GameCommand = { type: 'autoResolveBattle', factionId: C.playerFactionId };
const samples = 100, warmups = 7, withoutTrace: number[] = [], withTrace: number[] = [];
let expectedSave = '', expectedPacket = '', packet: BattlePresentation | undefined;
for (let sample = -warmups; sample < samples; sample++) {
  // Strict restoration and byte-equality checks are outside the measured ordinary command.
  for (const traced of sample % 2 === 0 ? [false, true] : [true, false]) {
    const state = deserializeGame(pending);
    const start = performance.now();
    const result = applyCommand(state, finish, undefined, traced ? value => { packet = value; } : undefined);
    const elapsed = performance.now() - start;
    requireValue(result.ok, 'autoresolve refused');
    const saved = serializeGame(state);
    if (!expectedSave) expectedSave = saved;
    requireValue(saved === expectedSave, 'trace or repeated execution changed canonical aftermath');
    if (sample >= 0) (traced ? withTrace : withoutTrace).push(elapsed);
    if (traced) {
      requireValue(packet, 'missing presentation');
      const text = JSON.stringify(packet);
      if (!expectedPacket) expectedPacket = text;
      requireValue(text === expectedPacket, 'repeated deterministic presentation differs');
    }
  }
}
const observed: BattlePresentation[] = [];
requireValue(journal.record(game, finish, undefined, value => observed.push(value)).ok, 'recorded resolve refused');
requireValue(serializeGame(game) === expectedSave && serializeGame(replayArchive(journal.materialize())) === expectedSave, 'complete paid archive replay mismatch');
requireValue(serializeGame(deserializeGame(expectedSave)) === expectedSave, 'strict aftermath roundtrip mismatch');
const manual = deserializeGame(pending);
while (manual.battle) requireValue(applyCommand(manual, { type: 'battleOrder', factionId: C.playerFactionId, order: chooseBattleOrder(manual.battle.combat, 'attacker') }).ok, 'manual mirror refused');
requireValue(isDeepStrictEqual(manual.battleReports, game.battleReports) && isDeepStrictEqual(manual.armies, game.armies), 'manual/auto combat aftermath mismatch');
requireValue(packet, 'no recorded packet');
requireValue(packet.events.some(event => event.abilityId?.startsWith('spell.')), 'paid caster never cast in measured battle');
const report = { createdAt: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  scope: 'Sequential offline kernel and ordinary paid-caster autoresolve, not GPU/browser/network/AI or maximum-caster performance. Restoration, setup, hashes and replay excluded from timings. Alternating traced/untraced order, seven warmups and100 measured samples each.',
  kernel: benchmarkArmiesFleets({ section: 'kernel' }),
  presentation: { samples, warmups, formationCount: packet.before.formations.length, characterCount: packet.before.characters.length,
    eventCount: packet.events.length, packetBytes: Buffer.byteLength(expectedPacket), rounds: packet.after.round,
    actualAbilities: [...new Set(packet.events.flatMap(event => event.abilityId ? [event.abilityId] : []))], withoutTrace: stats(withoutTrace), withTrace: stats(withTrace),
    paidSetupRecords: origin.records.length, allRecords: journal.materialize().records.length, stateHash: stateHash(game), exactReplay: true, exactSave: true, manualAutoCombatEquality: true } };
await writeFile(resolve(output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, stateHash: report.presentation.stateHash, events: report.presentation.eventCount,
  packetBytes: report.presentation.packetBytes, withoutTrace: { median: report.presentation.withoutTrace.medianMs, p95: report.presentation.withoutTrace.p95Ms },
  withTrace: { median: report.presentation.withTrace.medianMs, p95: report.presentation.withTrace.p95Ms } }, null, 2));
