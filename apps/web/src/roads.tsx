import type { GameCommand, Observation } from '@theandril/sim';

export function SettlementRoad({ view, settlementId, busy, issue, selectCell }: { view: Observation; settlementId: string; busy: boolean; issue: (command: GameCommand) => void; selectCell: (cell: number) => void }) {
  const road = view.roads?.find(item => item.settlementId === settlementId);
  return <details className="land-options" data-testid="settlement-road"><summary>Road connections{road ? ` · ${road.completed}/${road.length}` : ''}</summary>
    <p className="field-help">Settlements gradually connect to an older town along a charted land route. Workers survey one town per realm each turn. Completed roads cross forest and hills for 1 movement point and remain after conquest.</p>
    {!road ? <p>Explore toward another owned settlement to establish a connection. Water and mountains require another route.</p> : <>
      <p><strong>To {road.targetName}</strong> · {road.completed} / {road.length} segments built</p>
      <progress aria-label="Completed road segments" value={road.completed} max={road.length}/>
      {road.nextCell !== null && <><p>{road.nextSegmentBuilt ? 'Next segment: existing road. Workers continue along it for free on their next active turn.' : `Next segment: ${road.progress}/${road.required} work. About ${road.required - road.progress} active turns.`}</p><button type="button" onClick={() => selectCell(road.nextCell!)}>Show road work front · hex {road.nextCell}</button>
        {!road.nextSegmentBuilt && <><button type="button" disabled={busy || !road.canAccelerate} onClick={() => issue({ type: 'accelerateRoad', factionId: view.factionId, settlementId })}>Hasten road · {road.coinCost} crowns</button><p className="field-help">Crowns are treasury coin, not a separate resource. This payment finishes one segment, not the entire route.</p></>}</>}
      {road.blocker && <p className="field-help">{road.blocker}</p>}
      <p className="field-help">Keep the work front in sight. Siege, occupation, foreign claims and foreign armies pause construction.</p>
    </>}
  </details>;
}
