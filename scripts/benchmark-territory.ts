import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { cpus, platform, release, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { CONTENT_HASH, FACTIONS, IMPROVEMENTS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getLandObservation, getObservation, observeLandCell, refreshLandKnowledge, SAVE_VERSION, serializeGame, stateHash, type CommandResult, type GameCommand, type GameState, type LandCellObservation } from '@theandril/sim';
import { planTurn } from '../packages/ai/src/index';
import { indexes, rebuildIndexes } from '../packages/sim/src/visibility';
import { matureCampaign } from '../packages/test-fixtures/src/index';

const EXPECTED_CONTENT = '9418e598';
const WARMUPS = 4, SAMPLES = 20;
const landTypes = new Set(['claimCell', 'setWorkedTiles', 'improveTile', 'terraformTile', 'cancelLandWork', 'setCapital']);
const yieldKeys = ['food', 'industry', 'coin', 'knowledge'] as const;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function invariant(value: unknown, message: string): asserts value { if (!value) throw new Error('Territory benchmark: ' + message); }
function issue(game: GameState, command: GameCommand): CommandResult {
  const result = applyCommand(game, command);
  invariant(result.ok, JSON.stringify(command) + ': ' + result.error);
  return result;
}
function timed<T>(operation: () => T) { const started = performance.now(), result = operation(); return { result, ms: performance.now() - started }; }
function distribution(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples: sorted.length, meanMs: sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : null,
    medianMs: sorted[Math.floor(sorted.length / 2)] ?? null, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? null, maxMs: sorted.at(-1) ?? null };
}
function strictRestore(game: GameState): GameState {
  const save = serializeGame(game), raw = JSON.parse(save) as { version: number; contentHash: string };
  invariant(raw.version === 9 && raw.contentHash === EXPECTED_CONTENT, 'snapshot guard must be schema9 and sealed current content');
  const restored = deserializeGame(save);
  invariant(stateHash(restored) === stateHash(game), 'strict snapshot roundtrip changed state');
  return restored;
}
function geographySeal(game: GameState): string {
  const world = game.world, hash = createHash('sha256');
  hash.update(JSON.stringify({ seed: world.seed, version: world.generatorVersion, width: world.width, height: world.height, starts: world.starts }));
  for (const values of [world.terrain, world.fertility, world.waterDepth, world.biome]) hash.update(values);
  return hash.digest('hex');
}
function counts(game: GameState) {
  const land = Object.values(game.land.settlements);
  return { turn: game.turn, cells: game.world.terrain.length, factions: game.factions.length, cultures: new Set(game.factions.map(faction => faction.definitionId)).size,
    armies: Object.keys(game.armies).length, formations: Object.values(game.armies).reduce((sum, army) => sum + army.formations.length, 0), towns: Object.keys(game.settlements).length,
    claimed: land.reduce((sum, town) => sum + town.claimed.length, 0), worked: land.reduce((sum, town) => sum + town.worked.length, 0),
    improvements: land.reduce((sum, town) => sum + Object.keys(town.improvements).length, 0), biomeOverrides: Object.keys(game.land.biomes).length,
    activeWork: land.filter(town => town.work).length, knownLandEntries: Object.values(game.land.known).reduce((sum, memory) => sum + Object.keys(memory).length, 0),
    maxClaimsPerTown: Math.max(0, ...land.map(town => town.claimed.length)), maxWorkersPerTown: Math.max(0, ...land.map(town => town.worked.length)),
    population: Object.values(game.settlements).reduce((sum, town) => sum + town.population, 0),
    landJsonBytes: Buffer.byteLength(JSON.stringify(game.land)), heapUsedBytes: process.memoryUsage().heapUsed, rssBytes: process.memoryUsage().rss };
}

