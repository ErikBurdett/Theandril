import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { CampaignJournal, createJournal, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from '@theandril/persistence';
import { MAX_GROUP_ORDER_COMMANDS, type GroupPatrolCommand, type Request, type Response } from './protocol';

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

/** Authored world, ordinary recorded policy/travel commands; no organic-scale claim. */
function patrolFixture(count = 3) {
  const game = theaterCampaign(count), journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const armyIds = Object.keys(game.armies).sort();
  for (const armyId of armyIds) {
    expect(journal.record(game, { type: 'setPatrol', factionId: game.turnOwnerId, armyId, firstCell: 495, secondCell: 497, enabled: true, pauseOnWar: true }).ok).toBe(true);
  }
  expect(journal.record(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: armyIds[0]!, target: 510 }).ok).toBe(true);
  expect(Object.keys(game.routes).length).toBeGreaterThan(0);
  const commands: GroupPatrolCommand[] = armyIds.map(armyId => ({ type: 'setPatrolEnabled', factionId: game.turnOwnerId, armyId, enabled: false }));
  return { game, journal, armyIds, commands };
}
async function importFixture(fixture: ReturnType<typeof patrolFixture>) {
  return request({ type: 'import', bytes: await exportSave(serializeCampaign(fixture.game, fixture.journal.materialize())) }, 'state');
}

