import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isCityState } from '@theandril/sim';
import type { GameCommand, Observation, PeaceAssessment, PeaceTerms } from '@theandril/sim';
import { FactionArt } from './faction-art';
import { SupplyAccessPanel } from './supply-access';

export type PeaceReview = (targetFactionId: string, terms: PeaceTerms) => Promise<PeaceAssessment>;
type IssueOrder = (command: GameCommand) => void;
const nameOf = (view: Observation, id: string): string => view.factions.find(faction => faction.id === id)?.name ?? id;

function PeaceBuilder({ view, targetId, busy, stateHash, issue, review, close }: {
  view: Observation; targetId: string; busy: boolean; stateHash: string;
  issue: IssueOrder; review: PeaceReview; close: () => void;
}) {
  const [offerCoin, setOfferCoin] = useState('0');
  const [requestCoin, setRequestCoin] = useState('0');
  const [truceTurns, setTruceTurns] = useState('10');
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<{ value: PeaceAssessment; signature: string; hash: string }>();
  const revision = useRef(0);
  const assessmentPanel = useRef<HTMLDivElement>(null);
  const terms: PeaceTerms = { offerCoin: Number(offerCoin), requestCoin: Number(requestCoin), truceTurns: Number(truceTurns) };
  const signature = JSON.stringify(terms);
  const currentReview = assessment?.signature === signature && assessment.hash === stateHash ? assessment.value : undefined;
  useEffect(() => {
    if (!currentReview) return;
    assessmentPanel.current?.focus({ preventScroll: true });
    assessmentPanel.current?.scrollIntoView({ block: 'center' });
  }, [currentReview]);
  const blocked = busy || Boolean(view.battle || view.pendingCapture);
  const update = (write: (value: string) => void, value: string) => { revision.current++; write(value); setError(''); };
  const requestReview = async (event: FormEvent) => {
    event.preventDefault();
    const requestRevision = ++revision.current;
    setReviewing(true); setError('');
    try {
      const value = await review(targetId, terms);
      if (requestRevision === revision.current) setAssessment({ value, signature, hash: stateHash });
    } catch (cause) {
      if (requestRevision === revision.current) setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setReviewing(false); }
  };
  return <section className="peace-builder" data-testid="peace-builder" aria-label={`Peace terms with ${nameOf(view, targetId)}`}>
    <div className="peace-builder-heading"><FactionArt contentId="ui.crest" definitionId={view.factions.find(faction => faction.id === targetId)?.definitionId} label={`${nameOf(view, targetId)} crest`}/><h3>Peace with {nameOf(view, targetId)}</h3><button aria-label="Close peace terms" onClick={close}>×</button></div>
    <form onSubmit={event => { void requestReview(event); }}>
      <label>Coin offered<input type="number" min="0" max="1000000" step="1" required value={offerCoin} onChange={event => update(setOfferCoin, event.target.value)}/></label>
      <label>Coin requested<input type="number" min="0" max="1000000" step="1" required value={requestCoin} onChange={event => update(setRequestCoin, event.target.value)}/></label>
      <label>Peace duration<input type="number" min="5" max="30" step="1" required value={truceTurns} onChange={event => update(setTruceTurns, event.target.value)}/></label>
      <p className="field-help">Choose a payment in one direction, or no coin. Peace lasts 5–30 turns. Acceptance ends the war and prevents renewed declarations for the agreed duration.</p>
      <button className="wide" type="submit" disabled={blocked || reviewing}>{reviewing ? 'Reviewing terms…' : 'Review peace terms'}</button>
    </form>
    {error && <p role="alert" className="negotiation-error">{error}</p>}
    {currentReview && <div className="peace-assessment" data-testid="peace-assessment" role="status" tabIndex={-1} ref={assessmentPanel}>
      <strong>{currentReview.band === 'likely' ? 'Acceptance appears likely' : currentReview.band === 'uncertain' ? 'Acceptance is uncertain' : 'Acceptance appears unlikely'}</strong>
      {currentReview.reasons.length > 0 && <><h4>Reasons to agree</h4><ul>{currentReview.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul></>}
      {currentReview.objections.length > 0 && <><h4>Objections</h4><ul>{currentReview.objections.map(reason => <li key={reason}>{reason}</li>)}</ul></>}
    </div>}
    {assessment && !currentReview && <p className="field-help">The terms or campaign have changed. Review them again before sending.</p>}
    <button className="primary wide" disabled={blocked || reviewing || !currentReview} onClick={() => issue({ type: 'proposePeace', factionId: view.factionId, targetFactionId: targetId, terms })}>Send peace offer</button>
    <p className="field-help">The other faction considers your offer on End turn. It expires after three turns. Coin is transferred only if accepted; keep any offered coin available.</p>
  </section>;
}

/** Patronage terms are disclosed in full before consent: the subsidy now, the
 * tribute each turn, and how long the obligation binds both realms. */
function PatronageBuilder({ view, targetId, busy, issue, close }: { view: Observation; targetId: string; busy: boolean; issue: IssueOrder; close: () => void }) {
  const [giftCoin, setGiftCoin] = useState('40');
  const [tributeCoin, setTributeCoin] = useState('6');
  const [termTurns, setTermTurns] = useState('20');
  const gift = Number(giftCoin) || 0, tribute = Number(tributeCoin) || 0, term = Number(termTurns) || 0;
  const unaffordable = gift > view.treasury;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    issue({ type: 'proposeClient', factionId: view.factionId, targetFactionId: targetId, terms: { giftCoin: gift, tributeCoin: tribute, termTurns: term } });
    close();
  };
  return <form className="peace-builder" data-testid="patronage-builder" aria-label={`Offer patronage to ${nameOf(view, targetId)}`} onSubmit={submit}>
    <div className="peace-builder-heading"><FactionArt contentId="ui.crest" definitionId={view.factions.find(faction => faction.id === targetId)?.definitionId} label={`${nameOf(view, targetId)} crest`}/><strong>Offer patronage to {nameOf(view, targetId)}</strong></div>
    <label>Subsidy now<input type="number" min={0} max={1000000} step={1} value={giftCoin} onChange={event => setGiftCoin(event.target.value)}/></label>
    <label>Tribute each turn<input type="number" min={0} max={200} step={1} value={tributeCoin} onChange={event => setTributeCoin(event.target.value)}/></label>
    <label>Term in turns<input type="number" min={10} max={60} step={1} value={termTurns} onChange={event => setTermTurns(event.target.value)}/></label>
    <p className="field-help">You pay {gift} coin on acceptance. The realm pays {tribute} coin each turn for {term} turns, keeps its own hearths and armies, and its hearths stand behind your unification bid. Neither realm may attack the other while the obligation holds.</p>
    {unaffordable && <p className="negotiation-error" role="status">Your treasury holds {view.treasury} coin.</p>}
    <div className="offer-responses"><button className="primary" type="submit" disabled={busy || unaffordable}>Send offer</button><button type="button" onClick={close}>Cancel</button></div>
  </form>;
}

