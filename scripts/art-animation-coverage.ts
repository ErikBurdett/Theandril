import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LIVE_ART_IDS } from '../packages/render/src/art';
import { inspectAnimationCoverage, type AnimationPlaybackBinding } from '../packages/art-pipeline/src/animation-coverage';
import { parseRuntimeCatalog } from '../packages/art-pipeline/src/runtime';
import { safeAssetPath, sha256 } from '../packages/art-pipeline/src/provenance';

const root = fileURLToPath(new URL('../', import.meta.url));
export interface AnimationInventoryOptions { catalogPath?: string; atlasDirectory?: string }
async function boundedRead(path: string, limit: number) {
  const resolved = await safeAssetPath(root, path), info = await stat(resolved);
  if (!info.isFile() || info.size > limit) throw new Error(`Inventory input exceeds supported size: ${path}`);
  const bytes = await readFile(resolved);
  if (bytes.byteLength > limit) throw new Error(`Inventory input grew beyond supported size: ${path}`);
  return bytes;
}

/** Read only: no source generation, preparation, candidate promotion, file writes or approval. */
export async function animationInventory(options: AnimationInventoryOptions = {}) {
  const catalogPath = options.catalogPath ?? 'apps/web/public/art/catalog.json';
  const atlasDirectory = options.atlasDirectory ?? 'apps/web/public/art';
  const bytes = await boundedRead(catalogPath, 8 * 1024 * 1024);
  const catalog = parseRuntimeCatalog(JSON.parse(bytes.toString('utf8')));
  const atlasPngs = new Map<string, Uint8Array>();
  for (const atlas of catalog.atlases) {
    const relative = atlas.imageUrl.slice('/art/'.length);
    atlasPngs.set(atlas.id, await boundedRead(`${atlasDirectory}/${relative}`, 64 * 1024 * 1024));
  }
  // Current renderer: near visible army/town/ruin entities and visible improvement
  // props tick idle only; reduced motion/far LOD freeze them. Character/heraldry DOM
  // cards display a still. This is an explicit consumer contract, not an inference
  // that publishing an arbitrary clip makes it play. Update with consumer changes.
  const playbackBindings: AnimationPlaybackBinding[] = [...LIVE_ART_IDS].filter(id =>
    id.startsWith('unit.') || id.startsWith('settlement.') || id.startsWith('improvement.') || id === 'map.ruin')
    .map(contentId => ({ contentId, states: ['idle'] }));
  const consumerSources = await Promise.all(['packages/render/src/art.ts', 'packages/render/src/index.ts', 'apps/web/src/faction-art.tsx'].map(async path => ({ path, sha256: sha256(await readFile(await safeAssetPath(root, path))) })));
  return { source: { catalogPath, catalogSha256: sha256(bytes), atlasDirectory, consumerSources,
    consumerContract: 'LIVE_ART_IDS current map/UI/fallback allowlist; idle-only near entity and currently visible improvement playback. Reduced motion, fogged props and far LOD are static. DOM character/heraldic cards do not tick. No move/action playback consumer is claimed.' },
    ...inspectAnimationCoverage({ catalog, atlasPngs, liveBindings: [...LIVE_ART_IDS], playbackBindings }) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Map<string, string>();
  for (const argument of process.argv.slice(2)) {
    const match = /^--(catalog|atlas-root)=(.+)$/.exec(argument);
    if (argument === '--summary') { if (args.has('summary')) throw new Error('Duplicate --summary'); args.set('summary', 'true'); }
    else if (match && !args.has(match[1]!)) args.set(match[1]!, match[2]!);
    else throw new Error('Usage: node --import tsx scripts/art-animation-coverage.ts [--catalog=relative/catalog.json] [--atlas-root=relative/directory] [--summary]');
  }
  const report = await animationInventory({ catalogPath: args.get('catalog'), atlasDirectory: args.get('atlas-root') });
  console.log(JSON.stringify(args.has('summary') ? { ...report, assets: undefined,
    multiframeClips: report.assets.flatMap(asset => asset.clips.filter(clip => clip.frameCount > 1).map(clip => ({ assetId: asset.id, role: asset.role, usage: asset.usage, ...clip }))) } : report, null, 2));
}
