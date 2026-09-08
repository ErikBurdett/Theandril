import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { CAMPAIGN_PACES, FACTIONS } from '@theandril/content';
import { RECOMMENDED_FACTION_COUNTS, type MapLayout, type MapSize } from '@theandril/mapgen';
import type { CampaignPace, GameCommand, MovementQuery, Observation, PeaceAssessment, PeaceTerms } from '@theandril/sim';
import { WorldRenderer, type ArtStatus, type MapPointerInput, type BattleSceneView } from '@theandril/render';
import { MovementMapHint, useMapMovement, type MapMovement, type MovementReview } from './movement';
import type { CampaignInfo, Request, Response, WorkerMetrics } from './protocol';
import type { CampaignMode, ChronicleDocuments } from '@theandril/chronicle';
import { CampaignChronicles } from './chronicles';
import { CampaignProgression, PublicProjects } from './progression';
import { BattleHistory } from './warfare';
import { BattlefieldPanel } from './battle';
import type { BattleTransfer } from './battle-transfer';
import { RealmRoster, RealmJournal } from './realm-windows';
import { MapActions, type MapActionTab } from './map-actions';
import { getMapActionChoices } from './map-action-context';
import { managementPanes } from './map-management';
import { CampaignWindow, HudIcon } from './campaign-window';
import { CharacterRegistry } from './characters';
import { FactionEncounters } from './diplomacy';
import { FactionArt, PublicCultures } from './faction-art';
import { publicAssetUrl } from './asset-url';
import { FactionSelection } from './land';
import type { LandQuery, LandQueryResult } from './use-land-query';
import { unpackCells } from './cell-transfer';
import { WatchFogRequests, type WatchFogApi } from './watch-fog';
import { actionCandidates, actionShortcut, loadShortcuts, nextAction, saveShortcuts, shortcutError, SHORTCUT_STORAGE_KEY, type ActionKind, type Direction, type ShortcutBindings } from './next-action';
import { CapturePanel, SiegeLedger } from './siege';
import './style.css';
import './campaign-records.css';
import './movement.css';
import './art-status.css';
import './land.css';
import './border-growth.css';
import './map-management.css';
import './campaign-hud.css';
import './hearth-theme.css';

type Selection = { armyId?: string; settlementId?: string; cell?: number };
type MapPopup = { cell: number; anchor: { x: number; y: number }; serial: number; choiceId: string; initialTab?: string };
type ManagementWindow = 'registry' | 'orders' | 'affairs' | 'journal' | 'guide';
type RequestBody = Request extends infer R ? R extends Request ? Omit<R, 'id'> : never : never;
const DevelopmentArtLab = import.meta.env.DEV ? lazy(() => import('./art-lab')) : null;

function Crest({ large = false }: { large?: boolean }) {
  return <svg className={large ? 'crest large' : 'crest'} viewBox="0 0 64 76" aria-hidden="true"><path d="M5 5h54v37c0 16-27 28-27 28S5 58 5 42Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M16 49h32M22 44l10-28 10 28M26 35h12M32 16V9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m13 13 5 3-5 3m38-6-5 3 5 3M27 57h10" fill="none" stroke="currentColor"/></svg>;
}

