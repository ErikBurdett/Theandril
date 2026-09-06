import { useEffect, useRef } from 'react';
import { UNITS } from '@theandril/content';
import { neighbors } from '@theandril/mapgen';
import type { ArmyView, BattleOrder, BattleReport, BattleState, GameCommand, Observation } from '@theandril/sim';
import { CommanderBattleControls } from './characters';

type IssueOrder = (command: GameCommand) => void;
const terrainNames = ['Water', 'Plains', 'Forest', 'Hills', 'Mountains'];
const unitName = (id: string): string => UNITS.find(unit => unit.id === id)?.name ?? id;
const factionName = (view: Observation, id: string): string => view.factions.find(faction => faction.id === id)?.name ?? id;

export function AttackOrders({ army, view, busy, issue, terrain }: { army: ArmyView; view: Observation; busy: boolean; issue: IssueOrder; terrain: (cell: number) => number | undefined }) {
  if (!army.canAttack) return null;
  const adjacent = new Set(neighbors(army.cell, view.width, view.height));
  const targets = view.armies.filter(target => target.factionId !== view.factionId && !target.carrierId && target.domain === army.domain && adjacent.has(target.cell));
  return <section className="attack-orders" aria-label="Nearby enemy forces">
    <h3 className="section-title">{army.domain === 'naval' ? 'Naval engagement' : 'Field engagement'}</h3>
    <p className="field-help">Your force: {army.strength} strength · {army.morale} morale · {army.fatigue} fatigue.</p>
    {targets.length === 0 && <p className="field-help">No neighboring foreign {army.domain === 'naval' ? 'fleets' : 'land armies'} are in sight.</p>}
    {targets.map(target => <div className="attack-target" key={target.id}>
      <strong>{target.name}</strong>
      <small>{factionName(view, target.factionId)} · hex {target.cell}</small>
      <p>{target.strength} strength · {target.morale} morale · {target.fatigue} fatigue</p>
      <p>{terrainNames[terrain(target.cell) ?? -1] ?? 'Unknown terrain'} · {view.armies.filter(other => other.cell === target.cell && other.factionId === target.factionId).reduce((sum, other) => sum + other.formations.length, 0)} defending formations</p>
      {view.wars.includes(target.factionId)
        ? <button className="danger wide" disabled={busy || Boolean(view.battle)} data-testid={`attack-${target.id}`} aria-label={`Attack ${target.name} (${target.id})`} onClick={() => issue({ type: 'attack', factionId: view.factionId, armyId: army.id, targetArmyId: target.id })}>Attack {target.name}</button>
        : <p className="field-help">Declare war from the encountered factions list before attacking.</p>}
    </div>)}
    {targets.length > 0 && <p className="field-help">The battle includes every defending {army.domain === 'naval' ? 'naval' : 'land'} formation at that hex. {army.domain === 'naval' ? 'Passengers do not fight as ship formations; destroyed transport capacity can drown them.' : 'Forests provide cover and hills favor defenders.'} Command each round or let your officers resolve the engagement.</p>}
  </section>;
}

function FormationTable({ formations, label }: { formations: BattleState['attacker']; label: string }) {
  return <div className="formation-table-wrap"><table className="formation-table" aria-label={label}>
    <caption>{label}</caption>
    <thead><tr><th scope="col">Formation & position</th><th scope="col">Strength</th><th scope="col">Morale</th><th scope="col">Fatigue</th></tr></thead>
    <tbody>{formations.map(formation => <tr key={formation.id} className={formation.strength === 0 || formation.morale === 0 ? 'formation-defeated' : ''}>
      <th scope="row"><strong>{unitName(formation.unitId)}</strong><small>{formation.id} · rank {formation.row + 1}, file {formation.column + 1}</small></th>
      <td>{formation.strength} / {formation.maxStrength}</td><td>{formation.morale}</td><td>{formation.fatigue}</td>
    </tr>)}</tbody>
  </table></div>;
}

const orders: { id: BattleOrder; name: string; description: string }[] = [
  { id: 'advance', name: 'Advance', description: 'Close the ranks and engage the enemy line.' },
  { id: 'brace', name: 'Brace', description: 'Favor defense and preserve stamina.' },
  { id: 'flank', name: 'Flank', description: 'Pressure exposed formations at greater fatigue.' },
  { id: 'withdraw', name: 'Withdraw', description: 'Leave the field; survivors face enemy pursuit.' },
];

