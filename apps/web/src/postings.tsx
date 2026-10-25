import { useState } from 'react';
import { POSTING_NAMES, type ArmyView, type GameCommand, type Observation, type PostingMode } from '@theandril/sim';

type Issue = (command: GameCommand) => void;
const rallyPoints = (view: Observation) => view.settlements.filter(town => town.factionId === view.factionId);
type Destination = number | 'current' | '';
const destinationChoice = (value: string): Destination => value === 'current' || value === '' ? value : Number(value);

/** Rules 26: a standing posting marches an army to a hex and holds it, or joins it
 * to the force already there. It never touches an army that has a travel order. */
export function ArmyPosting({ army, view, busy, issue }: { army: ArmyView; view: Observation; busy: boolean; issue: Issue }) {
  const posting = view.postings.find(item => item.armyId === army.id);
  const points = rallyPoints(view);
  const [cell, setCell] = useState<Destination>(posting?.cell ?? points[0]?.cell ?? 'current');
  const [mode, setMode] = useState<PostingMode>(posting?.mode ?? 'join');
  const named = points.find(town => town.cell === posting?.cell);
  // A form choice is not a canonical validity judgment: saved postings can
  // target any explored hex, including one absent from this owned-hearth list.
  const target = cell === 'current' || points.some(town => town.cell === cell) ? cell : '';
  const choiceHelp = `posting-choice-${army.id}`;
  const description = [posting ? `posting-state-${army.id}` : '', target === '' ? choiceHelp : ''].filter(Boolean).join(' ') || undefined;
  return <details className="production-category standing-order" data-testid="army-posting">
    <summary>Standing posting<span>{posting ? `${POSTING_NAMES[posting.mode]} · ${named ? named.name : `hex ${posting.cell}`}` : 'none'}</span></summary>
    <p className="field-help">A posted army marches to its hex under an ordinary travel order and then holds it, or joins the force standing there. A travel order you give yourself always comes first, and the posting waits.</p>
    {posting && <p className="production-blocker" id={`posting-state-${army.id}`}>{posting.blocker ?? (posting.arrived ? 'Standing at its posting.' : 'Marching to its posting.')}</p>}
    <label>Posted to<select value={target} disabled={busy} aria-invalid={target === '' || undefined} aria-describedby={target === '' ? choiceHelp : undefined} onChange={event => setCell(destinationChoice(event.target.value))}>
      <option value="">Choose a destination</option>
      <option value="current">Where it stands · hex {army.cell}</option>
      {points.map(town => <option value={town.cell} key={town.id}>{town.name} · hex {town.cell}</option>)}
    </select></label>
    {target === '' && <p className="production-blocker" id={choiceHelp}>Choose a destination from the current list before posting. {posting ? `The existing posting at hex ${posting.cell} remains unchanged and can still be cleared.` : 'No posting has been issued.'}</p>}
    <p className="field-help">Where it stands uses the army’s position when you post it. A hearth choice stays at that hex.</p>
    <label>On arrival<select value={mode} disabled={busy} onChange={event => setMode(event.target.value as PostingMode)}>
      <option value="join">Join the force there</option>
      <option value="hold">Hold the hex</option>
    </select></label>
    <button className="primary wide" disabled={busy || target === ''} aria-describedby={description}
      onClick={() => { if (!busy && target !== '') issue({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: target === 'current' ? army.cell : target, mode }); }}>{posting ? 'Update posting' : 'Post army'}</button>
    {posting && <button className="wide" disabled={busy} onClick={() => { if (!busy) issue({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell: posting.cell, mode: 'none' }); }}>Clear posting</button>}
  </details>;
}

/** A hearth's muster point posts every company it raises, the turn it forms. */
export function SettlementMuster({ view, settlementId, busy, issue }: { view: Observation; settlementId: string; busy: boolean; issue: Issue }) {
  const muster = view.musters.find(item => item.settlementId === settlementId);
  const points = rallyPoints(view);
  const [cell, setCell] = useState<number | ''>(muster?.cell ?? points[0]?.cell ?? '');
  const named = points.find(town => town.cell === muster?.cell);
  const target = points.some(town => town.cell === cell) ? cell : '';
  const choiceHelp = `muster-choice-${settlementId}`;
  return <details className="production-category standing-order" data-testid="settlement-muster">
    <summary>Muster point<span>{muster ? named ? named.name : `hex ${muster.cell}` : 'none'}</span></summary>
    <p className="field-help">Every company this hearth raises is posted to the muster point the turn it forms, marches there under an ordinary travel order and joins the force it finds. Clearing the muster point leaves companies where they are raised.</p>
    <label>Muster at<select value={target} disabled={busy} aria-invalid={target === '' || undefined} aria-describedby={target === '' ? choiceHelp : undefined} onChange={event => setCell(event.target.value === '' ? '' : Number(event.target.value))}>
      <option value="">Choose a destination</option>
      {points.map(town => <option value={town.cell} key={town.id}>{town.name} · hex {town.cell}</option>)}
    </select></label>
    {target === '' && <p className="production-blocker" id={choiceHelp}>Choose a destination from the current list before setting a muster point. {muster ? `The existing muster point at hex ${muster.cell} remains unchanged and can still be cleared.` : 'No muster point has been set.'}</p>}
    <button className="primary wide" disabled={busy || target === ''} aria-describedby={target === '' ? choiceHelp : undefined} onClick={() => { if (!busy && target !== '') issue({ type: 'setMuster', factionId: view.factionId, settlementId, cell: target }); }}>{muster ? 'Move muster point' : 'Set muster point'}</button>
    {muster && <button className="wide" disabled={busy} onClick={() => { if (!busy) issue({ type: 'setMuster', factionId: view.factionId, settlementId, cell: null }); }}>Clear muster point</button>}
  </details>;
}
