import { mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { animationRecipeSchema, animationSourceIndexSchema, prepareAnimationSource, scoutIdleRecipe, type AnimationRecipe } from './animation-source';
import { decodePng, encodePng, type RgbaImage } from './png';
import { sha256 } from './provenance';
import { type Palette } from './runtime';
import { prepareScoutAnimation } from '../../../scripts/art-animation-source';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const palette: Palette = { id: 'test-palette', version: 1, colors: ['#202328', '#c1b597', '#84533f'] };
const sourcePath = 'assets/art/source/animations/unit.scout.ashen_compact-idle-v2.png';
const metadataPath = 'assets/art/source/animations/unit.scout.ashen_compact-idle-generation.json';
const realSourceHash = '8a7435f320b5b884be400cd574dbfdc9864cf78f2c91540116f899d4d7daebe4';
function sample(distinct = true, drift = 0) {
  const image: RgbaImage = { width: 128, height: 128, data: new Uint8Array(128 * 128 * 4) };
  for (let frame = 0; frame < 4; frame++) {
    const ox = frame % 2 * 64, oy = Math.floor(frame / 2) * 64, dx = frame === 3 ? drift : 0;
    for (let y = 12; y < 52; y++) for (let x = 18 + dx; x < 42 + dx; x++) image.data.set([32, 35, 40, 180], ((oy + y) * 128 + ox + x) * 4);
    image.data.set([193, 181, 151, 255], ((oy + 25) * 128 + ox + 24 + (distinct ? frame : 0) + dx) * 4);
  }
  const bytes = encodePng(image);
  const recipe: AnimationRecipe = { sourceHash: sha256(bytes), sourceSize: { width: 128, height: 128 }, scale: { numerator: 1, denominator: 1 },
    frames: Array.from({ length: 4 }, (_, index) => ({ crop: { x: index % 2 * 64, y: Math.floor(index / 2) * 64, w: 64, h: 64 },
      anchor: [index % 2 * 64 + 32, Math.floor(index / 2) * 64 + 56] })),
    nativeSize: 64, pivot: [32, 56], alphaThreshold: 128, transparentPadding: 2, maxBoundingBoxDrift: 2 };
  return { image, bytes, recipe };
}

describe('genuine animation source import', () => {
  it('preserves four original localized poses, inputs and detached output frames', () => {
    const input = sample(), bytesBefore = input.bytes.slice(), recipeBefore = structuredClone(input.recipe);
    const result = prepareAnimationSource(input.bytes, input.recipe, palette);
    expect(result.frames).toHaveLength(4); expect(new Set(result.frames.map(frame => frame.pixelHash)).size).toBe(4);
    for (const frame of result.frames) {
      expect(frame.bounds).toEqual({ x: 18, y: 12, w: 24, h: 40 });
      expect([...new Set(frame.image.data.filter((_, at) => at % 4 === 3))].sort()).toEqual([0, 255]);
      expect(decodePng(frame.png)).toEqual(frame.image);
      expect(frame.image.data.subarray((25 * 64 + 24 + frame.index) * 4, (25 * 64 + 24 + frame.index) * 4 + 4)).toEqual(new Uint8Array([193, 181, 151, 255]));
    }
    result.frames[0]!.image.data.fill(0); result.recipe.frames[0]!.anchor[0] = 0;
    expect(result.frames[1]!.image.data.some(value => value > 0)).toBe(true);
    expect(input.bytes).toEqual(bytesBefore); expect(input.recipe).toEqual(recipeBefore);
  });
  it('applies one rational nearest scale to every frame, not per-frame bounding-box fitting', () => {
    const input = sample(); input.recipe.scale = { numerator: 2, denominator: 3 };
    // Make this oracle's localized pose marks survive nearest downsampling;
    // disappearing single-pixel differences correctly fail the duplicate guard.
    for (let frame = 0; frame < 4; frame++) for (let y = 28; y < 31; y++) for (let x = 20 + frame * 4; x < 23 + frame * 4; x++) {
      input.image.data.set([132, 83, 63, 255], (((Math.floor(frame / 2) * 64 + y) * 128) + frame % 2 * 64 + x) * 4);
    }
    input.bytes = encodePng(input.image); input.recipe.sourceHash = sha256(input.bytes);
    const result = prepareAnimationSource(input.bytes, input.recipe, palette);
    for (const frame of result.frames) for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const { crop, anchor } = input.recipe.frames[frame.index]!;
      const sx = Math.floor(anchor[0] + (x + .5 - 32) * 3 / 2), sy = Math.floor(anchor[1] + (y + .5 - 56) * 3 / 2);
      const expected = sx >= crop.x && sy >= crop.y && sx < crop.x + crop.w && sy < crop.y + crop.h
        && input.image.data[(sy * 128 + sx) * 4 + 3]! >= 128 ? [...input.image.data.subarray((sy * 128 + sx) * 4, (sy * 128 + sx) * 4 + 3), 255] : [0, 0, 0, 0];
      expect([...frame.image.data.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 4)]).toEqual(expected);
    }
  });
  it('thresholds alpha127 away without painting new pixels', () => {
    const input = sample(); input.image.data.set([132, 83, 63, 127], (15 * 128 + 20) * 4);
    const bytes = encodePng(input.image), result = prepareAnimationSource(bytes, { ...input.recipe, sourceHash: sha256(bytes) }, palette);
    expect(result.frames[0]!.image.data.subarray((15 * 64 + 20) * 4, (15 * 64 + 20) * 4 + 4)).toEqual(new Uint8Array(4));
  });
  it('rejects an opaque/checkerboard source instead of erasing its background', () => {
    const input = sample(); for (let at = 3; at < input.image.data.length; at += 4) input.image.data[at] = 255;
    const bytes = encodePng(input.image);
    expect(() => prepareAnimationSource(bytes, { ...input.recipe, sourceHash: sha256(bytes) }, palette)).toThrow(/zero-alpha/);
  });
  it('rejects four repeated stills and excessive genuine frame drift', () => {
    const still = sample(false), drifting = sample(true, 4);
    expect(() => prepareAnimationSource(still.bytes, still.recipe, palette)).toThrow(/duplicate/);
    expect(() => prepareAnimationSource(drifting.bytes, drifting.recipe, palette)).toThrow(/drift/);
  });
  it('rejects altered identities, dimensions, overlap, outside anchors and clipped native bounds', () => {
    const input = sample();
    expect(() => prepareAnimationSource(input.bytes, { ...input.recipe, sourceHash: '0'.repeat(64) }, palette)).toThrow(/hash/);
    expect(() => prepareAnimationSource(input.bytes, { ...input.recipe, sourceSize: { width: 127, height: 128 } }, palette)).toThrow(/dimensions/);
    const overlap = structuredClone(input.recipe); overlap.frames[1] = structuredClone(overlap.frames[0]!);
    expect(() => prepareAnimationSource(input.bytes, overlap, palette)).toThrow(/overlap/);
    const outside = structuredClone(input.recipe); outside.frames[0]!.anchor[0] = 128;
    expect(() => prepareAnimationSource(input.bytes, outside, palette)).toThrow(/outside/);
    const clipped = structuredClone(input.recipe); clipped.frames[0]!.anchor[0] = 60;
    expect(() => prepareAnimationSource(input.bytes, clipped, palette)).toThrow(/padding/);
    const omitted = structuredClone(input.recipe); omitted.frames[0]!.crop = { x: 20, y: 14, w: 40, h: 48 };
    expect(() => prepareAnimationSource(input.bytes, omitted, palette)).toThrow(/Clipped/);
  });
  it('refuses malformed/expanded contracts rather than generating extra poses', () => {
    const { recipe } = sample();
    for (const update of [{ alphaThreshold: 127 }, { nativeSize: 96 }, { frames: recipe.frames.slice(1) }, { scale: { numerator: 0, denominator: 1 } }, { interpolate: true }]) {
      expect(() => animationRecipeSchema.parse({ ...recipe, ...update })).toThrow();
    }
  });
  it('retains exact actual four-pose native hashes and reference-height registration', async () => {
    const bytes = await readFile(resolve(root, sourcePath)), p = JSON.parse(await readFile(resolve(root, 'assets/palettes/theandril-master.json'), 'utf8')) as Palette;
    const result = prepareAnimationSource(bytes, scoutIdleRecipe(realSourceHash), p);
    expect(result.frames.map(frame => frame.sha256)).toEqual([
      '97e2a874888a534637e651bf9d97689b2fa895d6867e5bbceaa89fca4dccf5ae',
      '0a856d283b36597f7d11b58ccaa8b28e96bacf00c0e87d9451bf3194059c7692',
      '54f634ac2f9ef083a1d65a90dee7907f57635f42960241d509021ad3e9e7aa57',
      '4fd5acbc67b13191bc52103fa857173e5b9ee294577b41321d447aeec06114db',
    ]);
    expect(result.frames.map(frame => frame.bounds)).toEqual([{ x: 13, y: 8, w: 43, h: 47 }, { x: 12, y: 8, w: 43, h: 47 }, { x: 12, y: 8, w: 44, h: 47 }, { x: 12, y: 8, w: 44, h: 47 }]);
    expect(result.frames.reduce((count, frame) => count + frame.source.transparent, 0)).toBe(1280175);
  });
});

