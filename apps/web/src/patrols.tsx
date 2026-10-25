import { useState } from 'react';
import type { ArmyView, GameCommand, Observation } from '@theandril/sim';

/** Parse a form coordinate only; explored terrain and legal orders belong to sim. */
export function patrolEndpoint(text: string, cells: number): number | undefined {
  const value = Number(text);
  return text.trim() !== '' && Number.isInteger(value) && value >= 0 && value < cells ? value : undefined;
}

export function ArmyPatrol({ army, view, busy, issue }: {
  army: ArmyView; view: Observation; busy: boolean; issue: (command: GameCommand) => void;
}) {
  const patrol = view.patrols?.find(item => item.armyId === army.id && item.factionId === view.factionId);
  const [firstText, setFirstText] = useState(String(patrol?.firstCell ?? army.cell));
  const [secondText, setSecondText] = useState(patrol ? String(patrol.secondCell) : '');
  const [pauseOnWar, setPauseOnWar] = useState(patrol?.pauseOnWar ?? false);
  if (view.patrols === undefined || army.factionId !== view.factionId || (!patrol && (army.domain !== 'land' || !army.canAttack || army.canFound))) return null;
  const cells = view.width * view.height;
  const firstCell = patrolEndpoint(firstText, cells), secondCell = patrolEndpoint(secondText, cells);
  const valid = firstCell !== undefined && secondCell !== undefined && firstCell !== secondCell;
  const points = view.settlements.filter(town => town.factionId === view.factionId);
  const commandReady = valid && !army.carrierId;
  const endpoint = (label: 'First' | 'Second', value: string, setValue: (value: string) => void) => <>
    <label>{label} patrol point<input type="number" min={0} max={cells - 1} step={1} value={value} disabled={busy} onChange={event => setValue(event.target.value)} aria-describedby={`patrol-points-${army.id}`}/></label>
    <label>{label} point shortcut<select value="" disabled={busy} onChange={event => { if (event.target.value !== '') setValue(event.target.value); }}>
      <option value="">Choose a position</option><option value={army.cell}>Where this army stands · hex {army.cell}</option>
      {points.filter(town => town.cell !== army.cell).map(town => <option key={town.id} value={town.cell}>{town.name} · hex {town.cell}</option>)}
    </select></label>
  </>;
  return <details className="production-category standing-order" data-testid="army-patrol">
    <summary>Two-point patrol<span>{patrol ? `${patrol.enabled ? 'Enabled' : 'Paused'} · ${patrol.firstCell} ↔ ${patrol.secondCell}` : 'none'}</span></summary>
    <p className="field-help">Patrol between two explored hexes using ordinary travel. Direct travel orders, standing postings, voyages, missions and sieges come first. A patrol never starts a battle automatically.</p>
    {patrol && <p className={patrol.blocker ? 'production-blocker' : 'field-help'} role="status" data-testid="patrol-status">
      {patrol.enabled ? `Next patrol point: hex ${patrol.targetCell}. ` : 'Patrol paused. '}{patrol.blocker ?? (patrol.status === 'traveling' ? 'Following its travel order.' : 'Waiting for the next patrol assignment.')}
    </p>}
    {endpoint('First', firstText, setFirstText)}
    {endpoint('Second', secondText, setSecondText)}
    <p id={`patrol-points-${army.id}`} className="field-help">Enter two different known hex numbers or choose positions above. Current position: hex {army.cell}. The order will explain any unexplored or unavailable destination.</p>
    <label className="waypoint-toggle"><input type="checkbox" checked={pauseOnWar} disabled={busy} onChange={event => setPauseOnWar(event.target.checked)}/>Pause when war begins</label>
    <p className="field-help">When enabled, war involving your realm pauses future patrol assignments on the next turn. Existing travel continues. Resuming while still at war pauses the patrol again next turn; turn this option off and update the patrol to keep patrolling through war.</p>
    {!valid && <p className="production-blocker">Choose two different hexes inside this world before saving the patrol.</p>}
    {army.carrierId && <p className="production-blocker">Put this army ashore before changing its patrol points.</p>}
    <button className="primary wide" disabled={busy || !commandReady} onClick={() => {
      if (!commandReady || firstCell === undefined || secondCell === undefined) return;
      issue({ type: 'setPatrol', factionId: view.factionId, armyId: army.id, firstCell, secondCell, enabled: patrol?.enabled ?? true, pauseOnWar });
    }}>{patrol ? 'Update patrol' : 'Start patrol'}</button>
    {patrol && <>
      <button className="wide" disabled={busy} onClick={() => issue({ type: 'setPatrolEnabled', factionId: view.factionId, armyId: army.id, enabled: !patrol.enabled })}>{patrol.enabled ? 'Pause patrol' : 'Resume patrol'}</button>
      <button className="wide" disabled={busy} onClick={() => issue({ type: 'clearPatrol', factionId: view.factionId, armyId: army.id })}>Remove patrol</button>
    </>}
    <p className="field-help">Pausing or removing a patrol stops future assignments. Travel already issued continues; use Cancel route in the movement controls to stop that route too. Updating points preserves whether the patrol is paused.</p>
  </details>;
}
