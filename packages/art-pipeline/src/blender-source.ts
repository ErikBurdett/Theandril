import { readFile, stat } from 'node:fs/promises';
import { z } from 'zod';
import { decodePng } from './png';
import { cacheKey, safeAssetPath, sha256 } from './provenance';
import { hashSchema, paletteSchema } from './runtime';
import { parseAssetManifest, sourcePathSchema } from './schema';
import { validateAsset } from './validation';
export { BATTLE_UNIT_IDS, BATTLE_UNIT_ROLES, importBlenderUnitSource } from './blender-unit-source';

export const BATTLE_EFFECT_IDS = ['effect.battle_melee', 'effect.battle_projectile', 'effect.battle_ember', 'effect.battle_ward', 'effect.battle_rally'] as const;
export const BLENDER_BATTLE_IDS = [...BATTLE_EFFECT_IDS, 'character.waykeeper'] as const;
const duration = z.number().int().min(40).max(500);
const sourceSchema = z.object({
  schemaVersion: z.literal(1), id: z.enum(BLENDER_BATTLE_IDS), version: z.number().int().min(1).max(100),
  createdAt: z.string().datetime({ offset: true }), blenderVersion: z.string().min(1).max(100), paletteHash: hashSchema,
  nativeResolution: z.object({ width: z.literal(64), height: z.literal(64) }).strict(),
  pivot: z.object({ x: z.literal(32), y: z.union([z.literal(32), z.literal(56)]) }).strict(),
  durationsMs: z.array(duration).min(6).max(8),
  frames: z.array(z.object({ path: sourcePathSchema, rawPath: sourcePathSchema, index: z.number().int().min(0).max(7), durationMs: duration, sha256: hashSchema }).passthrough()).min(6).max(8),
  files: z.array(z.object({ path: sourcePathSchema, sha256: hashSchema, bytes: z.number().int().min(1).max(64 * 1024 * 1024) }).strict()).min(4).max(128),
  clip: z.object({ state: z.enum(['attack', 'cast']), direction: z.literal('se'), loop: z.literal(false) }).strict(),
}).passthrough();