function generatedCampaign(smoke: boolean) {
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 6, pace: 'epic' });
  invariant(new Set(game.factions.map(faction => faction.definitionId)).size === 6, 'generated run must include all six cultures');
  strictRestore(game);
  const initialSnapshot = serializeGame(game), initial = counts(game), rounds = smoke ? 8 : 100;
  const history: { command: GameCommand; result: CommandResult }[] = [];
  const commands: Record<string, number> = {}, events: Record<string, number> = {}, landCoinByFaction: Record<string, number> = {};
  const plannerMs: number[] = [], commandMs: number[] = [], endTurnMs: number[] = [], fullMs: number[] = [];
  let mirror: GameState | undefined, mirrorCommands = 0, midpointHash = '', midpointBytes = 0;
  const submit = (command: GameCommand): number => {
    const faction = game.factions.find(faction => faction.id === command.factionId)!;
    const beforeCoin = faction.treasury;
    const applied = timed(() => issue(game, command));
    if (landTypes.has(command.type)) landCoinByFaction[faction.id] = (landCoinByFaction[faction.id] ?? 0) + beforeCoin - faction.treasury;
    if (mirror) { invariant(JSON.stringify(issue(mirror, command)) === JSON.stringify(applied.result), 'generated midpoint command/events differ'); mirrorCommands++; }
    history.push({ command: structuredClone(command), result: structuredClone(applied.result) });
    commands[command.type] = (commands[command.type] ?? 0) + 1;
    for (const event of applied.result.events) events[event.type] = (events[event.type] ?? 0) + 1;
    return applied.ms;
  };
  for (let round = 0; round < rounds; round++) {
    invariant(!game.victory, 'generated campaign ended before the fixed workload; do not suppress its terminal command');
    let plans = 0, resolutions = 0;
    for (const faction of game.factions) {
      const planned = timed(() => planTurn(getObservation(game, faction.id))); plans += planned.ms;
      invariant(JSON.stringify(planned.result) === JSON.stringify(planTurn(getObservation(game, faction.id))), 'observation-only plan is not deterministic');
      for (const command of planned.result) {
        resolutions += submit(command);
        for (let decision = 0; game.battle || game.pendingCapture; decision++) {
          invariant(decision < 5, 'pending battle/capture loop exceeded five decisions');
          if (game.battle) {
            const battle = game.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId;
            resolutions += submit({ type: 'autoResolveBattle', factionId: controller });
          } else {
            const capture = planTurn(getObservation(game, game.pendingCapture!.factionId))[0];
            invariant(capture?.type === 'resolveCapture', 'missing public AI capture response');
            resolutions += submit(capture);
          }
        }
      }
    }
    const ended = submit({ type: 'endTurn', factionId: game.turnOwnerId });
    plannerMs.push(plans); commandMs.push(resolutions); endTurnMs.push(ended); fullMs.push(plans + resolutions + ended);
    if (mirror) invariant(stateHash(mirror) === stateHash(game), 'generated midpoint state diverged');
    if (round === Math.floor(rounds / 2) - 1) {
      const saved = serializeGame(game); midpointBytes = Buffer.byteLength(saved); midpointHash = stateHash(game); mirror = strictRestore(game);
    }
  }
  invariant(mirror, 'generated midpoint was not retained');
  strictRestore(game);
  const replayed = deserializeGame(initialSnapshot), seal = createHash('sha256');
  for (const record of history) {
    invariant(JSON.stringify(issue(replayed, record.command)) === JSON.stringify(record.result), 'generated full replay result/events diverged');
    seal.update(JSON.stringify(record));
  }
  invariant(stateHash(replayed) === stateHash(game), 'generated full replay final hash diverged');
  const save = timed(() => serializeGame(game)), load = timed(() => deserializeGame(save.result));
  invariant(stateHash(load.result) === stateHash(game), 'generated final measured load differs');
  if (!smoke) invariant((commands.improveTile ?? 0) > 0 && (commands.terraformTile ?? 0) > 0 && (events.land_work_completed ?? 0) > 0, 'generated AI did not exercise improvements and cultivation');
  return { synthetic: false, seed: game.world.seed, size: 'tiny', pace: game.pace, rounds, initial, final: counts(game), commandCount: history.length, commandTypes: commands, eventTypes: events,
    landCoinByFaction, allFactionAiWithObservation: distribution(plannerMs), submittedCommands: distribution(commandMs), endTurn: distribution(endTurnMs), fullRoundWithoutVerification: distribution(fullMs),
    midpointHash, midpointBytes, mirroredCommands: mirrorCommands, resumedRounds: rounds - Math.floor(rounds / 2), replayedCommands: history.length, commandResultSeal: seal.digest('hex'),
    saveBytes: Buffer.byteLength(save.result), saveMs: save.ms, loadMs: load.ms, finalHash: stateHash(game), rejectedCommands: 0,
    note: 'Generated six-culture world, normal public AI commands without project deferral or authored resources. One plan per faction/round, bounded pending decisions. Timing excludes duplicate planner checks, midpoint mirror, hashing, history cloning and separate full replay. This is 100 rounds of behavior, not victory or a giant-map AI soak.' };
}

