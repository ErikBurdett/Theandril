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
  { id: 'faction.cistern_assembly', name: 'Cistern Assembly', color: 0x6db7b0, motto: 'Read the measure. Share the draw.' },
  { id: 'faction.unsealed_companies', name: 'Unsealed Companies', color: 0xcb8271, motto: 'The living make their own terms.' },
  { id: 'faction.lantern_hospices', name: 'Lantern Hospices', color: 0xcebe82, motto: 'Keep a place beside the lamp.' },
  { id: 'faction.cairnwing_concord', name: 'Cairnwing Concord', color: 0xb59c7d, motto: 'No ledge stands without the lift.' },
  { id: 'faction.red_sluice', name: 'Red Sluice Directorate', color: 0xb77569, motto: 'Count the harvest. Answer the banks.' },
  { id: 'faction.velvet_meridian', name: 'Velvet Meridian', color: 0x8986b8, motto: 'A measure is not the final word.' },
  { id: 'faction.brine_choir', name: 'Brine Choir', color: 0x79a39e, motto: 'Let every shore be heard.' },
  { id: 'faction.emberwake_convocation', name: 'Emberwake Convocation', color: 0xb7b170, motto: 'Keep the seed. Account for the fire.' },
  { id: 'faction.underhush_exchange', name: 'Underhush Exchange', color: 0x9c917e, motto: 'Leave room for those who dwell.' },
  { id: 'faction.vesper_court', name: 'Vesper Court', color: 0xb66b83, motto: 'Hospitality must have an ending.' },
  { id: 'faction.manytrack_moot', name: 'Manytrack Moot', color: 0x799783, motto: 'Unlike tracks may share a road.' },
  { id: 'faction.margin_observance', name: 'Margin Observance', color: 0xb3aaa0, motto: 'Keep the gap beside the record.' },
] as const;

