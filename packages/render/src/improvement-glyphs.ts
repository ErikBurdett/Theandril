/** Original code-native identifiers, not approved scene art or faction abilities. */
export const PROCEDURAL_IMPROVEMENT_GLYPHS = Object.freeze({
  'improvement.spring_garden': 'spring-garden',
  'improvement.polder': 'polder',
  'improvement.grove_archive': 'grove-archive',
  'improvement.oreworks': 'oreworks',
  'improvement.tide_observatory': 'tide-observatory',
} as const);

type Rectangle = readonly [x: number, y: number, width: number, height: number];
type Glyph = Readonly<{ ink: readonly Rectangle[]; accent: readonly Rectangle[] }>;
export interface GlyphPainter {
  rect(x: number, y: number, width: number, height: number): GlyphPainter;
  fill(style: { color: number; alpha: number }): GlyphPainter;
}

/** Local integer geometry stays inside the existing 22×22 dark identifier backing. */
const programs: Readonly<Record<string, Glyph>> = {
  'spring-garden': {
    // Spring basin beside a growing stem; not another generic row-of-fields mark.
    ink: [[-9, 2, 8, 2], [-8, 4, 6, 2], [-6, -4, 2, 6], [-8, -6, 6, 2],
      [4, -4, 2, 10], [1, -2, 3, 2], [6, -5, 3, 2], [-9, 8, 18, 2]],
    accent: [[-8, 0, 6, 2], [-6, -2, 2, 2], [0, -4, 3, 2], [7, -7, 2, 2]],
  },
  polder: {
    // Enclosing dike, two field beds and a separate vertical sluice channel.
    ink: [[-9, -8, 18, 2], [-9, -6, 2, 16], [7, -6, 2, 10], [-9, 8, 12, 2],
      [-5, -3, 8, 2], [-5, 1, 8, 2], [3, 4, 6, 2], [3, 8, 6, 2]],
    accent: [[4, -5, 2, 8], [-5, 5, 6, 2], [5, 6, 2, 2]],
  },
  'grove-archive': {
    // Branched tree beside an open, divided record tablet.
    ink: [[-6, -8, 2, 14], [-9, -5, 3, 2], [-4, -7, 4, 2], [-8, 6, 6, 2],
      [0, 0, 9, 2], [0, 2, 2, 8], [7, 2, 2, 8], [0, 8, 9, 2], [4, 2, 1, 6]],
    accent: [[-9, -8, 3, 2], [-4, -9, 4, 2], [2, 3, 2, 2], [5, 3, 2, 2]],
  },
  oreworks: {
    // Braced crane, hanging hook and three discrete seam blocks.
    ink: [[-8, -8, 2, 16], [-8, -8, 17, 2], [-6, -4, 2, 2], [-4, -6, 2, 2],
      [7, -6, 2, 6], [5, -1, 4, 2], [-9, 8, 18, 2]],
    accent: [[-4, 5, 4, 3], [1, 3, 4, 3], [5, 6, 4, 2]],
  },
  'tide-observatory': {
    // Measuring dial on a fixed pier, with water marks instead of a fish silhouette.
    ink: [[-4, -9, 8, 2], [-6, -7, 2, 6], [4, -7, 2, 6], [-4, -1, 8, 2],
      [-1, -5, 2, 3], [-1, 1, 2, 5], [-9, 6, 18, 2], [-7, 8, 2, 2], [5, 8, 2, 2]],
    accent: [[0, -5, 4, 2], [-9, 2, 5, 2], [4, 3, 5, 2]],
  },
};

/**
 * Append at most 13 rectangles and two fills to an existing dirty chunk's Graphics.
 * The caller supplies observed fog alpha and its existing backing. No scene nodes,
 * textures, hit areas, canonical queries, timers or per-frame registrations are made.
 * Unknown IDs draw nothing; callers must retain their explicit missing-art handling.
 */
export function drawImprovementGlyph(painter: GlyphPainter, name: string, x: number, y: number, alpha: number): boolean {
  if (!Object.hasOwn(programs, name)) return false;
  const glyph = programs[name]!;
  for (const [dx, dy, width, height] of glyph.ink) painter.rect(x + dx, y + dy, width, height);
  painter.fill({ color: 0xdbce95, alpha });
  for (const [dx, dy, width, height] of glyph.accent) painter.rect(x + dx, y + dy, width, height);
  painter.fill({ color: 0x98b0a6, alpha });
  return true;
}
