import { z } from 'zod';
import { EPOCHS } from './epochs';

/** Rules 53: crises of the ages. When the world enters an age after the
 * first, one of that age's crises is drawn from the campaign seed and stands
 * for a term, taking a toll of every unsheltered hearth each turn — stored
 * food, coin, knowledge or the hearth's fabric. A realm may shelter its
 * hearths once, for a price per hearth, and the toll passes them by for the
 * rest of the term. Crises are original and data-driven; the simulation
 * draws, applies and ends them from its own state. */
const id = z.string().regex(/^crisis\.[a-z_]+$/);
const name = z.string().min(1).max(60);
const text = z.string().min(1).max(400);
const toll = z.number().int().min(0).max(10);
/** What every unsheltered hearth loses each turn; devastation is added to the hearth, coin and knowledge come off the realm per hearth. */
export const crisisBlightSchema = z.object({ food: toll, coin: toll, knowledge: toll, devastation: toll }).strict();
export type CrisisBlight = z.infer<typeof crisisBlightSchema>;
export const crisisSchema = z.object({
  id, name, description: text, epoch: z.string().regex(/^epoch\.[a-z_]+$/), turns: z.number().int().min(4).max(40),
  blight: crisisBlightSchema, shelterCoinPerHearth: z.number().int().min(1).max(200), shelter: text, sinceRules: z.literal(53),
}).strict();
export type CrisisDefinition = z.infer<typeof crisisSchema>;
const blight = (changes: Partial<CrisisBlight>): CrisisBlight => ({ food: 0, coin: 0, knowledge: 0, devastation: 0, ...changes });

/** Sealed packs hash this order; append new crises. Two per age after the first. Terms
 * are short: measured at ten and twelve turns the crises of the first two ages moved the
 * Epic headline campaign to 429; at these terms it ends inside its band. Shelter is priced
 * at about two-thirds of the term's toll, so a realm with the coin has a real choice
 * ([ADR 0083](../../../docs/architecture/0083-crises.md)). */
export const CRISES: readonly CrisisDefinition[] = [
  { id: 'crisis.grey_winter', name: 'The Grey Winter', epoch: 'epoch.roads', turns: 5, sinceRules: 53,
    description: 'A winter that does not break. The passes close early, the roads carry nothing, and every hearth eats from its stores.',
    blight: blight({ food: 2 }), shelterCoinPerHearth: 10, shelter: 'Buy grain on the roads and lay it in before the passes close; the hearths eat through the winter.' },
  { id: 'crisis.toll_wars', name: 'The Toll Wars', epoch: 'epoch.roads', turns: 5, sinceRules: 53,
    description: 'The wardens of the roads fall out over who may take a toll, and every cart pays twice until it is settled.',
    blight: blight({ coin: 3 }), shelterCoinPerHearth: 10, shelter: 'Buy the wardens’ peace with one payment and the realm’s carts pass free.' },
  { id: 'crisis.glass_fever', name: 'The Glass Fever', epoch: 'epoch.seams', turns: 6, sinceRules: 53,
    description: 'A fever follows the seam rumours up the roads and into the archives; the clerks who read the most fall first.',
    blight: blight({ knowledge: 3 }), shelterCoinPerHearth: 18, shelter: 'Pay the surgeons and close the archives to the sick; the clerks keep their work.' },
  { id: 'crisis.tremors', name: 'The Tremors', epoch: 'epoch.seams', turns: 4, sinceRules: 53,
    description: 'The ground under the glass moves at night. Walls crack, cisterns drain, and no hearth is sure of its footing.',
    blight: blight({ devastation: 1 }), shelterCoinPerHearth: 6, shelter: 'Shore every wall and cistern before the ground moves again; the hearths stand.' },
  { id: 'crisis.fever_of_the_end', name: 'The Fever of the End', epoch: 'epoch.bids', turns: 5, sinceRules: 53,
    description: 'With a bid for the world’s future open, every merchant hoards and every market empties; the coin goes to ground.',
    blight: blight({ coin: 4 }), shelterCoinPerHearth: 14, shelter: 'Guarantee the markets from the treasury and the merchants trade on.' },
  { id: 'crisis.long_dark', name: 'The Long Dark', epoch: 'epoch.bids', turns: 5, sinceRules: 53,
    description: 'Ash on the wind blots the sun for a season; the fields yield and rot in the same week.',
    blight: blight({ food: 3 }), shelterCoinPerHearth: 15, shelter: 'Bring the harvest under cover and salt what can be salted; the stores hold.' },
];
export const crisesForRules = (version: number): readonly CrisisDefinition[] => CRISES.filter(crisis => crisis.sinceRules <= version);
export const crisisDefinition = (crisisId: string): CrisisDefinition | undefined => CRISES.find(crisis => crisis.id === crisisId);
export const CRISIS_BLIGHT_KEYS = ['food', 'coin', 'knowledge', 'devastation'] as const;

export function validateCrisisContent(crises = CRISES): void {
  crises.forEach(crisis => crisisSchema.parse(crisis));
  const ids = crises.map(crisis => crisis.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate crisis ID');
  for (const crisis of crises) {
    if (!EPOCHS.some(epoch => epoch.id === crisis.epoch)) throw new Error('A crisis names an age of the catalogue: ' + crisis.id);
    if (crisis.epoch === EPOCHS[0]!.id) throw new Error('The first age brings no crisis: ' + crisis.id);
    if (CRISIS_BLIGHT_KEYS.every(key => !crisis.blight[key])) throw new Error('A crisis takes something: ' + crisis.id);
  }
  for (const epoch of EPOCHS.slice(1)) if (!crises.some(crisis => crisis.epoch === epoch.id)) throw new Error('Every age after the first has a crisis: ' + epoch.id);
}
