/** Bounded audit probes. Production imports are read-only. Authored setups are NOT earned campaigns. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame, applyCommand, createArmyFormation, serializeGame, deserializeGame, stateHash, getObservation, settlementYields, type GameState, type GameCommand } from '../../../packages/sim/src/index';
import { settlementFoodConsumption } from '../../../packages/sim/src/growth-economy';
import { evaluatePeaceOffer } from '../../../packages/sim/src/diplomacy';
import { borderBattleCampaign } from '../../../packages/test-fixtures/src/combat-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../../packages/test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../../packages/test-fixtures/src/authored-land';

const out = dirname(fileURLToPath(import.meta.url));
const results: Record<string, unknown> = { methodology: 'Authored bounded states are explicitly injected in memory, normalized through real save validation, and then exercised with production commands. No generated campaign-completion or browser claim. No production source writes.' };
function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  assert.equal(result.ok, true, `${command.type}: ${result.error}`);
  return result;
}
function normalize(state: GameState): GameState {
  refreshAuthoredSight(state);
  const saved = serializeGame(state);
  return deserializeGame(saved);
}
function injectGuard(state: GameState, owner: string, cell: number) {
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: owner, name: 'Audit authored guard', cell, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
  return id;
}
{
  let state = borderBattleCampaign();
  const attacker = Object.values(state.armies).find(a => a.factionId === state.turnOwnerId)!;
  const defender = Object.values(state.armies).find(a => a.factionId !== state.turnOwnerId)!;
  const injected = Array.from({ length: 20 }, () => injectGuard(state, defender.factionId, defender.cell));
  state = normalize(state);
  issue(state, { type: 'declareWar', factionId: attacker.factionId, targetFactionId: defender.factionId });
  const hash = stateHash(state);
  const rejected = applyCommand(state, { type: 'attack', factionId: attacker.factionId, armyId: attacker.id, targetArmyId: defender.id });
  assert.equal(rejected.ok, false); assert.equal(stateHash(state), hash);
  const blockedFormations = Object.values(state.armies).filter(a => a.cell === defender.cell).reduce((n, a) => n + a.formations.length, 0);
  delete state.armies[injected.at(-1)!]; // Authored control: same position reduced to twenty.
  state = normalize(state);
  const accepted = issue(state, { type: 'attack', factionId: attacker.factionId, armyId: attacker.id, targetArmyId: defender.id });
  assert.equal(state.battle!.combat.defender.length, 20);
  results.fieldStackLimit = { setup: 'One original defending guard plus twenty injected legal singleton guards on the same non-town hex. The full state passed serialize/deserialize validation before commands.', blockedFormations, rejected, rejectedHashUnchanged: true, acceptedAt20: accepted.ok, battleDefenders: state.battle!.combat.defender.length };
}
{
  const state = createGame({ seed: 20260909, size: 'tiny', factionCount: 2 });
  for (const faction of state.factions) {
    const founder = Object.values(state.armies).find(a => a.factionId === faction.id && a.formations[0]!.unitId === 'unit.colonist')!;
    issue(state, { type: 'found', factionId: faction.id, armyId: founder.id, name: 'Paid muster' });
  }
  const factionId = state.factions[1]!.id, town = Object.values(state.settlements).find(t => t.factionId === factionId)!;
  const commands: GameCommand[] = [];
  let queued = 0;
  const count = () => Object.values(state.armies).filter(a => a.cell === town.cell && a.factionId === factionId).reduce((n, a) => n + a.formations.length, 0);
  for (let i = 0; i < 100 && count() < 21; i++) {
    const faction = state.factions.find(f => f.id === factionId)!;
    const building = ['building.market', 'building.granary', 'building.workshop'].find(id => !town.buildings.includes(id) && !town.queue.some(q => q.itemId === id));
    if (!town.queue.length && building) {
      const command: GameCommand = { type: 'queue', factionId, settlementId: town.id, itemId: building };
      issue(state, command); commands.push(command);
    } else if (!town.queue.length && !building && queued < 20 && faction.treasury >= 8) {
      const command: GameCommand = { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.scout' };
      issue(state, command); commands.push(command); queued++;
    }
    const command: GameCommand = { type: 'endTurn', factionId: state.turnOwnerId };
    issue(state, command); commands.push(command);
  }
  assert.equal(count(), 21);
  const mirror = deserializeGame(serializeGame(state)); assert.equal(stateHash(mirror), stateHash(state));
  results.paidStackReachability = { setup: 'Fresh generated tiny/two-seat world. No state injection. Both caravans found through real commands; the second realm buys market, granary, workshop and twenty scouts from its original treasury and turn income. AI not invoked; other realm idle.', turn: state.turn, queuedPaidScouts: queued, stackFormations: count(), treasury: state.factions.find(f => f.id === factionId)!.treasury, town: structuredClone(town), saveRoundTripEqual: true, commands };
}
{
  let state = conquestCampaign();
  const f = CONQUEST_FIXTURE, town = state.settlements[f.settlementId]!;
  Array.from({ length: 21 }, () => injectGuard(state, f.enemyFactionId, town.cell));
  state = normalize(state);
  issue(state, { type: 'declareWar', factionId: f.playerFactionId, targetFactionId: f.enemyFactionId });
  issue(state, { type: 'besiege', factionId: f.playerFactionId, armyId: f.playerArmyId, settlementId: town.id });
  const rounds = [];
  for (let i = 0; i < 10; i++) {
    issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
    rounds.push({ turn: state.turn, defenses: state.sieges[town.id]!.defenses, supplies: state.sieges[town.id]!.supplies, defenderFormations: Object.values(state.armies).filter(a => a.cell === town.cell).reduce((n, a) => n + a.formations.length, 0), defenderStrength: Object.values(state.armies).filter(a => a.cell === town.cell).reduce((n, a) => n + a.formations.reduce((m, f) => m + f.strength, 0), 0), population: state.settlements[town.id]!.population });
  }
  const hash = stateHash(state);
  const rejected = applyCommand(state, { type: 'assault', factionId: f.playerFactionId, settlementId: town.id });
  assert.equal(rejected.ok, false); assert.equal(stateHash(state), hash);
  assert.equal(rounds.at(-1)!.defenses, 0); assert.equal(rounds.at(-1)!.supplies, 0); assert.equal(rounds.at(-1)!.defenderFormations, 21);
  const reloaded = deserializeGame(serializeGame(state)); assert.equal(stateHash(reloaded), stateHash(state));
  results.garrisonStackLimit = { setup: 'Existing authored conquest fixture plus twenty-one injected singleton guard formations on target town; save validated. War, siege and ten turns are real commands.', rounds, rejected, rejectedHashUnchanged: true, saveRoundTripEqual: true };
}
{
  let state = createGame({ seed: 20260909, size: 'tiny', factionCount: 1 });
  const factionId = state.turnOwnerId;
  const founder = Object.values(state.armies).find(a => a.formations[0]!.unitId === 'unit.colonist')!;
  issue(state, { type: 'found', factionId, armyId: founder.id, name: 'Audit Famine' });
  const town = Object.values(state.settlements)[0]!;
  const army = Object.values(state.armies)[0]!;
  town.population = 200; town.food = 0; state.factions[0]!.treasury = 0;
  army.formations = [createArmyFormation(army.id, 'unit.heavy_infantry')]; army.movement = 2;
  army.formations[0]!.morale = 20; army.formations[0]!.fatigue = 60;
  state = normalize(state);
  const initial = { population: state.settlements[town.id]!.population, food: 0, foodYield: settlementYields(state, state.settlements[town.id]!).food, consumption: settlementFoodConsumption(200), treasury: 0, army: structuredClone(state.armies[army.id]) };
  const rounds = [];
  for (let i = 0; i < 10; i++) {
    const result = issue(state, { type: 'endTurn', factionId });
    rounds.push({ turn: state.turn, population: state.settlements[town.id]!.population, food: state.settlements[town.id]!.food, treasury: state.factions[0]!.treasury, shortfall: result.events.some(e => e.type === 'upkeep_shortfall'), army: structuredClone(state.armies[army.id]) });
  }
  assert(rounds.every(r => r.population === 200 && r.food === 0 && r.treasury === 0 && r.shortfall));
  assert.equal(rounds.at(-1)!.army.formations[0]!.strength, initial.army.formations[0]!.strength);
  assert.equal(rounds.at(-1)!.army.formations[0]!.morale, 85);
  const mirror = deserializeGame(serializeGame(state)); assert.equal(stateHash(mirror), stateHash(state));
  results.famineAndInsolvency = { setup: 'Generated tiny world with paid public founding, then authored population 200, zero food/treasury and one heavy formation at low morale/high fatigue. Save validation passes. This is a rules stress probe, not evidence that an earned campaign reaches population 200.', initial, rounds, saveRoundTripEqual: true };
}
{
  const state = borderBattleCampaign(), owner = state.turnOwnerId, enemy = state.factions[1]!.id;
  issue(state, { type: 'declareWar', factionId: owner, targetFactionId: enemy });
  const view = getObservation(state, enemy);
  const offer = { id: 'offer.audit', proposerId: owner, recipientId: enemy, createdTurn: state.turn, expiresTurn: state.turn + 3, terms: { offerCoin: 30, requestCoin: 0, truceTurns: 10 } };
  const hostile = structuredClone(view), friendly = structuredClone(view);
  hostile.diplomacy.relations[0]!.trust = -100; hostile.diplomacy.relations[0]!.respect = 0;
  friendly.diplomacy.relations[0]!.trust = 100; friendly.diplomacy.relations[0]!.respect = 100;
  const a = evaluatePeaceOffer(hostile, offer), b = evaluatePeaceOffer(friendly, offer);
  assert.deepEqual(a, b);
  results.trustRespectValuation = { setup: 'Observation-only comparison: identical lawful war and offer, only trust/respect changed in detached observations.', hostile: a, friendly: b, identical: true };
}
writeFileSync(resolve(out, 'probe-results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
