import type { CommandResult, DomainEvent, GameState, Observation } from './types';
import { rulesVersion } from './rules';
import { indexes } from './visibility';
import { atWar } from './warfare';
import { MAX_SUPPLY_ACCESS_IMPORTS, MAX_SUPPLY_ACCESS_OFFERS, SUPPLY_ACCESS_COIN_PER_TURN, SUPPLY_ACCESS_OFFER_TURNS, supplyAccessCommandSchemas,
  type SupplyAccessAgreement, type SupplyAccessAssessment, type SupplyAccessCommand, type SupplyAccessObservation, type SupplyAccessOffer } from './supply-access-state';
export * from './supply-access-state';

const HARBOR = 'building.harbor';
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const modern = (state: GameState) => rulesVersion(state) >= 34;
const pairEvents = (state: GameState, record: { buyerId: string; providerId: string }, type: string, message: string): DomainEvent[] =>
  [record.buyerId, record.providerId].sort().map(factionId => ({ turn: state.turn, factionId, type, message }));
const sameSource = (record: SupplyAccessOffer | SupplyAccessAgreement, buyerId: string, settlementId: string) => record.buyerId === buyerId && record.source.settlementId === settlementId;
const sourceHeld = (state: GameState, record: SupplyAccessOffer | SupplyAccessAgreement) => {
  const town = state.settlements[record.source.settlementId];
  return Boolean(town && town.factionId === record.providerId && town.cell === record.source.cell);
};
const imports = (state: GameState, buyerId: string) => state.supplyAccess.agreements.filter(record => record.buyerId === buyerId);

export function proposeSupplyAccess(state: GameState, command: Extract<SupplyAccessCommand, { type: 'proposeSupplyAccess' }>): CommandResult {
  if (!modern(state)) return fail('Supply agreements are unavailable under these historical rules.');
  const parsed = supplyAccessCommandSchemas[0].safeParse(command);
  if (!parsed.success) return fail('Choose valid supply access terms: 1–1,000,000 coin and 5–30 turns.');
  const { factionId: buyerId, targetFactionId: providerId, settlementId, feeCoin, termTurns } = parsed.data;
  const buyer = state.factions.find(faction => faction.id === buyerId), town = state.settlements[settlementId];
  if (!buyer || buyerId === providerId || !state.factions.some(faction => faction.id === providerId)) return fail('Choose a different known provider realm.');
  if (!town || town.factionId !== providerId || !indexes(state).visible.get(buyerId)?.has(town.cell)) return fail('Observe the provider’s hearth before requesting supply access.');
  if (atWar(state, buyerId, providerId)) return fail('Make peace with the provider before requesting supply access.');
  if (buyer.treasury < feeCoin) return fail('You cannot fund the offered supply fee.');
  const access = state.supplyAccess;
  if (access.offers.filter(offer => offer.buyerId === buyerId).length >= MAX_SUPPLY_ACCESS_OFFERS) return fail('A realm may keep at most eight pending supply requests.');
  if (imports(state, buyerId).length >= MAX_SUPPLY_ACCESS_IMPORTS) return fail('A realm may import supply from at most eight contracted hearths.');
  if ([...access.offers, ...access.agreements].some(record => sameSource(record, buyerId, settlementId))) return fail('This hearth already has a pending or active supply agreement with you.');
  if (access.nextId >= Number.MAX_SAFE_INTEGER) return fail('The supply agreement identifier limit has been reached.');
  const offer: SupplyAccessOffer = { id: `supply-offer.${access.nextId++}`, buyerId, providerId,
    source: { settlementId, name: town.name, cell: town.cell, harbor: town.buildings.includes(HARBOR) }, feeCoin, termTurns,
    createdTurn: state.turn, expiresTurn: state.turn + SUPPLY_ACCESS_OFFER_TURNS };
  access.offers.push(offer); access.offers.sort(byId);
  return { ok: true, events: pairEvents(state, offer, 'supply_access_proposed', `Supply request ${offer.id} asks for ${termTurns} turns from “${offer.source.name}” for ${feeCoin} coin on acceptance. It expires at turn ${offer.expiresTurn}; keep the fee available.`) };
}

/** Actual acceptance rechecks all obligations before any payment or removal. */
function acceptanceBlocker(state: GameState, offer: SupplyAccessOffer): string | null {
  if (offer.expiresTurn <= state.turn) return 'This supply request has expired.';
  if (!sourceHeld(state, offer)) return 'The provider can no longer supply the agreed hearth.';
  if (atWar(state, offer.buyerId, offer.providerId)) return 'Supply agreements cannot start between realms at war.';
  if (state.sieges[offer.source.settlementId]) return 'The agreed hearth is under siege and cannot begin supply service.';
  const town = state.settlements[offer.source.settlementId]!;
  if (offer.source.harbor && !town.buildings.includes(HARBOR)) return 'The provider can no longer offer the disclosed harbor service.';
  const buyer = state.factions.find(faction => faction.id === offer.buyerId), provider = state.factions.find(faction => faction.id === offer.providerId);
  if (!buyer || !provider) return 'A party to the supply request no longer exists.';
  if (buyer.treasury < offer.feeCoin) return 'The buyer can no longer fund the offered supply fee.';
  if (!Number.isSafeInteger(provider.treasury + offer.feeCoin)) return 'The fee would exceed the provider’s treasury limit.';
  if (imports(state, offer.buyerId).length >= MAX_SUPPLY_ACCESS_IMPORTS) return 'The buyer has reached its eight-hearth supply import limit.';
  if (state.supplyAccess.nextId >= Number.MAX_SAFE_INTEGER) return 'The supply agreement identifier limit has been reached.';
  return null;
}

