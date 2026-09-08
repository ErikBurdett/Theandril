import { z } from 'zod';
import { assetIdSchema, parseRuntimeCatalog, type RuntimeAsset } from './runtime';
import { cropImage, decodePng, MAX_PNG_BYTES, type RgbaImage } from './png';
import { sha256 } from './provenance';

export const ANIMATION_ROLES = ['unit', 'character', 'monster', 'settlement', 'improvement', 'map-prop', 'vfx', 'ui', 'portrait'] as const;
export type AnimationRole = typeof ANIMATION_ROLES[number];
export interface AnimationPlaybackBinding { contentId: string; states: readonly string[] }
export interface AnimationCoverageInput {
  catalog: unknown;
  /** Exact published PNG bytes keyed by catalog atlas ID, not paths or generated candidates. */
  atlasPngs: ReadonlyMap<string, Uint8Array>;
  /** Actual consumer allowlist supplied by the caller; the pipeline imports no renderer/content package. */
  liveBindings: readonly string[];
  /** States actually ticked by current consumers, separate from static frame-zero display. */
  playbackBindings?: readonly AnimationPlaybackBinding[];
}
export interface AnimationRolloutSlot {
  slot: 'idle' | 'move' | 'action';
  phase: 'future-rollout';
  applicability: 'planned' | 'not-applicable' | 'consumer-design-needed';
  candidateStates: string[];
  suggestedFrames: [number, number] | null;
  existingPixelVaryingClipIds: string[];
  needsFrames: boolean;
  note: string;
}
export interface AnimationClipCoverage {
  id: string; state: string; direction: string; loop: boolean;
  frameIds: string[]; durationsMs: number[]; durationMs: number; frameCount: number;
  uniqueVisibleFrames: number; repeatedFrameCount: number;
  pixelEvidence: 'single-still' | 'repeated-still' | 'pixel-varying';
  playbackBound: boolean;
}
export interface AnimationAssetCoverage {
  id: string; type: RuntimeAsset['type']; role: AnimationRole; status: RuntimeAsset['status'];
  usage: 'live' | 'future-only'; contentIds: string[]; liveBindings: string[];
  nativeResolution: RuntimeAsset['nativeResolution']; pivot: [number, number]; atlasId: string;
  frameCount: number; uniqueVisibleFrames: number; animation: 'static' | 'pixel-varying';
  frames: { id: string; rgbaSha256: string; visiblePixelSha256: string }[];
  clips: AnimationClipCoverage[]; rollout: AnimationRolloutSlot[];
}
export interface AnimationCoverageTotals {
  assets: number; frames: number; clips: number; animatedAssets: number; staticAssets: number;
  pixelVaryingClips: number; repeatedStillClips: number; playbackBoundClips: number;
  unusedClips: number; unusedPixelVaryingClips: number; assetsNeedingPlannedFrames: number;
  plannedSlots: number; plannedSlotsNeedingFrames: number; consumerDesignSlots: number;
}
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const playbackSchema = z.array(z.object({ contentId: assetIdSchema, states: z.array(assetIdSchema).min(1).max(32) }).strict()).max(4096);
function roleOf(asset: RuntimeAsset): AnimationRole {
  const ids = [asset.id, ...asset.contentIds];
  if (ids.some(id => id.startsWith('character.'))) return 'character';
  if (ids.some(id => id.startsWith('improvement.'))) return 'improvement';
  if (asset.type === 'map-object') return 'map-prop';
  if (asset.type === 'effect') return 'vfx';
  if (asset.type === 'terrain') throw new Error('Terrain is excluded from sprite animation coverage');
  return asset.type;
}
function rollout(role: AnimationRole, clips: AnimationClipCoverage[]): AnimationRolloutSlot[] {
  const mobile = ['unit', 'character', 'monster'].includes(role);
  const fixed = ['settlement', 'improvement', 'map-prop'].includes(role);
  const slot = (name: AnimationRolloutSlot['slot'], applicability: AnimationRolloutSlot['applicability'], states: string[], frames: [number, number] | null, note: string): AnimationRolloutSlot => {
    const existing = clips.filter(clip => states.includes(clip.state) && clip.pixelEvidence === 'pixel-varying').map(clip => clip.id);
    return { slot: name, phase: 'future-rollout', applicability, candidateStates: states, suggestedFrames: frames,
      existingPixelVaryingClipIds: existing, needsFrames: applicability === 'planned' && existing.length === 0, note };
  };
  return [
    slot('idle', mobile || fixed ? 'planned' : 'consumer-design-needed', ['idle'], mobile ? [4, 6] : [4, 8],
      mobile ? 'Future identity-registered idle; pixel variation alone does not establish breathing, equipment consistency or a good loop.'
        : 'Future restrained ambient detail only where an actual consumer benefits; no movement or gameplay effect is implied.'),
    slot('move', mobile ? 'planned' : 'not-applicable', ['move', 'walk', 'march', 'sail'], mobile ? [6, 8] : null,
      mobile ? 'Future role-appropriate travel with stable ground/water anchor; foot, hoof and hull motion require separate visual review.' : 'Fixed world objects, UI, portraits and impact effects do not require locomotion clips.'),
    slot('action', mobile || role === 'vfx' ? 'planned' : 'consumer-design-needed', ['action', 'attack', 'ranged', 'cast', 'rally', 'work', 'found', 'impact'], mobile || role === 'vfx' ? [6, 10] : null,
      'Future existing-rule action/event hook must be selected per role. This proposal grants no attack, spell or construction capability and does not claim an implemented playback consumer.'),
  ];
}
function total(assets: AnimationAssetCoverage[]): AnimationCoverageTotals {
  const clips = assets.flatMap(asset => asset.clips), slots = assets.flatMap(asset => asset.rollout);
  return { assets: assets.length, frames: assets.reduce((sum, asset) => sum + asset.frameCount, 0), clips: clips.length,
    animatedAssets: assets.filter(asset => asset.animation === 'pixel-varying').length,
    staticAssets: assets.filter(asset => asset.animation === 'static').length,
    pixelVaryingClips: clips.filter(clip => clip.pixelEvidence === 'pixel-varying').length,
    repeatedStillClips: clips.filter(clip => clip.pixelEvidence === 'repeated-still').length,
    playbackBoundClips: clips.filter(clip => clip.playbackBound).length,
    unusedClips: clips.filter(clip => !clip.playbackBound).length,
    unusedPixelVaryingClips: clips.filter(clip => !clip.playbackBound && clip.pixelEvidence === 'pixel-varying').length,
    assetsNeedingPlannedFrames: assets.filter(asset => asset.rollout.some(slot => slot.needsFrames)).length,
    plannedSlots: slots.filter(slot => slot.applicability === 'planned').length,
    plannedSlotsNeedingFrames: slots.filter(slot => slot.needsFrames).length,
    consumerDesignSlots: slots.filter(slot => slot.applicability === 'consumer-design-needed').length };
}

