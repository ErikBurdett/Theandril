import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importBlenderUnitSource, validateFootArticulation, validateMountedArticulation, validateNavalArticulation } from './blender-unit-source';
import { sourceClips } from './source-clip';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const relative = 'assets/art/source/blender-units/battle.unit.guard/v4';
let temporary: string;
let imported: Awaited<ReturnType<typeof importBlenderUnitSource>>;
let frames: Parameters<typeof validateFootArticulation>[0];
beforeAll(async () => {
  imported = await importBlenderUnitSource(root, 'battle.unit.guard', 4);
  frames = (JSON.parse(await readFile(join(root, relative, 'manifest.json'), 'utf8')) as { frames: typeof frames }).frames;
  temporary = await mkdtemp(join(tmpdir(), 'theandril-guard-source-'));
  await mkdir(join(temporary, dirname(relative)), { recursive: true });
  await cp(join(root, relative), join(temporary, relative), { recursive: true });
  await mkdir(join(temporary, 'assets/palettes'), { recursive: true });
  await cp(join(root, 'assets/palettes/theandril-master.json'), join(temporary, 'assets/palettes/theandril-master.json'));
});
afterAll(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });

describe('real retained Blender guard source', () => {
  it('imports64 actual frames and all ten authored facing clips without approving or activating the asset', () => {
    expect(imported.validation.passed).toBe(true); expect(imported.approval).toBe(false); expect(imported.activation).toBe(false);
    expect(imported.brief.frames).toHaveLength(64);
    const clips = sourceClips(imported.brief);
    expect(clips).toHaveLength(10);
    expect(new Set(clips.map(clip => clip.name))).toEqual(new Set(['idle.e', 'walk.e', 'attack.e', 'hit.e', 'death.e', 'idle.w', 'walk.w', 'attack.w', 'hit.w', 'death.w']));
    expect(() => validateFootArticulation(frames)).not.toThrow();
  });
  it.each(['source.blend', 'render-settings.json'])('rejects a modified retained %s by its original inventory hash', async filename => {
    const path = join(temporary, relative, filename), original = await readFile(path), changed = Buffer.from(original);
    changed[changed.length - 1] = changed[changed.length - 1]! ^ 1;
    try { await writeFile(path, changed); await expect(importBlenderUnitSource(temporary, 'battle.unit.guard', 4)).rejects.toThrow(`source hash mismatch: ${filename}`); }
    finally { await writeFile(path, original); }
  });
  it('rejects a translated still skeleton even when its root remains fixed at the declared origin', () => {
    const translated = structuredClone(frames);
    for (const direction of ['e', 'w']) {
      const first = translated.find(frame => frame.state === 'walk' && frame.direction === direction)!;
      const bones = structuredClone(first.bones);
      for (const frame of translated.filter(frame => frame.state === 'walk' && frame.direction === direction)) {
        frame.bones = structuredClone(bones);
        for (const [name, bone] of Object.entries(frame.bones)) if (name !== 'root') for (const end of ['head', 'tail'] as const) bone[end][0] += frame.index * .2;
      }
    }
    expect(() => validateFootArticulation(translated)).toThrow('independent limb motion');
  });
  it('rejects missing limbs and an uncollapsed death action', () => {
    const missing = structuredClone(frames); delete missing.find(frame => frame.state === 'walk')!.bones['foot.L'];
    expect(() => validateFootArticulation(missing)).toThrow('Missing articulated bone');
    const standing = structuredClone(frames);
    for (const direction of ['e', 'w']) {
      const death = standing.filter(frame => frame.state === 'death' && frame.direction === direction), height = death[0]!.bones.head!.tail[2];
      for (const frame of death) frame.bones.head!.tail[2] = height;
    }
    expect(() => validateFootArticulation(standing)).toThrow('grounded collapse');
  });
  it('refuses missing, interleaved and mistimed clips instead of synthesizing authored poses', () => {
    const absent = structuredClone(imported.brief); absent.frames.pop();
    const interleaved = structuredClone(imported.brief); [interleaved.frames[0], interleaved.frames[4]] = [interleaved.frames[4]!, interleaved.frames[0]!];
    const timing = structuredClone(imported.brief); timing.frames[0]!.durationMs++;
    for (const invalid of [absent, interleaved, timing]) expect(() => sourceClips(invalid)).toThrow(/Source clip/);
  });
});


describe('real retained mounted and naval rigs', () => {
  it.each([['cavalry', 1], ['lancer', 1], ['transport', 2], ['coastal_warship', 3], ['ocean_warship', 2]] as const)('validates actual %s motion and rejects translated still rigs', async (role, version) => {
    const source = await importBlenderUnitSource(root, `battle.unit.${role}`, version);
    expect(source.validation.passed).toBe(true); expect(source.approval).toBe(false);
    const actual = (JSON.parse(await readFile(join(root, `assets/art/source/blender-units/battle.unit.${role}/v${version}/manifest.json`), 'utf8')) as { frames: typeof frames }).frames;
    const naval = ['transport', 'coastal_warship', 'ocean_warship'].includes(role), validate = naval ? validateNavalArticulation : validateMountedArticulation;
    const translated = structuredClone(actual), state = naval ? 'sail' : 'walk';
    for (const direction of ['e', 'w']) {
      const first = actual.find(frame => frame.state === state && frame.direction === direction)!;
      for (const frame of translated.filter(frame => frame.state === state && frame.direction === direction)) {
        frame.bones = structuredClone(first.bones);
        for (const [name, bone] of Object.entries(frame.bones)) if (name !== 'root') for (const end of ['head', 'tail'] as const) bone[end][0] += frame.index * .2;
      }
    }
    expect(() => validate(translated)).toThrow(naval ? 'independent oar motion' : 'independent hoof motion');
    const frozen = structuredClone(actual), finalState = naval ? 'sink' : 'death';
    for (const direction of ['e', 'w']) {
      const first = actual.find(frame => frame.state === finalState && frame.direction === direction)!;
      for (const frame of frozen.filter(frame => frame.state === finalState && frame.direction === direction)) frame.bones = structuredClone(first.bones);
    }
    expect(() => validate(frozen)).toThrow(naval ? 'lowering and tilting hull' : 'horse and rider collapse');
    if (naval) {
      for (const [state, names, message] of [['sail', ['sail.upper', 'sail.lower'], 'sail shape'], ['fire', ['weapon.L', 'weapon.R'], 'weapon flex']] as const) {
        const rigid = structuredClone(actual);
        for (const direction of ['e', 'w']) {
          const first = actual.find(frame => frame.state === state && frame.direction === direction)!;
          const anchor = state === 'sail' ? 'mast' : 'weapon';
          for (const frame of rigid.filter(frame => frame.state === state && frame.direction === direction)) for (const name of names) {
            frame.bones[name] = structuredClone(first.bones[name]!);
            for (const end of ['head', 'tail'] as const) for (let axis = 0; axis < 3; axis++)
              frame.bones[name]![end][axis] = first.bones[name]![end][axis]! - first.bones[anchor]!.head[axis]! + frame.bones[anchor]!.head[axis]!;
          }
        }
        expect(() => validate(rigid)).toThrow(message);
      }
    }
  });
});
