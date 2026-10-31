import { z } from 'zod';

/** Rules 51: landmarks. The Ashfall left the world a few places worth
 * remembering — a stair the Witnesses cut, a causeway the sea took back, the
 * kiln of a hearth older than any realm. Where they lie is a property of the
 * world, derived from its seed like the seams; a realm sees one as soon as it
 * explores its hex, and a hearth that claims and works the hex draws the
 * landmark's yield with the land's. Nothing is stored in a save. */
const id = z.string().regex(/^landmark\.[a-z_]+$/);
const name = z.string().min(1).max(60);
const description = z.string().min(1).max(300);
const bonus = z.number().int().min(0).max(6);
const yields = z.object({ food: bonus, industry: bonus, coin: bonus, knowledge: bonus }).strict();
/** Plains 1, forest 2, hills 3 of the physical terrain table. */
const terrain = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const landmarkKindSchema = z.object({ id, name, description, terrains: z.array(terrain).min(1).max(3), coastal: z.boolean(), yields, sinceRules: z.literal(51) }).strict();
export type LandmarkKind = z.infer<typeof landmarkKindSchema>;
const y = (food: number, industry: number, coin: number, knowledge: number) => ({ food, industry, coin, knowledge });

/** Sealed packs hash this order; append new kinds. */
export const LANDMARK_KINDS: readonly LandmarkKind[] = [
  { id: 'landmark.witness_stair', name: 'The Witness Stair', description: 'A stair cut into the hillside by the Witnesses of the roads, each step carved with a bargain nobody now can read.', terrains: [3], coastal: false, yields: y(0, 0, 1, 3), sinceRules: 51 },
  { id: 'landmark.drowned_causeway', name: 'The Drowned Causeway', description: 'A paved road that runs into the sea and, the fishers say, out the other side.', terrains: [1, 2], coastal: true, yields: y(2, 0, 2, 0), sinceRules: 51 },
  { id: 'landmark.first_kiln', name: 'The First Kiln', description: 'A kiln older than any realm, its firebrick still warm to the hand on cold mornings.', terrains: [1, 3], coastal: false, yields: y(0, 3, 1, 0), sinceRules: 51 },
  { id: 'landmark.glass_orchard', name: 'The Glass Orchard', description: 'An orchard the Ashfall glassed in bloom; the fruit is stone, but the ground around it is the richest in the valley.', terrains: [1], coastal: false, yields: y(3, 0, 0, 1), sinceRules: 51 },
  { id: 'landmark.hollow_oak', name: 'The Hollow Oak', description: 'An oak wide enough to hold a council inside it, and councils have been held there.', terrains: [2], coastal: false, yields: y(1, 1, 0, 2), sinceRules: 51 },
  { id: 'landmark.salt_stair', name: 'The Salt Stair', description: 'Terraces of white salt descending to a bay, worked by whoever holds the shore.', terrains: [1, 3], coastal: true, yields: y(1, 0, 3, 0), sinceRules: 51 },
  { id: 'landmark.ash_cairn', name: 'The Ash Cairn', description: 'A cairn of fused ash and bone raised over the first dead of the Ashfall; pilgrims leave coin.', terrains: [3], coastal: false, yields: y(0, 0, 2, 2), sinceRules: 51 },
  { id: 'landmark.silent_mill', name: 'The Silent Mill', description: 'A watermill that still turns, though no one tends it and nothing is ground.', terrains: [1, 2], coastal: false, yields: y(1, 2, 1, 0), sinceRules: 51 },
  { id: 'landmark.lanternwood', name: 'The Lanternwood', description: 'A wood whose resin burns white; its lanterns light every hearth that can reach it.', terrains: [2], coastal: false, yields: y(0, 2, 2, 0), sinceRules: 51 },
  { id: 'landmark.tide_bell', name: 'The Tide Bell', description: 'A bronze bell hung in a sea cave that rings itself at the turn of each tide.', terrains: [2, 3], coastal: true, yields: y(1, 0, 1, 2), sinceRules: 51 },
  { id: 'landmark.old_boundary', name: 'The Old Boundary', description: 'A line of standing stones that once marked a border nobody remembers; land on both sides of it is claimed with care.', terrains: [1, 2, 3], coastal: false, yields: y(1, 1, 1, 1), sinceRules: 51 },
  { id: 'landmark.ember_spring', name: 'The Ember Spring', description: 'A hot spring that steams in every season; its basin never freezes and its mud mends.', terrains: [1, 3], coastal: false, yields: y(2, 1, 0, 1), sinceRules: 51 },
];
export const landmarkKindsForRules = (version: number): readonly LandmarkKind[] => LANDMARK_KINDS.filter(kind => kind.sinceRules <= version);
export const landmarkKind = (kindId: string): LandmarkKind | undefined => LANDMARK_KINDS.find(kind => kind.id === kindId);

export function validateLandmarkContent(kinds = LANDMARK_KINDS): void {
  kinds.forEach(kind => landmarkKindSchema.parse(kind));
  const ids = kinds.map(kind => kind.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate landmark ID');
  for (const kind of kinds) {
    if (new Set(kind.terrains).size !== kind.terrains.length) throw new Error('A landmark names each terrain once: ' + kind.id);
    if (Object.values(kind.yields).every(value => value === 0)) throw new Error('A landmark yields something: ' + kind.id);
  }
  for (const terrainId of [1, 2, 3] as const) for (const coastal of [false, true]) {
    if (!kinds.some(kind => kind.terrains.includes(terrainId) && (!kind.coastal || coastal))) throw new Error(`No landmark fits ${coastal ? 'coastal ' : ''}terrain ${terrainId}`);
  }
}