describe('actual worker grouped patrol policies', () => {
  it('pauses, resumes and removes 128 policies in stable order with one final state/save per batch and exact replay, preserving travel and armies', async () => {
    const fixture = patrolFixture(MAX_GROUP_ORDER_COMMANDS), { game, armyIds } = fixture;
    let current = await importFixture(fixture);
    const baseline = await exported(), expected = deserializeGame(serializeGame(game));
    const saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      for (const action of ['pause', 'resume', 'remove'] as const) {
        const commands: GroupPatrolCommand[] = armyIds.map(armyId => action === 'remove'
          ? { type: 'clearPatrol', factionId: game.turnOwnerId, armyId }
          : { type: 'setPatrolEnabled', factionId: game.turnOwnerId, armyId, enabled: action === 'resume' });
        for (const command of commands) expect(applyCommand(expected, command).ok).toBe(true);
        saved.mockClear(); completed.length = 0;
        current = await request({ type: 'groupPatrol', commands: [...commands].reverse(), expectedHash: current.hash }, 'state');
        expect(completed).toHaveLength(1); expect(saved).toHaveBeenCalledTimes(1);
        expect(saved.mock.calls[0]?.[2]).toBe('auto');
        expect(current.groupPatrolResults?.map(row => row.armyId)).toEqual(armyIds);
        expect(current.groupPatrolResults?.every(row => row.accepted)).toBe(true);
        expect(current.hash).toBe(stateHash(expected));
        expect(current.metrics.groupPatrolResultBytes).toBe(new TextEncoder().encode(JSON.stringify({ groupPatrolResults: current.groupPatrolResults })).byteLength);
        const exact = await exported();
        expect(serializeGame(exact.game)).toBe(serializeGame(expected));
        expect(exact.game.armies).toEqual(baseline.game.armies); expect(exact.game.routes).toEqual(baseline.game.routes);
        expect(exact.archive.records.slice(-128).map(record => record.command)).toEqual(commands);
        expect(stateHash(replayArchive(exact.archive))).toBe(current.hash);
        expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(current.hash);
        expect((await exported()).text).toBe(exact.text);
      }
    } finally { saved.mockRestore(); }
  });

  it('rejects malformed, mixed, foreign-seat and stale envelopes before any command or save', async () => {
    const fixture = patrolFixture(), initial = await importFixture(fixture), before = await exported();
    const command = fixture.commands[0]!, other = fixture.commands[1]!;
    const base = { type: 'groupPatrol', expectedHash: initial.hash, commands: fixture.commands };
    const malformed = [
      { ...base, commands: [] }, { ...base, commands: Array(129).fill(command) },
      { ...base, commands: new Array(2) }, { ...base, commands: [command, command] },
      { ...base, commands: [command, { ...other, factionId: 'faction.2' }] },
      { ...base, commands: [command, { ...other, enabled: true }] },
      { ...base, commands: [command, { type: 'clearPatrol', factionId: other.factionId, armyId: other.armyId }] },
      { ...base, commands: [command, { ...other, extra: true }] },
      { ...base, commands: [command, { type: 'endTurn', factionId: command.factionId }] },
      { ...base, expectedHash: '00000000' }, { ...base, expectedHash: null }, { ...base, extra: true },
    ];
    const record = vi.spyOn(CampaignJournal.prototype, 'record'), saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      for (const body of malformed) {
        const response = await request(body as RequestBody, 'error');
        expect(response.recoveryRequired).not.toBe(true);
        expect((await exported()).text).toBe(before.text);
      }
      expect(record).not.toHaveBeenCalled(); expect(saved).not.toHaveBeenCalled();
    } finally { record.mockRestore(); saved.mockRestore(); }
  });

  it('keeps canonical partial refusals and their records without discarding successful peers', async () => {
    const fixture = patrolFixture(), initial = await importFixture(fixture);
    const missing: GroupPatrolCommand = { ...fixture.commands[0]!, armyId: 'army.missing' };
    const commands = [...fixture.commands, missing].sort((a, b) => a.armyId.localeCompare(b.armyId));
    const response = await request({ type: 'groupPatrol', expectedHash: initial.hash, commands: [...commands].reverse() }, 'state');
    expect(response.groupPatrolResults?.filter(row => row.accepted)).toHaveLength(3);
    expect(response.groupPatrolResults?.find(row => row.armyId === missing.armyId)).toMatchObject({ accepted: false, message: expect.any(String) });
    const exact = await exported();
    expect(exact.archive.records.slice(-4).map(row => row.command)).toEqual(commands);
    expect(exact.archive.records.at(-1)?.ok).toBe(false);
    expect(stateHash(replayArchive(exact.archive))).toBe(response.hash);
    expect(exact.game.routes).toEqual(fixture.game.routes); expect(exact.game.armies).toEqual(fixture.game.armies);
  });

  it('refuses player mutation in watch mode without recording or saving', async () => {
    const fixture = patrolFixture(), journal = createJournal(fixture.game, { mode: 'watch', coverage: 'from-save' });
    const initial = await request({ type: 'import', bytes: await exportSave(serializeCampaign(fixture.game, journal.materialize())) }, 'state');
    const before = await exported();
    expect((await request({ type: 'groupPatrol', expectedHash: initial.hash, commands: fixture.commands }, 'error')).message).toContain('AI watch controls');
    expect((await exported()).text).toBe(before.text);
  });

  it('locks after a recorder throws following mutation, stops remaining orders, and restores the prior manual save', async () => {
    const fixture = patrolFixture(), initial = await importFixture(fixture);
    await request({ type: 'save' }, 'message');
    const record = CampaignJournal.prototype.record, saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    const broken = vi.spyOn(CampaignJournal.prototype, 'record').mockImplementation(function (this: CampaignJournal, ...args: Parameters<typeof record>) {
      const result = record.apply(this, args);
      if (args[1].type === 'setPatrolEnabled' && args[1].armyId === fixture.armyIds[1]) throw new Error('Authored recorder interruption after patrol mutation.');
      return result;
    });
    try {
      const result = await request({ type: 'groupPatrol', expectedHash: initial.hash, commands: fixture.commands }, 'state');
      expect(result.groupPatrolResults).toHaveLength(1);
      expect(result.groupPatrolError).toContain('after 1 completed patrol order');
      expect(result.observation.patrols?.filter(patrol => !patrol.enabled)).toHaveLength(2);
      expect(broken).toHaveBeenCalledTimes(2); expect(saved).not.toHaveBeenCalled();
      for (const body of [{ type: 'save' }, { type: 'export' }, { type: 'groupPatrol', expectedHash: result.hash, commands: fixture.commands }] as const) {
        expect((await request(body, 'error')).recoveryRequired).toBe(true);
      }
    } finally { broken.mockRestore(); saved.mockRestore(); }
    expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    expect((await request({ type: 'groupPatrol', expectedHash: initial.hash, commands: fixture.commands }, 'state')).groupPatrolResults?.every(row => row.accepted)).toBe(true);
  });

  it('locks failed final publication and restores the exact accepted autosave without retrying orders', async () => {
    const fixture = patrolFixture(), initial = await importFixture(fixture);
    const send = host.postMessage, saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    let acceptedHash: string | undefined;
    const broken = vi.spyOn(host, 'postMessage').mockImplementation((message, options) => {
      if (message.type === 'state' && message.groupPatrolResults) { acceptedHash = message.hash; throw new Error('Authored publication interruption.'); }
      send(message, options);
    });
    try {
      const result = await request({ type: 'groupPatrol', expectedHash: initial.hash, commands: fixture.commands }, 'error');
      expect(result.recoveryRequired).toBe(true); expect(result.message).toContain('Some orders may have applied');
      expect(saved).toHaveBeenCalledTimes(1);
      expect((await request({ type: 'save' }, 'error')).recoveryRequired).toBe(true);
    } finally { broken.mockRestore(); saved.mockRestore(); }
    expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(acceptedHash);
    const exact = await exported();
    expect(exact.archive.records.slice(-3).map(row => row.command)).toEqual(fixture.commands);
    expect(stateHash(replayArchive(exact.archive))).toBe(acceptedHash);
  });

  it('records all-refused batches without autosaving or changing canonical state', async () => {
    const fixture = patrolFixture(), initial = await importFixture(fixture);
    const commands: GroupPatrolCommand[] = [{ type: 'clearPatrol', factionId: fixture.game.turnOwnerId, armyId: 'army.missing' }];
    const saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      const result = await request({ type: 'groupPatrol', expectedHash: initial.hash, commands }, 'state');
      expect(result.hash).toBe(initial.hash);
      expect(result.groupPatrolResults).toEqual([{ armyId: 'army.missing', accepted: false, message: 'You do not control that army patrol.' }]);
      expect(saved).not.toHaveBeenCalled();
      const exact = await exported();
      expect(exact.archive.records.at(-1)).toMatchObject({ ok: false, command: commands[0] });
      expect(stateHash(replayArchive(exact.archive))).toBe(initial.hash);
    } finally { saved.mockRestore(); }
  });

  it('reports failed autosave while retaining accepted in-memory policies and the earlier manual save', async () => {
    const fixture = patrolFixture(), initial = await importFixture(fixture);
    await request({ type: 'save' }, 'message');
    const broken = vi.spyOn(SaveStore.prototype, 'saveCampaign').mockRejectedValue(new Error('Authored unavailable patrol storage.'));
    try {
      const result = await request({ type: 'groupPatrol', expectedHash: initial.hash, commands: fixture.commands }, 'state');
      expect(result.groupPatrolError).toBeUndefined();
      expect(result.groupPatrolResults?.every(row => row.accepted)).toBe(true);
      expect(result.message).toContain('Autosave failed: Authored unavailable patrol storage.');
      const exact = await exported();
      expect(stateHash(exact.game)).toBe(result.hash);
      expect(stateHash(replayArchive(exact.archive))).toBe(result.hash);
      expect(exact.game.routes).toEqual(fixture.game.routes); expect(exact.game.armies).toEqual(fixture.game.armies);
      expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    } finally { broken.mockRestore(); }
  });
});

