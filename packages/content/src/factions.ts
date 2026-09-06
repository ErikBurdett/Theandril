import { z } from 'zod';

export const factionSchema = z.object({ id: z.string().regex(/^faction\.[a-z_]+$/), name: z.string().min(1), color: z.number().int().min(0).max(0xffffff), motto: z.string().min(1) }).strict();
export const FACTIONS = [
  { id: 'faction.ashen_compact', name: 'Ashen Compact', color: 0xc9a66b, motto: 'Keep the hearth. Keep the oath.' },
  { id: 'faction.reedbound_council', name: 'Reedbound Council', color: 0x82b5a0, motto: 'No river belongs to one shore.' },
  { id: 'faction.cinder_march', name: 'Cinder March', color: 0xc17f77, motto: 'We hold what the fire spared.' },
  { id: 'faction.glass_tide', name: 'Glass Tide', color: 0x879fca, motto: 'Every horizon is a promise.' },
  { id: 'faction.iron_covenant', name: 'Iron Covenant', color: 0xb49b73, motto: 'The hold endures. The valley is owed.' },
  { id: 'faction.sepulchral_synod', name: 'Sepulchral Synod', color: 0xb7aec9, motto: 'No measure ends at the grave.' },
  { id: 'faction.mire_courts', name: 'Mire Courts', color: 0x688a65, motto: 'The season returns. The court remembers.' },
  { id: 'faction.saltwind_remnant', name: 'Saltwind Remnant', color: 0x80aeb0, motto: 'A keel is pledged only once.' },
  { id: 'faction.wardhall_remnant', name: 'Wardhall Remnant', color: 0xa6a5bd, motto: 'Let the work stand witness.' },
  { id: 'faction.rimehorn_clans', name: 'Rimehorn Clans', color: 0xa1bfce, motto: 'Share the shelter. Answer the horn.' },
  { id: 'faction.sable_steppe', name: 'Sable Steppe', color: 0xc1aa72, motto: 'The road moves with the camp.' },
  { id: 'faction.morrow_spore', name: 'Morrow Spore', color: 0xaa8ca7, motto: 'What falls shall feed what follows.' },
] as const;

/** Roster identity is separate from physical map generation and never grows by modulo accident. */
export const rosterVersionSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type RosterVersion = z.infer<typeof rosterVersionSchema>;
export const ROSTER_VERSION: RosterVersion = 3;
const four = ['faction.ashen_compact', 'faction.reedbound_council', 'faction.cinder_march', 'faction.glass_tide'] as const;
const six = [...four, 'faction.iron_covenant', 'faction.sepulchral_synod'] as const;
export const FACTION_ROSTERS = {
  1: four, 2: six,
  3: [...six, 'faction.mire_courts', 'faction.saltwind_remnant', 'faction.wardhall_remnant', 'faction.rimehorn_clans', 'faction.sable_steppe', 'faction.morrow_spore'],
} as const;
export function factionRoster(version: RosterVersion): (typeof FACTIONS)[number][] {
  const ids = FACTION_ROSTERS[rosterVersionSchema.parse(version)];
  return ids.map(id => {
    const definition = FACTIONS.find(faction => faction.id === id);
    if (!definition) throw new Error('Missing frozen roster definition: ' + id);
    return definition;
  });
}

export const LAND_MILITARY_UNIT_IDS = ['unit.guard', 'unit.spearman', 'unit.scout', 'unit.heavy_infantry', 'unit.cavalry'] as const;
export type LandMilitaryUnitId = (typeof LAND_MILITARY_UNIT_IDS)[number];
export type RecruitmentWeights = Readonly<Record<LandMilitaryUnitId, number>>;
const weights = (guard: number, spear: number, scout: number, heavy: number, cavalry: number): RecruitmentWeights => ({
  'unit.guard': guard, 'unit.spearman': spear, 'unit.scout': scout, 'unit.heavy_infantry': heavy, 'unit.cavalry': cavalry,
});
/** Preferences only: every culture pays the same costs and may recruit the same units. */
export const FACTION_RECRUITMENT_WEIGHTS: Readonly<Record<string, RecruitmentWeights>> = {
  'faction.ashen_compact': weights(2, 1, 1, 1, 1), 'faction.reedbound_council': weights(2, 1, 1, 1, 1),
  'faction.cinder_march': weights(2, 1, 1, 1, 1), 'faction.glass_tide': weights(2, 1, 1, 1, 1),
  'faction.iron_covenant': weights(2, 1, 1, 1, 1), 'faction.sepulchral_synod': weights(2, 1, 1, 1, 1),
  'faction.mire_courts': weights(2, 3, 3, 1, 1),
  'faction.saltwind_remnant': weights(3, 2, 2, 1, 1),
  'faction.wardhall_remnant': weights(2, 3, 1, 3, 1),
  'faction.rimehorn_clans': weights(3, 2, 1, 2, 1),
  'faction.sable_steppe': weights(1, 2, 2, 1, 4),
  'faction.morrow_spore': weights(2, 2, 4, 1, 1),
};

