import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 65: a vacant office of the realm goes to a living, unwounded
 * character of its role who sits in a hearth with no company to join this
 * turn, provided the realm keeps another living character of that role who
 * can still ride — an office never takes a realm's only marshal, surveyor,
 * engineer or Waykeeper off the road. One office a turn; nothing resigns. */
export function planOffices(view: Observation, busyCharacterIds: ReadonlySet<string> = new Set()): AiPlan | null {
  const offices = view.offices;
  if (!offices) return null;
  const holders = new Set(offices.flatMap(office => office.holderCharacterId ? [office.holderCharacterId] : []));
  const living = view.characters.filter(character => character.factionId === view.factionId && !character.dead);
  for (const office of offices.filter(office => office.holderCharacterId === null).sort((a, b) => a.officeId < b.officeId ? -1 : 1)) {
    const ofRole = living.filter(character => character.role === office.role && !holders.has(character.id));
    if (ofRole.length < 2) continue;
    const holder = ofRole.filter(character => !character.woundedTurns && !character.mission && character.location?.kind === 'settlement' && !busyCharacterIds.has(character.id) && !character.assignmentOptions.some(option => option.canAssign))
      .sort((a, b) => a.id < b.id ? -1 : 1)[0];
    if (!holder) continue;
    const town = view.settlements.find(item => holder.location?.kind === 'settlement' && item.id === holder.location.settlementId);
    const command: GameCommand = { type: 'holdOffice', factionId: view.factionId, officeId: office.officeId, holderId: holder.id };
    return { commands: [command], reasons: [`${holder.name} takes office as ${office.name} at ${town?.name ?? 'the hearth'}: no company to join this turn, and the realm keeps another ${office.role} for the road.`] };
  }
  return null;
}
