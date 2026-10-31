import { hearthEventEffect } from '@theandril/content';
import type { GameCommand, Observation, ObservedHearthEvent, ObservedHearthEventChoice } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 46: a realm answers each hearth event it is offered on the turn it
 * is offered, with the answer worth most to it by what the simulation quotes:
 * coin and knowledge at face value, stored food at a premium where the hearth
 * is short of it, people dearly, devastation at its cost to the hearth's
 * yields. Ties keep the event's own order. Nothing is guessed about the event
 * beyond its quoted effects; a lapsed event's default is never relied on. */
export const MAX_HEARTH_EVENT_ANSWERS = 4;
export function valueHearthEventChoice(view: Observation, event: ObservedHearthEvent, choice: ObservedHearthEventChoice): number {
  const town = view.settlements.find(item => item.id === event.settlementId);
  const hungry = town !== undefined && town.food < 12;
  // Devastation halves what a scarred hearth yields for many turns, so a badly scarred hearth pays dearly to be repaired.
  const scarred = town !== undefined && town.devastation >= 30;
  const effects = choice.effects;
  // Ashglass feeds the rites and the working; garrison strength is worth what the companies cost to raise.
  return effects.coin + effects.knowledge * 1.5 + effects.food * (hungry ? 4 : 1.5) + effects.population * 25 - effects.devastation * (scarred ? 5 : 2)
    + hearthEventEffect(effects, 'ashglass') * 3 + hearthEventEffect(effects, 'garrison') * 1.5;
}
export interface HearthEventPlan extends AiPlan { coinSpent: number; knowledgeSpent: number }
export function planHearthEvents(view: Observation): HearthEventPlan | null {
  const events = (view.hearthEvents ?? []).slice(0, MAX_HEARTH_EVENT_ANSWERS);
  if (!events.length) return null;
  const commands: GameCommand[] = [], reasons: string[] = [];
  let coinSpent = 0, knowledgeSpent = 0;
  for (const event of events) {
    // Only answers the simulation quotes as open; their cost comes off this turn's purse before anything else is planned.
    let best: ObservedHearthEventChoice | undefined, bestValue = -Infinity;
    for (const choice of event.choices) {
      if (choice.blocker) continue;
      const value = valueHearthEventChoice(view, event, choice);
      if (value > bestValue) { best = choice; bestValue = value; }
    }
    if (!best) continue;
    commands.push({ type: 'resolveHearthEvent', factionId: view.factionId, eventId: event.id, choiceId: best.id });
    coinSpent += Math.max(0, -best.effects.coin); knowledgeSpent += Math.max(0, -best.effects.knowledge);
    reasons.push(`${event.name} at ${event.settlementName}: ${best.label.toLowerCase()} (${best.summary}).`);
  }
  return commands.length ? { commands, reasons, coinSpent, knowledgeSpent } : null;
}
