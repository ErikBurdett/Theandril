import { join, resolve } from 'node:path';
import { executable, findExecutable, pngDimensions, prepareOutput, readArtFile, runTool, sha256, stableSettings } from './process';
import type { ToolProcessResult } from './aseprite';

export async function findPixelSnapper(options: { repoRoot?: string; env?: NodeJS.ProcessEnv } = {}): Promise<string | undefined> {
  const env = options.env ?? process.env;
  if (env.PIXEL_SNAPPER_BIN !== undefined) {
    if (!env.PIXEL_SNAPPER_BIN || !await executable(env.PIXEL_SNAPPER_BIN)) throw new Error('PIXEL_SNAPPER_BIN is set but is not an executable file.');
    return resolve(env.PIXEL_SNAPPER_BIN);
  }
  const local = join(options.repoRoot ?? process.cwd(), 'tools/art/.local/bin/spritefusion-pixel-snapper');
  return await executable(local) ? local : findExecutable('spritefusion-pixel-snapper', env);
}
export async function runPixelSnapper(options: { inputPath: string; outputPath: string; pixelSize?: number; colorCount?: number; palette?: readonly string[]; palettePath?: string; repoRoot?: string; env?: NodeJS.ProcessEnv }): Promise<ToolProcessResult> {
  const bytes = await readArtFile(options.inputPath), dimensions = pngDimensions(bytes);
  if (options.pixelSize !== undefined && (!Number.isInteger(options.pixelSize) || options.pixelSize < 1 || options.pixelSize > Math.min(dimensions.width, dimensions.height) / 2)) throw new Error('Pixel size must be an integer within half the smallest source dimension.');
  const colorCount = options.colorCount ?? 32;
  if (!Number.isInteger(colorCount) || colorCount < 1 || colorCount > 256) throw new Error('Color count must be 1–256.');
  if (options.palette && options.palettePath) throw new Error('Provide palette colors or a palette file, not both.');
  let palette = options.palette ? [...options.palette] : undefined;
  if (options.palettePath) {
    const parsed: unknown = JSON.parse((await readArtFile(options.palettePath)).toString());
    if (!parsed || typeof parsed !== 'object' || !('colors' in parsed) || !Array.isArray(parsed.colors)) throw new Error('Palette JSON requires a colors array.');
    palette = parsed.colors.map((color: unknown) => typeof color === 'string' ? color : color && typeof color === 'object' && 'hex' in color && typeof color.hex === 'string' ? color.hex : '');
  }
  if (palette && (!palette.length || palette.length > 256 || palette.some(color => !/^#?[0-9a-fA-F]{6}$/.test(color)))) throw new Error('Palette requires 1–256 six-digit RGB colors.');
  const normalizedPalette = palette?.map(color => color.replace('#', '').toLowerCase());
  const binary = await findPixelSnapper(options); if (!binary) throw new Error('Pixel Snapper is missing. Run the project-local installer or set PIXEL_SNAPPER_BIN.');
  const version = (await runTool(binary, ['--version'], { env: options.env, timeoutMs: 10_000 })).stdout.trim();
  if (!/^spritefusion-pixel-snapper \d+\.\d+\.\d+/.test(version)) throw new Error('Unexpected Pixel Snapper version response.');
  const paths = await prepareOutput(options.inputPath, options.outputPath);
  const args = [paths.input, paths.output, String(colorCount)];
  if (options.pixelSize !== undefined) args.push('--pixel-size', String(options.pixelSize));
  if (normalizedPalette) args.push('--palette', normalizedPalette.join(','));
  await runTool(binary, args, { env: { ...(options.env ?? process.env), RAYON_NUM_THREADS: '2' }, timeoutMs: 120_000 });
  const output = await readArtFile(paths.output); pngDimensions(output);
  return { tool: 'spritefusion-pixel-snapper', version, inputHash: sha256(bytes), settingsHash: sha256(stableSettings({ pixelSize: options.pixelSize ?? null, colorCount, paletteHash: normalizedPalette ? sha256(stableSettings(normalizedPalette)) : null, threads: 2 })), files: [{ path: paths.output, sha256: sha256(output) }] };
}