function App() {
  const worker = useRef<Worker | undefined>(undefined);
  const previousWorker = useRef<Worker | undefined>(undefined);
  const renderer = useRef<WorldRenderer | undefined>(undefined);
  const mapHost = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const commandBar = useRef<HTMLElement>(null);
  const campaignOptions = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = campaignOptions.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !campaignOptions.current?.open || document.querySelector('dialog[open]')) return;
      event.preventDefault(); event.stopImmediatePropagation(); campaignOptions.current.open = false;
      campaignOptions.current.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', closeEscape, true);
    return () => { document.removeEventListener('pointerdown', closeOutside, true); document.removeEventListener('keydown', closeEscape, true); };
  }, []);
  useEffect(() => {
    const bar = commandBar.current;
    if (!bar) return;
    const property = '--theandril-command-bar-height';
    const previous = document.documentElement.style.getPropertyValue(property);
    const measure = () => document.documentElement.style.setProperty(property, `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    measure();
    const observer = new ResizeObserver(measure); observer.observe(bar);
    return () => { observer.disconnect(); if (previous) document.documentElement.style.setProperty(property, previous); else document.documentElement.style.removeProperty(property); };
  }, []);
  const sequence = useRef(0);
  const fogRequests = useRef(new WatchFogRequests());
  const [fogEnabled, setFogEnabled] = useState(true);
  const [fogPending, setFogPending] = useState(false);
  const landQuery = useRef<{ id: number; settlementId: string; hash: string; worker: Worker; resolve: (value: LandQueryResult) => void; reject: (error: Error) => void } | undefined>(undefined);
  // Superseded requests retain only their worker/ID until the reply is consumed;
  // a delayed query error must not become a campaign-command error.
  const landRequestWorkers = useRef(new Map<number, Worker>());
  const [landEpoch, setLandEpoch] = useState(0);
  const campaignFault = useRef(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const movementQueries = useRef(new Map<number, { resolve: (value: MovementQuery) => void; reject: (error: Error) => void }>());
  const movementRef = useRef<MapMovement | undefined>(undefined);
  const peaceQueries = useRef(new Map<number, { resolve: (value: PeaceAssessment) => void; reject: (error: Error) => void }>());
  const observationRef = useRef<Observation | undefined>(undefined);
  const selectionRef = useRef<Selection>({});
  const selectionRevision = useRef(0);
  const pendingFound = useRef<{ requestId: number; armyId: string; cell: number; selectionRevision: number } | undefined>(undefined);
  const hash = useRef('');
  const metrics = useRef<WorkerMetrics>({ generationMs: 0, commandMs: 0, aiMs: 0, transferBytes: 0, totalTransferBytes: 0, cellTransferBytes: 0, landQueryCount: 0, landQueryBytes: 0, totalLandQueryBytes: 0 });
  const [observation, setObservation] = useState<Observation>();
  const [battleTransfer, setBattleTransfer] = useState<BattleTransfer>();
  const [battleReview, setBattleReview] = useState(false);
  const setBattleScene = useCallback((scene: BattleSceneView | undefined) => renderer.current?.setBattle(scene), []);
  const [selection, setSelection] = useState<Selection>({});
  const [mapPopup, setMapPopup] = useState<MapPopup>();
  const mapPopupRef = useRef<MapPopup | undefined>(undefined);
  const popupSerial = useRef(0);
  const [mapOnly, setMapOnly] = useState(false);
  const [managementWindow, setManagementWindow] = useState<ManagementWindow>();
  const [mapMenus, setMapMenus] = useState(true);
  const mapMenusRef = useRef(true); mapMenusRef.current = mapMenus;
  const mapDragStart = useRef<{ x: number; y: number } | undefined>(undefined);
  const [seed, setSeed] = useState('748291');
  const [size, setSize] = useState<MapSize>('small');
  const [factionCount, setFactionCount] = useState(String(RECOMMENDED_FACTION_COUNTS.small));
  const [factionDefinitionId, setFactionDefinitionId] = useState('faction.ashen_compact');
  const changeWorldSize = (next: MapSize) => { setSize(next); setFactionCount(String(RECOMMENDED_FACTION_COUNTS[next])); };
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState('A world of broken oaths awaits a new beginning.');
  const [error, setError] = useState(false);
  const [name, setName] = useState('Cinderhearth');
  const [search, setSearch] = useState('');
  const [forceFilter, setForceFilter] = useState('all');
  const [registry, setRegistry] = useState<'armies' | 'settlements'>('armies');
  const [registryEpoch, setRegistryEpoch] = useState(0);
  useEffect(() => {
    if (selection.armyId) setRegistry('armies');
    else if (selection.settlementId) setRegistry('settlements');
  }, [selection.armyId, selection.settlementId]);
  const [textScale, setTextScale] = useState('1');
  const [initialShortcuts] = useState(() => loadShortcuts(() => localStorage.getItem(SHORTCUT_STORAGE_KEY)));
  const [turnKey, setTurnKey] = useState(initialShortcuts.bindings.turn);
  const [armyKey, setArmyKey] = useState(initialShortcuts.bindings.army);
  const [settlementKey, setSettlementKey] = useState(initialShortcuts.bindings.settlement);
  const [bindingError, setBindingError] = useState(initialShortcuts.error);
  const [navigationNotice, setNavigationNotice] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [newMode, setNewMode] = useState<CampaignMode>('player');
  const [pace, setPace] = useState<CampaignPace>('standard');
  const [layout, setLayout] = useState<Exclude<MapLayout, 'legacy'>>('continents');
  const [campaign, setCampaign] = useState<CampaignInfo>({ mode: 'player', coverage: 'complete' });
  const campaignRef = useRef<CampaignInfo>({ mode: 'player', coverage: 'complete' });
  const [watchRunning, setWatchRunning] = useState(false);
  const watchRunningRef = useRef(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [characterContext, setCharacterContext] = useState<{ characterId?: string; armyId?: string }>();
  const mapFocusAfterWindow = useRef(false);
  useEffect(() => {
    if (!mapFocusAfterWindow.current || characterContext || managementWindow) return;
    // Native child/parent dialog cleanup restores its opener first. A Locate
    // action intentionally returns keyboard ownership to the revealed map.
    mapFocusAfterWindow.current = false;
    mapHost.current?.focus({ preventScroll: true });
  }, [characterContext, managementWindow]);
  const [chroniclesOpen, setChroniclesOpen] = useState(false);
  const [artLabOpen, setArtLabOpen] = useState(false);
  const [artStatus, setArtStatus] = useState<ArtStatus>();
  const [documents, setDocuments] = useState<ChronicleDocuments>();
  const documentsRef = useRef<ChronicleDocuments | undefined>(undefined);
  const [chronicleError, setChronicleError] = useState('');
  const chronicleQuery = useRef<number | undefined>(undefined);
  const openedVictory = useRef('');
  const pauseWatch = () => { watchRunningRef.current = false; setWatchRunning(false); };
  const invalidateLandQuery = (message: string, reset = false) => {
    landQuery.current?.reject(new Error(message)); landQuery.current = undefined;
    if (reset) setLandEpoch(value => value + 1);
  };
  const forgetWorkerLandRequests = (instance: Worker | undefined) => {
    for (const [id, source] of landRequestWorkers.current) if (source === instance) landRequestWorkers.current.delete(id);
  };
  const openCharacters = (characterId?: string, armyId?: string) => { pauseWatch(); setCharacterContext({ characterId, armyId }); };
  const openChronicles = () => {
    if (!observationRef.current?.victory || !worker.current) return;
    setChroniclesOpen(true); setChronicleError('');
    if (documentsRef.current || chronicleQuery.current !== undefined) return;
    const id = ++sequence.current; chronicleQuery.current = id;
    worker.current.postMessage({ id, type: 'chronicles' });
  };

  const select = (next: Selection, focus = false) => {
    selectionRevision.current++;
    selectionRef.current = next; setSelection(next);
    renderer.current?.select(next.cell, next.armyId ?? next.settlementId);
    if (focus && next.cell !== undefined) renderer.current?.focus(next.cell);
  };
  const closeMapActions = () => { mapPopupRef.current = undefined; setMapPopup(undefined); };
  const openMapActions = (cell: number, anchor?: { x: number; y: number }, choiceId?: string, initialTab?: string) => {
    const view = observationRef.current;
    if (!view || view.battle || view.pendingCapture || document.querySelector('dialog[open]')) return;
    const choices = getMapActionChoices(view, cell, selectionRef.current.settlementId, renderer.current?.inspect(cell));
    const current = selectionRef.current;
    const passenger = view.armies.find(item => item.id === choiceId && item.factionId === view.factionId && item.carrierId && item.cell === cell);
    const choice = choices.find(item => item.id === choiceId)
      ?? (passenger ? { id: passenger.id, selection: { cell, armyId: passenger.id } } : undefined)
      ?? choices.find(item => item.id === (current.armyId ?? current.settlementId)) ?? choices[0];
    if (!choice) return;
    select(choice.selection);
    const point = anchor ?? renderer.current?.projectCell(cell);
    const box = mapHost.current?.getBoundingClientRect();
    const popup: MapPopup = { cell, anchor: point ?? { x: (box?.left ?? 0) + 40, y: (box?.top ?? 0) + 100 }, serial: ++popupSerial.current, choiceId: choice.id, initialTab };
    mapPopupRef.current = popup; setMapPopup(popup);
  };
  const openPickedActions = (cell: number, input: MapPointerInput, initialTab?: string) => {
    if (mapMenusRef.current) openMapActions(cell, input.anchor, initialTab === 'land' ? `tile.${cell}` : undefined, initialTab);
  };
  const mapSelect = (cell: number, input: MapPointerInput) => {
    const current = selectionRef.current, view = observationRef.current;
    // Cartographic pixels are inspection targets, not precise movement orders.
    // Keep the same cell picking and fog boundary, then focus for local actions.
    if (renderer.current?.getMetrics().overview) { closeMapActions(); select({ cell }); return; }
    if (campaignRef.current.mode === 'watch' && !fogRequests.current.enabled) { select({ cell }); openPickedActions(cell, input); return; }
    // Own claim summaries are authoritative player knowledge. Do not infer an
    // owner from unseen map art or intercept an army's move/attack/waypoint click.
    if (!current.armyId && view) {
      const friendlyArmy = view.armies.some(item => item.cell === cell && !item.carrierId && item.factionId === view.factionId);
      const land = !friendlyArmy ? view.land.settlements.find(town => town.claimed.includes(cell)) : undefined;
      const town = land && view.settlements.find(item => item.id === land.settlementId && item.factionId === view.factionId);
      if (town) { select({ settlementId: town.id, cell }); openPickedActions(cell, input, town.cell === cell ? undefined : 'land'); return; }
      if (friendlyArmy) { movementRef.current?.click(cell, input); openPickedActions(cell, input); return; }
    }
    if (current.settlementId && view?.land.settlements.some(town => town.settlementId === current.settlementId)) {
      const town = view.settlements.find(item => item.cell === cell && item.factionId === view.factionId);
      select({ settlementId: town?.id ?? current.settlementId, cell }); openPickedActions(cell, input, town?.cell === cell ? undefined : 'land'); return;
    }
    const friend = view?.armies.some(item => item.cell === cell && !item.carrierId && item.factionId === view.factionId);
    closeMapActions();
    movementRef.current?.click(cell, input);
    if (!current.armyId || friend && !input.shiftKey && !movementRef.current?.append) openPickedActions(cell, input);
  };
  const mapHover = (cell: number | undefined) => { movementRef.current?.hover(cell); };
  const receive = (event: MessageEvent<Response>) => {
    const response = event.data;
    // Fog replies update presentation only: do not replace the ordinary realm
    // read model, reset selection, or invalidate same-hash land/movement queries.
    if (fogRequests.current.has(response.id) && (response.type === 'state' || response.type === 'error')) {
      try {
        if (response.type === 'error') throw new Error(response.message);
        if (response.hash !== hash.current || response.mapRevision < fogRequests.current.revision) throw new Error('The campaign changed before its spectator view arrived. Retry the fog control.');
        const cells = unpackCells(response.cells);
        fogRequests.current.accept(response.fogEnabled, response.mapRevision);
        renderer.current?.update({ ...(response.map ?? response.observation), seed: response.observation.seed, cells }, false, response.mapReset);
        metrics.current = response.metrics; setFogEnabled(response.fogEnabled);
        fogRequests.current.finish(response.id, { enabled: response.fogEnabled, hash: response.hash });
        setError(false); setFeedback(response.message);
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        fogRequests.current.finish(response.id, error); setError(true);
        if (response.type === 'state') {
          // A failed replacement cannot be followed by ordinary deltas: those
          // could leave previously revealed cells behind. Require a fresh map.
          campaignFault.current = true; setRecoveryRequired(true); pauseWatch();
          setFeedback(`${error.message} Load, import or begin a campaign to recover the map.`);
        } else setFeedback(error.message);
      }
      setFogPending(fogRequests.current.size > 0);
      return;
    }
    const land = landQuery.current;
    if (response.type === 'landQuery') metrics.current = response.metrics;
    if (landRequestWorkers.current.has(response.id) && (response.type === 'landQuery' || response.type === 'error')) {
      landRequestWorkers.current.delete(response.id);
      if (land?.id !== response.id) return;
      landQuery.current = undefined;
      if (response.type === 'landQuery' && response.hash === land.hash && response.hash === hash.current && response.settlementId === land.settlementId && land.worker === worker.current) land.resolve(response);
      else land.reject(new Error(response.type === 'error' ? response.message : 'The campaign changed. Retry land details for current quotes.'));
      return;
    }
    if (response.type === 'landQuery') return;
    const movementQuery = movementQueries.current.get(response.id);
    if (movementQuery && (response.type === 'movementQuery' || response.type === 'error')) {
      movementQueries.current.delete(response.id);
      if (response.type === 'movementQuery' && response.hash === hash.current) movementQuery.resolve(response.query);
      else movementQuery.reject(new Error(response.type === 'error' ? response.message : 'The campaign changed; review the route again.'));
      return;
    }
    if (response.type === 'movementQuery') return;
    if (response.id === chronicleQuery.current && (response.type === 'chronicles' || response.type === 'error')) {
      chronicleQuery.current = undefined;
      if (response.type === 'chronicles') { documentsRef.current = response.documents; setDocuments(response.documents); }
      else setChronicleError(response.message);
      return;
    }
    if (response.type === 'chronicles') return;
    const query = peaceQueries.current.get(response.id);
    if (query && (response.type === 'peacePreview' || response.type === 'error')) {
      peaceQueries.current.delete(response.id);
      if (response.type === 'peacePreview') query.resolve(response.assessment);
      else query.reject(new Error(response.message));
      return;
    }
    if (response.type === 'peacePreview') return;
    if (response.type === 'progress') { setFeedback(response.message); return; }
    setBusy(false); setGenerating(false);
    if (response.type === 'error') {
      if (pendingFound.current?.requestId === response.id) pendingFound.current = undefined;
      pauseWatch();
      if (previousWorker.current) { forgetWorkerLandRequests(worker.current); worker.current?.terminate(); worker.current = previousWorker.current; previousWorker.current = undefined; }
      setError(true); setFeedback(response.message); return;
    }
    setError(false);
    if (response.type === 'state') {
      setNavigationNotice('');
      let cells: Observation['cells'];
      try { cells = unpackCells(response.cells); }
      catch (cause) {
        campaignFault.current = true; setRecoveryRequired(true); pauseWatch();
        invalidateLandQuery('Map transfer could not be read. Restore a saved campaign to review land.', true);
        setError(true); setFeedback(`The map update could not be read: ${String(cause)}. Gameplay is paused; load, import or begin a campaign to recover.`);
        return;
      }
      if (campaignFault.current && !response.reset) return;
      campaignFault.current = false; setRecoveryRequired(false);
      if (response.reset || response.hash !== hash.current) invalidateLandQuery('The campaign changed. Review current land details.', response.reset);
      forgetWorkerLandRequests(previousWorker.current); previousWorker.current?.terminate(); previousWorker.current = undefined;
      hash.current = response.hash; metrics.current = response.metrics;
      campaignRef.current = response.campaign; setCampaign(response.campaign);
      if (response.reset) {
        closeMapActions();
        setManagementWindow(undefined);
        setBattleTransfer(undefined); setBattleReview(false);
        fogRequests.current.reset('The loaded campaign changed. Retry its spectator controls.'); setFogPending(false);
        pendingFound.current = undefined;
        setRegistryEpoch(value => value + 1); setSearch(''); setForceFilter('all');
        pauseWatch(); setProgressionOpen(false); setChroniclesOpen(false); setCharacterContext(undefined);
        openedVictory.current = '';
        for (const query of movementQueries.current.values()) query.reject(new Error('The loaded campaign changed. Review the route again.'));
        movementQueries.current.clear();
        documentsRef.current = undefined; setDocuments(undefined); setChronicleError(''); chronicleQuery.current = undefined;
      }
      if (response.observation.victory) pauseWatch();
    renderer.current ??= new WorldRenderer(setArtStatus, publicAssetUrl);
      if (!fogRequests.current.accept(response.fogEnabled, response.mapRevision)) return;
      setFogEnabled(response.fogEnabled);
      renderer.current.update({ ...(response.map ?? response.observation), seed: response.observation.seed, cells }, response.reset, response.mapReset);
      // React receives only the empire read model; explored cells stay in the renderer.
      const view = { ...response.observation, cells: [] };
      if (view.battle || view.pendingCapture) { closeMapActions(); setManagementWindow(undefined); }
      if (response.battlePresentation) setBattleTransfer(response.battlePresentation);
      else if (!response.reset) setBattleTransfer(previous => previous && (view.battle?.id === previous.packet.battleId || view.battleReports.some(report => report.id === previous.packet.battleId)) ? previous : undefined);
      observationRef.current = view; setObservation(view); setShowSetup(false);
      const current = selectionRef.current;
      const army = view.armies.find(item => item.id === current.armyId && item.factionId === view.factionId);
      const settlement = view.settlements.find(item => item.id === current.settlementId && item.factionId === view.factionId);
      const found = pendingFound.current?.requestId === response.id ? pendingFound.current : undefined;
      if (found) pendingFound.current = undefined;
      const foundedTown = found && found.selectionRevision === selectionRevision.current && current.armyId === found.armyId
        ? view.settlements.find(item => item.factionId === view.factionId && item.cell === found.cell) : undefined;
      if (mapPopupRef.current && !foundedTown && (current.armyId && (!army || army.cell !== mapPopupRef.current.cell) || current.settlementId && !settlement)) closeMapActions();
      if (foundedTown) {
        setRegistry('settlements'); select({ settlementId: foundedTown.id, cell: foundedTown.cell }, true);
        if (mapPopupRef.current) openMapActions(foundedTown.cell, mapPopupRef.current.anchor, foundedTown.id);
      } else if (found && found.selectionRevision !== selectionRevision.current) {
        // The player inspected another entity or cleared selection while the order resolved.
        if (army) select({ armyId: army.id, cell: army.cell });
      } else if (!response.reset && !current.armyId && !current.settlementId && current.cell !== undefined) {
        // Read-only terrain/diplomacy inspection is not a missing player unit.
        // Keep it stable through ordinary updates and spectator rounds.
        select({ cell: current.cell });
      } else if (response.reset || (!army && !settlement)) {
        const firstArmy = view.armies.find(item => item.factionId === view.factionId);
        const firstSettlement = view.settlements.find(item => item.factionId === view.factionId);
        // A new campaign can reuse the same IDs, so selection effects alone
        // cannot synchronize a tab the player browsed before importing.
        if (response.reset) setRegistry(firstArmy ? 'armies' : 'settlements');
        select(firstArmy ? { armyId: firstArmy.id, cell: firstArmy.cell } : { settlementId: firstSettlement?.id, cell: firstSettlement?.cell }, true);
      } else if (army) select({ armyId: army.id, cell: army.cell });
      setFeedback(response.message);
    } else if (response.type === 'message') setFeedback(response.message);
    else if (response.type === 'export') {
      const bytes = new Uint8Array(response.bytes);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/gzip' }));
      const link = document.createElement('a'); link.href = url; link.download = `theandril-turn-${observationRef.current?.turn ?? 0}.theandril`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setFeedback('Campaign exported. Keep this file as a backup.');
    }
  };
  const startWorker = () => {
    const instance = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
    instance.onmessage = event => { if (worker.current === instance) receive(event); else landRequestWorkers.current.delete(event.data.id); };
    instance.onerror = event => {
      fogRequests.current.reset('The campaign worker stopped. Restore a campaign before changing fog.'); setFogPending(false);
      pendingFound.current = undefined;
      invalidateLandQuery('The campaign worker stopped. Restore a saved campaign to review land.', true);
      forgetWorkerLandRequests(instance);
      instance.terminate(); pauseWatch();
      for (const query of movementQueries.current.values()) query.reject(new Error('The campaign worker stopped. Restore a saved campaign to review routes.'));
      movementQueries.current.clear();
      if (chronicleQuery.current !== undefined) { chronicleQuery.current = undefined; setChronicleError('The campaign worker stopped while preparing the chronicles. Restore a saved campaign to retry.'); }
      for (const query of peaceQueries.current.values()) query.reject(new Error('The campaign worker stopped before reviewing these terms.'));
      peaceQueries.current.clear();
      if (worker.current === instance) { worker.current = previousWorker.current; previousWorker.current = undefined; }
      setError(true); setBusy(false); setGenerating(false);
      setFeedback(`The campaign worker stopped: ${event.message || 'Unexpected worker error.'} Restore a saved campaign to recover.`);
    };
    worker.current = instance;
    return instance;
  };
  const send = (request: RequestBody) => {
    if (campaignFault.current && (request.type === 'command' || request.type === 'watchRound')) return -1;
    if (request.type !== 'watchRound') pauseWatch();
    setBusy(true); setError(false);
    const id = ++sequence.current;
    (worker.current ?? startWorker()).postMessage({ ...request, id });
    return id;
  };
  const setWatchFog: WatchFogApi['setWatchFog'] = enabled => {
    if (typeof enabled !== 'boolean') return Promise.reject(new Error('Use setWatchFog(true) or setWatchFog(false).'));
    if (campaignRef.current.mode !== 'watch' || !worker.current || !observationRef.current || previousWorker.current) return Promise.reject(new Error('Fog controls are available only in an active AI-watch campaign.'));
    if (campaignFault.current) return Promise.reject(new Error('Restore the campaign before changing fog.'));
    // Stop scheduling new rounds; any in-flight round finishes before this
    // request on the worker's existing serialized queue. Resume is explicit.
    pauseWatch(); setFogPending(true);
    const id = ++sequence.current, pending = fogRequests.current.enqueue(id, enabled);
    try { worker.current.postMessage({ id, type: 'watchFog', enabled }); }
    catch (cause) { fogRequests.current.finish(id, cause instanceof Error ? cause : new Error(String(cause))); setFogPending(fogRequests.current.size > 0); }
    return pending;
  };
  const fogApi = useRef<WatchFogApi | undefined>(undefined);
  fogApi.current = { setWatchFog, toggleFogOfWar: () => setWatchFog(!fogRequests.current.desired) };
  useEffect(() => {
    const api: WatchFogApi = { setWatchFog: enabled => fogApi.current!.setWatchFog(enabled), toggleFogOfWar: () => fogApi.current!.toggleFogOfWar() };
    window.theandril = api;
    return () => { if (window.theandril === api) delete window.theandril; fogRequests.current.reset('The campaign view closed.'); };
  }, []);
  const command = (order: GameCommand) => {
    if (campaignRef.current.mode === 'watch' || observationRef.current?.victory) return;
    if (['endTurn', 'move', 'moveTo', 'queueMovement', 'resumeMovement', 'embarkArmy', 'disembarkArmy', 'assault', 'attack', 'resolveBattle'].includes(order.type)) closeMapActions();
    const id = send({ type: 'command', command: order });
    if (order.type === 'found') {
      const army = observationRef.current?.armies.find(item => item.id === order.armyId);
      if (army) pendingFound.current = { requestId: id, armyId: army.id, cell: army.cell, selectionRevision: selectionRevision.current };
    }
  };
  const reviewMovement: MovementReview = (armyId, target, append) => new Promise((resolve, reject) => {
    const instance = worker.current;
    if (!instance || !observationRef.current) { reject(new Error('Load a campaign before reviewing routes.')); return; }
    const id = ++sequence.current; movementQueries.current.set(id, { resolve, reject });
    try { instance.postMessage({ id, type: 'movementQuery', armyId, target, append }); }
    catch (error) { movementQueries.current.delete(id); reject(error instanceof Error ? error : new Error(String(error))); }
  });
  const reviewLand: LandQuery = useCallback(settlementId => new Promise((resolve, reject) => {
    const instance = worker.current;
    if (!instance || !observationRef.current || campaignFault.current) { reject(new Error('Load a campaign before reviewing land details.')); return; }
    landQuery.current?.reject(new Error('Another settlement was selected.'));
    const id = ++sequence.current;
    landQuery.current = { id, settlementId, hash: hash.current, worker: instance, resolve, reject };
    landRequestWorkers.current.set(id, instance);
    try { instance.postMessage({ id, type: 'landQuery', settlementId }); }
    catch (cause) { landRequestWorkers.current.delete(id); landQuery.current = undefined; reject(cause instanceof Error ? cause : new Error(String(cause))); }
  }), []);
  const reviewPeace = (targetFactionId: string, terms: PeaceTerms): Promise<PeaceAssessment> => new Promise((resolve, reject) => {
    const instance = worker.current;
    if (!instance || !observationRef.current) { reject(new Error('Load a campaign before reviewing peace terms.')); return; }
    const id = ++sequence.current;
    peaceQueries.current.set(id, { resolve, reject });
    try { instance.postMessage({ id, type: 'previewPeace', targetFactionId, terms }); }
    catch (error) { peaceQueries.current.delete(id); reject(error); }
  });
  const endTurn = () => { if (observationRef.current && !observationRef.current.victory && campaignRef.current.mode !== 'watch' && !observationRef.current.battle && !observationRef.current.pendingCapture && !busy) command({ type: 'endTurn', factionId: observationRef.current.factionId }); };
  const begin = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(seed);
    if (!Number.isSafeInteger(value) || value < 0 || value > 4294967295) { setError(true); setFeedback('Use a whole-number world seed between 0 and 4294967295.'); return; }
    const count = Number(factionCount);
    if (!Number.isInteger(count) || count < 2 || count > 48) { setError(true); setFeedback('Choose between 2 and 48 factions for this campaign.'); return; }
    invalidateLandQuery('Review land again after returning to this campaign.', true);
    const priorFog = { enabled: fogRequests.current.enabled, revision: fogRequests.current.revision };
    fogRequests.current.reset('A new campaign is starting. Retry its spectator controls.');
    // The prior worker/map may be restored by Cancel generation. Keep its
    // presentation until the new worker actually publishes a campaign reset.
    fogRequests.current.accept(priorFog.enabled, priorFog.revision); setFogPending(false);
    for (const query of movementQueries.current.values()) query.reject(new Error('Review routes again after returning to this campaign.'));
    movementQueries.current.clear();
    for (const query of peaceQueries.current.values()) query.reject(new Error('Review peace terms again after returning to this campaign.'));
    peaceQueries.current.clear();
    if (worker.current) { previousWorker.current = worker.current; worker.current = undefined; }
    setGenerating(true); send({ type: 'new', seed: value, size, mode: newMode, pace, factionCount: count, factionDefinitionId, layout });
  };
  const cancel = () => { forgetWorkerLandRequests(worker.current); worker.current?.terminate(); worker.current = previousWorker.current; previousWorker.current = undefined; invalidateLandQuery('World generation was cancelled. Review current land details.', true); setBusy(false); setGenerating(false); setFeedback('World generation cancelled.'); };

  useEffect(() => () => { landQuery.current?.reject(new Error('The campaign view closed.')); landQuery.current = undefined; landRequestWorkers.current.clear(); worker.current?.terminate(); previousWorker.current?.terminate(); renderer.current?.destroy(); }, []);
  const hasCampaign = Boolean(observation);
  const victoryKey = observation?.victory ? `${observation.seed}:${hash.current}` : '';
  useEffect(() => {
    if (!victoryKey || openedVictory.current === victoryKey) return;
    openedVictory.current = victoryKey; setProgressionOpen(false); openChronicles();
  }, [victoryKey, observation?.victory]);
  useEffect(() => {
    if (!watchRunning || busy || fogPending || showSetup || campaign.mode !== 'watch' || !observation || observation.victory) return;
    // No interval or queued batches: schedule only after the preceding response.
    const timer = setTimeout(() => {
      if (!watchRunningRef.current || !worker.current || observationRef.current?.victory || campaignFault.current) return;
      setBusy(true); setError(false);
      worker.current.postMessage({ id: ++sequence.current, type: 'watchRound' });
    }, 250);
    return () => clearTimeout(timer);
  }, [watchRunning, busy, fogPending, showSetup, campaign.mode, observation]);
  useEffect(() => {
    if (!hasCampaign || !mapHost.current || !renderer.current) return;
    renderer.current.mount(mapHost.current, mapSelect, mapHover).catch(cause => { setError(true); setFeedback('The map could not start WebGL: ' + String(cause)); });
    // The renderer's lifetime follows the application, not observation updates.
  }, [hasCampaign]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      // A successful modal command can disable its focused button, moving native
      // keyboard focus to body. The open modal still owns Escape and turn keys.
      // Also retain ownership if React closes the dialog earlier in this event.
      if (event.defaultPrevented || mapPopupRef.current || campaignOptions.current?.open || document.querySelector('dialog[open]') || event.composedPath().some(node => node instanceof HTMLDialogElement)) return;
      if (observationRef.current?.battle || battleReview) return;
      if (event.key === 'Escape') { movementRef.current?.clear(); return; }
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest('input, select, textarea, [role="textbox"], [role="combobox"]')) || event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.repeat) return;
      const navigation = actionShortcut(event, { army: armyKey, settlement: settlementKey, turn: turnKey }, navigationLocked);
      if (navigation) { event.preventDefault(); jumpToAction(navigation.kind, navigation.direction); return; }
      if (event.key.toLowerCase() === turnKey && hasCampaign) { event.preventDefault(); endTurn(); }
    };
    window.addEventListener('keydown', listener); return () => window.removeEventListener('keydown', listener);
  });
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__THEANDRIL__ = {
      getTurn: () => observationRef.current?.turn ?? 0,
      getCellScreenPoint: cell => renderer.current?.projectCell(cell),
      getMovement: () => { const movement = movementRef.current; return movement ? { reachable: movement.reachable, preview: movement.getHover() ?? movement.candidate, route: movement.route } : undefined; },
      getArtDiagnostics: () => renderer.current?.getArtDiagnostics(),
      getBattleDiagnostics: () => renderer.current?.getBattleDiagnostics(),
      getTerrainArt: cell => renderer.current?.getTerrainArt(cell),
      getStateHash: () => hash.current,
      getSelection: () => ({ ...selectionRef.current }),
      getPerformanceCounters: () => ({ ...metrics.current, ...renderer.current?.getMetrics() }),
      getSummary: () => {
        const view = observationRef.current;
        return view ? { ...view, campaign: { ...campaignRef.current }, watch: { enabled: campaignRef.current.mode === 'watch', running: watchRunningRef.current, fogEnabled: fogRequests.current.enabled }, ownArmies: view.armies.filter(item => item.factionId === view.factionId), ownSettlements: view.settlements.filter(item => item.factionId === view.factionId), exploredCells: renderer.current?.getExploredCount() ?? 0 } : undefined;
      },
    };
    return () => { delete window.__THEANDRIL__; };
  }, []);

  const ownArmies = observation?.armies.filter(item => item.factionId === observation.factionId) ?? [];
  const ownSettlements = observation?.settlements.filter(item => item.factionId === observation.factionId) ?? [];
  const army = ownArmies.find(item => item.id === selection.armyId);
  const settlement = ownSettlements.find(item => item.id === selection.settlementId);
  const factionId = observation?.factionId ?? '';
  const realm = observation?.factions.find(faction => faction.id === factionId);
  const realmName = realm?.name ?? factionId;
  const controlLocked = busy || recoveryRequired || campaign.mode === 'watch' || Boolean(observation?.victory);
  const battleActive = Boolean(observation?.battleScene || battleReview && battleTransfer);
  const ordersBusy = controlLocked || Boolean(observation?.battle || observation?.pendingCapture);
  const navigationLocked = ordersBusy || showSetup || !observation;
  const nextActions = useMemo(() => observation ? actionCandidates(observation) : { armies: [], settlements: [] }, [observation]);
  const jumpToAction = (kind: ActionKind, direction: Direction = 1) => {
    if (navigationLocked) return;
    const current = selectionRef.current;
    const candidate = nextAction(kind === 'army' ? nextActions.armies : nextActions.settlements, kind === 'army' ? current.armyId : current.settlementId, direction);
    if (!candidate) { setNavigationNotice(kind === 'army' ? 'No armies currently need orders or route review.' : 'No idle settlements have an available production order.'); return; }
    closeMapActions(); setManagementWindow(undefined);
    setSearch(''); setForceFilter('all'); setRegistry(kind === 'army' ? 'armies' : 'settlements');
    select({ ...(kind === 'army' ? { armyId: candidate.id } : { settlementId: candidate.id }), cell: candidate.cell }, true);
    setNavigationNotice(`${candidate.name} · ${candidate.reason}`);
  };
  const changeShortcut = (kind: keyof ShortcutBindings, value: string) => {
    const problem = shortcutError({ army: armyKey, settlement: settlementKey, turn: turnKey }, kind, value);
    if (problem) { setBindingError(problem); return; }
    const key = value.toLowerCase();
    if (kind === 'army') setArmyKey(key); else if (kind === 'settlement') setSettlementKey(key); else setTurnKey(key);
    setBindingError(saveShortcuts({ army: armyKey, settlement: settlementKey, turn: turnKey, [kind]: key }, text => localStorage.setItem(SHORTCUT_STORAGE_KEY, text)));
  };
  const movement = useMapMovement({ view: observation, selection, hash: hash.current, locked: ordersBusy, renderer, select, issue: command, query: reviewMovement });
  movementRef.current = movement;
  useEffect(() => {
    if (mapMenusRef.current && movement.candidate?.canQueue && !movement.candidate.canMoveNow && selection.armyId && !ordersBusy) {
      // A long map click reviews a route instead of issuing it. Keep its actual
      // confirmation beside the map rather than scrolling to the side panel.
      const own = observationRef.current?.armies.find(item => item.id === selection.armyId);
      if (own) openMapActions(own.cell, renderer.current?.projectCell(movement.candidate.target), own.id, 'route');
    }
  }, [movement.candidate]);
  const showRegistry = (kind: 'armies' | 'settlements') => {
    closeMapActions(); pauseWatch(); setRegistry(kind); setManagementWindow('registry');
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 64 * 1024 * 1024) { setError(true); setFeedback('Save file exceeds the 64 MiB limit.'); return; }
    try { send({ type: 'import', bytes: new Uint8Array(await file.arrayBuffer()) }); }
    catch (cause) { setError(true); setFeedback('Could not read save: ' + String(cause)); }
  };
  const persistence = <><button disabled={busy} onClick={() => send({ type: 'load' })}>Load campaign</button><button disabled={busy} onClick={() => send({ type: 'loadAuto' })}>Restore autosave</button><button disabled={busy} onClick={() => fileInput.current?.click()}>Import campaign</button></>;

  const popupActive = Boolean(mapPopup && !managementWindow && !showSetup && !battleActive && !observation?.pendingCapture && !generating && !recoveryRequired);
  const openWindow = (kind: ManagementWindow) => { closeMapActions(); pauseWatch(); setManagementWindow(kind); };
  const manageInPanel = () => openWindow('orders');
  const showMap = () => { closeMapActions(); mapFocusAfterWindow.current = Boolean(managementWindow); setManagementWindow(undefined); if (selection.cell !== undefined) renderer.current?.focus(selection.cell); mapHost.current?.focus({ preventScroll: true }); };
  const worldOverview = () => { closeMapActions(); setManagementWindow(undefined); renderer.current?.fitWorld(); mapHost.current?.focus({ preventScroll: true }); setFeedback('World overview shows permitted geography. Select a hex, then Focus selection or zoom in for local detail. Roads and armies are omitted at this scale.'); };
  const managedSelect = (next: Selection, focus = false) => {
    select(next, focus);
    const targetArmy = next.armyId && observationRef.current?.armies.find(item => item.id === next.armyId);
    // Focusing a waypoint changes the camera/inspected cell, not the army whose
    // route is being reviewed. It must not resolve into the destination's town.
    if (targetArmy && next.cell !== targetArmy.cell) return;
    if (mapPopupRef.current && next.cell !== undefined) openMapActions(next.cell, undefined, next.armyId ?? (next.settlementId ? `tile.${next.cell}` : undefined), next.armyId ? undefined : 'land');
  };
  const panes = observation && managementPanes({ view: observation, selection, movement, busy: ordersBusy, name, setName, issue: command, select: managedSelect, openCharacters, renderer: renderer.current, query: reviewLand, stateHash: hash.current, queryEpoch: landEpoch, queryEnabled: !showSetup && !generating && !recoveryRequired, spectator: campaign.mode === 'watch' && !fogEnabled });
  const popupChoices = useMemo(() => {
    if (!observation || !mapPopup) return [];
    const choices = getMapActionChoices(observation, mapPopup.cell, selection.settlementId, renderer.current?.inspect(mapPopup.cell));
    if (army?.carrierId && army.cell === mapPopup.cell) choices.unshift({ id: army.id, kind: 'army', label: army.name, summary: 'Embarked army', selection: { armyId: army.id, cell: army.cell } });
    return choices;
  }, [observation, mapPopup?.cell, selection.settlementId, army, fogEnabled]);
  const popupChoice = popupChoices.find(choice => choice.id === mapPopup?.choiceId)
    ?? popupChoices.find(choice => choice.id === (selection.armyId ?? selection.settlementId)) ?? popupChoices[0];
  const popupTabs: MapActionTab[] = panes ? army ? [
    { id: 'actions', label: 'Actions', render: () => <div className="army-quick-actions"><button className="primary wide" disabled={ordersBusy || Boolean(army.carrierId)} onClick={() => { closeMapActions(); mapHost.current?.focus({ preventScroll: true }); }}>Move on map</button>{army.movementBlocker && <p className="field-help">{army.movementBlocker}</p>}{panes.founding}<div className="army-quick-links"><button onClick={() => openMapActions(army.cell, mapPopup?.anchor, army.id, 'route')}>Plan a route</button><button onClick={() => openMapActions(army.cell, mapPopup?.anchor, army.id, 'combat')}>Battle orders</button>{(army.domain === 'naval' || army.carrierId) && <button onClick={() => openMapActions(army.cell, mapPopup?.anchor, army.id, 'transport')}>Transport</button>}</div>{movement.route && <p className="field-help">{movement.route.status === 'paused' ? '⚑ Journey interrupted — review your route.' : 'A journey is queued.'}</p>}</div> },
    { id: 'composition', label: 'Composition', render: () => panes.composition },
    { id: 'officers', label: 'Officers', render: () => panes.officers },
    { id: 'route', label: 'Route', render: () => panes.routes },
    { id: 'combat', label: 'Battle', render: () => panes.combat },
    { id: 'transport', label: 'Transport', render: () => panes.transport },
    { id: 'hex', label: 'Hex', render: () => panes.location },
  ] : settlement ? [
    { id: 'production', label: 'Build & recruit', render: () => panes.production },
    { id: 'land', label: 'Land & tiles', render: () => panes.land(true) },
    { id: 'officers', label: 'Officers', render: () => <>{panes.officers}{panes.defense}</> },
    { id: 'hex', label: 'Hex', render: () => panes.location },
  ] : [{ id: 'hex', label: 'Hex', render: () => panes.location }] : [];
  if (observation) popupTabs.push({ id: 'diplomacy', label: observation.diplomacy.offers.length ? `Diplomacy (${observation.diplomacy.offers.length})` : 'Diplomacy', render: () => <FactionEncounters view={observation} busy={controlLocked} issue={command} stateHash={hash.current} review={reviewPeace}/> });

  return <div className={`application${observation && !showSetup ? ' campaign-session' : ''}`} style={{ '--text-scale': textScale } as React.CSSProperties}>
    <input className="file-input" ref={fileInput} type="file" aria-label="Import save file" accept=".theandril,application/gzip" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} />
    <div className="campaign-topbar">
    <header className="masthead"><div className="wordmark"><Crest/><div><span className="eyebrow">The age of fracture</span><h1>Theandril</h1></div></div>{observation && <><div className="hud-realm"><span className="eyebrow">Your realm</span><strong>{realmName}</strong></div><div className="resources"><div><small>TREASURY</small><strong>{observation.treasury}<span> coin</span></strong></div><div><small>KNOWLEDGE</small><strong>{observation.knowledge}</strong></div><div><small>HEARTHS</small><strong>{ownSettlements.length}</strong></div></div></>}</header>
    {observation && !showSetup && <nav className="campaign-tools" aria-label="Campaign navigation">
      <span className="campaign-pace">{CAMPAIGN_PACES[observation.pace].name} pace · <span data-testid="campaign-faction-count">{observation.factionCount} realms</span></span>
      {campaign.mode === 'watch' && <section className="watch-controls" data-testid="watch-controls" aria-label="AI watch controls"><span>{observation.victory ? 'AI watch complete' : watchRunning ? 'AI watch running' : busy ? 'Pausing after this round…' : 'AI watch paused'}</span><button disabled={fogPending || Boolean(observation.victory) || (busy && !watchRunning)} onClick={() => { if (watchRunningRef.current) pauseWatch(); else { watchRunningRef.current = true; setWatchRunning(true); } }}>{watchRunning ? 'Pause AI watch' : 'Resume AI watch'}</button><button disabled={fogPending || busy || watchRunning || Boolean(observation.victory)} onClick={() => send({ type: 'watchRound' })}>Step one round</button><button aria-pressed={!fogEnabled} aria-describedby="spectator-fog-help" disabled={fogPending || busy || recoveryRequired} onClick={() => { void setWatchFog(!fogEnabled).catch(cause => { setError(true); setFeedback(String(cause)); }); }}>{fogPending ? 'Updating spectator map…' : fogEnabled ? 'Reveal spectator map' : 'Restore fog of war'}</button><span id="spectator-fog-help" className="field-help">{fogEnabled ? 'Map follows your realm’s sight.' : 'Spectator map revealed.'} AI always uses its own faction sight. Changing fog pauses AI watch; resume when ready.</span></section>}
      <span className="archive-note">{campaign.coverage === 'complete' ? 'Recording the full campaign' : 'Partial archive · earlier history unavailable'}</span>
      {observation.victory && <button onClick={openChronicles}>Campaign chronicles</button>}
    </nav>}
    <details ref={campaignOptions} className="campaign-options" data-testid="campaign-menu"><summary>Campaign & settings</summary><div className="options-content">{observation && <><button disabled={busy} onClick={() => send({ type: 'save' })}>Save campaign</button><button disabled={busy} onClick={() => send({ type: 'export' })}>Export campaign</button>{persistence}<button disabled={busy} onClick={() => { pauseWatch(); setShowSetup(true); }}>New campaign</button></>}<label className="map-menu-setting"><input type="checkbox" checked={mapMenus} onChange={event => { setMapMenus(event.target.checked); closeMapActions(); }}/>Map click menus</label><p className="field-help">Click an army, town, or tile for local actions. Turn this off to use full orders from the command tray; Open map actions remains available.</p><label>Text scale<select value={textScale} onChange={event => setTextScale(event.target.value)}><option value="1">100%</option><option value="1.15">115%</option><option value="1.3">130%</option></select></label><label>End turn shortcut<input value={turnKey} maxLength={1} onChange={event => changeShortcut('turn', event.target.value)}/></label><label>Next army shortcut<input value={armyKey} maxLength={1} onChange={event => changeShortcut('army', event.target.value)}/></label><label>Next settlement shortcut<input value={settlementKey} maxLength={1} onChange={event => changeShortcut('settlement', event.target.value)}/></label>{bindingError && <p role="alert">{bindingError}</p>}</div></details>
    </div>
    {!observation || showSetup ? <main className="landing">
      <div className="opening"><span className="eyebrow">Keep the hearth. Keep the oath.</span><h2>From the ashes,<br/>a new dominion.</h2><p>The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future.</p><div className="opening-rule"/><p className="subtle">Found a hearth. Work its land.<br/>Send wayfinders into the unknown.</p></div>
      <section className="setup panel"><span className="eyebrow">A chronicle begins</span><h2>Establish your campaign</h2><div className="faction-card"><FactionArt contentId="ui.crest" definitionId={factionDefinitionId} label="Selected culture crest" decorative/><div><h3>{FACTIONS.find(faction => faction.id === factionDefinitionId)?.name}</h3><p>Your chosen player seat</p></div></div>
        <form onSubmit={begin}>
          <FactionSelection value={factionDefinitionId} onChange={setFactionDefinitionId}/>
          <label>World seed<input name="seed" inputMode="numeric" value={seed} onChange={event => setSeed(event.target.value)} required/></label>
          <label>World size<select value={size} onChange={event => changeWorldSize(event.target.value as MapSize)}><option value="tiny">Tiny · 1,536 hexes · quick campaign</option><option value="small">Small · 40,960 hexes</option><option value="standard">Standard · 98,304 hexes</option><option value="huge">Huge · 196,608 hexes</option><option value="legendary">Legendary · 307,200 hexes</option></select></label>
          <label>Faction count<input type="number" min={2} max={48} step={1} required value={factionCount} aria-describedby="faction-density-help" onChange={event => setFactionCount(event.target.value)}/></label>
          <label>World layout<select value={layout} onChange={event => setLayout(event.target.value as Exclude<MapLayout, 'legacy'>)}><option value="continents">Continents · broad landmasses</option><option value="islands">Islands · separated shores</option><option value="archipelago">Archipelago · scattered islands</option></select></label>
          <p id="faction-density-help" className="field-help" data-testid="faction-density-help">Recommended for this size: {RECOMMENDED_FACTION_COUNTS[size]} realms. Changing world size resets this recommendation; you can override it. {FACTIONS.length} introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced.</p>
          <label>Campaign pace<select value={pace} onChange={event => setPace(event.target.value as CampaignPace)}><option value="short">Short · test/skirmish</option><option value="standard">Standard · hundreds of turns</option><option value="long">Long · extended campaign</option><option value="epic">Epic · longest campaign</option></select></label>
          <p className="field-help">{CAMPAIGN_PACES[pace].description} Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.</p>
          <label>Campaign mode<select value={newMode} onChange={event => setNewMode(event.target.value as CampaignMode)}><option value="player">Lead a realm</option><option value="watch">AI watch</option></select></label>
          {newMode === 'watch' && <p className="field-help">AI controls every configured realm through the same rules. Observe your realm’s sight or reveal the spectator map, pause or step rounds, then read both all-faction chronicles after victory. Revealing the map never grants the AI extra sight.</p>}
          <p className="field-help">The same seed, size, layout and faction count create the same world within a generator version. Giant maps need enough realms to create nearby rivals; terrain can still separate them.</p>
          <button className="primary begin" disabled={busy} type="submit">{generating ? 'Shaping the world…' : 'Begin campaign'}<span aria-hidden="true">→</span></button>
        </form>{generating && <button className="wide" onClick={cancel}>Cancel generation</button>}<div className="save-actions">{persistence}</div>{observation && <button className="wide" onClick={() => setShowSetup(false)}>Return to campaign</button>}</section>
      <PublicCultures/>
    </main> : null}
    {observation?.victory && !showSetup && <section className="victory-banner" data-testid="victory-result" aria-label="Campaign result"><span className="eyebrow">The witnesses seal the book</span><h2>{observation.factions.find(faction => faction.id === observation.victory?.factionId)?.name ?? observation.victory.factionId} achieved Prosperity</h2><p>Turn {observation.victory.turn} · The Hearth Exchange is complete. Campaign orders have ended.</p><button className="primary" onClick={openChronicles}>Read campaign chronicles</button></section>}
    {observation && <main className={`campaign${battleActive ? ' battle-active' : ''}${mapOnly ? ' map-only' : ''}`} style={showSetup ? { display: 'none' } : undefined}>
      <section className="map-section" aria-label={battleActive ? "Battlefield" : "Strategic map"}><div className="map-title"><span className="eyebrow">The uncharted marches</span><span>SEED {observation.seed} · {observation.width} × {observation.height}<br/><span data-testid="campaign-layout">{observation.layout === 'legacy' || !observation.layout ? 'Legacy geography' : `${observation.layout[0]!.toUpperCase()}${observation.layout.slice(1)}`}</span></span></div><div className="map-host" data-testid="map-container" ref={mapHost} tabIndex={0} aria-label={battleActive ? 'Battlefield. Select a figure to inspect it. Keyboard inspection and real orders are below the field.' : "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls."} onPointerDownCapture={event => { mapDragStart.current = { x: event.clientX, y: event.clientY }; }} onPointerMoveCapture={event => { const start = mapDragStart.current; if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) closeMapActions(); }} onPointerUpCapture={() => { mapDragStart.current = undefined; }} onPointerCancelCapture={() => { mapDragStart.current = undefined; }} onWheelCapture={closeMapActions} onKeyDown={event => { if (battleActive || mapPopupRef.current) return; if (event.key === 'Enter' && selection.cell !== undefined) { event.preventDefault(); openMapActions(selection.cell); return; } const moves: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] }; const move = moves[event.key]; if (move) { event.preventDefault(); renderer.current?.pan(...move); } if (event.key === '+' || event.key === '=') renderer.current?.zoom(1.2); if (event.key === '-') renderer.current?.zoom(1 / 1.2); }}/><MovementMapHint movement={movement}/><div className="map-compass" aria-hidden="true"><span>N</span>✧</div><nav className="hud-tools" aria-label="Map management">
        <button aria-haspopup="dialog" onClick={() => showRegistry('armies')}><HudIcon symbol="armies"/><span>Armies &amp; fleets</span></button>
        <button aria-haspopup="dialog" onClick={() => showRegistry('settlements')}><HudIcon symbol="settlements"/><span>Settlements</span></button>
        <button aria-haspopup="dialog" aria-label="Characters & agents" onClick={() => openCharacters()}><HudIcon symbol="characters"/><span>Characters</span></button>
        <button aria-haspopup="dialog" aria-label="Realm progression" onClick={() => { pauseWatch(); setProgressionOpen(true); }}><HudIcon symbol="research"/><span>Research</span></button>
        <button aria-haspopup="dialog" aria-label="Realm affairs" onClick={() => openWindow('affairs')}><HudIcon symbol="diplomacy"/><span>Diplomacy{observation.diplomacy.offers.length > 0 && <b className="hud-alert"> {observation.diplomacy.offers.length}</b>}</span></button>
        <button aria-haspopup="dialog" onClick={() => openWindow('journal')}><HudIcon symbol="journal"/><span>Campaign journal</span></button>
        <button onClick={worldOverview}><HudIcon symbol="world"/><span>World overview</span></button>
      </nav><div className="map-controls"><button aria-label="Zoom in" onClick={() => renderer.current?.zoom(1.25)}>+</button><button aria-label="Zoom out" onClick={() => renderer.current?.zoom(0.8)}>−</button><button onClick={showMap}>Focus selection</button><button disabled={battleActive || selection.cell === undefined} onClick={() => { if (selection.cell !== undefined) openMapActions(selection.cell); }}>Open map actions</button><button aria-label="Map guide" title="Map guide" aria-haspopup="dialog" onClick={() => openWindow('guide')}>?</button></div><div className="map-legend"><span>⌂ Settlement</span><span title="One figure: 1 formation; two: 2–5; three: 6+. A stack shows the selected army, otherwise its largest army. Exact composition is in the army inspector.">△ Army size: 1 / 2–5 / 6+</span><span title="Co-located armies share one representative group; fleets group separately and embarked troops are not drawn. Click a hex repeatedly to cycle your forces.">×N armies on hex</span><span>◆ Your realm</span><span>Dim terrain: explored</span>{artStatus && <span data-testid="art-runtime-status" title={[artStatus.message, ...artStatus.warnings].join(" ")}>Art: {artStatus.state === 'loading' ? 'loading' : artStatus.state === 'fallback' ? 'procedural fallback' : artStatus.warnings.length ? 'partial pixel pack' : 'approved pixel pack'}</span>}</div><BattlefieldPanel key={registryEpoch} view={observation} transfer={battleTransfer} busy={controlLocked} error={error} replay={battleReview} suspended={showSetup || progressionOpen || Boolean(characterContext) || chroniclesOpen || artLabOpen || Boolean(managementWindow) || generating} issue={command} setScene={setBattleScene} keepReview={() => setBattleReview(true)} closeReview={() => setBattleReview(false)}/><CapturePanel view={observation} busy={controlLocked} issue={command}/></section>
    </main>}
    {observation && popupActive && mapPopup && popupChoice && <MapActions
      sessionKey={`${registryEpoch}:${mapPopup.serial}`} anchor={mapPopup.anchor} presentation={army ? 'compact' : 'default'} manageLabel="Open full orders"
      title={popupChoice.kind === 'tile' ? `Hex ${mapPopup.cell}` : army?.name ?? settlement?.name ?? popupChoice.label}
      subtitle={army ? undefined : `${observation.treasury} coin · ${observation.knowledge} knowledge · Turn ${observation.turn}`}
      choices={popupChoices} selectedId={popupChoice.id} onSelect={id => {
        const choice = popupChoices.find(item => item.id === id); if (!choice) return;
        select(choice.selection); const next = { ...mapPopup, choiceId: id, initialTab: choice.kind === 'tile' ? 'land' : undefined };
        mapPopupRef.current = next; setMapPopup(next);
      }}
      tabs={popupTabs.map(tab => ({ ...tab, render: () => <fieldset className="strategic-orders" disabled={ordersBusy}>{tab.render()}</fieldset> }))}
      initialTab={mapPopup.initialTab} summary={<><p className="field-help">{army ? `${army.formations.length} / ${army.formationCapacity} formations · ${army.strength} strength · ${army.movement} movement` : settlement ? `${settlement.population} people · ${settlement.queue.length} queued projects` : 'Inspection only. Unknown or foreign tiles do not grant management access.'}</p>{busy && <p role="status">Resolving orders…</p>}{error && <p role="alert">{feedback}</p>}</>}
      onClose={closeMapActions} returnFocus={mapHost.current} onManageInPanel={manageInPanel}
      suspended={progressionOpen || Boolean(characterContext) || chroniclesOpen || artLabOpen}
    />}
    {observation && managementWindow && !showSetup && !battleActive && !observation.pendingCapture && <CampaignWindow key={managementWindow} title={{ registry: 'Realm registry', orders: 'Selected orders', affairs: 'Realm affairs', journal: 'Campaign journal', guide: 'Map guide' }[managementWindow]} subtitle={managementWindow === 'orders' ? army?.name ?? settlement?.name ?? 'Map inspection' : realmName} close={() => setManagementWindow(undefined)} returnFocus={mapHost.current}>
      {managementWindow === 'registry' && <RealmRoster key={registryEpoch} view={observation} registry={registry} search={search} force={forceFilter} selection={selection} choose={setRegistry} setSearch={setSearch} setForce={setForceFilter} characters={() => openCharacters()} select={next => { mapFocusAfterWindow.current = true; select(next, true); setManagementWindow(undefined); }}/>}
      {managementWindow === 'orders' && <section className="inspector" aria-label="Selected entity orders"><button className="window-map-link" onClick={showMap}>Show on map</button><fieldset className="strategic-orders" disabled={ordersBusy}>{panes?.sidebar}</fieldset></section>}
      {managementWindow === 'affairs' && <section data-testid="realm-affairs"><FactionEncounters view={observation} busy={controlLocked} issue={command} stateHash={hash.current} review={reviewPeace}/><PublicProjects view={observation} locate={cell => { mapFocusAfterWindow.current = true; select({ cell }, true); setManagementWindow(undefined); }}/><SiegeLedger view={observation} locate={cell => { mapFocusAfterWindow.current = true; renderer.current?.focus(cell); setManagementWindow(undefined); }}/></section>}
      {managementWindow === 'journal' && <><RealmJournal view={observation} locate={cell => { mapFocusAfterWindow.current = true; select({ cell }, true); setManagementWindow(undefined); }}/><BattleHistory view={observation} replayId={battleTransfer?.packet.battleId} replay={() => { pauseWatch(); setManagementWindow(undefined); setBattleReview(true); }}/>{observation.victory && <button onClick={openChronicles}>Read campaign chronicles</button>}</>}
      {managementWindow === 'guide' && <section className="map-guide"><h3>Rule from the map</h3><p>Select a force, then choose <strong>Move on map</strong> and click a reachable hex or enemy. A distant destination opens a route review before any order is issued. Shift-click adds waypoints. Journeys pause when danger, another faction, or an event blocks them.</p><p>Click a settlement to build or recruit. Click its surrounding land to inspect yields, improve a tile, or grow its borders. All prices and restrictions come from the current campaign.</p><p>The floating buttons open your rosters, research, characters, diplomacy and journal. The bottom tray follows your selected army or town. Full orders provide the same controls in a larger window.</p><h3>Navigation &amp; shortcuts</h3><p>Drag to pan; scroll or ± to zoom. World overview fits the entire map. Arrow keys pan when the map is focused. Enter opens local actions. Escape closes the current window before clearing the map selection.</p><p><kbd>{armyKey.toUpperCase()}</kbd> next army · <kbd>{settlementKey.toUpperCase()}</kbd> next idle settlement · Shift + shortcut selects the previous entry. Active journeys, siege duty, embarked troops and stationary missions are skipped; interrupted routes still need review.</p><p>Change text size and key bindings in Campaign &amp; settings. Map click menus can be disabled; full orders and keyboard navigation remain available.</p><button aria-pressed={mapOnly} onClick={() => setMapOnly(!mapOnly)}>{mapOnly ? 'Show command tray' : 'Hide command tray'}</button></section>}
    </CampaignWindow>}
    <footer className={'command-bar' + (battleActive && !showSetup ? ' battle-command-bar' : '')} ref={commandBar}>
      {observation && !showSetup && !battleActive && !mapOnly && <div className="hud-selection" data-testid="current-selection"><FactionArt contentId="ui.banner" definitionId={realm?.definitionId} label="Selected realm banner" compact decorative/><div className="hud-selection-copy"><small>{army ? army.domain === 'naval' ? 'Selected fleet' : army.carrierId ? 'Embarked army' : 'Selected army' : settlement ? 'Selected settlement' : 'Your realm'}</small><strong>{army?.name ?? settlement?.name ?? 'Select a force or hearth'}</strong><span>{army ? `${army.formations.length} / ${army.formationCapacity} formations · ${army.strength} strength · ${army.movement} movement` : settlement ? `${settlement.population} people · ${settlement.queue.length} queued projects` : 'Explore the map or open a roster.'}</span><div className="hud-selection-actions"><button disabled={!army && !settlement && selection.cell === undefined} aria-haspopup="dialog" onClick={manageInPanel}>Show selected orders</button><button disabled={selection.cell === undefined} onClick={showMap}>Show on map</button></div></div></div>}
      {observation && !showSetup && !battleActive && <section className="hud-next-actions" aria-label="Next-action navigation" data-testid="next-action-navigation">
        <p className="field-help" data-testid="next-action-counts">{nextActions.armies.length} needing orders · {nextActions.settlements.length} idle settlements</p>
        <div><button disabled={navigationLocked || nextActions.armies.length === 0} aria-label="Previous army needing orders" title="Previous army needing orders" onClick={() => jumpToAction('army', -1)}>‹</button><button disabled={navigationLocked || nextActions.armies.length === 0} aria-label="Next army needing orders" aria-keyshortcuts={armyKey.toUpperCase()} onClick={() => jumpToAction('army')}>Next army <kbd>{armyKey.toUpperCase()}</kbd></button><button disabled={navigationLocked || nextActions.settlements.length === 0} aria-label="Previous idle settlement" title="Previous idle settlement" onClick={() => jumpToAction('settlement', -1)}>‹</button><button disabled={navigationLocked || nextActions.settlements.length === 0} aria-label="Next idle settlement" aria-keyshortcuts={settlementKey.toUpperCase()} onClick={() => jumpToAction('settlement')}>Next town <kbd>{settlementKey.toUpperCase()}</kbd></button></div>
        <span role="status" aria-live="polite" data-testid="next-action-notice" className="field-help">{navigationNotice}</span>
      </section>}
      {observation && <div className="hud-end-turn">{(observation.battle || observation.pendingCapture) && <p id="battle-blocker" className="battle-blocker">{observation.pendingCapture ? 'Resolve the settlement capture before ending the turn.' : 'Resolve the pending battle before ending the turn.'}</p>}<div className="turn"><small>AGE OF FRACTURE</small><strong data-testid="turn-counter">Turn {observation.turn}</strong></div><button className="primary end-turn" aria-label="End turn" aria-describedby={observation.battle || observation.pendingCapture ? 'battle-blocker' : undefined} disabled={ordersBusy || showSetup} onClick={endTurn}>End turn <kbd>{turnKey.toUpperCase()}</kbd></button></div>}
      <div className={'feedback ' + (error ? 'error' : '')} data-testid="feedback" role={error ? 'alert' : 'status'} aria-live="polite"><span className="status-mark" aria-hidden="true">{error ? '!' : '◆'}</span>{busy && !generating ? 'Resolving… ' : ''}{feedback}</div>
    </footer>
    {observation && progressionOpen && <CampaignProgression view={observation} busy={controlLocked} issue={command} locate={cell => select({ cell }, true)} close={() => setProgressionOpen(false)}/>}
    {observation && characterContext && <CharacterRegistry view={observation} busy={controlLocked} working={busy} initialCharacterId={characterContext.characterId} initialArmyId={characterContext.armyId} feedback={feedback} error={error} issue={command} close={() => setCharacterContext(undefined)} locate={character => { mapFocusAfterWindow.current = true; closeMapActions(); setCharacterContext(undefined); setManagementWindow(undefined); const location = character.location; if (character.cell !== null) { setSearch(''); setForceFilter('all'); if (location) setRegistry(location.kind === 'army' ? 'armies' : 'settlements'); select({ cell: character.cell, ...(location?.kind === 'army' ? { armyId: location.armyId } : location?.kind === 'settlement' ? { settlementId: location.settlementId } : {}) }, true); } }}/>}
    {import.meta.env.DEV && <div className="art-dev-launch"><button onClick={() => { pauseWatch(); setArtLabOpen(true); }}>Art Lab</button><small>Development asset inspector</small></div>}
    {DevelopmentArtLab && artLabOpen && <Suspense fallback={<p role="status">Opening the development art inspector…</p>}><DevelopmentArtLab close={() => setArtLabOpen(false)}/></Suspense>}
    {observation?.victory && chroniclesOpen && <CampaignChronicles documents={documents} error={chronicleError} turn={observation.turn} close={() => setChroniclesOpen(false)}/>}
  </div>;
}

declare global {
  interface Window {
    __THEANDRIL__?: {
      getCellScreenPoint(cell: number): ReturnType<WorldRenderer['projectCell']>;
      getArtDiagnostics(): ReturnType<WorldRenderer['getArtDiagnostics']> | undefined;
      getBattleDiagnostics(): ReturnType<WorldRenderer['getBattleDiagnostics']> | undefined;
      getTerrainArt(cell: number): ReturnType<WorldRenderer['getTerrainArt']>;
      getMovement(): { reachable: MovementQuery['reachable']; preview?: MovementQuery['preview']; route?: Observation['routes'][number] } | undefined;
      getTurn(): number; getStateHash(): string; getSelection(): Selection;
      getPerformanceCounters(): WorkerMetrics & Partial<ReturnType<WorldRenderer['getMetrics']>>;
      getSummary(): (Observation & { campaign: CampaignInfo; watch: { enabled: boolean; running: boolean; fogEnabled: boolean }; ownArmies: Observation['armies']; ownSettlements: Observation['settlements']; exploredCells: number }) | undefined;
    };
  }
}

createRoot(document.getElementById('root')!).render(<App/>);
