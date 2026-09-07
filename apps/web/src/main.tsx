import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { BUILDINGS, CAMPAIGN_PACES, FACTIONS, UNITS } from '@theandril/content';
import { BIOME_NAMES, RECOMMENDED_FACTION_COUNTS, WATER_DEPTH_NAMES, neighbors, type MapSize } from '@theandril/mapgen';
import type { CampaignPace, GameCommand, MovementQuery, Observation, PeaceAssessment, PeaceTerms } from '@theandril/sim';
import { WorldRenderer, type ArtStatus, type MapPointerInput } from '@theandril/render';
import { MovementMapHint, MovementOrders, useMapMovement, type MapMovement, type MovementReview } from './movement';
import type { CampaignInfo, Request, Response, WorkerMetrics } from './protocol';
import type { CampaignMode, ChronicleDocuments } from '@theandril/chronicle';
import { CampaignChronicles } from './chronicles';
import { CampaignProgression, PublicProjects } from './progression';
import { AttackOrders, BattleHistory, BattlePanel } from './warfare';
import { ArmyComposition } from './army';
import { RealmNavigation, RealmRegistry } from './realm-navigation';
import { ArmyCharacters, CharacterAppointments, CharacterRegistry } from './characters';
import { FactionEncounters } from './diplomacy';
import { FactionArt, PublicCultures } from './faction-art';
import { NavalTransport, SettlementProduction } from './naval';
import { FactionSelection, SettlementLand } from './land';
import type { LandQuery, LandQueryResult } from './use-land-query';
import { unpackCells } from './cell-transfer';
import { actionCandidates, actionShortcut, loadShortcuts, nextAction, saveShortcuts, shortcutError, SHORTCUT_STORAGE_KEY, type ActionKind, type Direction, type ShortcutBindings } from './next-action';
import { CapturePanel, RuinInspection, SettlementDefense, SiegeLedger, SiegeOrders } from './siege';
import './style.css';
import './campaign-records.css';
import './movement.css';
import './art-status.css';
import './land.css';
import './border-growth.css';

