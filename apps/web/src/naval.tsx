import { useState } from 'react';
import { BUILDINGS, UNITS } from '@theandril/content';
import type { ArmyView, GameCommand, Observation } from '@theandril/sim';
import { FactionArt } from './faction-art';
import './naval.css';

type Issue = (command: GameCommand) => void;
const lossWarning = 'Destroyed transport formations reduce carrying space and can drown passengers. If the fleet sinks, every carried formation and its attached characters are lost.';

export function NavalTransport({ army, view, busy, issue, selectArmy }: { army: ArmyView; view: Observation; busy: boolean; issue: Issue; selectArmy: (armyId: string) => void }) {
  const [fleetId, setFleetId] = useState('');
  const [target, setTarget] = useState<number>();
  const fleet = army.embarkOptions.find(option => option.fleetId === fleetId) ?? army.embarkOptions[0];
  const landing = army.disembarkOptions.find(option => option.cell === target) ?? army.disembarkOptions[0];
  const carrier = view.armies.find(other => other.id === army.carrierId);
  if (army.domain !== 'naval' && !army.carrierId && !army.embarkOptions.length) return null;
  return <section className="naval-transport" aria-label="Fleet and transport orders" data-testid="naval-transport">
    <h3 className="section-title">{army.domain === 'naval' ? 'Fleet & passengers' : army.carrierId ? 'Aboard a transport' : 'Embark for sea'}</h3>
    {army.domain === 'naval' ? <>
      <p className="field-help">{army.canEnterDeepWater ? 'This fleet can navigate shallow water and deep ocean.' : 'Shallow-water passage only. Deep ocean requires Ocean navigation and ocean-capable hulls throughout the fleet.'}</p>
      <p className="transport-capacity" data-testid="transport-capacity">Passengers: {army.transportUsed} / {army.transportCapacity} formation spaces</p>
      {army.cargo.length ? <><p className="field-help">Select a carried army to review its landing shores. Loaded fleets must unload before reorganizing.</p><ul className="transport-cargo">{army.cargo.map(cargo => <li key={cargo.armyId}><button aria-label={`Select embarked ${cargo.name} (${cargo.armyId})`} onClick={() => selectArmy(cargo.armyId)}>{cargo.name}<small>{cargo.formations} formations · {cargo.armyId}</small></button></li>)}</ul></> : <p className="field-help">No passengers aboard. Select a land army on an adjacent shore to embark it.</p>}
      {army.transportCapacity > 0 && <p className="transport-warning">{lossWarning}</p>}
    </> : army.carrierId ? <>
      <p className="field-help">Carried by {carrier?.name ?? army.carrierId}. Passengers cannot move, fight or found independently and provide no extra sight.</p>
      <button className="wide" onClick={() => selectArmy(army.carrierId!)}>Select carrying fleet</button>
      <label>Landing shore<select value={landing?.cell ?? ''} disabled={busy || !army.disembarkOptions.length} onChange={event => setTarget(Number(event.target.value))}>{army.disembarkOptions.length ? army.disembarkOptions.map(option => <option value={option.cell} key={option.cell}>Hex {option.cell}{option.blocker ? ' · unavailable' : ''}</option>) : <option value="">No known adjacent shore</option>}</select></label>
      {landing?.blocker && <p className="character-blocker">{landing.blocker}</p>}
      <p className="field-help">Landing spends one fleet movement. The passengers receive no movement until a later turn; hostile shores and foreign towns cannot be bypassed.</p>
      <button className="primary wide" disabled={busy || !landing?.canDisembark} onClick={() => { if (landing) issue({ type: 'disembarkArmy', factionId: view.factionId, armyId: army.id, target: landing.cell }); }}>Disembark army</button>
    </> : <>
      <label>Transport fleet<select value={fleet?.fleetId ?? ''} disabled={busy || !army.embarkOptions.length} onChange={event => setFleetId(event.target.value)}>{army.embarkOptions.map(option => <option value={option.fleetId} key={option.fleetId}>{option.label} · {option.availableCapacity} free formation spaces</option>)}</select></label>
      {army.transportOptionsTruncated && <p className="field-help">Showing the first {army.embarkOptions.length} nearby fleets. Move the desired fleet beside a less crowded shore if it is not listed.</p>}
      <p className="field-help">Embark all {army.formations.length} formations and their characters. Boarding spends this army’s remaining movement and one fleet movement, and removes its previous travel orders.</p>
      <p className="transport-warning" id={`transport-risk-${army.id}`}>{lossWarning}</p>
      {fleet?.blocker && <p className="character-blocker">{fleet.blocker}</p>}
      <button className="primary wide" disabled={busy || !fleet?.canEmbark} aria-describedby={`transport-risk-${army.id}`} onClick={() => { if (fleet) issue({ type: 'embarkArmy', factionId: view.factionId, armyId: army.id, fleetId: fleet.fleetId }); }}>Embark army</button>
    </>}
  </section>;
}

