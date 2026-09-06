import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { cpus, platform, release, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { CONTENT_HASH } from '@theandril/content';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { cellTransferBuffers, cellTransferBytes, packCells, unpackCells, type ObservedCell } from '../apps/web/src/cell-transfer';

const WARMUPS = 3, SAMPLES = 12;
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
function timed<T>(operation: () => T) { const start = performance.now(), result = operation(); return { result, ms: performance.now() - start }; }
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, meanMs: values.reduce((sum, value) => sum + value, 0) / values.length, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))]!, maxMs: sorted.at(-1)! };
}
function measure(cells: ObservedCell[], samples: number) {
  const original = JSON.stringify(cells), hash = sha(original), oldJsonBytes = Buffer.byteLength(original);
  const packMs: number[] = [], transferMs: number[] = [], decodeMs: number[] = [], oldCloneMs: number[] = [], combinedMs: number[] = [];
  let bytes = 0, binaryBytes = 0, metadataRows = 0, dictionaryEntries = 0;
  for (let index = 0; index < WARMUPS + samples; index++) {
    const oldClone = timed(() => structuredClone(cells));
    assert.equal(sha(JSON.stringify(oldClone.result)), hash, 'object-clone baseline differs');
    const packed = timed(() => packCells(cells));
    const buffers = cellTransferBuffers(packed.result);
    bytes = cellTransferBytes(packed.result); binaryBytes = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
    metadataRows = packed.result.metadata.length / 5; dictionaryEntries = packed.result.dictionary.length;
    const transferred = timed(() => structuredClone(packed.result, { transfer: buffers }));
    assert(buffers.every(buffer => buffer.byteLength === 0), 'sender packet did not detach');
    const decoded = timed(() => unpackCells(transferred.result));
    assert.equal(sha(JSON.stringify(decoded.result)), hash, 'transferred/decompressed observed cells differ');
    if (index >= WARMUPS) {
      oldCloneMs.push(oldClone.ms); packMs.push(packed.ms); transferMs.push(transferred.ms); decodeMs.push(decoded.ms); combinedMs.push(packed.ms + transferred.ms + decoded.ms);
    }
  }
  assert.equal(JSON.stringify(cells), original, 'packing rewrote source observation');
  return { cells: cells.length, oldJsonBytes, packedBytes: bytes, binaryBytes, dictionaryAndMetadataBytes: bytes - binaryBytes,
    sparseMetadataRows: metadataRows, dictionaryEntries, reductionPercent: (1 - bytes / oldJsonBytes) * 100, observedCellsSeal: hash,
    objectStructuredClone: distribution(oldCloneMs), pack: distribution(packMs), transferStructuredClone: distribution(transferMs), unpack: distribution(decodeMs), packTransferUnpack: distribution(combinedMs) };
}

function workload(size: 'tiny' | 'huge' | 'legendary', smoke: boolean) {
  let game = createGame({ seed: 20260905, size, factionCount: size === 'tiny' ? 6 : size === 'huge' ? 32 : 40, pace: 'epic' });
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
    assert(applyCommand(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' Shore' }).ok);
  }
  // Explicit explored-terrain setup only: current sight and last-seen foreign
  // ownership are untouched. This is full-map transfer stress, not earned scouting.
  for (let cell = 0; cell < game.world.terrain.length; cell++) game.explored[game.turnOwnerId]!.add(cell);
  game = deserializeGame(serializeGame(game));
  const origin = serializeGame(game), beforeHash = stateHash(game), before = getObservation(game, game.turnOwnerId, { landDetails: 'none' }).cells;
  const independent = Object.values(game.armies).find(army => army.factionId === game.turnOwnerId)!;
  let move: GameCommand | undefined;
  for (const target of neighbors(independent.cell, game.world.width, game.world.height)) {
    const command: GameCommand = { type: 'move', factionId: game.turnOwnerId, armyId: independent.id, target };
    const result = applyCommand(game, command);
    if (result.ok) { move = command; break; }
    assert.equal(stateHash(game), beforeHash, 'failed fixture move was not atomic');
  }
  assert(move, 'no legal public move available to produce a genuine delta');
  const after = getObservation(game, game.turnOwnerId, { landDetails: 'none' }).cells, afterHash = stateHash(game);
  const prior = new Map(before.map(cell => [cell.cell, JSON.stringify(cell)]));
  const delta = after.filter(cell => prior.get(cell.cell) !== JSON.stringify(cell));
  assert(delta.length > 0 && delta.length < after.length, 'public movement did not produce a sparse observed delta');
  const mirror = deserializeGame(origin);
  assert(applyCommand(mirror, move).ok); assert.equal(stateHash(mirror), afterHash, 'saved public move mirror differs');
  const samples = smoke ? 2 : SAMPLES;
  const full = measure(after, samples), changed = measure(delta, samples), empty = measure([], samples);
  assert.equal(stateHash(game), afterHash, 'transfer diagnostic mutated canonical state');
  assert.equal(stateHash(deserializeGame(serializeGame(game))), afterHash, 'post-transfer strict load differs');
  return { size, factions: game.factions.length, towns: Object.keys(game.settlements).length, fullyExplored: true, visible: after.filter(cell => cell.visible).length,
    movementCommand: move, beforeHash, afterHash, full, delta: changed, empty,
    heapUsedBytes: process.memoryUsage().heapUsed, rssBytes: process.memoryUsage().rss };
}

export function benchmarkCellTransfer(smoke = false) {
  assert.equal(CONTENT_HASH, '9418e598', 'seal changed; create an intentional new performance checkpoint');
  return { capturedAt: new Date().toISOString(), command: 'node --import tsx scripts/benchmark-cell-transfer.ts' + (smoke ? ' --smoke' : ' --output'),
    runtime: process.version, os: platform() + ' ' + release(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, installedMemoryBytes: totalmem(), contentHash: CONTENT_HASH,
    warmups: WARMUPS, samples: smoke ? 2 : SAMPLES, workloads: (smoke ? ['tiny'] as const : ['huge', 'legendary'] as const).map(size => workload(size, smoke)),
    scope: 'Actual observed cells from generated worlds with public founding and movement; full exploration is authored then strictly loaded. Three warmups excluded. Node structuredClone with real transfer detaches packet buffers; this is not browser postMessage scheduling or rendering. Packing and full decoder validation are included, while accounting, hashes, saved movement mirror and JSON comparisons are excluded. Logical bytes count binary byteLength plus UTF-8 metadata/dictionary; implementation-specific clone framing/decoded heap is not included. Heap/RSS are unforced-GC process samples, not leak proof. Empty packets may exceed [] JSON size.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert(args.every(arg => arg === '--smoke' || arg === '--output'), 'arguments: --smoke and --output');
  assert(!(args.includes('--smoke') && args.includes('--output')), 'smoke must not overwrite retained measurements');
  const output = JSON.stringify(benchmarkCellTransfer(args.includes('--smoke')), null, 2) + '\n';
  if (args.includes('--output')) writeFileSync(resolve('docs/performance/0017-cell-transfer.json'), output);
  console.log(output);
}
