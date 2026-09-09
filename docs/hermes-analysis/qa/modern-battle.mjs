// Current rules10 battle latency, not the historical default8 kernel benchmark.
import { strict as assert } from 'node:assert';
import { writeFile } from 'node:fs/promises';
import { fullBattlefieldCampaign } from '../../../tests/gameplay/battlefield-fixture.ts';
import { applyCommand, deserializeGame, serializeGame, stateHash, SAVE_VERSION } from '@theandril/sim';
import { chooseBattleOrder } from '../../../packages/sim/src/combat/index.ts';

const state = fullBattlefieldCampaign(), factionId = state.turnOwnerId;
for (const command of [{ type: 'declareWar', factionId, targetFactionId: state.factions[1].id }, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' }]) assert(applyCommand(state, command).ok);
assert.equal(state.battle.rulesVersion, 10);
const pending = serializeGame(state), entering = [...state.battle.combat.attacker, ...state.battle.combat.defender].reduce((sum, formation) => sum + formation.strength, 0);
const samples = [], retained = []; let expectedSave, firstTrace;
const stats = values => { const sorted = [...values].sort((a, b) => a - b); return { samples: sorted.length, p50Ms: sorted[Math.floor(sorted.length * .5)], p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1) }; };
for (let sample = -5; sample < 30; sample++) {
  for (const traced of sample % 2 ? [false, true] : [true, false]) {
    const game = deserializeGame(pending); let packet;
    const start = performance.now();
    const result = applyCommand(game, { type: 'autoResolveBattle', factionId }, undefined, traced ? trace => { packet = trace; } : undefined);
    const elapsedMs = performance.now() - start;
    assert(result.ok); assert.equal(game.battle, null);
    const saved = serializeGame(game);
    if (!expectedSave) expectedSave = saved;
    assert.equal(saved, expectedSave);
    assert.equal(serializeGame(deserializeGame(saved)), saved);
    if (packet && !firstTrace) firstTrace = packet;
    if (packet) assert.deepEqual(packet, firstTrace);
    if (sample >= 0) samples.push({ sample, traced, elapsedMs, presentationBytes: packet ? Buffer.byteLength(JSON.stringify(packet)) : null });
  }
  if ([0, 9, 19, 29].includes(sample)) {
    if (global.gc) global.gc();
    retained.push({ sample, forcedGc: Boolean(global.gc), ...process.memoryUsage() });
  }
}
const manual = deserializeGame(pending), manualRounds = [];
while (manual.battle) {
  const order = chooseBattleOrder(manual.battle.combat, 'attacker'), start = performance.now();
  assert(applyCommand(manual, { type: 'battleOrder', factionId, order }).ok);
  manualRounds.push(performance.now() - start);
}
const auto = deserializeGame(expectedSave);
assert.deepEqual(manual.armies, auto.armies); assert.deepEqual(manual.battleReports, auto.battleReports);
const report = { measuredAt: new Date().toISOString(), node: process.version, saveVersion: SAVE_VERSION, battleRules: 10, formations: [...state.battle.combat.attacker, ...state.battle.combat.defender].length, enteringSoldiers: entering,
  pendingSaveBytes: Buffer.byteLength(pending), resultSaveBytes: Buffer.byteLength(expectedSave), pendingHash: stateHash(state), resultHash: stateHash(auto),
  withoutPresentation: stats(samples.filter(item => !item.traced).map(item => item.elapsedMs)), withPresentation: stats(samples.filter(item => item.traced).map(item => item.elapsedMs)), manualRounds: stats(manualRounds), samples, retained,
  presentation: { bytes: Buffer.byteLength(JSON.stringify(firstTrace)), events: firstTrace.events.length, rounds: firstTrace.after.round }, manualAutoAftermathEqual: true, exactRepeatedSaveAndPresentation: true,
  scope: 'Funded veteran20vs20 authored fixture with40mixed real formations and6officers, real war/attack/autoresolve commands on current battle10. Five warmups plus30 measured samples per traced/untraced mode, alternating order. Restoration, equality checks, packet stringify and forcedGC are outside command timing. Current battle packet and canonical aftermath exact; manual commands produce different campaign journal chronology but equal armies/reports. Four explicit postGC process samples on a fixed workload are not a long-campaign leak proof. Concurrent gameplay and other-agent CPU tasks may affect timings.' };
await writeFile('/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa/modern-battle.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, samples: undefined, retained: report.retained.map(({ sample, heapUsed, rss }) => ({ sample, heapUsed, rss })) }, null, 2));