/** Canonical production options provide prerequisites, funds, queue and launch legality. */
export function SettlementProduction({ view, settlementId, busy, issue }: { view: Observation; settlementId: string; busy: boolean; issue: Issue }) {
  const options = view.productionOptions.filter(option => option.settlementId === settlementId);
  const definitionId = view.factions.find(faction => faction.id === view.factionId)?.definitionId;
  return <>{(['building', 'land', 'naval'] as const).map(kind => <section key={kind} data-testid={`production-${kind}`}>
    <h3 className="section-title">{kind === 'building' ? 'Construction' : kind === 'land' ? 'Recruitment' : 'Fleet recruitment'}</h3>
    {kind === 'land' && <p className="field-help">Each company arrives as a separate detachment. Assign a healthy marshal and use Army composition to combine co-located formations under their command limit.</p>}
    {kind === 'naval' && <p className="field-help">Harbors launch completed hull formations onto an adjacent water hex. Select a fleet in your army registry to sail it. Naval artwork is not yet approved; clearly marked ship silhouettes are used.</p>}
    <div className={`build-options ${kind === 'building' ? '' : 'faction-recruit-options'}`}>{options.filter(option => option.kind === kind).map(option => {
      const unit = UNITS.find(item => item.id === option.itemId), building = BUILDINGS.find(item => item.id === option.itemId), definition = unit ?? building;
      if (!definition) return null;
      return <button key={option.itemId} disabled={busy || !option.canQueue} aria-label={`${kind === 'building' ? 'Build' : 'Recruit'} ${definition.name}`} onClick={() => issue({ type: 'queue', factionId: view.factionId, settlementId, itemId: option.itemId })}>
        <span className="faction-art-card">{unit && (kind === 'naval' ? <NavalRoleMarker name={unit.name}/> : <FactionArt contentId={unit.id} definitionId={definitionId} label={unit.name} decorative/>)}<span><strong>{definition.name}</strong><small>{definition.cost} industry · {definition.coinCost} coin{unit ? ` · ${unit.upkeep} upkeep` : ''}</small>
          {unit && <small>{unit.movement} movement · {unit.range} range · {unit.armor} armor</small>}
          {unit?.naval && <small>{unit.naval.transportCapacity} passenger formation spaces · {unit.naval.oceanCapable ? 'Ocean-capable hull' : 'Coastal hull'}</small>}
          {unit?.description && <small>{unit.description}</small>}
          {building && <small>{building.food || building.industry || building.coin || building.knowledge ? `${[building.food ? `+${building.food} food` : '', building.industry ? `+${building.industry} industry` : '', building.coin ? `+${building.coin} coin` : '', building.knowledge ? `+${building.knowledge} knowledge` : ''].filter(Boolean).join(' · ')} each turn` : 'Permanent infrastructure for naval recruitment'}</small>}
          {option.blocker && <small className="production-blocker">{option.blocker}</small>}
        </span></span>
      </button>;
    })}</div>
  </section>)}</>;
}

export function NavalRoleMarker({ name }: { name: string }) {
  return <span className="naval-role-marker" role="img" aria-label={`${name} · procedural ship marker, approved naval artwork unavailable`}><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 43h44l-9 10H21ZM32 9v33M29 13 15 36h14M36 17l13 19H36M8 57l8-2 9 2 8-2 9 2 10-2 6 2" fill="none" stroke="currentColor" strokeWidth="2"/></svg><small>Ship marker</small></span>;
}
