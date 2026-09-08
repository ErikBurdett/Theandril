import { buildAtlas, type AtlasBuild, type AtlasOptions } from './atlas';
import { BLENDER_BATTLE_IDS } from './blender-source';
import { parseRuntimeCatalog } from './runtime';

type Inputs = Parameters<typeof buildAtlas>[0];
/** Scene partitioning keeps the approved world page stable as tactical clips grow. */
export function buildSceneAtlases(inputs: Inputs, options: Pick<AtlasOptions, 'pageSize' | 'palette'>) {
  const tactical = new Set<string>(BLENDER_BATTLE_IDS);
  const groups = [
    { id: 'foundation', pageSize: options.pageSize, items: inputs.filter(item => !tactical.has(item.manifest.id)) },
    { id: 'battle', pageSize: 1024 as const, items: inputs.filter(item => tactical.has(item.manifest.id)) },
  ].filter(group => group.items.length);
  const pages: AtlasBuild[] = groups.map(group => buildAtlas(group.items, { ...options, id: group.id, pageSize: group.pageSize,
    imageUrl: `/art/${group.id}.png`, jsonUrl: `/art/${group.id}.json` }));
  const catalog = parseRuntimeCatalog({ schemaVersion: 1, palette: options.palette, atlases: pages.flatMap(page => page.catalog.atlases), assets: pages.flatMap(page => page.catalog.assets) });
  return { pages, catalog };
}
