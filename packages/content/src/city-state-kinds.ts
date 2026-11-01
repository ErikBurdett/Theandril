import { z } from 'zod';
import { CITY_STATES } from './city-states';

/** Rules 77: every city-state is one of four kinds of independent power. A
 * market sells line troops at the going rate and pays tribute in full; a
 * clanhold sells its oath guard dear and pays little; a camp sells riders
 * dearer still and pays three quarters; a cove sells skirmishers cheap and,
 * rich in plunder, pays more. Data only; the simulation prices the hire and
 * the tribute and names the company. */
const cityStateId = z.string().regex(/^citystate\.[a-z_]+$/);
export const CITY_STATE_KIND_IDS = ['market', 'clanhold', 'camp', 'cove'] as const;
export type CityStateKindId = typeof CITY_STATE_KIND_IDS[number];
export const cityStateKindSchema = z.object({ cityStateId, kind: z.enum(CITY_STATE_KIND_IDS), sinceRules: z.literal(77) }).strict();
export type CityStateKind = z.infer<typeof cityStateKindSchema>;
export interface CityStateKindDefinition { id: CityStateKindId; name: string; description: string; unitId: string; hirePercent: number; tributePercent: number }
export const CITY_STATE_KIND_DEFINITIONS: readonly CityStateKindDefinition[] = [
  { id: 'market', name: 'Market town', description: 'A trade community that sells line troops at the going rate and pays tribute in full.', unitId: 'unit.spearman', hirePercent: 100, tributePercent: 100 },
  { id: 'clanhold', name: 'Clanhold', description: 'A hold of clans that sells its oath guard dear and pays little tribute.', unitId: 'unit.guard', hirePercent: 125, tributePercent: 50 },
  { id: 'camp', name: 'Nomad camp', description: 'A camp of riders that sells mounted companies dear and pays three quarters of a tribute.', unitId: 'unit.cavalry', hirePercent: 150, tributePercent: 75 },
  { id: 'cove', name: 'Pirate cove', description: 'A cove of raiders that sells skirmishers cheap and, rich in plunder, pays a quarter more tribute.', unitId: 'unit.skirmisher', hirePercent: 75, tributePercent: 125 },
];
const kind = (cityStateId: string, kind: CityStateKindId): CityStateKind => ({ cityStateId, kind, sinceRules: 77 });

/** Sealed packs hash this order. */
export const CITY_STATE_KINDS: readonly CityStateKind[] = [
  kind('citystate.bellowstead', 'clanhold'),
  kind('citystate.pyrefell', 'clanhold'),
  kind('citystate.dunwell', 'market'),
  kind('citystate.candlerest', 'market'),
  kind('citystate.grasshalt', 'camp'),
  kind('citystate.quickfallow', 'clanhold'),
  kind('citystate.sixways', 'camp'),
  kind('citystate.spindlewood', 'camp'),
  kind('citystate.willowmere', 'cove'),
  kind('citystate.loamferry', 'market'),
  kind('citystate.wrackpool', 'cove'),
  kind('citystate.cullethaven', 'cove'),
  kind('citystate.bittern_quay', 'cove'),
  kind('citystate.hoarhold', 'clanhold'),
  kind('citystate.highseam', 'clanhold'),
  kind('citystate.ninearch', 'clanhold'),
  kind('citystate.lodestair', 'market'),
  kind('citystate.hollowlease', 'market'),
  kind('citystate.chalkvigil', 'clanhold'),
  kind('citystate.endleaf', 'market'),
  kind('citystate.duskpress', 'market'),
  kind('citystate.windlass_ledge', 'camp'),
  kind('citystate.lockmouth', 'cove'),
  kind('citystate.tollfast', 'camp'),
  kind('citystate.kilnwater', 'clanhold'),
  kind('citystate.beaconfall', 'clanhold'),
  kind('citystate.threewells', 'market'),
  kind('citystate.lampmoor', 'market'),
  kind('citystate.longgrass', 'camp'),
  kind('citystate.ashcandle', 'clanhold'),
  kind('citystate.crossmoot', 'camp'),
  kind('citystate.sporeholt', 'camp'),
  kind('citystate.fenlock', 'cove'),
  kind('citystate.reedgate', 'market'),
  kind('citystate.shanty_deep', 'cove'),
  kind('citystate.glassmere', 'cove'),
  kind('citystate.saltreach', 'cove'),
  kind('citystate.rimefast', 'clanhold'),
  kind('citystate.anvilgate', 'clanhold'),
  kind('citystate.wardstone', 'clanhold'),
  kind('citystate.halfmeasure', 'market'),
  kind('citystate.undershelf', 'market'),
  kind('citystate.ossary', 'clanhold'),
  kind('citystate.marginhold', 'market'),
  kind('citystate.vesperlight', 'market'),
  kind('citystate.cragperch', 'camp'),
  kind('citystate.sluicehead', 'cove'),
  kind('citystate.paymast', 'camp'),
];
export const cityStateKindsForRules = (version: number): readonly CityStateKind[] => CITY_STATE_KINDS.filter(item => item.sinceRules <= version);
export const cityStateKindDefinition = (id: CityStateKindId): CityStateKindDefinition => CITY_STATE_KIND_DEFINITIONS.find(item => item.id === id)!;
export const cityStateKindFor = (cityStateId: string, version = 77): CityStateKindDefinition | undefined => { const entry = cityStateKindsForRules(version).find(item => item.cityStateId === cityStateId); return entry ? cityStateKindDefinition(entry.kind) : undefined; };

export function validateCityStateKindContent(entries = CITY_STATE_KINDS): void {
  entries.forEach(entry => cityStateKindSchema.parse(entry));
  const ids = entries.map(entry => entry.cityStateId);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate city-state kind');
  for (const entry of entries) if (!CITY_STATES.some(item => item.id === entry.cityStateId)) throw new Error('A kind names a city-state of the roster: ' + entry.cityStateId);
  for (const cityState of CITY_STATES) if (!entries.some(entry => entry.cityStateId === cityState.id)) throw new Error('Every city-state has a kind: ' + cityState.id);
  for (const definition of CITY_STATE_KIND_DEFINITIONS) if (!entries.some(entry => entry.kind === definition.id)) throw new Error('Every kind has a city-state: ' + definition.id);
}
