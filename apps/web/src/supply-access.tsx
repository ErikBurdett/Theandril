import { useState } from 'react';
import { assessSupplyAccess, MAX_SUPPLY_ACCESS_IMPORTS, MAX_SUPPLY_ACCESS_OFFERS, type GameCommand, type Observation, type SupplyAccessAssessment } from '@theandril/sim';

/** All valuation is supplied by the canonical observation-only assessment. */
export function SupplyAccessPanel({ view, stateHash, busy, issue }: { view: Observation; stateHash: string; busy: boolean; issue: (command: GameCommand) => void }) {
  const [settlementId, setSettlementId] = useState(''), [fee, setFee] = useState('20'), [term, setTerm] = useState('10');
  const [review, setReview] = useState<{ signature: string; hash: string; assessment: SupplyAccessAssessment }>();
  const access = view.supplyAccess;
  if (!access) return null;
  const pending = access.offers.filter(offer => offer.buyerId === view.factionId);
  const imports = access.agreements.filter(agreement => agreement.buyerId === view.factionId);
  const heldSources = new Set([...pending, ...imports].map(record => record.source.settlementId));
  const sources = view.settlements.filter(town => town.factionId !== view.factionId && !view.wars.includes(town.factionId) && !heldSources.has(town.id));
  const selected = sources.find(town => town.id === settlementId);
  const proposal = selected ? { type: 'proposeSupplyAccess' as const, factionId: view.factionId, targetFactionId: selected.factionId, settlementId, feeCoin: Number(fee), termTurns: Number(term) } : undefined;
  const signature = JSON.stringify(proposal);
  const assessment = review?.hash === stateHash && review.signature === signature ? review.assessment : undefined;
  const full = pending.length >= MAX_SUPPLY_ACCESS_OFFERS || imports.length >= MAX_SUPPLY_ACCESS_IMPORTS;
  const name = (id: string) => view.factions.find(faction => faction.id === id)?.name ?? id;
  return <section className="supply-access" data-testid="supply-access" aria-label="Negotiated supply access">
    <h3>Negotiate supply access</h3>
    <p className="field-help">Pay another realm for supply from one named hearth or harbor. A harbor can feed fleets and their passengers within its ordinary range. This grants supply service only; movement, war and peace keep their usual rules.</p>
    <form className="peace-builder" onSubmit={event => { event.preventDefault(); if (proposal) setReview({ signature, hash: stateHash, assessment: assessSupplyAccess(view, proposal) }); }}>
      <label>Supply hearth or harbor<select value={selected?.id ?? ''} disabled={busy || full} onChange={event => setSettlementId(event.target.value)}><option value="">Choose a currently observed foreign hearth</option>{sources.map(town => <option key={town.id} value={town.id}>{town.name} · {name(town.factionId)}{town.buildings.includes('building.harbor') ? ' · Harbor' : ''}</option>)}</select></label>
      <label>Supply fee<input type="number" min={1} max={1000000} step={1} required value={fee} disabled={busy || full} onChange={event => setFee(event.target.value)}/></label>
      <label>Supply term in turns<input type="number" min={5} max={30} step={1} required value={term} disabled={busy || full} onChange={event => setTerm(event.target.value)}/></label>
      <p className="field-help">The public service quote is {access.quoteCoinPerTurn} coin per turn. The fee is paid once on acceptance. Either party may end service early with no refund. Siege, source loss or war can interrupt service. No fleet or army is moved by this agreement.</p>
      <button disabled={busy || full || !proposal} type="submit">Review supply terms</button>
      {!sources.length && <p className="field-help">Explore a foreign hearth at peace to request access. A hearth with your pending request or current agreement is already listed below.</p>}
      {full && <p role="status">The realm has reached its eight pending requests or eight imported sources.</p>}
    </form>
    {assessment && <div className="peace-assessment" data-testid="supply-assessment" role="status"><strong>Acceptance {assessment.band === 'likely' ? 'appears likely' : assessment.band === 'uncertain' ? 'is uncertain' : 'appears unlikely'}</strong><ul>{[...assessment.reasons, ...assessment.objections].map(reason => <li key={reason}>{reason}</li>)}</ul></div>}
    {review && !assessment && <p role="status">The terms or campaign changed. Review supply terms again.</p>}
    <button className="primary wide" disabled={busy || full || !proposal || !assessment || Boolean(assessment.blocker)} onClick={() => { if (proposal && assessment && !assessment.blocker) { issue(proposal); setReview(undefined); } }}>Send supply request</button>
    <p className="field-help">Requests expire after three turns. Keep promised coin available: {pending.reduce((sum, offer) => sum + offer.feeCoin, 0)} coin across {pending.length} pending requests. Map coverage uses last-known contracted reach; your army’s report shows whether it is actually supplied.</p>
    {access.offers.map(offer => <article className="peace-offer" key={offer.id} data-testid={`supply-offer-${offer.id}`}><strong>{offer.source.name} · {offer.buyerId === view.factionId ? `Requested from ${name(offer.providerId)}` : `Requested by ${name(offer.buyerId)}`}</strong><p>{offer.feeCoin} coin for {offer.termTurns} turns · {offer.source.harbor ? 'Land and harbor service' : 'Land service'} · request expires on turn {offer.expiresTurn}.</p>{offer.acceptanceBlocker && <p role="status">{offer.acceptanceBlocker}</p>}{offer.providerId === view.factionId ? <div className="offer-responses"><button disabled={busy || Boolean(offer.acceptanceBlocker)} aria-label={`Accept supply request ${offer.id}`} onClick={() => issue({ type: 'respondSupplyAccess', factionId: view.factionId, offerId: offer.id, accept: true })}>Accept supply request</button><button disabled={busy} aria-label={`Refuse supply request ${offer.id}`} onClick={() => issue({ type: 'respondSupplyAccess', factionId: view.factionId, offerId: offer.id, accept: false })}>Refuse</button></div> : <p className="field-help">The provider considers this request on End turn.</p>}</article>)}
    {access.agreements.map(agreement => <article className="peace-offer" key={agreement.id} data-testid={`supply-agreement-${agreement.id}`}><strong>{agreement.source.name} · {agreement.buyerId === view.factionId ? `Imported from ${name(agreement.providerId)}` : `Provided to ${name(agreement.buyerId)}`}</strong><p>{agreement.feeCoin} coin paid · {agreement.source.harbor ? 'Land and harbor service' : 'Land service'} · ends before supply is resolved on turn {agreement.expiresTurn}.</p><button disabled={busy} aria-label={`End supply agreement ${agreement.id}`} onClick={() => issue({ type: 'endSupplyAccess', factionId: view.factionId, agreementId: agreement.id })}>End agreement · no refund</button></article>)}
  </section>;
}
