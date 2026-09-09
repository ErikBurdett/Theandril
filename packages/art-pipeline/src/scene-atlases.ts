import { RESOURCES } from '../../content/src/resources';
import { buildAtlas, type AtlasBuild, type AtlasOptions } from './atlas';
import { BLENDER_BATTLE_IDS, BATTLE_UNIT_IDS } from './blender-source';
import { parseRuntimeCatalog } from './runtime';

type Inputs = Parameters<typeof buildAtlas>[0];
/** Separate growth batches keep the approved world page and its registered settlement fits stable. */
export function buildSceneAtlases(inputs: Inputs, options: Pick<AtlasOptions, 'pageSize' | 'palette'>) {
  const tactical = new Set<string>(BLENDER_BATTLE_IDS);
  const soldiers = new Set<string>(BATTLE_UNIT_IDS);
  const works = new Set([...RESOURCES.flatMap(item => [item.id, item.improvementId]), ...['spring_garden', 'polder', 'grove_archive', 'oreworks', 'tide_observatory'].map(id => `improvement.${id}`), ...['granary', 'workshop', 'market', 'archive', 'harbor'].map(id => `building.${id}`)]);
  const groups = [
    { id: 'foundation', pageSize: options.pageSize, items: inputs.filter(item => !tactical.has(item.manifest.id) && !soldiers.has(item.manifest.id) && !works.has(item.manifest.id)) },
    { id: 'map-works', pageSize: 512 as const, items: inputs.filter(item => works.has(item.manifest.id)) },
    { id: 'battle', pageSize: 1024 as const, items: inputs.filter(item => tactical.has(item.manifest.id)) },
    { id: 'battle-foot', pageSize: 2048 as const, items: inputs.filter(item => soldiers.has(item.manifest.id) && item.manifest.nativeResolution.width === 64) },
    { id: 'battle-mounted', pageSize: 2048 as const, items: inputs.filter(item => soldiers.has(item.manifest.id) && item.manifest.nativeResolution.width === 96) },
  ].filter(group => group.items.length);
  const pages: AtlasBuild[] = groups.map(group => buildAtlas(group.items, { ...options, id: group.id, pageSize: group.pageSize,
    imageUrl: `/art/${group.id}.png`, jsonUrl: `/art/${group.id}.json` }));
  const catalog = parseRuntimeCatalog({ schemaVersion: 1, palette: options.palette, atlases: pages.flatMap(page => page.catalog.atlases), assets: pages.flatMap(page => page.catalog.assets) });
  return { pages, catalog };
}
