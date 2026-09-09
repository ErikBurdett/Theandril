import { readFile, stat } from 'node:fs/promises';
import { z } from 'zod';
import { decodePng } from './png';
import { cacheKey, safeAssetPath, sha256 } from './provenance';
import { hashSchema, paletteSchema } from './runtime';
import { parseAssetManifest, sourcePathSchema } from './schema';
import { sourceClips } from './source-clip';
import { validateAsset } from './validation';

export const BATTLE_UNIT_ROLES = ['colonist', 'scout', 'guard', 'spearman', 'heavy_infantry', 'skirmisher', 'arbalester', 'halberdier', 'cavalry', 'lancer', 'transport', 'coastal_warship', 'ocean_warship'] as const;
export const BATTLE_UNIT_IDS = BATTLE_UNIT_ROLES.map(role => `battle.unit.${role}`);
const coordinate = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const bone = z.object({ head: coordinate, tail: coordinate }).strict();
const frameSchema = z.object({ state: z.string(), direction: z.enum(['e', 'w']), index: z.number().int().min(0).max(7),
  durationMs: z.union([z.literal(100), z.literal(200)]), path: sourcePathSchema, rawPath: sourcePathSchema, sha256: hashSchema,
  anchor: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(), bones: z.record(z.string(), bone),
}).passthrough();
const sourceSchema = z.object({ schemaVersion: z.literal(1), id: z.string(), contentId: z.string(), version: z.number().int().min(1).max(999),
  createdAt: z.string().datetime({ offset: true }), blenderVersion: z.string().min(1).max(100), paletteHash: hashSchema,
  nativeResolution: z.object({ width: z.number().int(), height: z.number().int() }).strict(), pivot: z.tuple([z.number(), z.number()]),
  directions: z.tuple([z.literal('e'), z.literal('w')]),
  clips: z.record(z.string(), z.object({ frames: z.number().int(), durationMs: z.number().int(), loop: z.boolean() }).strict()),
  frames: z.array(frameSchema).length(64), status: z.literal('candidate'),
  files: z.array(z.object({ path: sourcePathSchema, sha256: hashSchema, bytes: z.number().int().min(1).max(64 * 1024 * 1024) }).strict()).min(140).max(256),
}).passthrough();
const settingsSchema = z.object({ nativeResolution: z.tuple([z.number(), z.number()]), pivot: z.tuple([z.number(), z.number()]),
  meshObjects: z.number().int().positive(), weightedMeshes: z.number().int().positive(),
  rig: z.object({ boneCount: z.number().int().min(16) }).passthrough(),
  actions: z.array(z.object({ name: z.string(), range: z.tuple([z.number(), z.number()]) }).strict()).length(5),
}).passthrough();
type SourceFrame = z.infer<typeof frameSchema>;
const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((value, index) => value - b[index]!));

/** Reject a translated still rig masquerading as articulated infantry motion. */
export function validateFootArticulation(frames: readonly SourceFrame[]) {
  const point = (frame: SourceFrame, name: string, end: 'head' | 'tail' = 'head') => {
    const result = frame.bones[name]?.[end];
    if (!result) throw new Error(`Missing articulated bone: ${name}`);
    return result;
  };
  for (const direction of ['e', 'w']) {
    const clip = (state: string) => frames.filter(frame => frame.state === state && frame.direction === direction);
    const walk = clip('walk'), attack = clip('attack'), death = clip('death');
    const first = walk[0];
    if (!first || attack.length !== 8 || death.length !== 8) throw new Error('Incomplete articulation evidence');
    if (frames.some(frame => distance(point(frame, 'root'), [0, 0, 0]) > .0001)) throw new Error('Articulated root origin drifts');
    const relative = (frame: SourceFrame, name: string) => point(frame, name).map((value, index) => value - point(frame, 'pelvis')[index]!);
    for (const limb of ['foot.L', 'foot.R'])
      if (Math.max(...walk.map(frame => distance(relative(frame, limb), relative(first, limb)))) < .1) throw new Error('Walk is missing independent limb motion');
    if (Math.max(...walk.flatMap(frame => ['hand.L', 'hand.R'].map(limb => distance(relative(frame, limb), relative(first, limb))))) < .08)
      throw new Error('Walk is missing independent carried-equipment motion');
    if (Math.max(...attack.flatMap(frame => attack.map(other => distance(relative(frame, 'hand.R'), relative(other, 'hand.R'))))) < .25)
      throw new Error('Attack is missing an articulated weapon swing');
    if (point(death[0]!, 'head', 'tail')[2] - point(death[7]!, 'head', 'tail')[2] < 1)
      throw new Error('Death is missing a grounded collapse');
  }
}

