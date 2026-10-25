/** Explicit headless worker batch measurement; never discovered as a test. */
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hexDistance } from '@theandril/mapgen';
import { createArmyFormation, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { CampaignJournal, createJournal, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from '@theandril/persistence';
import { matureCampaign } from '../../../packages/test-fixtures/src/index';
import { MAX_GROUP_ORDER_COMMANDS, type GroupPatrolCommand, type Request, type Response } from './protocol';
import { unpackCells } from './cell-transfer';

type WithoutId<T> = T extends { id: number } ? Omit<T, 'id'> : never;
type Waiter = { resolve: (reply: Response) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<number, Waiter>();
let sequence = 0, stateResponses = 0;
let cloneMs = 0;
const host: { onmessage: ((event: MessageEvent<Request>) => void) | null; postMessage: (reply: Response, options?: StructuredSerializeOptions) => void } = {
  onmessage: null,
  postMessage(reply, options) {
    const cloneStarted = performance.now();
    const received = structuredClone(reply, options);
    cloneMs += performance.now() - cloneStarted;
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

const verifyOnly = process.argv.includes('--verify-only');
const sizeArgument = process.argv.find(argument => argument.startsWith('--size='))?.split('=')[1];
assert(sizeArgument === undefined || sizeArgument === 'huge' || sizeArgument === 'legendary');
const duration = (value: number) => verifyOnly ? null : value;
let recordMs = 0, recordCount = 0, autosaveMs = 0, autosaveCount = 0;
const originalRecord = CampaignJournal.prototype.record;
const originalSave = SaveStore.prototype.saveCampaign;
// Transparent measurement wrappers: actual canonical commands and persistence run.
CampaignJournal.prototype.record = function (...args: Parameters<typeof originalRecord>) {
  const started = performance.now();
  try { return originalRecord.apply(this, args); }
  finally { recordMs += performance.now() - started; recordCount++; }
};
SaveStore.prototype.saveCampaign = async function (...args: Parameters<typeof originalSave>) {
  const started = performance.now();
  try { return await originalSave.apply(this, args); }
  finally { autosaveMs += performance.now() - started; autosaveCount++; }
};

function fixture(size: 'huge' | 'legendary') {
  const setupStarted = performance.now();
  let game = matureCampaign(size);
  const own = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId);
  const source = own[0]!;
  while (own.length < MAX_GROUP_ORDER_COMMANDS) {
    const id = `army.${game.nextId++}`;
    const army = { id, factionId: game.turnOwnerId, cell: source.cell, name: `Authored patrol ${own.length + 1}`, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    game.armies[id] = army; own.push(army);
  }
  game = deserializeGame(serializeGame(game));
  const armyIds = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).map(army => army.id).sort();
  assert.equal(armyIds.length, 128);
  const view = getObservation(game, game.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
  const origin = game.armies[armyIds[0]!]!.cell;
  const target = [...view.cells].sort((a, b) => hexDistance(b.cell, origin, view.width) - hexDistance(a.cell, origin, view.width) || a.cell - b.cell)
    .find(cell => {
      if (cell.cell === origin) return false;
      const preview = getMovementPreview(view, armyIds[0]!, cell.cell);
      return preview.canQueue && preview.cost > game.armies[armyIds[0]!]!.movement;
    })?.cell;
  assert.notEqual(target, undefined);
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const setupJournalStarted = performance.now();
  for (const armyId of armyIds) assert(journal.record(game, { type: 'setPatrol', factionId: game.turnOwnerId, armyId, firstCell: origin, secondCell: target!, enabled: true, pauseOnWar: true }).ok);
  assert(journal.record(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: armyIds[0]!, target: target! }).ok);
  assert(Object.keys(game.routes).length > 0, 'Exercise preservation of an actual issued route.');
  return { game, journal, armyIds, setupMs: performance.now() - setupStarted, setupJournalMs: performance.now() - setupJournalStarted };
}

async function measure(size: 'huge' | 'legendary') {
  const prepared = fixture(size), { game, journal, armyIds } = prepared;
  const originBytes = await exportSave(serializeCampaign(game, journal.materialize()));
  const mirror = deserializeGame(serializeGame(game));
  const mirrorJournal = createJournal(mirror, { mode: 'player', coverage: 'from-save' });
  let current = await request({ type: 'import', bytes: originBytes }, 'state');
  const initialArmyState = structuredClone(game.armies), initialRoutes = structuredClone(game.routes);
  console.info(JSON.stringify({ kind: 'setup', size, synthetic: true, cells: game.world.terrain.length, realms: game.factions.length,
    totalArmies: Object.keys(game.armies).length, ownedArmies: armyIds.length, patrols: game.patrols.length,
    observedCells: unpackCells(current.cells).length, setupMs: duration(prepared.setupMs), setupJournalMs: duration(prepared.setupJournalMs),
    setupRecords: journal.recordCount, routes: Object.keys(initialRoutes).length,
    scope: 'Generated mature fixture plus co-located authored guards to128; permitted exploration unchanged. Policies and route are ordinary recorded commands. Setup times include generation/validation and are separate from batch latency.' }));
  for (const action of ['pause', 'resume', 'remove'] as const) {
    const commands: GroupPatrolCommand[] = armyIds.map(armyId => action === 'remove'
      ? { type: 'clearPatrol', factionId: game.turnOwnerId, armyId }
      : { type: 'setPatrolEnabled', factionId: game.turnOwnerId, armyId, enabled: action === 'resume' });
    const before = stateResponses;
    recordMs = 0; recordCount = 0; autosaveMs = 0; autosaveCount = 0; cloneMs = 0;
    const started = performance.now();
    const result = await request({ type: 'groupPatrol', commands: [...commands].reverse(), expectedHash: current.hash }, 'state');
    const elapsedMs = performance.now() - started;
    const measured = { recordMs, recordCount, autosaveMs, autosaveCount, cloneMs };
    assert.equal(stateResponses - before, 1); assert.equal(measured.recordCount, 128); assert.equal(measured.autosaveCount, 1);
    assert.equal(result.groupPatrolError, undefined);
    assert.deepEqual(result.groupPatrolResults?.map(({ armyId, accepted }) => ({ armyId, accepted })), armyIds.map(armyId => ({ armyId, accepted: true })));
    assert.equal(result.metrics.groupPatrolResultBytes, new TextEncoder().encode(JSON.stringify({ groupPatrolResults: result.groupPatrolResults })).byteLength);
    assert.equal(result.metrics.landQueryCount, current.metrics.landQueryCount);
    assert.equal(result.metrics.developmentQueryCount, current.metrics.developmentQueryCount);
    assert.equal(result.metrics.groupMovementQueryCount, current.metrics.groupMovementQueryCount);
    assert.equal(result.mapReset, false); assert.equal(result.mapRevision, current.mapRevision); assert.equal(result.map, undefined);
    assert.equal(unpackCells(result.cells).length, 0);
    const saved = await request({ type: 'export' }, 'export');
    const campaign = deserializeCampaign(await importSave(saved.bytes));
    assert.deepEqual(campaign.game.armies, initialArmyState); assert.deepEqual(campaign.game.routes, initialRoutes);
    assert.deepEqual(campaign.archive.records.slice(-128).map(record => record.command), commands);
    assert(campaign.archive.records.every(record => record.ok));
    assert.equal(stateHash(campaign.game), result.hash); assert.equal(stateHash(replayArchive(campaign.archive)), result.hash);
    for (const command of commands) assert(mirrorJournal.record(mirror, command).ok);
    assert.equal(serializeGame(mirror), serializeGame(campaign.game));
    const restored = await request({ type: 'loadAuto' }, 'state');
    assert.equal(restored.hash, result.hash);
    const restoredExport = await request({ type: 'export' }, 'export');
    assert.equal(await importSave(restoredExport.bytes), await importSave(saved.bytes));
    const coldGame = deserializeGame(serializeGame(campaign.game));
    const observationStarted = performance.now();
    const observed = getObservation(coldGame, coldGame.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
    const coldObservationMs = performance.now() - observationStarted;
    const { cells, ...summary } = observed; assert.deepEqual(summary, result.observation);
    console.info(JSON.stringify({ kind: 'batch', size, action, sampleCount: 1, commandCount: measured.recordCount, finalStateResponses: 1, autosaves: measured.autosaveCount, queryRequests: 0,
      elapsedMs: duration(elapsedMs), commandLoopMs: duration(result.metrics.commandMs), canonicalAndJournalMs: duration(measured.recordMs),
      autosaveMs: duration(measured.autosaveMs), cloneTransferMs: duration(measured.cloneMs),
      envelopeFinalPublicationAndHostSchedulingMs: duration(elapsedMs - result.metrics.commandMs - measured.autosaveMs),
      separateColdObservationMs: duration(coldObservationMs), observedCells: cells.length,
      resultBytes: result.metrics.groupPatrolResultBytes, transferBytes: result.metrics.transferBytes, cellTransferBytes: result.metrics.cellTransferBytes,
      hash: result.hash, exactSerialState: true, exactReplay: true, exactAutosave: true, unchangedArmiesAndRoutes: true,
      timingScope: 'Node same-thread host shim executes the worker module through final structuredClone copy/transfer. Command/journal includes canonical adjudication/reconciliation/hash. Residual includes envelope/hash, observation/publication, Node clone and host promise scheduling, not isolated observation or browser Worker/postMessage overhead. Cold observation is a separate check outside the timed batch. No browser latency/frame/turn/percentile claim.' }));
    current = restored;
  }
}

try {
  await import('./simulation.worker');
  const sources = ['apps/web/src/worker-patrol.benchmark.ts', 'apps/web/src/simulation.worker.ts', 'apps/web/src/protocol.ts'];
  console.info(JSON.stringify({ benchmark: 'headless-worker-module-group-patrols', verifyOnly, cpu: cpus()[0]?.model, node: process.version,
    sources: Object.fromEntries(sources.map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')])),
    scope: 'Six single batches, three actions at128 policies on each size. Node same-thread host shim runs the production worker module with structuredClone copy/transfer, real canonical journal and fake-indexeddb. No browser Worker scheduling/real postMessage overhead, physical-storage latency or organic-campaign evidence. Setup/import/export/replay excluded from batch timing.' }));
  for (const size of ['huge', 'legendary'] as const) if (!sizeArgument || size === sizeArgument) await measure(size);
} finally {
  CampaignJournal.prototype.record = originalRecord; SaveStore.prototype.saveCampaign = originalSave;
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('Benchmark closed.')); }
  pending.clear();
  await SaveStore.delete('theandril-campaigns');
  if (originalSelf) Object.defineProperty(globalThis, 'self', originalSelf); else Reflect.deleteProperty(globalThis, 'self');
}

