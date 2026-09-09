import { resourceByCode, resourceById } from '@theandril/content';
import type { Observation } from '@theandril/sim';

export type ObservedCell = Observation['cells'][number];
export interface PackedCells {
  version: 1 | 2 | 3;
  count: number;
  cells: Uint32Array;
  /** V1: five bytes/row; v2 appends hydrology/roads; v3 appends resource code. */
  scalars: Uint8Array;
  /** Sorted sparse records: row, feature mask, settlement/faction/improvement refs. */
  metadata: Uint32Array;
  dictionary: string[];
}

const MAX_CELLS = 350_000, STRIDE = 5;
// Resource code 0 means absent and 255 preserves an explicitly undefined field.
const RESOURCE_UNDEFINED = 255;
const VISIBLE = 1, METADATA = 2, FEATURE = 4, FEATURE_UNDEFINED = 8;
const HYDROLOGY = 16, HYDROLOGY_UNDEFINED = 32, ROAD = 64, ROAD_UNDEFINED = 128;
const geography = ['hydrology', 'roadMask'] as const;
const references = ['settlementId', 'factionId', 'improvementId'] as const;
const fields = new Set(['cell', 'terrain', 'biome', 'waterDepth', 'fertility', 'visible', 'featureMask', 'resourceId', ...references, ...geography]);
const packetFields = new Set(['version', 'count', 'cells', 'scalars', 'metadata', 'dictionary']);
const owns = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);
function requirePacket(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Invalid cell transfer: ' + message);
}
function integer(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximum && !Object.is(value, -0);
}
function validString(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 100; }
function optionalRow(cell: ObservedCell): boolean { return owns(cell, 'featureMask') || references.some(key => owns(cell, key)); }

/** Pack only the already-filtered rows supplied by the caller, never canonical buffers. */
export function packCells(input: readonly ObservedCell[]): PackedCells {
  requirePacket(Array.isArray(input) && input.length <= MAX_CELLS, 'too many or invalid input rows');
  let optionalCount = 0;
  let hasGeography = false;
  let hasResources = false;
  // Validate before typed-array coercion can truncate, wrap or silently lose fields.
  for (const cell of input) {
    requirePacket(cell && typeof cell === 'object' && !Array.isArray(cell), 'invalid input row');
    requirePacket(Object.keys(cell).every(key => fields.has(key)), 'unknown input field');
    requirePacket(integer(cell.cell, MAX_CELLS - 1), 'cell id is out of range');
    requirePacket(integer(cell.terrain, 4) && integer(cell.biome, 11) && integer(cell.waterDepth, 2) && integer(cell.fertility, 255), 'scalar is out of range');
    requirePacket(typeof cell.visible === 'boolean', 'visibility must be boolean');
    if (owns(cell, 'featureMask')) requirePacket(cell.featureMask === undefined || integer(cell.featureMask, 0xffff_ffff), 'feature mask is out of range');
    for (const key of geography) if (owns(cell, key)) {
      requirePacket(cell[key] === undefined || integer(cell[key], 63), 'geography mask is out of range');
      hasGeography = true;
    }
    if (owns(cell, 'resourceId')) {
      const code = cell.resourceId === undefined ? RESOURCE_UNDEFINED : resourceById.get(cell.resourceId)?.code;
      requirePacket(code !== undefined && (cell.resourceId === undefined || code > 0 && code < RESOURCE_UNDEFINED), 'invalid resource reference');
      hasResources = true;
    }
    for (const key of references) if (owns(cell, key)) requirePacket(cell[key] === null || cell[key] === undefined || validString(cell[key]), 'invalid optional reference');
    if (optionalRow(cell)) optionalCount++;
  }
  const scalarStride = hasResources ? 8 : hasGeography ? 7 : STRIDE;
  const packed: PackedCells = { version: hasResources ? 3 : hasGeography ? 2 : 1, count: input.length, cells: new Uint32Array(input.length), scalars: new Uint8Array(input.length * scalarStride), metadata: new Uint32Array(optionalCount * STRIDE), dictionary: [] };
  const dictionary = new Map<string, number>();
  const reference = (cell: ObservedCell, key: typeof references[number]): number => {
    if (!owns(cell, key)) return 0;
    const value = cell[key];
    if (value === null) return 1;
    if (value === undefined) return 2;
    let index = dictionary.get(value);
    if (index === undefined) { index = packed.dictionary.length; dictionary.set(value, index); packed.dictionary.push(value); }
    return index + 3;
  };
  let metadataOffset = 0;
  for (let row = 0; row < input.length; row++) {
    const cell = input[row]!, offset = row * scalarStride;
    packed.cells[row] = cell.cell;
    packed.scalars[offset] = cell.terrain; packed.scalars[offset + 1] = cell.biome;
    packed.scalars[offset + 2] = cell.waterDepth; packed.scalars[offset + 3] = cell.fertility;
    let flags = cell.visible ? VISIBLE : 0;
    if (owns(cell, 'hydrology')) flags |= HYDROLOGY | (cell.hydrology === undefined ? HYDROLOGY_UNDEFINED : 0);
    if (owns(cell, 'roadMask')) flags |= ROAD | (cell.roadMask === undefined ? ROAD_UNDEFINED : 0);
    if (hasGeography || hasResources) { packed.scalars[offset + 5] = cell.hydrology ?? 0; packed.scalars[offset + 6] = cell.roadMask ?? 0; }
    if (hasResources) packed.scalars[offset + 7] = owns(cell, 'resourceId') ? cell.resourceId === undefined ? RESOURCE_UNDEFINED : resourceById.get(cell.resourceId)!.code : 0;
    if (optionalRow(cell)) {
      flags |= METADATA;
      if (owns(cell, 'featureMask')) flags |= FEATURE | (cell.featureMask === undefined ? FEATURE_UNDEFINED : 0);
      packed.metadata[metadataOffset] = row; packed.metadata[metadataOffset + 1] = cell.featureMask ?? 0;
      for (let index = 0; index < references.length; index++) packed.metadata[metadataOffset + 2 + index] = reference(cell, references[index]!);
      metadataOffset += STRIDE;
    }
    packed.scalars[offset + 4] = flags;
  }
  return packed;
}

