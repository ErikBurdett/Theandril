import { z } from 'zod';
import { CITY_STATES } from './city-states';
import { RESOURCES } from './resources';

/** Rules 60: every city-state trades in one good of its country. While a
 * realm holds the city-state as its client and the tribute is paid, the
 * good comes to the patron's stockpile each turn beside the coin: a client
 * city-state is a trade community as well as a tributary. Data only; the
 * simulation delivers the goods. */
const cityStateId = z.string().regex(/^citystate\.[a-z_]+$/);
const resourceId = z.string().regex(/^resource\.[a-z_]+$/);
export const cityStateTradeSchema = z.object({ cityStateId, resourceId, amount: z.number().int().min(1).max(4), sinceRules: z.union([z.literal(60), z.literal(69)]) }).strict();
export type CityStateTrade = z.infer<typeof cityStateTradeSchema>;
const trade = (cityStateId: string, resourceId: string, amount: number, sinceRules: 60 | 69 = 60): CityStateTrade => ({ cityStateId, resourceId, amount, sinceRules });

/** Sealed packs hash this order. */
export const CITY_STATE_TRADE: readonly CityStateTrade[] = [
  trade('citystate.bellowstead', 'resource.iron', 2),
  trade('citystate.pyrefell', 'resource.copper', 2),
  trade('citystate.dunwell', 'resource.salt', 2),
  trade('citystate.candlerest', 'resource.grain', 2),
  trade('citystate.grasshalt', 'resource.horses', 2),
  trade('citystate.quickfallow', 'resource.grain', 2),
  trade('citystate.sixways', 'resource.silver', 1),
  trade('citystate.spindlewood', 'resource.timber', 2),
  trade('citystate.willowmere', 'resource.grain', 2),
  trade('citystate.loamferry', 'resource.grain', 2),
  trade('citystate.wrackpool', 'resource.salt', 2),
  trade('citystate.cullethaven', 'resource.ashglass', 1),
  trade('citystate.bittern_quay', 'resource.salt', 2),
  trade('citystate.hoarhold', 'resource.iron', 2),
  trade('citystate.highseam', 'resource.iron', 2),
  trade('citystate.ninearch', 'resource.copper', 2),
  trade('citystate.lodestair', 'resource.silver', 1),
  trade('citystate.hollowlease', 'resource.silver', 1),
  trade('citystate.chalkvigil', 'resource.ashglass', 1),
  trade('citystate.endleaf', 'resource.timber', 2),
  trade('citystate.duskpress', 'resource.silver', 1),
  trade('citystate.windlass_ledge', 'resource.timber', 2),
  trade('citystate.lockmouth', 'resource.copper', 2),
  trade('citystate.tollfast', 'resource.horses', 2),
  // Rules 69: the second roster's goods.
  trade('citystate.kilnwater', 'resource.grain', 2, 69),
  trade('citystate.beaconfall', 'resource.timber', 2, 69),
  trade('citystate.threewells', 'resource.salt', 2, 69),
  trade('citystate.lampmoor', 'resource.grain', 2, 69),
  trade('citystate.longgrass', 'resource.horses', 2, 69),
  trade('citystate.ashcandle', 'resource.grain', 2, 69),
  trade('citystate.crossmoot', 'resource.horses', 2, 69),
  trade('citystate.sporeholt', 'resource.timber', 2, 69),
  trade('citystate.fenlock', 'resource.grain', 2, 69),
  trade('citystate.reedgate', 'resource.grain', 2, 69),
  trade('citystate.shanty_deep', 'resource.salt', 2, 69),
  trade('citystate.glassmere', 'resource.ashglass', 1, 69),
  trade('citystate.saltreach', 'resource.salt', 2, 69),
  trade('citystate.rimefast', 'resource.iron', 2, 69),
  trade('citystate.anvilgate', 'resource.iron', 2, 69),
  trade('citystate.wardstone', 'resource.copper', 2, 69),
  trade('citystate.halfmeasure', 'resource.silver', 1, 69),
  trade('citystate.undershelf', 'resource.silver', 1, 69),
  trade('citystate.ossary', 'resource.ashglass', 1, 69),
  trade('citystate.marginhold', 'resource.timber', 2, 69),
  trade('citystate.vesperlight', 'resource.silver', 1, 69),
  trade('citystate.cragperch', 'resource.timber', 2, 69),
  trade('citystate.sluicehead', 'resource.copper', 2, 69),
  trade('citystate.paymast', 'resource.horses', 2, 69),
];
export const cityStateTradeForRules = (version: number): readonly CityStateTrade[] => CITY_STATE_TRADE.filter(item => item.sinceRules <= version);
export const cityStateTradeFor = (cityStateId: string, version = 60): CityStateTrade | undefined => cityStateTradeForRules(version).find(item => item.cityStateId === cityStateId);

export function validateCityStateTradeContent(entries = CITY_STATE_TRADE): void {
  entries.forEach(entry => cityStateTradeSchema.parse(entry));
  const ids = entries.map(entry => entry.cityStateId);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate city-state trade');
  for (const entry of entries) {
    const city = CITY_STATES.find(item => item.id === entry.cityStateId);
    if (!city) throw new Error('A trade names a city-state of the roster: ' + entry.cityStateId);
    if ((city.sinceRules ?? 21) > entry.sinceRules) throw new Error('A trade is sealed no earlier than its city-state: ' + entry.cityStateId);
    if (!RESOURCES.some(item => item.id === entry.resourceId)) throw new Error('A trade names a resource of the catalogue: ' + entry.cityStateId);
  }
  for (const cityState of CITY_STATES) if (!entries.some(entry => entry.cityStateId === cityState.id)) throw new Error('Every city-state trades in a good: ' + cityState.id);
}
