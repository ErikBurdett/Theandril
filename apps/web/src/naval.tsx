import { useState } from 'react';
import { BUILDINGS, UNITS } from '@theandril/content';
import { CHARTER_CEILING_MAX, CHARTER_CEILING_MIN, CHARTER_FOCI, CHARTER_NAMES, CHARTER_RESERVE, type ArmyView, type CharterFocus, type GameCommand, type Observation } from '@theandril/sim';
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
      <details className="naval-chart-help"><summary>Read the naval chart</summary><p className="field-help">Paired pale waves mark coastal shallows; three slate waves mark deep ocean. Approved hull artwork identifies the fleet; a labeled ship marker remains if its approved artwork is unavailable.</p></details>
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

/** Rules 25: a standing charter keeps a hearth working when its queue empties, so a
 * wide realm does not need an order for every hearth every turn. */
function SettlementCharter({ view, settlementId, busy, issue }: { view: Observation; settlementId: string; busy: boolean; issue: Issue }) {
  const charter = view.charters.find(item => item.settlementId === settlementId);
  const [focus, setFocus] = useState<CharterFocus>(charter?.focus ?? 'works');
  const [ceiling, setCeiling] = useState(charter?.ceiling ?? 24);
  const set = (next: CharterFocus | 'none') => issue({ type: 'setCharter', factionId: view.factionId, settlementId, focus: next, ceiling });
  return <details className="production-category" data-testid="settlement-charter">
    <summary>Standing charter<span>{charter ? `${CHARTER_NAMES[charter.focus]} · ${charter.ceiling} coin` : 'none'}</span></summary>
    <p className="field-help">A charter places one order whenever this hearth’s queue is empty. It never replaces an order you place yourself, never spends more than its ceiling on a single work, and always leaves {CHARTER_RESERVE} coin in the treasury.</p>
    {charter && <p className="production-blocker" id={`charter-state-${settlementId}`}>{charter.itemName ? `Next: ${charter.itemName}.` : charter.blocker}</p>}
    <label>Focus<select value={focus} disabled={busy} onChange={event => setFocus(event.target.value as CharterFocus)}>
      {CHARTER_FOCI.map(option => <option value={option} key={option}>{CHARTER_NAMES[option]}</option>)}
    </select></label>
    <label>Coin ceiling<input type="number" value={ceiling} min={CHARTER_CEILING_MIN} max={CHARTER_CEILING_MAX} disabled={busy}
      onChange={event => setCeiling(Math.min(CHARTER_CEILING_MAX, Math.max(CHARTER_CEILING_MIN, Number(event.target.value) || CHARTER_CEILING_MIN)))}/></label>
    <button className="primary wide" disabled={busy} aria-describedby={charter ? `charter-state-${settlementId}` : undefined} onClick={() => set(focus)}>{charter ? 'Update charter' : 'Grant charter'}</button>
    {charter && <button className="wide" disabled={busy} onClick={() => set('none')}>Revoke charter</button>}
  </details>;
}

/** Canonical production options provide prerequisites, funds, queue and launch legality. */
export function SettlementProduction({ view, settlementId, busy, issue }: { view: Observation; settlementId: string; busy: boolean; issue: Issue }) {
  const options = view.productionOptions.filter(option => option.settlementId === settlementId);
  const definitionId = view.factions.find(faction => faction.id === view.factionId)?.definitionId;
  return <div className="production-catalog" aria-label="Settlement production"><SettlementCharter key={settlementId} view={view} settlementId={settlementId} busy={busy} issue={issue}/>{(['building', 'land', 'naval'] as const).map(kind => <details key={kind} className="production-category" open={kind === 'building'} data-testid={`production-${kind}`}>
    <summary>{kind === 'building' ? 'Construction' : kind === 'land' ? 'Recruit land forces' : 'Recruit fleet hulls'}<span>{options.filter(option => option.kind === kind && option.canQueue).length} available</span></summary>
    {kind === 'land' && <p className="field-help">Each company arrives as a separate detachment. Assign a healthy marshal and use Army composition to combine co-located formations under their command limit.</p>}
    {kind === 'naval' && <p className="field-help">Harbors launch completed hull formations onto an adjacent water hex. Select a fleet in the army registry to sail it.</p>}
    <div className="production-cards">{options.filter(option => option.kind === kind).map(option => {
      const unit = UNITS.find(item => item.id === option.itemId), building = BUILDINGS.find(item => item.id === option.itemId), definition = unit ?? building;
      if (!definition) return null;
      return <article className="production-card" key={option.itemId} data-testid={`production-card-${option.itemId}`}>
        <div className="production-card-heading">{unit && <FactionArt contentId={unit.id} definitionId={definitionId} label={unit.name} compact decorative/>}<div><h4>{definition.name}</h4><p>{definition.cost} industry · {definition.coinCost} coin{unit ? ` · ${unit.upkeep} upkeep` : ''}</p>
          {unit && <p>{unit.movement} movement · {unit.range} range · {unit.armor} armor</p>}
          {unit?.naval && <p>{unit.naval.transportCapacity} passenger formation spaces · {unit.naval.oceanCapable ? 'Ocean-capable hull' : 'Coastal hull'}</p>}
          {building && <p>{building.food || building.industry || building.coin || building.knowledge ? `${[building.food ? `+${building.food} food` : '', building.industry ? `+${building.industry} industry` : '', building.coin ? `+${building.coin} coin` : '', building.knowledge ? `+${building.knowledge} knowledge` : ''].filter(Boolean).join(' · ')} each turn` : 'Permanent infrastructure for naval recruitment'}</p>}
        </div></div>
        {unit?.description && <details className="production-description"><summary>Details: {definition.name}</summary><p>{unit.description}</p></details>}
        {option.blocker && <p className="production-blocker" id={`production-blocker-${settlementId}-${option.itemId}`}>{option.blocker}</p>}
        <button disabled={busy || !option.canQueue} aria-describedby={option.blocker ? `production-blocker-${settlementId}-${option.itemId}` : undefined} aria-label={`${kind === 'building' ? 'Build' : 'Recruit'} ${definition.name}`} onClick={() => issue({ type: 'queue', factionId: view.factionId, settlementId, itemId: option.itemId })}>{kind === 'building' ? 'Build' : 'Recruit'} {definition.name}</button>
      </article>;
    })}</div>
  </details>)}</div>;
}

export function NavalRoleMarker({ name }: { name: string }) {
  return <span className="naval-role-marker" role="img" aria-label={`${name} · procedural ship marker, approved naval artwork unavailable`}><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 43h44l-9 10H21ZM32 9v33M29 13 15 36h14M36 17l13 19H36M8 57l8-2 9 2 8-2 9 2 10-2 6 2" fill="none" stroke="currentColor" strokeWidth="2"/></svg><small>Ship marker</small></span>;
}
