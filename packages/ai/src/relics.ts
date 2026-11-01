import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 63: a relic waiting in the hearth goes to the living character who
 * rides with the strongest company of the realm, or to any living character
 * when none rides; one bestowal a turn, nothing guessed beyond the quoted
 * relics and the realm's own roster. */
export function planRelics(view: Observation): AiPlan | null {
  const waiting = (view.relics ?? []).filter(item => item.holderCharacterId === null).sort((a, b) => a.id < b.id ? -1 : 1)[0];
  if (!waiting) return null;
  const strength = new Map(view.armies.filter(army => army.factionId === view.factionId).map(army => [army.id, army.formations.reduce((sum, item) => sum + item.strength, 0)]));
  const bearer = view.characters.filter(character => character.factionId === view.factionId && !character.dead)
    .sort((a, b) => (b.location?.kind === 'army' ? strength.get(b.location.armyId) ?? 0 : -1) - (a.location?.kind === 'army' ? strength.get(a.location.armyId) ?? 0 : -1) || (a.id < b.id ? -1 : 1))[0];
  if (!bearer) return null;
  const command: GameCommand = { type: 'bestowRelic', factionId: view.factionId, relicId: waiting.id, bearerId: bearer.id };
  return { commands: [command], reasons: [`Bestow ${waiting.name} on ${bearer.name}: ${bearer.location?.kind === 'army' ? 'the strongest company of the realm rides with them' : 'no character rides with a company, so the relic waits with them'}.`] };
}
