import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, previewSupplyAccessCells, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { isPassable, neighbors } from '@theandril/mapgen';
import { createJournal, replayArchive } from '../../chronicle/src';
import { withRules } from '../../sim/src/rules';
import { supplyAccessCampaign } from '../../test-fixtures/src/supply-access-fixture';
import { prosperityCampaign } from '../../test-fixtures/src/victory-fixture';
import { NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { answerSupplyAccess, pendingSupplyAccessFees, planSupplyAccess, SUPPLY_ACCESS_REQUEST_INTERVAL } from './supply-access';
import { planTurnWithReasons } from './index';
import { planDiplomacy, protectedFactions } from './diplomacy';

const issue = (state: GameState, command: GameCommand) => expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
function decisionTurn(state: GameState, factionId: string) {
  const slot = [...factionId].reduce((total, char) => total + char.charCodeAt(0), 0) % SUPPLY_ACCESS_REQUEST_INTERVAL;
  while (state.turn % SUPPLY_ACCESS_REQUEST_INTERVAL !== slot) state.turn++;
  return getObservation(state, factionId);
}

describe('observed supply-access diplomacy AI', () => {
  it('buys a genuinely useful foreign harbor through ordinary commands, pays only on acceptance and refills its loaded convoy', () => {
    const { state, buyerId, providerId, fleetId, cargoId, fieldId, sourceId } = supplyAccessCampaign();
    const view = decisionTurn(state, buyerId), before = stateHash(state), plan = planSupplyAccess(view);
    expect(plan?.commands).toEqual([{ type: 'proposeSupplyAccess', factionId: buyerId, targetFactionId: providerId, settlementId: sourceId, feeCoin: 20, termTurns: 10 }]);
    expect(plan?.heldArmyIds).toEqual(new Set([fleetId]));
    expect(stateHash(state)).toBe(before);
    expect(view.supply.find(item => item.armyId === fieldId)?.supplied).toBe(false);
    const journal = createJournal(state, { mode: 'watch', coverage: 'from-save' }), buyerCoin = state.factions[0]!.treasury, providerCoin = state.factions[1]!.treasury;
    expect(journal.record(state, plan!.commands[0]!).ok).toBe(true);
    expect(state.factions[0]!.treasury).toBe(buyerCoin);
    expect(pendingSupplyAccessFees(getObservation(state, buyerId))).toBe(20);
    expect(planSupplyAccess(getObservation(state, buyerId))).toBeNull();
    const incoming = getObservation(state, providerId), answer = answerSupplyAccess(incoming);
    expect(answer?.commands[0]).toMatchObject({ type: 'respondSupplyAccess', accept: true });
    // This integrated entry point must answer before optional spending/movement.
    expect(planTurnWithReasons(incoming).commands).toEqual(answer!.commands);
    expect(journal.record(state, answer!.commands[0]!).ok).toBe(true);
    expect(state.factions[0]!.treasury).toBe(buyerCoin - 20); expect(state.factions[1]!.treasury).toBe(providerCoin + 20);
    expect(pendingSupplyAccessFees(getObservation(state, buyerId))).toBe(0);
    expect(journal.record(state, { type: 'endTurn', factionId: buyerId }).ok).toBe(true);
    for (const armyId of [fleetId, cargoId]) expect(getObservation(state, buyerId).supply.find(item => item.armyId === armyId)?.fleetProvisions).toMatchObject({ remaining: 8, refilling: true });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(state));
  });

  it('holds the requesting fleet for the complete proposal pass and keeps paid promises out of ordinary spending', () => {
    const { state, buyerId, providerId, fleetId, proposal } = supplyAccessCampaign();
    const view = decisionTurn(state, buyerId), before = stateHash(state), plan = planTurnWithReasons(view);
    expect(plan.commands).toContainEqual(proposal);
    expect(plan.commands.length).toBeGreaterThan(1);
    expect(plan.commands.some(command => 'armyId' in command && command.armyId === fleetId
      || 'fleetId' in command && command.fleetId === fleetId
      || 'sourceArmyId' in command && (command.sourceArmyId === fleetId || command.targetArmyId === fleetId))).toBe(false);
    expect(plan.commands.some(command => command.type === 'declareWar' && command.targetFactionId === providerId)).toBe(false);
    expect(plan.commands.some(command => command.type === 'besiege' && command.settlementId === proposal.settlementId)).toBe(false);
    expect(stateHash(state)).toBe(before);
    state.factions[0]!.treasury = 64;
    issue(state, proposal);
    const pending = getObservation(state, buyerId), ordinary = planTurnWithReasons(pending);
    expect(protectedFactions(pending).has(providerId)).toBe(true);
    expect(ordinary.commands.length).toBeGreaterThan(0);
    for (const command of ordinary.commands) issue(state, command);
    expect(state.factions[0]!.treasury).toBeGreaterThanOrEqual(proposal.feeCoin);
    expect(state.supplyAccess.offers).toHaveLength(1);
    issue(state, answerSupplyAccess(getObservation(state, providerId))!.commands[0]!);
    for (const [own, partner] of [[buyerId, providerId], [providerId, buyerId]]) expect(protectedFactions(getObservation(state, own!)).has(partner!)).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('retains the public quote, operating reserve and caller commitments; never bids against existing requests or direct routes', () => {
    const { state, buyerId, fleetId, fieldId } = supplyAccessCampaign();
    state.factions[0]!.treasury = 64;
    const view = decisionTurn(state, buyerId);
    expect(planSupplyAccess(view, 20)).not.toBeNull();
    expect(planSupplyAccess(view, 21)).toBeNull();
    expect(planSupplyAccess({ ...view, turn: view.turn + 1 })).toBeNull();
    state.routes[fleetId] = { armyId: fleetId, origin: state.armies[fleetId]!.cell, waypoints: [N.fleetCell], path: [state.armies[fleetId]!.cell], status: 'paused', pauseReason: 'Authored direct order', knownHostileIds: [] };
    state.routes[fieldId] = { armyId: fieldId, origin: state.armies[fieldId]!.cell, waypoints: [N.islandCell], path: [state.armies[fieldId]!.cell], status: 'paused', pauseReason: 'Authored direct order', knownHostileIds: [] };
    expect(planSupplyAccess(getObservation(state, buyerId))).toBeNull();
    delete state.routes[fleetId]; delete state.routes[fieldId];
    issue(state, planSupplyAccess(getObservation(state, buyerId))!.commands[0]!);
    expect(planSupplyAccess(getObservation(state, buyerId))).toBeNull();
  });

  it('declines a land-only source for a fleet and prefers existing supply instead of paying for a duplicate', () => {
    const { state, buyerId, fieldId, fleetId } = supplyAccessCampaign({ harbor: false });
    delete state.armies[fieldId]; refreshAuthoredSight(state);
    const view = decisionTurn(state, buyerId);
    expect(view.supply.find(item => item.armyId === fleetId)?.fleetProvisions?.remaining).toBe(0);
    expect(planSupplyAccess(view)).toBeNull();
    const normal = supplyAccessCampaign();
    issue(normal.state, normal.proposal);
    issue(normal.state, { type: 'respondSupplyAccess', factionId: normal.providerId, offerId: normal.state.supplyAccess.offers[0]!.id, accept: true });
    expect(planSupplyAccess(decisionTurn(normal.state, normal.buyerId))).toBeNull();
  });

  it('rejects underpriced or currently unpayable incoming offers without learning the buyer’s treasury', () => {
    const { state, buyerId, providerId, proposal } = supplyAccessCampaign();
    issue(state, { ...proposal, feeCoin: 1 });
    const cheap = answerSupplyAccess(getObservation(state, providerId));
    expect(cheap?.commands[0]).toMatchObject({ type: 'respondSupplyAccess', accept: false }); issue(state, cheap!.commands[0]!);
    issue(state, proposal);
    const initial = getObservation(state, providerId), initialAnswer = answerSupplyAccess(initial);
    state.factions.find(faction => faction.id === buyerId)!.treasury += 123;
    const rich = getObservation(state, providerId);
    expect(rich).toEqual(initial); expect(answerSupplyAccess(rich)).toEqual(initialAnswer);
    state.factions.find(faction => faction.id === buyerId)!.treasury = 19;
    const poor = getObservation(state, providerId), refusal = answerSupplyAccess(poor);
    expect(poor.supplyAccess?.offers[0]?.acceptanceBlocker).toBe('This offer cannot currently be settled.');
    expect(refusal?.commands[0]).toMatchObject({ type: 'respondSupplyAccess', accept: false }); issue(state, refusal!.commands[0]!);
    expect(state.supplyAccess.agreements).toEqual([]);
  });

  it('cannot invent a foreign source or a route through unknown water, and ignores hidden state changes', () => {
    const { state, buyerId, providerId, fieldId, fleetId, cargoId, sourceId } = supplyAccessCampaign();
    delete state.armies[fieldId]; delete state.armies[cargoId]; delete state.transports[cargoId];
    state.armies[fleetId]!.cell = N.voyageCell - 7;
    state.explored[buyerId] = new Set(); refreshAuthoredSight(state);
    const view = decisionTurn(state, buyerId), before = stateHash(state);
    expect(view.settlements.some(town => town.id === sourceId)).toBe(false);
    expect(previewSupplyAccessCells(view, sourceId)).toEqual([]);
    expect(planSupplyAccess(view)).toBeNull(); expect(stateHash(state)).toBe(before);
    state.settlements[sourceId]!.name = 'Unseen renamed port';
    state.factions.find(faction => faction.id === providerId)!.treasury += 123;
    const changed = getObservation(state, buyerId);
    expect(changed).toEqual(view); expect(planSupplyAccess(changed)).toBeNull();
  });

  it('requires a real charted route to a compatible cell near the port when the needy fleet is outside its reach', () => {
    const { state, buyerId, fieldId, fleetId, cargoId, sourceId } = supplyAccessCampaign();
    delete state.armies[fieldId]; delete state.transports[cargoId];
    state.armies[cargoId]!.cell = N.landingCell; // Ashore founder keeps the offered port in ordinary sight.
    state.armies[fleetId]!.cell = state.world.width * 3 + 29;
    refreshAuthoredSight(state);
    const charted = decisionTurn(state, buyerId);
    expect(previewSupplyAccessCells(charted, sourceId)).not.toContain(state.armies[fleetId]!.cell);
    expect(planSupplyAccess(charted)?.commands[0]).toMatchObject({ type: 'proposeSupplyAccess', settlementId: sourceId });
    state.explored[buyerId] = new Set(); refreshAuthoredSight(state);
    const fog = getObservation(state, buyerId);
    expect(fog.settlements.some(town => town.id === sourceId)).toBe(true);
    expect(planSupplyAccess(fog)).toBeNull();
  });

  it('keeps rules33 observations and AI proposals free of supply-access control', () => {
    const { state, buyerId, providerId, proposal } = supplyAccessCampaign();
    issue(state, proposal);
    for (const id of [buyerId, providerId]) withRules(state, 33, () => {
      const view = getObservation(state, id);
      expect(view.supplyAccess).toBeUndefined(); expect(planSupplyAccess(view)).toBeNull();
      expect(answerSupplyAccess(view)).toBeNull(); expect(pendingSupplyAccessFees(view)).toBe(0);
      expect(planTurnWithReasons(view).commands.some(command => ['proposeSupplyAccess', 'respondSupplyAccess', 'endSupplyAccess'].includes(command.type))).toBe(false);
    });
  });

  it('does not spend a pending service fee on an otherwise legally ready victory project', () => {
    const state = prosperityCampaign(34), buyerId = state.turnOwnerId, provider = state.factions[1]!;
    issue(state, { type: 'research', factionId: buyerId, technologyId: 'technology.civic_accounts' });
    issue(state, { type: 'adoptInstitution', factionId: buyerId, institutionId: 'institution.charter_compact' });
    const source = Object.values(state.settlements).find(town => town.factionId === provider.id)!;
    // Authored diplomatic contact only; project eligibility and both offers use
    // ordinary observed quotes and commands, with no project completion injected.
    state.armies['army.2']!.cell = source.cell; refreshAuthoredSight(state);
    state.factions[0]!.treasury = getObservation(state, buyerId).progression.project.coinCost;
    const ready = getObservation(state, buyerId);
    expect(ready.progression.project.blockers).toEqual([]);
    expect(planTurnWithReasons(ready).commands[0]?.type).toBe('startVictoryProject');
    issue(state, { type: 'proposeSupplyAccess', factionId: buyerId, targetFactionId: provider.id, settlementId: source.id, feeCoin: 20, termTurns: 10 });
    const promised = getObservation(state, buyerId), plan = planTurnWithReasons(promised);
    expect(promised.progression.project.blockers).toEqual([]); // Legally affordable; policy must retain the promise.
    expect(plan.commands.some(command => command.type === 'startVictoryProject')).toBe(false);
    for (const command of plan.commands) issue(state, command);
    expect(state.factions[0]!.treasury).toBeGreaterThanOrEqual(20);
    issue(state, answerSupplyAccess(getObservation(state, provider.id))!.commands[0]!);
    expect(state.supplyAccess.agreements).toHaveLength(1);
  });

  it('reserves a third realm’s pending fee before accepting paid peace with a different enemy', () => {
    let state = createGame({ seed: 20260927, size: 'tiny', factionCount: 3, generatorVersion: 4 });
    const [buyer, provider, enemy] = state.factions;
    for (const faction of state.factions) {
      const founder = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
      issue(state, { type: 'found', factionId: faction.id, armyId: founder.id, name: `${faction.name} negotiation hearth` });
    }
    const home = Object.values(state.settlements).find(town => town.factionId === buyer!.id)!;
    const source = Object.values(state.settlements).find(town => town.factionId === provider!.id)!;
    const buyerScout = Object.values(state.armies).find(army => army.factionId === buyer!.id)!;
    const enemyScout = Object.values(state.armies).find(army => army.factionId === enemy!.id)!;
    // Author contact, not a diplomatic outcome: ordinary commands below create
    // the war, eight elapsed rounds, the service promise and requested payment.
    buyerScout.cell = neighbors(source.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
    enemyScout.cell = neighbors(home.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
    refreshAuthoredSight(state); state = deserializeGame(serializeGame(state));
    issue(state, { type: 'declareWar', factionId: buyer!.id, targetFactionId: enemy!.id });
    for (let turn = 0; turn < 8; turn++) issue(state, { type: 'endTurn', factionId: buyer!.id });
    state.factions[0]!.treasury = 20;
    state.armies[buyerScout.id]!.formations[0]!.morale = 20; // Explicit exhausted-force policy input.
    issue(state, { type: 'proposeSupplyAccess', factionId: buyer!.id, targetFactionId: provider!.id, settlementId: source.id, feeCoin: 20, termTurns: 10 });
    issue(state, { type: 'proposePeace', factionId: enemy!.id, targetFactionId: buyer!.id, terms: { offerCoin: 0, requestCoin: 5, truceTurns: 10 } });
    const view = getObservation(state, buyer!.id), oldOrdering = planDiplomacy(view), corrected = planTurnWithReasons(view);
    expect(oldOrdering?.commands[0]).toMatchObject({ type: 'respondPeace', accept: true });
    const beforeFix = deserializeGame(serializeGame(state)); issue(beforeFix, oldOrdering!.commands[0]!);
    expect(beforeFix.factions[0]!.treasury).toBe(15);
    expect(getObservation(beforeFix, provider!.id).supplyAccess?.offers[0]?.acceptanceBlocker).toBe('This offer cannot currently be settled.');
    expect(corrected.commands).toHaveLength(1);
    expect(corrected.commands[0]).toMatchObject({ type: 'respondPeace', accept: false });
    const journal = createJournal(state, { mode: 'player', coverage: 'from-save' });
    expect(journal.record(state, corrected.commands[0]!).ok).toBe(true);
    expect(state.factions[0]!.treasury).toBe(20);
    const accepted = answerSupplyAccess(getObservation(state, provider!.id))!.commands[0]!;
    expect(accepted).toMatchObject({ type: 'respondSupplyAccess', accept: true });
    expect(journal.record(state, accepted).ok).toBe(true);
    expect(state.factions[0]!.treasury).toBe(0);
    expect(state.supplyAccess.agreements).toHaveLength(1);
    expect(serializeGame(replayArchive(journal.materialize()))).toBe(serializeGame(state));
  });
});