export function BattlePanel({ view, busy, issue }: { view: Observation; busy: boolean; issue: IssueOrder }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const battle = view.battle;
  useEffect(() => { heading.current?.focus(); }, [battle?.id]);
  if (!battle) return null;
  const ownSide = battle.attackerFactionId === view.factionId ? 'attacker' : 'defender';
  return <section className="battle-panel" data-testid="battle-panel" aria-labelledby="battle-heading">
    <div className="battle-heading"><div><span className="eyebrow">{battle.domain === 'naval' ? 'The contested waters' : 'The field of oaths'}</span><h2 id="battle-heading" tabIndex={-1} ref={heading}>{battle.domain === 'naval' ? 'Naval battle' : 'Battle'} at hex {battle.defenderCell}</h2></div><div className="battle-round" aria-live="polite">ROUND <strong data-testid="battle-round">{battle.combat.round}</strong></div></div>
    <p className="battle-context">{terrainNames[battle.combat.terrain]} · You command the {ownSide === 'attacker' ? 'attacking' : 'defending'} {battle.domain === 'naval' ? 'fleet' : 'forces'}.{battle.settlementId && ` Settlement assault · fortification ${battle.fortification}.`}{battle.domain === 'naval' && ' Carried troops do not enter the line. Sunk carriers lose their passengers; destroyed transport formations may leave too little carrying space.'}</p>
    <div className="battle-autoresolve"><p>Each order resolves one round for both sides. Your officers use these same battle rules when given command.</p><button className="primary" disabled={busy} onClick={() => issue({ type: 'autoResolveBattle', factionId: view.factionId })}>Auto-resolve battle</button></div>
    <CommanderBattleControls view={view} busy={busy} issue={issue}/>
    <div className="battle-sides">
      <div><h3>{factionName(view, battle.attackerFactionId)} <span>{ownSide === 'attacker' ? 'YOUR FORCES' : 'OPPONENT'}</span></h3><FormationTable formations={battle.combat.attacker} label="Attacking formations"/></div>
      <div><h3>{factionName(view, battle.defenderFactionId)} <span>{ownSide === 'defender' ? 'YOUR FORCES' : 'OPPONENT'}</span></h3><FormationTable formations={battle.combat.defender} label="Defending formations"/></div>
    </div>
    <div className="battle-orders" aria-label="Tactical orders">{orders.map(order => <button key={order.id} disabled={busy} className={order.id === 'withdraw' ? 'danger' : ''} aria-label={order.name} title={order.description} onClick={() => issue({ type: 'battleOrder', factionId: view.factionId, order: order.id })}><strong>{order.name}</strong><small>{order.description}</small></button>)}</div>
    {battle.combat.log.length > 0 && <details className="battle-log" open><summary>Round account</summary><ol>{battle.combat.log.slice(-12).map((entry, index) => <li key={index}>{entry}</li>)}</ol></details>}
  </section>;
}

function Report({ report, view }: { report: BattleReport; view: Observation }) {
  const result = report.combat.result;
  const winnerId = result?.winner === 'attacker' ? report.attackerFactionId : result?.winner === 'defender' ? report.defenderFactionId : undefined;
  return <article className="battle-report" data-testid="battle-report">
    <div><span className="eyebrow">Turn {report.turn} · hex {report.defenderCell} · {report.domain === 'naval' ? 'Naval battle' : 'Land battle'}</span><h3>{winnerId ? `${factionName(view, winnerId)} held the ${report.domain === 'naval' ? 'waters' : 'field'}` : `The ${report.domain === 'naval' ? 'waters were' : 'field was'} left contested`}</h3><p>{result?.reason} · {report.combat.round} rounds · {terrainNames[report.combat.terrain]}</p></div>
    <div className="battle-losses">{(['attacker', 'defender'] as const).map(side => {
      const battleIds = new Set(report.combat[side].map(formation => formation.id));
      const ids = new Set(report.formationBindings.filter(binding => battleIds.has(binding.battleFormationId)).map(binding => binding.formationId));
      const initial = report.formationStrengths.filter(formation => ids.has(formation.formationId)).reduce((sum, formation) => sum + formation.strength, 0);
      const remaining = report.formationAftermath.filter(formation => ids.has(formation.formationId)).reduce((sum, formation) => sum + formation.strength, 0);
      return <div key={side}><strong>{factionName(view, side === 'attacker' ? report.attackerFactionId : report.defenderFactionId)}</strong><span>{initial - remaining} strength lost · {remaining} survivors</span></div>;
    })}</div>
    <ul className="battle-aftermath">{report.aftermath.map(army => <li key={army.armyId}>{army.armyId}: {army.outcome}{army.cell === null ? '' : ` at hex ${army.cell}`} · {army.strength} remaining strength</li>)}</ul>
    {report.transportAftermath.length > 0 && <section className="transport-aftermath" data-testid="transport-aftermath"><h4>Passengers lost at sea</h4><ul>{report.transportAftermath.map(cargo => <li key={cargo.armyId}>{cargo.name} ({cargo.armyId}): {cargo.lostFormationIds.length} carried formations lost{cargo.outcome === 'lost' ? ' · the entire army and its attached characters were lost' : ' · the surviving army remains aboard'}.<small> Lost formations: {cargo.lostFormationIds.join(', ')}</small></li>)}</ul></section>}
    {report.characterAftermath.length > 0 && <section data-testid="character-battle-aftermath"><h4>Those who marched</h4><ul className="battle-aftermath">{report.characterAftermath.map(character => <li key={character.characterId}>{character.name}: {character.outcome} · {character.experience} experience{character.woundedTurns ? ` · ${character.woundedTurns} recovery turns` : ''}</li>)}</ul></section>}
    <details><summary>Formations & battle account</summary><FormationTable formations={report.combat.attacker} label="Attacking formations at round end"/><FormationTable formations={report.combat.defender} label="Defending formations at round end"/><ol className="report-log">{report.combat.log.map((entry, index) => <li key={index}>{entry}</li>)}</ol></details>
  </article>;
}

export function BattleHistory({ view }: { view: Observation }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const latest = view.battleReports.at(-1);
  useEffect(() => { if (!view.pendingCapture) heading.current?.focus(); }, [latest?.id, view.pendingCapture]);
  if (!latest) return null;
  return <section className="battle-history" aria-label="Battle reports">
    <h2 ref={heading} tabIndex={-1}>After the clash</h2><Report report={latest} view={view}/>
    {view.battleReports.length > 1 && <details className="past-battles"><summary>Earlier battles ({view.battleReports.length - 1})</summary>{view.battleReports.slice(0, -1).reverse().map(report => <Report key={report.id} report={report} view={view}/>)}</details>}
  </section>;
}
