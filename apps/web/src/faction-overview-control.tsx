import { useState } from 'react';
import type { MapObservation } from '@theandril/sim';
import type { WorldOverviewMode } from '@theandril/render';
import './faction-overview-control.css';

export interface FactionOverviewControlProps {
  factions: MapObservation['factions'];
  hidden?: boolean;
  onChange: (mode: WorldOverviewMode, factionIds?: readonly string[]) => void;
  onFit: () => void;
}
/** Presentation settings only. Supply the permitted player/spectator map's
 * factions; this control has no worker or game-command capability. */
export function FactionOverviewControl({ factions, hidden, onChange, onFit }: FactionOverviewControlProps) {
  const [mode, setMode] = useState<WorldOverviewMode>('terrain');
  const [selected, setSelected] = useState<readonly string[] | undefined>();
  const permitted = selected?.filter(id => factions.some(faction => faction.id === id));
  const chooseMode = (next: WorldOverviewMode) => { setMode(next); onChange(next, permitted); onFit(); };
  const chooseFactions = (next: readonly string[] | undefined) => { setSelected(next); onChange(mode, next); };
  return <details hidden={hidden} className="faction-overview-control" data-testid="faction-overview-control">
    <summary>World map · {mode === 'political' ? 'Realms' : 'Terrain'}</summary>
    <div className="overview-controls">
      <div role="group" aria-label="World map style"><button type="button" aria-pressed={mode === 'terrain'} onClick={() => chooseMode('terrain')}>Terrain</button><button type="button" aria-pressed={mode === 'political'} onClick={() => chooseMode('political')}>Realms</button></div>
      <p>Realm colors show known territory. Dim claims show remembered ownership; unexplored land stays hidden.</p>
      {mode === 'political' && <>
        <div className="overview-filter-actions"><button type="button" onClick={() => chooseFactions(undefined)}>All known realms</button><button type="button" onClick={() => chooseFactions([])}>Clear realms</button></div>
        <fieldset><legend>Visible realm colors</legend>{factions.map(faction => {
          const checked = !permitted || permitted.includes(faction.id);
          return <label key={faction.id}><input type="checkbox" checked={checked} onChange={() => {
            const current = permitted ?? factions.map(item => item.id);
            chooseFactions(checked ? current.filter(id => id !== faction.id) : [...current, faction.id]);
          }}/><span className="overview-faction-swatch" style={{ backgroundColor: `#${faction.color.toString(16).padStart(6, '0')}` }} aria-hidden="true"/><span>{faction.name}</span></label>;
        })}</fieldset>
      </>}
      <button type="button" onClick={onFit}>Fit world map</button>
    </div>
  </details>;
}
