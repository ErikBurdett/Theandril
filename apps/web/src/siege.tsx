import { useEffect, useRef, useState } from 'react';
import { neighbors } from '@theandril/mapgen';
import type { ArmyView, GameCommand, Observation, Settlement } from '@theandril/sim';
import { BattleDefensePreview } from './battle-defense';

type IssueOrder = (command: GameCommand) => void;
const factionName = (view: Observation, id: string): string => view.factions.find(faction => faction.id === id)?.name ?? id;

function SiegeStrength({ siege }: { siege: Observation['sieges'][number] }) {
  return <dl className="siege-strength"><div><dt>Defenses</dt><dd>{siege.defenses}</dd></div><div><dt>Food stores</dt><dd>{siege.supplies} {siege.supplies === 1 ? "turn" : "turns"}</dd></div><div><dt>Defending strength</dt><dd>{siege.defenderStrength}</dd></div></dl>;
}

export function SiegeOrders({ army, view, busy, issue }: { army: ArmyView; view: Observation; busy: boolean; issue: IssueOrder }) {
  if (!army.canAttack) return null;
  const current = view.sieges.find(siege => siege.armyId === army.id && siege.factionId === view.factionId);
  const adjacent = new Set(neighbors(army.cell, view.width, view.height));
  const targets = view.settlements.filter(town => town.factionId !== view.factionId && adjacent.has(town.cell));
  return <section className="siege-orders" data-testid="siege-orders" aria-label="Settlement siege orders">
    <h3 className="section-title">Walls & blockades</h3>
    {current ? <div className="siege-card" data-testid={`siege-${current.settlementId}`}>
      <strong>Besieging {view.settlements.find(town => town.id === current.settlementId)?.name ?? current.settlementId}</strong>
      <SiegeStrength siege={current}/>
      <BattleDefensePreview defense={current.battleDefense}/>
      {current.assaultBlocker && <p className="field-help" role="status">{current.assaultBlocker}</p>}
      <button className="danger wide" disabled={busy || !current.canAssault} aria-label={`Assault ${view.settlements.find(town => town.id === current.settlementId)?.name ?? current.settlementId}`} onClick={() => issue({ type: 'assault', factionId: view.factionId, settlementId: current.settlementId })}>Assault settlement</button>
      <button className="wide" disabled={busy} aria-label={`Lift siege of ${view.settlements.find(town => town.id === current.settlementId)?.name ?? current.settlementId}`} onClick={() => issue({ type: 'liftSiege', factionId: view.factionId, settlementId: current.settlementId })}>Lift siege</button>
      <p className="field-help">End turns to maintain the blockade. An assault commits your army to a battle with the defenders and militia.</p>
    </div> : targets.map(town => <div className="siege-card" key={town.id}>
      <strong>{town.name}</strong><small>{factionName(view, town.factionId)} · hex {town.cell}</small>
      <p>{town.population} people · devastation {town.devastation}/100</p>
      {view.visibleSiegeSettlementIds.includes(town.id) ? <p className="field-help">Under siege. Another force is already maintaining this blockade.</p> : view.wars.includes(town.factionId) ? <button className="danger wide" disabled={busy} aria-label={`Besiege ${town.name}`} onClick={() => issue({ type: 'besiege', factionId: view.factionId, armyId: army.id, settlementId: town.id })}>Besiege settlement</button>
        : <p className="field-help">A declaration of war is required before besieging this settlement.</p>}
    </div>)}
    {!current && targets.length === 0 && <p className="field-help">No neighboring foreign settlements are in sight.</p>}
  </section>;
}

export function SettlementDefense({ settlement, view }: { settlement: Settlement; view: Observation }) {
  const siege = view.sieges.find(item => item.settlementId === settlement.id);
  return <section className="settlement-defense" data-testid="settlement-defense" aria-label="Settlement condition">
    <div className="settlement-condition"><span>Devastation <strong>{settlement.devastation}/100</strong></span><span>Occupation <strong>{settlement.occupationTurns} turns</strong></span></div>
    {siege && <><h3 className="section-title">Under siege</h3><p className="field-help">Blockaded by {factionName(view, siege.factionId)}.</p><SiegeStrength siege={siege}/><p className="field-help">Relieve the settlement by attacking the besieging force with a nearby army.</p></>}
  </section>;
}