/** Roster identity is separate from physical map generation and never grows by modulo accident. */
export const legacyRosterVersionSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const rosterVersionSchema = z.union([...legacyRosterVersionSchema.options, z.literal(4)]);
export type RosterVersion = z.infer<typeof rosterVersionSchema>;
export const ROSTER_VERSION: RosterVersion = 4;
const four = ['faction.ashen_compact', 'faction.reedbound_council', 'faction.cinder_march', 'faction.glass_tide'] as const;
const six = [...four, 'faction.iron_covenant', 'faction.sepulchral_synod'] as const;
const twelve = [...six, 'faction.mire_courts', 'faction.saltwind_remnant', 'faction.wardhall_remnant', 'faction.rimehorn_clans', 'faction.sable_steppe', 'faction.morrow_spore'] as const;
export const FACTION_ROSTERS = {
  1: four, 2: six,
  3: twelve,
  4: [...twelve, 'faction.cistern_assembly', 'faction.unsealed_companies', 'faction.lantern_hospices', 'faction.cairnwing_concord', 'faction.red_sluice', 'faction.velvet_meridian', 'faction.brine_choir', 'faction.emberwake_convocation', 'faction.underhush_exchange', 'faction.vesper_court', 'faction.manytrack_moot', 'faction.margin_observance'],
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
  'faction.cistern_assembly': weights(3, 4, 1, 1, 1),
  'faction.unsealed_companies': weights(2, 3, 2, 2, 3),
  'faction.lantern_hospices': weights(4, 2, 1, 2, 1),
  'faction.cairnwing_concord': weights(1, 4, 4, 1, 1),
  'faction.red_sluice': weights(2, 4, 1, 4, 1),
  'faction.velvet_meridian': weights(2, 2, 3, 1, 2),
  'faction.brine_choir': weights(3, 3, 1, 1, 2),
  'faction.emberwake_convocation': weights(3, 1, 2, 3, 1),
  'faction.underhush_exchange': weights(4, 3, 1, 2, 1),
  'faction.vesper_court': weights(1, 2, 1, 4, 3),
  'faction.manytrack_moot': weights(2, 3, 4, 1, 2),
  'faction.margin_observance': weights(2, 1, 4, 2, 1),
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
  'faction.cistern_assembly': { description: 'Well keepers, gardeners and caravan households pool dry-country maintenance while disputing whether an inherited draw outweighs a newcomer’s work.', recruitmentRationale: 'Prefers spearmen and guards to protect carefully improved dryland stops. Water measures grant no free irrigation or supplies.' },
  'faction.unsealed_companies': { description: 'Veterans and road-town households reject ancestral oath-debt while arguing over who may commit the coin earned by living workers.', recruitmentRationale: 'Prefers spears and mounted escorts within a varied paid force. No mercenary income, portable town or extra loot is granted.' },
  'faction.lantern_hospices': { description: 'Care-house towns protect clean stores and refuge while attendants contest governors who turn emergency quarantine into permanent exclusion.', recruitmentRationale: 'Prefers guards with spear and heavy support to escort supplies and protect refit bases. Care grants no free healing or disease immunity.' },
  'faction.cairnwing_concord': { description: 'Feathered cairnfolk and human lift-port households share escarpment approaches while upper councils and lower workers dispute who sustains them.', recruitmentRationale: 'Prefers spear watches and wayfinders for difficult approaches. Folded feathers confer no flight; every formation uses ordinary ground movement.' },
  'faction.red_sluice': { description: 'Canal labor boards maintain wetland works while outlying households challenge emergency schedules that protect the center at their expense.', recruitmentRationale: 'Prefers spear and heavy-infantry lines to protect costly fixed works. Paid cultivation cannot redirect rivers or flood enemies.' },
  'faction.velvet_meridian': { description: 'Weavers and observatory schools trade measured knowledge while public observers challenge patrons who buy exclusive interpretations.', recruitmentRationale: 'Prefers wayfinders with balanced escorts for guarded learning and exchange. No prediction, espionage or hidden-map knowledge is granted.' },
  'faction.brine_choir': { description: 'Brinefolk pool settlements and human shore households answer proposals together while disputing whether permanent quays enclose shared rights.', recruitmentRationale: 'Prefers guards and spears to secure shore works and crossings. All peoples require paid ships and ordinary embarkation; no amphibious access.' },
  'faction.emberwake_convocation': { description: 'Seed keepers and kiln congregations rebuild ash-country livelihoods while resident gardeners contest teachers who promise renewal through loss.', recruitmentRationale: 'Prefers guards and heavy infantry with survey support for working parties. Ash-country knowledge grants no flame attacks or scorched-earth bonus.' },
  'faction.underhush_exchange': { description: 'Burrowfolk gallery wards and surface traders bargain over smoke, vibration and repair duties without agreeing that a market lease may silence its residents.', recruitmentRationale: 'Prefers compact guards and spear watches for defended exchange towns. Entrances grant no tunnel shortcuts, tremor sight or second map.' },
  'faction.vesper_court': { description: 'Vampiric patrons and living valley households maintain shuttered woodland estates while tenants demand the right to end inherited blood provisions.', recruitmentRationale: 'Prefers costly heavy retainers and mounted escorts. Living and vampiric officers share paid upkeep and refit; no life-steal, resurrection or night bonus.' },
  'faction.manytrack_moot': { description: 'Speaking horned and furred lineages join human households at a forest-steppe boundary where new fences divide routes that unlike bodies still share.', recruitmentRationale: 'Prefers wayfinders and spear escorts for dispersed holdings. Different bodies receive no hidden movement, beast mounts or free reconnaissance.' },
  'faction.margin_observance': { description: 'Archive custodians and their supply households preserve disputed records while arguing over the cost and danger of opening what earlier keepers sealed.', recruitmentRationale: 'Prefers wayfinders backed by ordinary defenders for costly frontier study. Preserved mysteries grant no spells or victory shortcut.' },
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
