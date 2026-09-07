import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { aiObservationOptions, planTurnWithReasons } from '@theandril/ai';
import { getObservation, serializeGame, stateHash, SAVE_VERSION } from '@theandril/sim';
import { empireLandCampaign } from '../packages/test-fixtures/src/empire-land-fixture';

const distribution = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.floor(sorted.length * .95)]! };
};
const measurements: object[] = [];
for (const size of ['huge', 'legendary'] as const) {
  const state = empireLandCampaign(size), before = serializeGame(state);
  const fullMs: number[] = [], scopedMs: number[] = [];
  for (let sample = -4; sample < 20; sample++) {
    // Alternate order so the first read does not systematically get the warmer host.
    const kinds = sample % 2 ? ['scoped', 'full'] as const : ['full', 'scoped'] as const;
    for (const kind of kinds) {
      const started = performance.now();
      getObservation(state, state.turnOwnerId, kind === 'scoped' ? aiObservationOptions(state.turn) : {});
      if (sample >= 0) (kind === 'full' ? fullMs : scopedMs).push(performance.now() - started);
    }
  }
  const full = getObservation(state, state.turnOwnerId), scoped = getObservation(state, state.turnOwnerId, aiObservationOptions(state.turn));
  const fullPlan = planTurnWithReasons(full), scopedPlan = planTurnWithReasons(scoped);
  assert.deepEqual(scopedPlan, fullPlan);
  assert.equal(serializeGame(state), before);
  measurements.push({ size, turn: state.turn, cells: state.world.terrain.length, globalArmies: Object.keys(state.armies).length,
    ownedTowns: full.land.settlements.length, fullDetailedTowns: full.land.settlements.filter(town => town.cells.length).length,
    scopedDetailedTowns: scoped.land.settlements.filter(town => town.cells.length).length,
    fullDetailedCells: full.land.settlements.reduce((sum, town) => sum + town.cells.length, 0),
    scopedDetailedCells: scoped.land.settlements.reduce((sum, town) => sum + town.cells.length, 0),
    full: distribution(fullMs), scoped: distribution(scopedMs),
    diagnosticFullObservationBytes: Buffer.byteLength(JSON.stringify(full)), diagnosticScopedObservationBytes: Buffer.byteLength(JSON.stringify(scoped)),
    proposedCommands: fullPlan.commands.length, exactCommandsAndReasons: true, unchangedSave: true, hash: stateHash(state) });
}
console.log(JSON.stringify({ schema: SAVE_VERSION, content: CONTENT_HASH, runtime: process.version, cpu: cpus()[0]?.model,
  note: 'Same-state warm reads; four warmups and twenty samples per mode, alternating full/scoped order. Synthetic ownership/population/army setup; all additional land claims use actual paid commands. No elapsed campaign turns, archive, disk persistence, rendering or plan execution in these timings. Complete AI commands/reasons and unchanged saved bytes checked outside timing. JSON sizes are diagnostic, not worker transfers.', measurements }, null, 2));
