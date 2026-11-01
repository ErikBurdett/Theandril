import { z } from 'zod';
import type { CommandResult, GameState } from './types';
import { rulesVersion } from './rules';
import { isCityState } from './seats';

/** Rules 70: a realm sets its taxes. Lean taxes take three quarters of every
 * hearth's coin and let the lanes mend two points faster each turn; heavy
 * taxes take a quarter more and wear the lanes by two each turn; steady
 * taxes take what they always took. City-states keep steady taxes. The
 * rates are canonical from save 70, one record for each realm that departs
 * from steady, by realm. */
const id = z.string().min(1).max(100);
export const taxRateSchema = z.enum(['lean', 'steady', 'heavy']);
export type TaxRate = z.infer<typeof taxRateSchema>;
export const taxRecordSchema = z.object({ factionId: id, rate: z.enum(['lean', 'heavy']) }).strict();
export const taxStateSchema = z.array(taxRecordSchema).max(64);
export type TaxRecord = z.infer<typeof taxRecordSchema>;
export interface ObservedTaxes { rate: TaxRate; coinPercent: number; devastationDrift: number; text: string }
export const taxCommandSchemas = [
  z.object({ type: z.literal('setTaxRate'), factionId: id, rate: taxRateSchema }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
export const TAX_COIN_PERCENT: Readonly<Record<TaxRate, number>> = { lean: 75, steady: 100, heavy: 125 };
/** What the rate does to a hearth's devastation each turn it is not besieged, beside the five points every hearth mends. */
export const TAX_DEVASTATION_DRIFT: Readonly<Record<TaxRate, number>> = { lean: -2, steady: 0, heavy: 2 };
const TAX_TEXT: Readonly<Record<TaxRate, string>> = {
  lean: 'Lean taxes: every hearth yields three quarters of its coin, and its lanes mend two points faster each turn.',
  steady: 'Steady taxes: every hearth yields its coin as it always has.',
  heavy: 'Heavy taxes: every hearth yields a quarter more coin, and its lanes wear by two points each turn.',
};

export const emptyTaxes = (): TaxRecord[] => [];
export const hasTaxes = (state: GameState): boolean => (state.taxes?.length ?? 0) > 0;
export function assertNoTaxes(state: GameState): void {
  if (hasTaxes(state)) throw new Error('This campaign sets taxes unavailable in historical rules.');
}
export const taxRateOf = (state: GameState, factionId: string): TaxRate => rulesVersion(state) >= 70 ? state.taxes.find(item => item.factionId === factionId)?.rate ?? 'steady' : 'steady';
/** A hearth's coin under its realm's taxes. */
export const taxedCoin = (state: GameState, factionId: string, coin: number): number => Math.floor(coin * TAX_COIN_PERCENT[taxRateOf(state, factionId)] / 100);
export function taxBlocker(state: GameState, factionId: string, rate: TaxRate): string | null {
  if (rulesVersion(state) < 70) return 'Taxes are not part of these rules.';
  if (isCityState(factionId)) return 'A city-state keeps steady taxes.';
  if (taxRateOf(state, factionId) === rate) return `Taxes are ${rate} already.`;
  return null;
}
export function setTaxRate(state: GameState, factionId: string, rate: TaxRate): CommandResult {
  const blocker = taxBlocker(state, factionId, rate);
  if (blocker) return fail(blocker);
  const rest = state.taxes.filter(item => item.factionId !== factionId);
  state.taxes = rate === 'steady' ? rest : [...rest, { factionId, rate }].sort((a, b) => a.factionId < b.factionId ? -1 : 1);
  const realm = state.factions.find(faction => faction.id === factionId)?.name ?? factionId;
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'taxes_set', message: `${realm} sets ${rate} taxes. ${TAX_TEXT[rate]}` }] };
}
export function observeTaxes(state: GameState, factionId: string): ObservedTaxes | undefined {
  if (rulesVersion(state) < 70) return undefined;
  const rate = taxRateOf(state, factionId);
  return { rate, coinPercent: TAX_COIN_PERCENT[rate], devastationDrift: TAX_DEVASTATION_DRIFT[rate], text: TAX_TEXT[rate] };
}
export function validateTaxes(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: tax rate ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const [index, item] of state.taxes.entries()) {
    assert(factions.has(item.factionId) && !isCityState(item.factionId), 'names an unknown realm or a city-state');
    assert(!index || item.factionId > state.taxes[index - 1]!.factionId, 'is out of order or repeated');
  }
}
