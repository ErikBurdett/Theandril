import { z } from 'zod';
const biomes = ['ocean', 'grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine', 'ash_scrub', 'chalkland'] as const;
export const biomeSourceSchema = z.object({
  id: z.string().refine(id => biomes.some(name => [1, 2].some(variant => id === `terrain.${name}.variant_${variant}`)), 'Unregistered terrain variant'),
  version: z.number().int().min(1).max(99), sourcePath: z.string(), sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  prompt: z.string().min(1).max(20000), provider: z.literal('codex-imagegen'), model: z.literal('not-exposed-by-tool'),
  seed: z.null(), generatedAt: z.iso.datetime(),
}).strict().refine(source => source.sourcePath === `assets/art/source/biome-variants/${source.id}-v${source.version}.png`, 'Source path must identify the retained original');
export const biomeSourcesSchema = z.array(biomeSourceSchema).max(24);
