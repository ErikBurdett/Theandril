import { useState } from 'react';
import { IMPROVEMENTS } from '@theandril/content';
import type { GameCommand, Observation } from '@theandril/sim';
import './land-policy.css';

type LandTown = Observation['land']['settlements'][number];
type Props = { view: Observation; settlementId: string; town: LandTown; busy: boolean; ready: boolean; issue: (command: GameCommand) => void };

/** Only the selected hearth's canonical detail query evaluates its next order. */
export function LandPolicy({ view, settlementId, town, busy, ready, issue }: Props) {
  if (view.landPolicies === undefined || !view.settlements.some(item => item.id === settlementId && item.factionId === view.factionId)) return null;
  const policy = view.landPolicies.find(item => item.settlementId === settlementId && item.factionId === view.factionId);
  const name = policy && (IMPROVEMENTS.find(item => item.id === policy.improvementId)?.name ?? policy.improvementId);
  const choice = ready ? town.landPolicyChoice : undefined;
  return <details className="land-policy" data-testid="land-policy" key={settlementId}>
    <summary>Land commission<span>{policy ? `${name} · ${policy.allowance} coin left` : 'Direct construction'}</span></summary>
    <p className="field-help">Build one chosen improvement on suitable worked tiles as this hearth develops. Applying a commission can pay for its first order immediately. Further orders begin after each turn’s upkeep and production charters.</p>
    {policy && <section aria-label="Current land commission" data-testid="land-policy-status">
      <p><strong>{name}</strong> · {policy.allowance} coin remaining · {policy.reserve} coin treasury reserve</p>
      {!ready ? <p className="field-help" role="status">Loading the current land commission review…</p>
        : choice?.blocker ? <p className="land-blocker" role="status">{choice.blocker}</p>
          : choice?.cell !== null && choice?.cell !== undefined ? <p className="field-help" role="status">Next order: hex {choice.cell} · {choice.coinCost} coin upfront · {choice.turns} turns. The order is checked again before payment.</p>
            : <p className="field-help" role="status">{policy.blocker ?? 'Open current land details to review the next order.'}</p>}
    </section>}
    <LandPolicyEditor key={policy ? `${policy.improvementId}:${policy.allowance}:${policy.reserve}` : 'none'} view={view} settlementId={settlementId} town={town} busy={busy} ready={ready} issue={issue}/>
    <p className="field-help">The allowance limits total future spending; it is not taken from the treasury in advance. Each order must leave the chosen treasury reserve. Other realm orders can still spend that reserve. Commissions share the treasury in stable hearth order.</p>
    <p className="field-help">Only unimproved, worked land is considered. A resource deposit accepts only its matching extraction site. Existing sites are kept; commissions do not claim land, cultivate biomes or assign workers.</p>
    <p className="field-help">Siege and occupation pause work. Ending a commission keeps paid work underway. Building, cultivating or cancelling land work yourself ends the commission after a successful order. Losing the hearth ends it; cancelled work is not refunded.</p>
  </details>;
}

/** Reject empty, fractional and unsafe amounts before constructing an order. */
export function landCommissionAmount(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

function LandPolicyEditor({ view, settlementId, busy, ready, issue }: Props) {
  const policy = view.landPolicies?.find(item => item.settlementId === settlementId && item.factionId === view.factionId);
  const [improvementId, setImprovementId] = useState(policy?.improvementId ?? IMPROVEMENTS[0]!.id);
  const [allowance, setAllowance] = useState(String(policy?.allowance ?? 100));
  const [reserve, setReserve] = useState(String(policy?.reserve ?? 40));
  const allowanceValue = landCommissionAmount(allowance), reserveValue = landCommissionAmount(reserve);
  const invalid = allowanceValue === null || reserveValue === null;
  const locked = busy || !ready;
  const apply = () => {
    if (locked || allowanceValue === null || reserveValue === null) return;
    issue({ type: 'setLandPolicy', factionId: view.factionId, settlementId, improvementId, allowance: allowanceValue, reserve: reserveValue });
  };
  const end = () => {
    if (!locked && policy) issue({ type: 'setLandPolicy', factionId: view.factionId, settlementId, improvementId: 'none', allowance: policy.allowance, reserve: policy.reserve });
  };
  return <>
    <label>Commission improvement<select value={improvementId} disabled={locked} onChange={event => setImprovementId(event.target.value)}>
      {IMPROVEMENTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>
    <div className="land-policy-amounts">
      <label>Remaining allowance · coin<input type="text" inputMode="numeric" value={allowance} disabled={locked} aria-invalid={allowanceValue === null} onChange={event => setAllowance(event.target.value)}/></label>
      <label>Treasury reserve · coin<input type="text" inputMode="numeric" value={reserve} disabled={locked} aria-invalid={reserveValue === null} onChange={event => setReserve(event.target.value)}/></label>
    </div>
    <p className="field-help">Applying replaces the remaining allowance with this amount; it does not add to it. Zero allowance stops new purchases. Terrain, research, the reserve and ordinary construction prices still apply.</p>
    {invalid && <p role="alert" className="land-blocker">Enter whole, nonnegative coin amounts up to {Number.MAX_SAFE_INTEGER}.</p>}
    <button type="button" className="primary wide" disabled={locked || invalid} onClick={apply}>Apply land commission</button>
    {policy && <button type="button" className="wide" disabled={locked} onClick={end}>End land commission</button>}
  </>;
}
