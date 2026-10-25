import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { applyCommand, createArmyFormation, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { CampaignJournal, createJournal, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from '@theandril/persistence';
import type { GroupPatrolCommand, Request, Response } from './protocol';

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

type Assignment = Extract<GroupPatrolCommand, { type: 'setPatrol' }>;
const byArmy = (a: { armyId: string }, b: { armyId: string }) => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0;

function assignmentFixture(count = 5) {
  const game = theaterCampaign(count);
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const armyIds = Object.keys(game.armies).sort(), factionId = game.turnOwnerId;
  for (const [index, armyId] of armyIds.slice(0, 2).entries()) expect(journal.record(game, {
    type: 'setPatrol', factionId, armyId, firstCell: 495, secondCell: 497, enabled: index === 0, pauseOnWar: false,
  }).ok).toBe(true);
  expect(journal.record(game, { type: 'queueMovement', factionId, armyId: armyIds[0]!, target: 510 }).ok).toBe(true);
  const commands: Assignment[] = armyIds.map((armyId, index) => ({ type: 'setPatrol', factionId, armyId,
    firstCell: 497, secondCell: 495, enabled: index !== 1, pauseOnWar: true }));
  return { game, journal, armyIds, commands };
}
async function importFixture(fixture: ReturnType<typeof assignmentFixture>) {
  return request({ type: 'import', bytes: await exportSave(serializeCampaign(fixture.game, fixture.journal.materialize())) }, 'state');
}

describe('actual worker group patrol assignment', () => {
  it('preserves mixed enabled choices, replaces points in stable order, and restores exact autosave and replay', async () => {
    const fixture = assignmentFixture(), initial = await importFixture(fixture), before = await exported();
    const expected = deserializeGame(serializeGame(fixture.game));
    for (const command of fixture.commands) expect(applyCommand(expected, command).ok).toBe(true);
    const saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      completed.length = 0;
      const result = await request({ type: 'groupPatrol', commands: [...fixture.commands].reverse(), expectedHash: initial.hash }, 'state');
      expect(completed).toHaveLength(1); expect(saved).toHaveBeenCalledTimes(1);
      expect(saved.mock.calls[0]?.[2]).toBe('auto');
      expect(result.groupPatrolResults?.map(row => row.armyId)).toEqual(fixture.armyIds);
      expect(result.groupPatrolResults?.every(row => row.accepted)).toBe(true);
      expect(result.observation.patrols?.find(row => row.armyId === fixture.armyIds[1])?.enabled).toBe(false);
      expect(result.observation.patrols?.find(row => row.armyId === fixture.armyIds.at(-1))?.enabled).toBe(true);
      expect(result.hash).toBe(stateHash(expected));
      const exact = await exported();
      expect(serializeGame(exact.game)).toBe(serializeGame(expected));
      expect(exact.game.armies).toEqual(before.game.armies); expect(exact.game.routes).toEqual(before.game.routes);
      expect(exact.archive.records.slice(-fixture.commands.length).map(row => row.command)).toEqual(fixture.commands);
      expect(stateHash(replayArchive(exact.archive))).toBe(result.hash);
      expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(result.hash);
      expect((await exported()).text).toBe(exact.text);
    } finally { saved.mockRestore(); }
  });

  it('records canonical missing-army and caravan refusals alongside successful assignments in stable order', async () => {
    const game = theaterCampaign(4), armyIds = Object.keys(game.armies).sort(), factionId = game.turnOwnerId;
    game.armies[armyIds[1]!]!.formations.push(createArmyFormation(`army.${game.nextId++}`, 'unit.colonist'));
    game.armies[armyIds[1]!]!.formations.sort((a, b) => a.id.localeCompare(b.id));
    const initial = await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
    const commands: Assignment[] = [...armyIds, 'army.missing'].map((armyId): Assignment => ({ type: 'setPatrol', factionId, armyId,
      firstCell: 495, secondCell: 497, enabled: true, pauseOnWar: false })).sort(byArmy);
    const result = await request({ type: 'groupPatrol', commands: [...commands].reverse(), expectedHash: initial.hash }, 'state');
    expect(result.groupPatrolResults?.map(row => row.armyId)).toEqual(commands.map(command => command.armyId));
    expect(result.groupPatrolResults?.filter(row => row.accepted)).toHaveLength(3);
    expect(result.groupPatrolResults?.find(row => row.armyId === armyIds[1])).toMatchObject({ accepted: false, message: expect.stringContaining('without caravans') });
    expect(result.groupPatrolResults?.find(row => row.armyId === 'army.missing')).toMatchObject({ accepted: false, message: 'You do not control that army.' });
    const exact = await exported();
    expect(exact.archive.records.map(row => row.command)).toEqual(commands);
    expect(exact.archive.records.filter(row => !row.ok)).toHaveLength(2);
    expect(stateHash(replayArchive(exact.archive))).toBe(result.hash);
    expect(exact.game.armies).toEqual(game.armies);
  });

  it('rejects stale, malformed, mixed-action, mismatched-point and mismatched-war batches before mutation', async () => {
    const fixture = assignmentFixture(), initial = await importFixture(fixture);
    const changed = await request({ type: 'command', command: { type: 'setPatrolEnabled', factionId: fixture.game.turnOwnerId, armyId: fixture.armyIds[0]!, enabled: false } }, 'state');
    expect(changed.hash).not.toBe(initial.hash);
    const before = await exported(), first = fixture.commands[0]!, second = fixture.commands[1]!;
    const base = { type: 'groupPatrol', commands: fixture.commands, expectedHash: changed.hash };
    const invalid = [
      { ...base, expectedHash: initial.hash }, { ...base, expectedHash: undefined }, { ...base, expectedHash: 'INVALID!' },
      { ...base, commands: [] }, { ...base, commands: Array(129).fill(first) }, { ...base, commands: new Array(2) },
      { ...base, commands: [first, first] }, { ...base, commands: [first, { ...second, firstCell: 496 }] },
      { ...base, commands: [first, { ...second, secondCell: 496 }] }, { ...base, commands: [first, { ...second, pauseOnWar: false }] },
      { ...base, commands: [first, { ...second, factionId: 'faction.other' }] }, { ...base, commands: [first, { ...second, extra: true }] },
      { ...base, commands: [first, { type: 'clearPatrol', factionId: second.factionId, armyId: second.armyId }] },
      { ...base, commands: [first, { ...second, firstCell: 0.5 }] }, { ...base, extra: true },
    ];
    const record = vi.spyOn(CampaignJournal.prototype, 'record'), saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      for (const body of invalid) {
        expect((await request(body as RequestBody, 'error')).recoveryRequired).not.toBe(true);
        expect((await exported()).text).toBe(before.text);
      }
      expect(record).not.toHaveBeenCalled(); expect(saved).not.toHaveBeenCalled();
    } finally { record.mockRestore(); saved.mockRestore(); }
    expect((await request({ type: 'groupPatrol', commands: fixture.commands, expectedHash: changed.hash }, 'state')).groupPatrolResults?.every(row => row.accepted)).toBe(true);
  });

  it('uses canonical refusal for equal or unexplored endpoints and normalizes an omitted false war option', async () => {
    const game = theaterCampaign(3), armyIds = Object.keys(game.armies).sort(), factionId = game.turnOwnerId;
    game.explored[factionId]!.delete(0);
    let current = await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
    const before = await exported();
    for (const [firstCell, secondCell] of [[495, 495], [495, 0]] as const) {
      const commands: Assignment[] = armyIds.map((armyId): Assignment => ({ type: 'setPatrol', factionId, armyId, firstCell, secondCell, enabled: true, pauseOnWar: false }));
      current = await request({ type: 'groupPatrol', commands, expectedHash: current.hash }, 'state');
      expect(current.groupPatrolResults?.every(row => !row.accepted)).toBe(true);
      expect(current.hash).toBe(stateHash(before.game));
    }
    const commands: Assignment[] = armyIds.map((armyId, index) => ({ type: 'setPatrol', factionId, armyId,
      firstCell: 495, secondCell: 497, enabled: true, ...(index === 0 ? {} : { pauseOnWar: false }) }));
    current = await request({ type: 'groupPatrol', commands, expectedHash: current.hash }, 'state');
    expect(current.groupPatrolResults?.every(row => row.accepted)).toBe(true);
    const exact = await exported();
    expect(exact.archive.records).toHaveLength(9);
    expect(stateHash(replayArchive(exact.archive))).toBe(current.hash);
  });

  it('accepts all 128 assignments, refuses the 129th policy canonically, and still permits replacement at capacity', async () => {
    const game = theaterCampaign(129), armyIds = Object.keys(game.armies).sort(), factionId = game.turnOwnerId;
    let current = await request({ type: 'import', bytes: await exportSave(serializeGame(game)) }, 'state');
    const commands: Assignment[] = armyIds.map((armyId): Assignment => ({ type: 'setPatrol', factionId, armyId, firstCell: 495, secondCell: 497, enabled: true, pauseOnWar: false }));
    current = await request({ type: 'groupPatrol', commands: commands.slice(0, 128).reverse(), expectedHash: current.hash }, 'state');
    expect(current.groupPatrolResults).toHaveLength(128);
    expect(current.groupPatrolResults?.every(row => row.accepted)).toBe(true);
    const fullHash = current.hash;
    current = await request({ type: 'groupPatrol', commands: [commands[128]!], expectedHash: current.hash }, 'state');
    expect(current.groupPatrolResults).toEqual([{ armyId: armyIds[128], accepted: false, message: 'A realm may keep at most 128 army patrols.' }]);
    expect(current.hash).toBe(fullHash);
    const replacement = { ...commands[0]!, firstCell: 497, secondCell: 495, enabled: false };
    current = await request({ type: 'groupPatrol', commands: [replacement], expectedHash: current.hash }, 'state');
    expect(current.groupPatrolResults?.[0]?.accepted).toBe(true);
    const exact = await exported();
    expect(exact.game.patrols).toHaveLength(128); expect(exact.archive.records).toHaveLength(130);
    expect(stateHash(replayArchive(exact.archive))).toBe(current.hash);
    expect((await request({ type: 'loadAuto' }, 'state')).hash).toBe(current.hash);
  });

  it('stops assignment after a recorder interruption and requires restoration before retrying', async () => {
    const fixture = assignmentFixture(), initial = await importFixture(fixture);
    await request({ type: 'save' }, 'message');
    const record = CampaignJournal.prototype.record, saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    const broken = vi.spyOn(CampaignJournal.prototype, 'record').mockImplementation(function (this: CampaignJournal, ...args: Parameters<typeof record>) {
      const result = record.apply(this, args);
      if (args[1].type === 'setPatrol' && args[1].armyId === fixture.armyIds[1]) throw new Error('Authored assignment interruption after mutation.');
      return result;
    });
    try {
      const result = await request({ type: 'groupPatrol', commands: fixture.commands, expectedHash: initial.hash }, 'state');
      expect(result.groupPatrolResults).toHaveLength(1);
      expect(result.groupPatrolError).toContain('after 1 completed patrol order');
      expect(result.observation.patrols?.filter(row => row.firstCell === 497)).toHaveLength(2);
      expect(broken).toHaveBeenCalledTimes(2); expect(saved).not.toHaveBeenCalled();
      expect((await request({ type: 'groupPatrol', commands: fixture.commands, expectedHash: result.hash }, 'error')).recoveryRequired).toBe(true);
    } finally { broken.mockRestore(); saved.mockRestore(); }
    expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
    const restored = await request({ type: 'groupPatrol', commands: fixture.commands, expectedHash: initial.hash }, 'state');
    expect(restored.groupPatrolResults?.every(row => row.accepted)).toBe(true);
    expect(stateHash(replayArchive((await exported()).archive))).toBe(restored.hash);
  });
});

