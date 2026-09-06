import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { executable, findExecutable, pngDimensions, prepareOutput, readArtFile, runTool, sha256, stableSettings, writeArtFile } from './process';

export interface ToolFile { path: string; sha256: string }
export interface ToolProcessResult { tool: string; version: string; settingsHash: string; inputHash: string; files: ToolFile[] }
export interface ToolExportResult extends ToolProcessResult { profile: string; metadata: AsepriteMetadata }
export interface AsepriteMetadata {
  frames: { filename: string; frame: { x: number; y: number; w: number; h: number }; sourceSize: { w: number; h: number }; duration: number }[];
  meta: { frameTags?: { name: string; from: number; to: number; direction: string }[]; image?: string; size?: { w: number; h: number } };
}
const profile = (width: number, height = width) => ({ width, height, colorMode: 'rgb', trim: false, borderPadding: 0, shapePadding: 0, sheetType: 'horizontal', format: 'json-array', preserveTags: true, preserveDurations: true } as const);
export const ASEPRITE_PROFILES = {
  'aseprite-unit-64': profile(64), 'aseprite-unit-96': profile(96), 'aseprite-monster-128': profile(128),
  'aseprite-ui-32': profile(32), 'aseprite-terrain-64': profile(64), 'aseprite-settlement-96': profile(96),
  'aseprite-settlement-128': profile(128), 'aseprite-vignette-384': profile(384, 216),
} as const;
export type AsepriteProfile = keyof typeof ASEPRITE_PROFILES;

export async function findAseprite(options: { repoRoot?: string; env?: NodeJS.ProcessEnv } = {}): Promise<string> {
  const env = options.env ?? process.env;
  if (env.ASEPRITE_BIN !== undefined) {
    if (!env.ASEPRITE_BIN || !await executable(env.ASEPRITE_BIN)) throw new Error('ASEPRITE_BIN is set but is not an executable file.');
    return resolve(env.ASEPRITE_BIN);
  }
  const home = env.HOME;
  if (home) {
    const roots = [join(home, '.local/share/Steam'), join(home, '.steam/steam')];
    const libraries = [...roots];
    for (const root of roots) {
      try { const vdf = await readFile(join(root, 'steamapps/libraryfolders.vdf'), 'utf8'); for (const match of vdf.matchAll(/"path"\s*"([^"\r\n]+)"/g)) libraries.push(match[1]!.replaceAll('\\\\', '/')); } catch { /* A missing library file is normal. */ }
    }
    for (const root of [...new Set(libraries)]) for (const name of ['aseprite', 'Aseprite']) { const path = join(root, 'steamapps/common/Aseprite', name); if (await executable(path)) return path; }
  }
  const binary = await findExecutable('aseprite', env);
  if (!binary) throw new Error('Aseprite is missing. Locate the existing Steam installation or set ASEPRITE_BIN.');
  return binary;
}
export async function asepriteVersion(options: { repoRoot?: string; env?: NodeJS.ProcessEnv } = {}): Promise<{ binary: string; version: string }> {
  const binary = await findAseprite(options), result = await runTool(binary, ['--version'], { env: options.env, timeoutMs: 10_000 });
  const version = result.stdout.trim(); if (!/^Aseprite [\w.+-]+$/.test(version)) throw new Error('Configured Aseprite executable returned an unexpected version.');
  return { binary, version };
}
export async function exportAseprite(options: { sourcePath: string; outputDirectory: string; profile: AsepriteProfile; stem?: string; tag?: string; palettePath?: string; env?: NodeJS.ProcessEnv }): Promise<ToolExportResult> {
  const settings = ASEPRITE_PROFILES[options.profile];
  if (!settings) throw new Error('Unknown Aseprite export profile.');
  const stem = options.stem ?? 'sprite'; if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(stem) || stem === '.' || stem === '..') throw new Error('Invalid sprite export stem.');
  if (options.tag !== undefined && !/^[a-zA-Z0-9_.-]{1,100}$/.test(options.tag)) throw new Error('Invalid animation tag.');
  const input = await readArtFile(options.sourcePath), outputDirectory = resolve(options.outputDirectory);
  const isPng = input[0] === 137 && input[1] === 80;
  if (isPng) {
    const size = pngDimensions(input);
    if (size.width !== settings.width || size.height !== settings.height) throw new Error('PNG source does not match the native Aseprite profile.');
  } else {
    if (input.length < 128 || input.readUInt16LE(4) !== 0xa5e0 || input.readUInt32LE(0) !== input.length) throw new Error('Source must be a valid PNG or bounded Aseprite document.');
    const frames = input.readUInt16LE(6), width = input.readUInt16LE(8), height = input.readUInt16LE(10);
    if (!frames || frames > 256 || width !== settings.width || height !== settings.height || width * frames > 4096 || width * height * frames > 16_777_216) throw new Error('Aseprite source dimensions/frame count exceed the fixed native export profile.');
  }
  await mkdir(outputDirectory, { recursive: true });
  const sheet = await prepareOutput(options.sourcePath, join(outputDirectory, stem + '.png'));
  const json = await prepareOutput(options.sourcePath, join(outputDirectory, stem + '.json'));
  const tool = await asepriteVersion({ env: options.env });
  const paletteHash = options.palettePath ? sha256(await readArtFile(options.palettePath)) : null;
  const args = ['--batch', '--noinapp', '--list-tags', '--list-layers'];
  if (options.tag) args.push('--tag', options.tag);
  if (isPng) args.push('--oneframe'); // Numbered source files must never be guessed as a sequence.
  args.push(sheet.input);
  if (options.palettePath) args.push('--palette', resolve(options.palettePath));
  args.push('--color-mode', settings.colorMode, '--sheet-type', settings.sheetType, '--border-padding', String(settings.borderPadding), '--shape-padding', String(settings.shapePadding), '--filename-format', stem + '/{tag}/{frame}', '--format', settings.format, '--data', json.output, '--sheet', sheet.output);
  await runTool(tool.binary, args, { env: options.env, timeoutMs: 60_000 });
  const metadata = JSON.parse((await readArtFile(json.output)).toString()) as AsepriteMetadata;
  if (!Array.isArray(metadata.frames) || !metadata.frames.length || metadata.frames.length > 1024 || !metadata.meta
    || metadata.frames.some(frame => !frame.sourceSize || frame.sourceSize.w !== settings.width || frame.sourceSize.h !== settings.height || !Number.isInteger(frame.duration) || frame.duration < 1)) throw new Error('Aseprite output does not match the native-size/frame-duration profile; output remains an unapproved candidate.');
  if (options.tag && !metadata.meta.frameTags?.some(tag => tag.name === options.tag)) throw new Error('Requested Aseprite tag was not exported.');
  return { tool: 'aseprite', version: tool.version, profile: options.profile,
    settingsHash: sha256(stableSettings({ ...settings, tag: options.tag ?? null, paletteHash })), inputHash: sha256(input),
    files: await Promise.all([sheet.output, json.output].map(async path => ({ path, sha256: sha256(await readArtFile(path)) }))), metadata };
}

