import { createGame, getMovementQuery, getObservation, previewPeace, stateHash, validateEndTurn, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { planTurn } from '@theandril/ai';
import { createJournal, resumeJournal, generateChronicles, type CampaignJournal, type ChronicleDocuments } from '@theandril/chronicle';
import { SaveStore, deserializeCampaign, exportSave, importSave, serializeCampaign } from '@theandril/persistence';
import type { Request, Response, WorkerMetrics } from './protocol';

let state: GameState | undefined;
let journal: CampaignJournal | undefined;
let chronicles: ChronicleDocuments | undefined;
let recordingFailed = false;
let queryObservation: Observation | undefined;
let publishedHash = '';
const saves = new SaveStore();
let knownCells = new Map<number, Observation['cells'][number]>();
const metrics: WorkerMetrics = { generationMs: 0, commandMs: 0, aiMs: 0, transferBytes: 0, totalTransferBytes: 0 };

function send(message: Response): void { self.postMessage(message); }
function publish(id: number, message: string, reset = false): void {
  if (!state || !journal) throw new Error('Begin or load a campaign first.');
  const observation = queryObservation ??= getObservation(state, state.turnOwnerId);
  if (reset) knownCells = new Map();
  const cells = observation.cells.filter(cell => {
    const old = knownCells.get(cell.cell);
    return !old || old.terrain !== cell.terrain || old.biome !== cell.biome || old.fertility !== cell.fertility || old.visible !== cell.visible;
  });
  for (const cell of cells) knownCells.set(cell.cell, cell);
  const delta = { ...observation, cells };
  metrics.transferBytes = new TextEncoder().encode(JSON.stringify(delta)).byteLength;
  metrics.totalTransferBytes += metrics.transferBytes;
  publishedHash = stateHash(state);
  send({ id, type: 'state', observation: delta, campaign: { mode: journal.mode, coverage: journal.coverage }, reset, hash: publishedHash, metrics: { ...metrics }, message });
}

function applyCommand(game: GameState, command: GameCommand) {
  if (!journal) throw new Error('The campaign recorder is unavailable.');
  if (recordingFailed) throw new Error('Recording was interrupted. Restore a saved campaign before issuing more orders.');
  queryObservation = undefined;
  // Includes rejected AI proposals and automatic decisions, before the next command.
  try { return journal.record(game, command); }
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
      const proposal = planTurn(getObservation(game, capture.factionId)).find(command => command.type === 'resolveCapture' && command.settlementId === capture.settlementId);
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
      const generated = createGame({ seed: request.seed, size: request.size, factionCount: request.factionCount ?? 4, pace: request.pace });
      const record = createJournal(generated, { mode: request.mode });
      state = generated; journal = record; chronicles = undefined; recordingFailed = false; queryObservation = undefined;
      metrics.generationMs = performance.now() - started;
      metrics.commandMs = 0;
      metrics.aiMs = 0;
      metrics.totalTransferBytes = 0;
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
    if (request.type === 'movementQuery') {
      const view = queryObservation ??= getObservation(state, state.turnOwnerId);
      send({ id: request.id, type: 'movementQuery', query: getMovementQuery(view, request.armyId, request.target, { append: request.append }), hash: publishedHash });
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
          for (const command of planTurn(getObservation(state, faction.id))) {
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
            for (const command of planTurn(getObservation(state, faction.id))) {
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
