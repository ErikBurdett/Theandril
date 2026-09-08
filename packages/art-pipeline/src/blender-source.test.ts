import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { importBlenderBattleSource } from './blender-source';
import { encodePng } from './png';
import { sha256 } from './provenance';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'theandril-blender-import-')); roots.push(root);
  const base = 'assets/art/source/blender-battle/effect.battle_melee/v1';
  const palette = Buffer.from(JSON.stringify({ id: 'theandril-master-v1', version: 1, colors: ['#202328', '#c1b597'] }));
  const inputs = new Map<string, Buffer>([['source.blend', Buffer.from('Synthetic test source, not Blender production evidence')], ['profile.json', Buffer.from('{}')], ['recipe.py', Buffer.from('# Synthetic importer test')]]);
  const frames = Array.from({ length: 8 }, (_, index) => {
    const data = new Uint8Array(64 * 64 * 4);
    for (let y = 28; y < 34; y++) for (let x = 25; x < 32 + index; x++) data.set([193, 181, 151, 255], (y * 64 + x) * 4);
    const png = Buffer.from(encodePng({ width: 64, height: 64, data }));
    const path = `native/frame-${index}.png`, rawPath = `raw/frame-${index}.png`;
    inputs.set(path, png); inputs.set(rawPath, png);
    return { path, rawPath, index, durationMs: 100, sha256: sha256(png) };
  });
  const manifest = { schemaVersion: 1, id: 'effect.battle_melee', version: 1, createdAt: '2026-09-07T20:00:00+00:00', blenderVersion: 'synthetic-test',
    paletteHash: sha256(palette), nativeResolution: { width: 64, height: 64 }, pivot: { x: 32, y: 32 }, durationsMs: frames.map(frame => frame.durationMs),
    clip: { state: 'attack', direction: 'se', loop: false }, frames,
    files: [...inputs].map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) })), productionNote: 'This is a synthetic importer fixture, never artwork.' };
  inputs.set('manifest.json', Buffer.from(JSON.stringify(manifest)));
  for (const [path, bytes] of [...inputs].map(([path, bytes]): [string, Buffer] => [`${base}/${path}`, bytes]).concat([['assets/palettes/theandril-master.json', palette]])) {
    await mkdir(dirname(resolve(root, path)), { recursive: true }); await writeFile(resolve(root, path), bytes);
  }
  return { root, base, manifest };
}
async function updateManifest(test: Awaited<ReturnType<typeof fixture>>) { await writeFile(resolve(test.root, test.base, 'manifest.json'), JSON.stringify(test.manifest)); }

describe('retained Blender frame import', () => {
  it('checks every supplied byte and returns an unapproved, unactivated eight-frame one-shot without writes', async () => {
    const test = await fixture(), before = await readdir(test.root, { recursive: true });
    const result = await importBlenderBattleSource(test.root, 'effect.battle_melee', 1);
    expect(result.validation.passed).toBe(true); expect(result.approval).toBe(false); expect(result.activation).toBe(false);
    expect(result.brief).toMatchObject({ status: 'BRIEF_READY', review: null, validation: null, createdAt: '2026-09-07T20:00:00.000Z', animation: { states: { attack: { frames: 8, fps: 10, loop: false } } } });
    expect(result.brief.frames.every(frame => String(frame.pivot) === '32,32')).toBe(true);
    expect(await readdir(test.root, { recursive: true })).toEqual(before);
    expect(result.inputHash).toBe(sha256(await readFile(resolve(test.root, test.base, 'manifest.json'))));
  });
  it.each(['source.blend', 'recipe.py', 'raw/frame-3.png', 'native/frame-6.png'])('refuses changed retained %s evidence', async path => {
    const test = await fixture(); await writeFile(resolve(test.root, test.base, path), 'changed input');
    await expect(importBlenderBattleSource(test.root, 'effect.battle_melee', 1)).rejects.toThrow(/hash mismatch/);
  });
  it('rejects a changed palette, wrong identity, missing editable source and shuffled frames', async () => {
    for (const change of ['palette', 'identity', 'source', 'order']) {
      const test = await fixture();
      if (change === 'palette') test.manifest.paletteHash = '0'.repeat(64);
      if (change === 'identity') test.manifest.id = 'effect.battle_ward';
      if (change === 'source') test.manifest.files = test.manifest.files.filter(file => file.path !== 'source.blend');
      if (change === 'order') test.manifest.frames.reverse();
      await updateManifest(test);
      await expect(importBlenderBattleSource(test.root, 'effect.battle_melee', 1)).rejects.toThrow(/mismatch|identity|Missing|disagree/);
    }
  });
  it('refuses path traversal and symlinked retained evidence', async () => {
    const test = await fixture(); test.manifest.files[0]!.path = '../outside'; await updateManifest(test);
    await expect(importBlenderBattleSource(test.root, 'effect.battle_melee', 1)).rejects.toThrow();
    const linked = await fixture(), path = resolve(linked.root, linked.base, 'recipe.py');
    await rm(path); await symlink(resolve(linked.root, 'assets/palettes/theandril-master.json'), path);
    await expect(importBlenderBattleSource(linked.root, 'effect.battle_melee', 1)).rejects.toThrow(/Symlink/);
  });
});