/** Assemble supplied real frames; never synthesizes motion or duplicates poses. */
export async function createAsepriteSource(options: { frames: { path: string; durationMs: number }[]; tags?: { name: string; from: number; to: number }[]; outputPath: string; profile: AsepriteProfile; env?: NodeJS.ProcessEnv }): Promise<ToolProcessResult> {
  const profile = ASEPRITE_PROFILES[options.profile];
  if (!profile || !options.frames.length || options.frames.length > 256) throw new Error('Choose a valid profile and 1–256 supplied frames.');
  const frames: { path: string; durationMs: number; sha256: string }[] = [];
  for (const frame of options.frames) {
    if (!Number.isInteger(frame.durationMs) || frame.durationMs < 1 || frame.durationMs > 60_000) throw new Error('Frame duration must be 1–60000 ms.');
    const data = await readArtFile(frame.path), dimensions = pngDimensions(data);
    if (dimensions.width !== profile.width || dimensions.height !== profile.height) throw new Error('Frame dimensions must match the native Aseprite profile.');
    frames.push({ path: resolve(frame.path), durationMs: frame.durationMs, sha256: sha256(data) });
  }
  const tags = options.tags ?? [{ name: 'idle', from: 0, to: frames.length - 1 }];
  if (tags.length > 64 || new Set(tags.map(tag => tag.name)).size !== tags.length || tags.some(tag => !/^[a-zA-Z0-9_.-]{1,100}$/.test(tag.name) || !Number.isInteger(tag.from) || !Number.isInteger(tag.to) || tag.from < 0 || tag.to < tag.from || tag.to >= frames.length)) throw new Error('Animation tags must have unique names and valid zero-based inclusive ranges.');
  if (!/\.aseprite$/i.test(options.outputPath)) throw new Error('Editable source output must end in .aseprite.');
  const { output } = await prepareOutput(frames[0]!.path, options.outputPath), tool = await asepriteVersion({ env: options.env });
  const temporary = await mkdtemp(join(tmpdir(), 'theandril-aseprite-'));
  const script = fileURLToPath(new URL('../../../../tools/art/import-frames.lua', import.meta.url));
  try {
    const manifest = join(temporary, 'frames.json');
    await writeArtFile(manifest, JSON.stringify({ width: profile.width, height: profile.height, frames, tags, outputPath: output }));
    await runTool(tool.binary, ['--batch', '--noinapp', '--script-param', 'manifest=' + manifest, '--script', script], { env: options.env, timeoutMs: 60_000 });
  } finally { await rm(temporary, { recursive: true, force: true }); }
  return { tool: 'aseprite', version: tool.version, inputHash: sha256(stableSettings(frames.map(frame => frame.sha256))), settingsHash: sha256(stableSettings({ profile: options.profile, tags, durations: frames.map(frame => frame.durationMs), scriptHash: sha256(await readArtFile(script)) })), files: [{ path: output, sha256: sha256(await readArtFile(output)) }] };
}