function landView(game: GameState, factionId: string) { return getLandObservation(game, factionId, indexes(game).visible.get(factionId)!); }
function cityView(game: GameState, settlementId: string) {
  const town = game.settlements[settlementId]!;
  const view = landView(game, town.factionId).settlements.find(land => land.settlementId === settlementId);
  invariant(view, 'missing owned land read model'); return view;
}
function verifyBreakdown(cell: LandCellObservation) {
  for (const key of yieldKeys) invariant(cell.yields.total[key] === Math.max(0, cell.yields.biome[key] + cell.yields.features[key] + cell.yields.affinity[key] + cell.yields.improvement[key] + cell.yields.featureModifiers[key]), 'signed yield components do not sum after final clamp');
}
function readSamples(game: GameState, samples: number) {
  const factionId = game.turnOwnerId, visible = indexes(game).visible.get(factionId)!;
  const before = stateHash(game), land: number[] = [], full: number[] = [], save: number[] = [], load: number[] = [];
  let expectedLand = '', expectedFull = '', saveBytes = 0;
  for (let index = 0; index < WARMUPS + samples; index++) {
    const landRead = timed(() => getLandObservation(game, factionId, visible)), fullRead = timed(() => getObservation(game, factionId));
    const saved = timed(() => serializeGame(game)), restored = timed(() => deserializeGame(saved.result));
    const landText = JSON.stringify(landRead.result), fullText = JSON.stringify(fullRead.result);
    if (index) invariant(landText === expectedLand && fullText === expectedFull, 'unchanged read model output changed');
    expectedLand = landText; expectedFull = fullText; saveBytes = Buffer.byteLength(saved.result);
    invariant(stateHash(restored.result) === before, 'sample load changed canonical state');
    for (const town of landRead.result.settlements) for (const cell of town.cells) verifyBreakdown(cell);
    if (index >= WARMUPS) { land.push(landRead.ms); full.push(fullRead.ms); save.push(saved.ms); load.push(restored.ms); }
  }
  invariant(stateHash(game) === before, 'read-only observation or serialization mutated game');
  const observed = landView(game, factionId);
  return { factionId, ownedTowns: observed.settlements.length, visibleCandidateCells: observed.settlements.reduce((sum, town) => sum + town.cells.length, 0),
    visibleCells: visible.size, exploredCells: game.explored[factionId]!.size, landObservationBytes: Buffer.byteLength(expectedLand), fullObservationBytes: Buffer.byteLength(expectedFull), saveBytes,
    getLandObservation: distribution(land), getObservation: distribution(full), serializeGame: distribution(save), deserializeGame: distribution(load), readOnlyHash: before,
    note: 'Standalone land read includes one own town (37 candidate cells) against the complete32/40-town registry. Full observation includes all ordinary own/currently visible entities. Four warmups excluded; schema validation is inside load timing, but JSON comparison, signed-yield checks and hashes are outside all timings.' };
}