function bonePoint(frame: SourceFrame, name: string, end: 'head' | 'tail' = 'tail'): readonly number[] {
  const point = frame.bones[name]?.[end];
  if (!point) throw new Error(`Missing articulated bone: ${name}`);
  return point;
}
function relativeSpan(frames: readonly SourceFrame[], name: string, anchor: string): number {
  const points = frames.map(frame => bonePoint(frame, name).map((value, index) => value - bonePoint(frame, anchor, 'head')[index]!));
  return Math.max(...points.flatMap(point => points.map(other => distance(point, other))));
}
function articulatedClip(frames: readonly SourceFrame[], state: string, direction: string): SourceFrame[] {
  const result = frames.filter(frame => frame.state === state && frame.direction === direction);
  if (result.length !== 8) throw new Error('Incomplete articulation evidence');
  for (const frame of result) bonePoint(frame, 'root', 'head'); // Mounted rider roots follow the horse; native frame anchors remain fixed.
  return result;
}

/** Mounted motion belongs to both the horse rig and its rider. */
export function validateMountedArticulation(frames: readonly SourceFrame[]): void {
  for (const direction of ['e', 'w']) {
    const walk = articulatedClip(frames, 'walk', direction), attack = articulatedClip(frames, 'attack', direction), death = articulatedClip(frames, 'death', direction);
    for (const end of ['front', 'back']) for (const side of ['L', 'R']) {
      for (const joint of ['upper', 'lower', 'hoof']) for (const frame of walk) bonePoint(frame, `horse.${joint}.${end}.${side}`);
      if (relativeSpan(walk, `horse.hoof.${end}.${side}`, 'horse.body') < .2) throw new Error('Mounted walk is missing independent hoof motion');
    }
    if (relativeSpan(walk, 'horse.tail', 'horse.body') < .1 || relativeSpan(walk, 'horse.head', 'horse.body') < .04)
      throw new Error('Mounted walk is missing articulated balance motion');
    if (relativeSpan(attack, 'hand.R', 'pelvis') < .25) throw new Error('Mounted attack is missing a rider weapon swing');
    if (bonePoint(death[0]!, 'head')[2]! - bonePoint(death[7]!, 'head')[2]! < 1
      || bonePoint(death[0]!, 'horse.body', 'head')[2]! - bonePoint(death[7]!, 'horse.body', 'head')[2]! < .5)
      throw new Error('Mounted death is missing a horse and rider collapse');
  }
}

/** Sail, oars and weapons must articulate independently of the hull. */
export function validateNavalArticulation(frames: readonly SourceFrame[]): void {
  for (const direction of ['e', 'w']) {
    const sail = articulatedClip(frames, 'sail', direction), fire = articulatedClip(frames, 'fire', direction), sink = articulatedClip(frames, 'sink', direction);
    for (let index = 0; index < 6; index++) for (const side of ['L', 'R'])
      if (relativeSpan(sail, `oar.${index}.${side}`, 'hull') < .2) throw new Error('Naval sailing is missing independent oar motion');
    if (relativeSpan(sail, 'sail.upper', 'mast') < .05 || relativeSpan(sail, 'sail.lower', 'mast') < .1)
      throw new Error('Naval sailing is missing articulated sail shape');
    if (relativeSpan(fire, 'weapon', 'hull') < .08 || relativeSpan(fire, 'weapon.L', 'weapon') < .1 || relativeSpan(fire, 'weapon.R', 'weapon') < .1)
      throw new Error('Naval firing is missing independent weapon flex');
    if (bonePoint(sink[0]!, 'hull', 'head')[2]! - bonePoint(sink[7]!, 'hull', 'head')[2]! < 1 || relativeSpan(sink, 'hull', 'hull') < .15)
      throw new Error('Naval sinking is missing a lowering and tilting hull');
  }
}