/** Reads retained source evidence, never executes a supplied recipe or grants visual approval. */
export async function importBlenderBattleSource(root: string, assetId: string, version: number) {
  const id = z.enum(BLENDER_BATTLE_IDS).parse(assetId);
  z.number().int().min(1).max(100).parse(version);
  const base = `assets/art/source/blender-battle/${id}/v${version}`;
  const read = async (path: string) => {
    const full = await safeAssetPath(root, path), info = await stat(full);
    if (!info.isFile() || info.size > 64 * 1024 * 1024) throw new Error('Blender source file exceeds bounded import size');
    return readFile(full);
  };
  const manifestPath = `${base}/manifest.json`, manifestBytes = await read(manifestPath);
  const source = sourceSchema.parse(JSON.parse(manifestBytes.toString()));
  if (source.id !== id || source.version !== version) throw new Error('Blender source identity differs from its directory');
  const paletteBytes = await read('assets/palettes/theandril-master.json');
  if (source.paletteHash !== sha256(paletteBytes)) throw new Error('Blender source palette hash mismatch');
  const palette = paletteSchema.parse(JSON.parse(paletteBytes.toString()));
  const paths = new Map(source.files.map(file => [file.path, file]));
  if (paths.size !== source.files.length || source.files.reduce((sum, file) => sum + file.bytes, 0) > 256 * 1024 * 1024) throw new Error('Duplicate or oversized Blender source inventory');
  for (const required of ['source.blend', 'profile.json', 'recipe.py']) if (!paths.has(required)) throw new Error(`Missing retained Blender source: ${required}`);
  const bytesByPath = new Map<string, Buffer>();
  for (const file of source.files) {
    const bytes = await read(`${base}/${file.path}`);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Blender source hash mismatch: ${file.path}`);
    bytesByPath.set(file.path, bytes);
  }
  if (source.frames.length !== source.durationsMs.length || new Set(source.frames.map(frame => frame.path)).size !== source.frames.length
    || source.frames.some((frame, index) => frame.index !== index || frame.durationMs !== source.durationsMs[index]
      || paths.get(frame.path)?.sha256 !== frame.sha256 || !paths.has(frame.rawPath))) throw new Error('Blender animation frames/timing/source inventory disagree');
  if (new Set(source.durationsMs).size !== 1) throw new Error('Current source profile requires a uniform explicit frame duration');
  const character = id === 'character.waykeeper';
  const state = character || id === 'effect.battle_ember' || id === 'effect.battle_ward' ? 'cast' : 'attack';
  if (source.pivot.y !== (character ? 56 : 32) || source.clip.state !== state) throw new Error('Blender role pivot or action tag mismatch');
  const frames = source.frames.map(frame => decodePng(bytesByPath.get(frame.path)!));
  if (new Set(frames.map(frame => sha256(frame.data))).size !== frames.length) throw new Error('Blender clip has repeated stills; review genuine motion before import');
  const prompt = `Original Theandril ${character ? 'Waykeeper casting figure' : id.slice('effect.battle_'.length) + ' battlefield effect'}, authored and animated in Blender. Fixed native 64x64 canvas, registered ${character ? 'feet (32,56)' : 'effect center (32,32)'}, retained keyframed scene, raw renders and exact palette normalization. ${source.frames.length} supplied ${source.clip.state} frames; no synthesized pose, mirrored faction art or independently fitted frames. Exact production brief/profile and source evidence: ${manifestPath}.`;
  const inputHash = sha256(manifestBytes);
  const brief = parseAssetManifest({ schemaVersion: 1, id, version, type: character ? 'unit' : 'effect', status: 'BRIEF_READY',
    nativeResolution: source.nativeResolution, paletteId: palette.id, contentIds: [id], prompt,
    frames: source.frames.map(frame => ({ id: `${id}/${source.clip.state}/se/${frame.index}`, state: source.clip.state, direction: 'se', index: frame.index,
      durationMs: frame.durationMs, pivot: [source.pivot.x, source.pivot.y], sourcePath: `${base}/${frame.path}` })),
    animation: { states: { [source.clip.state]: { frames: frames.length, fps: 1000 / source.durationsMs[0]!, loop: false } } },
    provenance: { provider: 'blender-art-factory', model: source.blenderVersion, promptHash: sha256(prompt),
      sourceRefs: [manifestPath, `${base}/source.blend`, `${base}/profile.json`, `${base}/recipe.py`, ...source.frames.map(frame => `${base}/${frame.rawPath}`)],
      licenseNotes: ['Original Theandril project-authored Blender geometry and keyframes; no third-party game sprites or copyrighted setting assets. The retained factory source/profile record identifies production dependencies. This import neither grants a new license nor substitutes for native/in-game visual review.'] },
    createdAt: new Date(source.createdAt).toISOString(), referenceHashes: [inputHash, source.paletteHash],
    processing: [{ tool: 'blender-art-factory', version: source.blenderVersion, profile: 'fixed-camera-native-battle64',
      settingsHash: paths.get('profile.json')!.sha256, inputHash, outputHash: cacheKey(source.frames.map(frame => frame.sha256)) }],
    validation: null, review: null,
    constraints: { transparentPadding: 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0,
      maxBoundingBoxDrift: character ? 20 : 60, requireMotion: true, terrain: 'none' },
  });
  const validation = validateAsset(brief, frames.map((image, index) => ({ id: brief.frames[index]!.id, image })), palette);
  if (!validation.passed) throw new Error(`Blender native import invalid: ${validation.errors.join('; ')}`);
  return { brief, validation, inputHash, manifestPath, approval: false as const, activation: false as const };
}
