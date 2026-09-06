import { expect, it } from 'vitest';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '../../packages/sim/src/index';
import { planTurn } from '../../packages/ai/src/index';
import { conquestCampaign } from '../../packages/test-fixtures/src/conquest-fixture';

it('runs 100 AI-led frontier turns through conquest and peace with projects deferred and exact midpoint continuation', () => {
  const state = conquestCampaign();
  let mirror: GameState | undefined;
  const counts = new Map<string, number>();
  const rejections: string[] = [];
  const issue = (command: GameCommand): void => {
    const result = applyCommand(state, command);
    if (!result.ok) rejections.push(`${state.turn}: ${JSON.stringify(command)}: ${result.error}`);
    for (const event of result.events) counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
    if (mirror) expect(applyCommand(mirror, command).ok).toBe(result.ok);
  };
  for (let turn = 0; turn < 100; turn++) {
    for (const faction of state.factions) {
      for (const command of planTurn(getObservation(state, faction.id)).filter(command => command.type !== 'startVictoryProject')) {
        issue(command);
        for (let decisions = 0; state.battle || state.pendingCapture; decisions++) {
          if (decisions > 4) throw new Error('Decision resolution did not terminate');
          if (state.battle) {
            const battle = state.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (state.pendingCapture) {
            const decision = planTurn(getObservation(state, state.pendingCapture.factionId))[0];
            if (!decision || decision.type !== 'resolveCapture') throw new Error('AI did not choose a captured settlement outcome');
            issue(decision);
          }
        }
      }
    }
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
    if (turn === 49) mirror = deserializeGame(serializeGame(state));
    if (mirror) expect(stateHash(mirror)).toBe(stateHash(state));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  }
  expect(rejections).toEqual([]);
  expect(counts.get('siege_started')).toBeGreaterThan(0);
  expect(counts.get('settlement_captured')).toBeGreaterThan(0);
  expect(counts.get('peace_accepted')).toBeGreaterThan(0);
  expect(state.turn).toBe(101);
});
