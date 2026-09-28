import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getMovementPreview, getObservation, SAVE_VERSION, serializeGame, stateHash, type DomainEvent, type GameCommand, type GameState, type Settlement } from '@theandril/sim';
import { createJournal, replayArchive } from '../packages/chronicle/src';
import { advanceTheaters, MAX_THEATER_DISPATCHES, MAX_THEATER_HEARTHS, MAX_THEATER_MEMBERS, MAX_THEATERS_PER_FACTION, observeTheaters } from '../packages/sim/src/theaters';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';
import { matureCampaign } from '../packages/test-fixtures/src';

type Scale = 'huge' | 'legendary';
type Workload = 'representative' | 'ceiling';
const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
};
const samples = Number(argument('--samples') ?? 3), output = argument('--out'), selectedCase = argument('--case');
const reinforcement = process.argv.includes('--reinforcement');
assert(Number.isSafeInteger(samples) && samples >= 1 && samples <= 10, '--samples must be1–10.');
const cases = (['huge', 'legendary'] as const).flatMap(size => (['representative', 'ceiling'] as const).map(workload => ({ size, workload, name: `${size}-${workload}` })));
assert(!selectedCase || cases.some(item => item.name === selectedCase), 'Unknown --case; use huge-representative, huge-ceiling, legendary-representative or legendary-ceiling.');
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const options = { landDetails: 'none' as const, developmentCandidates: false };
const timed = <T>(run: () => T) => { const start = performance.now(), value = run(); return { value, ms: performance.now() - start }; };
const summary = (samplesMs: number[]) => { const ordered = [...samplesMs].sort((a, b) => a - b); return { samplesMs, medianMs: ordered[Math.floor(ordered.length / 2)]!, minMs: ordered[0]!, maxMs: ordered.at(-1)! }; };

function addGuard(state: GameState, cell: number): string {
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: state.turnOwnerId, name: 'Authored watch company', cell, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
  return id;
}
function cloneHearth(state: GameState, template: Settlement, cell: number, name: string): Settlement {
  const id = `settlement.${state.nextId++}`;
  const town = { ...structuredClone(template), id, cell, name, queue: [] };
  state.settlements[id] = town;
  return town;
}

/** Generated geography remains intact. Ownership, the nearby second hearth and
 *100 guard companies are explicit authored scale setup, not earned expansion. */
function representative(state: GameState): Extract<GameCommand, { type: 'setTheater' }>[] {
  const owner = state.turnOwnerId, home = Object.values(state.settlements).find(town => town.factionId === owner)!;
  const parents = new Map<number, number | null>([[home.cell, null]]), frontier = [home.cell];
  let target: number | undefined;
  for (let cursor = 0; cursor < frontier.length && cursor < 4096; cursor++) {
    const cell = frontier[cursor]!;
    if (hexDistance(cell, home.cell, state.world.width) >= 6) { target = cell; break; }
    for (const next of neighbors(cell, state.world.width, state.world.height)) {
      if (parents.has(next) || !isPassable(state.world.terrain[next]!)
        || Object.values(state.settlements).some(town => town.factionId !== owner && hexDistance(next, town.cell, state.world.width) < 4)) continue;
      parents.set(next, cell); frontier.push(next);
    }
  }
  assert.notEqual(target, undefined, 'Generated fixture needs a nearby connected hearth site.');
  const path: number[] = [];
  for (let cell: number | null = target!; cell !== null; cell = parents.get(cell)!) path.unshift(cell);
  const second = cloneHearth(state, home, target!, 'Authored nearby watch hearth');
  const members = Object.values(state.armies).filter(army => army.factionId === owner && army.formations.every(formation => formation.unitId === 'unit.guard')).map(army => army.id);
  while (members.length < 100) members.push(addGuard(state, home.cell));
  assert.equal(members.length, 100);
  // Authored charted corridor only; the rest of the generated world's fog stays
  // canonical and no foreign observation is copied into the measured view.
  for (const cell of path) state.explored[owner]!.add(cell);
  rebaseAuthoredLand(state);
  const view = getObservation(state, owner, options), preview = getMovementPreview(view, members[0]!, second.cell);
  assert(preview.canQueue, `Nearby generated route must be canonical: ${preview.blocker}`);
  return [{ type: 'setTheater', factionId: owner, name: 'Generated geography watch', settlementIds: [home.id, second.id], armyIds: members,
    reserveCell: path[2]!, guardsPerSettlement: 4, enabled: true }];
}

/** Full per-realm reference ceiling on authored open land. Half each theater's
 *members occupy a small isolated island, proving successful and failed route
 *attempts share the same16-slot budget. This is not worst-case4096-node search. */
