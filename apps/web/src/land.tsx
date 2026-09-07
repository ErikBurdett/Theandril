import { useState } from 'react';
import { FACTIONS, FACTION_ECOLOGIES, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, IMPROVEMENTS, NATURAL_FEATURES, UNITS, type LandYield } from '@theandril/content';
import { BIOME_NAMES } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import { useLandQuery, type LandQuery } from './use-land-query';

const yields = ['food', 'industry', 'coin', 'knowledge'] as const;
export function yieldText(value: LandYield): string {
  return yields.filter(key => value[key] !== 0).map(key => `${value[key] > 0 ? '+' : '−'}${Math.abs(value[key])} ${key}`).join(', ') || 'No change';
}

export function FactionSelection({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const faction = FACTIONS.find(item => item.id === value) ?? FACTIONS[0]!;
  return <section className="faction-choice" aria-label="Player culture">
    <label>Player faction<select value={faction.id} onChange={event => onChange(event.target.value)}>{FACTIONS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <p>{faction.motto}</p>
    <FactionIdentity definitionId={faction.id}/>
  </section>;
}

/** Public definitions describe culture, never another realm's hidden state. */
function FactionIdentity({ definitionId }: { definitionId: string }) {
  const profile = FACTION_PROFILES[definitionId], ecology = FACTION_ECOLOGIES[definitionId], weights = FACTION_RECRUITMENT_WEIGHTS[definitionId];
  if (!profile || !ecology || !weights) return null;
  return <div className="faction-identity" data-testid="faction-identity" data-definition-id={definitionId}>
    <p className="faction-profile">{profile.description}</p>
    <p className="field-help"><strong>Worked-land strengths & drawbacks</strong></p>
    <ul className="affinity-list" aria-label="Biome affinities">{ecology.affinities.map(affinity => <li key={affinity.biomeId}><strong>{BIOME_NAMES[affinity.biomeId]}</strong>: {yieldText(affinity.yields)} per worked tile</li>)}</ul>
    <p className="field-help">Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.</p>
    <p className="field-help">Cultivation traditions: {ecology.terraformBiomeIds.map(id => BIOME_NAMES[id]).join(', ')}. Cultivation is paid work, not free conversion.</p>
    <details className="faction-recruitment"><summary>Recruitment tendencies</summary><p>{profile.recruitmentRationale}</p><p className="field-help">Current rules: these are relative AI preferences, not recruitment restrictions or cost bonuses.</p><ul aria-label="AI land recruitment preferences">{Object.entries(weights).map(([unitId, weight]) => <li key={unitId}><span>{UNITS.find(unit => unit.id === unitId)?.name ?? unitId}</span><span>weight {weight}</span></li>)}</ul></details>
  </div>;
}

type LandTown = Observation['land']['settlements'][number];
type Props = { view: Observation; settlementId: string; selectedCell?: number; busy: boolean; selectCell: (cell: number) => void; issue: (command: GameCommand) => void; query?: LandQuery; stateHash?: string; queryEpoch?: number; queryEnabled?: boolean };

/** All legal options, prices, timing and yield arithmetic come from the worker. */
export function SettlementLand({ view, settlementId, selectedCell, busy, selectCell, issue, query, stateHash = '', queryEpoch = 0, queryEnabled = true }: Props) {
  const [showTiles, setShowTiles] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [showCultivation, setShowCultivation] = useState(false);
  const details = useLandQuery({ settlementId, hash: stateHash, epoch: queryEpoch, query, enabled: queryEnabled });
  const summary = view.land.settlements.find(item => item.settlementId === settlementId);
  // Static detail props are only for headless component consumers. The live app
  // always supplies a worker query; its normal observation contains no tile quotes.
  const ready = !query || (details.status === 'ready' && details.town !== null);
  const town = query ? details.town ?? summary : summary;
  const settlement = view.settlements.find(item => item.id === settlementId);
  const realm = view.factions.find(item => item.id === view.factionId);
  if (!town || !settlement) return null;
  const cell = ready ? town.cells.find(item => item.cell === selectedCell) : undefined;
  const workerFull = town.worked.length >= town.workerCapacity;
  const locked = busy || !ready;
  const act = (command: GameCommand) => { if (!locked) issue(command); };
  return <section className="land-panel" data-testid="land-panel" data-settlement-id={settlementId} data-query-state={query ? details.status : 'ready'} data-query-hash={ready ? stateHash : undefined} aria-label="Settlement territory" aria-busy={!ready && details.status === 'loading'}>
    <h3>Land & stewardship</h3>
    <p className="land-stage" data-testid="settlement-stage">{town.stage}{town.isCapital ? ' · Capital' : ''}</p>
    <p className="field-help">Colony: 1–2 people · Settlement: 3–7 · City: 8+. Capital is a separate designation.</p>
    <p data-testid="land-counts">{town.claimed.length} / {town.claimCapacity} claimed tiles · {town.worked.length} / {town.workerCapacity} assigned workers · reach {town.claimRadius}</p>
    <section className="border-growth" aria-label="Border growth" data-testid="border-growth">
      <p><strong>Border growth:</strong> {town.borderExpansion.progress} / {town.borderExpansion.threshold} civic progress · +{town.borderExpansion.rate} per active turn</p>
      <progress aria-label="Civic progress toward next border" value={town.borderExpansion.progress} max={town.borderExpansion.threshold}/>
      {town.borderExpansion.blocker ? <p className="field-help">{town.borderExpansion.blocker}</p> : <p className="field-help">Next expansion: hex {town.borderExpansion.nextCell}. About {Math.ceil((town.borderExpansion.threshold - town.borderExpansion.progress) / Math.max(1, town.borderExpansion.rate))} active turns at this rate. Larger populations, markets, archives and Surveyed estates support growth.</p>}
      <p className="field-help">Expansion claims one connected, charted tile at a time. It does not assign workers or build improvements. Siege and occupation pause growth; conquest resets its progress. Buying a tile is immediate and increases the next expansion threshold.</p>
    </section>
    <p className="field-help">The center is worked for free. Borders do not block travel. Only worked tiles contribute their yields; natural features remain after cultivation.</p>
    <p className="field-help">Map borders: thick lines mark realm boundaries; thin lines separate settlements within a realm. Dim land shows remembered ownership, not live information beyond sight.</p>
    <p><strong>Land yields:</strong> {yieldText(town.yields)}</p>
    <p className="field-help">Includes the center, assigned tiles and any capital bonus; buildings and other economy effects are separate.</p>
    {realm && <details className="realm-culture" data-testid="realm-culture"><summary>Culture & economy · {realm.name}</summary><FactionIdentity definitionId={realm.definitionId}/></details>}
    {!town.isCapital && <><button disabled={locked || !town.capitalOption.canStart} onClick={() => act({ type: 'setCapital', factionId: view.factionId, settlementId })}>Designate capital · {town.capitalOption.coinCost} coin</button><p className="field-help">{town.capitalOption.blocker ?? town.capitalOption.effectText}</p></>}
    {town.work && <ActiveLandWork town={town} busy={locked} cancel={() => act({ type: 'cancelLandWork', factionId: view.factionId, settlementId })}/>}
    {!ready && <div data-testid="land-query-status">{details.status === 'error' ? <p role="alert">Land details could not be loaded: {details.error}</p> : details.status === 'ready' ? <p role="status">This settlement’s land details are no longer available. Select an owned settlement or retry.</p> : <p role="status">Loading current land details… Tile quotes and land orders are unavailable until this review finishes.</p>}{(details.status === 'error' || details.status === 'ready') && <button type="button" disabled={busy || !queryEnabled} onClick={details.retry}>Retry land details</button>}</div>}
    <p className="field-help">Select a tile on the map to inspect this settlement’s land. Army movement is off while a settlement is selected.</p>
    <button type="button" disabled={!ready} aria-expanded={showTiles} onClick={() => setShowTiles(!showTiles)}>Select tiles</button>
    {ready && showTiles && <div className="land-tile-list" aria-label="Known territory tiles">{town.cells.map(tile => <button type="button" key={tile.cell} aria-pressed={tile.cell === selectedCell} onClick={() => selectCell(tile.cell)} aria-label={`Inspect land hex ${tile.cell}`}><strong>Hex {tile.cell}</strong><small>{BIOME_NAMES[tile.biome]} · {tile.claimed ? tile.worked ? 'Worked' : 'Owned' : tile.factionId ? 'Foreign' : 'Unclaimed'}</small></button>)}</div>}
    {!ready ? null : !cell ? <p role="status" className="field-help">{selectedCell === undefined ? 'Select a known tile to review its exact options.' : `Hex ${selectedCell} is outside this settlement’s known land options. Use Select tiles to choose a permitted location.`}</p> : <section className="land-cell" data-testid="land-cell" aria-label={`Land hex ${cell.cell}`}>
      <h4>Hex {cell.cell} · {BIOME_NAMES[cell.biome]}</h4>
      <p>{cell.cell === settlement.cell ? 'Settlement center · automatically worked' : cell.claimed ? cell.worked ? 'Owned · worker assigned' : 'Owned · not worked' : cell.factionId ? `Claimed by ${view.factions.find(item => item.id === cell.factionId)?.name ?? 'another realm'}` : 'Unclaimed land'}</p>
      <p><strong>Natural features:</strong> {cell.features === 0 ? 'None' : ''}</p>
      {cell.features !== 0 && <ul className="land-features">{NATURAL_FEATURES.filter(feature => (cell.features & feature.feature) !== 0).map(feature => <li key={feature.id}><strong>{feature.name}</strong> · {yieldText(feature.yields)}<small>{feature.description}</small></li>)}</ul>}
      <table className="land-yields"><caption>Yield breakdown per worked turn</caption><thead><tr><th scope="col">Source</th><th scope="col">Contribution</th></tr></thead><tbody>{([['Biome', cell.yields.biome], ['Features', cell.yields.features], ['Faction affinity', cell.yields.affinity], ['Improvement', cell.yields.improvement], ['Feature interactions', cell.yields.featureModifiers], ['Final tile yield', cell.yields.total]] as const).map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{yieldText(value)}</td></tr>)}</tbody></table>
      {cell.cell !== settlement.cell && cell.claimed && <><button disabled={busy || !cell.canWork || (!cell.worked && workerFull)} onClick={() => act({ type: 'setWorkedTiles', factionId: view.factionId, settlementId, cells: cell.worked ? town.worked.filter(id => id !== cell.cell) : [...town.worked, cell.cell].sort((a, b) => a - b) })}>{cell.worked ? 'Remove worker' : 'Assign worker'}</button>{(cell.workBlocker || (!cell.worked && workerFull)) && <p className="land-blocker">{cell.workBlocker ?? 'All workers are assigned. Remove a worker from another tile first.'}</p>}</>}
      {!cell.claimed && <><button disabled={busy || !cell.claim.canStart} onClick={() => act({ type: 'claimCell', factionId: view.factionId, settlementId, cell: cell.cell })}>Claim hex {cell.cell} · {cell.claim.coinCost} coin</button><p className="field-help">{cell.claim.blocker ?? cell.claim.effectText}</p></>}
      {cell.improvementId && <p><strong>Improvement:</strong> {IMPROVEMENTS.find(item => item.id === cell.improvementId)?.name ?? cell.improvementId}</p>}
      <p className="field-help">Construction replaces any existing improvement only on completion. Its benefits require an assigned worker; cancelling unfinished work does not refund its cost.</p>
      <details className="land-options" open={showImprovements} onToggle={event => setShowImprovements(event.currentTarget.open)}><summary>Tile improvements</summary>{cell.improvementOptions.map(option => <div className="land-option" key={option.improvementId}><button disabled={busy || !option.canStart} onClick={() => act({ type: 'improveTile', factionId: view.factionId, settlementId, cell: cell.cell, improvementId: option.improvementId })}>Build {option.name}</button><p>{option.coinCost} coin upfront · {option.turns} turns</p><p className="field-help">{option.effectText}</p>{option.blocker && <p className="land-blocker">{option.blocker}</p>}</div>)}</details>
      <details className="land-options" open={showCultivation} onToggle={event => setShowCultivation(event.currentTarget.open)}><summary>Cultivate biome</summary><p className="field-help">Paid, persistent biome work. Physical hills, mountains, water and natural features do not change. Conquest cancels unfinished work without a refund.</p>{cell.terraformOptions.map(option => <div className="land-option" key={option.biome}><button disabled={busy || !option.canStart} onClick={() => act({ type: 'terraformTile', factionId: view.factionId, settlementId, cell: cell.cell, biome: option.biome })}>Cultivate {option.name}</button><p>{option.coinCost} coin upfront · {option.turns} turns</p><p className="field-help">{option.effectText}</p>{option.blocker && <p className="land-blocker">{option.blocker}</p>}</div>)}</details>
    </section>}
  </section>;
}

function ActiveLandWork({ town, busy, cancel }: { town: LandTown; busy: boolean; cancel: () => void }) {
  const work = town.work!;
  const name = work.kind === 'terraform' ? `Cultivate ${BIOME_NAMES[work.biome]}` : IMPROVEMENTS.find(item => item.id === work.improvementId)?.name ?? work.improvementId;
  return <section className="land-work" data-testid="land-work" aria-label="Active land work"><strong>{name} · hex {work.cell}</strong><p>{work.turns - work.remainingTurns} / {work.turns} turns completed · {work.coinCost} coin paid</p>{town.workPaused && <p className="land-blocker">Paused: {town.workPaused}</p>}<button disabled={busy || !town.canCancelWork} onClick={cancel}>Cancel land work · no refund</button>{town.cancelBlocker && <p className="land-blocker">{town.cancelBlocker}</p>}</section>;
}