/** Hash-checks retained original source; never executes it, approves it or activates a brief. */
export async function importBlenderUnitSource(root: string, assetId: string, version: number) {
  const role = z.enum(BATTLE_UNIT_ROLES).parse(assetId.replace(/^battle\.unit\./, ''));
  if (assetId !== `battle.unit.${role}`) throw new Error('Invalid battle role ID');
  z.number().int().min(1).max(999).parse(version);
  const base = `assets/art/source/blender-units/${assetId}/v${version}`;
  const read = async (path: string) => {
    const full = await safeAssetPath(root, path), info = await stat(full);
    if (!info.isFile() || info.size > 64 * 1024 * 1024) throw new Error('Blender source exceeds bounded file size');
    return readFile(full);
  };
  const manifestPath = `${base}/manifest.json`, manifestBytes = await read(manifestPath);
  const source = sourceSchema.parse(JSON.parse(manifestBytes.toString()));
  if (source.id !== assetId || source.contentId !== `unit.${role}` || source.version !== version) throw new Error('Blender unit source identity mismatch');
  const large = ['cavalry', 'lancer', 'transport', 'coastal_warship', 'ocean_warship'].includes(role), naval = ['transport', 'coastal_warship', 'ocean_warship'].includes(role);
  const size = large ? 96 : 64, pivot = large ? [48, 80] : [32, 56];
  if (source.nativeResolution.width !== size || source.nativeResolution.height !== size || String(source.pivot) !== String(pivot)) throw new Error('Battle role native resolution/pivot mismatch');
  const expected = { idle: { frames: 4, durationMs: 200, loop: true }, [naval ? 'sail' : 'walk']: { frames: 8, durationMs: 100, loop: true },
    [naval ? 'fire' : 'attack']: { frames: 8, durationMs: 100, loop: false }, hit: { frames: 4, durationMs: 100, loop: false }, [naval ? 'sink' : 'death']: { frames: 8, durationMs: 100, loop: false } };
  if (cacheKey(source.clips) !== cacheKey(expected)) throw new Error('Battle role clip contract mismatch');
  const paletteBytes = await read('assets/palettes/theandril-master.json');
  if (source.paletteHash !== sha256(paletteBytes)) throw new Error('Blender unit palette hash mismatch');
  const palette = paletteSchema.parse(JSON.parse(paletteBytes.toString()));
  const files = new Map(source.files.map(file => [file.path, file]));
  if (files.size !== source.files.length || source.files.reduce((sum, file) => sum + file.bytes, 0) > 256 * 1024 * 1024) throw new Error('Duplicate or oversized source inventory');
  for (const required of ['source.blend', 'profile.json', 'recipe.py', 'driver.py', 'build.py', 'render-settings.json', 'validation.json', 'palette.json'])
    if (!files.has(required)) throw new Error(`Missing retained Blender unit evidence: ${required}`);
  const bytes = new Map<string, Buffer>();
  for (const file of source.files) {
    const actual = await read(`${base}/${file.path}`);
    if (actual.length !== file.bytes || sha256(actual) !== file.sha256) throw new Error(`Blender unit source hash mismatch: ${file.path}`);
    bytes.set(file.path, actual);
  }
  const settings = settingsSchema.parse(JSON.parse(bytes.get('render-settings.json')!.toString()));
  if (settings.meshObjects !== settings.weightedMeshes || String(settings.pivot) !== String(pivot) || String(settings.nativeResolution) !== `${size},${size}`)
    throw new Error('Blender rig weights or camera registration mismatch');
  if (new Set(source.frames.map(frame => frame.path)).size !== 64 || new Set(source.frames.map(frame => frame.rawPath)).size !== 64
    || source.frames.some(frame => files.get(frame.path)?.sha256 !== frame.sha256 || !files.has(frame.rawPath)
      || distance([frame.anchor.x, frame.anchor.y], pivot) > .0001)) throw new Error('Blender unit frames or pivot disagree with retained inventory');
  if (naval) validateNavalArticulation(source.frames);
  else if (large) validateMountedArticulation(source.frames);
  else validateFootArticulation(source.frames);
  const images = source.frames.map(frame => decodePng(bytes.get(frame.path)!));
  const prompt = `Original Theandril shared ${role} battle role, authored as editable weighted Blender meshes and bone Actions. Two independently rendered facings and five complete authored clips. Fixed ${size}x${size} camera canvas, ground pivot (${pivot}), palette and full-motion union. Culture identity remains in existing banners and map art. Exact source manifest: ${manifestPath}. No mirrored sprites, synthetic casualty poses or whole-sprite bobbing claimed as articulated animation.`;
  const inputHash = sha256(manifestBytes);
  const brief = parseAssetManifest({ schemaVersion: 1, id: assetId, version, type: 'unit', status: 'BRIEF_READY', nativeResolution: source.nativeResolution,
    paletteId: palette.id, contentIds: [assetId], prompt,
    frames: source.frames.map(frame => ({ id: `${assetId}/${frame.state}/${frame.direction}/${frame.index}`, state: frame.state, direction: frame.direction, index: frame.index,
      durationMs: frame.durationMs, pivot, sourcePath: `${base}/${frame.path}` })),
    animation: { states: Object.fromEntries(Object.entries(source.clips).map(([state, clip]) => [state, { frames: clip.frames, fps: 1000 / clip.durationMs, loop: clip.loop }])) },
    provenance: { provider: 'blender-art-factory', model: source.blenderVersion, promptHash: sha256(prompt),
      sourceRefs: [manifestPath, ...['source.blend', 'profile.json', 'recipe.py', 'driver.py', 'render-settings.json'].map(path => `${base}/${path}`)],
      licenseNotes: ['Original project-authored geometry, rig, materials and actions; retained factory dependencies and every raw/native render are bound by the source manifest inventory. Shared mechanical-role artwork does not claim new culture-specific originals. Native and runtime visual acceptance remain separate.'] },
    createdAt: new Date(source.createdAt).toISOString(), referenceHashes: [inputHash, source.paletteHash],
    processing: [{ tool: 'blender-art-factory', version: source.blenderVersion, profile: `articulated-battle-${size}`, settingsHash: files.get('profile.json')!.sha256,
      inputHash, outputHash: cacheKey(source.frames.map(frame => frame.sha256)) }], validation: null, review: null,
    constraints: { transparentPadding: 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: size, requireMotion: true, terrain: 'none' },
  });
  sourceClips(brief);
  const validation = validateAsset(brief, images.map((image, index) => ({ id: brief.frames[index]!.id, image })), palette);
  if (!validation.passed) throw new Error(`Blender unit native validation failed: ${validation.errors.join('; ')}`);
  return { brief, validation, inputHash, manifestPath, approval: false as const, activation: false as const };
}