/** A distinct authored read-only empire, never presented as an earned conquest. */
function manyTownReads(source: GameState, samples: number) {
  let game = strictRestore(source);
  const owner = game.turnOwnerId;
  for (const town of Object.values(game.settlements)) town.factionId = owner;
  for (const faction of game.factions) if (faction.id !== owner) game.land.capitals[faction.id] = null;
  const centers = new Set(Object.values(game.settlements).map(town => town.cell));
  const occupied = new Map(Object.values(game.armies).map(army => [army.cell, army.factionId]));
  const relocated = new Map<number, number>();
  for (const army of Object.values(game.armies)) if (army.factionId !== owner && centers.has(army.cell)) {
    let target = relocated.get(army.cell);
    if (target === undefined) {
      target = neighbors(army.cell, game.world.width, game.world.height).find(cell => !centers.has(cell) && isPassable(game.world.terrain[cell]!) && (!occupied.has(cell) || occupied.get(cell) === army.factionId));
      invariant(target !== undefined, 'many-town fixture lacks a legal adjacent site for the former garrison');
      relocated.set(army.cell, target); occupied.set(target, army.factionId);
    }
    army.cell = target;
  }
  rebuildIndexes(game);
  for (const faction of game.factions) refreshLandKnowledge(game, faction.id, indexes(game).visible.get(faction.id)!);
  game = strictRestore(game);
  const before = stateHash(game), landMs: number[] = [], fullMs: number[] = [], visible = indexes(game).visible.get(owner)!;
  let landText = '', fullText = '';
  for (let index = 0; index < WARMUPS + samples; index++) {
    const land = timed(() => getLandObservation(game, owner, visible)), full = timed(() => getObservation(game, owner));
    const nextLand = JSON.stringify(land.result), nextFull = JSON.stringify(full.result);
    if (index) invariant(nextLand === landText && nextFull === fullText, 'many-town read changed without a command');
    landText = nextLand; fullText = nextFull;
    if (index >= WARMUPS) { landMs.push(land.ms); fullMs.push(full.ms); }
  }
  invariant(stateHash(game) === before, 'many-town read mutated state');
  const land = landView(game, owner);
  return { synthetic: true, factionId: owner, ownTowns: land.settlements.length, ownClaimedTiles: land.settlements.reduce((sum, town) => sum + town.claimed.length, 0),
    ownWorkedTiles: land.settlements.reduce((sum, town) => sum + town.worked.length, 0), candidateCells: land.settlements.reduce((sum, town) => sum + town.cells.length, 0),
    visibleCells: visible.size, landObservationBytes: Buffer.byteLength(landText), fullObservationBytes: Buffer.byteLength(fullText), getLandObservation: distribution(landMs), getObservation: distribution(fullMs), readOnlyHash: before,
    note: 'Separate strict-loaded snapshot authors all existing towns to the first faction, relocates former foreign garrisons to an adjacent passable unoccupied hex, rebuilds sight and current land memory, and clears former capitals. No capture/movement commands or economic results are claimed. Army ownership/count and worked/improved geography remain intact. Measures32/40 own-town read models only; no turns, AI or land orders execute in this synthetic concentration.' };
}