type Selection = { armyId?: string; settlementId?: string; cell?: number };
type RequestBody = Request extends infer R ? R extends Request ? Omit<R, 'id'> : never : never;
const terrainNames = ['Water', 'Plains', 'Forest', 'Hills', 'Mountains'];
const content = [...BUILDINGS, ...UNITS];
const itemName = (id: string) => content.find(item => item.id === id)?.name ?? id;
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
  const registryHost = useRef<HTMLElement>(null);
  const inspectorHost = useRef<HTMLElement>(null);
  const commandBar = useRef<HTMLElement>(null);
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
  const [selection, setSelection] = useState<Selection>({});
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
  const [campaign, setCampaign] = useState<CampaignInfo>({ mode: 'player', coverage: 'complete' });
  const campaignRef = useRef<CampaignInfo>({ mode: 'player', coverage: 'complete' });
  const [watchRunning, setWatchRunning] = useState(false);
  const watchRunningRef = useRef(false);
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [characterContext, setCharacterContext] = useState<{ characterId?: string; armyId?: string }>();
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
  const mapSelect = (cell: number, input: MapPointerInput) => {
    const current = selectionRef.current, view = observationRef.current;
    // Own claim summaries are authoritative player knowledge. Do not infer an
    // owner from unseen map art or intercept an army's move/attack/waypoint click.
    if (!current.armyId && view) {
      const friendlyArmy = view.armies.some(item => item.cell === cell && !item.carrierId && item.factionId === view.factionId);
      const land = !friendlyArmy ? view.land.settlements.find(town => town.claimed.includes(cell)) : undefined;
      const town = land && view.settlements.find(item => item.id === land.settlementId && item.factionId === view.factionId);
      if (town) { select({ settlementId: town.id, cell }); return; }
      if (friendlyArmy) { movementRef.current?.click(cell, input); return; }
    }
    if (current.settlementId && view?.land.settlements.some(town => town.settlementId === current.settlementId)) {
      const town = view.settlements.find(item => item.cell === cell && item.factionId === view.factionId);
      select({ settlementId: town?.id ?? current.settlementId, cell }); return;
    }
    movementRef.current?.click(cell, input);
  };
  const mapHover = (cell: number | undefined) => { movementRef.current?.hover(cell); };
  const receive = (event: MessageEvent<Response>) => {
    const response = event.data;
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
        pendingFound.current = undefined;
        setRegistryEpoch(value => value + 1); setSearch(''); setForceFilter('all');
        pauseWatch(); setProgressionOpen(false); setChroniclesOpen(false); setCharacterContext(undefined);
        openedVictory.current = '';
        for (const query of movementQueries.current.values()) query.reject(new Error('The loaded campaign changed. Review the route again.'));
        movementQueries.current.clear();
        documentsRef.current = undefined; setDocuments(undefined); setChronicleError(''); chronicleQuery.current = undefined;
      }
      if (response.observation.victory) pauseWatch();
      renderer.current ??= new WorldRenderer(setArtStatus);
      renderer.current.update({ ...response.observation, cells }, response.reset);
      // React receives only the empire read model; explored cells stay in the renderer.
      const view = { ...response.observation, cells: [] };
      observationRef.current = view; setObservation(view); setShowSetup(false);
      const current = selectionRef.current;
      const army = view.armies.find(item => item.id === current.armyId);
      const settlement = view.settlements.find(item => item.id === current.settlementId);
      const found = pendingFound.current?.requestId === response.id ? pendingFound.current : undefined;
      if (found) pendingFound.current = undefined;
      const foundedTown = found && found.selectionRevision === selectionRevision.current && current.armyId === found.armyId
        ? view.settlements.find(item => item.factionId === view.factionId && item.cell === found.cell) : undefined;
      if (foundedTown) {
        setRegistry('settlements'); select({ settlementId: foundedTown.id, cell: foundedTown.cell }, true);
      } else if (found && found.selectionRevision !== selectionRevision.current) {
        // The player inspected another entity or cleared selection while the order resolved.
        if (army) select({ armyId: army.id, cell: army.cell });
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
  const command = (order: GameCommand) => {
    if (campaignRef.current.mode === 'watch' || observationRef.current?.victory) return;
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
    for (const query of movementQueries.current.values()) query.reject(new Error('Review routes again after returning to this campaign.'));
    movementQueries.current.clear();
    for (const query of peaceQueries.current.values()) query.reject(new Error('Review peace terms again after returning to this campaign.'));
    peaceQueries.current.clear();
    if (worker.current) { previousWorker.current = worker.current; worker.current = undefined; }
    setGenerating(true); send({ type: 'new', seed: value, size, mode: newMode, pace, factionCount: count, factionDefinitionId });
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
    if (!watchRunning || busy || showSetup || campaign.mode !== 'watch' || !observation || observation.victory) return;
    // No interval or queued batches: schedule only after the preceding response.
    const timer = setTimeout(() => {
      if (!watchRunningRef.current || !worker.current || observationRef.current?.victory || campaignFault.current) return;
      setBusy(true); setError(false);
      worker.current.postMessage({ id: ++sequence.current, type: 'watchRound' });
    }, 250);
    return () => clearTimeout(timer);
  }, [watchRunning, busy, showSetup, campaign.mode, observation]);
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
      if (event.defaultPrevented || document.querySelector('dialog[open]') || event.composedPath().some(node => node instanceof HTMLDialogElement)) return;
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
      getTerrainArt: cell => renderer.current?.getTerrainArt(cell),
      getStateHash: () => hash.current,
      getSelection: () => ({ ...selectionRef.current }),
      getPerformanceCounters: () => ({ ...metrics.current, ...renderer.current?.getMetrics() }),
      getSummary: () => {
        const view = observationRef.current;
        return view ? { ...view, campaign: { ...campaignRef.current }, watch: { enabled: campaignRef.current.mode === 'watch', running: watchRunningRef.current }, ownArmies: view.armies.filter(item => item.factionId === view.factionId), ownSettlements: view.settlements.filter(item => item.factionId === view.factionId), exploredCells: renderer.current?.getExploredCount() ?? 0 } : undefined;
      },
    };
    return () => { delete window.__THEANDRIL__; };
  }, []);

  const ownArmies = observation?.armies.filter(item => item.factionId === observation.factionId) ?? [];
  const ownSettlements = observation?.settlements.filter(item => item.factionId === observation.factionId) ?? [];
  const army = ownArmies.find(item => item.id === selection.armyId);
  const settlement = ownSettlements.find(item => item.id === selection.settlementId);
  const selectedCell = selection.cell === undefined ? undefined : renderer.current?.inspect(selection.cell);
  const near = army && observation ? neighbors(army.cell, observation.width, observation.height) : [];
  const factionId = observation?.factionId ?? '';
  const realm = observation?.factions.find(faction => faction.id === factionId);
  const realmName = realm?.name ?? factionId;
  const controlLocked = busy || recoveryRequired || campaign.mode === 'watch' || Boolean(observation?.victory);
  const ordersBusy = controlLocked || Boolean(observation?.battle || observation?.pendingCapture);
  const navigationLocked = ordersBusy || showSetup || !observation;
  const nextActions = useMemo(() => observation ? actionCandidates(observation) : { armies: [], settlements: [] }, [observation]);
  const jumpToAction = (kind: ActionKind, direction: Direction = 1) => {
    if (navigationLocked) return;
    const current = selectionRef.current;
    const candidate = nextAction(kind === 'army' ? nextActions.armies : nextActions.settlements, kind === 'army' ? current.armyId : current.settlementId, direction);
    if (!candidate) { setNavigationNotice(kind === 'army' ? 'No armies currently need orders or route review.' : 'No idle settlements have an available production order.'); return; }
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
  const showRegistry = (kind: 'armies' | 'settlements') => {
    setRegistry(kind);
    registryHost.current?.scrollIntoView({ block: 'nearest' });
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 64 * 1024 * 1024) { setError(true); setFeedback('Save file exceeds the 64 MiB limit.'); return; }
    try { send({ type: 'import', bytes: new Uint8Array(await file.arrayBuffer()) }); }
    catch (cause) { setError(true); setFeedback('Could not read save: ' + String(cause)); }
  };
  const persistence = <><button disabled={busy} onClick={() => send({ type: 'load' })}>Load campaign</button><button disabled={busy} onClick={() => send({ type: 'loadAuto' })}>Restore autosave</button><button disabled={busy} onClick={() => fileInput.current?.click()}>Import campaign</button></>;

  return <div className="application" style={{ '--text-scale': textScale } as React.CSSProperties}>
    <input className="file-input" ref={fileInput} type="file" aria-label="Import save file" accept=".theandril,application/gzip" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} />
    <header className="masthead"><div className="wordmark"><Crest/><div><span className="eyebrow">The age of fracture</span><h1>Theandril</h1></div></div><span className="edition">CAMPAIGN FOUNDATION <span>0.1</span></span>{observation && <div className="resources"><div><small>TREASURY</small><strong>{observation.treasury}<span> coin</span></strong></div><div><small>KNOWLEDGE</small><strong>{observation.knowledge}</strong></div><div><small>YOUR REALM</small><strong>{ownSettlements.length}<span> hearths</span></strong></div></div>}</header>
    {observation && !showSetup && <nav className="campaign-tools" aria-label="Campaign navigation"><RealmNavigation registry={registry} armyCount={ownArmies.length} townCount={ownSettlements.length} characterCount={observation.characters.length} choose={showRegistry} characters={() => openCharacters()} selectionName={army?.name ?? settlement?.name} selectionKind={army ? army.domain === 'naval' ? 'Selected fleet' : army.carrierId ? 'Embarked army' : 'Selected army' : settlement ? 'Selected settlement' : undefined} showMap={() => { if (selection.cell !== undefined) renderer.current?.focus(selection.cell); mapHost.current?.scrollIntoView({ block: 'center' }); mapHost.current?.focus({ preventScroll: true }); }} showOrders={() => { inspectorHost.current?.scrollIntoView({ block: 'start' }); inspectorHost.current?.focus({ preventScroll: true }); }}/><span className="campaign-pace">{CAMPAIGN_PACES[observation.pace].name} pace · <span data-testid="campaign-faction-count">{observation.factionCount} realms</span></span><button onClick={() => { pauseWatch(); setProgressionOpen(true); }}>Realm progression</button>
      {campaign.mode === 'watch' && <section className="watch-controls" data-testid="watch-controls" aria-label="AI watch controls"><span>{observation.victory ? 'AI watch complete' : watchRunning ? 'AI watch running' : busy ? 'Pausing after this round…' : 'AI watch paused'}</span><button disabled={Boolean(observation.victory) || (busy && !watchRunning)} onClick={() => { if (watchRunningRef.current) pauseWatch(); else { watchRunningRef.current = true; setWatchRunning(true); } }}>{watchRunning ? 'Pause AI watch' : 'Resume AI watch'}</button><button disabled={busy || watchRunning || Boolean(observation.victory)} onClick={() => send({ type: 'watchRound' })}>Step one round</button></section>}
      <span className="archive-note">{campaign.coverage === 'complete' ? 'Recording the full campaign' : 'Partial archive · earlier history unavailable'}</span>
      {observation.victory && <button onClick={openChronicles}>Campaign chronicles</button>}
    </nav>}
    <details className="campaign-options" data-testid="campaign-menu"><summary>Campaign & settings</summary><div className="options-content">{observation && <><button disabled={busy} onClick={() => send({ type: 'save' })}>Save campaign</button><button disabled={busy} onClick={() => send({ type: 'export' })}>Export campaign</button>{persistence}<button disabled={busy} onClick={() => { pauseWatch(); setShowSetup(true); }}>New campaign</button></>}<label>Text scale<select value={textScale} onChange={event => setTextScale(event.target.value)}><option value="1">100%</option><option value="1.15">115%</option><option value="1.3">130%</option></select></label><label>End turn shortcut<input value={turnKey} maxLength={1} onChange={event => changeShortcut('turn', event.target.value)}/></label><label>Next army shortcut<input value={armyKey} maxLength={1} onChange={event => changeShortcut('army', event.target.value)}/></label><label>Next settlement shortcut<input value={settlementKey} maxLength={1} onChange={event => changeShortcut('settlement', event.target.value)}/></label>{bindingError && <p role="alert">{bindingError}</p>}</div></details>
    {!observation || showSetup ? <main className="landing">
      <div className="opening"><span className="eyebrow">Keep the hearth. Keep the oath.</span><h2>From the ashes,<br/>a new dominion.</h2><p>The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future.</p><div className="opening-rule"/><p className="subtle">Found a hearth. Work its land.<br/>Send wayfinders into the unknown.</p></div>
      <section className="setup panel"><span className="eyebrow">A chronicle begins</span><h2>Establish your campaign</h2><div className="faction-card"><FactionArt contentId="ui.crest" definitionId={factionDefinitionId} label="Selected culture crest" decorative/><div><h3>{FACTIONS.find(faction => faction.id === factionDefinitionId)?.name}</h3><p>Your chosen player seat</p></div></div>
        <form onSubmit={begin}>
          <FactionSelection value={factionDefinitionId} onChange={setFactionDefinitionId}/>
          <label>World seed<input name="seed" inputMode="numeric" value={seed} onChange={event => setSeed(event.target.value)} required/></label>
          <label>World size<select value={size} onChange={event => changeWorldSize(event.target.value as MapSize)}><option value="tiny">Tiny · 1,536 hexes · quick campaign</option><option value="small">Small · 40,960 hexes</option><option value="standard">Standard · 98,304 hexes</option><option value="huge">Huge · 196,608 hexes</option><option value="legendary">Legendary · 307,200 hexes</option></select></label>
          <label>Faction count<input type="number" min={2} max={48} step={1} required value={factionCount} aria-describedby="faction-density-help" onChange={event => setFactionCount(event.target.value)}/></label>
          <p id="faction-density-help" className="field-help" data-testid="faction-density-help">Recommended for this size: {RECOMMENDED_FACTION_COUNTS[size]} realms. Changing world size resets this recommendation; you can override it. {FACTIONS.length} introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced.</p>
          <label>Campaign pace<select value={pace} onChange={event => setPace(event.target.value as CampaignPace)}><option value="short">Short · test/skirmish</option><option value="standard">Standard · hundreds of turns</option><option value="long">Long · extended campaign</option><option value="epic">Epic · longest campaign</option></select></label>
          <p className="field-help">{CAMPAIGN_PACES[pace].description} Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.</p>
          <label>Campaign mode<select value={newMode} onChange={event => setNewMode(event.target.value as CampaignMode)}><option value="player">Lead a realm</option><option value="watch">AI watch</option></select></label>
          {newMode === 'watch' && <p className="field-help">AI controls every configured realm through the same rules. Observe from your selected culture’s permitted map view, pause or step rounds, then read both all-faction chronicles after victory.</p>}
          <p className="field-help">The same seed, size and faction count create the same world. Giant maps need enough realms to create nearby rivals; terrain can still separate them.</p>
          <button className="primary begin" disabled={busy} type="submit">{generating ? 'Shaping the world…' : 'Begin campaign'}<span aria-hidden="true">→</span></button>
        </form>{generating && <button className="wide" onClick={cancel}>Cancel generation</button>}<div className="save-actions">{persistence}</div>{observation && <button className="wide" onClick={() => setShowSetup(false)}>Return to campaign</button>}</section>
      <PublicCultures/>
    </main> : null}
    {observation?.victory && !showSetup && <section className="victory-banner" data-testid="victory-result" aria-label="Campaign result"><span className="eyebrow">The witnesses seal the book</span><h2>{observation.factions.find(faction => faction.id === observation.victory?.factionId)?.name ?? observation.victory.factionId} achieved Prosperity</h2><p>Turn {observation.victory.turn} · The Hearth Exchange is complete. Campaign orders have ended.</p><button className="primary" onClick={openChronicles}>Read campaign chronicles</button></section>}
    {observation && <main className="campaign" style={showSetup ? { display: 'none' } : undefined}>
      <aside className="empire panel" ref={registryHost}><div className="realm-heading faction-art-heading"><FactionArt contentId="ui.crest" definitionId={realm?.definitionId} label={`${realmName} crest`} compact/><div><span className="eyebrow">Your people</span><h2>{realmName}</h2></div></div><label className="search-label">Search your realm<input type="search" value={search} placeholder="Find a name or stable ID" onChange={event => setSearch(event.target.value)}/></label>
        <section className="next-action-compact" aria-label="Next-action navigation" data-testid="next-action-navigation" style={{ display: 'grid', gap: 6, margin: '12px 0' }}>
          <p className="field-help" data-testid="next-action-counts">{nextActions.armies.length} {nextActions.armies.length === 1 ? 'army' : 'armies'} needing orders · {nextActions.settlements.length} idle {nextActions.settlements.length === 1 ? 'settlement' : 'settlements'} with available production</p>
          <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 6 }}>
            <button type="button" disabled={navigationLocked || nextActions.armies.length === 0} aria-label="Previous army needing orders" title="Previous army needing orders" aria-keyshortcuts={`Shift+${armyKey.toUpperCase()}`} onClick={() => jumpToAction('army', -1)}>←</button>
            <button type="button" disabled={navigationLocked || nextActions.armies.length === 0} aria-label="Next army needing orders" aria-keyshortcuts={armyKey.toUpperCase()} onClick={() => jumpToAction('army')}>Army needing orders <kbd>{armyKey.toUpperCase()}</kbd></button>
            <button type="button" disabled={navigationLocked || nextActions.settlements.length === 0} aria-label="Previous idle settlement" title="Previous idle settlement" aria-keyshortcuts={`Shift+${settlementKey.toUpperCase()}`} onClick={() => jumpToAction('settlement', -1)}>←</button>
            <button type="button" disabled={navigationLocked || nextActions.settlements.length === 0} aria-label="Next idle settlement" aria-keyshortcuts={settlementKey.toUpperCase()} onClick={() => jumpToAction('settlement')}>Idle town <kbd>{settlementKey.toUpperCase()}</kbd></button>
          </div>
          <details><summary>Navigation rules & shortcuts</summary><p className="field-help">Shift + shortcut selects the previous entry. Active journeys, siege duty, embarked troops and stationary missions are skipped; paused routes need review even without movement. Navigation clears filters, not orders. Shortcuts can be changed in Campaign & settings.</p></details>
          <p role="status" aria-live="polite" data-testid="next-action-notice" className="field-help">{navigationNotice}</p>
        </section>
        <section id="realm-registry-panel" role="tabpanel" aria-labelledby={`realm-tab-${registry}`}>
          {registry === 'armies' && <label className="force-filter">Force type<select value={forceFilter} onChange={event => setForceFilter(event.target.value)}><option value="all">All armies & fleets</option><option value="land">Land armies ashore</option><option value="naval">Fleets</option><option value="embarked">Embarked armies</option></select></label>}
          <RealmRegistry key={registryEpoch} view={observation} registry={registry} search={search} force={forceFilter} selection={selection} select={next => select(next, true)}/>
        </section>
        <PublicProjects view={observation} locate={cell => select({ cell }, true)}/>
        <details className="realm-ledgers" data-testid="realm-affairs" open={observation.diplomacy.offers.some(offer => offer.recipientId === factionId)}><summary>Realm affairs <span>{observation.factions.length - 1} contacts · {observation.wars.length} wars{observation.diplomacy.offers.some(offer => offer.recipientId === factionId) ? ' · Incoming peace offer' : ''}</span></summary>
        <FactionEncounters view={observation} busy={controlLocked} issue={command} stateHash={hash.current} review={reviewPeace}/>
        <SiegeLedger view={observation} locate={cell => renderer.current?.focus(cell)}/>
        </details>
        {!ownSettlements.length && <div className="realm-tip"><span className="eyebrow">The first hearth</span><p>Found a settlement with your caravan, then choose construction or recruitment. End the turn to gather yields and complete production.</p></div>}<details className="chronicle"><summary>Chronicle <span>{observation.events.length}</span></summary><ol data-testid="chronicle">{observation.events.slice(-16).reverse().map((event, index) => <li key={`${event.turn}-${index}`}><small>TURN {event.turn}</small>{event.message}{event.cell !== undefined && <button aria-label={`Locate event: ${event.message}`} onClick={() => { if (event.cell !== undefined) renderer.current?.focus(event.cell); }}>Locate</button>}</li>)}</ol></details>
      </aside>
      <section className="map-section" aria-label="Strategic map"><div className="map-title"><span className="eyebrow">The uncharted marches</span><span>SEED {observation.seed} · {observation.width} × {observation.height}</span></div><div className="map-host" data-testid="map-container" ref={mapHost} tabIndex={0} aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom. Arrow keys pan; plus and minus zoom. Escape clears selection. The army panel has keyboard and touch route controls." onKeyDown={event => { const moves: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] }; const move = moves[event.key]; if (move) { event.preventDefault(); renderer.current?.pan(...move); } if (event.key === '+' || event.key === '=') renderer.current?.zoom(1.2); if (event.key === '-') renderer.current?.zoom(1 / 1.2); }}/><MovementMapHint movement={movement}/><div className="map-compass" aria-hidden="true"><span>N</span>✧</div><div className="map-controls"><button aria-label="Zoom in" onClick={() => renderer.current?.zoom(1.25)}>+</button><button aria-label="Zoom out" onClick={() => renderer.current?.zoom(0.8)}>−</button><button onClick={() => { if (selection.cell !== undefined) renderer.current?.focus(selection.cell); }}>Focus selection</button></div><div className="map-legend"><span>⌂ Settlement</span><span>△ Army</span><span>◆ Your realm</span><span>Dim terrain: explored</span>{artStatus && <span data-testid="art-runtime-status" title={[artStatus.message, ...artStatus.warnings].join(" ")}>Art: {artStatus.state === 'loading' ? 'loading' : artStatus.state === 'fallback' ? 'procedural fallback' : artStatus.warnings.length ? 'partial pixel pack' : 'approved pixel pack'}</span>}</div><BattlePanel view={observation} busy={controlLocked} issue={command}/><CapturePanel view={observation} busy={controlLocked} issue={command}/></section>
      <aside className="inspector panel inspector-jump" ref={inspectorHost} tabIndex={-1} aria-label="Selected entity orders"><fieldset className="strategic-orders" disabled={ordersBusy}>
        <span className="eyebrow">Orders & stewardship</span>
        {observation.pendingCapture ? <><h2>A settlement awaits</h2><p className="field-help">Choose its fate in the capture panel before issuing campaign orders.</p></>
          : observation.battle ? <><h2>Battle in progress</h2><p className="field-help">Current strength, morale, and fatigue are shown in the battle panel. Resolve the engagement before issuing campaign orders.</p></>
          : army ? <>
            <div className="faction-art-heading"><FactionArt contentId="ui.banner" definitionId={realm?.definitionId} label={`${realmName} army banner`}/><h2>{army.name}</h2></div>
            <p className="subtle">{army.domain === 'naval' ? 'Fleet · ' : army.carrierId ? 'Embarked army · ' : ''}{army.formations.length === 1 ? itemName(army.unitId) : `${army.formations.length} formations together`} · cell {army.cell}</p>
            <div className="stat-pair"><div><strong>{army.movement}</strong><small>Movement</small></div><div><strong>{army.strength}</strong><small>Strength</small></div></div>
            <ArmyCharacters army={army} open={characterId => openCharacters(characterId, army.id)}/>
            <NavalTransport key={`transport-${army.id}`} army={army} view={observation} busy={ordersBusy} issue={command} selectArmy={armyId => { const target = ownArmies.find(item => item.id === armyId); if (target) { setSearch(''); setForceFilter('all'); setRegistry('armies'); select({ armyId: target.id, cell: target.cell }, true); } }}/>
            {army.canFound && <form className="found-form" onSubmit={event => { event.preventDefault(); command({ type: 'found', factionId, armyId: army.id, name }); }}><label>Settlement name<input value={name} maxLength={40} required onChange={event => setName(event.target.value)}/></label><p className="field-help">One caravan formation becomes a settlement here. Any escorts remain, spend their remaining movement, and pause their travel order.</p><button className="primary wide" type="submit" disabled={busy}>Found settlement</button></form>}
            <MovementOrders movement={movement} view={observation} issue={command} locate={cell => select({ ...selectionRef.current, cell }, true)}/>
            <ArmyComposition key={army.id} army={army} view={observation} busy={ordersBusy} issue={command} inspectArmy={target => select({ armyId: target.id, cell: target.cell })}/>
            <h3 className="section-title">Single-step shortcuts</h3><p className="field-help">Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above.</p>
            <div className="nearby-cells">{near.map(cell => { const known = renderer.current?.inspect(cell); return <button key={cell} disabled={busy || Boolean(army.movementBlocker)} aria-label={`Move to cell ${cell}`} onClick={() => command({ type: 'move', factionId, armyId: army.id, target: cell })}><span>{known?.waterDepth ? WATER_DEPTH_NAMES[known.waterDepth] : terrainNames[known?.terrain ?? -1] ?? 'Unknown'}</span><small>Hex {cell}</small></button>; })}</div>
          </> : settlement ? <>
            <h2>{settlement.name}</h2><p className="subtle">A hearth of the {realmName} · cell {settlement.cell}</p>
            <div className="stat-pair"><div><strong>{settlement.population}</strong><small>Population</small></div><div><strong>{settlement.food}</strong><small>Stored food</small></div></div>
            <h3 className="section-title">Production queue</h3>
            {settlement.queue.length ? <ol className="production-queue">{settlement.queue.map((item, index) => <li key={index}><span>{itemName(item.itemId)}</span><small>{item.progress} / {content.find(definition => definition.id === item.itemId)?.cost} industry</small></li>)}</ol> : <p className="field-help">The hearth is idle. Choose a project below.</p>}
            <SettlementProduction key={settlement.id} view={observation} settlementId={settlement.id} busy={ordersBusy} issue={command}/>
            <SettlementLand key={settlement.id} view={observation} settlementId={settlement.id} selectedCell={selection.cell} busy={ordersBusy} issue={command} selectCell={cell => select({ settlementId: settlement.id, cell }, true)} query={reviewLand} stateHash={hash.current} queryEpoch={landEpoch} queryEnabled={!showSetup && !generating && !recoveryRequired}/>
            <SettlementDefense settlement={settlement} view={observation}/><CharacterAppointments view={observation} settlementId={settlement.id} busy={ordersBusy} issue={command} open={() => openCharacters()}/>
          </> : <><h2>The frontier awaits</h2><p>Select an army or settlement from the map or your realm registry to issue orders.</p></>}
        {army && !observation.battle && !observation.pendingCapture && <SiegeOrders army={army} view={observation} busy={ordersBusy} issue={command}/>}
        {army && !observation.battle && !observation.pendingCapture && <AttackOrders army={army} view={observation} busy={ordersBusy} issue={command} terrain={cell => renderer.current?.inspect(cell)?.terrain}/>}
        <RuinInspection view={observation} cell={selection.cell}/>
        {selection.cell !== undefined && <div className="hex-inspector"><span className="eyebrow">Selected hex {selection.cell}</span><p>{selectedCell ? `${selectedCell.waterDepth ? WATER_DEPTH_NAMES[selectedCell.waterDepth] : BIOME_NAMES[selectedCell.biome] ?? 'Unknown biome'} · ${terrainNames[selectedCell.terrain]} · fertility ${selectedCell.fertility} · ${selectedCell.visible ? 'in sight' : 'last explored'}` : 'Beyond known maps. Send a wayfinder or fleet to chart this region.'}</p></div>}
        {selectedCell?.settlementId && <p className="field-help" data-testid="land-ownership">{selectedCell.visible ? 'Claimed land' : 'Last known claim'} · {observation.factions.find(item => item.id === selectedCell.factionId)?.name ?? 'Unidentified realm'} · {observation.settlements.find(item => item.id === selectedCell.settlementId)?.name ?? 'Previously observed settlement'}{selectedCell.improvementId ? ` · ${selectedCell.improvementId.replace('improvement.', '').replaceAll('_', ' ')}` : ''}</p>}
      </fieldset></aside>
    </main>}
    {observation && !showSetup && <BattleHistory view={observation}/>}
    <footer className="command-bar" ref={commandBar}><div className={'feedback ' + (error ? 'error' : '')} data-testid="feedback" role={error ? 'alert' : 'status'} aria-live="polite"><span className="status-mark" aria-hidden="true">{error ? '!' : '◆'}</span>{busy && !generating ? 'Resolving… ' : ''}{feedback}</div>{observation && <>{(observation.battle || observation.pendingCapture) && <p id="battle-blocker" className="battle-blocker">{observation.pendingCapture ? 'Resolve the settlement capture before ending the turn.' : 'Resolve the pending battle before ending the turn.'}</p>}<div className="turn"><small>AGE OF FRACTURE</small><strong data-testid="turn-counter">Turn {observation.turn}</strong></div><button className="primary end-turn" aria-label="End turn" aria-describedby={observation.battle || observation.pendingCapture ? 'battle-blocker' : undefined} disabled={ordersBusy || showSetup} onClick={endTurn}>End turn <kbd>{turnKey.toUpperCase()}</kbd></button></>}</footer>
    {observation && progressionOpen && <CampaignProgression view={observation} busy={controlLocked} issue={command} locate={cell => select({ cell }, true)} close={() => setProgressionOpen(false)}/>}
    {observation && characterContext && <CharacterRegistry view={observation} busy={controlLocked} working={busy} initialCharacterId={characterContext.characterId} initialArmyId={characterContext.armyId} feedback={feedback} error={error} issue={command} close={() => setCharacterContext(undefined)} locate={character => { setCharacterContext(undefined); const location = character.location; if (character.cell !== null) { setSearch(''); setForceFilter('all'); if (location) setRegistry(location.kind === 'army' ? 'armies' : 'settlements'); select({ cell: character.cell, ...(location?.kind === 'army' ? { armyId: location.armyId } : location?.kind === 'settlement' ? { settlementId: location.settlementId } : {}) }, true); } }}/>}
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
      getTerrainArt(cell: number): ReturnType<WorldRenderer['getTerrainArt']>;
      getMovement(): { reachable: MovementQuery['reachable']; preview?: MovementQuery['preview']; route?: Observation['routes'][number] } | undefined;
      getTurn(): number; getStateHash(): string; getSelection(): Selection;
      getPerformanceCounters(): WorkerMetrics & Partial<ReturnType<WorldRenderer['getMetrics']>>;
      getSummary(): (Observation & { campaign: CampaignInfo; watch: { enabled: boolean; running: boolean }; ownArmies: Observation['armies']; ownSettlements: Observation['settlements']; exploredCells: number }) | undefined;
    };
  }
}

createRoot(document.getElementById('root')!).render(<App/>);
