import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash } from '@theandril/sim';
import { planTurn } from '@theandril/ai';
import { empireLandCampaign } from '../packages/test-fixtures/src/empire-land-fixture';
import { cellTransferBuffers, cellTransferBytes, packCells, unpackCells } from '../apps/web/src/cell-transfer';

const byteSize = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
function measure<T>(operation: () => T, samples = 12) {
  const elapsed: number[] = [];
  let result: T;
  for (let sample = -3; sample < samples; sample++) {
    const start = performance.now(); result = operation();
    if (sample >= 0) elapsed.push(performance.now() - start);
  }
  elapsed.sort((a, b) => a - b);
  return { result: result!, timing: { samples, meanMs: elapsed.reduce((a, b) => a + b, 0) / samples, medianMs: elapsed[Math.floor(samples / 2)], p95Ms: elapsed[Math.min(samples - 1, Math.floor(samples * .95))] } };
}

const scenarios = (['huge', 'legendary'] as const).map(size => {
  const game = empireLandCampaign(size), owner = game.turnOwnerId;
  const initialHash = stateHash(game), save = serializeGame(game);
  const full = measure(() => getObservation(game, owner));
  const summary = measure(() => getObservation(game, owner, { landDetails: 'none' }));
  const first = full.result.land.settlements[0]!;
  const single = measure(() => getSettlementLandObservation(game, owner, first.settlementId));
  assert.deepEqual(single.result, first);
  assert.deepEqual(summary.result, { ...full.result, land: { ...full.result.land, settlements: full.result.land.settlements.map(town => ({ ...town, cells: [] })) } });
  const plannedBefore = planTurn(full.result);
  for (const town of full.result.land.settlements) assert.deepEqual(getSettlementLandObservation(game, owner, town.settlementId), town);
  assert.deepEqual(planTurn(getObservation(game, owner)), plannedBefore);
  assert.equal(stateHash(game), initialHash); assert.equal(serializeGame(game), save);
  assert.equal(stateHash(deserializeGame(save)), initialHash);
  // Actual worker payload shape: cells travel separately; the summary has no cells key.
  const { cells, ...readModel } = summary.result;
  const { cells: previousCells, ...previousReadModel } = full.result;
  const pack = measure(() => packCells(cells));
  const unpack = measure(() => unpackCells(pack.result));
  assert.deepEqual(unpack.result, previousCells);
  const oldClone = measure(() => structuredClone(full.result));
  const newClone = measure(() => structuredClone({ observation: readModel, cells: pack.result }));
  const transfer = measure(() => {
    const detached = packCells(cells);
    return structuredClone({ observation: readModel, cells: detached }, { transfer: cellTransferBuffers(detached) });
  });
  assert.deepEqual(unpackCells(transfer.result.cells), cells);
  const result = {
    size, cells: game.world.terrain.length, factions: game.factions.length, ownTowns: full.result.land.settlements.length,
    armies: Object.keys(game.armies).length, claimed: full.result.land.settlements.reduce((sum, town) => sum + town.claimed.length, 0),
    candidateCells: full.result.land.settlements.reduce((sum, town) => sum + town.cells.length, 0), observedCells: cells.length, initialHash,
    landBytes: { full: byteSize(full.result.land), summary: byteSize(summary.result.land), selectedTown: byteSize(single.result) },
    payloadBytes: { oldObjectObservation: byteSize(full.result), oldNonCellReadModel: byteSize(previousReadModel), newNonCellReadModel: byteSize(readModel), packedCells: cellTransferBytes(pack.result), total: byteSize(readModel) + cellTransferBytes(pack.result) },
    times: { fullObservation: full.timing, summaryObservation: summary.timing, selectedTown: single.timing, pack: pack.timing, decode: unpack.timing, oldStructuredClone: oldClone.timing, newStructuredCloneWithoutTransfer: newClone.timing, packAndTransferClone: transfer.timing },
  };
  // Saved paid work: exact direct/full quotes, refresh after same-turn spending,
  // and complete turn-by-turn resumed state are independent from query timing.
  const work = first.cells.flatMap(cell => cell.improvementOptions.filter(option => option.canStart).map(option => ({ cell, option })))[0];
  assert.ok(work, 'authored empire must contain a real paid improvement opportunity');
  const command = { type: 'improveTile' as const, factionId: owner, settlementId: first.settlementId, cell: work.cell.cell, improvementId: work.option.improvementId };
  const debit = game.factions[0]!.treasury;
  assert.equal(applyCommand(game, command).ok, true);
  assert.equal(game.factions[0]!.treasury, debit - work.option.coinCost);
  const active = getSettlementLandObservation(game, owner, first.settlementId)!;
  assert.ok(active.work); assert.equal(active.canCancelWork, true);
  assert.deepEqual(active, getObservation(game, owner).land.settlements.find(town => town.settlementId === first.settlementId));
  const resumed = deserializeGame(serializeGame(game));
  for (let round = 0; round < 8; round++) {
    const end = { type: 'endTurn' as const, factionId: owner };
    assert.deepEqual(applyCommand(resumed, end), applyCommand(game, end));
    assert.equal(stateHash(game), stateHash(resumed));
    assert.deepEqual(getSettlementLandObservation(game, owner, first.settlementId), getSettlementLandObservation(resumed, owner, first.settlementId));
  }
  assert.equal(game.land.settlements[first.settlementId]!.improvements[work.cell.cell], work.option.improvementId);
  return { ...result, continuation: { turns: 8, finalHash: stateHash(game), improvementId: work.option.improvementId, paidCoin: work.option.coinCost }, heapMiB: process.memoryUsage().heapUsed / 1024 ** 2 };
});
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, contentHash: CONTENT_HASH,
  note: 'Sequential same-state full/scoped read comparison. Synthetic32/40-town owner, population8, retained1500/4000 armies; real paid claims/workers. Setup/JSON/equality/AI/mirror assertions excluded from selector timers. Node structuredClone timings are not browser worker latency. Last clone timer includes packing and transfer; others do not. Logical payload bytes exclude platform framing. No rendering or full AI rounds measured; eight end turns verify paid-work save continuation, not campaign pacing.', scenarios }, null, 2));