/** Read-only offline inventory. Different visible pixels are evidence, never animation-quality approval. */
export function inspectAnimationCoverage(input: AnimationCoverageInput) {
  const catalog = parseRuntimeCatalog(input.catalog);
  const bindings = z.array(assetIdSchema).max(4096).parse(input.liveBindings);
  if (new Set(bindings).size !== bindings.length) throw new Error('Duplicate live animation binding');
  const live = new Set(bindings), playback = playbackSchema.parse(input.playbackBindings ?? []);
  if (new Set(playback.map(binding => binding.contentId)).size !== playback.length) throw new Error('Duplicate playback binding');
  for (const binding of playback) {
    if (!live.has(binding.contentId)) throw new Error('Playback binding is not a live consumer');
    if (new Set(binding.states).size !== binding.states.length) throw new Error('Duplicate playback state');
  }
  if (!(input.atlasPngs instanceof Map) || input.atlasPngs.size !== catalog.atlases.length) throw new Error('Atlas PNG set differs from catalog');
  const images = new Map<string, RgbaImage>();
  let pngBytes = 0;
  for (const atlas of catalog.atlases) {
    const bytes = input.atlasPngs.get(atlas.id);
    if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_PNG_BYTES || (pngBytes += bytes.byteLength) > 256 * 1024 * 1024) throw new Error(`Missing or oversized published atlas PNG: ${atlas.id}`);
    if (sha256(bytes) !== atlas.sha256) throw new Error(`Missing or mismatched published atlas PNG: ${atlas.id}`);
    const image = decodePng(bytes);
    if (image.width !== atlas.width || image.height !== atlas.height) throw new Error(`Atlas dimensions differ: ${atlas.id}`);
    images.set(atlas.id, image);
  }
  const excludedTerrain = catalog.assets.filter(asset => asset.type === 'terrain' || asset.id.startsWith('terrain.') || asset.contentIds.some(id => id.startsWith('terrain.')))
    .map(asset => ({ id: asset.id, frameCount: asset.frames.length })).sort((a, b) => compare(a.id, b.id));
  const excludedIds = new Set(excludedTerrain.map(asset => asset.id));
  const assets: AnimationAssetCoverage[] = catalog.assets.filter(asset => !excludedIds.has(asset.id)).sort((a, b) => compare(a.id, b.id)).map(asset => {
    const frames = [...asset.frames].sort((a, b) => compare(a.id, b.id)).map(frame => {
      const image = cropImage(images.get(asset.atlasId)!, frame.frame), rgbaSha256 = sha256(image.data);
      // RGB in fully transparent pixels is invisible and cannot constitute motion.
      for (let at = 0; at < image.data.length; at += 4) if (image.data[at + 3] === 0) image.data.fill(0, at, at + 3);
      return { id: frame.id, rgbaSha256, visiblePixelSha256: sha256(image.data) };
    });
    const hashes = new Map(frames.map(frame => [frame.id, frame.visiblePixelSha256]));
    const ids = new Set([asset.id, ...asset.contentIds]);
    const current = bindings.filter(id => ids.has(id)).sort(compare);
    const playedStates = new Set(playback.filter(binding => ids.has(binding.contentId)).flatMap(binding => binding.states));
    const clips: AnimationClipCoverage[] = [...asset.clips].sort((a, b) => compare(a.id, b.id)).map(clip => {
      const uniqueVisibleFrames = new Set(clip.frames.map(id => hashes.get(id)!)).size;
      return { id: clip.id, state: clip.state, direction: clip.direction, loop: clip.loop,
        frameIds: [...clip.frames], durationsMs: [...clip.durationsMs], durationMs: clip.durationsMs.reduce((sum, value) => sum + value, 0),
        frameCount: clip.frames.length, uniqueVisibleFrames, repeatedFrameCount: clip.frames.length - uniqueVisibleFrames,
        pixelEvidence: uniqueVisibleFrames > 1 ? 'pixel-varying' : clip.frames.length > 1 ? 'repeated-still' : 'single-still',
        playbackBound: playedStates.has(clip.state) };
    });
    const role = roleOf(asset);
    return { id: asset.id, type: asset.type, role, status: asset.status, contentIds: [...asset.contentIds].sort(compare),
      usage: current.length ? 'live' : 'future-only', liveBindings: current, nativeResolution: { ...asset.nativeResolution },
      pivot: [...asset.pivot], atlasId: asset.atlasId, frameCount: frames.length,
      uniqueVisibleFrames: new Set(frames.map(frame => frame.visiblePixelSha256)).size,
      animation: clips.some(clip => clip.pixelEvidence === 'pixel-varying') ? 'pixel-varying' : 'static', frames, clips, rollout: rollout(role, clips) };
  });
  const mapped = new Set(catalog.assets.flatMap(asset => [asset.id, ...asset.contentIds]));
  return { schemaVersion: 1 as const, inventoryOnly: true as const, qualityApproval: false as const,
    pixelEvidenceMethod: 'SHA-256 of native RGBA crops; fully transparent RGB normalized only for visible-pixel comparison; no spatial alignment, visual identity or loop judgement.',
    animatedCountMeaning: 'An animatedAssets count means at least one pixel-varying clip, not proof of genuine motion, active gameplay playback or visual acceptance.',
    unusedMeaning: 'No passed live playback binding for this clip state; static frame-zero display and future asset publication are not animation playback.',
    atlases: catalog.atlases.map(atlas => ({ id: atlas.id, sha256: atlas.sha256, width: atlas.width, height: atlas.height })).sort((a, b) => compare(a.id, b.id)),
    summary: { catalogAssets: catalog.assets.length, excludedTerrainAssets: excludedTerrain.length,
      allNonTerrain: total(assets), live: total(assets.filter(asset => asset.usage === 'live')), future: total(assets.filter(asset => asset.usage === 'future-only')),
      byRole: Object.fromEntries(ANIMATION_ROLES.map(role => [role, { live: total(assets.filter(asset => asset.role === role && asset.usage === 'live')), future: total(assets.filter(asset => asset.role === role && asset.usage === 'future-only')) }])) },
    missingLiveBindings: bindings.filter(id => !mapped.has(id)).sort(compare), excludedTerrain, assets };
}
