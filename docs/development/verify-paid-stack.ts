/** Current-rule, paid production probe: two controlled seats; no AI or injected state. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand } from '../../packages/sim/src/index';
const out = 'docs/development/paid-stack';
mkdirSync(out, { recursive: true });
const state = createGame({ seed: 20260909, size: 'tiny', factionCount: 2 });
const initial = serializeGame(state), mirror = deserializeGame(initial);
writeFileSync(`${out}/initial.json.gz`, gzipSync(initial));
const records: unknown[] = [];
function issue(command: GameCommand) {
  const result = applyCommand(state, command);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(applyCommand(mirror, command), result);
  const hash = stateHash(state);
  assert.equal(stateHash(mirror), hash);
  assert.equal(stateHash(deserializeGame(serializeGame(state))), hash);
  records.push({ sequence: records.length + 1, command, result, hash });
}
for (const faction of state.factions) {
  const founder = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations[0]!.unitId === 'unit.colonist')!;
  issue({ type: 'found', factionId: faction.id, armyId: founder.id, name: 'Paid muster' });
}
const factionId = state.factions[1]!.id;
const town = Object.values(state.settlements).find(value => value.factionId === factionId)!;
let queued = 0;
const count = () => Object.values(state.armies).filter(army => army.cell === town.cell && army.factionId === factionId).reduce((sum, army) => sum + army.formations.length, 0);
for (let round = 0; round < 100 && count() < 21; round++) {
  const faction = state.factions.find(value => value.id === factionId)!;
  const building = ['building.market', 'building.granary', 'building.workshop'].find(id => !town.buildings.includes(id) && !town.queue.some(item => item.itemId === id));
  if (!town.queue.length && building) issue({ type: 'queue', factionId, settlementId: town.id, itemId: building });
  else if (!town.queue.length && !building && queued < 20 && faction.treasury >= 8) {
    issue({ type: 'queue', factionId, settlementId: town.id, itemId: 'unit.scout' });
    queued++;
  }
  issue({ type: 'endTurn', factionId: state.turnOwnerId });
}
assert.equal(count(), 21); assert.equal(queued, 20);
const company = getObservation(state, factionId).armies.find(army => army.cell === town.cell)!;
assert.equal(company.battleDefense?.engagedFormations, 20);
assert.equal(company.battleDefense?.reserveFormations, 1);
const final = serializeGame(state);
const result = { rulesVersion: SAVE_VERSION, seed: 20260909, mapSize: 'tiny', factions: 2, turn: state.turn, commands: records.length, paidScouts: queued, stackFormations: count(), treasury: state.factions.find(faction => faction.id === factionId)!.treasury, finalHash: stateHash(state), roundTripAfterEveryCommand: true, exactCommandMirror: true, battleDefense: company.battleDefense, scope: 'Fresh generated world, real founding/queue/end-turn commands only. Both seats deliberately controlled, other realm idle; no AI, resource grants, state injection or actual combat. Proves current paid reachability and authoritative preview, not economic balance or earned combat victory.' };
writeFileSync(`${out}/commands.jsonl.gz`, gzipSync(records.map(record => JSON.stringify(record)).join('\n') + '\n'));
writeFileSync(`${out}/final.json.gz`, gzipSync(final));
writeFileSync(`${out}/result.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