export function SiegeLedger({ view, locate }: { view: Observation; locate: (cell: number) => void }) {
  const activeSieges = view.sieges.filter(siege => siege.settlementId !== view.pendingCapture?.settlementId);
  if (!activeSieges.length) return null;
  return <section className="siege-ledger" aria-label="Known sieges"><h3>Contested hearths</h3>{activeSieges.map(siege => {
    const town = view.settlements.find(item => item.id === siege.settlementId);
    return <div className="siege-ledger-entry" key={siege.settlementId}><strong>{town?.name ?? siege.settlementId}</strong><span>{siege.factionId === view.factionId ? 'Your blockade' : `Besieged by ${factionName(view, siege.factionId)}`}</span><SiegeStrength siege={siege}/>{town && <button aria-label={`Locate siege of ${town.name}`} onClick={() => locate(town.cell)}>Locate siege</button>}</div>;
  })}</section>;
}

export function CapturePanel({ view, busy, issue }: { view: Observation; busy: boolean; issue: IssueOrder }) {
  const capture = view.pendingCapture;
  const heading = useRef<HTMLHeadingElement>(null);
  const cancelRaze = useRef<HTMLButtonElement>(null);
  const [confirmRaze, setConfirmRaze] = useState(false);
  useEffect(() => { heading.current?.focus(); setConfirmRaze(false); }, [capture?.settlementId]);
  useEffect(() => { if (confirmRaze) cancelRaze.current?.focus(); }, [confirmRaze]);
  if (!capture) return null;
  const town = view.settlements.find(item => item.id === capture.settlementId);
  const raze = capture.options.find(option => option.outcome === 'raze');
  const actions = { occupy: 'Occupy settlement', sack: 'Sack settlement', raze: 'Raze settlement', liberate: 'Liberate settlement' } as const;
  return <section className="battle-panel capture-panel" data-testid="capture-panel" aria-labelledby="capture-heading">
    <span className="eyebrow">The fate of a hearth</span><h2 id="capture-heading" ref={heading} tabIndex={-1}>{town?.name ?? 'Captured settlement'} has fallen</h2>
    <p className="battle-context">Choose what follows the victory. Campaign orders pause until this decision is resolved.</p>
    {confirmRaze && raze ? <div className="raze-confirmation" role="group" aria-label="Confirm settlement destruction">
      <h3>Raze {town?.name ?? 'this settlement'}?</h3><p role="alert">{raze.description} This removes the settlement and its buildings, leaving ruins.</p>
      <p>{raze.populationLoss} population lost · {raze.buildingsLost} buildings lost · {raze.coinGain} coin gained.</p>
      <button className="danger wide" disabled={busy} onClick={() => issue({ type: 'resolveCapture', factionId: view.factionId, settlementId: capture.settlementId, outcome: 'raze' })}>Confirm raze</button>
      <button className="wide" ref={cancelRaze} disabled={busy} onClick={() => setConfirmRaze(false)}>Keep settlement</button>
    </div> : <div className="capture-options">{capture.options.map(option => <article className="capture-option" key={option.outcome}>
      <h3>{option.label}</h3><p>{option.description}</p>
      <button className={option.outcome === 'raze' ? 'danger wide' : 'wide'} aria-label={actions[option.outcome]} disabled={busy} onClick={() => {
        if (option.outcome === 'raze') setConfirmRaze(true);
        else issue({ type: 'resolveCapture', factionId: view.factionId, settlementId: capture.settlementId, outcome: option.outcome });
      }}>{option.label}</button>
      <dl><div><dt>Coin gained</dt><dd>{option.coinGain}</dd></div><div><dt>Population lost</dt><dd>{option.populationLoss}</dd></div><div><dt>Buildings lost</dt><dd>{option.buildingsLost}</dd></div><div><dt>Devastation after capture</dt><dd>{option.devastation}/100</dd></div><div><dt>Occupation</dt><dd>{option.occupationTurns} turns</dd></div></dl>
      {option.recipientFactionId && <p className="capture-recipient">Governing faction: {factionName(view, option.recipientFactionId)}</p>}
    </article>)}</div>}
  </section>;
}

export function RuinInspection({ view, cell }: { view: Observation; cell: number | undefined }) {
  const ruin = view.ruins.find(ruin => ruin.cell === cell);
  if (!ruin) return null;
  return <section className="ruin-inspection" data-testid="ruin-inspection"><h3>Ruins of {ruin.name}</h3><p className="field-help">Razed on turn {ruin.turn}. Move a hearth caravan onto this hex and found a new settlement to resettle the site.</p></section>;
}
