import type { GameState } from './types';
import { rulesVersion } from './rules';

/** Rules 82: legitimacy. A reading of the realm from facts of the world, no
 * save field: every realm starts settled at two; an office of the realm held
 * adds one and a client answering to it adds one; a seat that is another
 * realm's hearth, or none, takes one, as does holding more hearths of other
 * realms' founding than of its own, and answering to a patron. At one or
 * less the realm's legitimacy is weak and every hearth's unrest rises one
 * more each turn; at three or more it is strong and every hearth's unrest
 * falls one more. Read in Realm affairs with its reasons. */
export const LEGITIMACY_BASE = 2;
export const LEGITIMACY_WEAK = 1;
export const LEGITIMACY_STRONG = 3;
export type LegitimacyStanding = 'weak' | 'settled' | 'strong';
export interface ObservedLegitimacy { level: number; standing: LegitimacyStanding; reasons: string[]; text: string }

export function legitimacyOf(state: GameState, factionId: string): { level: number; reasons: string[] } {
  const reasons: string[] = [];
  let level = LEGITIMACY_BASE;
  const towns = Object.values(state.settlements).filter(town => town.factionId === factionId);
  const founded = towns.filter(town => town.founderFactionId === factionId).length, conquered = towns.length - founded;
  const capital = state.land.capitals[factionId] ? state.settlements[state.land.capitals[factionId]!] : undefined;
  if (!capital || capital.factionId !== factionId) { level -= 1; reasons.push('it has no seat'); }
  else if (capital.founderFactionId !== factionId) { level -= 1; reasons.push(`its seat, ${capital.name}, is a hearth of another realm’s founding`); }
  else reasons.push(`its seat, ${capital.name}, is a hearth of its own founding`);
  if (conquered > founded) { level -= 1; reasons.push(`it holds more hearths of other realms’ founding (${conquered}) than of its own (${founded})`); }
  if (state.offices.some(record => record.factionId === factionId)) { level += 1; reasons.push('an office of the realm is held'); }
  if (state.diplomacy.clients.some(bond => bond.clientId === factionId)) { level -= 1; reasons.push('it answers to a patron'); }
  if (state.diplomacy.clients.some(bond => bond.patronId === factionId)) { level += 1; reasons.push('a client answers to it'); }
  return { level: Math.max(0, level), reasons };
}
export const legitimacyStanding = (level: number): LegitimacyStanding => level <= LEGITIMACY_WEAK ? 'weak' : level >= LEGITIMACY_STRONG ? 'strong' : 'settled';
/** The unrest a realm's legitimacy adds to each of its hearths each turn: one when weak, minus one when strong. */
export function legitimacyUnrest(state: GameState, factionId: string): { change: number; pressure: string | null } {
  if (rulesVersion(state) < 82) return { change: 0, pressure: null };
  const standing = legitimacyStanding(legitimacyOf(state, factionId).level);
  return standing === 'weak' ? { change: 1, pressure: 'weak legitimacy' } : standing === 'strong' ? { change: -1, pressure: 'strong legitimacy eases the lanes' } : { change: 0, pressure: null };
}
const STANDING_TEXT: Record<LegitimacyStanding, string> = {
  weak: 'Weak legitimacy: every hearth’s unrest rises one more each turn.',
  settled: 'Settled legitimacy: the lanes answer their own pressures.',
  strong: 'Strong legitimacy: every hearth’s unrest falls one more each turn.',
};
export function observeLegitimacy(state: GameState, factionId: string): ObservedLegitimacy | undefined {
  if (rulesVersion(state) < 82) return undefined;
  const { level, reasons } = legitimacyOf(state, factionId), standing = legitimacyStanding(level);
  return { level, standing, reasons, text: `Legitimacy ${level}. ${STANDING_TEXT[standing]}` };
}
