import { useState } from 'react';
import { WORKER_POLICY_FOCI, WORKER_POLICY_NAMES, type GameCommand, type Observation, type WorkerPolicyFocus } from '@theandril/sim';
import './worker-policy.css';

type Props = { view: Observation; settlementId: string; busy: boolean; issue: (command: GameCommand) => void };

/** Policies and waiting reasons come from the same observation as the hearth. */
export function WorkerPolicy({ view, settlementId, busy, issue }: Props) {
  const settlement = view.settlements.find(town => town.id === settlementId);
  if (view.workerPolicies === undefined || settlement?.factionId !== view.factionId) return null;
  const policy = view.workerPolicies.find(item => item.settlementId === settlementId && item.factionId === view.factionId);
  return <details className="worker-policy" data-testid="worker-policy" key={settlementId}>
    <summary>Worker policy<span>{policy ? `${WORKER_POLICY_NAMES[policy.focus]} · ${policy.assigned} / ${policy.capacity} assigned${policy.blocker ? ' · waiting' : ''}` : 'Manual control'}</span></summary>
    {policy && <p role="status" data-testid="worker-policy-status" className={policy.blocker ? 'land-blocker' : 'field-help'}>
      {policy.blocker ?? 'Workers follow this priority. The policy reassigns them after each turn’s growth and land work, ready for the next harvest.'}
    </p>}
    <p className="field-help">Assign workers across this hearth’s claimed land now, then keep checking as it grows. Worker policies cost no coin. They do not buy land, build improvements or cultivate biomes.</p>
    <WorkerPolicyEditor key={policy?.focus ?? 'none'} view={view} settlementId={settlementId} busy={busy} issue={issue}/>
    <p className="field-help">Returning to manual control keeps current assignments. Assigning or removing a worker yourself also ends the policy. Siege and occupation pause its assignments; losing the hearth ends it.</p>
  </details>;
}

function WorkerPolicyEditor({ view, settlementId, busy, issue }: Props) {
  const policy = view.workerPolicies?.find(item => item.settlementId === settlementId && item.factionId === view.factionId);
  const [focus, setFocus] = useState<WorkerPolicyFocus>(policy?.focus ?? 'balanced');
  const apply = (choice: WorkerPolicyFocus | 'none') => {
    if (!busy) issue({ type: 'setWorkerPolicy', factionId: view.factionId, settlementId, focus: choice });
  };
  return <>
    <label>Worker priority<select value={focus} disabled={busy} onChange={event => setFocus(event.target.value as WorkerPolicyFocus)}>
      {WORKER_POLICY_FOCI.map(value => <option key={value} value={value}>{WORKER_POLICY_NAMES[value]}</option>)}
    </select></label>
    <p className="field-help">Food, Industry, Coin and Knowledge favor the highest yield of that type. Balanced favors food when reserves are low and also values industry, coin and knowledge. A focused policy can reduce other yields or leave a resource deposit unworked.</p>
    <button type="button" className="primary wide" disabled={busy} onClick={() => apply(focus)}>Apply worker policy</button>
    {policy && <button type="button" className="wide" disabled={busy} onClick={() => apply('none')}>Return to manual control</button>}
  </>;
}