function ceiling(state: GameState): Extract<GameCommand, { type: 'setTheater' }>[] {
  const owner = state.turnOwnerId, width = state.world.width, height = state.world.height;
  const template = Object.values(state.settlements).find(town => town.factionId === owner)!;
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  state.resources.deposits = {};
  for (const army of Object.values(state.armies)) if (army.factionId === owner) delete state.armies[army.id];
  for (const town of Object.values(state.settlements)) if (town.factionId === owner) delete state.settlements[town.id];
  // Keep the mature fixture's foreign forces and factions, but move their
  // authored hearths away from the128-hearth test grid before rebasing claims.
  state.factions.forEach((faction, index) => {
    if (faction.id === owner) return;
    const cell = (height - 32 + Math.floor(index / 16) * 8) * width + 16 + index % 16 * 8;
    state.world.starts[index] = cell;
    for (const town of Object.values(state.settlements)) if (town.factionId === faction.id) town.cell = cell;
    for (const army of Object.values(state.armies)) if (army.factionId === faction.id) army.cell = cell;
  });
  state.explored[owner] = new Set<number>();
  const commands: Extract<GameCommand, { type: 'setTheater' }>[] = [];
  for (let theater = 0; theater < MAX_THEATERS_PER_FACTION; theater++) {
    const x = 16 + theater % 4 * 64, y = 16 + Math.floor(theater / 4) * 64;
    const ready = (y + 2) * width + x + 4, trapped = (y + 40) * width + x + 40;
    const settlementIds = Array.from({ length: MAX_THEATER_HEARTHS }, (_, hearth) => cloneHearth(state, template,
      (y + Math.floor(hearth / 4) * 8) * width + x + hearth % 4 * 8, `Authored watch ${theater + 1}.${hearth + 1}`).id);
    const armyIds = Array.from({ length: MAX_THEATER_MEMBERS }, () => addGuard(state, ready)).sort();
    armyIds.forEach((id, index) => { if (index % 2 === 0) state.armies[id]!.cell = trapped; });
    for (const cell of neighbors(trapped, width, height)) { state.world.terrain[cell] = 0; state.world.biome[cell] = 0; state.world.fertility[cell] = 0; state.world.waterDepth[cell] = 1; }
    for (let row = y - 2; row <= y + 42; row++) for (let col = x - 2; col <= x + 42; col++) state.explored[owner]!.add(row * width + col);
    commands.push({ type: 'setTheater', factionId: owner, name: `Authored ceiling watch ${theater + 1}`, settlementIds, armyIds,
      reserveCell: (y + 28) * width + x + 28, guardsPerSettlement: 4, enabled: true });
  }
  state.world.starts[0] = state.settlements[commands[0]!.settlementIds[0]!]!.cell;
  rebaseAuthoredLand(state);
  return commands;
}