type PaidOrder = { stage: string; factionId: string; settlementId: string; cell: number; type: 'improveTile' | 'terraformTile' | 'claimCell'; id: string | number; coinCost: number; turns: number; resultHash: string };
function matureWorkload(size: 'tiny' | 'huge' | 'legendary', smoke: boolean) {
  let game: GameState;
  if (size === 'tiny') {
    game = createGame({ seed: 20260905, size, factionCount: 6, pace: 'epic' });
    for (const faction of game.factions) {
      const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
      issue(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' Field' }); faction.treasury = 100_000;
    }
  } else game = matureCampaign(size);
  invariant(new Set(game.factions.map(faction => faction.definitionId)).size === 6, 'mature seats must use all six authored cultures');
  // Explicit synthetic population/food setup only. Founding, initial claims and
  // capitals came from public commands; no paid work or extra claims are injected.
  for (const town of Object.values(game.settlements)) { town.population = 8; town.food = 1000; }
  game = strictRestore(game);
  const initial = counts(game), initialGeographySeal = geographySeal(game), paid: PaidOrder[] = [];
  const plans: { settlementId: string; improve: GameCommand | null; cultivate: GameCommand | null; cultivatedCell: number | null; targetBiome: number | null }[] = [];
  const pay = (stage: string, command: GameCommand, quote: { coinCost: number; turns: number }) => {
    invariant(command.type === 'improveTile' || command.type === 'terraformTile' || command.type === 'claimCell', 'paid command kind differs');
    const faction = game.factions.find(faction => faction.id === command.factionId)!, before = faction.treasury;
    const result = issue(game, command); invariant(before - faction.treasury === quote.coinCost, 'paid command did not charge the exact public quote');
    paid.push({ stage, factionId: faction.id, settlementId: command.settlementId, cell: command.cell, type: command.type, id: command.type === 'improveTile' ? command.improvementId : command.type === 'terraformTile' ? command.biome : command.cell,
      coinCost: quote.coinCost, turns: quote.turns, resultHash: createHash('sha256').update(JSON.stringify(result)).digest('hex') });
  };
  for (const [townIndex, town] of Object.values(game.settlements).sort(byId).entries()) {
    // Bound thirty purchases per mature radius3 town; stop only at a legitimate
    // collision or coast/map-edge candidate limit, and report the actual count.
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = cityView(game, town.id).cells.find(cell => cell.claim.canStart);
      if (!candidate) break;
      pay('claims', { type: 'claimCell', factionId: town.factionId, settlementId: town.id, cell: candidate.cell }, candidate.claim);
    }
    const view = cityView(game, town.id);
    const improvements = view.cells.filter(cell => cell.canWork).flatMap(cell => cell.improvementOptions.filter(option => option.canStart).map(option => ({ cell, option })));
    improvements.sort((a, b) => ((IMPROVEMENTS.findIndex(item => item.id === a.option.improvementId) - townIndex % 5 + 5) % 5) - ((IMPROVEMENTS.findIndex(item => item.id === b.option.improvementId) - townIndex % 5 + 5) % 5) || a.cell.cell - b.cell.cell);
    const improvement = improvements[0];
    const cultivation = view.cells.filter(cell => cell.canWork && cell.cell !== improvement?.cell.cell).flatMap(cell => cell.terraformOptions.filter(option => option.canStart).map(option => ({ cell, option })))[0];
    invariant(improvement || cultivation, town.id + ' lacks any actual paid work opportunity');
    const candidates = view.cells.filter(cell => cell.canWork).sort((a, b) => b.yields.total.food - a.yields.total.food || a.cell - b.cell);
    const workers = [...new Set([...(improvement ? [improvement.cell.cell] : []), ...(cultivation ? [cultivation.cell.cell] : []), ...candidates.map(cell => cell.cell)])].slice(0, 6);
    invariant(workers.length === 6, town.id + ' lacks six legal worked tiles');
    issue(game, { type: 'setWorkedTiles', factionId: town.factionId, settlementId: town.id, cells: workers });
    plans.push({ settlementId: town.id, improve: improvement ? { type: 'improveTile', factionId: town.factionId, settlementId: town.id, cell: improvement.cell.cell, improvementId: improvement.option.improvementId } : null,
      cultivate: cultivation ? { type: 'terraformTile', factionId: town.factionId, settlementId: town.id, cell: cultivation.cell.cell, biome: cultivation.option.biome } : null, cultivatedCell: cultivation?.cell.cell ?? null, targetBiome: cultivation?.option.biome ?? null });
  }
  const improving = plans.filter(plan => plan.improve !== null), cultivating = plans.filter(plan => plan.cultivate !== null), first = cultivating[0];
  invariant(improving.length > plans.length / 2 && cultivating.length > plans.length / 2, 'cohort does not exercise representative paid improvement/cultivation activity');
  invariant(first && first.cultivatedCell !== null, 'no actual cultural cultivation site in the cohort');
  const witnessCell = first.cultivatedCell, town = game.settlements[first.settlementId]!;
  const observer = game.factions.find(faction => faction.id !== town.factionId && !indexes(game).visible.get(faction.id)!.has(witnessCell));
  invariant(observer, 'no actual fogged observer for the work target');
  // Explicit authored last-seen intelligence, not a read-side update or full reveal.
  game.explored[observer.id]!.add(witnessCell);
  const remembered = observeLandCell(game, observer.id, witnessCell, true);
  game = strictRestore(game);
  const claimed = counts(game), idleReads = readSamples(game, smoke ? 2 : SAMPLES);
  const startOrders = (stage: 'initial-improvement' | 'cultivation') => {
    for (const plan of plans) {
      const command = stage === 'initial-improvement' ? plan.improve : plan.cultivate;
      if (!command) continue;
      invariant(command.type === 'improveTile' || command.type === 'terraformTile', 'invalid staged land command');
      const cell = cityView(game, plan.settlementId).cells.find(cell => cell.cell === command.cell)!;
      const quote = command.type === 'improveTile' ? cell.improvementOptions.find(option => option.improvementId === command.improvementId)! : cell.terraformOptions.find(option => option.biome === command.biome)!;
      invariant(quote.canStart, 'staged public land quote rejected: ' + quote.blocker); pay(stage, command, quote);
    }
  };
  startOrders('initial-improvement');
  const activeReads = readSamples(game, smoke ? 2 : SAMPLES), fullTurns: number[] = [], activeTurns: number[] = [], idleTurns: number[] = [], settlementPhases: number[] = [], activeSettlementPhases: number[] = [], idleSettlementPhases: number[] = [];
  const activity: { turn: number; active: number; completed: number }[] = [];
  let mirror: GameState | undefined, midpointBytes = 0, mirroredCommands = 0, completed = 0;
  const rounds = 20, replaySuffix: { command: GameCommand; result: CommandResult }[] = [];
  let midpointSave = '';
  for (let round = 0; round < rounds; round++) {
    if (round === 4) {
      const before = paid.length; startOrders('cultivation');
      for (let index = before; index < paid.length; index++) {
        const plan = cultivating[index - before]!, result = issue(mirror!, plan.cultivate!);
        invariant(createHash('sha256').update(JSON.stringify(result)).digest('hex') === paid[index]!.resultHash, 'midpoint cultivation command/event mismatch');
        replaySuffix.push({ command: structuredClone(plan.cultivate!), result }); mirroredCommands++;
      }
    }
    const active = Object.values(game.land.settlements).filter(land => land.work).length;
    let phaseStart = 0, phaseMs = 0;
    const command: GameCommand = { type: 'endTurn', factionId: game.turnOwnerId };
    const ended = timed(() => applyCommand(game, command, (phase, edge) => {
      if (phase === 'settlements' && edge === 'start') phaseStart = performance.now();
      if (phase === 'settlements' && edge === 'end') phaseMs = performance.now() - phaseStart;
    }));
    invariant(ended.result.ok, 'mature endTurn rejected: ' + ended.result.error);
    const finished = ended.result.events.filter(event => event.type === 'land_work_completed').length;
    completed += finished; activity.push({ turn: game.turn, active, completed: finished });
    fullTurns.push(ended.ms); (active ? activeTurns : idleTurns).push(ended.ms); settlementPhases.push(phaseMs); (active ? activeSettlementPhases : idleSettlementPhases).push(phaseMs);
    if (mirror) {
      invariant(JSON.stringify(issue(mirror, command)) === JSON.stringify(ended.result), 'mid-work result/events diverged');
      invariant(stateHash(mirror) === stateHash(game), 'mid-work hash diverged');
      replaySuffix.push({ command, result: structuredClone(ended.result) }); mirroredCommands++;
    }
    if (round === 0) {
      invariant(improving.every(plan => { const work = game.land.settlements[plan.settlementId]!.work; return work && work.remainingTurns < work.turns; }), 'midpoint work is not active');
      midpointSave = serializeGame(game); midpointBytes = Buffer.byteLength(midpointSave); mirror = strictRestore(game);
    }
  }
  invariant(completed === improving.length + cultivating.length, 'not all paid improvements/cultivations completed');
  for (const plan of plans) {
    if (plan.cultivatedCell !== null) invariant(game.land.biomes[plan.cultivatedCell] === plan.targetBiome, 'cultivation did not persist as an actual override');
    if (plan.improve) invariant(plan.improve.type === 'improveTile' && game.land.settlements[plan.settlementId]!.improvements[plan.improve.cell] === plan.improve.improvementId, 'completed improvement disappeared');
  }
  const replayed = deserializeGame(midpointSave);
  for (const record of replaySuffix) invariant(JSON.stringify(issue(replayed, record.command)) === JSON.stringify(record.result), 'mid-work suffix replay differs');
  invariant(stateHash(replayed) === stateHash(game), 'mid-work suffix replay seal differs');
  const beforeQueries = stateHash(game), own = observeLandCell(game, town.factionId, witnessCell), fogged = observeLandCell(game, observer.id, witnessCell);
  invariant(own.biome === first.targetBiome && JSON.stringify(fogged) === JSON.stringify(remembered), 'visible/fogged work query leaked current cultivation or lost own view');
  invariant(!indexes(game).visible.get(observer.id)!.has(witnessCell), 'fogged witness became visible');
  const foreignView = getObservation(game, observer.id).cells.find(cell => cell.cell === witnessCell);
  invariant(foreignView && foreignView.biome === remembered.biome, 'full foreign observation leaked changed unseen biome');
  invariant(stateHash(game) === beforeQueries, 'fogged/visible queries rewrote memory');
  invariant(geographySeal(game) === initialGeographySeal, 'paid territory work changed immutable geography');
  strictRestore(game);
  const outputs = plans.map(plan => {
    const town = game.settlements[plan.settlementId]!, view = cityView(game, plan.settlementId);
    const cells = view.cells.filter(cell => cell.improvementId || cell.cell === plan.cultivatedCell);
    for (const cell of cells) verifyBreakdown(cell);
    return { factionId: town.factionId, definitionId: game.factions.find(faction => faction.id === town.factionId)!.definitionId, settlementId: town.id, totalLandYield: view.yields,
      cells: cells.map(cell => ({ cell: cell.cell, biome: cell.biome, features: cell.features, worked: cell.worked, improvementId: cell.improvementId, yields: cell.yields })) };
  });
  return { size, synthetic: true, seed: game.world.seed, initial, afterPaidClaimsAndWorkers: claimed, final: counts(game), rounds, paid,
    publicFoundings: initial.towns, workerOrders: plans.length, paidCommands: paid.length, improvementEligibleTowns: improving.length, cultivationEligibleTowns: cultivating.length,
    paidCoin: paid.reduce((sum, order) => sum + order.coinCost, 0), initialImprovementTypes: Object.fromEntries(IMPROVEMENTS.map(definition => [definition.id, paid.filter(order => order.id === definition.id).length])),
    completedWork: completed, activeWorkByRound: activity, fullEndTurn: distribution(fullTurns), activeEndTurn: distribution(activeTurns), idleEndTurn: distribution(idleTurns), settlementPhaseIncludingLand: distribution(settlementPhases), activeSettlementPhase: distribution(activeSettlementPhases), idleSettlementPhase: distribution(idleSettlementPhases),
    idleReads, activeReads, midpointBytes, mirroredCommands, replayedSuffixCommands: replaySuffix.length, finalHash: stateHash(game), immutableGeographySeal: initialGeographySeal, finalWorkOutputs: outputs,
    fogProof: { cell: witnessCell, owner: town.factionId, observer: observer.id, before: remembered, afterOwner: own, afterFogged: fogged, observationBiome: foreignView.biome, readOnlyHash: beforeQueries }, manyTownObservation: manyTownReads(game, smoke ? 2 : SAMPLES), rejectedCommands: 0,
    note: 'Existing matureCampaign supplies1500/4000 singleton armies and32/40 normally founded towns with100000 authored coin per faction. Population8 and food1000 are authored before strict schema9 load; geography is untouched. Each town buys up to30 further claims and assigns six workers. Eligible towns buy an improvement, then eligible distinct worked sites receive cultural cultivation; unavailable improvement sites and already adapted landscapes are counted honestly, not artificially replaced. Twenty actual end turns; active/idle counts explicit, no AI invasion or fabricated ongoing work. One foreign last-seen land cell is authored before validation, then its unseen changes stay fogged. Setup, all paid orders, query verification, mirrors and separate suffix replay are excluded from timings; settlement phase includes ordinary economy/growth plus land work.' };
}

