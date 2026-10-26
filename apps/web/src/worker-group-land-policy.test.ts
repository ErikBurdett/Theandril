import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getLandPolicyChoice, getSettlementLandObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { CampaignJournal, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore } from '@theandril/persistence';
import { rebaseAuthoredLand } from '../../../packages/test-fixtures/src/authored-land';
import { cellsWithin } from '../../../packages/sim/src/visibility';
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

type Commission = Extract<GameCommand, { type: 'setLandPolicy' }>;
const byTown = (a: { settlementId: string }, b: { settlementId: string }) => a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0;

/** Authored ownership, population, funding and local plains isolate transport.
 * Workers and every purchase still use ordinary canonical commands/prices. */
function commissionFixture(count = 3) {
  let game = createGame({ seed: 17, size: count > 4 ? 'small' : 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4 });
  const factionId = game.turnOwnerId;
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
    expect(applyCommand(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: `${faction.name} Hearth` }).ok).toBe(true);
  }
  const source = Object.values(game.settlements).find(town => town.factionId === factionId)!;
  const own = [source];
  for (let cell = 0; own.length < count && cell < game.world.terrain.length; cell++) {
    if (!isPassable(game.world.terrain[cell]!) || Object.values(game.settlements).some(town => hexDistance(cell, town.cell, game.world.width) < 4)) continue;
    const id = `settlement.${game.nextId++}`;
    const town = { ...structuredClone(source), id, cell, name: `Authored commission hearth ${own.length + 1}` };
    game.settlements[id] = town; own.push(town);
  }
  expect(own).toHaveLength(count);
  for (const town of own) {
    town.population = 2;
    for (const cell of cellsWithin(game, town.cell, 1)) {
      game.world.terrain[cell] = 1; game.world.biome[cell] = 1; game.world.waterDepth[cell] = 0; game.world.hydrology[cell] = 0;
      delete game.resources.deposits[cell];
    }
  }
  game.factions.find(faction => faction.id === factionId)!.treasury = 100_000;
  rebaseAuthoredLand(game);
  for (const town of own) {
    const cells = getSettlementLandObservation(game, factionId, town.id)!.cells.filter(cell => cell.claimed && cell.canWork).map(cell => cell.cell).sort((a, b) => a - b).slice(0, 2);
    expect(cells).toHaveLength(2);
    expect(applyCommand(game, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells }).ok).toBe(true);
  }
  game = deserializeGame(serializeGame(game));
  const commands: Commission[] = own.map((town): Commission => ({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 40 })).sort(byTown);
  return { game, commands, factionId };
}
async function importFixture(fixture: ReturnType<typeof commissionFixture>) {
  return request({ type: 'import', bytes: await exportSave(serializeGame(fixture.game)) }, 'state');
}