const temporary: string[] = [];
afterEach(async () => { for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true }); });
async function fixture() {
  const path = await mkdtemp(resolve(tmpdir(), 'theandril-animation-source-')); temporary.push(path);
  const metadata = animationSourceIndexSchema.parse(JSON.parse(await readFile(resolve(root, metadataPath), 'utf8')));
  const inputs = [metadataPath, metadata.reference.path, ...metadata.generations.map(source => source.sourcePath), 'assets/palettes/theandril-master.json'];
  for (const input of inputs) { const target = resolve(path, input); await mkdir(dirname(target), { recursive: true }); await writeFile(target, await readFile(resolve(root, input)), { flag: 'wx' }); }
  for (const input of ['assets/art/briefs/unit.scout.ashen_compact.json', 'assets/art/approved/unit.scout.ashen_compact.json', 'assets/art/runtime/catalog.json']) {
    const target = resolve(path, input); await mkdir(dirname(target), { recursive: true }); await writeFile(target, 'unchanged sentinel', { flag: 'wx' });
  }
  return { path, metadata, inputs };
}
async function inventory(path: string) {
  const files = (await readdir(path, { recursive: true })).sort(), result: Record<string, { hash: string; mtime: number }> = {};
  for (const file of files) { const target = resolve(path, file), info = await stat(target); if (info.isFile()) result[file] = { hash: sha256(await readFile(target)), mtime: info.mtimeMs }; }
  return result;
}