export function respondSupplyAccess(state: GameState, command: Extract<SupplyAccessCommand, { type: 'respondSupplyAccess' }>): CommandResult {
  if (!modern(state)) return fail('Supply agreements are unavailable under these historical rules.');
  const parsed = supplyAccessCommandSchemas[1].safeParse(command);
  if (!parsed.success) return fail('Choose a valid incoming supply request.');
  const offer = state.supplyAccess.offers.find(item => item.id === command.offerId && item.providerId === command.factionId);
  if (!offer) return fail('Choose an incoming supply request addressed to your realm.');
  if (offer.expiresTurn <= state.turn) return fail('This supply request has expired.');
  const blocker = command.accept ? acceptanceBlocker(state, offer) : null;
  if (blocker) return fail(blocker);
  state.supplyAccess.offers = state.supplyAccess.offers.filter(item => item.id !== offer.id);
  if (!command.accept) return { ok: true, events: pairEvents(state, offer, 'supply_access_refused', `Supply request ${offer.id} was refused. No coin changed hands.`) };
  state.factions.find(faction => faction.id === offer.buyerId)!.treasury -= offer.feeCoin;
  state.factions.find(faction => faction.id === offer.providerId)!.treasury += offer.feeCoin;
  const agreement: SupplyAccessAgreement = { id: `supply-access.${state.supplyAccess.nextId++}`, buyerId: offer.buyerId, providerId: offer.providerId,
    source: { ...offer.source }, feeCoin: offer.feeCoin, termTurns: offer.termTurns, startedTurn: state.turn, expiresTurn: state.turn + offer.termTurns };
  state.supplyAccess.agreements.push(agreement); state.supplyAccess.agreements.sort(byId);
  return { ok: true, events: pairEvents(state, agreement, 'supply_access_accepted', `Paid ${agreement.feeCoin} coin for supply from “${agreement.source.name}” until turn ${agreement.expiresTurn}. Existing range and disruptions still apply. Early termination gives no refund; this grants neither military passage nor alliance.`) };
}

export function endSupplyAccess(state: GameState, command: Extract<SupplyAccessCommand, { type: 'endSupplyAccess' }>): CommandResult {
  if (!modern(state)) return fail('Supply agreements are unavailable under these historical rules.');
  const parsed = supplyAccessCommandSchemas[2].safeParse(command);
  if (!parsed.success) return fail('Choose one of your supply agreements.');
  const agreement = state.supplyAccess.agreements.find(item => item.id === command.agreementId && [item.buyerId, item.providerId].includes(command.factionId));
  if (!agreement) return fail('Choose one of your supply agreements.');
  state.supplyAccess.agreements = state.supplyAccess.agreements.filter(item => item.id !== agreement.id);
  return { ok: true, events: pairEvents(state, agreement, 'supply_access_ended', `Supply access to “${agreement.source.name}” was ended by the ${command.factionId === agreement.providerId ? 'provider' : 'buyer'}. No payment is refunded; existing travel continues.`) };
}

/** Run after accepted ownership/war changes and before this turn's supply phase.
 * A generic lapse is a bilateral diplomatic fact, not a report of the captor. */
export function advanceSupplyAccess(state: GameState): DomainEvent[] {
  if (!modern(state)) return [];
  const events: DomainEvent[] = [];
  const retain = (record: SupplyAccessOffer | SupplyAccessAgreement) => {
    const reason = record.expiresTurn <= state.turn ? 'its agreed term expired'
      : atWar(state, record.buyerId, record.providerId) ? 'the parties are at war'
        : !sourceHeld(state, record) ? 'the agreed source is no longer provided' : null;
    if (!reason) return true;
    events.push(...pairEvents(state, record, 'supply_access_lapsed', `${record.id} ended because ${reason}. No payment is refunded.`));
    return false;
  };
  state.supplyAccess.offers = state.supplyAccess.offers.filter(retain);
  state.supplyAccess.agreements = state.supplyAccess.agreements.filter(retain);
  return events;
}

/** The real source graph always rechecks current rules, even before cleanup. */
export function supplyAccessSources(state: GameState, buyerId: string): SupplyAccessAgreement[] {
  if (!modern(state)) return [];
  return imports(state, buyerId).filter(agreement => agreement.expiresTurn > state.turn && sourceHeld(state, agreement)
    && !atWar(state, buyerId, agreement.providerId) && !state.sieges[agreement.source.settlementId]);
}

