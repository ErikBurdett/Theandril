import { STRATEGIC_RITES } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import { getMovementQuery } from '@theandril/sim';

/** Rules 40–42 readiness: the AI reaches hearth rites organically. A realm that
 * holds a seam reads which rite that seam could feed, researches the rite's
 * discovery once a caster of the path serves it, keeps a Waykeeper lodged at a
 * seam hearth while at war, and brings a riding qualified caster home when the
 * seam hearth is besieged. Everything is read from the observation; the
 * simulation still quotes every rite with its own blocker. */
const hearthRites = STRATEGIC_RITES.filter(rite => rite.kind !== 'breaking');
const byId = <T extends { id: string }>(a: T, b: T): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Hearths whose borders hold a seam the realm has surveyed, by the seam's path. */
export function wardenHearths(view: Observation): Map<string, Set<string>> {
  const hearths = new Map<string, Set<string>>();
  if (!view.rites) return hearths;
  for (const site of view.arcaneSites) {
    if (!site.controlled || !site.settlementId) continue;
    hearths.set(site.settlementId, (hearths.get(site.settlementId) ?? new Set()).add(site.pathId));
  }
  return hearths;
}
const casterFits = (view: Observation, pathId: string, level: number) =>
  view.characters.filter(character => !character.dead && character.role === 'waykeeper' && (character.aptitudes?.[pathId] ?? 0) >= level);

/** The discovery of a hearth rite whose seam the realm holds and whose path a living Waykeeper carries. */
export function planRiteResearch(view: Observation): { command: GameCommand; reason: string } | null {
  const hearths = wardenHearths(view);
  if (!hearths.size) return null;
  const paths = new Set([...hearths.values()].flatMap(set => [...set]));
  for (const rite of hearthRites) {
    if (!paths.has(rite.pathId) || !casterFits(view, rite.pathId, rite.pathLevel).length) continue;
    const choice = view.arcaneResearch.choices.find(item => item.id === rite.discoveryId && item.canResearch);
    if (!choice) continue;
    return { command: { type: 'researchArcane', factionId: view.factionId, discoveryId: choice.id }, reason: `Research ${choice.name} so a held seam can feed ${rite.name} from its hearth.` };
  }
  return null;
}

/** Whether a hearth rite could be performed from a held seam once a caster is lodged there.
 * Gated on war, not on a visible threat: fog hides a besieger until it stands at the
 * gate, and a blockade then refuses the appointment, so the warden must already be there. */
export function wardensWanted(view: Observation): boolean {
  if (!view.wars.length) return false;
  const paths = new Set([...wardenHearths(view).values()].flatMap(set => [...set]));
  return hearthRites.some(rite => paths.has(rite.pathId) && view.arcaneResearch.choices.some(choice => choice.id === rite.discoveryId && (choice.researched || choice.canResearch)));
}

/** Enemy companies this close to a seam hearth call its warden home; a blockade refuses lodging, so the call comes first. */
export const WARDEN_THREAT_RANGE = 4;
/** A threatened seam hearth calls its qualified riding caster home; at the gate the caster lodges. */
export function planWardenReturn(view: Observation): { commands: GameCommand[]; reasons: string[]; heldArmyIds: Set<string> } {
  const commands: GameCommand[] = [], reasons: string[] = [], heldArmyIds = new Set<string>();
  const hearths = wardenHearths(view);
  if (!hearths.size) return { commands, reasons, heldArmyIds };
  const routed = new Set(view.routes.map(route => route.armyId));
  const wars = new Set(view.wars);
  if (!wars.size) return { commands, reasons, heldArmyIds };
  const enemies = view.armies.filter(army => wars.has(army.factionId) && army.domain === 'land');
  const blockaded = new Set(view.sieges.map(siege => siege.settlementId));
  const threatened = view.settlements.filter(town => town.factionId === view.factionId && hearths.has(town.id) && !blockaded.has(town.id)
    && enemies.some(enemy => hexDistance(enemy.cell, town.cell, view.width) <= WARDEN_THREAT_RANGE)).sort(byId);
  for (const town of threatened) {
    if (view.wards?.some(ward => ward.settlementId === town.id)) continue;
    const paths = hearths.get(town.id)!;
    const rite = hearthRites.find(item => paths.has(item.pathId) && view.arcaneResearch.choices.some(choice => choice.id === item.discoveryId && choice.researched));
    if (!rite) continue;
    // A caster already lodged there performs the rite itself; only riding casters are called.
    if (casterFits(view, rite.pathId, rite.pathLevel).some(character => character.location?.kind === 'settlement' && character.location.settlementId === town.id)) continue;
    const riders = casterFits(view, rite.pathId, rite.pathLevel).filter(character => !character.woundedTurns && !character.mission && character.location?.kind === 'army').sort(byId);
    for (const caster of riders) {
      const armyId = (caster.location as { armyId: string }).armyId, army = view.armies.find(item => item.id === armyId);
      if (!army || army.domain !== 'land' || army.carrierId || heldArmyIds.has(army.id) || view.sieges.some(item => item.armyId === army.id)) continue;
      if (army.cell === town.cell) {
        const option = caster.unassignmentOptions.find(item => item.settlementId === town.id && item.canUnassign);
        if (!option) continue;
        commands.push({ type: 'unassignCharacter', factionId: view.factionId, characterId: caster.id, settlementId: town.id });
        reasons.push(`${caster.name} lodges at threatened ${town.name} to work ${rite.name} from its seam.`);
        heldArmyIds.add(army.id);
        break;
      }
      if (army.movementBlocker || routed.has(army.id)) continue;
      // Only a road the rules say can be queued is ordered; a company without one keeps its own work.
      const preview = getMovementQuery(view, army.id, town.cell).preview;
      if (!preview?.canQueue || preview.action !== 'move') continue;
      commands.push({ type: 'queueMovement', factionId: view.factionId, armyId: army.id, target: town.cell });
      heldArmyIds.add(army.id);
      reasons.push(`Bring ${caster.name} home to threatened ${town.name} with ${army.name} (${hexDistance(army.cell, town.cell, view.width)} hexes): its seam can feed ${rite.name}.`);
      break;
    }
  }
  return { commands, reasons, heldArmyIds };
}
