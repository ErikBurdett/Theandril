import { EPOCHS, epochsForRules, type EpochDefinition } from '@theandril/content';
import type { DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { hasArcaneSurveys } from './arcane-sites';
import { isCityState } from './seats';

/** Rules 49: the world's age is read from facts that only grow — the turn,
 * the hearths ever founded (a razed hearth leaves a ruin, a resettled ruin a
 * hearth), whether a seam has been found, whether a public bid has opened —
 * so it needs no canonical field, never goes back, and a replay or a save
 * sealed under older rules reads the same age from the same world. The turn's
 * resolution announces every age the world entered during it. */
export interface ObservedEpoch { id: string; name: string; description: string; index: number; count: number }

export function epochConditionHolds(state: GameState, epoch: EpochDefinition): boolean {
  const condition = epoch.condition;
  switch (condition.kind) {
    case 'start': return true;
    case 'hearths': {
      const realms = state.factions.filter(faction => !isCityState(faction.id)).length;
      return Object.keys(state.settlements).length + Object.keys(state.ruins).length >= condition.perRealm * Math.max(1, realms) || state.turn >= condition.orTurn[state.pace];
    }
    case 'seamFound': return hasArcaneSurveys(state) || state.turn >= condition.orTurn[state.pace];
    case 'projectStarted': return state.projects.length > 0;
  }
}
/** The index of the age the world is in: every age in catalogue order whose condition holds. */
export function epochIndex(state: GameState): number {
  if (rulesVersion(state) < 49) return 0;
  const ages = epochsForRules(rulesVersion(state));
  let reached = 0;
  while (ages[reached + 1] && epochConditionHolds(state, ages[reached + 1]!)) reached++;
  return reached;
}
export const epochId = (state: GameState): string => EPOCHS[epochIndex(state)]!.id;
/** Every age the world entered since `previousIndex` is announced to every realm, in order. */
export function announceEpochs(state: GameState, previousIndex: number, events: DomainEvent[]): void {
  if (rulesVersion(state) < 49 || state.victory) return;
  const ages = epochsForRules(rulesVersion(state)), reached = epochIndex(state);
  for (let index = previousIndex + 1; index <= reached; index++) {
    const age = ages[index]!;
    for (const faction of state.factions) events.push({ turn: state.turn, factionId: faction.id, type: 'epoch_begun', message: `${age.name} begins: ${age.description}` });
  }
}
export function observeEpoch(state: GameState): ObservedEpoch | undefined {
  if (rulesVersion(state) < 49) return undefined;
  const index = epochIndex(state), epoch = EPOCHS[index]!;
  return { id: epoch.id, name: epoch.name, description: epoch.description, index, count: EPOCHS.length };
}
