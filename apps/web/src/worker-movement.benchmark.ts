/** Run explicitly with tsx. Real worker queries, canonical travel and structured
 * clone transfers; single samples are not percentile or renderer evidence. */
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { hexDistance } from '@theandril/mapgen';
import { createArmyFormation, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { createJournal, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore } from '@theandril/persistence';
import { matureCampaign } from '../../../packages/test-fixtures/src/index';
import { MAX_GROUP_ORDER_COMMANDS, type GroupMovementCommand, type Request, type Response } from './protocol';
import { unpackCells } from './cell-transfer';

type WithoutId<T> = T extends { id: number } ? Omit<T, 'id'> : never;
type Waiter = { resolve: (reply: Response) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<number, Waiter>();
let sequence = 0, stateResponses = 0;
const host: { onmessage: ((event: MessageEvent<Request>) => void) | null; postMessage: (reply: Response, options?: StructuredSerializeOptions) => void } = {
  onmessage: null,
  postMessage(reply, options) {
    const received = structuredClone(reply, options);
    if (received.type === 'progress') return;
    const waiter = pending.get(received.id);
    assert(waiter, `Unexpected worker reply ${received.id}`);
    if (received.type === 'state') stateResponses++;
    pending.delete(received.id); clearTimeout(waiter.timer); waiter.resolve(received);
  },
};
const originalSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');
Object.defineProperty(globalThis, 'self', { configurable: true, value: host });
async function request<K extends Response['type']>(body: WithoutId<Request>, expected: K): Promise<Extract<Response, { type: K }>> {
  const id = ++sequence;
  const reply = await new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Worker ${body.type} exceeded the bounded60-second benchmark timeout.`)); }, 60_000);
    pending.set(id, { resolve, reject, timer });
    assert(host.onmessage); host.onmessage({ data: structuredClone({ ...body, id }) } as MessageEvent<Request>);
  });
  assert.equal(reply.type, expected, 'message' in reply ? reply.message : body.type);
  return reply as Extract<Response, { type: K }>;
}

function expandedFixture(base: GameState) {
  const game = deserializeGame(serializeGame(base));
  const own = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId);
  const source = own[0]!;
  while (own.length < MAX_GROUP_ORDER_COMMANDS) {
    const id = `army.${game.nextId++}`;
    const army = { id, factionId: game.turnOwnerId, cell: source.cell, name: `Authored ceiling march ${own.length + 1}`, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    game.armies[id] = army; own.push(army);
  }
  return deserializeGame(serializeGame(game));
}

async function measure(game: GameState, size: 'huge' | 'legendary', sample: 'mature' | 'ceiling') {
  const factionId = game.turnOwnerId;
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  const armyIds = armies.map(army => army.id), origin = armies[0]!.cell;
  assert(armyIds.length <= MAX_GROUP_ORDER_COMMANDS);
  const view = getObservation(game, factionId, { landDetails: 'none', developmentCandidates: false });
  // The generated mature fixture has co-located armies. Choose its farthest
  // explored legal destination; do not fabricate a clear road or reveal fog.
  const target = [...view.cells].sort((a, b) => hexDistance(b.cell, origin, view.width) - hexDistance(a.cell, origin, view.width) || a.cell - b.cell)
    .find(cell => getMovementPreview(view, armies[0]!.id, cell.cell).canQueue)?.cell;
  assert.notEqual(target, undefined, 'Mature fixture needs a permitted travel destination.');
  const initial = await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
  const beforeResponses = stateResponses, queryStarted = performance.now();
  const review = await request({ type: 'groupMovementPreview', factionId, armyIds: [...armyIds].reverse(), target: target!, append: false }, 'groupMovementPreview');
  const queryElapsedMs = performance.now() - queryStarted;
  assert.equal(stateResponses, beforeResponses); assert.equal(review.hash, initial.hash);
  assert.equal(review.results.length, armyIds.length); assert(review.results.every(row => row.canQueue));
  assert(review.results.every(row => !('path' in row) && !('reachable' in row)));
  const commands: GroupMovementCommand[] = armyIds.map(armyId => ({ type: 'queueMovement', factionId, armyId, target: target!, append: false }));
  const started = performance.now();
  const result = await request({ type: 'groupMovement', commands: [...commands].reverse(), expectedHash: review.hash }, 'state');
  const elapsedMs = performance.now() - started;
  assert.equal(stateResponses - beforeResponses, 1);
  assert.equal(result.groupMovementError, undefined);
  assert.deepEqual(result.groupMovementResults?.map(({ armyId, accepted }) => ({ armyId, accepted })), armyIds.map(armyId => ({ armyId, accepted: true })));
  assert(result.groupMovementResults?.every(row => typeof row.message === 'string' && row.message.length > 0));
  assert.equal(result.mapReset, false); assert.equal(result.mapRevision, initial.mapRevision); assert.equal(result.map, undefined);
  const saved = await request({ type: 'export' }, 'export');
  const campaign = deserializeCampaign(await importSave(saved.bytes));
  assert.deepEqual(campaign.archive.records.map(record => record.command), commands);
  assert(campaign.archive.records.every(record => record.ok));
  assert.equal(stateHash(campaign.game), result.hash);
  assert.equal(stateHash(replayArchive(campaign.archive)), result.hash);
  const serialGame = deserializeGame(serializeGame(game)), serialJournal = createJournal(serialGame, { mode: 'player', coverage: 'from-save' });
  for (const command of commands) assert(serialJournal.record(serialGame, command).ok);
  assert.equal(stateHash(serialGame), result.hash);
  assert.deepEqual(serialJournal.materialize(), campaign.archive);
  const permitted = getObservation(campaign.game, factionId, { landDetails: 'none', developmentCandidates: false });
  const { cells: permittedCells, ...permittedSummary } = permitted;
  const deliveredCells = new Map(unpackCells(initial.cells).map(cell => [cell.cell, cell]));
  for (const cell of unpackCells(result.cells)) deliveredCells.set(cell.cell, cell);
  assert.deepEqual([...deliveredCells.values()].sort((a, b) => a.cell - b.cell), [...permittedCells].sort((a, b) => a.cell - b.cell));
  assert.deepEqual(result.observation, permittedSummary);
  const restored = await request({ type: 'loadAuto' }, 'state');
  assert.equal(restored.hash, result.hash);
  return {
    sample, size, synthetic: true, cells: game.world.terrain.length, realms: game.factions.length,
    totalArmies: Object.keys(game.armies).length, ownedArmies: armyIds.length, target,
    previewResponses: 1, mutationResponses: 1, queryElapsedMs, queryMs: review.metrics.groupMovementQueryMs,
    queryBytes: review.metrics.groupMovementQueryBytes, targetSearchExpandedNodes: review.results.reduce((sum, row) => sum + row.expandedNodes, 0),
    maximumPreviewSteps: Math.max(...review.results.map(row => row.steps)), elapsedMs, commandMs: result.metrics.commandMs,
    transferBytes: result.metrics.transferBytes, resultBytes: result.metrics.groupMovementResultBytes, cellTransferBytes: result.metrics.cellTransferBytes,
    hash: result.hash, exactRecordedOrder: true, exactSerialArchive: true, replayExact: true, autosaveExact: true, permittedFogMatches: true,
    setup: sample === 'mature' ? 'Existing mature fixture with its generated terrain and permitted explored geography.' : 'Mature fixture expanded to128 co-located owned guards; generated geography and fog retained.',
  };
}
try {
  await import('./simulation.worker');
  console.info(JSON.stringify({ benchmark: 'actual-worker-group-movement', sampleCountPerCase: 1, cpu: cpus()[0]?.model, node: process.version,
    scope: 'Headless actual worker, real structured-clone transfer, canonical journal and one autosave per batch. Single elapsed samples; no renderer, percentile, maximum-search or earned-campaign claim. Setup/import/export/replay excluded; batch wall time includes autosave and final publication.' }));
  for (const size of ['huge', 'legendary'] as const) {
    const base = matureCampaign(size);
    console.info(JSON.stringify(await measure(base, size, 'mature')));
    console.info(JSON.stringify(await measure(expandedFixture(base), size, 'ceiling')));
  }
} finally {
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('Benchmark closed.')); }
  pending.clear();
  await SaveStore.delete('theandril-campaigns');
  if (originalSelf) Object.defineProperty(globalThis, 'self', originalSelf); else Reflect.deleteProperty(globalThis, 'self');
}
