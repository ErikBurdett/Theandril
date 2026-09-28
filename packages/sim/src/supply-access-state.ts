import { z } from 'zod';
import type { GameState } from './types';

/** Pure shapes only: persistence must not import the command/supply graph. */
export const MAX_SUPPLY_ACCESS_IMPORTS = 8;
export const MAX_SUPPLY_ACCESS_OFFERS = 8;
export const SUPPLY_ACCESS_OFFER_TURNS = 3;
/** Public service quote, chosen to match a depot's existing two-coin upkeep. */
export const SUPPLY_ACCESS_COIN_PER_TURN = 2;
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const turn = z.number().int().min(1).max(1_000_030);
const offerId = z.string().max(40).regex(/^supply-offer\.[1-9][0-9]*$/);
const agreementId = z.string().max(40).regex(/^supply-access\.[1-9][0-9]*$/);
const feeCoin = z.number().int().min(1).max(1_000_000);
const termTurns = z.number().int().min(5).max(30);
export const supplyAccessSourceSchema = z.object({
  settlementId: id, name: z.string().min(1).max(1000), cell: z.number().int().min(0).max(349_999), harbor: z.boolean(),
}).strict();
const terms = { buyerId: id, providerId: id, source: supplyAccessSourceSchema, feeCoin, termTurns };
export const supplyAccessOfferSchema = z.object({ id: offerId, ...terms, createdTurn: turn, expiresTurn: turn }).strict();
export const supplyAccessAgreementSchema = z.object({ id: agreementId, ...terms, startedTurn: turn, expiresTurn: turn }).strict();
export const supplyAccessStateSchema = z.object({
  offers: z.array(supplyAccessOfferSchema).max(64 * MAX_SUPPLY_ACCESS_OFFERS),
  agreements: z.array(supplyAccessAgreementSchema).max(64 * MAX_SUPPLY_ACCESS_IMPORTS),
  nextId: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
}).strict();
export const supplyAccessCommandSchemas = [
  z.object({ type: z.literal('proposeSupplyAccess'), factionId: id, targetFactionId: id, settlementId: id, feeCoin, termTurns }).strict(),
  z.object({ type: z.literal('respondSupplyAccess'), factionId: id, offerId, accept: z.boolean() }).strict(),
  z.object({ type: z.literal('endSupplyAccess'), factionId: id, agreementId }).strict(),
] as const;
export type SupplyAccessSource = z.infer<typeof supplyAccessSourceSchema>;
export type SupplyAccessOffer = z.infer<typeof supplyAccessOfferSchema>;
export type SupplyAccessAgreement = z.infer<typeof supplyAccessAgreementSchema>;
export type SupplyAccessState = z.infer<typeof supplyAccessStateSchema>;
export type SupplyAccessCommand = z.infer<typeof supplyAccessCommandSchemas[number]>;
export const supplyAccessAssessmentSchema = z.object({
  band: z.enum(['likely', 'uncertain', 'unlikely']), quotedFeeCoin: z.number().int().min(0).max(60),
  reasons: z.array(z.string().max(1000)).max(8), objections: z.array(z.string().max(1000)).max(8), blocker: z.string().max(1000).nullable(),
}).strict();
export type SupplyAccessAssessment = z.infer<typeof supplyAccessAssessmentSchema>;
export const supplyAccessObservationSchema = z.object({
  offers: z.array(supplyAccessOfferSchema.extend({ acceptanceBlocker: z.string().max(1000).nullable() }).strict()).max(64 * MAX_SUPPLY_ACCESS_OFFERS),
  agreements: z.array(supplyAccessAgreementSchema).max(64 * MAX_SUPPLY_ACCESS_IMPORTS),
  quoteCoinPerTurn: z.literal(SUPPLY_ACCESS_COIN_PER_TURN),
}).strict();
export type SupplyAccessObservation = z.infer<typeof supplyAccessObservationSchema>;
export const createSupplyAccess = (): SupplyAccessState => ({ offers: [], agreements: [], nextId: 1 });

export function validateSupplyAccess(state: GameState): void {
  const access = supplyAccessStateSchema.parse(state.supplyAccess);
  const assert = (value: unknown, message: string) => { if (!value) throw new Error('Invalid save: supply access ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id)), sequences = new Set<number>();
  const pairs = new Set<string>(), counts = new Map<string, number>();
  for (const [kind, records, limit] of [['offers', access.offers, MAX_SUPPLY_ACCESS_OFFERS], ['agreements', access.agreements, MAX_SUPPLY_ACCESS_IMPORTS]] as const) {
    for (const [index, record] of records.entries()) {
      assert(!index || records[index - 1]!.id < record.id, 'records must have unique, sorted IDs.');
      const sequence = Number(record.id.slice(record.id.indexOf('.') + 1));
      assert(Number.isSafeInteger(sequence) && sequence < access.nextId && !sequences.has(sequence), 'identifier exceeds or repeats its independent counter.');
      sequences.add(sequence);
      assert(record.buyerId !== record.providerId && factions.has(record.buyerId) && factions.has(record.providerId), 'requires two distinct existing realms.');
      const source = record.source, town = state.settlements[source.settlementId];
      assert(source.cell < state.world.width * state.world.height && state.explored[record.buyerId]?.has(source.cell), 'disclosed source must be an explored world hex.');
      assert(town && town.cell === source.cell && town.factionId === record.providerId, 'source must still belong to its provider.');
      assert(!state.wars.some(pair => pair.includes(record.buyerId) && pair.includes(record.providerId)), 'cannot bind realms at war.');
      const key = `${record.buyerId}:${source.settlementId}`;
      assert(!pairs.has(key), 'source is duplicated across pending or active imports.'); pairs.add(key);
      const countKey = `${kind}:${record.buyerId}`;
      counts.set(countKey, (counts.get(countKey) ?? 0) + 1);
      assert(counts.get(countKey)! <= limit, 'buyer exceeds the bounded record limit.');
      const started = 'createdTurn' in record ? record.createdTurn : record.startedTurn;
      assert(started <= state.turn && record.expiresTurn > state.turn
        && record.expiresTurn === started + ('createdTurn' in record ? SUPPLY_ACCESS_OFFER_TURNS : record.termTurns), 'record lifetime is invalid.');
    }
  }
}

export function assertNoSupplyAccess(state: GameState): void {
  if (state.supplyAccess.offers.length || state.supplyAccess.agreements.length || state.supplyAccess.nextId !== 1)
    throw new Error('Historical rules cannot discard supply agreements or their identifier history.');
}
