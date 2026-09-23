import { useState } from 'react';
import { POSTING_NAMES, type ArmyView, type GameCommand, type Observation, type PostingMode } from '@theandril/sim';

type Issue = (command: GameCommand) => void;
const rallyPoints = (view: Observation) => view.settlements.filter(town => town.factionId === view.factionId);

/** Rules 26: a standing posting marches an army to a hex and holds it, or joins it
 * to the force already there. It never touches an army that has a travel order. */
export function ArmyPosting({ army, view, busy, issue }: { army: ArmyView; view: Observation; busy: boolean; issue: Issue }) {
  const posting = view.postings.find(item => item.armyId === army.id);
  const points = rallyPoints(view);
  const [cell, setCell] = useState<number>(posting?.cell ?? points[0]?.cell ?? army.cell);
  const [mode, setMode] = useState<PostingMode>(posting?.mode ?? 'join');
  const named = points.find(town => town.cell === posting?.cell);
  return <details className="production-category standing-order" data-testid="army-posting">
    <summary>Standing posting<span>{posting ? `${POSTING_NAMES[posting.mode]} · ${named ? named.name : `hex ${posting.cell}`}` : 'none'}</span></summary>
    <p className="field-help">A posted army marches to its hex under an ordinary travel order and then holds it, or joins the force standing there. A travel order you give yourself always comes first, and the posting waits.</p>
    {posting && <p className="production-blocker" id={`posting-state-${army.id}`}>{posting.blocker ?? (posting.arrived ? 'Standing at its posting.' : 'Marching to its posting.')}</p>}
    <label>Posted to<select value={cell} disabled={busy} onChange={event => setCell(Number(event.target.value))}>
      <option value={army.cell}>Where it stands · hex {army.cell}</option>
      {points.filter(town => town.cell !== army.cell).map(town => <option value={town.cell} key={town.id}>{town.name} · hex {town.cell}</option>)}
    </select></label>
    <label>On arrival<select value={mode} disabled={busy} onChange={event => setMode(event.target.value as PostingMode)}>
      <option value="join">Join the force there</option>
      <option value="hold">Hold the hex</option>
    </select></label>
    <button className="primary wide" disabled={busy} aria-describedby={posting ? `posting-state-${army.id}` : undefined}
      onClick={() => issue({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell, mode })}>{posting ? 'Update posting' : 'Post army'}</button>
    {posting && <button className="wide" disabled={busy} onClick={() => issue({ type: 'setPosting', factionId: view.factionId, armyId: army.id, cell, mode: 'none' })}>Clear posting</button>}
  </details>;
}

/** A hearth's muster point posts every company it raises, the turn it forms. */
export function SettlementMuster({ view, settlementId, busy, issue }: { view: Observation; settlementId: string; busy: boolean; issue: Issue }) {
  const muster = view.musters.find(item => item.settlementId === settlementId);
  const points = rallyPoints(view);
  const [cell, setCell] = useState<number>(muster?.cell ?? points[0]?.cell ?? 0);
  const named = points.find(town => town.cell === muster?.cell);
  if (!points.length) return null;
  return <details className="production-category standing-order" data-testid="settlement-muster">
    <summary>Muster point<span>{muster ? named ? named.name : `hex ${muster.cell}` : 'none'}</span></summary>
    <p className="field-help">Every company this hearth raises is posted to the muster point the turn it forms, marches there under an ordinary travel order and joins the force it finds. Clearing the muster point leaves companies where they are raised.</p>
    <label>Muster at<select value={cell} disabled={busy} onChange={event => setCell(Number(event.target.value))}>
      {points.map(town => <option value={town.cell} key={town.id}>{town.name} · hex {town.cell}</option>)}
    </select></label>
    <button className="primary wide" disabled={busy} onClick={() => issue({ type: 'setMuster', factionId: view.factionId, settlementId, cell })}>{muster ? 'Move muster point' : 'Set muster point'}</button>
    {muster && <button className="wide" disabled={busy} onClick={() => issue({ type: 'setMuster', factionId: view.factionId, settlementId, cell: null })}>Clear muster point</button>}
  </details>;
}
