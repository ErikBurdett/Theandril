import { expect, test } from 'vitest';
import { createGame, applyCommand, getObservation, deserializeGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import type { CampaignPace } from '@theandril/content';
import { planTurn } from './index';

const campaigns: { pace: CampaignPace; seed: number; minimum: number; maximum: number }[] = [
  { pace: 'standard', seed: 74, minimum: 150, maximum: 400 },
  { pace: 'standard', seed: 99, minimum: 200, maximum: 400 },
  { pace: 'epic', seed: 74, minimum: 500, maximum: 1400 },
  // Earlier character rules let seed99 earn victory at648 with14towns/514battles.
  // Apply the same earned-conquest exception as seed 74; the separate archived
  // seed-20260905 regression still requires 800–1,400 turns and a turn-500 resume.
  { pace: 'epic', seed: 99, minimum: 500, maximum: 1400 },
];

test.each(campaigns)('$pace seed $seed reaches an earned long-form victory with legal orders and save continuation', ({ pace, seed, minimum, maximum }) => {
  const state = createGame({ seed, pace, size: 'tiny', factionCount: 4 });
  let mirror: GameState | undefined;
  let lateProduction = 0;
  let battles = 0, captures = 0;
  const issue = (command: GameCommand): void => {
    const result = applyCommand(state, command);
    if (!result.ok) throw new Error(`Turn ${state.turn}, ${JSON.stringify(command)}: ${result.error}`);
    if (mirror && !applyCommand(mirror, command).ok) throw new Error('Saved continuation rejected a legal command.');
    if (state.turn > 100 && command.type === 'queue') lateProduction++;
    if (result.events.some(event => event.type === 'battle_finished')) battles++;
    if (result.events.some(event => event.type === 'settlement_captured')) captures++;
  };
  for (let round = 0; round < maximum && !state.victory; round++) {
    for (const faction of state.factions) for (const command of planTurn(getObservation(state, faction.id))) {
      issue(command);
      for (let decisions = 0; state.battle || state.pendingCapture; decisions++) {
        if (decisions >= 4) throw new Error('Pending tactical/capture decisions exceeded their bound.');
        if (state.battle) {
          const battle = state.battle;
          const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
          issue({ type: 'autoResolveBattle', factionId: controller });
        } else if (state.pendingCapture) {
          const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0];
          if (!choice || choice.type !== 'resolveCapture') throw new Error('Missing capture choice.');
          issue(choice);
        }
      }
    }
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
    if (round === 49) mirror = deserializeGame(serializeGame(state));
    if (round % 25 === 0 || state.victory) {
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
      if (mirror) expect(stateHash(mirror)).toBe(stateHash(state));
    }
  }
  expect(state.victory?.path).toBe('prosperity');
  expect(state.turn).toBeGreaterThanOrEqual(minimum);
  expect(state.turn).toBeLessThanOrEqual(maximum);
  // Active conquest can fund the project earlier than the old four-town, mostly isolated AI.
  // Permit that earned result only with a substantially larger winning empire; never pad turns.
  if (state.turn < (pace === 'epic' ? 800 : 200)) {
    expect(Object.values(state.settlements).filter(town => town.factionId === state.victory?.factionId).length).toBeGreaterThanOrEqual(8);
    expect(battles).toBeGreaterThanOrEqual(pace === 'epic' ? 100 : 10);
    expect(captures).toBeGreaterThanOrEqual(10);
  }
  expect(lateProduction).toBeGreaterThan(0); // Project saving must not halt late growth and replacement armies.
  expect(mirror && stateHash(mirror)).toBe(stateHash(state));
  for (const faction of state.factions) expect(planTurn(getObservation(state, faction.id))).toEqual([]);
}, 60_000); // Long active empires mirror every order; seed99 measured24s in isolation.
