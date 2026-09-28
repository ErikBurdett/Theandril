import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { supplyAccessCampaign } from '../../../packages/test-fixtures/src/supply-access-fixture';
import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { CampaignJournal, createJournal, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../../packages/test-fixtures/src/authored-land';
import { MAX_GROUP_ORDER_COMMANDS, type GroupMovementCommand, type Request, type Response } from './protocol';

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

/** Entirely authored open-land scenario, not an organically earned campaign. */
function movementFixture(count = 3): { game: GameState; commands: GroupMovementCommand[]; armyIds: string[] } {
  let game = createGame({ seed: 17, generatorVersion: 4, size: 'tiny', factionCount: 2, pace: 'short' });
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(60);
  game.resources.deposits = {};
  delete game.armies['army.1']; delete game.armies['army.3'];
  game.armies['army.4']!.cell = 1400;
  const armyIds = ['army.2'];
  Object.assign(game.armies['army.2']!, { cell: 500, movement: 3, formations: [createArmyFormation('army.2', 'unit.guard')] });
  for (let index = 1; index < count; index++) {
    const id = `army.${game.nextId++}`;
    game.armies[id] = { id, factionId: game.turnOwnerId, cell: 500, movement: 3, name: `Authored march ${index + 1}`, formations: [createArmyFormation(id, 'unit.guard')] };
    armyIds.push(id);
  }
  game.explored[game.turnOwnerId] = new Set(game.world.terrain.keys());
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  armyIds.sort();
  return { game, armyIds, commands: armyIds.map(armyId => ({ type: 'queueMovement', factionId: game.turnOwnerId, armyId, target: 510, append: false })) };
}
const importFixture = (game: GameState) => exportSave(serializeGame(game)).then(bytes => request({ type: 'import', bytes }, 'state'));

describe('actual worker coordinated travel', () => {
  it('reviews a bounded group from permitted observations without paths, overlays, mutations or archive records', async () => {
    const { game, armyIds } = movementFixture();
    const initial = await importFixture(game), before = await exported();
    const ids = [...armyIds, 'army.4', 'army.missing'].reverse();
    const review = await request({ type: 'groupMovementPreview', factionId: game.turnOwnerId, armyIds: ids, target: 510, append: false }, 'groupMovementPreview');
    expect(review.hash).toBe(initial.hash);
    expect(review.results.map(row => row.armyId)).toEqual([...ids].sort());
    const view = getObservation(game, game.turnOwnerId);
    for (const row of review.results) {
      const expected = getMovementPreview(view, row.armyId, 510);
      expect(row).toEqual({ armyId: row.armyId, target: 510, cost: expected.cost, steps: expected.path.length, canQueue: expected.canQueue, blocker: expected.blocker, limited: expected.limited, expandedNodes: expected.expandedNodes });
      expect(row).not.toHaveProperty('path'); expect(row).not.toHaveProperty('reachable');
    }
    expect(review.results.filter(row => !row.canQueue)).toEqual(expect.arrayContaining([
      expect.objectContaining({ armyId: 'army.4', blocker: 'You do not control that army.' }),
      expect.objectContaining({ armyId: 'army.missing', blocker: 'You do not control that army.' }),
    ]));
    const { id: _id, type: _type, metrics: _metrics, ...payload } = review;
    void _id; void _type; void _metrics;
    expect(review.metrics.groupMovementQueryBytes).toBe(new TextEncoder().encode(JSON.stringify(payload)).byteLength);
    expect(review.metrics.groupMovementQueryCount).toBe((initial.metrics.groupMovementQueryCount ?? 0) + 1);
    expect(review.metrics.totalTransferBytes - initial.metrics.totalTransferBytes).toBe(review.metrics.groupMovementQueryBytes);
    expect((await exported()).text).toBe(before.text);
  });

  it('keeps unseen occupants private and refuses unexplored or visible hostile destinations without automatic attacks', async () => {
    const { game, armyIds, commands } = movementFixture(1);
    const plan = { type: 'groupMovementPreview', factionId: game.turnOwnerId, armyIds, target: 510, append: false } as const;
    await importFixture(game);
    const empty = await request(plan, 'groupMovementPreview');
    game.armies['army.4']!.cell = 509; refreshAuthoredSight(game);
    await importFixture(game);
    const hidden = await request(plan, 'groupMovementPreview');
    expect(hidden.results).toEqual(empty.results);
    game.explored[game.turnOwnerId]!.delete(1000);
    game.armies['army.4']!.cell = 501; refreshAuthoredSight(game);
    expect(applyCommand(game, { type: 'declareWar', factionId: game.turnOwnerId, targetFactionId: game.factions[1]!.id }).ok).toBe(true);
    const initial = await importFixture(game);
    const unknown = await request({ ...plan, target: 1000 }, 'groupMovementPreview');
    expect(unknown.results[0]).toMatchObject({ canQueue: false, blocker: 'Choose a known destination within the explored world.' });
    const hostile = await request({ ...plan, target: 501 }, 'groupMovementPreview');
    expect(hostile.results[0]).toMatchObject({ canQueue: false, blocker: 'Queued travel cannot include an automatic attack.' });
    const result = await request({ type: 'groupMovement', expectedHash: initial.hash, commands: [{ ...commands[0]!, type: 'queueMovement', target: 501 }] }, 'state');
    expect(result.groupMovementResults?.[0]?.accepted).toBe(false);
    expect(result.hash).toBe(initial.hash); expect(result.observation.battle).toBeNull();
    expect((await exported()).archive.records).toHaveLength(1);
  });

  it('rejects malformed preview and mutation envelopes atomically, including stale hashes and mixed actions', async () => {
    const { game, armyIds, commands } = movementFixture(2);
    const initial = await importFixture(game), before = await exported();
    const preview = { type: 'groupMovementPreview', factionId: game.turnOwnerId, armyIds, target: 510, append: false };
    const movement = { type: 'groupMovement', commands, expectedHash: initial.hash };
    const sparse = Array<unknown>(2); sparse[1] = commands[0];
    const bad: unknown[] = [
      { ...preview, armyIds: [] }, { ...preview, armyIds: [armyIds[0], armyIds[0]] }, { ...preview, armyIds: Array(129).fill('army.2') },
      { ...preview, armyIds: [null] }, { ...preview, armyIds: Array(2) }, { ...preview, append: 'false' }, { ...preview, target: 1.5 },
      { ...preview, target: 350000 }, { ...preview, factionId: game.factions[1]!.id }, { ...preview, secret: true },
      { ...movement, commands: [] }, { ...movement, commands: sparse }, { ...movement, commands: [commands[0], commands[0]] },
      { ...movement, commands: Array(129).fill(commands[0]) }, { ...movement, expectedHash: 'stale' }, { ...movement, expectedHash: '00000000' },
      { ...movement, commands: [commands[0], { ...commands[1], factionId: game.factions[1]!.id }] },
      { ...movement, commands: [commands[0], { ...commands[1], type: 'cancelMovement', target: undefined }] },
      { ...movement, commands: [commands[0], { type: 'resumeMovement', factionId: game.turnOwnerId, armyId: armyIds[1] }] },
      { ...movement, commands: [commands[0], { ...commands[1], target: 511 }] }, { ...movement, commands: [commands[0], { ...commands[1], append: true }] },
      { ...movement, commands: [commands[0], { ...commands[1], hidden: true }] }, { ...movement, extra: true },
    ];
    for (const malformed of bad) {
      const response = await request(malformed as RequestBody, 'error');
      expect(response.recoveryRequired).toBeUndefined();
      expect((await exported()).text).toBe(before.text);
    }
    const command = { type: 'setPosting', factionId: game.turnOwnerId, armyId: armyIds[0]!, cell: 500, mode: 'hold' } as const;
    await request({ type: 'command', command }, 'state');
    const changed = await exported();
    expect((await request(movement as RequestBody, 'error')).message).toContain('campaign changed');
    expect((await exported()).text).toBe(changed.text);
  });

  it('executes all128 commands in stable order with one state response and one autosave, then exactly replays', async () => {
    const { game, commands, armyIds } = movementFixture(MAX_GROUP_ORDER_COMMANDS);
    const initial = await importFixture(game);
    const autosaved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      const review = await request({ type: 'groupMovementPreview', factionId: game.turnOwnerId, armyIds: [...armyIds].reverse(), target: 510, append: false }, 'groupMovementPreview');
      expect(review.results).toHaveLength(128); expect(review.results.every(row => row.canQueue)).toBe(true);
      const batch = dispatch({ type: 'groupMovement', commands: [...commands].reverse(), expectedHash: review.hash }, 'state');
      const result = await batch.response;
      expect(completed.filter(id => id === batch.id)).toHaveLength(1);
      expect(result.groupMovementResults).toEqual(armyIds.map(armyId => ({ armyId, accepted: true, message: `${game.armies[armyId]!.name} explored hex 503.` })));
      expect(result.groupMovementError).toBeUndefined(); expect(result.message).toContain('Autosaved.');
      expect(autosaved).toHaveBeenCalledTimes(1); expect(autosaved.mock.calls[0]?.[2]).toBe('auto');
      expect(result.map).toBeUndefined(); expect(result.mapRevision).toBe(initial.mapRevision);
      expect(result.observation.routes).toHaveLength(128);
      expect(result.observation.armies.filter(army => armyIds.includes(army.id)).every(army => army.cell === 503 && army.movement === 0)).toBe(true);
      expect(result.metrics.groupMovementResultBytes).toBe(new TextEncoder().encode(JSON.stringify({ groupMovementResults: result.groupMovementResults })).byteLength);
      //128 factual outcomes remain a small payload beside the army observation.
      expect(result.metrics.groupMovementResultBytes).toBeLessThan(24_000);
      const saved = await exported();
      expect(saved.archive.records.map(record => record.command)).toEqual(commands);
      expect(stateHash(replayArchive(saved.archive))).toBe(result.hash);
      expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(result.hash);
      await request({ type: 'save' }, 'message');
      expect((await request({ type: 'load' }, 'state')).hash).toBe(result.hash);
    } finally { autosaved.mockRestore(); }
  });

  it('keeps mixed canonical refusals and matches serial archives, immediate saves and later continuation', async () => {
    const { game, commands } = movementFixture(3);
    commands.push({ ...commands[0]!, armyId: 'army.4' }, { ...commands[0]!, armyId: 'army.missing' });
    commands.sort((a, b) => a.armyId < b.armyId ? -1 : 1);
    const bytes = await exportSave(serializeGame(game));
    const initial = await request({ type: 'import', bytes }, 'state');
    const grouped = await request({ type: 'groupMovement', commands: [...commands].reverse(), expectedHash: initial.hash }, 'state');
    expect(grouped.groupMovementResults?.filter(result => result.accepted)).toHaveLength(3);
    expect(grouped.groupMovementResults?.filter(result => !result.accepted)).toEqual([
      { armyId: 'army.4', accepted: false, message: 'You do not control that army.' },
      { armyId: 'army.missing', accepted: false, message: 'You do not control that army.' },
    ]);
    const groupedSave = await exported();
    await request({ type: 'import', bytes }, 'state');
    for (const command of commands) await request({ type: 'command', command }, command.armyId === 'army.4' || command.armyId === 'army.missing' ? 'error' : 'state');
    const serial = await exported();
    expect(serial.archive).toEqual(groupedSave.archive); expect(serial.text).toBe(groupedSave.text);
    const serialTurn = await request({ type: 'command', command: { type: 'endTurn', factionId: game.turnOwnerId } }, 'state');
    const serialContinued = await exported();
    await request({ type: 'import', bytes: await exportSave(groupedSave.text) }, 'state');
    const savedTurn = await request({ type: 'command', command: { type: 'endTurn', factionId: game.turnOwnerId } }, 'state');
    expect(savedTurn.hash).toBe(serialTurn.hash);
    expect((await exported()).archive).toEqual(serialContinued.archive);
    expect(stateHash(replayArchive(serialContinued.archive))).toBe(savedTurn.hash);
  });

  it('returns factual accepted arrival, interrupted-route and cancellation outcomes', async () => {
    const { game, commands } = movementFixture(1), command = commands[0]!;
    const initial = await importFixture(game);
    const arrived = await request({ type: 'groupMovement', expectedHash: initial.hash, commands: [{ ...command, type: 'queueMovement', target: 501 }] }, 'state');
    expect(arrived.groupMovementResults?.[0]).toMatchObject({ accepted: true, message: `${game.armies[command.armyId]!.name} reached its final travel destination.` });
    expect(arrived.observation.routes).toEqual([]);
    game.armies['army.4']!.cell = 501; refreshAuthoredSight(game);
    expect(applyCommand(game, { type: 'declareWar', factionId: game.turnOwnerId, targetFactionId: game.factions[1]!.id }).ok).toBe(true);
    game.armies['army.4']!.cell = 503; refreshAuthoredSight(game);
    const threatened = await importFixture(game);
    const paused = await request({ type: 'groupMovement', expectedHash: threatened.hash, commands }, 'state');
    expect(paused.groupMovementResults?.[0]).toMatchObject({ accepted: true, message: expect.stringContaining('paused its travel: New hostile') });
    expect(paused.observation.routes[0]).toMatchObject({ status: 'paused', pauseReason: 'New hostile forces or a hostile settlement were sighted nearby.' });
    expect(paused.observation.battle).toBeNull();
    const cancelled = await request({ type: 'groupMovement', expectedHash: paused.hash, commands: [{ type: 'cancelMovement', factionId: game.turnOwnerId, armyId: command.armyId }] }, 'state');
    expect(cancelled.groupMovementResults?.[0]).toMatchObject({ accepted: true, message: `${game.armies[command.armyId]!.name} cancelled its travel order.` });
  });

  it('appends, explicitly resumes paused travel, and cancels routes without clearing standing postings', async () => {
    const { game, commands, armyIds } = movementFixture(2), factionId = game.turnOwnerId;
    for (const armyId of armyIds) {
      expect(applyCommand(game, { type: 'setPosting', factionId, armyId, cell: 500, mode: 'hold' }).ok).toBe(true);
      expect(applyCommand(game, { type: 'queueMovement', factionId, armyId, target: 510 }).ok).toBe(true);
      game.routes[armyId]!.status = 'paused'; game.routes[armyId]!.pauseReason = 'Authored blocked route for explicit resume.';
    }
    const initial = await importFixture(game);
    const appended = await request({ type: 'groupMovement', expectedHash: initial.hash, commands: commands.map(command => ({ ...command, type: 'queueMovement', target: 512, append: true })) }, 'state');
    expect(appended.observation.routes.every(route => route.status === 'paused' && route.waypoints.join(',') === '510,512')).toBe(true);
    const resumed = await request({ type: 'groupMovement', expectedHash: appended.hash, commands: armyIds.map(armyId => ({ type: 'resumeMovement', factionId, armyId })) }, 'state');
    expect(resumed.groupMovementResults?.every(row => row.accepted)).toBe(true);
    expect(resumed.observation.routes.every(route => route.status === 'active')).toBe(true);
    const cancelled = await request({ type: 'groupMovement', expectedHash: resumed.hash, commands: armyIds.map(armyId => ({ type: 'cancelMovement', factionId, armyId })) }, 'state');
    expect(cancelled.observation.routes).toEqual([]); expect(cancelled.observation.postings).toHaveLength(2);
    const after = await request({ type: 'command', command: { type: 'endTurn', factionId } }, 'state');
    expect(after.observation.armies.filter(army => armyIds.includes(army.id)).every(army => army.cell === 500)).toBe(true);
    expect(after.observation.postings).toHaveLength(2);
    expect(stateHash(replayArchive((await exported()).archive))).toBe(after.hash);
  });

  it('refuses group mutation in watch mode before recording any order', async () => {
    const { game, commands } = movementFixture(1);
    const watch = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    const initial = await request({ type: 'import', bytes: await exportSave(serializeCampaign(game, watch.materialize())) }, 'state');
    const before = await exported();
    expect((await request({ type: 'groupMovement', expectedHash: initial.hash, commands }, 'error')).message).toContain('AI watch controls');
    expect((await exported()).text).toBe(before.text);
  });

  it('stops on a recorder exception after mutation, reports only certain results and preserves the prior save', async () => {
    const { game, commands } = movementFixture(3);
    const initial = await importFixture(game);
    await request({ type: 'save' }, 'message');
    const record = CampaignJournal.prototype.record, autosaved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    const interrupted = vi.spyOn(CampaignJournal.prototype, 'record').mockImplementation(function (this: CampaignJournal, ...args: Parameters<typeof record>) {
      const result = record.apply(this, args);
      if (args[1].type === 'queueMovement' && args[1].armyId === commands[1]!.armyId) throw new Error('Authored recorder failure after movement.');
      return result;
    });
    try {
      const partial = await request({ type: 'groupMovement', expectedHash: initial.hash, commands }, 'state');
      expect(partial.groupMovementResults).toEqual([{ armyId: commands[0]!.armyId, accepted: true, message: `${game.armies[commands[0]!.armyId]!.name} explored hex 503.` }]);
      expect(partial.groupMovementError).toContain('after 1 completed travel order');
      expect(partial.observation.routes).toHaveLength(2); expect(interrupted).toHaveBeenCalledTimes(2);
      expect(autosaved).not.toHaveBeenCalled();
      const locked = await request({ type: 'groupMovement', expectedHash: partial.hash, commands }, 'error');
      expect(locked.recoveryRequired).toBe(true);
      expect((await request({ type: 'save' }, 'error')).recoveryRequired).toBe(true);
    } finally { interrupted.mockRestore(); autosaved.mockRestore(); }
    expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    const retry = await request({ type: 'groupMovement', expectedHash: initial.hash, commands }, 'state');
    expect(retry.groupMovementResults?.every(row => row.accepted)).toBe(true);
  });

  it('requires restore after a publication exception and reports autosave failures without claiming rollback', async () => {
    const { game, commands } = movementFixture(2);
    const initial = await importFixture(game);
    await request({ type: 'save' }, 'message');
    const send = host.postMessage;
    const broken = vi.spyOn(host, 'postMessage').mockImplementation((response, options) => {
      if (response.type === 'state' && response.groupMovementResults) throw new Error('Authored result publication failure.');
      send(response, options);
    });
    try {
      const result = await request({ type: 'groupMovement', expectedHash: initial.hash, commands }, 'error');
      expect(result.recoveryRequired).toBe(true); expect(result.message).toContain('Some orders may have applied');
      expect((await request({ type: 'export' }, 'error')).recoveryRequired).toBe(true);
    } finally { broken.mockRestore(); }
    expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    const failingSave = vi.spyOn(SaveStore.prototype, 'saveCampaign').mockRejectedValue(new Error('Authored unavailable storage.'));
    try {
      const result = await request({ type: 'groupMovement', expectedHash: initial.hash, commands }, 'state');
      expect(result.groupMovementError).toBeUndefined(); expect(result.groupMovementResults?.every(row => row.accepted)).toBe(true);
      expect(result.message).toContain('Autosave failed: Authored unavailable storage.');
      expect(stateHash((await exported()).game)).toBe(result.hash);
      expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    } finally { failingSave.mockRestore(); }
  });
});


