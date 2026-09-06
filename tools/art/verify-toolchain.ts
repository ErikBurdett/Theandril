import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strict as assert } from 'node:assert';
import { encodePng, decodePng } from '../../packages/art-pipeline/src/png';
import { createAsepriteSource, exportAseprite, runPixelSnapper } from '../../packages/art-pipeline/src/toolchain';

// Contract test images, not production art or a replacement generation provider.
const directory = await mkdtemp(join(tmpdir(), 'theandril-native-art-'));
try {
  const frames: { path: string; durationMs: number }[] = [];
  for (let index = 0; index < 4; index++) {
    const data = new Uint8Array(64 * 64 * 4);
    for (let y = 8; y < 56; y++) for (let x = 8 + index; x < 48 + index; x++) data.set([x % 8 < 4 ? 192 : 32, 64, 96, 255], (y * 64 + x) * 4);
    const path = join(directory, `supplied-${index}.png`); await writeFile(path, encodePng({ width: 64, height: 64, data })); frames.push({ path, durationMs: 250 });
  }
  const source = await createAsepriteSource({ frames, tags: [{ name: 'idle', from: 0, to: 3 }], outputPath: join(directory, 'source.aseprite'), profile: 'aseprite-unit-64' });
  const first = await exportAseprite({ sourcePath: source.files[0]!.path, outputDirectory: join(directory, 'first'), profile: 'aseprite-unit-64', stem: 'unit.guard', tag: 'idle' });
  const second = await exportAseprite({ sourcePath: source.files[0]!.path, outputDirectory: join(directory, 'second'), profile: 'aseprite-unit-64', stem: 'unit.guard', tag: 'idle' });
  assert.equal(first.metadata.frames.length, 4); assert.equal(first.files[0]!.sha256, second.files[0]!.sha256);
  assert(first.metadata.frames.every(frame => frame.duration === 250 && frame.sourceSize.w === 64));
  assert(first.metadata.meta.frameTags?.some(tag => tag.name === 'idle' && tag.from === 0 && tag.to === 3));
  const snap = await runPixelSnapper({ inputPath: frames[0]!.path, outputPath: join(directory, 'snapped.png'), pixelSize: 1, colorCount: 2, palette: ['c04060', '204060'], repoRoot: process.cwd() });
  const snap2 = await runPixelSnapper({ inputPath: frames[0]!.path, outputPath: join(directory, 'snapped-again.png'), pixelSize: 1, colorCount: 2, palette: ['c04060', '204060'], repoRoot: process.cwd() });
  assert.equal(snap.files[0]!.sha256, snap2.files[0]!.sha256);
  const decoded = decodePng(await readFile(snap.files[0]!.path));
  console.log(JSON.stringify({ aseprite: first.version, frames: first.metadata.frames.length, tags: first.metadata.meta.frameTags, durationMs: 250, identicalRepeatedExport: true, pixelSnapper: snap.version, snapperInputSize: [64, 64], snapperOutputSize: [decoded.width, decoded.height], identicalRepeatedSnap: true }, null, 2));
} finally { await rm(directory, { recursive: true, force: true }); }
