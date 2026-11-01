import { z } from 'zod';
import { LANDMARK_KINDS } from './landmarks';

/** Rules 63: relics of the old places. Every landmark kind keeps one thing
 * worth carrying away, brought up by the first hearth to work the landmark's
 * hex and bestowed on a character of the realm, who leads the company it
 * rides with a little better for it. Data only; the simulation finds, holds
 * and counts the relics. */
const id = z.string().regex(/^relic\.[a-z_]+$/);
const name = z.string().min(1).max(60);
const description = z.string().min(1).max(300);
const bonus = z.number().int().min(0).max(3);
export const relicSchema = z.object({ id, name, description, landmarkKindId: z.string().regex(/^landmark\.[a-z_]+$/), leadership: z.object({ attack: bonus, armor: bonus }).strict(), sinceRules: z.literal(63) }).strict();
export type RelicDefinition = z.infer<typeof relicSchema>;
const relic = (id: string, landmarkKindId: string, name: string, description: string, attack: number, armor: number): RelicDefinition => ({ id, name, description, landmarkKindId, leadership: { attack, armor }, sinceRules: 63 });

/** Sealed packs hash this order; one relic for each landmark kind. */
export const RELICS: readonly RelicDefinition[] = [
  relic('relic.witness_step', 'landmark.witness_stair', 'The Witness Step', 'A step of the stair with its bargain intact, carried on a litter; companies keep their word under it.', 1, 1),
  relic('relic.causeway_stone', 'landmark.drowned_causeway', 'The Causeway Stone', 'A paving stone of the road the sea took, dry to the touch in any weather.', 0, 2),
  relic('relic.first_firebrick', 'landmark.first_kiln', 'The First Firebrick', 'A brick from the oldest kiln, still warm; the smiths who march with it work faster.', 2, 0),
  relic('relic.glass_fruit', 'landmark.glass_orchard', 'The Glass Fruit', 'A stone pear from the glassed orchard, cold and heavy, that catches the light at dawn.', 1, 1),
  relic('relic.council_bough', 'landmark.hollow_oak', 'The Council Bough', 'A bough of the hollow oak cut when a council ended in peace; officers argue less beneath it.', 0, 2),
  relic('relic.salt_measure', 'landmark.salt_stair', 'The Salt Measure', 'The bronze measure of the salt terraces; provisions keep better in its company.', 1, 1),
  relic('relic.cairn_coin', 'landmark.ash_cairn', 'The Cairn Coin', 'The first coin ever left at the cairn, worn smooth; nobody who carries it leaves the field first.', 2, 0),
  relic('relic.silent_millstone', 'landmark.silent_mill', 'The Silent Millstone', 'A hand-sized stone from the mill that turns by itself; it does not stop either.', 1, 1),
  relic('relic.lantern_resin', 'landmark.lanternwood', 'The Lantern Resin', 'A lump of white resin from the Lanternwood that lights a camp without smoke.', 0, 2),
  relic('relic.bell_clapper', 'landmark.tide_bell', 'The Bell Clapper', 'The clapper of the Tide Bell, which still rings at the turn of the tide wherever it is.', 1, 2),
  relic('relic.boundary_stone', 'landmark.old_boundary', 'The Boundary Stone', 'The smallest stone of the old line, which no one has ever moved by force.', 0, 3),
  relic('relic.ember_cup', 'landmark.ember_spring', 'The Ember Cup', 'A cup of the hot spring’s mud, fired; water drunk from it mends.', 1, 1),
  relic('relic.court_gavel', 'landmark.sunken_court', 'The Court Gavel', 'The gavel of the sunken court, whose stroke was obeyed.', 2, 1),
  relic('relic.warden_glass', 'landmark.warden_tower', 'The Warden Glass', 'The far-seeing glass of the tower; a company sees its enemy a day sooner.', 2, 0),
  relic('relic.whale_tooth', 'landmark.whale_road', 'The Whale Tooth', 'A tooth from the first great fish beached on the road, carved with the shelf.', 1, 1),
  relic('relic.ash_vintage', 'landmark.ash_vineyard', 'The Ash Vintage', 'A sealed jar of the first vintage of the ash vines; opened only before a battle.', 2, 0),
  relic('relic.bog_lantern', 'landmark.singing_bog', 'The Bog Lantern', 'A lantern that hums the bog’s note; sentries do not sleep near it.', 0, 2),
  relic('relic.ironwood_haft', 'landmark.ironwood_stand', 'The Ironwood Haft', 'A spear haft of ironwood that has never broken.', 1, 2),
  relic('relic.reef_pearl', 'landmark.lantern_reef', 'The Reef Pearl', 'A pearl from the glowing reef that is never quite dark.', 1, 1),
  relic('relic.hermit_tablet', 'landmark.hermit_cells', 'The Hermit Tablet', 'A scratched tablet from the cells, read a hundred ways; every reading counsels patience.', 0, 3),
  relic('relic.ford_marker', 'landmark.old_ford', 'The Ford Marker', 'The marker stone of the old ford; a company that carries it finds the crossing.', 2, 0),
  relic('relic.lens_shard', 'landmark.glass_lens', 'The Lens Shard', 'A shard of the glass lens through which the ground shows warm; scouts read it in winter.', 1, 1),
  relic('relic.drum_stone', 'landmark.drum_hill', 'The Drum Stone', 'A stone of the hollow hill that sounds when struck; companies keep step to it.', 1, 2),
  relic('relic.wreck_figurehead', 'landmark.wreck_strand', 'The Wreck Figurehead', 'A figurehead the sea gave back whole; its company is not easily given up.', 0, 3),
];
export const relicsForRules = (version: number): readonly RelicDefinition[] => RELICS.filter(item => item.sinceRules <= version);
export const relicDefinition = (relicId: string): RelicDefinition | undefined => RELICS.find(item => item.id === relicId);
export const relicOfLandmarkKind = (landmarkKindId: string, version = 63): RelicDefinition | undefined => relicsForRules(version).find(item => item.landmarkKindId === landmarkKindId);

export function validateRelicContent(relics = RELICS): void {
  relics.forEach(item => relicSchema.parse(item));
  const ids = relics.map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate relic ID');
  for (const item of relics) {
    if (!LANDMARK_KINDS.some(kind => kind.id === item.landmarkKindId)) throw new Error('A relic names a landmark kind of the catalogue: ' + item.id);
    if (!item.leadership.attack && !item.leadership.armor) throw new Error('A relic leads somewhere: ' + item.id);
  }
  for (const kind of LANDMARK_KINDS) if (!relics.some(item => item.landmarkKindId === kind.id)) throw new Error('Every landmark kind keeps a relic: ' + kind.id);
}
