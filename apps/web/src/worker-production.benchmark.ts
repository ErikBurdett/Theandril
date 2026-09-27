/** Run explicitly with tsx. This measures real worker commands/transfer, not
 * renderer frames or an organically earned empire; setup and replay are untimed. */
import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { deserializeGame, getObservation, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore } from '@theandril/persistence';
import { empireLandCampaign } from '../../../packages/test-fixtures/src/empire-land-fixture';
import { rebaseAuthoredLand } from '../../../packages/test-fixtures/src/authored-land';
import { MAX_GROUP_PRODUCTION_SETTLEMENTS, MAX_PRODUCTION_SEQUENCE_ITEMS, type Request, type Response } from './protocol';

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
  const own = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId);
  const source = own[0]!;
  for (let cell = 0; own.length < MAX_GROUP_PRODUCTION_SETTLEMENTS && cell < game.world.terrain.length; cell++) {
    if (!isPassable(game.world.terrain[cell]!) || own.some(town => hexDistance(cell, town.cell, game.world.width) < 4)) continue;
    const id = `settlement.${game.nextId++}`;
    const town = { ...structuredClone(source), id, cell, name: `Authored ceiling hearth ${own.length + 1}`, queue: [] };
    game.settlements[id] = town; own.push(town);
  }
  assert.equal(own.length, MAX_GROUP_PRODUCTION_SETTLEMENTS);
  // Explicit synthetic ceiling case: rebasing resets purchased land to legal
  // starting borders, while the representative sample below retains its claims.
  rebaseAuthoredLand(game);
  return deserializeGame(serializeGame(game));
}
async function measure(game: GameState, size: 'huge' | 'legendary', sample: 'mature' | 'ceiling') {
  const factionId = game.turnOwnerId;
  const settlementIds = Object.values(game.settlements).filter(town => town.factionId === factionId).map(town => town.id).sort();
  const itemIds = sample === 'ceiling' ? Array<string>(MAX_PRODUCTION_SEQUENCE_ITEMS).fill('unit.guard') : ['unit.guard', 'building.workshop', 'unit.guard'];
  const initial = await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
  const beforeResponses = stateResponses, started = performance.now();
  const result = await request({ type: 'groupProduction', factionId, settlementIds: [...settlementIds].reverse(), itemIds }, 'state');
  const elapsedMs = performance.now() - started;
  assert.equal(stateResponses - beforeResponses, 1);
  assert.equal(result.groupProductionError, undefined);
  assert.deepEqual(result.groupProductionResults, settlementIds.map(settlementId => ({ settlementId, orders: itemIds.map(itemId => ({ itemId, accepted: true })) })));
  assert.equal(result.mapReset, false); assert.equal(result.mapRevision, initial.mapRevision);
  assert.equal(result.metrics.cellTransferBytes, 39);
  const saved = await request({ type: 'export' }, 'export');
  const campaign = deserializeCampaign(await importSave(saved.bytes));
  assert.equal(campaign.archive.records.length, settlementIds.length * itemIds.length);
  assert(campaign.archive.records.every(record => record.ok));
  assert.deepEqual(campaign.archive.records.map(record => record.command), settlementIds.flatMap(settlementId => itemIds.map(itemId => ({ type: 'queue', factionId, settlementId, itemId }))));
  assert.equal(stateHash(campaign.game), result.hash);
  assert.equal(stateHash(replayArchive(campaign.archive)), result.hash);
  assert.deepEqual(getObservation(campaign.game, factionId).cells, getObservation(game, factionId).cells);
  return {
    sample, size, synthetic: true, generatorVersion: 4, cells: game.world.terrain.length, realms: game.factions.length,
    totalArmies: Object.keys(game.armies).length, ownedArmies: Object.values(game.armies).filter(army => army.factionId === factionId).length,
    ownedHearths: settlementIds.length, itemsPerHearth: itemIds.length, canonicalQueueAttempts: campaign.archive.records.length,
    responses: stateResponses - beforeResponses, elapsedMs, commandMs: result.metrics.commandMs,
    transferBytes: result.metrics.transferBytes, resultBytes: result.metrics.groupProductionResultBytes, cellTransferBytes: result.metrics.cellTransferBytes,
    treasuryBefore: initial.observation.treasury, treasuryAfter: result.observation.treasury, hash: result.hash,
    exactRecordedOrder: true, replayExact: true, unchangedFog: true,
    setup: sample === 'mature' ? 'Existing mature empire fixture: paid37-cell borders retained; all hearths authored under one realm.' : 'Mature fixture expanded to128 owned hearths; land rebased to legal starting borders.',
  };
}
try {
  await import('./simulation.worker');
  console.info(JSON.stringify({ benchmark: 'actual-worker-production-sequences', sampleCountPerCase: 1, cpu: cpus()[0]?.model, node: process.version,
    scope: 'Headless actual worker with real structured-clone transfer and canonical journal. Single elapsed samples; no renderer/frame or earned-campaign claim. Setup/import/export/replay excluded from timed batch.' }));
  for (const size of ['huge', 'legendary'] as const) {
    const base = empireLandCampaign(size);
    console.info(JSON.stringify(await measure(base, size, 'mature')));
    console.info(JSON.stringify(await measure(expandedFixture(base), size, 'ceiling')));
  }
} finally {
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('Benchmark closed.')); }
  pending.clear();
  await SaveStore.delete('theandril-campaigns');
  if (originalSelf) Object.defineProperty(globalThis, 'self', originalSelf); else Reflect.deleteProperty(globalThis, 'self');
}