/** Shape checks are also used for transfer accounting, without rescanning every row. */
function packetShape(input: unknown): PackedCells {
  requirePacket(input && typeof input === 'object' && !Array.isArray(input), 'packet must be an object');
  requirePacket(Object.keys(input).length === packetFields.size && Object.keys(input).every(key => packetFields.has(key)), 'unknown or missing packet field');
  const packet = input as PackedCells;
  requirePacket((packet.version === 1 || packet.version === 2 || packet.version === 3) && integer(packet.count, MAX_CELLS), 'unsupported version or count');
  requirePacket(packet.cells instanceof Uint32Array && packet.scalars instanceof Uint8Array && packet.metadata instanceof Uint32Array, 'incorrect typed-array kinds');
  requirePacket(packet.cells.length === packet.count && packet.scalars.length === packet.count * (packet.version === 3 ? 8 : packet.version === 2 ? 7 : STRIDE) && packet.metadata.length % STRIDE === 0 && packet.metadata.length <= packet.count * STRIDE, 'array lengths disagree');
  const arrays = [packet.cells, packet.scalars, packet.metadata];
  requirePacket(arrays.every(array => array.buffer instanceof ArrayBuffer && array.byteOffset === 0 && array.byteLength === array.buffer.byteLength), 'buffers must be dedicated, nonshared whole allocations');
  requirePacket(new Set(arrays.map(array => array.buffer)).size === arrays.length, 'buffers must not alias');
  requirePacket(Array.isArray(packet.dictionary) && packet.dictionary.length <= packet.metadata.length / STRIDE * references.length, 'invalid dictionary');
  // Array.every skips holes; every declared slot must contain an actual string.
  for (const entry of packet.dictionary) requirePacket(validString(entry), 'invalid dictionary entry');
  requirePacket(new Set(packet.dictionary).size === packet.dictionary.length, 'duplicate dictionary entry');
  return packet;
}

