import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createGame, getMovementQuery, getObservation, getSettlementLandObservation, serializeGame, stateHash } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave, SaveStore } from '@theandril/persistence';
import { prosperityCampaign } from '../../../packages/test-fixtures/src/victory-fixture';
import { unpackCells } from './cell-transfer';
import type { Request, Response } from './protocol';

type WithoutId<T> = T extends { id: number } ? Omit<T, 'id'> : never;
type RequestBody = WithoutId<Request>;
type Pending = { resolve: (value: Response) => void; reject: (cause: Error) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<number, Pending>();
const completed: number[] = [];
const transfers = new Map<number, { bufferCount: number; before: number[]; detached: boolean[] }>();
let sequence = 0;

// Run the production worker's actual module/handler, without a browser or new
// production debug API. Structured cloning implements the real transfer contract;
// the self shim replaces only worker message transport, not simulation/storage.
const host: {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage: (message: Response, options?: StructuredSerializeOptions) => void;
} = {
  onmessage: null,
  postMessage(message, options) {
    const buffers = options?.transfer ?? [];
    const before = buffers.map(buffer => buffer instanceof ArrayBuffer ? buffer.byteLength : -1);
    const received = structuredClone(message, options);
    if (message.type === 'state') transfers.set(message.id, {
      bufferCount: buffers.length, before,
      detached: buffers.map(buffer => buffer instanceof ArrayBuffer && buffer.byteLength === 0),
    });
    if (received.type === 'progress') return;
    const waiter = pending.get(received.id);
    if (!waiter) throw new Error(`Unexpected worker reply ${received.id}: ${received.type}`);
    pending.delete(received.id); clearTimeout(waiter.timer); completed.push(received.id);
    waiter.resolve(received);
  },
};

function dispatch<K extends Response['type']>(body: RequestBody, expected: K): { id: number; response: Promise<Extract<Response, { type: K }>> } {
  const id = ++sequence;
  const response = new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Worker request ${id} (${body.type}) did not answer.`)); }, 5000);
    pending.set(id, { resolve, reject, timer });
    if (!host.onmessage) { pending.delete(id); clearTimeout(timer); reject(new Error('Worker has no message handler.')); return; }
    host.onmessage({ data: structuredClone({ ...body, id }) } as MessageEvent<Request>);
  }).then(value => {
    if (value.type !== expected) throw new Error(`Expected ${expected}, received ${value.type}: ${'message' in value ? value.message : ''}`);
    // The discriminant was checked above; TypeScript does not narrow a generic K.
    return value as Extract<Response, { type: K }>;
  });
  return { id, response };
}
const request = <K extends Response['type']>(body: RequestBody, expected: K) => dispatch(body, expected).response;
async function exported() {
  const response = await request({ type: 'export' }, 'export');
  const text = await importSave(response.bytes);
  return { text, ...deserializeCampaign(text) };
}

beforeAll(async () => {
  vi.stubGlobal('self', host);
  await import('./simulation.worker');
});
afterEach(() => {
  expect(pending.size).toBe(0);
  completed.length = 0; transfers.clear();
});
afterAll(async () => {
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('Worker harness closed.')); }
  pending.clear();
  await SaveStore.delete('theandril-campaigns');
  vi.unstubAllGlobals();
});

describe('actual worker scoped-query boundary', () => {
  it('rejects fog requests in player campaigns, including forged nonboolean input', async () => {
    await request({ type: 'new', seed: 17, size: 'tiny', factionCount: 2, pace: 'short', mode: 'player' }, 'state');
    const before = await exported();
    const rejected = await request({ type: 'watchFog', enabled: false }, 'error');
    expect(rejected.message).toContain('only in AI-watch');
    expect((await exported()).text).toBe(before.text);
    await request({ type: 'new', seed: 17, size: 'tiny', factionCount: 2, pace: 'short', mode: 'watch' }, 'state');
    expect((await request({ type: 'watchFog', enabled: 'false' as unknown as boolean }, 'error')).message).toContain('boolean');
  });

  it('replaces revealed map cells on restore without contaminating ordinary queries or recording a command', async () => {
    const initial = await request({ type: 'new', seed: 17, size: 'tiny', factionCount: 4, pace: 'short', mode: 'watch' }, 'state');
    const before = await exported(), ordinaryCells = unpackCells(initial.cells);
    const movement = await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery');
    const revealed = await request({ type: 'watchFog', enabled: false }, 'state');
    expect(revealed).toMatchObject({ reset: false, mapReset: true, fogEnabled: false, hash: initial.hash });
    expect(revealed.mapRevision).toBeGreaterThan(initial.mapRevision);
    expect(unpackCells(revealed.cells)).toHaveLength(1536);
    expect(revealed.map?.armies.length).toBeGreaterThan(initial.observation.armies.length);
    expect(revealed.observation).toEqual(initial.observation);
    expect((await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery')).query).toEqual(movement.query);
    const same = await request({ type: 'watchFog', enabled: false }, 'state');
    expect(same.mapReset).toBe(false); expect(unpackCells(same.cells)).toHaveLength(0);
    const restored = await request({ type: 'watchFog', enabled: true }, 'state');
    expect(restored.map).toBeUndefined(); expect(restored.mapReset).toBe(true);
    expect(unpackCells(restored.cells)).toEqual(ordinaryCells);
    expect((await exported()).text).toBe(before.text);
    await request({ type: 'watchFog', enabled: false }, 'state');
    await request({ type: 'save' }, 'message');
    const loaded = await request({ type: 'load' }, 'state');
    expect(loaded).toMatchObject({ fogEnabled: true, reset: true, mapReset: true, hash: initial.hash });
    expect(loaded.map).toBeUndefined(); expect(unpackCells(loaded.cells)).toEqual(ordinaryCells);
  });

  it('keeps actual AI orders and saved continuation identical when fog changes between queued rounds', async () => {
    const setup = { type: 'new', seed: 17, size: 'tiny', factionCount: 2, pace: 'short', mode: 'watch' } as const;
    await request(setup, 'state');
    await request({ type: 'watchRound' }, 'state');
    await request({ type: 'watchRound' }, 'state');
    const baseline = await exported();
    await request(setup, 'state');
    const first = dispatch({ type: 'watchRound' }, 'state');
    const reveal = dispatch({ type: 'watchFog', enabled: false }, 'state');
    const second = dispatch({ type: 'watchRound' }, 'state');
    const restore = dispatch({ type: 'watchFog', enabled: true }, 'state');
    const replies = await Promise.all([first.response, reveal.response, second.response, restore.response]);
    expect(replies[2]!.map).toBeDefined();
    expect(replies[2]!.hash).toBe(replies[3]!.hash);
    expect((await exported()).text).toBe(baseline.text);
  });

  it('publishes summary-only land with fresh transferred cells and preserves later cached movement queries', async () => {
    const setup = { seed: 17, size: 'tiny', factionCount: 2, pace: 'short' } as const;
    const generated = createGame(setup), owner = generated.turnOwnerId;
    const initial = await request({ type: 'new', ...setup, mode: 'player' }, 'state');
    expect('cells' in initial.observation).toBe(false);
    expect(unpackCells(initial.cells)).toStrictEqual(getObservation(generated, owner).cells);
    expect(initial.hash).toBe(stateHash(generated));
    expect(transfers.get(initial.id)).toMatchObject({ bufferCount: 3, detached: [true, true, true] });
    expect(transfers.get(initial.id)!.before[0]).toBeGreaterThan(0);
    const movement = await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery');
    expect(movement.query).toEqual(getMovementQuery(getObservation(generated, owner), 'army.2'));
    const founded = await request({ type: 'command', command: { type: 'found', factionId: owner, armyId: 'army.1', name: 'Worker query hearth' } }, 'state');
    expect(founded.observation.land.settlements).toHaveLength(1);
    expect(founded.observation.land.settlements[0]!.cells).toEqual([]);
    expect(transfers.get(founded.id)).toMatchObject({ bufferCount: 3, detached: [true, true, true] });
    const saved = await exported();
    expect(saved.archive.records).toHaveLength(1);
    expect(saved.archive.records[0]!.command).toMatchObject({ type: 'found' });
    const after = await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery');
    const cached = await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery');
    expect(after).toMatchObject({ hash: founded.hash, query: getMovementQuery(getObservation(saved.game, owner), 'army.2') });
    expect(cached.query).toEqual(after.query);
    expect(saved.game.world.terrain.length).toBe(1536);
    expect(stateHash(saved.game)).toBe(founded.hash);
    expect((await exported()).text).toBe(saved.text);
  });

  it('imports a real campaign and leaves its exact snapshot/archive unchanged across own, foreign and missing land queries', async () => {
    const game = prosperityCampaign(), owner = game.turnOwnerId;
    const imported = await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
    expect(imported.campaign.coverage).toBe('from-save');
    expect(imported.observation.land.settlements).toHaveLength(3);
    expect(imported.observation.land.settlements.every(town => town.cells.length === 0)).toBe(true);
    expect(unpackCells(imported.cells)).toStrictEqual(getObservation(game, owner).cells);
    const before = await exported(), own = imported.observation.land.settlements[0]!.settlementId;
    const foreign = Object.values(game.settlements).find(town => town.factionId !== owner)!.id;
    for (const settlementId of [own, foreign, 'settlement.missing', own, '__proto__', foreign]) {
      const response = await request({ type: 'landQuery', settlementId }, 'landQuery');
      expect(response).toMatchObject({ settlementId, hash: imported.hash, town: getSettlementLandObservation(game, owner, settlementId) });
    }
    const movement = await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery');
    expect(movement.hash).toBe(imported.hash);
    const after = await exported();
    expect(after.text).toBe(before.text);
    expect(after.archive).toEqual(before.archive);
    expect(after.archive.records).toHaveLength(0);
    expect(serializeGame(after.game)).toBe(serializeGame(before.game));
    expect(stateHash(after.game)).toBe(imported.hash);
  });

  it('serializes a same-turn paid command before queued land/export requests and returns fresh authoritative quotes', async () => {
    const game = prosperityCampaign(), owner = game.turnOwnerId;
    await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
    const town = getObservation(game, owner).land.settlements.find(town => town.cells.some(cell => cell.improvementOptions.some(option => option.canStart)))!;
    const cell = town.cells.find(cell => cell.improvementOptions.some(option => option.canStart))!;
    const quote = cell.improvementOptions.find(option => option.canStart)!;
    const before = await request({ type: 'landQuery', settlementId: town.settlementId }, 'landQuery');
    const command = { type: 'improveTile', factionId: owner, settlementId: town.settlementId, cell: cell.cell, improvementId: quote.improvementId } as const;
    // Enqueue without awaiting any reply: the production Promise chain, not this
    // harness, must preserve mutation -> selected detail -> export ordering.
    const paid = dispatch({ type: 'command', command }, 'state');
    const query = dispatch({ type: 'landQuery', settlementId: town.settlementId }, 'landQuery');
    const backup = dispatch({ type: 'export' }, 'export');
    const [state, detail, saved] = await Promise.all([paid.response, query.response, backup.response]);
    expect(completed.slice(-3)).toEqual([paid.id, query.id, backup.id]);
    expect(state.observation.turn).toBe(game.turn);
    expect(state.hash).not.toBe(before.hash); expect(detail.hash).toBe(state.hash);
    expect(state.observation.land.settlements.every(town => town.cells.length === 0)).toBe(true);
    expect(state.observation.treasury).toBe(game.factions.find(faction => faction.id === owner)!.treasury - quote.coinCost);
    expect(detail.town?.work).toMatchObject({ kind: 'improve', improvementId: quote.improvementId, cell: cell.cell, coinCost: quote.coinCost, startedTurn: game.turn });
    expect(detail.town!.cells.flatMap(cell => cell.improvementOptions).every(option => !option.canStart)).toBe(true);
    const loaded = deserializeCampaign(await importSave(saved.bytes));
    expect(detail.town).toEqual(getSettlementLandObservation(loaded.game, owner, town.settlementId));
    expect(stateHash(loaded.game)).toBe(state.hash);
    expect(loaded.archive.records).toHaveLength(1);
    expect(loaded.archive.records[0]!.command).toEqual(command);
    const movement = await request({ type: 'movementQuery', armyId: 'army.2' }, 'movementQuery');
    expect(movement.hash).toBe(state.hash);
    expect((await exported()).archive).toEqual(loaded.archive);
  });
});
