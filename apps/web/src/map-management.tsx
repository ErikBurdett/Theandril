import type { ReactNode } from 'react';
import { BUILDINGS, UNITS, RESOURCES, IMPROVEMENTS } from '@theandril/content';
import { BIOME_NAMES, WATER_DEPTH_NAMES, isLake, neighbors, riverSize } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import type { WorldRenderer } from '@theandril/render';
import { ArmyComposition } from './army';
import { ArmyCharacters, CharacterAppointments } from './characters';
import { FactionArt, MapArt } from './faction-art';
import { SettlementLand } from './land';
import { MovementOrders, type MapMovement, type MapSelection } from './movement';
import { NavalTransport, SettlementProduction } from './naval';
import { RuinInspection, SettlementDefense, SiegeOrders } from './siege';
import { AttackOrders } from './warfare';
import type { LandQuery } from './use-land-query';

const content = [...BUILDINGS, ...UNITS];
const itemName = (id: string) => content.find(item => item.id === id)?.name ?? id;
const terrainNames = ['Water', 'Plains', 'Forest', 'Hills', 'Mountains'];
type Props = {
  view: Observation; selection: MapSelection; movement: MapMovement; busy: boolean;
  name: string; setName: (name: string) => void; issue: (command: GameCommand) => void;
  select: (next: MapSelection, focus?: boolean) => void; openCharacters: (characterId?: string, armyId?: string) => void;
  renderer?: WorldRenderer; query: LandQuery; stateHash: string; queryEpoch: number; queryEnabled: boolean;
  spectator: boolean;
};

