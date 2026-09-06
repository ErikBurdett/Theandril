import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { BUILDINGS, CAMPAIGN_PACES, UNITS } from '@theandril/content';
import { BIOME_NAMES, RECOMMENDED_FACTION_COUNTS, neighbors, type MapSize } from '@theandril/mapgen';
import type { CampaignPace, GameCommand, MovementQuery, Observation, PeaceAssessment, PeaceTerms } from '@theandril/sim';
import { WorldRenderer, type ArtStatus, type MapPointerInput } from '@theandril/render';
import { MovementMapHint, MovementOrders, useMapMovement, type MapMovement, type MovementReview } from './movement';
import type { CampaignInfo, Request, Response, WorkerMetrics } from './protocol';
import type { CampaignMode, ChronicleDocuments } from '@theandril/chronicle';
import { CampaignChronicles } from './chronicles';
import { CampaignProgression, PublicProjects } from './progression';
import { AttackOrders, BattleHistory, BattlePanel } from './warfare';
import { ArmyComposition } from './army';
import { ArmyCharacters, CharacterAppointments, CharacterRegistry } from './characters';
import { FactionEncounters } from './diplomacy';
import { FactionArt, PublicCultures } from './faction-art';
import { CapturePanel, RuinInspection, SettlementDefense, SiegeLedger, SiegeOrders } from './siege';
import './style.css';
import './campaign-records.css';
import './movement.css';
import './art-status.css';

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
  const sequence = useRef(0);
  const movementQueries = useRef(new Map<number, { resolve: (value: MovementQuery) => void; reject: (error: Error) => void }>());
  const movementRef = useRef<MapMovement | undefined>(undefined);
  const peaceQueries = useRef(new Map<number, { resolve: (value: PeaceAssessment) => void; reject: (error: Error) => void }>());
  const observationRef = useRef<Observation | undefined>(undefined);
  const selectionRef = useRef<Selection>({});
  const selectionRevision = useRef(0);
  const pendingFound = useRef<{ requestId: number; armyId: string; cell: number; selectionRevision: number } | undefined>(undefined);
  const hash = useRef('');
  const metrics = useRef<WorkerMetrics>({ generationMs: 0, commandMs: 0, aiMs: 0, transferBytes: 0, totalTransferBytes: 0 });
  const [observation, setObservation] = useState<Observation>();
  const [selection, setSelection] = useState<Selection>({});
  const [seed, setSeed] = useState('748291');
  const [size, setSize] = useState<MapSize>('small');
  const [factionCount, setFactionCount] = useState(String(RECOMMENDED_FACTION_COUNTS.small));
  const changeWorldSize = (next: MapSize) => { setSize(next); setFactionCount(String(RECOMMENDED_FACTION_COUNTS[next])); };
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState('A world of broken oaths awaits a new beginning.');
  const [error, setError] = useState(false);
  const [name, setName] = useState('Cinderhearth');
  const [search, setSearch] = useState('');
  const [registry, setRegistry] = useState<'armies' | 'settlements'>('armies');
  const [textScale, setTextScale] = useState('1');
  const [turnKey, setTurnKey] = useState('e');
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
    renderer.current?.select(next.cell);
    if (focus && next.cell !== undefined) renderer.current?.focus(next.cell);
  };
  const mapSelect = (cell: number, input: MapPointerInput) => { movementRef.current?.click(cell, input); };
  const mapHover = (cell: number | undefined) => { movementRef.current?.hover(cell); };
  const receive = (event: MessageEvent<Response>) => {
    const response = event.data;
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
      if (previousWorker.current) { worker.current?.terminate(); worker.current = previousWorker.current; previousWorker.current = undefined; }
      setError(true); setFeedback(response.message); return;
    }
    setError(false);
    if (response.type === 'state') {
      previousWorker.current?.terminate(); previousWorker.current = undefined;
      hash.current = response.hash; metrics.current = response.metrics;
      campaignRef.current = response.campaign; setCampaign(response.campaign);
      if (response.reset) {
        pendingFound.current = undefined;
        pauseWatch(); setProgressionOpen(false); setChroniclesOpen(false); setCharacterContext(undefined);
        openedVictory.current = '';
        for (const query of movementQueries.current.values()) query.reject(new Error('The loaded campaign changed. Review the route again.'));
        movementQueries.current.clear();
        documentsRef.current = undefined; setDocuments(undefined); setChronicleError(''); chronicleQuery.current = undefined;
      }
      if (response.observation.victory) pauseWatch();
      renderer.current ??= new WorldRenderer(setArtStatus);
      renderer.current.update(response.observation, response.reset);
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
    instance.onmessage = receive;
    instance.onerror = event => {
      pendingFound.current = undefined;
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
    for (const query of movementQueries.current.values()) query.reject(new Error('Review routes again after returning to this campaign.'));
    movementQueries.current.clear();
    for (const query of peaceQueries.current.values()) query.reject(new Error('Review peace terms again after returning to this campaign.'));
    peaceQueries.current.clear();
    if (worker.current) { previousWorker.current = worker.current; worker.current = undefined; }
    setGenerating(true); send({ type: 'new', seed: value, size, mode: newMode, pace, factionCount: count });
  };
  const cancel = () => { worker.current?.terminate(); worker.current = previousWorker.current; previousWorker.current = undefined; setBusy(false); setGenerating(false); setFeedback('World generation cancelled.'); };

  useEffect(() => () => { worker.current?.terminate(); previousWorker.current?.terminate(); renderer.current?.destroy(); }, []);
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
      if (!watchRunningRef.current || !worker.current || observationRef.current?.victory) return;
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
      if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
      if (event.key === 'Escape') { movementRef.current?.clear(); return; }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement || event.ctrlKey || event.metaKey || event.altKey) return;
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
  const routesByArmy = new Map(observation?.routes.map(route => [route.armyId, route]));
  const ownSettlements = observation?.settlements.filter(item => item.factionId === observation.factionId) ?? [];
  const army = ownArmies.find(item => item.id === selection.armyId);
  const settlement = ownSettlements.find(item => item.id === selection.settlementId);
  const selectedCell = selection.cell === undefined ? undefined : renderer.current?.inspect(selection.cell);
  const near = army && observation ? neighbors(army.cell, observation.width, observation.height) : [];
  const factionId = observation?.factionId ?? '';
  const realm = observation?.factions.find(faction => faction.id === factionId);
  const realmName = realm?.name ?? factionId;
  const controlLocked = busy || campaign.mode === 'watch' || Boolean(observation?.victory);
  const ordersBusy = controlLocked || Boolean(observation?.battle || observation?.pendingCapture);
  const movement = useMapMovement({ view: observation, selection, hash: hash.current, locked: ordersBusy, renderer, select, issue: command, query: reviewMovement });
  movementRef.current = movement;
  const filteredArmies = ownArmies.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const filteredSettlements = ownSettlements.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
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
    {!observation || showSetup ? <main className="landing">
      <div className="opening"><span className="eyebrow">Keep the hearth. Keep the oath.</span><h2>From the ashes,<br/>a new dominion.</h2><p>The old roads end in wilderness. Lead the Ashen Compact beyond their last milestones: chart the forests, raise a settlement, and give your people a future.</p><div className="opening-rule"/><p className="subtle">Found a hearth. Build its economy.<br/>Send wayfinders into the unknown.</p></div>
      <section className="setup panel"><span className="eyebrow">A chronicle begins</span><h2>Establish your campaign</h2><div className="faction-card"><FactionArt contentId="ui.crest" definitionId="faction.ashen_compact" label="Ashen Compact crest" decorative/><div><h3>Ashen Compact</h3><p>Your current player seat · hearthkeepers of the broken roads</p></div></div>
        <form onSubmit={begin}>
          <label>World seed<input name="seed" inputMode="numeric" value={seed} onChange={event => setSeed(event.target.value)} required/></label>
          <label>World size<select value={size} onChange={event => changeWorldSize(event.target.value as MapSize)}><option value="tiny">Tiny · 1,536 hexes · quick campaign</option><option value="small">Small · 40,960 hexes</option><option value="standard">Standard · 98,304 hexes</option><option value="huge">Huge · 196,608 hexes</option><option value="legendary">Legendary · 307,200 hexes</option></select></label>
          <label>Faction count<input type="number" min={2} max={48} step={1} required value={factionCount} aria-describedby="faction-density-help" onChange={event => setFactionCount(event.target.value)}/></label>
          <p id="faction-density-help" className="field-help" data-testid="faction-density-help">Recommended for this size: {RECOMMENDED_FACTION_COUNTS[size]} realms. Changing world size resets this recommendation; you can override it. Four introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced.</p>
          <label>Campaign pace<select value={pace} onChange={event => setPace(event.target.value as CampaignPace)}><option value="short">Short · test/skirmish</option><option value="standard">Standard · hundreds of turns</option><option value="long">Long · extended campaign</option><option value="epic">Epic · longest campaign</option></select></label>
          <p className="field-help">{CAMPAIGN_PACES[pace].description} Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.</p>
          <label>Campaign mode<select value={newMode} onChange={event => setNewMode(event.target.value as CampaignMode)}><option value="player">Lead a realm</option><option value="watch">AI watch</option></select></label>
          {newMode === 'watch' && <p className="field-help">AI controls every configured realm through the same rules. Observe from the Ashen Compact’s permitted map view, pause or step rounds, then read both all-faction chronicles after victory.</p>}
          <p className="field-help">The same seed, size and faction count create the same world. Giant maps need enough realms to create nearby rivals; terrain can still separate them.</p>
          <button className="primary begin" disabled={busy} type="submit">{generating ? 'Shaping the world…' : 'Begin campaign'}<span aria-hidden="true">→</span></button>
        </form>{generating && <button className="wide" onClick={cancel}>Cancel generation</button>}<div className="save-actions">{persistence}</div>{observation && <button className="wide" onClick={() => setShowSetup(false)}>Return to campaign</button>}</section>
      <PublicCultures/>
    </main> : null}
    {observation && !showSetup && <div className="campaign-tools"><span className="campaign-pace">{CAMPAIGN_PACES[observation.pace].name} pace · <span data-testid="campaign-faction-count">{observation.factionCount} realms</span></span><button onClick={() => { pauseWatch(); setProgressionOpen(true); }}>Realm progression</button><button onClick={() => openCharacters()}>Characters & agents</button>
      {campaign.mode === 'watch' && <section className="watch-controls" data-testid="watch-controls" aria-label="AI watch controls"><span>{observation.victory ? 'AI watch complete' : watchRunning ? 'AI watch running' : busy ? 'Pausing after this round…' : 'AI watch paused'}</span><button disabled={Boolean(observation.victory) || (busy && !watchRunning)} onClick={() => { if (watchRunningRef.current) pauseWatch(); else { watchRunningRef.current = true; setWatchRunning(true); } }}>{watchRunning ? 'Pause AI watch' : 'Resume AI watch'}</button><button disabled={busy || watchRunning || Boolean(observation.victory)} onClick={() => send({ type: 'watchRound' })}>Step one round</button></section>}
      <span className="archive-note">{campaign.coverage === 'complete' ? 'Recording the full campaign' : 'Partial archive · earlier history unavailable'}</span>
      {observation.victory && <button onClick={openChronicles}>Campaign chronicles</button>}
    </div>}
    {observation?.victory && !showSetup && <section className="victory-banner" data-testid="victory-result" aria-label="Campaign result"><span className="eyebrow">The witnesses seal the book</span><h2>{observation.factions.find(faction => faction.id === observation.victory?.factionId)?.name ?? observation.victory.factionId} achieved Prosperity</h2><p>Turn {observation.victory.turn} · The Hearth Exchange is complete. Campaign orders have ended.</p><button className="primary" onClick={openChronicles}>Read campaign chronicles</button></section>}
    {observation && <main className="campaign" style={showSetup ? { display: 'none' } : undefined}>
      <aside className="empire panel"><div className="realm-heading faction-art-heading"><FactionArt contentId="ui.crest" definitionId={realm?.definitionId} label={`${realmName} crest`}/><div><span className="eyebrow">Your people</span><h2>{realmName}</h2></div></div><label className="search-label">Search your realm<input type="search" value={search} placeholder="Army or settlement name" onChange={event => setSearch(event.target.value)}/></label><div className="tabs" role="tablist" aria-label="Realm registry"><button role="tab" aria-selected={registry === 'armies'} onClick={() => setRegistry('armies')}>Armies <span>{ownArmies.length}</span></button><button role="tab" aria-selected={registry === 'settlements'} onClick={() => setRegistry('settlements')}>Settlements <span>{ownSettlements.length}</span></button></div>
        {registry === 'armies' ? <div className="registry" data-testid="army-registry">{filteredArmies.map(item => <button className={'registry-item ' + (army?.id === item.id ? 'selected' : '')} key={item.id} onClick={() => select({ armyId: item.id, cell: item.cell }, true)}><span className="entity-symbol" aria-hidden="true">△</span><span><strong>{item.name}</strong><small>{item.formations.length} {item.formations.length === 1 ? 'formation' : 'formations'} · {item.movement} movement · {item.strength} strength</small>{item.commander && <small>Commander: {item.commander.name}</small>}{item.agents.some(agent => agent.status === 'mission') && <small className="registry-route-state">⚑ Stationary mission</small>}{routesByArmy.get(item.id) && <small className="registry-route-state">{routesByArmy.get(item.id)?.status === 'paused' ? '⚑ Route interrupted' : '↝ Travel queued'}</small>}</span><span aria-hidden="true">›</span></button>)}{filteredArmies.length === 0 && <p className="empty">{search ? 'No matching armies.' : 'Recruit an army from a settlement.'}</p>}</div> : <div className="registry" data-testid="settlement-registry">{filteredSettlements.map(item => <button className={'registry-item ' + (settlement?.id === item.id ? 'selected' : '')} key={item.id} onClick={() => select({ settlementId: item.id, cell: item.cell }, true)}><span className="entity-symbol" aria-hidden="true">⌂</span><span><strong>{item.name}</strong><small>{item.population} people · {item.queue.length ? itemName(item.queue[0]!.itemId) : 'No production'}</small></span><span aria-hidden="true">›</span></button>)}{filteredSettlements.length === 0 && <p className="empty">{search ? 'No matching settlements.' : 'Select your caravan to establish the first hearth.'}</p>}</div>}
        <PublicProjects view={observation} locate={cell => select({ cell }, true)}/>
        <FactionEncounters view={observation} busy={controlLocked} issue={command} stateHash={hash.current} review={reviewPeace}/>
        <SiegeLedger view={observation} locate={cell => renderer.current?.focus(cell)}/>
        <div className="realm-tip"><span className="eyebrow">The first hearth</span><p>Found a settlement with your caravan, then choose construction or recruitment. End the turn to gather yields and complete production.</p></div><details className="chronicle" open><summary>Chronicle <span>{observation.events.length}</span></summary><ol data-testid="chronicle">{observation.events.slice(-16).reverse().map((event, index) => <li key={`${event.turn}-${index}`}><small>TURN {event.turn}</small>{event.message}{event.cell !== undefined && <button aria-label={`Locate event: ${event.message}`} onClick={() => { if (event.cell !== undefined) renderer.current?.focus(event.cell); }}>Locate</button>}</li>)}</ol></details>
      </aside>
      <section className="map-section" aria-label="Strategic map"><div className="map-title"><span className="eyebrow">The uncharted marches</span><span>SEED {observation.seed} · {observation.width} × {observation.height}</span></div><div className="map-host" data-testid="map-container" ref={mapHost} tabIndex={0} aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom. Arrow keys pan; plus and minus zoom. Escape clears selection. The army panel has keyboard and touch route controls." onKeyDown={event => { const moves: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] }; const move = moves[event.key]; if (move) { event.preventDefault(); renderer.current?.pan(...move); } if (event.key === '+' || event.key === '=') renderer.current?.zoom(1.2); if (event.key === '-') renderer.current?.zoom(1 / 1.2); }}/><MovementMapHint movement={movement}/><div className="map-compass" aria-hidden="true"><span>N</span>✧</div><div className="map-controls"><button aria-label="Zoom in" onClick={() => renderer.current?.zoom(1.25)}>+</button><button aria-label="Zoom out" onClick={() => renderer.current?.zoom(0.8)}>−</button><button onClick={() => { if (selection.cell !== undefined) renderer.current?.focus(selection.cell); }}>Focus selection</button></div><div className="map-legend"><span>⌂ Settlement</span><span>△ Army</span><span>◆ Your realm</span><span>Dim terrain: explored</span>{artStatus && <span data-testid="art-runtime-status" title={[artStatus.message, ...artStatus.warnings].join(" ")}>Art: {artStatus.state === 'loading' ? 'loading' : artStatus.state === 'fallback' ? 'procedural fallback' : artStatus.warnings.length ? 'partial pixel pack' : 'approved pixel pack'}</span>}</div><BattlePanel view={observation} busy={controlLocked} issue={command}/><CapturePanel view={observation} busy={controlLocked} issue={command}/></section>
      <aside className="inspector panel"><fieldset className="strategic-orders" disabled={ordersBusy}>
        <span className="eyebrow">Orders & stewardship</span>
        {observation.pendingCapture ? <><h2>A settlement awaits</h2><p className="field-help">Choose its fate in the capture panel before issuing campaign orders.</p></>
          : observation.battle ? <><h2>Battle in progress</h2><p className="field-help">Current strength, morale, and fatigue are shown in the battle panel. Resolve the engagement before issuing campaign orders.</p></>
          : army ? <>
            <div className="faction-art-heading"><FactionArt contentId="ui.banner" definitionId={realm?.definitionId} label={`${realmName} army banner`}/><h2>{army.name}</h2></div>
            <p className="subtle">{army.formations.length === 1 ? itemName(army.unitId) : `${army.formations.length} formations marching together`} · cell {army.cell}</p>
            <div className="stat-pair"><div><strong>{army.movement}</strong><small>Movement</small></div><div><strong>{army.strength}</strong><small>Strength</small></div></div>
            <ArmyCharacters army={army} open={characterId => openCharacters(characterId, army.id)}/>
            {army.canFound && <form className="found-form" onSubmit={event => { event.preventDefault(); command({ type: 'found', factionId, armyId: army.id, name }); }}><label>Settlement name<input value={name} maxLength={40} required onChange={event => setName(event.target.value)}/></label><p className="field-help">One caravan formation becomes a settlement here. Any escorts remain, spend their remaining movement, and pause their travel order.</p><button className="primary wide" type="submit" disabled={busy}>Found settlement</button></form>}
            <MovementOrders movement={movement} view={observation} issue={command} locate={cell => select({ ...selectionRef.current, cell }, true)}/>
            <ArmyComposition key={army.id} army={army} view={observation} busy={ordersBusy} issue={command} inspectArmy={target => select({ armyId: target.id, cell: target.cell })}/>
            <h3 className="section-title">Single-step shortcuts</h3><p className="field-help">Optional: move one neighboring hex using the buttons below. For complete routes and attacks, use the map or Paths & marching orders above.</p>
            <div className="nearby-cells">{near.map(cell => <button key={cell} disabled={busy || Boolean(army.movementBlocker)} aria-label={`Move to cell ${cell}`} onClick={() => command({ type: 'move', factionId, armyId: army.id, target: cell })}><span>{terrainNames[renderer.current?.inspect(cell)?.terrain ?? -1] ?? 'Unknown'}</span><small>Hex {cell}</small></button>)}</div>
          </> : settlement ? <>
            <h2>{settlement.name}</h2><p className="subtle">A hearth of the {realmName} · cell {settlement.cell}</p>
            <div className="stat-pair"><div><strong>{settlement.population}</strong><small>Population</small></div><div><strong>{settlement.food}</strong><small>Stored food</small></div></div>
            <SettlementDefense settlement={settlement} view={observation}/><CharacterAppointments view={observation} settlementId={settlement.id} busy={ordersBusy} issue={command} open={() => openCharacters()}/>
            <h3 className="section-title">Production queue</h3>
            {settlement.queue.length ? <ol className="production-queue">{settlement.queue.map((item, index) => <li key={index}><span>{itemName(item.itemId)}</span><small>{item.progress} / {content.find(definition => definition.id === item.itemId)?.cost} industry</small></li>)}</ol> : <p className="field-help">The hearth is idle. Choose a project below.</p>}
            <h3 className="section-title">Construction</h3><div className="build-options">{BUILDINGS.map(item => <button key={item.id} disabled={busy || settlement.buildings.includes(item.id) || settlement.queue.some(order => order.itemId === item.id)} aria-label={`Build ${item.name}`} onClick={() => command({ type: 'queue', factionId, settlementId: settlement.id, itemId: item.id })}><strong>{item.name}</strong><small>{settlement.buildings.includes(item.id) ? 'Built' : `${item.cost} industry · ${item.coinCost} coin`}</small><small>{[item.food ? `+${item.food} food` : '', item.industry ? `+${item.industry} industry` : '', item.coin ? `+${item.coin} coin` : '', item.knowledge ? `+${item.knowledge} knowledge` : ''].filter(Boolean).join(' · ')} each turn</small></button>)}</div>
            <h3 className="section-title">Recruitment</h3><p className="field-help">Each completed company forms a detachment at this settlement. Select an army and open Army composition to merge or transfer co-located formations.</p>
            <div className="build-options faction-recruit-options">{UNITS.map(item => <button key={item.id} disabled={busy} aria-label={`Recruit ${item.name}`} onClick={() => command({ type: 'queue', factionId, settlementId: settlement.id, itemId: item.id })}><span className="faction-art-card"><FactionArt contentId={item.id} definitionId={realm?.definitionId} label={`${realmName} ${item.name}`} decorative/><span><strong>{item.name}</strong><small>{item.cost} industry · {item.coinCost} coin · {item.upkeep} upkeep</small><small>{item.movement} movement · {item.range} range · {item.armor} armor</small>{item.description && <small>{item.description}</small>}</span></span></button>)}</div>
          </> : <><h2>The frontier awaits</h2><p>Select an army or settlement from the map or your realm registry to issue orders.</p></>}
        {army && !observation.battle && !observation.pendingCapture && <SiegeOrders army={army} view={observation} busy={ordersBusy} issue={command}/>}
        {army && !observation.battle && !observation.pendingCapture && <AttackOrders army={army} view={observation} busy={ordersBusy} issue={command} terrain={cell => renderer.current?.inspect(cell)?.terrain}/>}
        <RuinInspection view={observation} cell={selection.cell}/>
        {selection.cell !== undefined && <div className="hex-inspector"><span className="eyebrow">Selected hex {selection.cell}</span><p>{selectedCell ? `${BIOME_NAMES[selectedCell.biome] ?? 'Unknown biome'} · ${terrainNames[selectedCell.terrain]} · fertility ${selectedCell.fertility} · ${selectedCell.visible ? 'in sight' : 'last explored'}` : 'Beyond known maps. Send a wayfinder to reveal this land.'}</p></div>}
      </fieldset></aside>
    </main>}
    {observation && !showSetup && <BattleHistory view={observation}/>}
    <footer className="command-bar"><div className={'feedback ' + (error ? 'error' : '')} data-testid="feedback" role={error ? 'alert' : 'status'} aria-live="polite"><span className="status-mark" aria-hidden="true">{error ? '!' : '◆'}</span>{busy && !generating ? 'Resolving… ' : ''}{feedback}</div>{observation && <>{(observation.battle || observation.pendingCapture) && <p id="battle-blocker" className="battle-blocker">{observation.pendingCapture ? 'Resolve the settlement capture before ending the turn.' : 'Resolve the pending battle before ending the turn.'}</p>}<div className="turn"><small>AGE OF FRACTURE</small><strong data-testid="turn-counter">Turn {observation.turn}</strong></div><button className="primary end-turn" aria-label="End turn" aria-describedby={observation.battle || observation.pendingCapture ? 'battle-blocker' : undefined} disabled={ordersBusy || showSetup} onClick={endTurn}>End turn <kbd>{turnKey.toUpperCase()}</kbd></button></>}</footer>
    <details className="campaign-options"><summary>Campaign & settings</summary><div className="options-content">{observation && <><button disabled={busy} onClick={() => send({ type: 'save' })}>Save campaign</button><button disabled={busy} onClick={() => send({ type: 'export' })}>Export campaign</button>{persistence}<button disabled={busy} onClick={() => { pauseWatch(); setShowSetup(true); }}>New campaign</button></>}<label>Text scale<select value={textScale} onChange={event => setTextScale(event.target.value)}><option value="1">100%</option><option value="1.15">115%</option><option value="1.3">130%</option></select></label><label>End turn shortcut<input value={turnKey} maxLength={1} onChange={event => setTurnKey(event.target.value.toLowerCase() || 'e')}/></label></div></details>
    {observation && progressionOpen && <CampaignProgression view={observation} busy={controlLocked} issue={command} locate={cell => select({ cell }, true)} close={() => setProgressionOpen(false)}/>}
    {observation && characterContext && <CharacterRegistry view={observation} busy={controlLocked} working={busy} initialCharacterId={characterContext.characterId} initialArmyId={characterContext.armyId} feedback={feedback} error={error} issue={command} close={() => setCharacterContext(undefined)} locate={character => { setCharacterContext(undefined); const location = character.location; if (character.cell !== null) select({ cell: character.cell, ...(location?.kind === 'army' ? { armyId: location.armyId } : location?.kind === 'settlement' ? { settlementId: location.settlementId } : {}) }, true); }}/>}
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
