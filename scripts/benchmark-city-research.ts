import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { createGame, applyCommand, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { aiObservationOptions, planTurn } from '../packages/ai/src/index';

/** Same generated workload before/after a rules slice; stdout is retained as evidence. */
const timed = <T>(run: () => T) => { const start = performance.now(), result = run(); return { result, ms: performance.now() - start }; };
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)] ?? 0, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] ?? 0, maxMs: sorted.at(-1) ?? 0 };
}
function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  assert.ok(result.ok, `${state.turn}: ${JSON.stringify(command)}: ${result.error}`);
  return result;
}
function readTimings(state: GameState) {
  const summary: number[] = [], detailed: number[] = [], aiScoped: number[] = [], townQuery: number[] = [];
  const town = Object.values(state.settlements).find(item => item.factionId === state.turnOwnerId);
  assert.ok(town);
  const hash = stateHash(state);
  for (let i = -4; i < 20; i++) {
    const a = timed(() => getObservation(state, state.turnOwnerId, { landDetails: 'none' }));
    const b = timed(() => getObservation(state, state.turnOwnerId));
    const c = timed(() => getSettlementLandObservation(state, state.turnOwnerId, town.id));
    const d = timed(() => getObservation(state, state.turnOwnerId, aiObservationOptions(state.turn)));
    if (i >= 0) { summary.push(a.ms); detailed.push(b.ms); townQuery.push(c.ms); aiScoped.push(d.ms); }
  }
  const full = getObservation(state, state.turnOwnerId), scoped = getObservation(state, state.turnOwnerId, aiObservationOptions(state.turn));
  assert.deepEqual(planTurn(scoped), planTurn(full));
  assert.equal(stateHash(state), hash);
  return { summary: distribution(summary), detailed: distribution(detailed), aiScoped: distribution(aiScoped), townQuery: distribution(townQuery),
    sameState: { towns: full.land.settlements.length, fullDetailedCells: full.land.settlements.reduce((sum, item) => sum + item.cells.length, 0),
      aiDetailedCells: scoped.land.settlements.reduce((sum, item) => sum + item.cells.length, 0), exactPlan: true } };
}
const game = createGame({ seed: 20260906, size: 'tiny', factionCount: 12, pace: 'epic' });
const initial = serializeGame(game), trace: { command: GameCommand; result: ReturnType<typeof issue> }[] = [];
const endMs: number[] = [], planMs: number[] = [], counts: Record<string, number> = {};
let mirror: GameState | undefined, mirrorCommands = 0;
const submit = (command: GameCommand) => {
  const measured = timed(() => issue(game, command));
  if (command.type === 'endTurn') endMs.push(measured.ms);
  counts[command.type] = (counts[command.type] ?? 0) + 1;
  trace.push({ command: structuredClone(command), result: structuredClone(measured.result) });
  if (mirror) { assert.deepEqual(issue(mirror, command), measured.result); mirrorCommands++; }
};
for (let round = 0; round < 100 && !game.victory; round++) {
  for (const faction of game.factions) {
    const plan = timed(() => planTurn(getObservation(game, faction.id, aiObservationOptions(game.turn)))); planMs.push(plan.ms);
    for (const command of plan.result) {
      submit(command);
      for (let decision = 0; game.battle || game.pendingCapture; decision++) {
        assert.ok(decision < 4);
        if (game.battle) submit({ type: 'autoResolveBattle', factionId: [game.battle.attackerFactionId, game.battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : game.battle.attackerFactionId });
        else { const next = planTurn(getObservation(game, game.pendingCapture!.factionId, aiObservationOptions(game.turn)))[0]; assert.equal(next?.type, 'resolveCapture'); submit(next!); }
      }
    }
  }
  if (!game.victory) submit({ type: 'endTurn', factionId: game.turnOwnerId });
  if (round === 49) mirror = deserializeGame(serializeGame(game));
}
const saved = serializeGame(game), finalHash = stateHash(game), replay = deserializeGame(initial);
const restored = deserializeGame(saved);
assert.equal(stateHash(restored), finalHash); assert.equal(serializeGame(restored), saved);
if (mirror) assert.equal(stateHash(mirror), finalHash);
for (const entry of trace) assert.deepEqual(issue(replay, entry.command), entry.result);
assert.equal(stateHash(replay), finalHash);
assert.equal(serializeGame(replay), saved);
const land = Object.values(game.land.settlements);
console.log(JSON.stringify({ schema: SAVE_VERSION, content: CONTENT_HASH, seed: 20260906, size: 'tiny', seats: 12, pace: 'epic', turn: game.turn, finalHash,
  commands: trace.length, rejected: 0, commandCounts: counts, mirroredCommands: mirrorCommands, replayedCommands: trace.length,
  saves: { bytes: Buffer.byteLength(saved), exactRoundtrip: true, exactReplay: true },
  research: Object.fromEntries(Object.entries(game.progression).map(([id, progress]) => [id, progress.technologies])),
  territory: { towns: land.length, claimed: land.reduce((n, entry) => n + entry.claimed.length, 0), worked: land.reduce((n, entry) => n + entry.worked.length, 0), improvements: land.flatMap(entry => Object.values(entry.improvements)) },
  endTurn: distribution(endMs), planning: distribution(planMs), planningIncludes: 'getObservation with the production AI detail window plus planTurn; no disk saves, archive recording or rendering', reads: readTimings(game),
}, null, 2));
