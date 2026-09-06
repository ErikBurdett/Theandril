import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { findAseprite, asepriteVersion, createAsepriteSource, exportAseprite } from './aseprite';
import { findPixelSnapper, runPixelSnapper } from './pixelsnapper';
import { doctor } from './doctor';
import { prepareOutput, redact, runTool, sha256, stableSettings, writeArtFile } from './process';
import { encodePng } from '../png';

const temporary: string[] = [];
async function directory(): Promise<string> { const path = await mkdtemp(join(tmpdir(), 'theandril-tool-test-')); temporary.push(path); return path; }
afterEach(async () => { for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true }); });

describe('safe native process boundary', () => {
  it('passes shell metacharacters literally and redacts known secret values', async () => {
    const result = await runTool('/usr/bin/printf', ['%s\n', '$(touch impossible); & `pwd`', 'test-api-secret-value'], { env: { ...process.env, PIXELLAB_API_KEY: 'test-api-secret-value' } });
    expect(result.stdout).toBe('$(touch impossible); & `pwd`\n[REDACTED]\n'); expect(result.stdout).not.toContain('test-api-secret-value');
    expect(redact('Bearer some-credential')).toBe('Bearer [REDACTED]');
  });
  it('kills timed out and over-output tools and never exposes unsuccessful stderr', async () => {
    await expect(runTool('/usr/bin/sleep', ['10'], { timeoutMs: 20 })).rejects.toThrow('timeout');
    await expect(runTool('/usr/bin/printf', ['%s', 'x'.repeat(1000)], { maxOutputBytes: 10 })).rejects.toThrow('output exceeded');
    await expect(runTool('/bin/sh', ['-c', 'printf "private provider data" >&2; exit 2'])).rejects.toThrow('No provider output');
    await expect(runTool(process.execPath, [], { timeoutMs: Infinity })).rejects.toThrow('timeout');
    await expect(runTool(process.execPath, [], { maxOutputBytes: Infinity })).rejects.toThrow('output limit');
  });
  it('makes file writes idempotent without overwriting inputs or following dangling outputs', async () => {
    const path = await directory(), input = join(path, 'input'), output = join(path, 'output'); await writeArtFile(input, 'original');
    await writeArtFile(input, 'original'); await expect(writeArtFile(input, 'different')).rejects.toThrow('already exists');
    await expect(prepareOutput(input, input)).rejects.toThrow('replace');
    await symlink(join(path, 'missing-target'), output); await expect(prepareOutput(input, output)).rejects.toThrow('already exists');
    expect(sha256(stableSettings({ b: 2, a: 1 }))).toBe(sha256(stableSettings({ a: 1, b: 2 })));
  });
});

describe('discovery and truthful doctor diagnostics', () => {
  it('does not silently replace an invalid explicit Aseprite override with a Steam installation', async () => {
    await expect(findAseprite({ env: { HOME: process.env.HOME, ASEPRITE_BIN: '/missing/aseprite' } })).rejects.toThrow('ASEPRITE_BIN');
    await expect(findAseprite({ env: { ASEPRITE_BIN: '' } })).rejects.toThrow('ASEPRITE_BIN');
    await expect(asepriteVersion({ env: { ASEPRITE_BIN: process.execPath } })).rejects.toThrow('unexpected version');
    await expect(findPixelSnapper({ env: { PIXEL_SNAPPER_BIN: '/missing/snapper' } })).rejects.toThrow('PIXEL_SNAPPER_BIN');
  });
  it('discovers executable Steam metadata paths with spaces and safe argv in the supplied wrapper', async () => {
    const home = await directory(), library = join(home, 'An additional Steam library');
    const binary = join(library, 'steamapps/common/Aseprite/aseprite'); await mkdir(join(library, 'steamapps/common/Aseprite'), { recursive: true }); await symlink(process.execPath, binary);
    const steam = join(home, '.local/share/Steam/steamapps'); await mkdir(steam, { recursive: true }); await writeFile(join(steam, 'libraryfolders.vdf'), `"libraryfolders" { "2" { "path" "${library}" } }`);
    expect(await findAseprite({ env: { HOME: home, PATH: '' } })).toBe(binary);
    const result = await runTool('/usr/bin/bash', [resolve('tools/art/aseprite-wrapper.sh'), '--version'], { env: { ...process.env, ASEPRITE_BIN: process.execPath } }); expect(result.stdout.trim()).toBe(process.version);
  });
  it('reports absent/malformed optional providers without exposing credential contents', async () => {
    const repoRoot = await directory();
    const report = await doctor({ repoRoot, env: { HOME: repoRoot, PATH: '', PIXELLAB_API_KEY: 'private-key-not-to-log', COMFYUI_URL: 'https://private-key-not-to-log@untrusted.example/', ASEPRITE_BIN: '' } });
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'aseprite', status: 'MISCONFIGURED' }));
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'pixel-snapper', status: 'MISSING' }));
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'comfyui', status: 'MISCONFIGURED' }));
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'assets/art/runtime', status: 'MISSING' }));
    expect(report.checks).toContainEqual(expect.objectContaining({ id: 'assets/art/briefs', status: 'MISSING' }));
    expect(report.checks.some(check => check.id === 'assets/art/atlases' || check.id === 'assets/art/manifests')).toBe(false);
    expect(report.credentialPresence.PIXELLAB_API_KEY).toBe(true); expect(JSON.stringify(report)).not.toContain('private-key-not-to-log'); expect(report.readyForProcessing).toBe(false);
  });
});

describe('native export preflight', () => {
  it('rejects illegal frame sizes, durations, output targets and palette flags before tool execution', async () => {
    const dir = await directory(), source = join(dir, 'tiny.png'); await writeFile(source, encodePng({ width: 4, height: 4, data: new Uint8Array(64) }));
    await expect(createAsepriteSource({ frames: [{ path: source, durationMs: 250 }], outputPath: join(dir, 'source.aseprite'), profile: 'aseprite-unit-64' })).rejects.toThrow('dimensions');
    await expect(createAsepriteSource({ frames: [{ path: source, durationMs: 0 }], outputPath: join(dir, 'source.aseprite'), profile: 'aseprite-unit-64' })).rejects.toThrow('duration');
    await expect(exportAseprite({ sourcePath: source, outputDirectory: dir, stem: '../../escape', profile: 'aseprite-unit-64' })).rejects.toThrow('stem');
    await expect(runPixelSnapper({ inputPath: source, outputPath: join(dir, 'out.png'), pixelSize: 3 })).rejects.toThrow('Pixel size');
    await expect(runPixelSnapper({ inputPath: source, outputPath: join(dir, 'out.png'), palette: ['#bad;command'] })).rejects.toThrow('Palette');
    await expect(runPixelSnapper({ inputPath: source, outputPath: join(dir, 'out.png'), colorCount: 257 })).rejects.toThrow('Color count');
  });
});