export function FactionEncounters({ view, busy, stateHash, issue, review }: { view: Observation; busy: boolean; stateHash: string; issue: IssueOrder; review: PeaceReview }) {
  const [negotiating, setNegotiating] = useState<string>();
  const [courting, setCourting] = useState<string>();
  const patron = view.diplomacy.clients.find(bond => bond.clientId === view.factionId);
  const ownClients = view.diplomacy.clients.filter(bond => bond.patronId === view.factionId);
  const bondWith = (id: string) => view.diplomacy.clients.find(bond => (bond.patronId === id && bond.clientId === view.factionId) || (bond.clientId === id && bond.patronId === view.factionId));
  const boundElsewhere = (id: string) => view.diplomacy.clients.some(bond => bond.patronId === id || bond.clientId === id);
  const incomingPatronage = view.diplomacy.clientOffers.filter(offer => offer.clientId === view.factionId);
  const allyWith = (id: string) => view.alliances?.pacts.find(pact => pact.parties.includes(view.factionId) && pact.parties.includes(id));
  const allianceOfferWith = (id: string) => view.alliances?.offers.find(offer => (offer.proposerId === view.factionId && offer.recipientId === id) || (offer.proposerId === id && offer.recipientId === view.factionId));
  const incomingAlliances = (view.alliances?.offers ?? []).filter(offer => offer.recipientId === view.factionId);
  const ownAllies = (view.alliances?.pacts ?? []).filter(pact => pact.parties.includes(view.factionId));
  // Rules 56 and 58: the calls the realm answered or was answered for, as an ally or a patron.
  const ownCalls = (view.alliances?.calls ?? []).filter(call => call.allyId === view.factionId || call.partnerId === view.factionId);
  const encounters = view.factions.filter(faction => faction.id !== view.factionId);
  const blocked = busy || Boolean(view.battle || view.pendingCapture);
  return <section className="faction-encounters" data-testid="faction-encounters" aria-label="Encountered factions">
    <h3>Beyond your borders</h3>
    <SupplyAccessPanel view={view} stateHash={stateHash} busy={blocked} issue={issue}/>
    {encounters.length === 0 && <p className="field-help">Explore to meet the powers beyond your frontier.</p>}
    {encounters.map(faction => {
      const treaty = view.diplomacy.treaties.find(treaty => treaty.parties.includes(faction.id));
      const atWar = view.wars.includes(faction.id);
      return <div className="faction-encounter" key={faction.id}>
        <div className="faction-art-heading"><FactionArt contentId="ui.badge" definitionId={faction.definitionId} label={`${faction.name} badge`}/><strong>{faction.name}</strong></div>
        {isCityState(faction.id) && <small className="field-help" data-testid={`city-state-${faction.id}`}>City-state — one independent hearth. It keeps to its own walls and never opens a war.</small>}
        {isCityState(faction.id) && view.tribute && (() => { const quotes = view.tribute.quotes.filter(quote => quote.cityStateId === faction.id); const quote = quotes.find(item => !item.blocker) ?? quotes[0]; return quote ? <div className="offer-responses"><button disabled={blocked || Boolean(quote.blocker)} title={quote.blocker ?? `${quote.coin} coin if its walls yield to the company at its gate; the city remembers either way.`} aria-label={`Demand tribute of ${faction.name}`} onClick={() => issue({ type: 'demandTribute', factionId: view.factionId, cityStateId: faction.id, armyId: quote.armyId })}>Demand tribute ({quote.coin} coin)</button><small className="field-help" data-testid={`tribute-quote-${faction.id}`}>{quote.blocker ?? `${view.armies.find(army => army.id === quote.armyId)?.name ?? quote.armyId} stands at the gate: ${quote.coin} coin if the walls yield.`}</small></div> : null; })()}
        {isCityState(faction.id) && view.hires && (() => { const quotes = view.hires.quotes.filter(quote => quote.cityStateId === faction.id); const quote = quotes.find(item => !item.blocker) ?? quotes[0]; return quote ? <div className="offer-responses"><button disabled={blocked || Boolean(quote.blocker)} title={quote.blocker ?? `${quote.coin} coin for a company of Ash pike raised at the gate; the city sells again ten turns on.`} aria-label={`Hire a company from ${faction.name}`} onClick={() => issue({ type: 'hireCompany', factionId: view.factionId, cityStateId: faction.id, armyId: quote.armyId })}>Hire a company ({quote.coin} coin)</button><small className="field-help" data-testid={`hire-quote-${faction.id}`}>{quote.blocker ?? `${view.armies.find(army => army.id === quote.armyId)?.name ?? quote.armyId} stands at the gate: a company of Ash pike for ${quote.coin} coin.`}</small></div> : null; })()}
        {allyWith(faction.id) && <small className="field-help" data-testid={`alliance-${faction.id}`}>Allied until turn {allyWith(faction.id)!.expiresTurn}: neither makes war on the other, and each answers a war declared on the other.</small>}
        {bondWith(faction.id) && <small className="field-help" data-testid={`patronage-${faction.id}`}>{bondWith(faction.id)!.patronId === view.factionId ? `Your client until turn ${bondWith(faction.id)!.expiresTurn}; ${bondWith(faction.id)!.terms.tributeCoin} coin tribute each turn.` : `Your patron until turn ${bondWith(faction.id)!.expiresTurn}; you pay ${bondWith(faction.id)!.terms.tributeCoin} coin each turn.`}</small>}
        {atWar ? <><span className="war-state">⚔ At war</span><button disabled={blocked} aria-label={`Negotiate peace with ${faction.name}`} onClick={() => setNegotiating(faction.id)}>Negotiate peace</button></>
          : <><span className="peace-state">{treaty ? `Truce until turn ${treaty.expiresTurn}` : 'At peace'}</span><button disabled={blocked || Boolean(treaty) || Boolean(bondWith(faction.id)) || Boolean(allyWith(faction.id))} aria-label={`Declare war on ${faction.name}`} onClick={() => issue({ type: 'declareWar', factionId: view.factionId, targetFactionId: faction.id })}>Declare war</button></>}
        {bondWith(faction.id)?.patronId === view.factionId
          ? <button disabled={blocked} aria-label={`Release ${faction.name}`} onClick={() => issue({ type: 'releaseClient', factionId: view.factionId, clientId: faction.id })}>Release client</button>
          : bondWith(faction.id)
            ? <button className="danger" disabled={blocked} aria-label={`Renounce ${faction.name}`} onClick={() => issue({ type: 'renounceClient', factionId: view.factionId })}>{view.turn >= bondWith(faction.id)!.expiresTurn ? 'End the obligation' : 'Renounce the oath'}</button>
            : !atWar && !patron && !boundElsewhere(faction.id) && <button disabled={blocked} aria-label={`Offer patronage to ${faction.name}`} onClick={() => setCourting(faction.id)}>Offer patronage</button>}
        {view.alliances && !isCityState(faction.id) && !atWar && !bondWith(faction.id) && (allyWith(faction.id)
          ? <button className="danger" disabled={blocked} aria-label={`Renounce the alliance with ${faction.name}`} onClick={() => issue({ type: 'renounceAlliance', factionId: view.factionId, allyId: faction.id })}>{view.turn >= allyWith(faction.id)!.expiresTurn ? 'End the alliance' : 'Renounce the alliance'}</button>
          : allianceOfferWith(faction.id)
            ? <small className="field-help">An alliance offer between you awaits an answer until turn {allianceOfferWith(faction.id)!.expiresTurn}.</small>
            : <button disabled={blocked} aria-label={`Propose an alliance to ${faction.name}`} onClick={() => issue({ type: 'proposeAlliance', factionId: view.factionId, targetFactionId: faction.id, termTurns: 30 })}>Propose an alliance (30 turns)</button>)}
      </div>;
    })}
    {negotiating && view.wars.includes(negotiating) && <PeaceBuilder key={negotiating} view={view} targetId={negotiating} busy={busy} stateHash={stateHash} issue={issue} review={review} close={() => setNegotiating(undefined)}/>}
    {courting && !patron && <PatronageBuilder key={courting} view={view} targetId={courting} busy={busy} issue={issue} close={() => setCourting(undefined)}/>}
    {(incomingAlliances.length > 0 || ownAllies.length > 0 || ownCalls.length > 0) && <section className="peace-offers" data-testid="alliances" aria-label="Alliances">
      <h3>Allies</h3>
      {ownCalls.map(call => <p key={`${call.allyId}:${call.attackerId}`} className="field-help" data-testid="alliance-call">{call.allyId === view.factionId
        ? `You entered the war against ${nameOf(view, call.attackerId)} on turn ${call.turn} for ${nameOf(view, call.partnerId)}, your ${view.diplomacy.clients.some(bond => bond.patronId === view.factionId && bond.clientId === call.partnerId) ? 'client' : 'ally'}; a peace they make ends your war too.`
        : `${nameOf(view, call.allyId)} entered your war against ${nameOf(view, call.attackerId)} on turn ${call.turn}; a peace you make ends theirs too.`}</p>)}
      {ownAllies.length > 0 && <p>{ownAllies.length === 1 ? 'One realm stands' : `${ownAllies.length} realms stand`} with you: {ownAllies.map(pact => `${nameOf(view, pact.parties.find(id => id !== view.factionId)!)} until turn ${pact.expiresTurn}`).join(', ')}. A war declared on either brings the other in.</p>}
      {incomingAlliances.map(offer => <article className="peace-offer" key={offer.id} data-testid={`alliance-offer-${offer.id}`}>
        <strong>From {nameOf(view, offer.proposerId)}</strong>
        <p>They offer a defensive alliance of {offer.termTurns} turns: neither realm makes war on the other, and each enters a war declared on the other unless an oath, a binding peace or a supply agreement with the attacker binds it.</p>
        <small>Expires on turn {offer.expiresTurn}.</small>
        {offer.acceptanceBlocker && <p className="negotiation-error" role="status">{offer.acceptanceBlocker}</p>}
        <div className="offer-responses"><button className="primary" disabled={blocked || Boolean(offer.acceptanceBlocker)} aria-label={`Accept alliance offer ${offer.id}`} onClick={() => issue({ type: 'respondAlliance', factionId: view.factionId, offerId: offer.id, accept: true })}>Accept the alliance</button><button disabled={blocked} aria-label={`Refuse alliance offer ${offer.id}`} onClick={() => issue({ type: 'respondAlliance', factionId: view.factionId, offerId: offer.id, accept: false })}>Refuse</button></div>
      </article>)}
    </section>}
    {(incomingPatronage.length > 0 || ownClients.length > 0 || patron) && <section className="peace-offers" data-testid="patronage" aria-label="Patronage">
      <h3>Oaths between realms</h3>
      {patron && <p>Your realm answers to {nameOf(view, patron.patronId)} until turn {patron.expiresTurn}, paying {patron.terms.tributeCoin} coin each turn.{view.alliances?.calls ? ' A war declared on you brings your patron in, unless an oath, a binding peace, a supply agreement or an alliance with the attacker binds it.' : ''}</p>}
      {ownClients.length > 0 && <p>{ownClients.length === 1 ? 'One realm answers' : `${ownClients.length} realms answer`} to you: {ownClients.map(bond => { const goods = view.diplomacy.clientGoods?.find(item => item.clientId === bond.clientId); return `${nameOf(view, bond.clientId)}${goods ? ` (sends ${goods.amount} ${goods.name} each turn)` : ''}`; }).join(', ')}. Their hearths stand behind your unification bid.{view.alliances?.calls ? ' A war declared on a client brings you in as its guarantor, unless an oath, a binding peace, a supply agreement or an alliance with the attacker binds you; the client\u2019s peace ends your war.' : ''}</p>}
      {incomingPatronage.map(offer => <article className="peace-offer" key={offer.id} data-testid={`patronage-offer-${offer.id}`}>
        <strong>From {nameOf(view, offer.patronId)}</strong>
        <p>They offer {offer.terms.giftCoin} coin now and ask {offer.terms.tributeCoin} coin each turn for {offer.terms.termTurns} turns. You keep your hearths and armies; neither realm may attack the other while it holds.</p>
        <small>Expires on turn {offer.expiresTurn}.</small>
        {offer.acceptanceBlocker && <p className="negotiation-error" role="status">{offer.acceptanceBlocker}</p>}
        <div className="offer-responses"><button className="primary" disabled={blocked || Boolean(offer.acceptanceBlocker)} aria-label={`Accept patronage offer ${offer.id}`} onClick={() => issue({ type: 'respondClient', factionId: view.factionId, offerId: offer.id, accept: true })}>Accept patronage</button><button disabled={blocked} aria-label={`Refuse patronage offer ${offer.id}`} onClick={() => issue({ type: 'respondClient', factionId: view.factionId, offerId: offer.id, accept: false })}>Refuse</button></div>
      </article>)}
    </section>}
    {view.diplomacy.offers.length > 0 && <section className="peace-offers" data-testid="peace-offers" aria-label="Peace offers">
      <h3>Envoys at the gate</h3>
      {view.diplomacy.offers.map(offer => {
        const incoming = offer.recipientId === view.factionId;
        return <article className="peace-offer" key={offer.id} data-testid={`peace-offer-${offer.id}`}>
          <strong>{incoming ? `From ${nameOf(view, offer.proposerId)}` : `Sent to ${nameOf(view, offer.recipientId)}`}</strong>
          <p>{incoming ? 'They offer' : 'You offer'} {offer.terms.offerCoin} coin and request {offer.terms.requestCoin} coin. Peace for {offer.terms.truceTurns} turns.</p>
          <small>Expires on turn {offer.expiresTurn}. Coin changes hands on acceptance.</small>
          {offer.acceptanceBlocker && <p className="negotiation-error" id={`peace-blocker-${offer.id}`} role="status">{offer.acceptanceBlocker}</p>}
          {incoming ? <div className="offer-responses"><button className="primary" disabled={blocked || Boolean(offer.acceptanceBlocker)} aria-label={`Accept peace offer ${offer.id}`} aria-describedby={offer.acceptanceBlocker ? `peace-blocker-${offer.id}` : undefined} onClick={() => issue({ type: 'respondPeace', factionId: view.factionId, offerId: offer.id, accept: true })}>Accept offer</button><button disabled={blocked} aria-label={`Reject peace offer ${offer.id}`} onClick={() => issue({ type: 'respondPeace', factionId: view.factionId, offerId: offer.id, accept: false })}>Reject offer</button></div>
            : <p className="field-help">Awaiting a response on End turn.</p>}
        </article>;
      })}
    </section>}
    {view.diplomacy.treaties.length > 0 && <details className="peace-treaties"><summary>Peace commitments</summary>{view.diplomacy.treaties.map(treaty => <p key={treaty.id}>Peace with {nameOf(view, treaty.parties.find(id => id !== view.factionId) ?? '')} until turn {treaty.expiresTurn}.</p>)}</details>}
    {encounters.some(faction => !view.wars.includes(faction.id)) && <p className="field-help">Declaring war permits attacks on this faction’s armies and settlements. Active peace commitments prevent renewed war.</p>}
  </section>;
}