describe('actual worker defensive theater edits', () => {
  it('journals, autosaves, transfers and replays an accepted theater and refuses invalid edits unchanged', async () => {
    const game = theaterCampaign(100); await importFixture(game);
    const command = { type: 'setTheater' as const, factionId: game.turnOwnerId, name: 'Hundred company watch', settlementIds: Object.keys(game.settlements), armyIds: Object.keys(game.armies), reserveCell: 495, guardsPerSettlement: 1, enabled: true };
    const saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      const response = await request({ type: 'command', command }, 'state');
      expect(response.observation.theaters?.[0]?.armyIds).toHaveLength(100);
      expect(saved).toHaveBeenCalledTimes(1); expect(saved.mock.calls[0]?.[2]).toBe('auto');
      const exact = await exported(); expect(stateHash(exact.game)).toBe(response.hash);
      expect(exact.archive).toBeDefined(); expect(stateHash(replayArchive(exact.archive!))).toBe(response.hash);
      const rejected = await request({ type: 'command', command: { ...command, theaterId: 'theater.1', armyIds: ['army.missing'] } }, 'error');
      expect(rejected.recoveryRequired).not.toBe(true); expect(saved).toHaveBeenCalledTimes(1);
      expect(stateHash((await exported()).game)).toBe(response.hash);
      expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(response.hash);
    } finally { saved.mockRestore(); }
  });

  it('locks after accepted theater publication fails and restores the autosaved accepted state', async () => {
    const game = theaterCampaign(); await importFixture(game);
    const command = { type: 'setTheater' as const, factionId: game.turnOwnerId, name: 'Publication watch', settlementIds: Object.keys(game.settlements), armyIds: Object.keys(game.armies), reserveCell: 495, guardsPerSettlement: 1, enabled: true };
    const send = host.postMessage;
    const broken = vi.spyOn(host, 'postMessage').mockImplementation((response, options) => {
      if (response.type === 'state' && response.observation.theaters?.length) throw new Error('Authored theater publication failure.');
      send(response, options);
    });
    try {
      const response = await request({ type: 'command', command }, 'error');
      expect(response.recoveryRequired).toBe(true); expect(response.message).toContain('theater changed');
      expect((await request({ type: 'save' }, 'error')).recoveryRequired).toBe(true);
    } finally { broken.mockRestore(); }
    expect((await request({ type: 'loadAuto' }, 'state')).observation.theaters?.[0]?.name).toBe(command.name);
  });
});

