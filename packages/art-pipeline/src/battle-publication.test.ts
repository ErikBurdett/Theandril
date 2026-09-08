import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { BLENDER_BATTLE_IDS, importBlenderBattleSource } from './blender-source';
import { parseAssetManifest } from './schema';
import { parseRuntimeCatalog } from './runtime';
import { cropImage, decodePng } from './png';
import { safeAssetPath, sha256 } from './provenance';
import { validateAsset } from './validation';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = async (path: string) => readFile(await safeAssetPath(root, path));

test.each(BLENDER_BATTLE_IDS)('published %s retains real Blender, processing, review and exact runtime frame evidence', async id => {
  const version = id === 'effect.battle_melee' ? 3 : id === 'character.waykeeper' ? 2 : 1;
  const source = await importBlenderBattleSource(root, id, version);
  const approved = parseAssetManifest(JSON.parse((await read(`assets/art/approved/${id}.json`)).toString()));
  expect(approved.referenceHashes).toContain(source.inputHash);
  expect(approved.provenance.provider).toBe('blender-art-factory');
  expect(approved.processing?.filter(step => step.tool === 'spritefusion-pixel-snapper')).toHaveLength(8);
  expect(approved.processing?.some(step => step.tool === 'aseprite')).toBe(true);
  const catalog = parseRuntimeCatalog(JSON.parse((await read('assets/art/runtime/catalog.json')).toString()));
  const asset = catalog.assets.find(item => item.id === id)!;
  expect(asset).toMatchObject({ atlasId: 'battle', pivot: id === 'character.waykeeper' ? [32, 56] : [32, 32] });
  const page = catalog.atlases.find(item => item.id === 'battle')!;
  const png = await read('assets/art/runtime/battle.png');
  expect(sha256(png)).toBe(page.sha256);
  expect((await read('apps/web/public/art/battle.png')).equals(png)).toBe(true);
  const atlas = decodePng(png);
  const frames = await Promise.all(approved.frames.map(async frame => ({ id: frame.id, image: decodePng(await read(frame.sourcePath)) })));
  const report = validateAsset(approved, frames, catalog.palette);
  expect(report.passed).toBe(true); expect(approved.review!.inputHash).toBe(report.inputHash);
  for (const frame of asset.frames) expect(sha256(cropImage(atlas, frame.frame).data)).toBe(sha256(frames.find(item => item.id === frame.id)!.image.data));
  const state = Object.keys(source.brief.animation.states)[0]!;
  expect(asset.clips).toEqual([expect.objectContaining({ state, direction: 'se', loop: false, durationsMs: Array(8).fill(100) })]);
  const directory = dirname(approved.frames[0]!.sourcePath);
  expect((await read(`${directory}/editable.aseprite`)).length).toBeGreaterThan(128);
  const exported = JSON.parse((await read(`${directory}/aseprite/sprite.json`)).toString()) as { frames: { frame: { x: number; y: number; w: number; h: number }; duration: number }[]; meta: { frameTags: unknown[] } };
  expect(exported.meta.frameTags).toEqual([expect.objectContaining({ name: state, from: 0, to: 7, direction: 'forward' })]);
  const sheet = decodePng(await read(`${directory}/aseprite/sprite.png`));
  for (const [index, frame] of exported.frames.entries()) { expect(frame.duration).toBe(100); expect(sha256(cropImage(sheet, frame.frame).data)).toBe(sha256(frames[index]!.image.data)); }
});
