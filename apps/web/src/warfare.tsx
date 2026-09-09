import { useEffect, useRef } from 'react';
import { UNITS } from '@theandril/content';
import { neighbors } from '@theandril/mapgen';
import type { ArmyView, BattleReport, BattleState, GameCommand, Observation } from '@theandril/sim';
import { BattleDefensePreview } from './battle-defense';

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
      <BattleDefensePreview defense={target.battleDefense}/>
      {view.wars.includes(target.factionId)
        ? <button className="danger wide" disabled={busy || Boolean(view.battle)} data-testid={`attack-${target.id}`} aria-label={`Attack ${target.name} (${target.id})`} onClick={() => issue({ type: 'attack', factionId: view.factionId, armyId: army.id, targetArmyId: target.id })}>Attack {target.name}</button>
        : <p className="field-help">Declare war from the encountered factions list before attacking.</p>}
    </div>)}
    {targets.length > 0 && <p className="field-help">{targets.some(target => target.battleDefense) ? 'Committed defenders and reserves are listed for each target.' : `The battle includes every defending ${army.domain === 'naval' ? 'naval' : 'land'} formation at that hex.`} {army.domain === 'naval' ? 'Passengers do not fight as ship formations; destroyed transport capacity can drown them.' : 'Forests provide cover and hills favor defenders.'} Command each round or let your officers resolve the engagement.</p>}
  </section>;
}

export function FormationTable({ formations, label }: { formations: BattleState['attacker']; label: string }) {
  return <div className="formation-table-wrap"><table className="formation-table" aria-label={label}>
    <caption>{label}</caption>
    <thead><tr><th scope="col">Formation & position</th><th scope="col">Strength</th><th scope="col">Morale</th><th scope="col">Fatigue</th></tr></thead>
    <tbody>{formations.map(formation => <tr key={formation.id} className={formation.strength === 0 || formation.morale === 0 ? 'formation-defeated' : ''}>
      <th scope="row"><strong>{unitName(formation.unitId)}</strong><small>{formation.id} · rank {formation.row + 1}, file {formation.column + 1}</small></th>
      <td>{formation.strength} / {formation.maxStrength}</td><td>{formation.morale}</td><td>{formation.fatigue}</td>
    </tr>)}</tbody>
  </table></div>;
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

export function BattleHistory({ view, replayId, replay }: { view: Observation; replayId?: string; replay?: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const latest = view.battleReports.at(-1);
  useEffect(() => { if (!view.pendingCapture) heading.current?.focus(); }, [latest?.id, view.pendingCapture]);
  if (!latest) return null;
  return <section className="battle-history" aria-label="Battle reports">
    <h2 ref={heading} tabIndex={-1}>After the clash</h2>{replayId === latest.id && <button onClick={replay}>Watch recorded battle actions</button>}<Report report={latest} view={view}/>
    {view.battleReports.length > 1 && <details className="past-battles"><summary>Earlier battles ({view.battleReports.length - 1})</summary>{view.battleReports.slice(0, -1).reverse().map(report => <Report key={report.id} report={report} view={view}/>)}</details>}
  </section>;
}
