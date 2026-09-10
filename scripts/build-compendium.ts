import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  ARCANE_DISCOVERIES, BATTLE_SPELLS, BIOME_YIELDS, BUILDINGS, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS,
  DOCTRINES, FACTIONS, FACTION_ECOLOGIES, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, FACTION_ROSTERS, IMPROVEMENTS,
  INNATE_BATTLE_ABILITIES, INSTITUTIONS, LAND_MILITARY_UNIT_IDS, MAGIC_PATHS, NATURAL_FEATURES, RESOURCES, TECHNOLOGIES, UNITS,
} from '../packages/content/src/index';
import { BIOME_NAMES } from '../packages/mapgen/src/index';

type CatalogAsset = { id: string; type: string; atlasId: string; nativeResolution: { width: number; height: number }; frames: { direction?: string; state?: string; index?: number; frame: { x: number; y: number; w: number; h: number } }[]; provenance?: { provider?: string } };
type Catalog = { atlases: { id: string; imageUrl: string; width: number; height: number }[]; assets: CatalogAsset[] };
const root = resolve(import.meta.dirname, '..');
const biomeNames = [...BIOME_NAMES];
const asData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function compactAsset(asset: CatalogAsset) {
  const frame = [...asset.frames].sort((a, b) => Number(a.state !== 'idle') - Number(b.state !== 'idle') || Number(a.direction !== 'se') - Number(b.direction !== 'se') || (a.index ?? 0) - (b.index ?? 0))[0];
  return frame && { id: asset.id, atlasId: asset.atlasId, nativeResolution: asset.nativeResolution, frame: frame.frame, provenance: asset.provenance?.provider ?? 'not recorded' };
}

/** Projection only: source values remain in @theandril/content and catalog.json. */
export async function buildCompendiumData(): Promise<Record<string, unknown>> {
  const catalog = JSON.parse(await readFile(resolve(root, 'apps/web/public/art/catalog.json'), 'utf8')) as Catalog;
  const wanted = new Set<string>([
    ...FACTIONS.flatMap(faction => {
      const culture = faction.id.replace('faction.', '');
      return ['guard', 'spearman', 'scout', 'heavy_infantry', 'cavalry', 'colonist', 'transport', 'coastal_warship', 'ocean_warship'].map(role => `unit.${role}.${culture}`)
        .concat(['marshal', 'surveyor', 'engineer'].map(role => `character.${role}.${culture}`), ['village', 'town', 'city'].map(role => `settlement.${role}.${culture}`), ['crest', 'banner', 'badge'].map(role => `ui.${role}.${culture}`));
    }),
    ...UNITS.map(unit => `battle.${unit.id}`), ...BUILDINGS.map(item => item.id), ...IMPROVEMENTS.map(item => item.id), ...RESOURCES.map(item => item.id),
    ...NATURAL_FEATURES.map(item => item.id), ...catalog.assets.filter(asset => asset.id.startsWith('monster.')).map(asset => asset.id),
    'character.waykeeper', 'map.resource', 'map.ruin', 'map.watchtower', 'settlement.village', 'settlement.town', 'settlement.city',
    ...biomeNames.map((_, id) => `terrain.${['ocean', 'grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine', 'ash_scrub', 'chalkland'][id]}`),
  ]);
  const assets = Object.fromEntries(catalog.assets.filter(asset => wanted.has(asset.id)).map(asset => [asset.id, compactAsset(asset)]).filter((entry): entry is [string, NonNullable<ReturnType<typeof compactAsset>>] => Boolean(entry[1])));
  return asData({
    generatedFrom: { content: '@theandril/content', catalog: 'apps/web/public/art/catalog.json' },
    atlases: catalog.atlases.map(({ id, imageUrl, width, height }) => ({ id, imageUrl, width, height })), assets,
    biomes: biomeNames.map((name, id) => ({ id, name, yields: BIOME_YIELDS[id] })),
    factions: FACTIONS.map(faction => ({ ...faction, profile: FACTION_PROFILES[faction.id], recruitmentWeights: FACTION_RECRUITMENT_WEIGHTS[faction.id], ecology: FACTION_ECOLOGIES[faction.id] })),
    factionRosters: FACTION_ROSTERS, landMilitaryUnitIds: LAND_MILITARY_UNIT_IDS,
    units: UNITS, buildings: BUILDINGS, improvements: IMPROVEMENTS, features: NATURAL_FEATURES, resources: RESOURCES,
    technologies: TECHNOLOGIES, institutions: INSTITUTIONS, doctrines: DOCTRINES, characters: CHARACTER_DEFINITIONS,
    missions: CHARACTER_MISSIONS, skills: CHARACTER_SKILLS, magicPaths: MAGIC_PATHS, battleSpells: BATTLE_SPELLS,
    arcaneDiscoveries: ARCANE_DISCOVERIES, innateBattleAbilities: INNATE_BATTLE_ABILITIES,
  });
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const output = resolve(root, 'apps/web/src/updates/compendium/data.json');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(await buildCompendiumData(), null, 2)}\n`);
  console.log(`Wrote ${output}`);
}