/** Contract settlement feasibility is disclosed to its participants, without
 * treasury amounts or other counterpart contracts. Above the fee threshold,
 * changes to the buyer's private balance do not alter the provider's view. */
export function observeSupplyAccess(state: GameState, factionId: string): SupplyAccessObservation {
  const visible = indexes(state).visible.get(factionId);
  const offers = state.supplyAccess.offers.filter(offer => [offer.buyerId, offer.providerId].includes(factionId)).map(offer => {
    let blocker: string | null = null;
    if (offer.buyerId === factionId && (state.factions.find(faction => faction.id === factionId)?.treasury ?? 0) < offer.feeCoin) blocker = 'You can no longer fund the offered fee.';
    if (offer.providerId === factionId || visible?.has(offer.source.cell)) {
      if (!sourceHeld(state, offer)) blocker = 'The agreed source is no longer provided.';
      else if (state.sieges[offer.source.settlementId]) blocker = 'The agreed hearth is under siege and cannot begin supply service.';
      else if (offer.source.harbor && !state.settlements[offer.source.settlementId]!.buildings.includes(HARBOR)) blocker = 'The disclosed harbor service is unavailable.';
    }
    if (!blocker && offer.providerId === factionId && acceptanceBlocker(state, offer)) blocker = 'This offer cannot currently be settled.';
    return { ...offer, source: { ...offer.source }, acceptanceBlocker: blocker };
  });
  return { offers, agreements: state.supplyAccess.agreements.filter(agreement => [agreement.buyerId, agreement.providerId].includes(factionId))
    .map(agreement => ({ ...agreement, source: { ...agreement.source } })), quoteCoinPerTurn: SUPPLY_ACCESS_COIN_PER_TURN };
}

function assessment(view: Observation, buyerId: string, providerId: string, settlementId: string, feeCoin: number, termTurns: number): SupplyAccessAssessment {
  const reasons: string[] = [], objections: string[] = [], quote = termTurns * SUPPLY_ACCESS_COIN_PER_TURN;
  const town = view.settlements.find(item => item.id === settlementId && item.factionId === providerId);
  let blocker: string | null = null;
  if (!view.supplyAccess) blocker = 'Supply agreements are unavailable under these historical rules.';
  else if (![buyerId, providerId].includes(view.factionId) || buyerId === providerId || !town) blocker = 'Review a known provider-owned hearth.';
  else if (view.wars.includes(view.factionId === buyerId ? providerId : buyerId)) blocker = 'Make peace before requesting supply access.';
  else if (view.factionId === buyerId && view.treasury < feeCoin) blocker = 'You cannot fund the offered fee.';
  else if (view.sieges.some(siege => siege.settlementId === settlementId) || view.visibleSiegeSettlementIds.includes(settlementId)) blocker = 'The observed hearth is under siege.';
  const memory = view.diplomacy.relations.find(relation => relation.parties.includes(buyerId) && relation.parties.includes(providerId));
  if (blocker) objections.push(blocker);
  if ((memory?.grievances ?? 0) >= 40) objections.push('Existing grievances make a new supply obligation unwelcome.');
  if (feeCoin < quote) objections.push(`The public service quote is ${quote} coin: ${SUPPLY_ACCESS_COIN_PER_TURN} per agreed turn.`);
  else reasons.push(`The ${feeCoin}-coin offer meets the public ${quote}-coin service quote.`);
  reasons.push('Payment occurs only on acceptance. The agreed source keeps its ordinary range and can be disrupted.');
  return { band: blocker || (memory?.grievances ?? 0) >= 40 ? 'unlikely' : feeCoin < quote ? 'uncertain' : 'likely', quotedFeeCoin: quote, reasons, objections, blocker };
}

/** Shared UI and AI valuation over one permitted observation; no hidden utility. */
export function assessSupplyAccess(view: Observation, command: Extract<SupplyAccessCommand, { type: 'proposeSupplyAccess' }>): SupplyAccessAssessment {
  const parsed = supplyAccessCommandSchemas[0].safeParse(command);
  if (!parsed.success) return { band: 'unlikely', quotedFeeCoin: 0, reasons: [], objections: ['Choose 1–1,000,000 coin and a term of 5–30 turns.'], blocker: 'Invalid supply terms.' };
  return assessment(view, command.factionId, command.targetFactionId, command.settlementId, command.feeCoin, command.termTurns);
}
export function assessSupplyAccessOffer(view: Observation, offer: SupplyAccessOffer): SupplyAccessAssessment {
  const result = assessment(view, offer.buyerId, offer.providerId, offer.source.settlementId, offer.feeCoin, offer.termTurns);
  const blocker = view.supplyAccess?.offers.find(item => item.id === offer.id)?.acceptanceBlocker;
  return blocker ? { ...result, band: 'unlikely', blocker, objections: [...result.objections, blocker] } : result;
}