export function benchmarkTerritory(options: { smoke?: boolean } = {}) {
  invariant(Number(SAVE_VERSION) === 9 && CONTENT_HASH === EXPECTED_CONTENT, 'refuse timing unsealed rules/content; update benchmark guard only after an intentional new report');
  const smoke = options.smoke ?? false;
  return { capturedAt: new Date().toISOString(), command: 'node --import tsx scripts/benchmark-territory.ts' + (smoke ? ' --smoke' : ''), runtime: process.version, cpu: cpus()[0]?.model,
    logicalCpus: cpus().length, installedMemoryBytes: totalmem(), os: platform() + ' ' + release(), saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH, generatorVersion: 4, smoke, cultures: FACTIONS.map(faction => faction.id),
    generated: generatedCampaign(smoke), mature: (smoke ? ['tiny'] as const : ['huge', 'legendary'] as const).map(size => matureWorkload(size, smoke)),
    scope: 'Sequential territory-only canonical/AI diagnostic. No browser, rendering, art processing, giant-map AI soak, archive storage or network timings. Heap/RSS are unforced-GC process snapshots including mirrors and validation allocations, not retained-memory or leak proof.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  invariant(args.every(arg => arg === '--smoke' || arg === '--output'), 'arguments: --smoke and --output');
  const result = JSON.stringify(benchmarkTerritory({ smoke: args.includes('--smoke') }), null, 2) + '\n';
  if (args.includes('--output')) {
    invariant(!args.includes('--smoke'), 'smoke must not overwrite the final measured report');
    writeFileSync(resolve('docs/performance/0015-territory.json'), result);
  }
  console.log(result);
}
