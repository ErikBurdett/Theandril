import { MAX_SUPPLY_ACCESS_IMPORTS, MAX_SUPPLY_ACCESS_OFFERS, supplyAccessObservationSchema, type SupplyAccessObservation } from '@theandril/sim';

export function assertSupplyAccessResponse(value: unknown, factionId: string): asserts value is SupplyAccessObservation {
  const parsed = supplyAccessObservationSchema.safeParse(value);
  if (!parsed.success) throw new Error('The supply agreement update could not be read.');
  const sources = new Set<string>(), ids = new Set<string>();
  for (const [records, limit] of [[parsed.data.offers, MAX_SUPPLY_ACCESS_OFFERS], [parsed.data.agreements, MAX_SUPPLY_ACCESS_IMPORTS]] as const) {
    if (records.filter(record => record.buyerId === factionId).length > limit) throw new Error('The supply agreement limit could not be verified.');
    for (const [index, record] of records.entries()) {
      const source = `${record.buyerId}:${record.source.settlementId}`;
      if (![record.buyerId, record.providerId].includes(factionId) || record.buyerId === record.providerId || ids.has(record.id) || sources.has(source) || index > 0 && records[index - 1]!.id >= record.id) throw new Error('The supply agreement participants or references could not be read.');
      ids.add(record.id); sources.add(source);
    }
  }
}
