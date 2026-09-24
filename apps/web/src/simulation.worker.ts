import { commandSchema, createGame, getDevelopmentEntity, getMovementQuery, getObservation, getSettlementLandObservation, getSpectatorObservation, previewPeace, stateHash, validateEndTurn, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { aiObservationOptions, planTurn } from '@theandril/ai';
import { createJournal, resumeJournal, generateChronicles, type CampaignJournal, type ChronicleDocuments } from '@theandril/chronicle';
import { SaveStore, deserializeCampaign, exportSave, importSave, serializeCampaign } from '@theandril/persistence';
import { MAX_GROUP_ORDER_COMMANDS, type GroupCharterResult, type GroupPostingResult, type Request, type Response, type WorkerMetrics } from './protocol';
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
type GroupResponse = { groupPostingResults: GroupPostingResult[]; groupPostingError?: string } | { groupCharterResults: GroupCharterResult[]; groupCharterError?: string };

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
      const pending = settleDecisions(state);
      metrics.commandMs = performance.now() - started;
      let message = result.events.at(-1)?.message ?? 'Orders received.';
      if (pending === 'capture') message += ' Choose the captured settlement’s fate before continuing.';
      if (aiWarnings.length) message += ' ' + aiWarnings.join(' ');
      if (state.victory) message += ' The campaign has ended. Its two chronicles are ready to read.';
      if (state.victory || pending === 'capture' || ['resolveCapture', 'respondPeace', 'endTurn', 'queueMovement', 'cancelMovement', 'resumeMovement', 'recruitCharacter', 'assignCharacter', 'unassignCharacter', 'promoteCharacter', 'startCharacterMission', 'cancelCharacterMission', 'useCommanderAbility'].includes(request.command.type) || ((request.command.type === 'battleOrder' || request.command.type === 'autoResolveBattle') && !state.battle)) message = await autosave(message);
      publish(request.id, message);
    } else if (request.type === 'save') {
      await saves.saveCampaign(state, journal, 'manual');
      send({ id: request.id, type: 'message', message: 'Campaign saved.' });
    } else if (request.type === 'export') {
      send({ id: request.id, type: 'export', bytes: await exportSave(serializeCampaign(state, journal.materialize())) });
    }
  } catch (error) {
    send({ id: request.id, type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
}

// Serialize asynchronous persistence and command requests so restore/save cannot race a turn.
let work = Promise.resolve();
self.onmessage = (event: MessageEvent<Request>) => { work = work.then(() => handle(event.data)); };
