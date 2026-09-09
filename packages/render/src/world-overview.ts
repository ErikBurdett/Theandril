import { isLake, riverSize } from '@theandril/mapgen';
import type { MapObservation } from '@theandril/sim';

const COLORS = [0x25404b, 0x747658, 0x3f5a49, 0x496668, 0x8d9993, 0xa28b62, 0x8b8760, 0x526e66, 0x345d45, 0x92958e, 0x786b60, 0xb8b8a0];
export type WorldOverviewMode = 'terrain' | 'political';
export interface WorldOverviewOptions { mode?: WorldOverviewMode; factions?: readonly Pick<MapObservation['factions'][number], 'id' | 'color'>[]; factionIds?: readonly string[] }

/** A bounded cartographic LOD, not an atlas or a new source of game knowledge.
 * Four pixels per supplied hex; no cells outside the permitted map are sampled.
 * Rebuilt only after map publication while overview is open, never on pan/hover.
 */
export function worldOverviewPixels(width: number, height: number, cells: Iterable<MapObservation['cells'][number]>, options: WorldOverviewOptions = {}) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width * height > 350_000) throw new Error('Invalid overview dimensions.');
  const pixelWidth = width * 2 + 1, pixelHeight = height * 2;
  const pixels = new Uint8ClampedArray(pixelWidth * pixelHeight * 4);
  const factions = new Map(options.factions?.map(faction => [faction.id, faction.color]));
  const selected = options.factionIds === undefined ? undefined : new Set(options.factionIds);
  for (let index = 0; index < pixels.length; index += 4) { pixels[index] = 26; pixels[index + 1] = 37; pixels[index + 2] = 42; pixels[index + 3] = 255; }
  for (const cell of cells) {
    if (!Number.isSafeInteger(cell.cell) || cell.cell < 0 || cell.cell >= width * height) throw new Error('Invalid overview cell.');
    const row = Math.floor(cell.cell / width), x = cell.cell % width * 2 + (row & 1), y = row * 2;
    const terrainColor = isLake(cell.hydrology ?? 0) ? 0x59969d : cell.terrain === 0 ? cell.waterDepth === 2 ? 0x1a303e : 0x3a6266 : COLORS[cell.biome] ?? COLORS[1]!;
    const factionColor = cell.factionId && (!selected || selected.has(cell.factionId)) ? factions.get(cell.factionId) : undefined;
    const political = options.mode === 'political';
    const color = political ? factionColor ?? (cell.terrain === 0 ? 0x223b48 : 0x394744) : terrainColor;
    const alpha = cell.visible ? 1 : .4;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const offset = ((y + dy) * pixelWidth + x + dx) * 4;
      const value = !political && riverSize(cell.hydrology ?? 0) && dx === 1 ? 0x9bc8ca : color;
      pixels[offset] = (value >> 16 & 255) * alpha; pixels[offset + 1] = (value >> 8 & 255) * alpha; pixels[offset + 2] = (value & 255) * alpha;
    }
  }
  return { width: pixelWidth, height: pixelHeight, pixels };
}