// The existing simulation implements policy rules. These checks execute the real
// worker, recorder and storage path and compare it with those ordinary commands.
describe('actual worker group-land-commission boundary', () => {
  it('pays for 30 ordinary works in stable order with one final response, exact replay and no implicit save', async () => {
    const fixture = commissionFixture(30), initial = await importFixture(fixture);
    const { game, commands } = fixture, beforeCoin = game.factions[0]!.treasury;
    const saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    try {
      const batch = dispatch({ type: 'groupLandPolicy', expectedHash: initial.hash, commands: [...commands].reverse() }, 'state');
      const result = await batch.response;
      expect(completed.filter(id => id === batch.id)).toHaveLength(1);
      expect(result.groupLandPolicyResults).toEqual(commands.map(command => ({ settlementId: command.settlementId, accepted: true })));
      expect(result.observation.landPolicies).toHaveLength(30);
      expect(result.metrics.groupLandPolicyResultBytes).toBe(new TextEncoder().encode(JSON.stringify({ groupLandPolicyResults: result.groupLandPolicyResults })).byteLength);
      expect(saved).not.toHaveBeenCalled();
      for (const command of commands) expect(applyCommand(game, command).ok).toBe(true);
      expect(result.hash).toBe(stateHash(game));
      const after = await exported();
      const paid = Object.values(after.game.land.settlements).filter(land => land.work);
      expect(paid).toHaveLength(30);
      const spending = paid.reduce((sum, land) => sum + land.work!.coinCost, 0);
      expect(spending).toBeGreaterThan(0); expect(after.game.factions[0]!.treasury).toBe(beforeCoin - spending);
      expect(after.game.landPolicies.reduce((sum, policy) => sum + policy.allowance, 0)).toBe(3000 - spending);
      expect(after.archive.records).toHaveLength(30);
      expect(serializeGame(replayArchive(after.archive))).toBe(serializeGame(game));
      await request({ type: 'save' }, 'message');
      const ended = await request({ type: 'groupLandPolicy', expectedHash: result.hash, commands: commands.map(command => ({ ...command, improvementId: 'none', allowance: 0, reserve: 0 })) }, 'state');
      expect(ended.observation.landPolicies).toEqual([]);
      const removed = await exported();
      expect(removed.game.factions[0]!.treasury).toBe(after.game.factions[0]!.treasury);
      expect(Object.values(removed.game.land.settlements).filter(land => land.work)).toHaveLength(30);
      expect((await request({ type: 'load' }, 'state')).hash).toBe(result.hash);
      expect((await exported()).text).toBe(after.text);
    } finally { saved.mockRestore(); }
  });

  it('refreshes the shared treasury between immediate purchases without spending through the reserve', async () => {
    const fixture = commissionFixture(2), { game, commands } = fixture;
    const quotes = commands.map(command => getLandPolicyChoice(game, command));
    expect(quotes.every(quote => quote.coinCost !== null && !quote.blocker)).toBe(true);
    const purse = 40 + Math.max(...quotes.map(quote => quote.coinCost!));
    game.factions[0]!.treasury = purse;
    const initial = await importFixture(fixture);
    const result = await request({ type: 'groupLandPolicy', expectedHash: initial.hash, commands: [...commands].reverse() }, 'state');
    expect(result.groupLandPolicyResults?.every(row => row.accepted)).toBe(true);
    const after = await exported();
    expect(after.game.land.settlements[commands[0]!.settlementId]!.work?.coinCost).toBe(quotes[0]!.coinCost);
    expect(after.game.land.settlements[commands[1]!.settlementId]!.work).toBeNull();
    expect(after.game.factions[0]!.treasury).toBe(purse - quotes[0]!.coinCost!);
    expect(after.game.factions[0]!.treasury).toBeGreaterThanOrEqual(40);
    expect(after.game.landPolicies.map(policy => policy.allowance)).toEqual([100 - quotes[0]!.coinCost!, 100]);
    expect(stateHash(replayArchive(after.archive))).toBe(result.hash);
  });

  it('rejects entire malformed, heterogeneous, duplicate, wrong-seat and stale requests before any recording', async () => {
    const fixture = commissionFixture(2), initial = await importFixture(fixture), { commands } = fixture;
    const base = { type: 'groupLandPolicy' as const, expectedHash: initial.hash, commands };
    const before = await exported(), record = vi.spyOn(CampaignJournal.prototype, 'record'), saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
    const sparse = new Array(2); sparse[1] = commands[1];
    const invalid: unknown[] = [
      { ...base, unexpected: true }, { ...base, expectedHash: undefined }, { ...base, expectedHash: 'ABCDEF12' },
      { ...base, expectedHash: initial.hash === '00000000' ? '11111111' : '00000000' },
      ...[[], sparse, Object.assign([...commands], { hidden: true }), [commands[0], commands[0]],
        [commands[0], { ...commands[1], improvementId: 'improvement.watchtower' }],
        [commands[0], { ...commands[1], improvementId: 'none' }],
        [commands[0], { ...commands[1], allowance: 99 }], [commands[0], { ...commands[1], reserve: 41 }],
        [commands[0], { ...commands[1], factionId: 'foreign.faction' }],
        [commands[0], { ...commands[1], hidden: true }],
        ...[-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '10'].flatMap(value => [
          [commands[0], { ...commands[1], allowance: value }], [commands[0], { ...commands[1], reserve: value }],
        ]),
        Array.from({ length: 129 }, (_, index) => ({ ...commands[0], settlementId: `settlement.${index}` })),
      ].map(commands => ({ ...base, commands })),
    ];
    try {
      for (const body of invalid) {
        expect((await request(body as RequestBody, 'error')).recoveryRequired).not.toBe(true);
        expect((await exported()).text).toBe(before.text);
      }
      expect(record).not.toHaveBeenCalled(); expect(saved).not.toHaveBeenCalled();
    } finally { record.mockRestore(); saved.mockRestore(); }
    expect((await request(base, 'state')).groupLandPolicyResults?.every(row => row.accepted)).toBe(true);
  });

  it('accepts exactly 128 distinct commissions without truncation', async () => {
    const fixture = commissionFixture(128), initial = await importFixture(fixture);
    // Zero allowance deliberately installs waiting policies at the transport limit.
    // The 30-hearth workload above separately proves real paid batch work.
    const commands = fixture.commands.map(command => ({ ...command, allowance: 0 }));
    const result = await request({ type: 'groupLandPolicy', commands: [...commands].reverse(), expectedHash: initial.hash }, 'state');
    expect(result.groupLandPolicyResults).toEqual(commands.map(command => ({ settlementId: command.settlementId, accepted: true })));
    expect(result.observation.landPolicies).toHaveLength(128);
    const after = await exported();
    expect(after.archive.records).toHaveLength(128);
    expect(stateHash(replayArchive(after.archive))).toBe(result.hash);
  });

  it('rejects stale assignment and removal after real same-turn spending, then accepts the refreshed intent', async () => {
    const fixture = commissionFixture(2), initial = await importFixture(fixture), { commands } = fixture;
    const installed = await request({ type: 'groupLandPolicy', commands, expectedHash: initial.hash }, 'state');
    const changed = await request({ type: 'command', command: { type: 'queue', factionId: fixture.factionId, settlementId: commands[0]!.settlementId, itemId: 'building.granary' } }, 'state');
    expect(changed.hash).not.toBe(installed.hash);
    const before = await exported(), record = vi.spyOn(CampaignJournal.prototype, 'record');
    try {
      for (const proposed of [commands, commands.map(command => ({ ...command, improvementId: 'none', allowance: 0, reserve: 0 }))]) {
        const result = await request({ type: 'groupLandPolicy', commands: proposed, expectedHash: installed.hash }, 'error');
        expect(result.message).toContain('campaign changed'); expect(result.recoveryRequired).not.toBe(true);
        expect((await exported()).text).toBe(before.text);
      }
      expect(record).not.toHaveBeenCalled();
    } finally { record.mockRestore(); }
    const result = await request({ type: 'groupLandPolicy', commands, expectedHash: changed.hash }, 'state');
    expect(result.groupLandPolicyResults?.every(row => row.accepted)).toBe(true);
    // Active works remain; replacing the permission does not buy duplicate work.
    const after = await exported();
    expect(after.game.factions[0]!.treasury).toBe(before.game.factions[0]!.treasury);
    expect(after.game.land.settlements).toEqual(before.game.land.settlements);
    expect(stateHash(replayArchive(after.archive))).toBe(result.hash);
  });

  it('records canonical foreign, missing and policy-free refusals alongside accepted removals', async () => {
    const fixture = commissionFixture(2), { game, commands } = fixture;
    expect(applyCommand(game, commands[0]!).ok).toBe(true);
    const foreign = Object.values(game.settlements).find(town => town.factionId !== game.turnOwnerId)!;
    const initial = await importFixture(fixture);
    const removals: Commission[] = [...commands.map(command => ({ ...command, improvementId: 'none', allowance: 0, reserve: 0 })),
      { ...commands[0]!, settlementId: foreign.id, improvementId: 'none', allowance: 0, reserve: 0 },
      { ...commands[0]!, settlementId: 'settlement.missing', improvementId: 'none', allowance: 0, reserve: 0 }];
    const response = await request({ type: 'groupLandPolicy', commands: removals.reverse(), expectedHash: initial.hash }, 'state');
    expect(response.groupLandPolicyResults?.filter(row => row.accepted)).toHaveLength(1);
    expect(response.groupLandPolicyResults?.filter(row => !row.accepted)).toHaveLength(3);
    expect(response.groupLandPolicyResults?.every(row => row.accepted || Boolean(row.message))).toBe(true);
    const after = await exported();
    expect(after.archive.records).toHaveLength(4);
    expect(stateHash(replayArchive(after.archive))).toBe(response.hash);
  });

  for (const failure of ['recording', 'publication'] as const) {
    it(`requires restoration after land commission ${failure} fails following payment`, async () => {
      const fixture = commissionFixture(3), initial = await importFixture(fixture), { commands } = fixture;
      await request({ type: 'save' }, 'message');
      const before = await exported(), saved = vi.spyOn(SaveStore.prototype, 'saveCampaign');
      const originalRecord = CampaignJournal.prototype.record, originalSend = host.postMessage;
      let paidCount = 0;
      const recording = vi.spyOn(CampaignJournal.prototype, 'record').mockImplementation(function (this: CampaignJournal, ...args: Parameters<typeof originalRecord>) {
        const result = originalRecord.apply(this, args);
        if (args[1].type === 'setLandPolicy') {
          expect(result.events.some(event => event.type === 'land_work_started')).toBe(true);
          paidCount++;
          if (failure === 'recording' && paidCount === 2) throw new Error('Authored recorder interruption after canonical payment.');
        }
        return result;
      });
      const publication = vi.spyOn(host, 'postMessage').mockImplementation((message, options) => {
        if (failure === 'publication' && message.type === 'state' && message.groupLandPolicyResults) throw new Error('Authored land commission publication interruption.');
        originalSend(message, options);
      });
      const body = { type: 'groupLandPolicy' as const, commands, expectedHash: initial.hash };
      try {
        if (failure === 'recording') {
          const result = await request(body, 'state');
          expect(result.groupLandPolicyResults).toHaveLength(1);
          expect(result.observation.landPolicies).toHaveLength(2);
          expect(result.groupLandPolicyError).toContain('Some orders may have applied');
        } else {
          const result = await request(body, 'error');
          expect(result.recoveryRequired).toBe(true); expect(result.message).toContain('Some orders may have applied');
        }
        expect(paidCount).toBe(failure === 'recording' ? 2 : 3);
        for (const next of [body, { type: 'save' }, { type: 'export' }] as RequestBody[]) expect((await request(next, 'error')).recoveryRequired).toBe(true);
        expect(saved).not.toHaveBeenCalled();
      } finally { recording.mockRestore(); publication.mockRestore(); saved.mockRestore(); }
      expect((await request({ type: 'load' }, 'state')).hash).toBe(initial.hash);
      expect((await exported()).text).toBe(before.text);
      expect((await request(body, 'state')).groupLandPolicyResults).toHaveLength(3);
    });
  }
});