/** A provider seat is selected in this authored origin before its journal is
 * created. The buyer's ordinary proposal is recorded; no payment is injected. */
function supplyProviderFixture() {
  const fixture = supplyAccessCampaign(), game = fixture.state;
  game.turnOwnerId = fixture.providerId;
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  expect(journal.record(game, fixture.proposal).ok).toBe(true);
  const offerId = game.supplyAccess.offers[0]!.id;
  const accept = { type: 'respondSupplyAccess' as const, factionId: fixture.providerId, offerId, accept: true };
  return { ...fixture, game, journal, accept };
}

describe('actual worker paid supply acceptance', () => {
  it.each(['player', 'watch'] as const)('locks a %s round after the real AI accepts and pays a supply offer but publication fails', async mode => {
    const { state: game, buyerId, providerId, proposal } = supplyAccessCampaign();
    const journal = createJournal(game, { mode, coverage: 'from-save' });
    expect(journal.record(game, proposal).ok).toBe(true);
    const accept = { type: 'respondSupplyAccess', factionId: providerId, offerId: game.supplyAccess.offers[0]!.id, accept: true };
    const origin = await exportSave(serializeCampaign(game, journal.materialize()));
    const round: RequestBody = mode === 'watch' ? { type: 'watchRound' } : { type: 'command', command: { type: 'endTurn', factionId: buyerId } };

    // Establish the real worker's uninterrupted result from this exact origin.
    // Its actual AI planner must accept; the harness supplies no AI commands.
    await request({ type: 'import', bytes: origin }, 'state');
    const completedRound = await request(round, 'state'), expected = await exported();
    expect(expected.game.turn).toBe(game.turn + 1);
    const acceptanceIndex = expected.archive.records.findIndex(record => record.ok && JSON.stringify(record.command) === JSON.stringify(accept));
    expect(acceptanceIndex).toBeGreaterThanOrEqual(1);
    expect(expected.archive.records.filter(record => record.ok && JSON.stringify(record.command) === JSON.stringify(accept))).toHaveLength(1);
    const beforePayment = replayArchive({ ...expected.archive, records: expected.archive.records.slice(0, acceptanceIndex), finalHash: null, finalHashVersion: null });
    const afterPayment = replayArchive({ ...expected.archive, records: expected.archive.records.slice(0, acceptanceIndex + 1), finalHash: null, finalHashVersion: null });
    expect(afterPayment.factions.find(faction => faction.id === buyerId)!.treasury).toBe(beforePayment.factions.find(faction => faction.id === buyerId)!.treasury - proposal.feeCoin);
    expect(afterPayment.factions.find(faction => faction.id === providerId)!.treasury).toBe(beforePayment.factions.find(faction => faction.id === providerId)!.treasury + proposal.feeCoin);
    expect(expected.game.supplyAccess).toMatchObject({ offers: [], agreements: [expect.objectContaining({ buyerId, providerId, feeCoin: proposal.feeCoin })], nextId: 3 });
    expect(stateHash(replayArchive(expected.archive))).toBe(completedRound.hash);

    await request({ type: 'import', bytes: origin }, 'state');
    const send = host.postMessage, saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    let attempted: Extract<Response, { type: 'state' }> | undefined;
    const broken = vi.spyOn(host, 'postMessage').mockImplementation((response, options) => {
      if (response.type === 'state' && response.observation.supplyAccess?.agreements.length) {
        attempted = structuredClone(response);
        throw new Error(`Authored ${mode} AI supply publication failure.`);
      }
      send(response, options);
    });
    try {
      const failed = await request(round, 'error');
      expect(attempted?.hash).toBe(completedRound.hash);
      expect(saved).toHaveBeenCalledTimes(1); expect(saved.mock.calls[0]?.[2]).toBe('auto');
      expect(failed.message).toContain(`Authored ${mode} AI supply publication failure.`);
      expect(failed.recoveryRequired).toBe(true);
      for (const body of [round, { type: 'save' }, { type: 'export' }] as const) {
        expect((await request(body, 'error')).recoveryRequired).toBe(true);
      }
      expect(saved).toHaveBeenCalledTimes(1);
    } finally { broken.mockRestore(); saved.mockRestore(); }

    const restored = await request({ type: 'loadAuto' }, 'state');
    expect(restored.hash).toBe(completedRound.hash); expect(restored.campaign.mode).toBe(mode);
    const exact = await exported();
    expect(exact.text).toBe(expected.text);
    expect(stateHash(replayArchive(exact.archive))).toBe(restored.hash);
    // A subsequent ordinary round may spend or earn coin, but cannot record a
    // second acceptance or payment for the already-consumed offer.
    await request(round, 'state');
    const continued = await exported();
    expect(continued.archive.records.filter(record => record.ok && JSON.stringify(record.command) === JSON.stringify(accept))).toHaveLength(1);
    expect(continued.game.supplyAccess.nextId).toBe(3);
    expect(continued.game.supplyAccess.agreements).toHaveLength(1);
    expect(stateHash(replayArchive(continued.archive))).toBe(stateHash(continued.game));
  });

  it('pays once, autosaves the exact accepted state and replays it after restore while refusing malformed or repeated acceptance unchanged', async () => {
    const fixture = supplyProviderFixture(), { game, journal, accept, buyerId, providerId, proposal } = fixture;
    const initial = await request({ type: 'import', bytes: await exportSave(serializeCampaign(game, journal.materialize())) }, 'state');
    const expected = deserializeGame(serializeGame(game));
    expect(applyCommand(expected, accept).ok).toBe(true);
    const buyerBefore = game.factions.find(faction => faction.id === buyerId)!.treasury;
    const providerBefore = game.factions.find(faction => faction.id === providerId)!.treasury;
    const saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      const response = await request({ type: 'command', command: accept }, 'state');
      expect(response.hash).toBe(stateHash(expected)); expect(response.hash).not.toBe(initial.hash);
      expect(response.observation.supplyAccess).toMatchObject({ offers: [], agreements: [expect.objectContaining({ buyerId, providerId, feeCoin: proposal.feeCoin })] });
      expect(saved).toHaveBeenCalledTimes(1); expect(saved.mock.calls[0]?.[2]).toBe('auto');
      expect(response.message).toContain('Autosaved.');
      const exact = await exported();
      expect(serializeGame(exact.game)).toBe(serializeGame(expected));
      expect(exact.game.factions.find(faction => faction.id === buyerId)!.treasury).toBe(buyerBefore - proposal.feeCoin);
      expect(exact.game.factions.find(faction => faction.id === providerId)!.treasury).toBe(providerBefore + proposal.feeCoin);
      expect(exact.archive.records.map(record => record.command)).toEqual([proposal, accept]);
      expect(stateHash(replayArchive(exact.archive))).toBe(response.hash);
      expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(response.hash);
      expect((await exported()).archive).toEqual(exact.archive);
      const malformed = { ...accept, accept: 'yes' };
      for (const command of [malformed, { ...accept, factionId: buyerId }, { ...accept, offerId: 'supply-offer.999999' }, accept]) {
        const refusal = await request({ type: 'command', command } as RequestBody, 'error');
        expect(refusal.recoveryRequired).not.toBe(true);
        expect(serializeGame((await exported()).game)).toBe(serializeGame(expected));
      }
      expect(saved).toHaveBeenCalledTimes(1);
      const afterRefusals = await exported();
      expect(stateHash(replayArchive(afterRefusals.archive))).toBe(response.hash);
      expect(afterRefusals.game.supplyAccess.agreements).toHaveLength(1);
    } finally { saved.mockRestore(); }
  });

  it('locks after an accepted payment cannot be published and restores the accepted autosave without paying a second time', async () => {
    const { game, journal, accept, buyerId, proposal } = supplyProviderFixture();
    await request({ type: 'import', bytes: await exportSave(serializeCampaign(game, journal.materialize())) }, 'state');
    await request({ type: 'save' }, 'message');
    const expected = deserializeGame(serializeGame(game)); expect(applyCommand(expected, accept).ok).toBe(true);
    const buyerAfter = expected.factions.find(faction => faction.id === buyerId)!.treasury;
    const send = host.postMessage, saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    let acceptedPublication: Extract<Response, { type: 'state' }> | undefined;
    const broken = vi.spyOn(host, 'postMessage').mockImplementation((response, options) => {
      if (response.type === 'state' && response.observation.supplyAccess?.agreements.length) {
        acceptedPublication = structuredClone(response);
        throw new Error('Authored supply payment publication failure.');
      }
      send(response, options);
    });
    try {
      const failed = await request({ type: 'command', command: accept }, 'error');
      expect(failed.recoveryRequired).toBe(true); expect(failed.message).toContain('supply agreement changed');
      expect(acceptedPublication?.hash).toBe(stateHash(expected));
      expect(saved).toHaveBeenCalledTimes(1);
      for (const body of [{ type: 'command', command: accept }, { type: 'save' }, { type: 'export' }] as const) {
        expect((await request(body, 'error')).recoveryRequired).toBe(true);
      }
      expect(saved).toHaveBeenCalledTimes(1);
    } finally { broken.mockRestore(); saved.mockRestore(); }
    const restored = await request({ type: 'loadAuto' }, 'state'); expect(restored.hash).toBe(stateHash(expected));
    const exact = await exported();
    expect(exact.game.factions.find(faction => faction.id === buyerId)!.treasury).toBe(buyerAfter);
    expect(exact.archive.records.map(record => record.command)).toEqual([proposal, accept]);
    expect(stateHash(replayArchive(exact.archive))).toBe(restored.hash);
    const repeated = await request({ type: 'command', command: accept }, 'error');
    expect(repeated.recoveryRequired).not.toBe(true);
    const afterRepeat = await exported();
    expect(afterRepeat.game.factions.find(faction => faction.id === buyerId)!.treasury).toBe(buyerAfter);
    expect(afterRepeat.game.supplyAccess.agreements).toHaveLength(1);
    expect(stateHash(replayArchive(afterRepeat.archive))).toBe(restored.hash);
  });

  it('reports failed autosave honestly while retaining the paid in-memory state and the prior manual offer', async () => {
    const { game, journal, accept } = supplyProviderFixture();
    const initial = await request({ type: 'import', bytes: await exportSave(serializeCampaign(game, journal.materialize())) }, 'state');
    await request({ type: 'save' }, 'message');
    const expected = deserializeGame(serializeGame(game)); expect(applyCommand(expected, accept).ok).toBe(true);
    const broken = vi.spyOn(SaveStore.prototype, 'saveCampaign').mockRejectedValue(new Error('Authored unavailable supply storage.'));
    try {
      const accepted = await request({ type: 'command', command: accept }, 'state');
      expect(accepted.hash).toBe(stateHash(expected)); expect(accepted.message).toContain('Autosave failed: Authored unavailable supply storage.');
      expect(serializeGame((await exported()).game)).toBe(serializeGame(expected));
      expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    } finally { broken.mockRestore(); }
  });
});
