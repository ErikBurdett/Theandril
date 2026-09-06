import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import type { GameCommand, MovementPreview, MovementQuery, Observation } from '@theandril/sim';
import type { MapPointerInput, WorldRenderer } from '@theandril/render';

export type MapSelection = { armyId?: string; settlementId?: string; cell?: number };
export type MovementReview = (armyId: string, target?: number, append?: boolean) => Promise<MovementQuery>;
interface Context {
  view?: Observation; selection: MapSelection; hash: string; locked: boolean;
  renderer: RefObject<WorldRenderer | undefined>; select: (selection: MapSelection, focus?: boolean) => void;
  issue: (command: GameCommand) => void; query: MovementReview;
}

/** Input orchestration only. Every path, cost and action comes from the worker. */
export function useMapMovement(context: Context) {
  const latest = useRef(context); latest.current = context;
  const requestEpoch = useRef(0);
  const hoverEpoch = useRef(0);
  const clickEpoch = useRef(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [reachable, setReachable] = useState<MovementQuery['reachable']>([]);
  const [candidate, setCandidate] = useState<MovementPreview>();
  const candidateRef = useRef<MovementPreview | undefined>(undefined);
  const hovered = useRef<MovementPreview | undefined>(undefined);
  const hoverListeners = useRef(new Set<() => void>());
  const setHovered = (value: MovementPreview | undefined) => { hovered.current = value; for (const listener of hoverListeners.current) listener(); };
  const [destination, setDestination] = useState('');
  const [append, setAppend] = useState(false);
  const appendRef = useRef(false);
  const [planning, setPlanning] = useState(false);
  const [notice, setNotice] = useState('Select a destination on the map to issue an order.');
  const army = context.view?.armies.find(item => item.id === context.selection.armyId && item.factionId === context.view?.factionId);
  const route = context.view?.routes.find(item => item.armyId === army?.id);
  const canAct = Boolean(army && !army.carrierId && context.view && !context.locked);
  const showPreview = (preview?: MovementPreview) => {
    const current = latest.current;
    const own = current.view?.armies.find(item => item.id === current.selection.armyId);
    current.renderer.current?.setPreview(own && preview && preview.path.length ? { origin: own.cell, path: preview.path, attack: preview.action === 'attack' } : undefined);
  };
  const remember = (preview: MovementPreview | undefined) => { candidateRef.current = preview; setCandidate(preview); showPreview(preview); };
  const sameContext = (start: Context) => latest.current.hash === start.hash && latest.current.selection.armyId === start.selection.armyId && !latest.current.locked;

  useEffect(() => {
    const epoch = ++requestEpoch.current; ++clickEpoch.current; ++hoverEpoch.current;
    clearTimeout(hoverTimer.current); setReachable([]); setHovered(undefined); setPlanning(false); remember(undefined);
    context.renderer.current?.setMovementRange([]);
    context.renderer.current?.resetHover();
    if (!army || context.locked || !context.view) return;
    setNotice(army.movementBlocker ?? (army.movement ? 'Choose a highlighted hex to move; hover to preview the known route.' : 'No movement remains. Queue a future route or end the turn.'));
    context.query(army.id).then(result => {
      if (epoch !== requestEpoch.current) return;
      setReachable(result.reachable); context.renderer.current?.setMovementRange(result.reachable);
      if (result.limited) setNotice('The movement query reached its search limit. Review a nearer destination.');
    }).catch(error => { if (epoch === requestEpoch.current) setNotice(error instanceof Error ? error.message : String(error)); });
    return () => { ++requestEpoch.current; ++clickEpoch.current; ++hoverEpoch.current; clearTimeout(hoverTimer.current); };
  }, [army?.id, context.hash, context.locked]);

  useEffect(() => {
    context.renderer.current?.setRoute(army && route ? { origin: route.origin, path: route.path, waypoints: route.waypoints, paused: route.status === 'paused' } : undefined);
  }, [army?.id, context.hash, route]);

  const hover = (cell: number | undefined) => {
    clearTimeout(hoverTimer.current); const epoch = ++hoverEpoch.current;
    const start = latest.current;
    if (cell === undefined || !start.selection.armyId || start.locked) { setHovered(undefined); showPreview(candidateRef.current); return; }
    hoverTimer.current = setTimeout(() => {
      start.query(start.selection.armyId!, cell, appendRef.current).then(result => {
        if (epoch !== hoverEpoch.current || !sameContext(start)) return;
        setHovered(result.preview ?? undefined); showPreview(result.preview ?? undefined);
      }).catch(() => { if (epoch === hoverEpoch.current) { setHovered(undefined); showPreview(candidateRef.current); } });
    }, 80);
  };

  const reviewTarget = async (target: number, execute: boolean, shouldAppend: boolean) => {
    const start = latest.current, epoch = ++clickEpoch.current;
    if (!start.view || !start.selection.armyId || start.locked) return;
    clearTimeout(hoverTimer.current); ++hoverEpoch.current; setHovered(undefined);
    setDestination(String(target)); setPlanning(true);
    try {
      const result = await start.query(start.selection.armyId, target, shouldAppend);
      if (epoch !== clickEpoch.current || !sameContext(start)) return;
      const preview = result.preview ?? undefined; remember(preview);
      if (!preview) { setNotice('No route preview is available for this destination.'); return; }
      start.select({ ...start.selection, cell: target });
      if (execute && shouldAppend && preview.canQueue) {
        start.issue({ type: 'queueMovement', factionId: start.view.factionId, armyId: start.selection.armyId, target, append: true });
      } else if (execute && !shouldAppend && preview.canMoveNow && (preview.action === 'move' || preview.action === 'attack')) {
        start.issue({ type: 'moveTo', factionId: start.view.factionId, armyId: start.selection.armyId, target });
      } else setNotice(preview.blocker ?? (preview.canQueue ? 'This route continues over future turns. Choose Queue route to commit it.' : 'Review the destination before issuing an order.'));
    } catch (error) { if (epoch === clickEpoch.current) setNotice(error instanceof Error ? error.message : String(error)); }
    finally { if (epoch === clickEpoch.current) setPlanning(false); }
  };

  const click = (cell: number, input: MapPointerInput) => {
    const current = latest.current, view = current.view;
    if (!view) return;
    const shouldAppend = input.shiftKey || appendRef.current;
    const friends = view.armies.filter(item => item.cell === cell && !item.carrierId && item.factionId === view.factionId).sort((a, b) => a.id < b.id ? -1 : 1);
    if (friends.length && !(shouldAppend && current.selection.armyId && !current.locked)) {
      const index = friends.findIndex(item => item.id === current.selection.armyId);
      current.select({ armyId: friends[(index + 1) % friends.length]!.id, cell }); return;
    }
    if (!current.selection.armyId) {
      const town = view.settlements.find(item => item.cell === cell && item.factionId === view.factionId);
      current.select(town ? { settlementId: town.id, cell } : { cell }); return;
    }
    if (current.locked) { current.select({ ...current.selection, cell }); setNotice('Map orders are unavailable while the campaign is resolving, paused for a decision, AI-controlled, or complete.'); return; }
    void reviewTarget(cell, true, shouldAppend);
  };

  const setAppendMode = (value: boolean) => {
    appendRef.current = value; setAppend(value); ++clickEpoch.current; ++hoverEpoch.current;
    clearTimeout(hoverTimer.current); setHovered(undefined); remember(undefined); setPlanning(false);
  };
  const clear = () => {
    ++clickEpoch.current; ++hoverEpoch.current; clearTimeout(hoverTimer.current);
    setAppendMode(false); setReachable([]); latest.current.renderer.current?.setMovementRange([]);
    remember(undefined); latest.current.select({});
  };
  const issueCandidate = (queued: boolean) => {
    const current = latest.current, preview = candidateRef.current;
    if (!preview || !current.view || !current.selection.armyId || current.locked || planning) return;
    current.issue(queued ? { type: 'queueMovement', factionId: current.view.factionId, armyId: current.selection.armyId, target: preview.target, append: appendRef.current } : { type: 'moveTo', factionId: current.view.factionId, armyId: current.selection.armyId, target: preview.target });
  };
  const editDestination = (value: string) => { setDestination(value); ++clickEpoch.current; ++hoverEpoch.current; clearTimeout(hoverTimer.current); setHovered(undefined); remember(undefined); setPlanning(false); };
  return { army, route, canAct, reachable, candidate, getHover: () => hovered.current, subscribeHover: (listener: () => void) => { hoverListeners.current.add(listener); return () => { hoverListeners.current.delete(listener); }; }, destination, setDestination: editDestination, append, setAppendMode, planning, notice, click, hover, clear, reviewTarget, issueCandidate };
}

export type MapMovement = ReturnType<typeof useMapMovement>;

export function MovementOrders({ movement, view, issue, locate }: { movement: MapMovement; view: Observation; issue: (command: GameCommand) => void; locate: (cell: number) => void }) {
  const { army, route, candidate, planning, canAct } = movement;
  const hovered = useSyncExternalStore(movement.subscribeHover, movement.getHover);
  const routeActions = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (candidate?.canQueue && !candidate.canMoveNow) {
      routeActions.current?.focus({ preventScroll: true });
      routeActions.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [candidate]);
  if (!army) return null;
  const preview = hovered ?? candidate;
  return <section className="map-orders" data-testid="map-orders" aria-label="Map movement orders">
    <h3 className="section-title">{army.domain === 'naval' ? 'Routes & sailing orders' : 'Paths & marching orders'}</h3>
    {army.carrierId && <p className="character-blocker">This army is embarked. Select its carrying fleet to sail, or choose an eligible shore in the transport panel to disembark.</p>}
    {route && <section className="queued-route" data-testid="queued-route" aria-label="Queued route"><h4>{route.status === 'paused' ? 'Route interrupted' : 'Route active'}</h4>{route.pauseReason && <p role="status">{route.pauseReason}</p>}<div className="route-actions"><button className="wide" disabled={!canAct || route.status !== 'paused'} onClick={() => issue({ type: 'resumeMovement', factionId: view.factionId, armyId: army.id })}>Resume route</button><button className="wide" disabled={!canAct} onClick={() => issue({ type: 'cancelMovement', factionId: view.factionId, armyId: army.id })}>Cancel route</button></div><p>{route.path.length} known steps remaining. New hostile sightings or blocked passages can interrupt travel; queued routes never declare war or attack automatically.</p><ol>{route.waypoints.map((cell, index) => <li key={index}><button aria-label={`Focus waypoint ${index + 1} at hex ${cell}`} onClick={() => locate(cell)}>Waypoint {index + 1} · hex {cell}</button></li>)}</ol></section>}
    <p className="field-help" data-testid="movement-range">{movement.reachable.length} highlighted destinations within current movement. Click a reachable hex to move, or a reachable hostile army to attack. Dragging only pans.</p>
    <label className="waypoint-toggle"><input type="checkbox" checked={movement.append} disabled={!canAct || planning} onChange={event => movement.setAppendMode(event.target.checked)}/>Add waypoint mode</label>
    <p className="field-help">{movement.append ? 'Map clicks and taps add queued waypoints. Paused routes stay paused until you resume them.' : 'Shift-click adds a waypoint. For longer journeys, review a target and queue its route. Escape clears selection.'}</p>
    <form className="route-form" onSubmit={event => { event.preventDefault(); const target = Number(movement.destination); if (Number.isInteger(target)) void movement.reviewTarget(target, false, movement.append); }}>
      <label>Destination hex<input type="number" min="0" max={view.width * view.height - 1} step="1" required value={movement.destination} onChange={event => movement.setDestination(event.target.value)}/></label>
      <button className="wide" type="submit" disabled={!canAct || planning}>Review route</button>
    </form>
    <p className="field-help route-notice" role="status">{planning ? 'Reviewing the known route…' : movement.notice}</p>
    {preview && <div className="route-preview" data-testid="route-preview"><strong>{preview.action === 'attack' ? army.domain === 'naval' ? 'Naval attack' : 'Field attack' : preview.action === 'besiege' ? 'Settlement defenses' : preview.action === 'blocked' ? 'Route unavailable' : army.domain === 'naval' ? 'Voyage' : 'March'} · hex {preview.target}</strong><p>{preview.path.length} steps · {preview.cost} movement</p>{preview.blocker && <p>{preview.blocker}</p>}{preview.limited && <p>Search limit reached. Choose a nearer waypoint.</p>}</div>}
    {candidate && <div className="route-actions" ref={routeActions} tabIndex={-1} role="group" aria-label={`Reviewed destination ${candidate.target}`}><p className="field-help">Orders below target hex {candidate.target}.</p><button className={candidate.action === 'attack' ? 'danger wide' : 'wide'} disabled={!canAct || planning || !candidate.canMoveNow || movement.append} onClick={() => movement.issueCandidate(false)}>{candidate.action === 'attack' ? 'Attack now' : 'Move now'}</button><button className="primary wide" disabled={!canAct || planning || !candidate.canQueue} onClick={() => movement.issueCandidate(true)}>{movement.append ? 'Add waypoint' : 'Queue route'}</button></div>}
  </section>;
}

/** Hover changes update just this hint and the order inspector, not empire registries. */
export function MovementMapHint({ movement }: { movement: MapMovement }) {
  const hovered = useSyncExternalStore(movement.subscribeHover, movement.getHover);
  const preview = hovered ?? movement.candidate;
  if (!movement.army) return <div className="map-order-hint">Select an army to show its movement range.</div>;
  return <div className="map-order-hint" data-testid="map-route-preview">{preview ? <><strong>{preview.action === 'attack' ? 'Attack' : preview.action === 'besiege' ? 'Siege required' : preview.action === 'blocked' ? 'Blocked' : 'Route'} · hex {preview.target}</strong><span>{preview.cost} movement · {preview.path.length} steps{preview.canMoveNow ? ' · available now' : preview.canQueue ? ' · can queue' : ''}</span></> : <><strong>{movement.army.name}</strong><span>{movement.canAct ? movement.army.movement ? 'Click a highlighted hex to move. Hover to preview.' : 'No movement remains. End the turn to refresh movement.' : 'Campaign orders are currently unavailable.'}</span></>}</div>;
}
