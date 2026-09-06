import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildOverlays, createOverlayBriefs } from '../../../../tools/art/create-overlay-briefs';
import { decodePng } from '../png';
import { sha256 } from '../provenance';
import { paletteSchema } from '../runtime';
import { validateAsset } from '../validation';

describe('original integer-pixel overlay sources', () => {
  it('has stable exact-palette hard-alpha pixels, genuine effect motion and matching straight edges', () => {
    const overlays = buildOverlays();
    expect(overlays).toHaveLength(8);
    expect(overlays.reduce((sum, item) => sum + item.frames.length, 0)).toBe(17);
    expect(overlays.map(item => item.frames.map(frame => sha256(frame.data)))).toEqual(buildOverlays().map(item => item.frames.map(frame => sha256(frame.data))));
    for (const overlay of overlays) {
      if (overlay.frames.length > 1) expect(new Set(overlay.frames.map(frame => sha256(frame.data))).size).toBe(4);
      for (const frame of overlay.frames) {
        expect([frame.width, frame.height]).toEqual([64, 64]);
        for (let index = 3; index < frame.data.length; index += 4) expect([0, 255]).toContain(frame.data[index]);
      }
    }
    for (const id of ['terrain.road', 'terrain.river']) {
      const image = overlays.find(item => item.id === id)!.frames[0]!;
      for (let y = 0; y < 64; y++) expect(image.data.slice((y * 64 + 4) * 4, (y * 64 + 4) * 4 + 4)).toEqual(image.data.slice((y * 64 + 59) * 4, (y * 64 + 59) * 4 + 4));
    }
  });
  it('emits validated but unapproved script-backed briefs with accurate timing and no invented facings', async () => {
    const root = await mkdtemp(join(tmpdir(), 'theandril-overlays-test-'));
    try {
      for (const path of ['tools/art/create-overlay-briefs.ts', 'assets/palettes/theandril-master.json']) {
        await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), await readFile(resolve(path)));
      }
      const palette = paletteSchema.parse(JSON.parse(await readFile(join(root, 'assets/palettes/theandril-master.json'), 'utf8')));
      const manifests = await createOverlayBriefs(root);
      for (const manifest of manifests) {
        expect(manifest.status).toBe('BRIEF_READY'); expect(manifest.review).toBeNull(); expect(manifest.validation).toBeNull();
        expect(manifest.provenance.provider).toBe('theandril-integer-overlay');
        expect(manifest.provenance.sourceRefs).toEqual(['tools/art/create-overlay-briefs.ts']);
        expect(manifest.constraints.terrain).toBe('none');
        expect(new Set(manifest.frames.map(frame => frame.direction))).toEqual(new Set(['se']));
        const frames = await Promise.all(manifest.frames.map(async frame => ({ id: frame.id, image: decodePng(await readFile(join(root, frame.sourcePath))) })));
        expect(validateAsset(manifest, frames, palette).errors).toEqual([]);
      }
      expect(manifests.find(item => item.id === 'effect.melee')!.frames.map(frame => frame.durationMs)).toEqual([100, 100, 100, 100]);
      const projectile = manifests.find(item => item.id === 'effect.projectile')!;
      expect(projectile.frames.map(frame => frame.durationMs)).toEqual([100, 100, 100, 100]);
      expect(projectile.frames.map(frame => frame.pivot)).toEqual([[32, 32], [32, 32], [32, 32], [32, 32]]);
      expect(projectile.animation.states.idle!.loop).toBe(false);
      expect(manifests.find(item => item.id === 'effect.magic')!.frames.map(frame => frame.durationMs)).toEqual([125, 125, 125, 125]);
      expect(manifests.find(item => item.id === 'effect.magic')!.animation.states.idle!.loop).toBe(false);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
