/** Read-only instrumentation of the ordinary measure-pacing decision protocol.
 * Never changes policy, content, prices, commands, observations or route limits.
 * Run sequentially with other campaign measurements, never in CI. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_HASH } from '../packages/content/src';
import { hexDistance } from '../packages/mapgen/src';
import { planTurnWithReasons } from '../packages/ai/src';
import { assessProjectHosts } from '../packages/ai/src/progression';
import { heldDelegatedArmyIds } from '../packages/ai/src/theaters';
import { applyCommand, createGame, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHashForVersion, type GameCommand, type Observation } from '../packages/sim/src';
import { withRules } from '../packages/sim/src/rules';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  process.stdout.write('node --import tsx scripts/diagnose-patrol-ai.ts [--out=directory] [--max-rounds=900] [--pace=standard|long|epic] [--seed=uint32]\nDefault: rules35 Long, Standard map, 12 realms, seed20260905. A shorter cap is a smoke run only. Refuses to overwrite output.\n');
  process.exit(0);
}
assert(args.every(arg => /^--(out|max-rounds|pace|seed)=.+$/.test(arg)), 'Unknown argument. Use --help.');
assert.equal(new Set(args.map(arg => arg.slice(0, arg.indexOf('=')))).size, args.length, 'Options must not be repeated.');
const option = (key: string) => args.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
const out = option('out') ?? 'docs/development/2026-10-24-patrol-recovery/diagnosis-long';
const maxRounds = Number(option('max-rounds') ?? 900);
const pace = option('pace') ?? 'long', seed = Number(option('seed') ?? 20260905);
assert(pace === 'standard' || pace === 'long' || pace === 'epic', 'Pace must be standard, long or epic.');
assert(Number.isInteger(seed) && seed >= 0 && seed <= 0xffff_ffff, 'Seed must be uint32.');
assert(Number.isInteger(maxRounds) && maxRounds >= 1 && maxRounds <= 900, 'Round cap must be 1..900.');
assert(!existsSync(out), 'Preserve previous diagnostics: output directory already exists.');
mkdirSync(out, { recursive: true });
const configuration = { seed, pace, size: 'standard', factionCount: 12, rulesVersion: 35 } as const;
const sha256 = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['scripts/diagnose-patrol-ai.ts', 'scripts/measure-pacing.ts', 'packages/ai/src/index.ts', 'packages/ai/src/patrols.ts', 'packages/ai/src/theaters.ts', 'packages/ai/src/progression.ts', 'packages/sim/src/patrols.ts', 'packages/sim/src/simulation.ts'];
writeFileSync(join(out, 'metadata.json'), JSON.stringify({ configuration, maxRounds, contentHash: CONTENT_HASH,
  scope: 'Ordinary observation-fed AI. No counterfactual commands. Global canonical facts are labeled separately and never passed to the planner. Selected source fingerprints are not a whole-repository manifest.',
  bounds: { plans: 25000, patrolSamples: 20000, readinessSamples: 15000, snapshots: 3, threatsPerPatrol: 12, projectHosts: 8, patrolBlockedEvents: 64 },
  selectedSourceHashes: Object.fromEntries(sourcePaths.map(path => [path, sha256(readFileSync(path, 'utf8'))])) }, null, 2) + '\n');
const streams = { plans: openSync(join(out, 'proposals.jsonl'), 'wx'), patrols: openSync(join(out, 'patrol-states.jsonl'), 'wx'), readiness: openSync(join(out, 'readiness.jsonl'), 'wx') };
const rowCounts = { plans: 0, patrols: 0, readiness: 0 };
function emit(kind: keyof typeof streams, row: unknown) {
  const limit = kind === 'plans' ? 25000 : kind === 'patrols' ? 20000 : 15000;
  assert(++rowCounts[kind] <= limit, `Diagnostic ${kind} cap exceeded; retained evidence is incomplete.`);
  writeSync(streams[kind], JSON.stringify(row) + '\n');
}
const game = createGame(configuration), commandTrace = createHash('sha256');
const commandCounts: Record<string, number> = {}, eventCounts: Record<string, number> = {};
const patrolBlockedEvents: { turn: number; factionId: string; message: string; commandSequence: number }[] = [];
let refused = 0, automaticRefusals = 0, patrolRouteAttempts = 0, patrolRouteRefusals = 0;
let planSequence = 0, commandSequence = 0;
const history = new Map<string, { signature: string; cell: number | null; lastTurn: number; stationaryTurns: number; pausedSince: number | null; maxPaused: number; last: unknown }>();
const readiness = new Map<string, string>();
const readinessHistory: { factionId: string; turn: number; facts: unknown }[] = [];
const snapshots: { path: string; factionId: string; armyId: string; turn: number; reason: string; stateHash: string; sha256: string; beforePlan: number; permittedSafety: unknown }[] = [];
const snapshotKinds = new Set<string>();

function snapshot(factionId: string, armyId: string, reason: string) {
  if (snapshots.length >= 3 || snapshotKinds.has(reason)) return;
  const bytes = serializeGame(game), hash = stateHashForVersion(game, 35);
  assert.equal(stateHashForVersion(deserializeGame(bytes), 35), hash, 'Problem snapshot must reload exactly.');
  const path = `snapshot-${snapshots.length + 1}-turn-${game.turn}.json`;
  writeFileSync(join(out, path), bytes);
  const view = getObservation(game, factionId), patrol = view.patrols?.find(item => item.armyId === armyId);
  const army = view.armies.find(item => item.id === armyId), route = view.routes.find(item => item.armyId === armyId);
  const preview = army && patrol ? getMovementPreview(view, armyId, patrol.targetCell) : null;
  const permittedSafety = { source: 'own-permitted-observation', patrol, armyCell: army?.cell ?? null,
    movementBlocker: army?.movementBlocker ?? null, route: route ?? null,
    singleWaypointMatchesPatrolTarget: Boolean(route?.waypoints.length === 1 && route.waypoints[0] === patrol?.targetCell),
    atPatrolTarget: army?.cell === patrol?.targetCell, preview };
  assert.equal(stateHashForVersion(game, 35), hash, 'Snapshot inspection must not mutate canonical state.');
  snapshots.push({ path, factionId, armyId, turn: game.turn, reason, stateHash: hash, sha256: sha256(bytes), beforePlan: planSequence, permittedSafety });
  snapshotKinds.add(reason);
}

function inspect(view: Observation, commands: GameCommand[]) {
  const ownTowns = view.settlements.filter(town => town.factionId === view.factionId);
  const ownByCell = new Map(ownTowns.map(town => [town.cell, town]));
  const enemies = new Set(view.wars);
  const threats = view.armies.filter(army => enemies.has(army.factionId) && army.canAttack && !army.carrierId);
  const canonicalTowns = new Map(Object.values(game.settlements).map(town => [town.cell, town]));
  const ownPatrols = view.patrols ?? [];
  const heldArmyIds = heldDelegatedArmyIds(view);
  for (const patrol of ownPatrols) {
    const army = view.armies.find(item => item.id === patrol.armyId && item.factionId === view.factionId);
    const route = view.routes.find(item => item.armyId === patrol.armyId);
    const old = history.get(patrol.armyId), cell = army?.cell ?? null;
    // A repeated sampled cell is not proof of zero movement (a short loop can
    // return). Only paused-route duration is an exact persistent-order signal.
    const stationaryTurns = old && cell === old.cell ? old.stationaryTurns + view.turn - old.lastTurn : 0;
    const pausedSince = route?.status === 'paused' ? old?.pausedSince ?? view.turn : null;
    const pausedTurns = pausedSince === null ? 0 : view.turn - pausedSince;
    const endpoints = [patrol.firstCell, patrol.secondCell].map(endpoint => ({ cell: endpoint,
      stillOwnedHearth: ownByCell.has(endpoint), observedTown: view.settlements.find(town => town.cell === endpoint)?.id ?? null }));
    const near = threats.map(threat => ({ id: threat.id, factionId: threat.factionId, cell: threat.cell, strength: threat.strength,
      armyDistance: cell === null ? null : hexDistance(cell, threat.cell, view.width),
      withinArmySight: army ? hexDistance(army.cell, threat.cell, view.width) <= army.sight : false,
      distance: Math.min(...[cell, patrol.firstCell, patrol.secondCell].filter((point): point is number => point !== null).map(point => hexDistance(point, threat.cell, view.width))) }))
      .filter(threat => threat.distance <= 6).sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
    const actorOrders = commands.filter(command => 'armyId' in command && command.armyId === patrol.armyId
      || 'sourceArmyId' in command && (command.sourceArmyId === patrol.armyId || command.targetArmyId === patrol.armyId));
    const facts = { patrol, army: army ? { id: army.id, cell, strength: army.strength, formations: army.formations.length, morale: army.morale,
      fatigue: army.fatigue, movement: army.movement, movementBlocker: army.movementBlocker, upkeep: army.upkeep } : null,
      route: route ?? null, singleWaypointMatchesPatrolTarget: Boolean(route?.waypoints.length === 1 && route.waypoints[0] === patrol.targetCell),
      atPatrolTarget: cell === patrol.targetCell, supply: view.supply.find(item => item.armyId === patrol.armyId) ?? null, endpoints,
      visibleThreats: near.slice(0, 12), visibleThreatCount: near.length, wars: view.wars,
      heldByOrdinaryDelegationPlanner: heldArmyIds.has(patrol.armyId), actorOrders };
    const signature = JSON.stringify(facts);
    if (!old || old.signature !== signature || view.turn % 10 === 0 || pausedTurns === 8) emit('patrols', {
      turn: view.turn, phase: 'before-own-plan-commands', planSequence, factionId: view.factionId, armyId: patrol.armyId,
      observed: facts, sampledStationaryTurns: stationaryTurns, pausedRouteTurns: pausedTurns,
      globalDiagnosticOnly: { endpointActualOwners: [patrol.firstCell, patrol.secondCell].map(endpoint => ({ cell: endpoint, owner: canonicalTowns.get(endpoint)?.factionId ?? null })) },
    });
    history.set(patrol.armyId, { signature, cell, lastTurn: view.turn, stationaryTurns, pausedSince, maxPaused: Math.max(old?.maxPaused ?? 0, pausedTurns), last: facts });
    if (patrol.enabled && pausedTurns >= 8) snapshot(view.factionId, patrol.armyId, 'enabled-patrol-route-paused-eight-turns');
    if (patrol.enabled && pausedTurns >= 8 && !view.wars.length) snapshot(view.factionId, patrol.armyId, 'enabled-patrol-still-paused-during-peace');
    if (patrol.enabled && endpoints.some(endpoint => !endpoint.stillOwnedHearth)) snapshot(view.factionId, patrol.armyId, 'enabled-home-patrol-endpoint-no-longer-owned');
  }
  for (const [armyId, old] of history) if (game.patrols.every(patrol => patrol.armyId !== armyId) && old.signature !== 'removed') {
    emit('patrols', { turn: view.turn, phase: 'before-own-plan-commands', armyId, globalDiagnosticOnly: { removedFromCanonicalRegister: true }, previousObserved: old.last });
    old.signature = 'removed';
  }
  const project = view.progression.project;
  const ownProjects = view.projects.filter(item => item.factionId === view.factionId);
  const milestone = { blockers: project.blockers, eligibleSettlementIds: project.eligibleSettlementIds,
    affordable: view.treasury >= project.coinCost, technologies: view.progression.technologies,
    institutionId: view.progression.institutionId, doctrineId: view.progression.doctrineId,
    projects: ownProjects.map(item => ({ id: item.id, status: item.status, reason: item.statusReason })),
    ownHearths: ownTowns.map(town => town.id).sort(), wars: view.wars };
  const key = JSON.stringify(milestone);
  if (readiness.get(view.factionId) !== key || view.turn % 10 === 0 || commands.some(command => command.type === 'startVictoryProject')) {
    const facts = { ...milestone, treasury: view.treasury, knowledge: view.knowledge, coinCost: project.coinCost,
      economy: view.growth?.economy ?? null, projects: ownProjects,
      assessedHosts: assessProjectHosts(view).slice(0, 8), proposedProjectOrders: commands.filter(command => command.type === 'startVictoryProject') };
    const row = { factionId: view.factionId, turn: view.turn, facts: structuredClone(facts) };
    readinessHistory.push(row); emit('readiness', { ...row, planSequence, phase: 'before-own-plan-commands', source: 'permitted-observation' });
    readiness.set(view.factionId, key);
  }
}

function plan(factionId: string, phase: 'ordinary' | 'capture') {
  const view = getObservation(game, factionId), result = planTurnWithReasons(view);
  planSequence++;
  emit('plans', { planSequence, turn: game.turn, factionId, phase, commands: result.commands, reasons: result.reasons });
  if (phase === 'ordinary') inspect(view, result.commands);
  return result.commands;
}
function issue(command: GameCommand) {
  const turn = game.turn, result = applyCommand(game, command);
  commandSequence++;
  commandTrace.update(JSON.stringify({ turn, command, result }) + '\n');
  commandCounts[command.type] = (commandCounts[command.type] ?? 0) + 1;
  for (const event of result.events) {
    eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
    if (event.type === 'theater_dispatch_blocked') automaticRefusals++;
    if (event.type === 'patrol_blocked' && patrolBlockedEvents.length < 64) patrolBlockedEvents.push({
      turn: event.turn, factionId: event.factionId, message: event.message, commandSequence,
    });
  }
  if (!result.ok) { refused++; process.stderr.write(`refused ${JSON.stringify({ turn, command, error: result.error })}\n`); }
  if (result.ok && command.type === 'endTurn') for (const patrol of game.patrols) if (patrol.lastAttemptTurn === game.turn) {
    patrolRouteAttempts++; if (patrol.lastError) patrolRouteRefusals++;
  }
}

try {
  withRules(game, 35, () => {
    for (let round = 0; round < maxRounds && !game.victory; round++) {
      for (const faction of game.factions) for (const command of plan(faction.id, 'ordinary')) {
        issue(command);
        for (let decisions = 0; game.battle || game.pendingCapture; decisions++) {
          if (decisions >= 4) throw new Error('Pending tactical or capture decisions exceeded their bound.');
          if (game.battle) {
            const battle = game.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (game.pendingCapture) {
            const choice = plan(game.pendingCapture.factionId, 'capture')[0];
            if (!choice || choice.type !== 'resolveCapture') throw new Error('Missing capture choice.');
            issue(choice);
          }
        }
      }
      issue({ type: 'endTurn', factionId: game.turnOwnerId });
      if (game.turn % 25 === 0) process.stdout.write(`diagnosis turn ${game.turn}, ${game.patrols.length} patrols, ${snapshots.length} snapshots\n`);
    }
    const finalHash = stateHashForVersion(game, 35);
    assert.equal(stateHashForVersion(deserializeGame(serializeGame(game)), 35), finalHash);
    const summary = { configuration, turn: game.turn, winner: game.victory?.factionId ?? null, path: game.victory?.path ?? 'none',
      completeCampaign: Boolean(game.victory), finalHash, refused, automaticRefusals, patrolRouteAttempts, patrolRouteRefusals,
      commandCounts, eventCounts, commandSequence, commandResultTraceSha256: commandTrace.digest('hex'), rowCounts, snapshots,
      patrolBlockedEvents, patrolBlockedEventsOmitted: (eventCounts.patrol_blocked ?? 0) - patrolBlockedEvents.length,
      patrolSummaries: [...history].map(([armyId, item]) => ({ armyId, maxPausedRouteTurns: item.maxPaused, lastSampledTurn: item.lastTurn, lastObserved: item.last })),
      winnerReadiness: readinessHistory.filter(row => row.factionId === game.victory?.factionId),
      finalProjectsGlobalDiagnosticOnly: game.projects };
    writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    process.stdout.write(JSON.stringify({ turn: game.turn, finalHash, winner: summary.winner, refused, snapshots: snapshots.length }) + '\n');
  });
} finally { for (const fd of Object.values(streams)) closeSync(fd); }
