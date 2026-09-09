import { expect, test } from 'vitest';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };

test.each(['sack', 'raze'] as const)('a real100-person conquest preserves its pending %s decision and wallets above one billion', outcome => {
  const state = conquestCampaign(), factionId = state.turnOwnerId, townId = CONQUEST_FIXTURE.settlementId;
  const town = state.settlements[townId]!, army = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
  // Mature population and established forces are authored API-boundary inputs.
  // The siege, combat, decision, payment and resulting ownership are real.
  town.population = 100; town.food = 6000;
  state.factions.find(faction => faction.id === factionId)!.treasury = 2_000_000_000;
  state.factions.find(faction => faction.id === town.factionId)!.treasury = 2_000_000_000;
  army.formations = Array.from({ length: 6 }, (_, index) => createArmyFormation(`army.${state.nextId++}`, index < 3 ? 'unit.heavy_infantry' : 'unit.arbalester')).sort((a, b) => a.id < b.id ? -1 : 1);
  refreshAuthoredSight(state);
  issue(state, { type: 'declareWar', factionId, targetFactionId: town.factionId });
  issue(state, { type: 'besiege', factionId, armyId: army.id, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) issue(state, { type: 'endTurn', factionId });
  issue(state, { type: 'assault', factionId, settlementId: townId });
  expect(state.battle?.settlementId).toBe(townId);
  issue(state, { type: 'autoResolveBattle', factionId });
  expect(state.battle).toBeNull(); expect(state.pendingCapture?.settlementId).toBe(townId);
  expect(town.population).toBe(100);
  const options = getObservation(state, factionId).pendingCapture!.options;
  expect(options.find(option => option.outcome === 'raze')!.populationLoss).toBe(100);
  expect(options.find(option => option.outcome === 'sack')!.populationLoss).toBe(34);
  expect(options.every(option => Number.isSafeInteger(option.coinGain) && option.coinGain >= 0)).toBe(true);
  const saved = serializeGame(state), mirror = deserializeGame(saved);
  expect(serializeGame(mirror)).toBe(saved);
  expect(getObservation(mirror, factionId).pendingCapture).toEqual(getObservation(state, factionId).pendingCapture);
  const chosen = options.find(option => option.outcome === outcome)!, beforeCoin = state.factions[0]!.treasury;
  const command = { type: 'resolveCapture', factionId, settlementId: townId, outcome } as const;
  expect(issue(state, command)).toEqual(issue(mirror, command));
  expect(state.factions[0]!.treasury).toBe(beforeCoin + chosen.coinGain);
  expect(state.factions[0]!.treasury).toBeGreaterThan(1_000_000_000);
  if (outcome === 'sack') { expect(state.settlements[townId]!.population).toBe(66); expect(state.settlements[townId]!.factionId).toBe(factionId); }
  else { expect(state.settlements[townId]).toBeUndefined(); expect(state.ruins[townId]?.cell).toBe(town.cell); }
  expect(stateHash(mirror)).toBe(stateHash(state));
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});
