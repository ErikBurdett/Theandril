import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { planTurn } from '../../../../packages/ai/src/index';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '../../../../packages/sim/src/index';
import { WATER_DEPTH } from '../../../../packages/mapgen/src/index';
import { navalCampaign, NAVAL_FIXTURE } from '../../../../packages/test-fixtures/src/naval-fixture';

const folder = 'docs/development/2026-09-21-campaign-continuation/movement-preview/';
const capture = process.argv.includes('--capture');
const baseline = capture ? undefined : JSON.parse(await readFile(`${folder}naval-campaign-before.json`, 'utf8'));
const initialSave = baseline?.initialSave ?? serializeGame(navalCampaign({ enemyFleet: false }));
const state = deserializeGame(initialSave), mirror = deserializeGame(initialSave);
let boarded = false, sailedDeep = false, landed = false, founded = false;
const turns = [];
const issue = (command: GameCommand) => {
  const actual = applyCommand(state, command);
  assert.equal(actual.ok, true, actual.error);
  assert.deepEqual(applyCommand(mirror, command), actual);
  return actual;
};
for (let turn = 0; turn < 16 && !founded; turn++) {
  const view = getObservation(state, state.turnOwnerId), before = JSON.stringify(view);
  const plan = planTurn(view), results = [];
  assert.equal(JSON.stringify(view), before);
  assert.deepEqual(planTurn(structuredClone(view)), plan);
  for (const command of plan) {
    results.push(issue(command));
    if (command.type === 'embarkArmy') boarded = true;
    if (command.type === 'disembarkArmy') landed = true;
    if (command.type === 'found' && command.armyId === NAVAL_FIXTURE.cargoId) founded = true;
    if (state.transports[NAVAL_FIXTURE.cargoId] && state.world.waterDepth[state.armies[NAVAL_FIXTURE.fleetId]!.cell] === WATER_DEPTH.deep) sailedDeep = true;
  }
  const hash = stateHash(state);
  assert.equal(stateHash(mirror), hash);
  assert.equal(stateHash(deserializeGame(serializeGame(state))), hash);
  turns.push({ turn: state.turn, plan, results, hash, routes: structuredClone(state.routes) });
  if (!founded) issue({ type: 'endTurn', factionId: state.turnOwnerId });
}
assert.deepEqual({ boarded, sailedDeep, landed, founded }, { boarded: true, sailedDeep: true, landed: true, founded: true });
if (capture) {
  await writeFile(`${folder}naval-campaign-before.json`, JSON.stringify({ initialSave, turns,
    sourceSha256: createHash('sha256').update(await readFile('packages/ai/src/naval.ts')).digest('hex'),
    note: 'Authored naval voyage played through whole-AI proposals and paid command API; all commands, results, routes and state hashes captured before target-only substitutions. Not naturally earned campaign generation or campaign timing.' }, null, 2) + '\n');
} else assert.deepEqual(turns, baseline.turns);
console.log(JSON.stringify({ mode: capture ? 'capture' : 'verify', turns: turns.length, commands: turns.reduce((sum, turn) => sum + turn.plan.length, 0),
  hash: stateHash(state), boarded, sailedDeep, landed, founded, sha256: createHash('sha256').update(JSON.stringify(turns)).digest('hex') }));
