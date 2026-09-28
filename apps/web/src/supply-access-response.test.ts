import { describe, expect, it } from 'vitest';
import { applyCommand, getObservation } from '@theandril/sim';
import { supplyAccessCampaign } from '../../../packages/test-fixtures/src/supply-access-fixture';
import { assertSupplyAccessResponse } from './supply-access-response';

function example() {
  const fixture = supplyAccessCampaign();
  expect(applyCommand(fixture.state, fixture.proposal).ok).toBe(true);
  return { ...fixture, observed: getObservation(fixture.state, fixture.buyerId).supplyAccess! };
}
describe('supply agreement worker response boundary', () => {
  it('accepts canonical pending, active and empty participant views without changing them', () => {
    const { state, buyerId, providerId, observed } = example(), before = structuredClone(observed);
    expect(() => assertSupplyAccessResponse(observed, buyerId)).not.toThrow();
    expect(() => assertSupplyAccessResponse(getObservation(state, providerId).supplyAccess, providerId)).not.toThrow();
    expect(observed).toEqual(before);
    expect(applyCommand(state, { type: 'respondSupplyAccess', factionId: providerId, offerId: observed.offers[0]!.id, accept: true }).ok).toBe(true);
    const accepted = getObservation(state, buyerId).supplyAccess!;
    expect(accepted.offers).toEqual([]); expect(accepted.agreements).toHaveLength(1);
    expect(() => assertSupplyAccessResponse(accepted, buyerId)).not.toThrow();
    expect(applyCommand(state, { type: 'endSupplyAccess', factionId: buyerId, agreementId: accepted.agreements[0]!.id }).ok).toBe(true);
    expect(() => assertSupplyAccessResponse(getObservation(state, buyerId).supplyAccess, buyerId)).not.toThrow();
  });

  it('rejects missing, malformed, oversized, foreign, duplicate and unordered participant records', () => {
    const { buyerId, providerId, observed } = example(), first = observed.offers[0]!;
    const agreement = { id: 'supply-access.2', buyerId, providerId, source: first.source, feeCoin: first.feeCoin,
      termTurns: first.termTurns, startedTurn: first.createdTurn, expiresTurn: first.createdTurn + first.termTurns };
    const second = { ...first, id: 'supply-offer.2', source: { ...first.source, settlementId: 'settlement.999998' } };
    const malformed: unknown[] = [
      undefined, null, {}, { offers: [], agreements: [] }, { ...observed, offers: null }, { ...observed, agreements: null },
      { ...observed, quoteCoinPerTurn: 3 }, { ...observed, future: true },
      { ...observed, offers: [{ ...first, source: null }] }, { ...observed, offers: [{ ...first, feeCoin: -1 }] },
      { ...observed, offers: [{ ...first, acceptanceBlocker: undefined }] },
      { ...observed, offers: [{ ...first, buyerId: providerId, providerId }] },
      { ...observed, offers: [{ ...first, buyerId: 'faction.hidden', providerId: 'faction.other' }] },
      { ...observed, offers: [first, first] }, { ...observed, offers: [second, first] },
      { ...observed, agreements: [agreement] },
      { ...observed, offers: Array.from({ length: 9 }, (_, index) => ({ ...first, id: `supply-offer.${index + 1}`, source: { ...first.source, settlementId: `settlement.${index + 1}` } })) },
    ];
    for (const value of malformed) expect(() => assertSupplyAccessResponse(value, buyerId)).toThrow();
  });
});
