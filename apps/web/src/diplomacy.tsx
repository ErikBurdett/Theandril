import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isCityState } from '@theandril/sim';
import type { GameCommand, Observation, PeaceAssessment, PeaceTerms } from '@theandril/sim';
import { FactionArt } from './faction-art';

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
  const encounters = view.factions.filter(faction => faction.id !== view.factionId);
  const blocked = busy || Boolean(view.battle || view.pendingCapture);
  return <section className="faction-encounters" data-testid="faction-encounters" aria-label="Encountered factions">
    <h3>Beyond your borders</h3>
    {encounters.length === 0 && <p className="field-help">Explore to meet the powers beyond your frontier.</p>}
    {encounters.map(faction => {
      const treaty = view.diplomacy.treaties.find(treaty => treaty.parties.includes(faction.id));
      const atWar = view.wars.includes(faction.id);
      return <div className="faction-encounter" key={faction.id}>
        <div className="faction-art-heading"><FactionArt contentId="ui.badge" definitionId={faction.definitionId} label={`${faction.name} badge`}/><strong>{faction.name}</strong></div>
        {isCityState(faction.id) && <small className="field-help" data-testid={`city-state-${faction.id}`}>City-state — one independent hearth. It keeps to its own walls and never opens a war.</small>}
        {bondWith(faction.id) && <small className="field-help" data-testid={`patronage-${faction.id}`}>{bondWith(faction.id)!.patronId === view.factionId ? `Your client until turn ${bondWith(faction.id)!.expiresTurn}; ${bondWith(faction.id)!.terms.tributeCoin} coin tribute each turn.` : `Your patron until turn ${bondWith(faction.id)!.expiresTurn}; you pay ${bondWith(faction.id)!.terms.tributeCoin} coin each turn.`}</small>}
        {atWar ? <><span className="war-state">⚔ At war</span><button disabled={blocked} aria-label={`Negotiate peace with ${faction.name}`} onClick={() => setNegotiating(faction.id)}>Negotiate peace</button></>
          : <><span className="peace-state">{treaty ? `Truce until turn ${treaty.expiresTurn}` : 'At peace'}</span><button disabled={blocked || Boolean(treaty) || Boolean(bondWith(faction.id))} aria-label={`Declare war on ${faction.name}`} onClick={() => issue({ type: 'declareWar', factionId: view.factionId, targetFactionId: faction.id })}>Declare war</button></>}
        {bondWith(faction.id)?.patronId === view.factionId
          ? <button disabled={blocked} aria-label={`Release ${faction.name}`} onClick={() => issue({ type: 'releaseClient', factionId: view.factionId, clientId: faction.id })}>Release client</button>
          : bondWith(faction.id)
            ? <button className="danger" disabled={blocked} aria-label={`Renounce ${faction.name}`} onClick={() => issue({ type: 'renounceClient', factionId: view.factionId })}>{view.turn >= bondWith(faction.id)!.expiresTurn ? 'End the obligation' : 'Renounce the oath'}</button>
            : !atWar && !patron && !boundElsewhere(faction.id) && <button disabled={blocked} aria-label={`Offer patronage to ${faction.name}`} onClick={() => setCourting(faction.id)}>Offer patronage</button>}
      </div>;
    })}
    {negotiating && view.wars.includes(negotiating) && <PeaceBuilder key={negotiating} view={view} targetId={negotiating} busy={busy} stateHash={stateHash} issue={issue} review={review} close={() => setNegotiating(undefined)}/>}
    {courting && !patron && <PatronageBuilder key={courting} view={view} targetId={courting} busy={busy} issue={issue} close={() => setCourting(undefined)}/>}
    {(incomingPatronage.length > 0 || ownClients.length > 0 || patron) && <section className="peace-offers" data-testid="patronage" aria-label="Patronage">
      <h3>Oaths between realms</h3>
      {patron && <p>Your realm answers to {nameOf(view, patron.patronId)} until turn {patron.expiresTurn}, paying {patron.terms.tributeCoin} coin each turn.</p>}
      {ownClients.length > 0 && <p>{ownClients.length === 1 ? 'One realm answers' : `${ownClients.length} realms answer`} to you: {ownClients.map(bond => nameOf(view, bond.clientId)).join(', ')}. Their hearths stand behind your unification bid.</p>}
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