function measure(size: Scale, workload: Workload) {
  console.error(`Preparing ${size}-${workload}; fixture setup and save loading are outside phase timings.`);
  let state = matureCampaign(size);
  const commands = workload === 'ceiling' ? ceiling(state) : representative(state);
  if (reinforcement) {
    for (const command of commands) {
      command.reinforcementLimit = 2;
      for (const id of command.settlementIds) {
        const town = state.settlements[id]!, cell = neighbors(town.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
        assert.notEqual(cell, undefined);
        const enemyId = addGuard(state, cell);
        state.armies[enemyId]!.factionId = state.factions[1]!.id;
        state.armies[enemyId]!.name = 'Authored visible wartime pressure';
      }
    }
    refreshAuthoredSight(state);
    if (!state.wars.some(pair => pair.includes(state.turnOwnerId) && pair.includes(state.factions[1]!.id))) {
      const result = applyCommand(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: state.factions[1]!.id });
      assert(result.ok, result.error);
    }
  }
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const owner = state.turnOwnerId, baseline = getObservation(state, owner, options);
  const journal = createJournal(state, { mode: 'watch', coverage: 'from-save' });
  for (const command of commands) {
    const result = journal.record(state, command);
    assert(result.ok, result.error);
  }
  const configured = getObservation(state, owner, options), snapshot = serializeGame(state);
  if (reinforcement) assert(configured.theaters!.every(theater => theater.hearths.every(hearth => (hearth.reinforcement?.visibleEnemies ?? 0) >= 1 && hearth.required > theater.guardsPerSettlement)));
  assert.deepEqual({ ...configured, theaters: [], events: baseline.events }, baseline, 'Adding theater configuration must not alter other permitted facts beyond its domain events.');
  assert.equal(configured.events.filter(event => event.type === 'theater_saved').length, commands.length);
  const phaseMs: number[] = [], theaterReadMs: number[] = [], observationMs: number[] = [];
  let finalHash = '', finalView = configured, eventsCount = 0;
  let attempts = 0, accepted = 0, refused = 0;
  for (let iteration = 0; iteration <= samples; iteration++) {
    // Each independent sample loads the identical strict save. No previous
    // sample's routes, caches or armies turn the active workload into a no-op.
    const sample = deserializeGame(snapshot), events: DomainEvent[] = [];
    const phase = timed(() => advanceTheaters(sample, events));
    const compact = timed(() => observeTheaters(sample, owner));
    const observed = timed(() => getObservation(sample, owner, options));
    assert.deepEqual(observed.value.theaters, compact.value);
    assert.equal(compact.value.length, commands.length);
    const dispatches = sample.theaters.flatMap(theater => theater.lastDispatches);
    assert(sample.theaters.every(theater => theater.lastDispatches.length === MAX_THEATER_DISPATCHES));
    attempts = dispatches.length; accepted = dispatches.filter(dispatch => dispatch.accepted).length; refused = attempts - accepted;
    assert(accepted > 0, 'The measured phase must perform real movement.');
    if (workload === 'ceiling') assert(refused > 0, 'The ceiling phase must retain real refused attempts.');
    const hash = stateHash(sample);
    if (finalHash) assert.equal(hash, finalHash, 'Identical phase inputs must yield identical canonical state.');
    finalHash = hash; finalView = observed.value; eventsCount = events.length;
    if (iteration > 0) { phaseMs.push(phase.ms); theaterReadMs.push(compact.ms); observationMs.push(observed.ms); }
    if (iteration === samples) assert.equal(stateHash(deserializeGame(serializeGame(sample))), finalHash);
  }
  // Separate integration proof: ordinary journaled endTurn includes movement,
  // economy, postings and theater allocation in their actual canonical order.
  const endTurn = journal.record(state, { type: 'endTurn', factionId: owner });
  assert(endTurn.ok, endTurn.error);
  const archive = journal.materialize(), replayed = replayArchive(archive), canonicalHash = stateHash(state);
  assert.equal(stateHash(replayed), canonicalHash);
  assert.equal(stateHash(deserializeGame(serializeGame(state))), canonicalHash);
  assert.deepEqual(getObservation(replayed, owner, options), getObservation(state, owner, options));
  return { size, workload, reinforcement, synthetic: true,
    geography: workload === 'ceiling' ? 'Authored flat land with eight small isolated member islands; generated geography replaced.' : 'Original generated geography; authored nearby second hearth, charted route corridor and100 guard companies.',
    generatorVersion: state.world.generatorVersion, cells: state.world.terrain.length, factions: state.factions.length, armies: Object.keys(state.armies).length,
    theaters: commands.length, assignedHearths: commands.reduce((sum, command) => sum + command.settlementIds.length, 0), assignedMembers: commands.reduce((sum, command) => sum + command.armyIds.length, 0),
    dispatchBudgetPerTheater: MAX_THEATER_DISPATCHES, phaseAttempts: attempts, phaseAccepted: accepted, phaseRefused: refused, phaseDomainEvents: eventsCount,
    observedCells: finalView.cells.length, fullOwnObservationBytes: bytes(finalView), theaterArrayBytes: bytes(finalView.theaters), configurationAddedObservationBytes: bytes(configured) - bytes(baseline),
    warmups: 1, measuredSamples: samples, timings: { theaterPhase: summary(phaseMs), isolatedTheaterRead: summary(theaterReadMs), completeOwnObservation: summary(observationMs) },
    repeatedPhaseHash: finalHash, canonicalEndTurnHash: canonicalHash, archiveBytes: bytes(archive), ordinaryTheaterCommandsAccepted: commands.length,
    exactPhaseRepeat: true, strictSaveRoundtrip: true, canonicalEndTurnArchiveReplay: true, replayOwnObservationMatches: true };
}

const report = { version: 1, sourceRevision: process.env.BENCHMARK_REVISION ?? 'uncommitted candidate; see retained invocation', saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  node: process.version, platform: platform(), cpu: cpus()[0]?.model,
  scope: 'Headless canonical phase and observation timing, one warmup and independent identical-save samples. Setup/loading/hashing/archive replay are excluded. Complete observations follow the phase and isolated theater read, with their caches already available. One active realm, not simultaneous64-realm saturation, browser/worker transport or campaign pacing. Route expansion counters are not exposed; this does not claim worst-case search-budget saturation. Movement can legitimately change sight.',
  scenarios: cases.filter(item => !selectedCase || item.name === selectedCase).map(item => measure(item.size, item.workload)),
};
if (output) { const target = resolve(output); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