export interface FactionProfile { description: string; recruitmentRationale: string }
export const factionProfileSchema = z.object({ description: z.string().min(1).max(600), recruitmentRationale: z.string().min(1).max(400) }).strict();
export const FACTION_PROFILES: Readonly<Record<string, FactionProfile>> = {
  'faction.ashen_compact': { description: 'Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.', recruitmentRationale: 'A balanced force centered on oath guards. Shared unit costs and access remain unchanged.' },
  'faction.reedbound_council': { description: 'Seasonal wetland assemblies bargain across the banks; drainage that benefits one village can ruin another family’s deep water.', recruitmentRationale: 'A balanced force centered on oath guards. Shared unit costs and access remain unchanged.' },
  'faction.cinder_march': { description: 'Pass wardens and mine masters rely on the same walls while disputing who should direct the coin that maintains them.', recruitmentRationale: 'A balanced force centered on oath guards. Shared unit costs and access remain unchanged.' },
  'faction.glass_tide': { description: 'Charter towns reopen the vitrified coast’s routes while arguing over which town should pay for the next shared voyage.', recruitmentRationale: 'A balanced force centered on oath guards. Shared unit costs and access remain unchanged.' },
  'faction.iron_covenant': { description: 'Anvilheights holds and their client valleys bind craft to obligation; a durable forge does not settle what its valley is owed.', recruitmentRationale: 'A balanced force centered on oath guards. Shared unit costs and access remain unchanged.' },
  'faction.sepulchral_synod': { description: 'The chalkland terraces keep their measured offices and disputed inheritances. Their promised supernatural logistics are not implemented.', recruitmentRationale: 'A balanced force centered on oath guards. Shared unit costs and access remain unchanged.' },
  'faction.mire_courts': { description: 'The Deepfen’s elder seasonal courts balance patient household rights against their former tenants’ growing independence.', recruitmentRationale: 'Prefers spearmen and wayfinders over heavy cohorts or cavalry, fitting dispersed wetland watches. This grants no special movement.' },
  'faction.saltwind_remnant': { description: 'Surviving charter households contest the debts of the old League while restoring coastal livelihood on smaller, accountable pledges.', recruitmentRationale: 'Prefers oath guards with spear and scouting support for scattered landing places; ships still require ordinary navigation and harbors.' },
  'faction.wardhall_remnant': { description: 'Wardhall’s surviving work halls dispute whether rebuilding the plains requires the old Throne’s authority or merely its engineering discipline.', recruitmentRationale: 'Prefers spearmen and heavy infantry for a deliberate defensive line. No magical nullification or hidden defensive bonus is granted.' },
  'faction.rimehorn_clans': { description: 'High-cold shelter clans balance common winter stores against the autonomy of distant households and their seasonal gatherings.', recruitmentRationale: 'Prefers oath guards supported by spears and heavy infantry, keeping a dependable core without exclusive troops.' },
  'faction.sable_steppe': { description: 'Mobile camp assemblies negotiate grazing claims and road access without agreeing that a fixed town should speak for every camp.', recruitmentRationale: 'Prefers cavalry with wayfinder and spear support. Mounted companies retain their real recruitment, upkeep and armor tradeoffs.' },
  'faction.morrow_spore': { description: 'Underwood households share living records and managed growth while disputing how much of the common forest each settlement may cut.', recruitmentRationale: 'Prefers wayfinders with guard and spear support for dispersed woodland holdings. Forest affinity does not remove terrain costs.' },
};

export function validateFactionContent(units: readonly { id: string; canFound: boolean; movementDomain?: 'land' | 'naval' }[],
  recruitment = FACTION_RECRUITMENT_WEIGHTS, profiles = FACTION_PROFILES): void {
  const ids = new Set<string>(FACTIONS.map(item => item.id));
  FACTIONS.forEach(item => factionSchema.parse(item));
  if (ids.size !== FACTIONS.length) throw new Error('Duplicate faction ID');
  for (const roster of Object.values(FACTION_ROSTERS)) if (new Set(roster).size !== roster.length || roster.some(id => !ids.has(id))) throw new Error('Invalid frozen faction roster');
  const military = new Set(units.filter(unit => !unit.canFound && unit.movementDomain !== 'naval').map(unit => unit.id));
  if (military.size !== LAND_MILITARY_UNIT_IDS.length || LAND_MILITARY_UNIT_IDS.some(id => !military.has(id))) throw new Error('Recruitment weights must cover the actual land military roster');
  for (const map of [recruitment, profiles]) if (Object.keys(map).length !== ids.size || Object.keys(map).some(id => !ids.has(id))) throw new Error('Faction metadata must cover the exact roster');
  for (const id of ids) {
    factionProfileSchema.parse(profiles[id]);
    const values = recruitment[id];
    if (!values || Object.keys(values).length !== military.size || Object.keys(values).some(id => !military.has(id))
      || Object.values(values).some(weight => !Number.isSafeInteger(weight) || weight < 1 || weight > 8)) throw new Error('Invalid faction recruitment weights');
  }
}
