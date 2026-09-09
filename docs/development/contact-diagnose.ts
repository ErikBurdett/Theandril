import { appendFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '../../packages/sim/src/index';
import { hexDistance, type MapSize } from '../../packages/mapgen/src/index';
import { planTurnWithReasons } from '../../packages/ai/src/index';
import { createNavigation } from '../../packages/ai/src/navigation';
import { rulesVersion } from '../../packages/sim/src/rules';

// Diagnostic state access never crosses into the planner. All actual AI input is
// the same ordinary observation and one-per-seat-per-turn cadence as contact.test.
const label = process.argv[2] ?? 'probe';
const size = (process.argv[3] ?? 'standard') as MapSize;
const factionCount = Number(process.argv[4] ?? 4), limit = Number(process.argv[5] ?? 140);
const seed = Number(process.argv[6] ?? 748291);
const prefix = new URL(`./contact-${label}`, import.meta.url);
const path = (suffix: string) => new URL(prefix.href + suffix);
const state = createGame({ seed, size, factionCount, pace: 'long' });
const initial = serializeGame(state), initialHash = stateHash(state);
writeFileSync(path('-initial.json.gz'), gzipSync(initial));
writeFileSync(path('-commands.jsonl'), ''); writeFileSync(path('-plans.jsonl'), '');
const firstContact: Record<string, number | null> = Object.fromEntries(state.factions.map(f => [f.id, null]));
const contacts: unknown[] = [], timings: number[] = [], commands: { command: GameCommand; result: unknown }[] = [];
let mirror: GameState | undefined, mirroredCommands = 0, maxCommands = 0;
const observe = (view: Observation) => {
  if (firstContact[view.factionId] !== null) return;
  const foreign = [...view.armies, ...view.settlements].filter(entity => entity.factionId !== view.factionId);
  if (!foreign.length) return;
  firstContact[view.factionId] = view.turn;
  contacts.push({ turn: view.turn, factionId: view.factionId, foreign: foreign.map(entity => ({ id: entity.id, factionId: entity.factionId, cell: entity.cell })),
    observers: view.armies.filter(army => army.factionId === view.factionId).map(army => ({ id: army.id, unitId: army.unitId, cell: army.cell, sight: army.sight, carrierId: army.carrierId, inRange: foreign.filter(entity => hexDistance(army.cell, entity.cell, view.width) <= army.sight).map(entity => entity.id) })) });
};
const issue = (command: GameCommand) => {
  const turn = state.turn, faction = state.factions.find(f => f.id === command.factionId)!;
  const beforeCoin = faction.treasury, beforeKnowledge = faction.knowledge;
  const army = 'armyId' in command ? state.armies[command.armyId] : undefined;
  const origin = army?.cell, movement = army?.movement;
  const result = applyCommand(state, command);
  assert.equal(result.ok, true, `turn${turn} ${JSON.stringify(command)}: ${result.error}`);
  commands.push({ command, result });
  appendFileSync(path('-commands.jsonl'), JSON.stringify({ sequence: commands.length, turn, command, result, coinDelta: faction.treasury - beforeCoin, knowledgeDelta: faction.knowledge - beforeKnowledge, origin, destination: army?.cell, movementSpent: movement === undefined ? undefined : movement - (army?.movement ?? movement) }) + '\n');
  if (mirror) { assert.deepEqual(applyCommand(mirror, command), result); mirroredCommands++; }
};
const resolve = () => {
  for (let attempt = 0; state.battle || state.pendingCapture; attempt++) {
    assert(attempt < 4);
    if (state.battle) issue({ type: 'autoResolveBattle', factionId: [state.battle.attackerFactionId, state.battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : state.battle.attackerFactionId });
    else {
      const plan = planTurnWithReasons(getObservation(state, state.pendingCapture!.factionId));
      assert.equal(plan.commands.length, 1); assert.equal(plan.commands[0]!.type, 'resolveCapture'); issue(plan.commands[0]!);
    }
  }
};
const start = performance.now();
for (let round = 0; round < limit && !state.victory; round++) {
  for (const faction of state.factions) {
    if (state.victory) break;
    const view = getObservation(state, faction.id); observe(view);
    const time = performance.now(), plan = planTurnWithReasons(view); timings.push(performance.now() - time);
    assert(plan.commands.length <= 128); maxCommands = Math.max(maxCommands, plan.commands.length);
    if (round % 25 === 0 && faction.id === state.turnOwnerId) {
      const before = stateHash(state); assert.deepEqual(planTurnWithReasons(structuredClone(view)), plan); assert.equal(stateHash(state), before);
    }
    const nav = createNavigation(view);
    appendFileSync(path('-plans.jsonl'), JSON.stringify({ turn: view.turn, factionId: faction.id, treasury: view.treasury, knowledge: view.knowledge, explored: view.cells.length, reasons: plan.reasons,
      towns: view.settlements.filter(t => t.factionId === faction.id).map(t => ({ cell: t.cell, buildings: t.buildings, queue: t.queue })),
      armies: view.armies.filter(a => a.factionId === faction.id).map(a => { const move = plan.commands.find(c => c.type === 'moveTo' && c.armyId === a.id); const target = move?.type === 'moveTo' ? move.target : undefined; return { id: a.id, unitId: a.unitId, cell: a.cell, domain: a.domain, carrierId: a.carrierId, movement: a.movement, sight: a.sight, formations: a.formations.length, target, gain: target === undefined ? undefined : nav.informationGain(target, a.sight), homeDistance: Math.min(...view.settlements.filter(t => t.factionId === faction.id).map(t => hexDistance(a.cell, t.cell, view.width))) }; }) }) + '\n');
    if ([40, 60, 80, 100].includes(view.turn) && faction.id === state.turnOwnerId) writeFileSync(path(`-turn${view.turn}-view.json.gz`), gzipSync(JSON.stringify(view)));
    for (const command of plan.commands) { if (state.victory) break; issue(command); resolve(); }
    observe(getObservation(state, faction.id));
  }
  if (!state.victory) issue({ type: 'endTurn', factionId: state.turnOwnerId });
  for (const faction of state.factions) observe(getObservation(state, faction.id));
  if (state.turn === 26) {
    const saved = serializeGame(state); mirror = deserializeGame(saved);
    writeFileSync(path('-midpoint.json.gz'), gzipSync(saved));
  }
  if (state.turn > 60 && Object.values(firstContact).every(turn => turn !== null)) break;
}
const elapsedMs = performance.now() - start, finalHash = stateHash(state);
assert.equal(stateHash(deserializeGame(serializeGame(state))), finalHash);
assert(mirror); assert.equal(stateHash(mirror), finalHash);
const replay = deserializeGame(initial);
for (const { command, result } of commands) assert.deepEqual(applyCommand(replay, command), result);
assert.equal(stateHash(replay), finalHash);
writeFileSync(path('-final.json.gz'), gzipSync(serializeGame(state)));
writeFileSync(path('-contacts.json'), JSON.stringify(contacts, null, 2) + '\n');
timings.sort((a, b) => a - b);
const summary = { label, revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), rulesVersion: rulesVersion(state), seed, size, factionCount, limit, finalTurn: state.turn, firstContact, initialHash, finalHash, commands: commands.length, maxCommands, mirroredCommands, exactReplay: true, rejectedCommands: 0, elapsedMs, plannerMs: { count: timings.length, mean: timings.reduce((a, b) => a + b, 0) / timings.length, p95: timings[Math.floor(timings.length * .95)], max: timings.at(-1) }, timingScope: 'Real plans, concurrent workstation; campaign timing includes diagnostics and save mirror, excludes final replay. Not an isolated benchmark.' };
writeFileSync(path('-summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
