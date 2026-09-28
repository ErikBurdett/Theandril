import { describe, expect, it } from 'vitest';
import { createJournal, replayArchive } from '../../chronicle/src';
import { NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { supplyAccessCampaign } from '../../test-fixtures/src/supply-access-fixture';
import { applyCommand, getObservation } from './simulation';
import { armySupply, FLEET_PROVISION_TURNS, observedSuppliedCells, previewSupplyAccessCells, suppliedCells, SUPPLY_ATTRITION } from './supply';
import { advanceSupplyAccess, assessSupplyAccess, assessSupplyAccessOffer, observeSupplyAccess, proposeSupplyAccess, respondSupplyAccess } from './supply-access';
import { assertNoSupplyAccess, validateSupplyAccess } from './supply-access-state';
import { deserializeGame, serializeGame, stateHash } from './save';
import { withRules } from './rules';
import type { GameCommand, GameState } from './types';

const issue = (state: GameState, command: GameCommand) => {
  const result = applyCommand(state, command);
  expect(result.ok, result.error ?? JSON.stringify(command)).toBe(true);
  return result;
};
function fixture(harbor = true) {
  return supplyAccessCampaign({ approach: false, harbor });
}
function agree(state: GameState, proposal: ReturnType<typeof fixture>['proposal']) {
  issue(state, proposal);
  issue(state, { type: 'respondSupplyAccess', factionId: proposal.targetFactionId, offerId: state.supplyAccess.offers[0]!.id, accept: true });
  return state.supplyAccess.agreements[0]!;
}

describe('paid source-specific supply access', () => {
  it('forecasts the same ordinary source reach over permitted terrain without mutating state', () => {
    const { state, buyerId, sourceId, proposal } = supplyAccessCampaign();
    const before = stateHash(state), forecast = previewSupplyAccessCells(getObservation(state, buyerId), sourceId);
    expect(forecast).toContain(state.armies[N.fleetId]!.cell);
    expect(forecast).toContain(N.landingCell);
    expect(stateHash(state)).toBe(before);
    const own = suppliedCells(state, buyerId);
    const agreement = agree(state, proposal), actual = suppliedCells(state, buyerId);
    expect([...actual].filter(([, source]) => source === agreement.id).map(([cell]) => cell).sort((a, b) => a - b))
      .toEqual(forecast.filter(cell => !own.has(cell)));
    expect(previewSupplyAccessCells(getObservation(state, proposal.targetFactionId), sourceId)).toEqual([]);
  });

  it('pays only on acceptance and supplies real land forces and a loaded fleet through saved replay', () => {
    const { state, buyerId, providerId, fieldId, proposal } = supplyAccessCampaign();
    const initialBuyer = state.factions[0]!.treasury, initialProvider = state.factions[1]!.treasury;
    expect(armySupply(state, fieldId).supplied).toBe(false);
    expect(armySupply(state, N.fleetId).fleetProvisions).toMatchObject({ remaining: 0, refilling: false });
    const journal = createJournal(state, { mode: 'watch', coverage: 'from-save' });
    const record = (command: GameCommand) => { const result = journal.record(state, command); expect(result.ok, result.error).toBe(true); };
    record(proposal);
    expect(state.factions[0]!.treasury).toBe(initialBuyer);
    const pending = deserializeGame(serializeGame(state));
    expect(stateHash(pending)).toBe(stateHash(state));
    record({ type: 'respondSupplyAccess', factionId: providerId, offerId: state.supplyAccess.offers[0]!.id, accept: true });
    expect(state.factions[0]!.treasury).toBe(initialBuyer - 20);
    expect(state.factions[1]!.treasury).toBe(initialProvider + 20);
    expect(armySupply(state, fieldId)).toMatchObject({ supplied: true, sourceSettlementId: N.islandId });
    expect(armySupply(state, N.fleetId)).toMatchObject({ sourceSettlementId: N.islandId, fleetProvisions: { refilling: true } });
    const forceBefore = state.armies[fieldId]!.formations.map(formation => formation.strength);
    record({ type: 'endTurn', factionId: buyerId });
    expect(armySupply(state, N.fleetId).fleetProvisions?.remaining).toBe(FLEET_PROVISION_TURNS);
    expect(armySupply(state, N.cargoId).fleetProvisions?.remaining).toBe(FLEET_PROVISION_TURNS);
    expect(state.events.some(event => event.type === 'fleet_resupplied')).toBe(true);
    expect(state.armies[fieldId]!.formations.map(formation => formation.strength)).toEqual(forceBefore);
    const restored = deserializeGame(serializeGame(state)), replayed = replayArchive(journal.materialize());
    expect(stateHash(restored)).toBe(stateHash(state)); expect(stateHash(replayed)).toBe(stateHash(state));
    expect(getObservation(replayed, buyerId)).toEqual(getObservation(state, buyerId));
  });

  it('restores land supply after termination by negotiating the same source again', () => {
    const { state, buyerId, providerId, fieldId, proposal } = fixture();
    const agreement = agree(state, proposal), before = state.armies[fieldId]!.formations.map(formation => formation.strength);
    const buyerCoin = state.factions[0]!.treasury, providerCoin = state.factions[1]!.treasury;
    issue(state, { type: 'endSupplyAccess', factionId: providerId, agreementId: agreement.id });
    expect(state.factions[0]!.treasury).toBe(buyerCoin); expect(state.factions[1]!.treasury).toBe(providerCoin);
    expect(armySupply(state, fieldId).supplied).toBe(false);
    issue(state, { type: 'endTurn', factionId: buyerId });
    expect(state.armies[fieldId]!.formations.map(formation => formation.strength)).toEqual(before.map(value => value - SUPPLY_ATTRITION));
    const restored = deserializeGame(serializeGame(state));
    for (const game of [state, restored]) {
      agree(game, proposal);
      issue(game, { type: 'endTurn', factionId: buyerId });
      expect(game.armies[fieldId]!.formations.map(formation => formation.strength)).toEqual(before.map(value => value - SUPPLY_ATTRITION));
    }
    expect(stateHash(restored)).toBe(stateHash(state));
  });

  it('keeps stale payments atomic and exposes only generic settlement feasibility to the provider', () => {
    const { state, providerId, proposal } = fixture();
    issue(state, proposal);
    const offerId = state.supplyAccess.offers[0]!.id;
    const prior = observeSupplyAccess(state, providerId);
    state.factions[0]!.treasury = 100;
    expect(observeSupplyAccess(state, providerId)).toEqual(prior);
    state.factions[0]!.treasury = 19;
    expect(observeSupplyAccess(state, providerId).offers[0]!.acceptanceBlocker).toBe('This offer cannot currently be settled.');
    const view = getObservation(state, providerId);
    expect(assessSupplyAccessOffer(view, view.supplyAccess!.offers[0]!).band).toBe('unlikely');
    const before = stateHash(state);
    expect(respondSupplyAccess(state, { type: 'respondSupplyAccess', factionId: providerId, offerId, accept: true }).ok).toBe(false);
    expect(stateHash(state)).toBe(before);
    state.factions[0]!.treasury = 20;
    state.factions[1]!.treasury = Number.MAX_SAFE_INTEGER;
    const overflow = stateHash(state);
    expect(respondSupplyAccess(state, { type: 'respondSupplyAccess', factionId: providerId, offerId, accept: true }).error).toMatch(/treasury limit/);
    expect(stateHash(state)).toBe(overflow);
    issue(state, { type: 'respondSupplyAccess', factionId: providerId, offerId, accept: false });
    expect(state.supplyAccess.offers).toEqual([]); expect(state.factions[0]!.treasury).toBe(20);
  });

  it('expires before supply resolution and lapses immediately on an ordinary declaration of war', () => {
    const { state, buyerId, providerId, fieldId, proposal } = fixture();
    const agreement = agree(state, { ...proposal, termTurns: 5 });
    while (state.turn < agreement.expiresTurn - 1) issue(state, { type: 'endTurn', factionId: buyerId });
    const before = state.armies[fieldId]!.formations.map(formation => formation.strength);
    issue(state, { type: 'endTurn', factionId: buyerId });
    expect(state.supplyAccess.agreements).toEqual([]);
    expect(state.armies[fieldId]!.formations.map(formation => formation.strength)).toEqual(before.map(value => value - SUPPLY_ATTRITION));
    agree(state, proposal);
    issue(state, { type: 'declareWar', factionId: buyerId, targetFactionId: providerId });
    expect(state.supplyAccess.agreements).toEqual([]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('discloses no new name or harbor upgrades after agreement and removes a lost source with generic notices', () => {
    const { state, buyerId, providerId, fieldId, proposal } = fixture(false);
    const agreement = agree(state, proposal);
    state.settlements[N.islandId]!.name = 'Later undisclosed name';
    state.settlements[N.islandId]!.buildings.push('building.harbor');
    expect(observeSupplyAccess(state, buyerId).agreements[0]!.source).toEqual(agreement.source);
    expect(armySupply(state, fieldId).reason).toContain(N.islandName);
    expect(suppliedCells(state, buyerId).has(N.voyageCell)).toBe(false);
    state.settlements[N.islandId]!.factionId = buyerId;
    const events = advanceSupplyAccess(state);
    expect(state.supplyAccess.agreements).toEqual([]);
    expect(events).toHaveLength(2);
    expect(events.every(event => !event.message.includes('Later undisclosed name') && !event.message.includes(providerId))).toBe(true);
  });

  it('validates actor, observed source, distinct contracts, strict IDs and public fee assessment', () => {
    const { state, buyerId, providerId, proposal } = fixture();
    const before = stateHash(state);
    expect(proposeSupplyAccess(state, { ...proposal, feeCoin: NaN }).ok).toBe(false);
    expect(proposeSupplyAccess(state, { ...proposal, feeCoin: 0 }).ok).toBe(false);
    expect(proposeSupplyAccess(state, { ...proposal, settlementId: N.homeId }).ok).toBe(false);
    expect(stateHash(state)).toBe(before);
    const view = getObservation(state, buyerId);
    expect(assessSupplyAccess(view, proposal)).toMatchObject({ band: 'likely', quotedFeeCoin: 20 });
    expect(assessSupplyAccess(view, { ...proposal, feeCoin: 1 })).toMatchObject({ band: 'uncertain', quotedFeeCoin: 20 });
    issue(state, proposal);
    const pending = stateHash(state), offerId = state.supplyAccess.offers[0]!.id;
    expect(proposeSupplyAccess(state, proposal).ok).toBe(false);
    expect(respondSupplyAccess(state, { type: 'respondSupplyAccess', factionId: buyerId, offerId, accept: true }).ok).toBe(false);
    expect(stateHash(state)).toBe(pending);
    issue(state, { type: 'respondSupplyAccess', factionId: providerId, offerId, accept: true });
    expect(() => validateSupplyAccess(state)).not.toThrow();
    state.supplyAccess.nextId = 1;
    expect(() => validateSupplyAccess(state)).toThrow(/counter/);
  });

  it('keeps historical rules33 supply and command capability unchanged and refuses lossy downgrades', () => {
    const { state, buyerId, proposal } = fixture();
    const old = withRules(state, 33, () => ({ graph: [...suppliedCells(state, buyerId)], supply: getObservation(state, buyerId).supply }));
    expect(withRules(state, 33, () => proposeSupplyAccess(state, proposal).ok)).toBe(false);
    agree(state, proposal);
    withRules(state, 33, () => {
      expect([...suppliedCells(state, buyerId)]).toEqual(old.graph);
      expect([...observedSuppliedCells(state, buyerId)]).toEqual(old.graph);
      expect(getObservation(state, buyerId).supply).toEqual(old.supply);
      expect(getObservation(state, buyerId).supplyAccess).toBeUndefined();
    });
    expect(() => assertNoSupplyAccess(state)).toThrow(/Historical/);
  });
});
