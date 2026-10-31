import { z } from 'zod';

/** Rules 49: campaign epochs. The world passes through named ages in order,
 * each begun when a fact of the world holds — enough hearths ever founded for
 * the realms, a seam found, a public bid opened — or, for the earlier ages,
 * when the campaign has run long enough for its pace. Every fact only grows,
 * so an age never ends and the age is read from the world rather than kept:
 * no save records it and no replay can disagree about it. Ages gate which
 * hearth events may be drawn and title the chronicle's chapters; they change
 * no price and no rule of their own. */
const id = z.string().regex(/^epoch\.[a-z_]+$/);
const name = z.string().min(1).max(60);
const description = z.string().min(1).max(400);
const turns = z.object({ short: z.number().int().min(1), standard: z.number().int().min(1), long: z.number().int().min(1), epic: z.number().int().min(1) }).strict();
export const epochConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('start') }).strict(),
  z.object({ kind: z.literal('hearths'), perRealm: z.number().int().min(1).max(10), orTurn: turns }).strict(),
  z.object({ kind: z.literal('seamFound'), orTurn: turns }).strict(),
  z.object({ kind: z.literal('projectStarted') }).strict(),
]);
export const epochSchema = z.object({ id, name, description, condition: epochConditionSchema, sinceRules: z.literal(49) }).strict();
export type EpochCondition = z.infer<typeof epochConditionSchema>;
export type EpochDefinition = z.infer<typeof epochSchema>;

/** Sealed packs hash this order; the first age is the start and the rest begin in order. */
export const EPOCHS: readonly EpochDefinition[] = [
  { id: 'epoch.fracture', name: 'The Age of Fracture', description: 'The Witness Roads have failed and distant bargains no longer bind the hearthlands. Scattered hearths set their claims upon the land.', condition: { kind: 'start' }, sinceRules: 49 },
  { id: 'epoch.roads', name: 'The Age of Roads', description: 'The hearthlands are settled wide enough that roads, charters and tolls bind them again, and what one hearth does is felt at the next.', condition: { kind: 'hearths', perRealm: 2, orTurn: { short: 12, standard: 50, long: 70, epic: 90 } }, sinceRules: 49 },
  { id: 'epoch.seams', name: 'The Age of Seams', description: 'A seam has been found under the Ashfall glass, and what lies there is known to the world: the roads carry rumours of it, and pilgrims.', condition: { kind: 'seamFound', orTurn: { short: 24, standard: 110, long: 160, epic: 210 } }, sinceRules: 49 },
  { id: 'epoch.bids', name: 'The Age of Bids', description: 'A public bid for the world’s future is open. Every realm knows the campaign will end, and every hearth feels the fever of it.', condition: { kind: 'projectStarted' }, sinceRules: 49 },
];
export const epochsForRules = (version: number): readonly EpochDefinition[] => EPOCHS.filter(epoch => epoch.sinceRules <= version);
export const epochIndexOf = (epochId: string): number => EPOCHS.findIndex(epoch => epoch.id === epochId);

export function validateEpochContent(epochs = EPOCHS): void {
  epochs.forEach(epoch => epochSchema.parse(epoch));
  const ids = epochs.map(epoch => epoch.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate epoch ID');
  if (!epochs.length || epochs[0]!.condition.kind !== 'start') throw new Error('The first epoch is the start');
  if (epochs.slice(1).some(epoch => epoch.condition.kind === 'start')) throw new Error('Only the first epoch is the start');
}