function validateRows(packet: PackedCells): void {
  let metadataOffset = 0;
  const scalarStride = packet.version === 3 ? 8 : packet.version === 2 ? 7 : STRIDE;
  for (let row = 0; row < packet.count; row++) {
    const offset = row * scalarStride, flags = packet.scalars[offset + 4]!;
    requirePacket(packet.cells[row]! < MAX_CELLS, 'cell id is out of range');
    requirePacket(packet.scalars[offset]! <= 4 && packet.scalars[offset + 1]! <= 11 && packet.scalars[offset + 2]! <= 2, 'scalar is out of range');
    requirePacket((packet.version >= 2 || flags <= 15) && (!(flags & FEATURE_UNDEFINED) || Boolean(flags & FEATURE)) && (!(flags & FEATURE) || Boolean(flags & METADATA)), 'invalid presence flags');
    if (packet.version >= 2) {
      for (const [presence, undef, value] of [[HYDROLOGY, HYDROLOGY_UNDEFINED, packet.scalars[offset + 5]!], [ROAD, ROAD_UNDEFINED, packet.scalars[offset + 6]!]]) {
        requirePacket(value! <= 63 && (!(flags & undef!) || Boolean(flags & presence!)), 'invalid geography presence or mask');
        requirePacket(Boolean(flags & presence!) && !(flags & undef!) || value === 0, 'absent geography has a payload');
      }
    }
    if (packet.version === 3) {
      const code = packet.scalars[offset + 7]!;
      requirePacket(code === 0 || code === RESOURCE_UNDEFINED || resourceByCode.has(code), 'invalid resource code');
    }
    if (!(flags & METADATA)) continue;
    requirePacket(metadataOffset < packet.metadata.length && packet.metadata[metadataOffset] === row, 'missing, duplicate or unordered metadata row');
    const feature = packet.metadata[metadataOffset + 1]!;
    requirePacket((flags & FEATURE) && !(flags & FEATURE_UNDEFINED) || feature === 0, 'absent feature has a payload');
    let present = Boolean(flags & FEATURE);
    for (let index = 0; index < references.length; index++) {
      const reference = packet.metadata[metadataOffset + 2 + index]!;
      requirePacket(reference < packet.dictionary.length + 3, 'reference is outside the dictionary');
      present ||= reference !== 0;
    }
    requirePacket(present, 'empty sparse metadata row');
    metadataOffset += STRIDE;
  }
  requirePacket(metadataOffset === packet.metadata.length, 'unreferenced metadata rows');
}

/** Validate the entire packet before allocating reconstructed observed-cell objects. */
export function unpackCells(input: unknown): ObservedCell[] {
  const packet = packetShape(input); validateRows(packet);
  const result: ObservedCell[] = new Array(packet.count);
  let metadataOffset = 0;
  const scalarStride = packet.version === 3 ? 8 : packet.version === 2 ? 7 : STRIDE;
  for (let row = 0; row < packet.count; row++) {
    const offset = row * scalarStride, flags = packet.scalars[offset + 4]!;
    const cell: ObservedCell = { cell: packet.cells[row]!, terrain: packet.scalars[offset]!, biome: packet.scalars[offset + 1]!, waterDepth: packet.scalars[offset + 2]!, fertility: packet.scalars[offset + 3]!, visible: Boolean(flags & VISIBLE) };
    if (flags & HYDROLOGY) cell.hydrology = flags & HYDROLOGY_UNDEFINED ? undefined : packet.scalars[offset + 5]!;
    if (flags & ROAD) cell.roadMask = flags & ROAD_UNDEFINED ? undefined : packet.scalars[offset + 6]!;
    if (packet.version === 3) {
      const code = packet.scalars[offset + 7]!;
      if (code) cell.resourceId = code === RESOURCE_UNDEFINED ? undefined : resourceByCode.get(code)!.id;
    }
    if (flags & METADATA) {
      if (flags & FEATURE) cell.featureMask = flags & FEATURE_UNDEFINED ? undefined : packet.metadata[metadataOffset + 1]!;
      for (let index = 0; index < references.length; index++) {
        const reference = packet.metadata[metadataOffset + 2 + index]!;
        if (reference) cell[references[index]!] = reference === 1 ? null : reference === 2 ? undefined : packet.dictionary[reference - 3]!;
      }
      metadataOffset += STRIDE;
    }
    result[row] = cell;
  }
  return result;
}

/** Logical bytes: actual binary lengths plus UTF-8 metadata/dictionary JSON.
 * Excludes implementation-specific structured-clone framing and decoded heap use.
 */
export function cellTransferBytes(input: PackedCells): number {
  const packet = packetShape(input);
  return packet.cells.byteLength + packet.scalars.byteLength + packet.metadata.byteLength
    + new TextEncoder().encode(JSON.stringify({ version: packet.version, count: packet.count, dictionary: packet.dictionary })).byteLength;
}

/** Only freshly owned packet allocations are eligible; transfer detaches the packet. */
export function cellTransferBuffers(input: PackedCells): ArrayBuffer[] {
  const packet = packetShape(input);
  return [packet.cells.buffer, packet.scalars.buffer, packet.metadata.buffer] as ArrayBuffer[];
}
