import type { CaptureOption, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Scores supplied consequences; the simulation remains the authority for available outcomes. */
export function chooseCaptureOption(view: Observation): CaptureOption | undefined {
  const pending = view.pendingCapture;
  if (!pending || pending.factionId !== view.factionId) return undefined;
  const score = (option: CaptureOption): number => {
    const recoveryCost = option.devastation + option.populationLoss * 24 + option.buildingsLost * 18 + option.occupationTurns * 4;
    const incomeWeight = view.treasury < 10 ? 3 : view.treasury < 30 ? 1 : 0;
    const ownership = option.recipientFactionId === view.factionId ? 100 : option.outcome === 'liberate' ? 50 : 0;
    return ownership + option.coinGain * incomeWeight - recoveryCost;
  };
  return [...pending.options].sort((a, b) => score(b) - score(a) || (a.outcome < b.outcome ? -1 : a.outcome > b.outcome ? 1 : 0))[0];
}

export function planConquestDecision(view: Observation): AiPlan | null {
  if (view.pendingCapture) {
    const option = chooseCaptureOption(view);
    if (!option) return { commands: [], reasons: ['Await the controlling faction’s capture decision.'] };
    return {
      commands: [{ type: 'resolveCapture', factionId: view.factionId, settlementId: view.pendingCapture.settlementId, outcome: option.outcome }],
      reasons: [`${option.label}: ${option.devastation} devastation, ${option.populationLoss} population lost, ${option.occupationTurns} occupation turns, ${option.coinGain} coin; balance ownership against recovery cost.`],
    };
  }
  for (const siege of view.sieges.filter(item => item.factionId === view.factionId).slice(0, 64)) {
    const army = view.armies.find(item => item.id === siege.armyId && item.factionId === view.factionId);
    if (!army) continue;
    if (army.morale < 25 || army.fatigue > 85 || army.strength * 2 < siege.defenderStrength) {
      return { commands: [{ type: 'liftSiege', factionId: view.factionId, settlementId: siege.settlementId }], reasons: ['Lift the siege to preserve an exhausted or badly outmatched army.'] };
    }
    if (siege.canAssault && army.morale >= 35 && army.fatigue <= 65 && (siege.defenses <= 10 || army.strength >= siege.defenderStrength * 2)) {
      return { commands: [{ type: 'assault', factionId: view.factionId, settlementId: siege.settlementId }], reasons: [`Assault ${siege.settlementId}: defenses ${siege.defenses}, observed defender strength ${siege.defenderStrength}, army strength ${army.strength}.`] };
    }
  }
  return null;
}