/** Both management surfaces mount these same controls, never two land-query owners. */
export function managementPanes({ view, selection, movement, busy, name, setName, issue, select, openCharacters, renderer, query, stateHash, queryEpoch, queryEnabled, spectator }: Props) {
  const army = view.armies.find(item => item.id === selection.armyId && item.factionId === view.factionId);
  const settlement = view.settlements.find(item => item.id === selection.settlementId && item.factionId === view.factionId);
  const realm = view.factions.find(item => item.id === view.factionId);
  const realmName = realm?.name ?? view.factionId;
  const factionId = view.factionId;
  const cell = selection.cell === undefined ? undefined : renderer?.inspect(selection.cell);
  const resource = RESOURCES.find(item => item.id === cell?.resourceId);
  const occupants = spectator && selection.cell !== undefined ? renderer?.inspectEntities(selection.cell) ?? [] : [];
  const chooseArmy = (armyId: string) => {
    const next = view.armies.find(item => item.id === armyId && item.factionId === factionId);
    if (next) select({ armyId: next.id, cell: next.cell }, true);
  };
  const armyOfficers = army && <ArmyCharacters army={army} open={characterId => openCharacters(characterId, army.id)}/>;
  const transport = army && <NavalTransport key={`transport-${army.id}`} army={army} view={view} busy={busy} issue={issue} selectArmy={chooseArmy}/>;
  const founding = army?.canFound && <form className="found-form" onSubmit={event => { event.preventDefault(); issue({ type: 'found', factionId, armyId: army.id, name }); }}>
    <label>Settlement name<input value={name} maxLength={40} required onChange={event => setName(event.target.value)}/></label>
    <p className="field-help">One caravan formation becomes a settlement here. Any escorts remain, spend their remaining movement, and pause their travel order.</p>
    {view.growth && <p className="field-help">Founding supplies: {view.growth.founding.coinCost} coin · realm upkeep rises by {view.growth.founding.additionalUpkeep} coin / turn. {view.growth.founding.blocker}</p>}
    <button className="primary wide" type="submit" disabled={busy || view.growth?.founding.canAfford === false}>Found settlement</button>
  </form>;
  const routes = army && <MovementOrders movement={movement} view={view} issue={issue} locate={target => select({ ...selection, cell: target }, true)}/>;
  const composition = army && <ArmyComposition key={army.id} army={army} view={view} busy={busy} issue={issue} inspectArmy={target => select({ armyId: target.id, cell: target.cell })}/>;
  const combat = army && !view.battle && !view.pendingCapture && <><SiegeOrders army={army} view={view} busy={busy} issue={issue}/><AttackOrders army={army} view={view} busy={busy} issue={issue} terrain={target => renderer?.inspect(target)?.terrain}/></>;
  const production = settlement && <>
    <h3 className="section-title">Production queue</h3>
    {settlement.queue.length ? <ol className="production-queue">{settlement.queue.map((item, index) => <li key={index}><span>{itemName(item.itemId)}</span><small>{item.progress} / {content.find(definition => definition.id === item.itemId)?.cost} industry</small></li>)}</ol> : <p className="field-help">The hearth is idle. Choose a project below.</p>}
    <SettlementProduction key={settlement.id} view={view} settlementId={settlement.id} busy={busy} issue={issue}/>
  </>;
  const land = (compact = false) => settlement && <SettlementLand key={settlement.id} compact={compact} view={view} settlementId={settlement.id} selectedCell={selection.cell} busy={busy} issue={issue} selectCell={target => select({ settlementId: settlement.id, cell: target }, true)} query={query} stateHash={stateHash} queryEpoch={queryEpoch} queryEnabled={queryEnabled}/>;
  const officers = army ? armyOfficers : settlement && <>
    <CharacterAppointments view={view} settlementId={settlement.id} busy={busy} issue={issue} open={() => openCharacters()}/>
    {view.characters.filter(character => character.location?.kind === 'settlement' && character.location.settlementId === settlement.id).map(character => <button key={character.id} className="wide" onClick={() => openCharacters(character.id)}>Manage {character.name} · {character.status}</button>)}
  </>;
  const defense = settlement && <SettlementDefense settlement={settlement} view={view}/>;
  const summary = army ? <>
    <div className="faction-art-heading"><FactionArt contentId="ui.banner" definitionId={realm?.definitionId} label={`${realmName} army banner`}/><h2>{army.name}</h2></div>
    <p className="subtle">{army.domain === 'naval' ? 'Fleet · ' : army.carrierId ? 'Embarked army · ' : ''}{army.formations.length === 1 ? itemName(army.unitId) : `${army.formations.length} formations together`} · cell {army.cell}</p>
    <div className="stat-pair"><div><strong>{army.movement}</strong><small>Movement</small></div><div><strong>{army.strength}</strong><small>Strength</small></div></div>
  </> : settlement ? <>
    <h2>{settlement.name}</h2><p className="subtle">A hearth of the {realmName} · cell {settlement.cell}</p>
    <div className="stat-pair"><div><strong>{settlement.population}</strong><small>Population</small></div><div><strong>{settlement.food}</strong><small>Stored food</small></div></div>
  </> : null;
  const location = <>
    <RuinInspection view={view} cell={selection.cell}/>
    {selection.cell !== undefined && <div className="hex-inspector"><span className="eyebrow">Selected hex {selection.cell}</span><p>{cell ? `${isLake(cell.hydrology ?? 0) ? 'Freshwater lake' : cell.waterDepth ? WATER_DEPTH_NAMES[cell.waterDepth] : BIOME_NAMES[cell.biome] ?? 'Unknown biome'} · ${terrainNames[cell.terrain]} · fertility ${cell.fertility} · ${spectator ? 'spectator view' : cell.visible ? 'in sight' : 'last explored'}` : 'Beyond known maps. Send a wayfinder or fleet to chart this region.'}</p>
      {resource && <div className="resource-works"><MapArt contentId={resource.id} label={resource.name} compact/><p><strong>{resource.name}</strong> · {resource.description}<br/>Work with {IMPROVEMENTS.find(item => item.id === resource.improvementId)?.name} to gather {resource.extraction} / turn.</p></div>}
      {cell && riverSize(cell.hydrology ?? 0) > 0 && <p>River · {['', 'headwater', 'tributary', 'main river'][riverSize(cell.hydrology ?? 0)]}</p>}
      {Boolean(cell?.roadMask) && <p>Completed road connections · {Array.from({ length: 6 }, (_, bit) => Boolean((cell?.roadMask ?? 0) & (1 << bit))).filter(Boolean).length} known directions</p>}
      {occupants.length > 0 && <section aria-label="Spectator map occupants"><h3>Map occupants</h3><ul>{occupants.slice(0, 12).map(entity => <li key={entity.id}>{entity.name} · {entity.kind}{entity.faction && ` · ${entity.faction}`}</li>)}</ul>{occupants.length > 12 && <p>{occupants.length - 12} more map occupants share this hex.</p>}<p>Map identities only. Private rosters, officer missions and orders are not revealed.</p></section>}
    </div>}
    {cell?.settlementId && <p className="field-help" data-testid="land-ownership">{cell.visible ? 'Claimed land' : 'Last known claim'} · {view.factions.find(item => item.id === cell.factionId)?.name ?? 'Unidentified realm'} · {view.settlements.find(item => item.id === cell.settlementId)?.name ?? 'Previously observed settlement'}{cell.improvementId ? ` · ${cell.improvementId.replace('improvement.', '').replaceAll('_', ' ')}` : ''}</p>}
  </>;
  const sidebar: ReactNode = <>
    {view.pendingCapture ? <><h2>A settlement awaits</h2><p className="field-help">Choose its fate in the capture panel before issuing campaign orders.</p></>
      : view.battle ? <><h2>Battle in progress</h2><p className="field-help">Current strength, morale, and fatigue are shown in the battle panel. Resolve the engagement before issuing campaign orders.</p></>
      : army ? <>{summary}{armyOfficers}{transport}{founding}{routes}{composition}
        <h3 className="section-title">Single-step shortcuts</h3><p className="field-help">Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above.</p>
        <div className="nearby-cells">{neighbors(army.cell, view.width, view.height).map(target => { const known = renderer?.inspect(target); return <button key={target} disabled={busy || Boolean(army.movementBlocker)} aria-label={`Move to cell ${target}`} onClick={() => issue({ type: 'move', factionId, armyId: army.id, target })}><span>{known?.waterDepth ? WATER_DEPTH_NAMES[known.waterDepth] : terrainNames[known?.terrain ?? -1] ?? 'Unknown'}</span><small>Hex {target}</small></button>; })}</div>
      </> : settlement ? <>{summary}{production}{land()}{defense}{officers}</> : <><h2>The frontier awaits</h2><p>Select an army or settlement from the map or your realm registry to issue orders.</p></>}
    {combat}{location}
  </>;
  return { summary, founding, routes, composition, transport, combat, production, land, officers, defense, location, sidebar };
}
