import { commandSchema, createGame, getDevelopmentEntity, getMovementPreview, getMovementQuery, getObservation, getSettlementLandObservation, getSpectatorObservation, previewPeace, stateHash, validateEndTurn, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { aiObservationOptions, planTurn } from '@theandril/ai';
import { createJournal, resumeJournal, generateChronicles, type CampaignJournal, type ChronicleDocuments } from '@theandril/chronicle';
import { SaveStore, deserializeCampaign, exportSave, importSave, serializeCampaign } from '@theandril/persistence';
import { MAX_GROUP_ORDER_COMMANDS, MAX_GROUP_PRODUCTION_SETTLEMENTS, MAX_PRODUCTION_SEQUENCE_ITEMS, type GroupCharterResult, type GroupMovementCommand, type GroupMovementResult, type GroupMovementReview, type GroupPostingResult, type GroupProductionResult, type Request, type Response, type WorkerMetrics } from './protocol';
import { cellTransferBuffers, cellTransferBytes, packCells } from './cell-transfer';
import { BattlePresentationMailbox } from './battle-transfer';

let state: GameState | undefined;
let journal: CampaignJournal | undefined;
let chronicles: ChronicleDocuments | undefined;
let recordingFailed = false;
let queryObservation: Observation | undefined;
let queryHash = '';
let publishedHash = '';
// Presentation state only: never serialized, journaled, or used by AI/query caches.
let fogEnabled = true;
let mapRevision = 0;
const battlePresentations = new BattlePresentationMailbox();
const saves = new SaveStore();
let knownCells = new Map<number, Observation['cells'][number]>();
const metrics: WorkerMetrics = { generationMs: 0, commandMs: 0, aiMs: 0, transferBytes: 0, totalTransferBytes: 0, cellTransferBytes: 0, landQueryCount: 0, landQueryBytes: 0, totalLandQueryBytes: 0, developmentQueryCount: 0, developmentQueryBytes: 0, totalDevelopmentQueryBytes: 0 };
const textEncoder = new TextEncoder();

function send(message: Response, transfer: Transferable[] = []): void { self.postMessage(message, { transfer }); }
type GroupCommand = Extract<GameCommand, { type: 'setPosting' | 'setCharter' }>;
type GroupRequest = Extract<Request, { type: 'groupPosting' | 'groupCharter' }>;
type GroupResponse = { groupPostingResults: GroupPostingResult[]; groupPostingError?: string } | { groupCharterResults: GroupCharterResult[]; groupCharterError?: string } | { groupProductionResults: GroupProductionResult[]; groupProductionError?: string } | { groupMovementResults: GroupMovementResult[]; groupMovementError?: string };

function publish(id: number, message: string, reset = false, replaceMap = false, group?: GroupResponse): void {
  if (!state || !journal) throw new Error('Begin or load a campaign first.');
  const observation = queryObservation ??= getObservation(state, state.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
  if (reset) { fogEnabled = true; battlePresentations.reset(); }
  const battlePresentation = battlePresentations.take(observation);
  const mapReset = reset || replaceMap;
  if (mapReset) { knownCells = new Map(); mapRevision++; }
  const spectator = !fogEnabled && journal.mode === 'watch' ? getSpectatorObservation(state, state.turnOwnerId) : undefined;
  const cells = (spectator?.cells ?? observation.cells).filter(cell => {
    const old = knownCells.get(cell.cell);
    return !old || old.terrain !== cell.terrain || old.biome !== cell.biome || old.waterDepth !== cell.waterDepth || old.fertility !== cell.fertility || old.visible !== cell.visible || old.featureMask !== cell.featureMask || old.settlementId !== cell.settlementId || old.factionId !== cell.factionId || old.improvementId !== cell.improvementId || old.hydrology !== cell.hydrology || old.roadMask !== cell.roadMask || old.resourceId !== cell.resourceId;
  });
  for (const cell of cells) knownCells.set(cell.cell, cell);
  const { cells: observedCells, ...summary } = observation;
  void observedCells;
  const map = spectator ? (({ cells: _cells, ...summary }) => { void _cells; return summary; })(spectator) : undefined;
  const packed = packCells(cells);
  metrics.cellTransferBytes = cellTransferBytes(packed);
  const resultBytes = group ? textEncoder.encode(JSON.stringify(group)).byteLength : 0;
  metrics.groupPostingResultBytes = group && 'groupPostingResults' in group ? resultBytes : 0;
  metrics.groupCharterResultBytes = group && 'groupCharterResults' in group ? resultBytes : 0;
  metrics.groupProductionResultBytes = group && 'groupProductionResults' in group ? resultBytes : 0;
  metrics.groupMovementResultBytes = group && 'groupMovementResults' in group ? resultBytes : 0;
  metrics.transferBytes = textEncoder.encode(JSON.stringify(summary)).byteLength + (map ? textEncoder.encode(JSON.stringify(map)).byteLength : 0) + (battlePresentation ? textEncoder.encode(JSON.stringify(battlePresentation)).byteLength : 0) + metrics.cellTransferBytes + resultBytes;
  metrics.totalTransferBytes += metrics.transferBytes;
  publishedHash = stateHash(state);
  queryHash = publishedHash;
  send({ id, type: 'state', observation: summary, cells: packed, ...(map ? { map } : {}), ...(battlePresentation ? { battlePresentation } : {}), ...group, fogEnabled, mapRevision, mapReset, campaign: { mode: journal.mode, coverage: journal.coverage }, reset, hash: publishedHash, metrics: { ...metrics }, message }, cellTransferBuffers(packed));
}

const groupEntityId = (command: GroupCommand): string => command.type === 'setPosting' ? command.armyId : command.settlementId;

/** Validate the entire transport envelope before the first canonical order. */
function groupCommands(request: GroupRequest, factionId: string): GroupCommand[] {
  const posting = request.type === 'groupPosting', kind = posting ? 'posting' : 'charter';
  if (!Number.isSafeInteger(request.id) || request.id < 0 || Object.keys(request).some(key => !['id', 'type', 'commands'].includes(key))
    || !Array.isArray(request.commands) || request.commands.length < 1 || request.commands.length > MAX_GROUP_ORDER_COMMANDS) {
    throw new Error(`A group ${kind} requires between 1 and ${MAX_GROUP_ORDER_COMMANDS} ${kind} orders in a valid request.`);
  }
  const ids = new Set<string>();
  const commands = Array.from<GroupCommand>(request.commands).map((input, index) => {
    const parsed = commandSchema.safeParse(input);
    if (!parsed.success || (parsed.data.type !== 'setPosting' && parsed.data.type !== 'setCharter') || (parsed.data.type === 'setPosting') !== posting) throw new Error(`Group ${kind} item ${index + 1} is not a valid ${kind} order.`);
    const command = parsed.data;
    if (command.factionId !== factionId) throw new Error(`This seat does not control every faction in the group ${kind}.`);
    const id = groupEntityId(command);
    if (ids.has(id)) throw new Error(`A group ${kind} may name each ${posting ? 'army' : 'settlement'} only once.`);
    ids.add(id);
    return command;
  });
  return commands.sort((a, b) => groupEntityId(a) < groupEntityId(b) ? -1 : groupEntityId(a) > groupEntityId(b) ? 1 : 0);
}

function applyGroupCommands(game: GameState, commands: GroupCommand[]) {
  const results: Array<{ entityId: string; accepted: boolean; message?: string }> = [];
  let error: string | undefined;
  for (const command of commands) {
    try {
      const result = applyCommand(game, command);
      results.push({ entityId: groupEntityId(command), accepted: result.ok, ...(!result.ok ? { message: result.error ?? `The ${command.type === 'setPosting' ? 'posting' : 'charter'} could not be completed.` } : {}) });
    } catch (cause) {
      // A recorder can fail after the command mutated canonical state. Do
      // not call that order refused, roll it back, or attempt the next one.
      error = `Recording was interrupted after ${results.length} completed order${results.length === 1 ? '' : 's'}. Some orders may have applied; restore a saved campaign before continuing. ${cause instanceof Error ? cause.message : String(cause)}`;
      break;
    }
  }
  return { results, error };
}

const movementIdentifier = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 100 && /^[a-z][a-z0-9_.-]*$/.test(value);
function movementPreviewPlan(request: Extract<Request, { type: 'groupMovementPreview' }>, factionId: string) {
  if (!Number.isSafeInteger(request.id) || request.id < 0
    || Object.keys(request).some(key => !['id', 'type', 'factionId', 'armyIds', 'target', 'append'].includes(key))
    || !movementIdentifier(request.factionId) || !Array.isArray(request.armyIds) || request.armyIds.length < 1 || request.armyIds.length > MAX_GROUP_ORDER_COMMANDS
    || Object.keys(request.armyIds).length !== request.armyIds.length || !Array.from(request.armyIds).every(movementIdentifier)
    || new Set(request.armyIds).size !== request.armyIds.length
    || !Number.isSafeInteger(request.target) || request.target < 0 || request.target > 349_999 || typeof request.append !== 'boolean') {
    throw new Error(`A group travel review requires 1 to ${MAX_GROUP_ORDER_COMMANDS} distinct army IDs and a destination in a valid request.`);
  }
  if (request.factionId !== factionId) throw new Error('This seat does not control that faction.');
  return { armyIds: [...request.armyIds].sort(), target: request.target, append: request.append };
}

/** Envelope validation is atomic; each legal-shaped order is still adjudicated
 * by simulation, including missing/foreign armies and paused/blocked routes. */
function movementCommands(request: Extract<Request, { type: 'groupMovement' }>, factionId: string): GroupMovementCommand[] {
  if (!Number.isSafeInteger(request.id) || request.id < 0
    || Object.keys(request).some(key => !['id', 'type', 'commands', 'expectedHash'].includes(key))
    || typeof request.expectedHash !== 'string' || !/^[a-f0-9]{8}$/.test(request.expectedHash)
    || !Array.isArray(request.commands) || request.commands.length < 1 || request.commands.length > MAX_GROUP_ORDER_COMMANDS
    || Object.keys(request.commands).length !== request.commands.length) {
    throw new Error(`Group travel requires 1 to ${MAX_GROUP_ORDER_COMMANDS} orders and a reviewed campaign hash in a valid request.`);
  }
  const ids = new Set<string>();
  const commands = Array.from(request.commands).map((input, index): GroupMovementCommand => {
    const parsed = commandSchema.safeParse(input);
    if (!parsed.success || !['queueMovement', 'resumeMovement', 'cancelMovement'].includes(parsed.data.type)) throw new Error(`Group travel item ${index + 1} is not a valid travel order.`);
    const command = parsed.data as GroupMovementCommand;
    if (command.factionId !== factionId) throw new Error('This seat does not control every faction in the group travel order.');
    if (ids.has(command.armyId)) throw new Error('Group travel may name each army only once.');
    ids.add(command.armyId);
    return command;
  });
  const first = commands[0]!;
  if (commands.some(command => command.type !== first.type
    || command.type === 'queueMovement' && first.type === 'queueMovement' && (command.target !== first.target || Boolean(command.append) !== Boolean(first.append)))) {
    throw new Error('Group travel requires the same action, destination and waypoint choice for every army.');
  }
  return commands.sort((a, b) => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0);
}

function applyMovementCommands(game: GameState, commands: GroupMovementCommand[]) {
  const results: GroupMovementResult[] = [];
  for (const command of commands) {
    try {
      const result = applyCommand(game, command);
      const message = result.ok ? result.events.at(-1)?.message : result.error ?? 'The travel order could not be completed.';
      results.push({ armyId: command.armyId, accepted: result.ok, ...(message ? { message } : {}) });
    } catch (cause) {
      return { results, error: `Recording was interrupted after ${results.length} completed travel order${results.length === 1 ? '' : 's'}. Some orders may have applied; restore a saved campaign before continuing. ${cause instanceof Error ? cause.message : String(cause)}` };
    }
  }
  return { results, error: undefined };
}

/** Only transport shape is checked here. Content, ownership, payment, queue
 * capacity and prerequisites remain ordinary canonical queue decisions. */
function productionSequence(request: Extract<Request, { type: 'groupProduction' }>, factionId: string) {
  const identifier = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 100;
  const list = (value: unknown, limit: number): value is string[] => Array.isArray(value) && value.length > 0 && value.length <= limit
    && Object.keys(value).length === value.length && Array.from(value).every(identifier);
  if (!Number.isSafeInteger(request.id) || request.id < 0
    || Object.keys(request).some(key => !['id', 'type', 'factionId', 'settlementIds', 'itemIds'].includes(key))
    || !identifier(request.factionId) || !list(request.settlementIds, MAX_GROUP_PRODUCTION_SETTLEMENTS) || !list(request.itemIds, MAX_PRODUCTION_SEQUENCE_ITEMS)
    || new Set(request.settlementIds).size !== request.settlementIds.length) {
    throw new Error(`A production sequence requires 1 to ${MAX_GROUP_PRODUCTION_SETTLEMENTS} distinct hearth IDs and 1 to ${MAX_PRODUCTION_SEQUENCE_ITEMS} item IDs in a valid request.`);
  }
  if (request.factionId !== factionId) throw new Error('This seat does not control that faction.');
  return { factionId, settlementIds: [...request.settlementIds].sort(), itemIds: [...request.itemIds] };
}

function applyProductionSequence(game: GameState, sequence: ReturnType<typeof productionSequence>) {
  const results: GroupProductionResult[] = [];
  let attempted = 0;
  for (const settlementId of sequence.settlementIds) {
    const row: GroupProductionResult = { settlementId, orders: [] };
    for (const itemId of sequence.itemIds) {
      try {
        const result = applyCommand(game, { type: 'queue', factionId: sequence.factionId, settlementId, itemId });
        row.orders.push({ itemId, accepted: result.ok, ...(!result.ok ? { message: result.error ?? 'The item could not be queued.' } : {}) });
        if (row.orders.length === 1) results.push(row);
        attempted++;
        if (!result.ok) break;
      } catch (cause) {
        // The interrupted command may already have mutated state. Its outcome
        // is unknown: retain only completed results, stop every later command.
        return { results, error: `Recording was interrupted after ${attempted} completed production order${attempted === 1 ? '' : 's'}. Some orders may have applied; restore a saved campaign before continuing. ${cause instanceof Error ? cause.message : String(cause)}` };
      }
    }
  }
  return { results, error: undefined };
}

function applyCommand(game: GameState, command: GameCommand) {
  if (!journal) throw new Error('The campaign recorder is unavailable.');
  if (recordingFailed) throw new Error('Recording was interrupted. Restore a saved campaign before issuing more orders.');
  queryObservation = undefined;
  // Includes rejected AI proposals and automatic decisions, before the next command.
  try {
    const involved = game.battle && (game.battle.attackerFactionId === game.turnOwnerId || game.battle.defenderFactionId === game.turnOwnerId);
    return journal.record(game, command, undefined, involved ? packet => battlePresentations.capture(packet, game.turnOwnerId) : undefined);
  }
  catch (error) {
    recordingFailed = true;
    throw new Error('Recording was interrupted. Restore a saved campaign before issuing more orders. ' + (error instanceof Error ? error.message : String(error)));
  }
}

async function autosave(message: string): Promise<string> {
  if (!state || !journal) return message;
  try { await saves.saveCampaign(state, journal, 'auto'); return message + ' Autosaved.'; }
  catch (error) { return message + ' Autosave failed: ' + (error instanceof Error ? error.message : String(error)); }
}

/** Resolve only AI-owned decisions, always through freshly observed command proposals. */
function settleDecisions(game: GameState): 'battle' | 'capture' | null {
  const watching = journal?.mode === 'watch';
  while (!game.victory && (game.battle || game.pendingCapture)) {
    const capture = game.pendingCapture;
    if (capture) {
      if (!watching && capture.factionId === game.turnOwnerId) return 'capture';
      const proposal = planTurn(getObservation(game, capture.factionId, aiObservationOptions(game.turn))).find(command => command.type === 'resolveCapture' && command.settlementId === capture.settlementId);
      if (!proposal) throw new Error('The capturing faction did not propose a settlement outcome.');
      const result = applyCommand(game, proposal);
      if (!result.ok) throw new Error(result.error ?? 'An AI settlement decision could not be resolved.');
      continue;
    }
    const battle = game.battle;
    if (!battle) break;
    const involvesSeat = battle.attackerFactionId === game.turnOwnerId || battle.defenderFactionId === game.turnOwnerId;
    if (!watching && involvesSeat) return 'battle';
    const result = applyCommand(game, { type: 'autoResolveBattle', factionId: involvesSeat ? game.turnOwnerId : battle.attackerFactionId });
    if (!result.ok) throw new Error(result.error ?? 'An AI engagement could not be resolved.');
  }
  return null;
}

async function handle(request: Request): Promise<void> {
  let delegationApplied: 'group' | 'theater' | false = false;
  let groupProductionStarted = false;
  let groupMovementStarted = false;
  try {
    if (request.type === 'new') {
      send({ id: request.id, type: 'progress', message: 'Raising continents and finding a place for the first hearth…' });
      const started = performance.now();
      const generated = createGame({ seed: request.seed, size: request.size, factionCount: request.factionCount ?? 4, ...(request.cityStateCount ? { cityStateCount: request.cityStateCount } : {}), pace: request.pace, ...(request.factionDefinitionId ? { factionDefinitionId: request.factionDefinitionId } : {}), ...(request.layout ? { layout: request.layout } : {}) });
      const record = createJournal(generated, { mode: request.mode });
      state = generated; journal = record; chronicles = undefined; recordingFailed = false; queryObservation = undefined;
      metrics.generationMs = performance.now() - started;
      metrics.commandMs = 0;
      metrics.aiMs = 0;
      metrics.totalTransferBytes = 0;
      metrics.cellTransferBytes = 0; metrics.landQueryCount = 0; metrics.landQueryBytes = 0; metrics.totalLandQueryBytes = 0; metrics.developmentQueryCount = 0; metrics.developmentQueryBytes = 0; metrics.totalDevelopmentQueryBytes = 0;
      metrics.groupMovementQueryCount = 0; metrics.groupMovementQueryBytes = 0; metrics.totalGroupMovementQueryBytes = 0; metrics.groupMovementQueryMs = 0;
      publish(request.id, request.mode === 'watch' ? 'AI watch is paused. Resume to observe every faction act, or step one round.' : 'Your people await a hearth. Select the caravan and found your first settlement.', true);
      return;
    }
    if (request.type === 'load' || request.type === 'loadAuto' || request.type === 'import') {
      let loaded: { game: GameState; journal: CampaignJournal };
      if (request.type === 'import') {
        const imported = deserializeCampaign(await importSave(request.bytes));
        loaded = { game: imported.game, journal: resumeJournal(imported.game, imported.archive) };
      } else loaded = await saves.loadLatestCampaign(request.type === 'loadAuto' ? 'auto' : 'manual');
      state = loaded.game; journal = loaded.journal; chronicles = undefined; recordingFailed = false; queryObservation = undefined;
      let message = request.type === 'import' ? 'Imported campaign.' : 'Campaign restored.';
      if (journal.coverage === 'from-save') message += ' Partial archive: earlier campaign history was not recorded in this save.';
      if (journal.mode === 'watch' && !state.victory) message += ' AI watch is paused.';
      publish(request.id, message, true);
      return;
    }
    if (!state || !journal) throw new Error('Begin or load a campaign first.');
    if (recordingFailed) throw new Error('Recording was interrupted. Restore a saved campaign before continuing.');
    if (request.type === 'groupMovementPreview') {
      const plan = movementPreviewPlan(request, state.turnOwnerId), started = performance.now();
      const currentHash = queryObservation ? queryHash : stateHash(state);
      const view = queryObservation ??= getObservation(state, state.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
      queryHash = currentHash;
      const review: GroupMovementReview = { hash: currentHash, target: plan.target, append: plan.append, results: plan.armyIds.map(armyId => {
        const preview = getMovementPreview(view, armyId, plan.target, { append: plan.append });
        return { armyId, target: preview.target, cost: preview.cost, steps: preview.path.length, canQueue: preview.canQueue,
          blocker: !preview.canQueue && preview.action === 'attack' ? 'Queued travel cannot include an automatic attack.' : preview.blocker,
          limited: preview.limited, expandedNodes: preview.expandedNodes };
      }) };
      metrics.groupMovementQueryMs = performance.now() - started;
      metrics.groupMovementQueryBytes = textEncoder.encode(JSON.stringify(review)).byteLength;
      metrics.groupMovementQueryCount = (metrics.groupMovementQueryCount ?? 0) + 1;
      metrics.totalGroupMovementQueryBytes = (metrics.totalGroupMovementQueryBytes ?? 0) + metrics.groupMovementQueryBytes;
      metrics.totalTransferBytes += metrics.groupMovementQueryBytes;
      send({ id: request.id, type: 'groupMovementPreview', ...review, metrics: { ...metrics } });
      return;
    }
    if (request.type === 'watchFog') {
      if (journal.mode !== 'watch') throw new Error('Fog controls are available only in AI-watch campaigns.');
      if (typeof request.enabled !== 'boolean') throw new Error('Fog of war must be enabled or disabled with a boolean.');
      const changed = fogEnabled !== request.enabled;
      fogEnabled = request.enabled;
      publish(request.id, fogEnabled ? 'Fog of war restored to your realm’s sight.' : 'Spectator map revealed. AI still uses each faction’s own sight.', false, changed);
      return;
    }
    if (request.type === 'landQuery') {
      // A read selector checks seat ownership and sight; this is not a game order
      // and must not enter the journal or advance a turn. Use a fresh hash only
      // when a command invalidated the last published observation.
      const currentHash = queryObservation ? queryHash : stateHash(state);
      const town = getSettlementLandObservation(state, state.turnOwnerId, request.settlementId, request.window);
      metrics.landQueryBytes = textEncoder.encode(JSON.stringify({ settlementId: request.settlementId, town, hash: currentHash })).byteLength;
      metrics.landQueryCount++;
      metrics.totalLandQueryBytes += metrics.landQueryBytes;
      metrics.totalTransferBytes += metrics.landQueryBytes;
      send({ id: request.id, type: 'landQuery', settlementId: request.settlementId, town, hash: currentHash, metrics: { ...metrics } });
      return;
    }
    if (request.type === 'developmentQuery') {
      // Selected subject only, checked against the player seat. Read queries do
      // not enter the journal, spend resources, or expand the published roster.
      const currentHash = queryObservation ? queryHash : stateHash(state);
      const entity = getDevelopmentEntity(state, state.turnOwnerId, request.focus);
      metrics.developmentQueryBytes = textEncoder.encode(JSON.stringify({ focus: request.focus, entity, hash: currentHash })).byteLength;
      metrics.developmentQueryCount = (metrics.developmentQueryCount ?? 0) + 1;
      metrics.totalDevelopmentQueryBytes = (metrics.totalDevelopmentQueryBytes ?? 0) + metrics.developmentQueryBytes;
      metrics.totalTransferBytes += metrics.developmentQueryBytes;
      send({ id: request.id, type: 'developmentQuery', focus: request.focus, entity, hash: currentHash, metrics: { ...metrics } });
      return;
    }
    if (request.type === 'movementQuery') {
      const currentHash = queryObservation ? queryHash : stateHash(state);
      const view = queryObservation ??= getObservation(state, state.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
      queryHash = currentHash;
      send({ id: request.id, type: 'movementQuery', query: getMovementQuery(view, request.armyId, request.target, { append: request.append }), hash: currentHash });
      return;
    }
    if (request.type === 'chronicles') {
      if (!state.victory) throw new Error('The all-faction chronicles are revealed only after the campaign ends.');
      chronicles ??= generateChronicles(state, journal.materialize());
      send({ id: request.id, type: 'chronicles', documents: chronicles });
      return;
    }
    if (request.type === 'previewPeace') {
      send({ id: request.id, type: 'peacePreview', assessment: previewPeace(state, state.turnOwnerId, request.targetFactionId, request.terms) });
      return;
    }
    if (request.type === 'watchRound') {
      if (journal.mode !== 'watch') throw new Error('This campaign is not in AI-watch mode.');
      if (state.victory) throw new Error('The campaign has ended. Open its chronicles to review the result.');
      const started = performance.now();
      settleDecisions(state);
      const endTurn: GameCommand = { type: 'endTurn', factionId: state.turnOwnerId };
      const validation = validateEndTurn(state, endTurn);
      if (!validation.ok) throw new Error(validation.error ?? 'This round cannot be resolved.');
      const aiStarted = performance.now();
      const warnings: string[] = [];
      for (const faction of state.factions) {
        if (state.victory) break;
        try {
          for (const command of planTurn(getObservation(state, faction.id, aiObservationOptions(state.turn)))) {
            if (state.victory) break;
            applyCommand(state, command);
            settleDecisions(state);
          }
        } catch (error) {
          warnings.push(`${faction.name} could not finish planning: ${error instanceof Error ? error.message : String(error)}`);
          if (recordingFailed || state.battle || state.pendingCapture) throw error;
        }
      }
      metrics.aiMs = performance.now() - aiStarted;
      if (!state.victory) {
        const result = applyCommand(state, endTurn);
        if (!result.ok) throw new Error(result.error ?? 'This round could not finish.');
      }
      metrics.commandMs = performance.now() - started;
      let message = state.victory ? 'The campaign has ended. Its two chronicles are ready to read.' : `AI round complete. Turn ${state.turn}.`;
      if (warnings.length) message += ' ' + warnings.join(' ');
      publish(request.id, await autosave(message));
      return;
    }
    if (request.type === 'groupMovement') {
      if (journal.mode === 'watch') throw new Error('AI watch controls every faction. Pause or step rounds from the watch controls.');
      if (state.victory) throw new Error('The campaign has ended. Open its chronicles to review the result.');
      if (state.battle || state.pendingCapture) throw new Error('Finish the current battle or settlement decision before applying group travel orders.');
      const commands = movementCommands(request, state.turnOwnerId);
      if (request.expectedHash !== stateHash(state)) throw new Error('The campaign changed; review the group routes again before issuing orders.');
      const started = performance.now();
      groupMovementStarted = true;
      const { results, error } = applyMovementCommands(state, commands);
      metrics.commandMs = performance.now() - started; metrics.aiMs = 0;
      const accepted = results.filter(result => result.accepted).length;
      const message = error ?? `${accepted} travel order${accepted === 1 ? '' : 's'} accepted; ${results.length - accepted} refused.`;
      publish(request.id, !error && accepted ? await autosave(message) : message, false, false, { groupMovementResults: results, ...(error ? { groupMovementError: error } : {}) });
      return;
    }
    if (request.type === 'groupProduction') {
      if (journal.mode === 'watch') throw new Error('AI watch controls every faction. Pause or step rounds from the watch controls.');
      if (state.victory) throw new Error('The campaign has ended. Open its chronicles to review the result.');
      if (state.battle || state.pendingCapture) throw new Error('Finish the current battle or settlement decision before applying production sequences.');
      const sequence = productionSequence(request, state.turnOwnerId), started = performance.now();
      groupProductionStarted = true;
      const { results, error } = applyProductionSequence(state, sequence);
      metrics.commandMs = performance.now() - started; metrics.aiMs = 0;
      const accepted = results.reduce((count, row) => count + row.orders.filter(order => order.accepted).length, 0);
      const refused = results.reduce((count, row) => count + row.orders.filter(order => !order.accepted).length, 0);
      publish(request.id, error ?? `${accepted} production order${accepted === 1 ? '' : 's'} accepted; ${refused} hearth sequence${refused === 1 ? '' : 's'} stopped.`, false, false,
        { groupProductionResults: results, ...(error ? { groupProductionError: error } : {}) });
      return;
    }
    if (request.type === 'groupPosting' || request.type === 'groupCharter') {
      if (journal.mode === 'watch') throw new Error('AI watch controls every faction. Pause or step rounds from the watch controls.');
      if (state.victory) throw new Error('The campaign has ended. Open its chronicles to review the result.');
      const commands = groupCommands(request, state.turnOwnerId), started = performance.now();
      const { results, error } = applyGroupCommands(state, commands);
      metrics.commandMs = performance.now() - started; metrics.aiMs = 0;
      const accepted = results.filter(result => result.accepted).length, kind = request.type === 'groupPosting' ? 'posting' : 'charter';
      const message = error ?? `${accepted} ${kind}${accepted === 1 ? '' : 's'} accepted; ${results.length - accepted} refused.`;
      const response: GroupResponse = request.type === 'groupPosting'
        ? { groupPostingResults: results.map(({ entityId, ...result }) => ({ armyId: entityId, ...result })), ...(error ? { groupPostingError: error } : {}) }
        : { groupCharterResults: results.map(({ entityId, ...result }) => ({ settlementId: entityId, ...result })), ...(error ? { groupCharterError: error } : {}) };
      publish(request.id, message, false, false, response);
      return;
    }
    if (request.type === 'command') {
      const started = performance.now();
      if (journal.mode === 'watch') throw new Error('AI watch controls every faction. Pause or step rounds from the watch controls.');
      if (state.victory) throw new Error('The campaign has ended. Open its chronicles to review the result.');
      // AI submits the same commands as a human, from each faction's permitted view.
      // End-turn authorization is checked before any AI proposal can mutate state.
      if (request.command.factionId !== state.turnOwnerId) throw new Error('This seat does not control that faction.');
      const aiWarnings: string[] = [];
      if (request.command.type === 'endTurn') {
        const validation = validateEndTurn(state, request.command);
        if (!validation.ok) throw new Error(validation.error ?? 'This turn cannot be resolved.');
        const aiStarted = performance.now();
        for (const faction of state.factions.filter(faction => faction.id !== state!.turnOwnerId)) {
          try {
            for (const command of planTurn(getObservation(state, faction.id, aiObservationOptions(state.turn)))) {
              applyCommand(state, command);
              const pending = settleDecisions(state);
              if (!pending) continue;
              metrics.aiMs = performance.now() - aiStarted;
              metrics.commandMs = performance.now() - started;
              publish(request.id, await autosave(pending === 'capture'
                ? 'A captured settlement awaits your decision. Choose its fate, then End turn to continue.'
                : 'Your forces face an enemy engagement. Finish the battle, then End turn to continue.'));
              return;
            }
          } catch (error) {
            aiWarnings.push(`${faction.name} could not finish planning: ${error instanceof Error ? error.message : String(error)}`);
            if (recordingFailed || state.battle || state.pendingCapture) throw error;
          }
        }
        metrics.aiMs = performance.now() - aiStarted;
      }
      const result = applyCommand(state, request.command);
      if (!result.ok) throw new Error(result.error ?? 'The command could not be completed.');
      delegationApplied = ['setSelectionGroup', 'deleteSelectionGroup'].includes(request.command.type) ? 'group' : ['setTheater', 'deleteTheater'].includes(request.command.type) ? 'theater' : false;
      const pending = settleDecisions(state);
      metrics.commandMs = performance.now() - started;
      let message = result.events.at(-1)?.message ?? 'Orders received.';
      if (pending === 'capture') message += ' Choose the captured settlement’s fate before continuing.';
      if (aiWarnings.length) message += ' ' + aiWarnings.join(' ');
      if (state.victory) message += ' The campaign has ended. Its two chronicles are ready to read.';
      if (state.victory || pending === 'capture' || ['setTheater', 'deleteTheater', 'resolveCapture', 'respondPeace', 'endTurn', 'queueMovement', 'cancelMovement', 'resumeMovement', 'recruitCharacter', 'assignCharacter', 'unassignCharacter', 'promoteCharacter', 'startCharacterMission', 'cancelCharacterMission', 'useCommanderAbility'].includes(request.command.type) || ((request.command.type === 'battleOrder' || request.command.type === 'autoResolveBattle') && !state.battle)) message = await autosave(message);
      publish(request.id, message);
    } else if (request.type === 'save') {
      await saves.saveCampaign(state, journal, 'manual');
      send({ id: request.id, type: 'message', message: 'Campaign saved.' });
    } else if (request.type === 'export') {
      send({ id: request.id, type: 'export', bytes: await exportSave(serializeCampaign(state, journal.materialize())) });
    }
  } catch (error) {
    // An accepted edit may fail while publishing its view. Its canonical
    // mutation must never be mistaken for a refusal or followed by stale orders.
    if (delegationApplied || groupProductionStarted || groupMovementStarted) recordingFailed = true;
    const message = error instanceof Error ? error.message : String(error);
    send({ id: request.id, type: 'error', message: groupMovementStarted
      ? `The travel result could not be displayed. Some orders may have applied; restore a saved campaign before continuing. ${message}`
      : groupProductionStarted
      ? `The production result could not be displayed. Some orders may have applied; restore a saved campaign before continuing. ${message}`
      : delegationApplied ? `The ${delegationApplied} changed but its update could not be displayed. Restore a saved campaign before continuing. ${message}` : message, ...(recordingFailed ? { recoveryRequired: true } : {}) });
  }
}

// Serialize asynchronous persistence and command requests so restore/save cannot race a turn.
let work = Promise.resolve();
self.onmessage = (event: MessageEvent<Request>) => { work = work.then(() => handle(event.data)); };
