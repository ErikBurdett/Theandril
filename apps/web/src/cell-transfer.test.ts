import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { applyCommand, createGame, getObservation, stateHash } from '@theandril/sim';
import { cellTransferBuffers, cellTransferBytes, packCells, unpackCells, type ObservedCell, type PackedCells } from './cell-transfer';

const cell = (overrides: Partial<ObservedCell> = {}): ObservedCell => ({ cell: 0, terrain: 0, biome: 0, waterDepth: 2, fertility: 0, visible: false, ...overrides });
const rich = () => packCells([cell({ cell: 9, terrain: 3, biome: 11, waterDepth: 0, fertility: 255, visible: true, featureMask: 127, settlementId: 'settlement.9', factionId: 'faction.ashen_compact', improvementId: 'improvement.quarry' }), cell({ cell: 2, settlementId: null })]);

describe('packed observed-cell transport', () => {
  it('roundtrips an empty message with three independent transferable buffers', () => {
    const packet = packCells([]), buffers = cellTransferBuffers(packet);
    expect(new Set(buffers).size).toBe(3); expect(buffers.every(buffer => buffer.byteLength === 0)).toBe(true);
    expect(unpackCells(structuredClone(packet, { transfer: buffers }))).toEqual([]);
  });

  it('uses nine binary bytes per plain row, preserving shuffled order and scalar extremes', () => {
    const input = [cell({ cell: 349_999, terrain: 4, biome: 11, waterDepth: 0, fertility: 255, visible: true }), cell({ cell: 2 }), cell({ cell: 17, terrain: 2, biome: 3, waterDepth: 1, fertility: 128 })];
    const packed = packCells(input);
    expect(packed.metadata).toHaveLength(0); expect(packed.dictionary).toEqual([]);
    expect(cellTransferBuffers(packed).reduce((total, buffer) => total + buffer.byteLength, 0)).toBe(input.length * 9);
    expect(unpackCells(packed)).toStrictEqual(input);
  });

  it('preserves every optional-field combination, including absent, null, undefined and zero', () => {
    const refs = [{}, { settlementId: null }, { settlementId: undefined }, { settlementId: 'settlement.1' }];
    const input: ObservedCell[] = [];
    for (const settlement of refs) for (const faction of [undefined, null, 'faction.é']) for (const improvement of [undefined, null, 'improvement.reedworks']) for (const feature of [{}, { featureMask: undefined }, { featureMask: 0 }, { featureMask: 0xffff_ffff }]) {
      input.push(cell({ cell: input.length, ...settlement, factionId: faction, improvementId: improvement, ...feature }));
    }
    input.push(cell({ cell: input.length, improvementId: null }), cell({ cell: input.length + 1, featureMask: 0 }));
    const output = unpackCells(packCells(input));
    expect(output).toStrictEqual(input);
    for (let index = 0; index < input.length; index++) expect(Object.keys(output[index]!).sort()).toEqual(Object.keys(input[index]!).sort());
  });

  it('uses first-occurrence dictionary order without sorting cells or duplicating strings', () => {
    const packed = packCells([cell({ cell: 100, settlementId: 'settlement.z', factionId: 'faction.2' }), cell({ cell: 4, settlementId: 'settlement.a', factionId: 'faction.2', improvementId: 'settlement.z' })]);
    expect(packed.dictionary).toEqual(['settlement.z', 'faction.2', 'settlement.a']);
    expect([...packed.metadata]).toEqual([0, 0, 3, 4, 0, 1, 0, 5, 4, 3]);
    expect(packCells(unpackCells(packed))).toEqual(packed);
  });

  it('counts actual binary plus UTF-8 metadata/dictionary bytes, not typed-array JSON', () => {
    const packet = packCells([cell({ settlementId: 'settlement.城', factionId: 'faction.é' })]);
    const metadata = JSON.stringify({ version: 1, count: 1, dictionary: packet.dictionary });
    expect(cellTransferBytes(packet)).toBe(29 + new TextEncoder().encode(metadata).byteLength);
    expect(cellTransferBytes(packet)).toBeGreaterThan(29 + metadata.length);
  });

  it('detaches only new packet storage, leaving observations and canonical world buffers intact', () => {
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'short' });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Transfer witness' }).ok).toBe(true);
    const input = getObservation(game, game.turnOwnerId).cells, original = structuredClone(input), before = stateHash(game);
    const packet = packCells(input), buffers = cellTransferBuffers(packet);
    for (const canonical of [game.world.terrain, game.world.biome, game.world.fertility, game.world.waterDepth]) expect(buffers).not.toContain(canonical.buffer);
    const received = structuredClone(packet, { transfer: buffers });
    expect(buffers.every(buffer => buffer.byteLength === 0)).toBe(true);
    expect(() => unpackCells(packet)).toThrow(/lengths/);
    expect(unpackCells(received)).toStrictEqual(original); expect(input).toStrictEqual(original);
    expect(stateHash(game)).toBe(before); expect(game.world.terrain.length).toBe(1536);
  });

  it('does not invent currently hidden changes, rows, ownership or feature values', () => {
    const input = [cell({ cell: 90, biome: 2, visible: false, settlementId: 'settlement.9', factionId: 'faction.old_owner' }), cell({ cell: 17, biome: 11, visible: true, featureMask: 64, improvementId: 'improvement.quarry' })];
    expect(unpackCells(packCells(input))).toStrictEqual(input);
    expect(unpackCells(packCells(input))).toHaveLength(2);
  });

  it('leaves frozen inputs untouched and returns detached decoded snapshots', () => {
    const input = Object.freeze([Object.freeze(cell({ featureMask: 3, settlementId: 'settlement.3' }))]);
    const packed = packCells(input), original = structuredClone(packed), decoded = unpackCells(packed);
    decoded[0]!.cell = 7; decoded[0]!.settlementId = 'changed'; decoded.push(cell());
    expect(packed).toEqual(original); expect(input[0]!.cell).toBe(0);
    expect(unpackCells(packed)).toStrictEqual([...input]);
  });

  it.each([
    { cell: -1 }, { cell: 350_000 }, { cell: 1.1 }, { cell: -0 }, { terrain: 5 }, { biome: 12 }, { waterDepth: 3 }, { fertility: 256 }, { fertility: NaN }, { fertility: Infinity },
    { visible: 1 }, { featureMask: -1 }, { featureMask: 0x1_0000_0000 }, { featureMask: null }, { settlementId: 2 }, { factionId: '' }, { improvementId: 'x'.repeat(101) }, { secret: 1 },
  ])('rejects invalid input before lossy typed-array coercion: %j', overrides => {
    expect(() => packCells([cell(overrides as Partial<ObservedCell>)])).toThrow(/Invalid cell transfer/);
  });

  it('rejects sparse input arrays and arrays exceeding the supported world bound', () => {
    expect(() => packCells(new Array<ObservedCell>(1))).toThrow(/input row/);
    expect(() => packCells(new Array<ObservedCell>(350_001))).toThrow(/too many/);
  });

  it.each([
    (packet: PackedCells) => ({ ...packet, version: 2 }),
    (packet: PackedCells) => ({ ...packet, count: -1 }),
    (packet: PackedCells) => ({ ...packet, count: 350_001 }),
    (packet: PackedCells) => ({ ...packet, surprise: true }),
    (packet: PackedCells) => ({ ...packet, cells: new Int32Array(packet.cells) }),
    (packet: PackedCells) => ({ ...packet, scalars: new Uint8Array(1) }),
    (packet: PackedCells) => ({ ...packet, metadata: new Uint32Array(1) }),
    (packet: PackedCells) => ({ ...packet, dictionary: ['same', 'same'] }),
    (packet: PackedCells) => ({ ...packet, dictionary: [''] }),
    (packet: PackedCells) => ({ ...packet, dictionary: [null] }),
  ])('rejects malformed packet shape', mutate => {
    expect(() => unpackCells(mutate(rich()))).toThrow(/Invalid cell transfer/);
  });

  it.each([
    (packet: PackedCells) => { packet.cells[0] = 350_000; },
    (packet: PackedCells) => { packet.scalars[0] = 5; },
    (packet: PackedCells) => { packet.scalars[1] = 12; },
    (packet: PackedCells) => { packet.scalars[2] = 3; },
    (packet: PackedCells) => { packet.scalars[4] = 16; },
    (packet: PackedCells) => { packet.scalars[4] = 8; },
    (packet: PackedCells) => { packet.scalars[4] = 4; },
    (packet: PackedCells) => { packet.metadata[0] = 2; },
    (packet: PackedCells) => { packet.metadata[5] = 0; },
    (packet: PackedCells) => { packet.metadata[6] = 1; },
    (packet: PackedCells) => { packet.metadata[7] = 0; },
    (packet: PackedCells) => { packet.metadata[2] = 99; },
    (packet: PackedCells) => { packet.scalars[9] = 0; },
  ])('rejects invalid rows/flags/metadata/indexes before decoding', mutate => {
    const packet = rich(); mutate(packet);
    expect(() => unpackCells(packet)).toThrow(/Invalid cell transfer/);
  });

  it('rejects shared, aliased and offset backing buffers instead of transferring unrelated bytes', () => {
    const packet = rich(), extended = new Uint32Array(packet.cells.length + 1);
    extended.set(packet.cells, 1);
    expect(() => unpackCells({ ...packet, cells: extended.subarray(1) })).toThrow(/whole allocations/);
    expect(() => cellTransferBuffers({ ...packet, cells: new Uint32Array(new SharedArrayBuffer(packet.cells.byteLength)) })).toThrow(/nonshared/);
    const empty = packCells([]);
    expect(() => cellTransferBuffers({ ...empty, metadata: empty.cells })).toThrow(/alias/);
  });

  it('rejects sparse dictionary holes instead of silently decoding a string reference as undefined', () => {
    const packet = packCells([cell({ settlementId: 'settlement.1' })]);
    packet.dictionary = new Array<string>(1);
    expect(() => unpackCells(packet)).toThrow(/dictionary/);
    expect(() => cellTransferBytes(packet)).toThrow(/dictionary/);
    expect(() => cellTransferBuffers(packet)).toThrow(/dictionary/);
  });

  it('property-roundtrips bounded shuffled, mixed-metadata payloads deterministically', () => {
    const record = fc.record({ cell: fc.integer({ min: 0, max: 349_999 }), terrain: fc.integer({ min: 0, max: 4 }), biome: fc.integer({ min: 0, max: 11 }), waterDepth: fc.integer({ min: 0, max: 2 }), fertility: fc.integer({ min: 0, max: 255 }), visible: fc.boolean() });
    fc.assert(fc.property(fc.array(fc.tuple(record, fc.integer({ min: 0, max: 15 })), { maxLength: 100 }), rows => {
      const input = rows.map(([base, mask]) => ({ ...base, ...(mask & 1 ? { featureMask: mask } : {}), ...(mask & 2 ? { settlementId: 'settlement.' + mask } : {}), ...(mask & 4 ? { factionId: null } : {}), ...(mask & 8 ? { improvementId: undefined } : {}) }));
      const packet = packCells(input);
      expect(unpackCells(structuredClone(packet, { transfer: cellTransferBuffers(packet) }))).toStrictEqual(input);
      expect(packCells(input)).toEqual(packCells(input));
    }), { seed: 20260906, numRuns: 60 });
  });
});
