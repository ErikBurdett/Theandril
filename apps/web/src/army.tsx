import { useState } from 'react';
import { UNITS } from '@theandril/content';
import { MAX_ARMY_FORMATIONS, type GameCommand, type Observation } from '@theandril/sim';
import { FactionArt } from './faction-art';
import './army.css';

type ArmyView = Observation['armies'][number];
const unitName = (id: string) => UNITS.find(unit => unit.id === id)?.name ?? id;

/** Formation changes are commands; displayed shared values come directly from the observation. */
export function ArmyComposition({ army, view, busy, issue, inspectArmy }: {
  army: ArmyView; view: Observation; busy: boolean; issue: (command: GameCommand) => void; inspectArmy: (army: ArmyView) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [targetId, setTargetId] = useState('');
  const [name, setName] = useState('');
  const mates = view.armies.filter(other => other.id !== army.id && other.factionId === view.factionId && other.cell === army.cell);
  const target = mates.find(other => other.id === targetId) ?? mates[0];
  const chosen = army.formations.filter(formation => selected.includes(formation.id)).map(formation => formation.id);
  const ownSiege = view.sieges.some(siege => siege.armyId === army.id);
  const targetSiege = Boolean(target && view.sieges.some(siege => siege.armyId === target.id));
  const locked = busy || ownSiege || Boolean(army.reorganizationBlocker);
  const canTransfer = Boolean(target && !targetSiege && !target.reorganizationBlocker && chosen.length && target.formations.length + chosen.length <= MAX_ARMY_FORMATIONS);
  const canMerge = Boolean(target && !targetSiege && !target.reorganizationBlocker && target.formations.length + army.formations.length <= MAX_ARMY_FORMATIONS);
  const canSplit = chosen.length > 0 && chosen.length < army.formations.length;
  const transfer = (all: boolean) => {
    if (!target) return;
    issue(all ? { type: 'mergeArmies', factionId: view.factionId, sourceArmyId: army.id, targetArmyId: target.id }
      : { type: 'transferFormations', factionId: view.factionId, sourceArmyId: army.id, targetArmyId: target.id, formationIds: chosen });
    setSelected([]); inspectArmy(target);
  };
  return <details className="army-composition" data-testid="army-composition">
    <summary>Army composition <span>{army.formations.length} / {MAX_ARMY_FORMATIONS} formations</span></summary>
    <p className="field-help">An army moves and fights together. Each newly recruited unit arrives as a separate detachment; bring detachments to the same hex to combine their formations.</p>
    <dl className="army-capabilities" data-testid="army-capabilities"><div><dt>Shared movement</dt><dd>{army.movement} / {army.maxMovement}</dd></div><div><dt>Strength</dt><dd>{army.strength} / {army.maxStrength}</dd></div><div><dt>Sight</dt><dd>{army.sight} hexes</dd></div><div><dt>Upkeep</dt><dd>{army.upkeep} coin / turn</dd></div></dl>
    <p className="field-help">Shared morale {army.morale} · fatigue {army.fatigue}. The slowest formation sets the army’s movement limit.</p>
    <fieldset className="formation-choices" disabled={locked}><legend>Select formations to transfer or detach</legend>
      {army.formations.map(formation => {
        const definition = UNITS.find(unit => unit.id === formation.unitId);
        return <label key={formation.id} className="formation-choice"><input type="checkbox" checked={chosen.includes(formation.id)} aria-label={`Select formation ${formation.id}`} onChange={event => setSelected(current => event.target.checked ? [...current, formation.id] : current.filter(id => id !== formation.id))}/><FactionArt contentId={formation.unitId} definitionId={view.factions.find(faction => faction.id === army.factionId)?.definitionId} label={unitName(formation.unitId)} decorative/><span><strong>{unitName(formation.unitId)}</strong><small>{formation.id}</small><small>{formation.strength} strength · {formation.morale} morale · {formation.fatigue} fatigue</small>{definition && <small>{definition.movement} base movement · {definition.range} range · {definition.armor} armor · {definition.initiative} initiative</small>}</span></label>;
      })}
    </fieldset>
    {army.canFound && army.formations.length > 1 && <p className="field-help">Founding consumes one caravan formation only. Its escorts remain here, spend their remaining movement, and pause any travel order.</p>}
    {ownSiege && <p role="status" className="field-help">This army is maintaining a siege. Lift its siege before reorganizing.</p>}
    {army.reorganizationBlocker && <p role="status" className="character-blocker">{army.reorganizationBlocker}</p>}
    <div className="army-reorganization">
      <label>Other army at this hex<select value={target?.id ?? ''} disabled={locked || !mates.length} onChange={event => setTargetId(event.target.value)}>{mates.length ? mates.map(other => <option key={other.id} value={other.id}>{other.name} · {other.formations.length} formations · {other.id}</option>) : <option value="">No other owned army here</option>}</select></label>
      {target && <p className="field-help" id={`army-target-${army.id}`}>Destination: {target.name}, {target.formations.length} / {MAX_ARMY_FORMATIONS} formations.{targetSiege && ' This destination is maintaining a siege; lift it first.'}</p>}
      {target?.reorganizationBlocker && <p className="character-blocker">{target.reorganizationBlocker}</p>}
      {target && (target.commander || target.agents.length > 0) && <p className="field-help">Receiving commander: {target.commander?.name ?? 'none'}; agents: {target.agents.length ? target.agents.map(agent => agent.name).join(', ') : 'none'}. A full transfer brings the source characters too. Reassign characters first if this would exceed one marshal or two agents; the simulation will reject an incompatible merge without changing either army.</p>}
      <button disabled={locked || !canMerge} onClick={() => transfer(true)}>Merge armies</button>
      <button disabled={locked || !canTransfer} onClick={() => transfer(false)}>Transfer selected formations</button>
      {target && target.formations.length + army.formations.length > MAX_ARMY_FORMATIONS && <p className="field-help">A full merge would exceed {MAX_ARMY_FORMATIONS} formations. Select a smaller transfer instead.</p>}
      <label>New detachment name<input value={name} maxLength={80} placeholder="Optional name" disabled={locked} onChange={event => setName(event.target.value)}/></label>
      <button disabled={locked || !canSplit} onClick={() => { const trimmed = name.trim(); issue({ type: 'splitArmy', factionId: view.factionId, armyId: army.id, formationIds: chosen, ...(trimmed ? { name: trimmed } : {}) }); setSelected([]); setName(''); }}>Split selected formations</button>
      <p className="field-help">Select some, but not all, formations to split. Transfers and merges preserve losses and never restore movement. Moving every formation removes the empty source army. Affected travel orders pause for deliberate review.</p>
      {(army.commander || army.agents.length > 0) && <p className="field-help">Characters stay with this army when some formations detach. Moving every formation also transfers its characters, subject to the receiving army’s attachment capacity.</p>}
    </div>
  </details>;
}