describe('immutable animation candidate preparation, never activation or approval', () => {
  it('has a read-only default, writes a separate v5 brief, and exact repeats preserve bytes/mtimes', async () => {
    const { path } = await fixture(), before = await inventory(path), dry = await prepareScoutAnimation(path);
    expect(dry.prepared).toBe(false); expect(dry.activated).toBe(false); expect(await inventory(path)).toEqual(before);
    const first = await prepareScoutAnimation(path, true), written = await inventory(path);
    expect(first.validation.passed).toBe(true); expect(first.approved).toBe(false);
    const brief = JSON.parse(await readFile(resolve(path, first.briefPath), 'utf8'));
    expect(brief.version).toBe(5); expect(brief.status).toBe('BRIEF_READY'); expect(brief.review).toBeNull(); expect(brief.validation).toBeNull();
    expect(brief.animation.states.idle).toEqual({ frames: 4, fps: 4, loop: true });
    expect(brief.frames.every((frame: { durationMs: number; pivot: number[] }) => frame.durationMs === 250 && String(frame.pivot) === '32,56')).toBe(true);
    expect(brief.constraints).toMatchObject({ maxPivotDrift: 0, maxBoundingBoxDrift: 2, requireMotion: true });
    expect((await prepareScoutAnimation(path, true)).inputHash).toBe(first.inputHash);
    expect(await inventory(path)).toEqual(written);
    for (const [file, info] of Object.entries(before)) expect(written[file]).toEqual(info);
    const record = JSON.parse(await readFile(resolve(path, first.recordPath), 'utf8'));
    expect(record.generatedAt).toBeNull(); expect(record.preparedAt).toBe(brief.createdAt);
  });
  it('preflights the last output collision before creating any earlier frame or record', async () => {
    const { path } = await fixture(), dry = await prepareScoutAnimation(path), target = resolve(path, dry.briefPath);
    await mkdir(dirname(target), { recursive: true }); await writeFile(target, 'conflicting immutable candidate');
    const before = await inventory(path);
    await expect(prepareScoutAnimation(path, true)).rejects.toThrow(/Immutable/);
    expect(await inventory(path)).toEqual(before);
  });
  it.each(['selected', 'rejected', 'reference'] as const)('rejects altered %s source evidence before outputs', async kind => {
    const { path, metadata } = await fixture();
    const target = kind === 'reference' ? metadata.reference.path : metadata.generations[kind === 'selected' ? 1 : 0]!.sourcePath;
    await writeFile(resolve(path, target), new Uint8Array([1, 2, 3])); const before = await inventory(path);
    await expect(prepareScoutAnimation(path, true)).rejects.toThrow(/hash mismatch/);
    expect(await inventory(path)).toEqual(before);
  });
  it('rejects unknown source IDs, references, duplicate origins and unregistered source replacement', async () => {
    const { path, metadata } = await fixture();
    expect(() => animationSourceIndexSchema.parse({ ...metadata, id: 'unit.guard.ashen_compact' })).toThrow();
    const duplicate = structuredClone(metadata); duplicate.generations[1]!.sha256 = duplicate.generations[0]!.sha256;
    expect(() => animationSourceIndexSchema.parse(duplicate)).toThrow();
    const unsafe = structuredClone(metadata); unsafe.reference.path = '../outside.png';
    expect(() => animationSourceIndexSchema.parse(unsafe)).toThrow();
    const wrong = structuredClone(metadata); wrong.reference.sha256 = '0'.repeat(64);
    await writeFile(resolve(path, metadataPath), JSON.stringify(wrong));
    await expect(prepareScoutAnimation(path, true)).rejects.toThrow(/measured registration/);
  });
  it('rejects symlinked output ancestors without touching their targets', async () => {
    const { path } = await fixture(), dry = await prepareScoutAnimation(path), outside = await mkdtemp(resolve(tmpdir(), 'theandril-animation-link-')); temporary.push(outside);
    const directory = dirname(resolve(path, dry.frames[0]!.path)); await mkdir(dirname(directory), { recursive: true }); await symlink(outside, directory);
    await expect(prepareScoutAnimation(path, true)).rejects.toThrow(/Symlinked/); expect(await readdir(outside)).toEqual([]);
  });
});
