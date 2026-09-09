import type { Graphics } from 'pixi.js';
import type { HearthDistrict } from './hearth-appearance';

// Original code-native architectural pieces. Geometry is integer-aligned in
// world space and cached with its tile; these are not raster art approvals.
const INK = 0x242824, STONE = 0x97927e, LIGHT = 0xc1b597, WOOD = 0x655440, ROOF = 0x84533f;
function house(g: Graphics, x: number, y: number, w: number, h: number, roof = ROOF) {
  g.rect(x - w / 2, y - h, w, h).fill(STONE).stroke({ color: INK, width: 1 });
  g.rect(x + 1, y - h + 1, w / 2 - 1, h - 1).fill(0x6d7268);
  g.poly([x - w / 2 - 2, y - h, x, y - h - 6, x + w / 2 + 2, y - h, x, y - h + 3]).fill(roof).stroke({ color: INK, width: 1 });
  g.moveTo(x - w / 2, y - h).lineTo(x, y - h - 5).lineTo(x + w / 2, y - h).stroke({ color: LIGHT, width: 1, alpha: .7 });
  g.rect(x - 3, y - 5, 3, 5).fill(INK); g.rect(x + 3, y - h + 3, 2, 2).fill(0xd3b477);
}

export function drawHearthGround(g: Graphics, district: HearthDistrict, x: number, y: number) {
  if (district.kind === 'worked' || district.kind === 'cultivation') {
    g.poly([x - 19, y - 4, x + 7, y - 14, x + 20, y + 5, x - 6, y + 15]).fill({ color: 0x62533a, alpha: .8 });
    for (let row = -6; row <= 9; row += 5) g.moveTo(x - 12, y + row + 3).lineTo(x + 12, y + row - 5).stroke({ color: 0xb3a06b, width: 2, alpha: .6 });
    return;
  }
  g.regularPoly(x, y, 29, 6).fill({ color: district.kind === 'construction' ? 0x79674d : 0x68654d, alpha: .52 });
  g.poly([x - 17, y - 3, x - 10, y - 15, x + 7, y - 17, x + 19, y - 4, x + 16, y + 13, x - 5, y + 18, x - 18, y + 8]).fill({ color: 0x8c8061, alpha: .34 });
  if (district.worked) for (const dy of [16, 20]) g.moveTo(x - 9, y + dy).lineTo(x + 9, y + dy - 3).stroke({ color: 0xb3a06b, width: 1, alpha: .7 });
  // Broad cobble clusters leave quiet negative space around the architecture.
  for (const [dx, dy] of [[-17, 8], [-12, 18], [9, 17], [17, 7], [-16, -10], [12, -15]]) {
    g.rect(x + dx!, y + dy!, 3, 1).fill({ color: LIGHT, alpha: .17 });
    g.rect(x + dx! + 4, y + dy! + 2, 2, 1).fill({ color: INK, alpha: .2 });
  }
}

export function drawHearthBuilding(g: Graphics, district: HearthDistrict, x: number, y: number) {
  const kind = district.kind;
  if (kind === 'hearth' || kind === 'housing' || kind === 'worked') return;
  if (kind === 'construction' || kind === 'cultivation') {
    g.poly([x - 13, y + 6, x - 13, y - 9, x + 11, y - 9, x + 11, y + 6]).stroke({ color: WOOD, width: 3 });
    for (const dx of [-12, 0, 12]) g.moveTo(x + dx, y + 10).lineTo(x + dx, y - 16).stroke({ color: LIGHT, width: 2 });
    for (const dy of [-12, -3, 6]) g.moveTo(x - 16, y + dy).lineTo(x + 16, y + dy).stroke({ color: WOOD, width: 2 });
    g.moveTo(x - 12, y + 5).lineTo(x + 12, y - 12).stroke({ color: LIGHT, width: 1 });
    g.rect(x - 16, y + 11, 10, 3).rect(x - 14, y + 8, 7, 3).fill(STONE);
    g.rect(x + 5, y + 10, 12, 3).fill(WOOD);
    if (district.progress !== undefined) {
      g.rect(x - 13, y + 18, 26, 3).fill(INK);
      g.rect(x - 12, y + 19, Math.max(1, Math.round(24 * district.progress)), 1).fill(0xe0bc73);
    }
  } else if (kind === 'granary') {
    house(g, x - 4, y + 7, 18, 13, 0xa38b55);
    for (const dx of [8, 13]) g.roundRect(x + dx - 2, y + 4, 5, 7, 2).fill(0xb5a070).stroke({ color: INK, width: 1 });
  } else if (kind === 'workshop') {
    house(g, x, y + 9, 22, 14, 0x655c53);
    g.rect(x + 5, y - 20, 6, 14).fill(0x555c57).stroke({ color: INK, width: 1 });
    g.rect(x + 4, y - 20, 8, 3).fill(STONE);
    g.rect(x + 3, y + 1, 5, 5).fill(0xc77845); g.rect(x + 4, y + 3, 3, 3).fill(0xe1b976);
    g.rect(x - 16, y + 10, 8, 3).fill(WOOD);
  } else if (kind === 'market') {
    for (const dx of [-10, 9]) {
      g.rect(x + dx - 7, y + 1, 14, 9).fill(WOOD).stroke({ color: INK, width: 1 });
      g.poly([x + dx - 8, y, x + dx - 5, y - 9, x + dx + 6, y - 9, x + dx + 8, y]).fill(0xa38b55).stroke({ color: INK, width: 1 });
      for (const stripe of [-4, 2]) g.rect(x + dx + stripe, y - 7, 3, 7).fill(LIGHT);
      g.rect(x + dx - 6, y + 2, 12, 2).fill(0xb09d70);
    }
  } else if (kind === 'archive') {
    house(g, x, y + 10, 24, 15, 0x536368);
    g.rect(x - 3, y - 20, 6, 14).fill(STONE).stroke({ color: INK, width: 1 });
    g.poly([x - 6, y - 20, x, y - 26, x + 6, y - 20]).fill(0x536368).stroke({ color: INK, width: 1 });
    g.rect(x - 1, y - 17, 2, 4).fill(0xe1bd7b);
    for (const dx of [-8, 6]) g.rect(x + dx, y, 2, 6).fill(LIGHT);
  } else if (kind === 'harbor') {
    house(g, x - 4, y + 5, 16, 10, 0x536368);
    for (const dy of [8, 11, 14]) g.rect(x - 16, y + dy, 34, 2).fill(WOOD);
    for (const dx of [-15, 14]) g.rect(x + dx, y + 4, 2, 14).fill(LIGHT);
    g.moveTo(x + 11, y + 6).lineTo(x + 11, y - 16).lineTo(x - 3, y - 16).lineTo(x - 3, y - 5).stroke({ color: WOOD, width: 2 });
    g.moveTo(x + 11, y - 5).lineTo(x + 1, y - 16).stroke({ color: LIGHT, width: 1 });
  }
}
