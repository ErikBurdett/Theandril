import { MAX_THEATERS_PER_FACTION, observedDefenseTheaterSchema, type ObservedDefenseTheater, type TheaterCommand } from '@theandril/sim';

/** Validate compact transport data before rendering or acknowledging an edit. */
export function assertTheaterResponse(value: unknown, factionId: string): asserts value is ObservedDefenseTheater[] {
  // Worker loads migrate old saves before publishing a current campaign view.
  if (!Array.isArray(value) || value.length > MAX_THEATERS_PER_FACTION) throw new Error('The defensive theater update could not be read.');
  const ids = new Set<string>();
  for (const row of value) {
    const result = observedDefenseTheaterSchema.safeParse(row);
    if (!result.success || result.data.factionId !== factionId || ids.has(result.data.id)) throw new Error('The defensive theater update could not be read.');
    const data = result.data;
    const aligned = (ids: string[], rows: string[]) => ids.length === rows.length && ids.every((id, index) => id === rows[index] && (!index || ids[index - 1]! < id));
    if (!aligned(data.armyIds, data.members.map(item => item.armyId)) || !aligned(data.settlementIds, data.hearths.map(item => item.settlementId))) throw new Error('The defensive theater references could not be read.');
    ids.add(data.id);
  }
}
export function assertTheaterApplied(theaters: ObservedDefenseTheater[] | undefined, command: TheaterCommand): void {
  if (!theaters) throw new Error('The defensive theater response is missing.');
  if (command.type === 'deleteTheater') {
    if (theaters.some(row => row.id === command.theaterId)) throw new Error('The deleted theater remains in the response.');
    return;
  }
  const row = theaters.find(row => command.theaterId ? row.id === command.theaterId : row.name === command.name.trim());
  const same = (a: string[], b: string[]) => { const sorted = [...b].sort(); return a.length === sorted.length && a.every((id, index) => id === sorted[index]); };
  if (!row || row.factionId !== command.factionId || row.name !== command.name.trim() || row.reserveCell !== command.reserveCell || row.guardsPerSettlement !== command.guardsPerSettlement || (row.reinforcementLimit ?? 0) !== (command.reinforcementLimit ?? 0) || row.enabled !== command.enabled || !same(row.armyIds, command.armyIds) || !same(row.settlementIds, command.settlementIds)) throw new Error('The defensive theater response does not match the accepted edit.');
}
