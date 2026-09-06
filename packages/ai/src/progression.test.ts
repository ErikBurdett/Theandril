import { expect, test } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { CAMPAIGN_PACES, PROSPERITY_PROJECT } from '@theandril/content';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../test-fixtures/src/victory-fixture';
import { planTurn, planTurnWithReasons } from './index';

function issue(state: GameState, command: GameCommand): void {
  const result = applyCommand(state, command);
  expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
}

test('prepared prosperity scenario is valid, deterministic and leaves progression choices to real commands', () => {
  const state = prosperityCampaign();
  expect(stateHash(state)).toBe(stateHash(prosperityCampaign()));
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  expect(state.settlements[PROSPERITY_FIXTURE.hostId]?.name).toBe(PROSPERITY_FIXTURE.hostName);
  const view = getObservation(state, state.turnOwnerId);
  expect(view.settlements.filter(town => town.factionId === view.factionId)).toHaveLength(3);
  expect(view.progression.technologies).toEqual([]);
  expect(view.progression.institutionId).toBeNull();
  expect(view.progression.doctrineId).toBeNull();
  expect(view.projects).toEqual([]);
  expect(view.victory).toBeNull();
  expect(view.cells.length).toBeLessThan(state.world.terrain.length / 4);
  const plan = planTurnWithReasons(view);
  expect(plan.commands.some(command => command.type === 'research')).toBe(true);
  expect(plan.commands.some(command => command.type === 'adoptInstitution')).toBe(true);
  expect(plan.commands.some(command => command.type === 'adoptDoctrine')).toBe(true);
  for (const command of plan.commands) issue(state, command);
  expect(state.progression[state.turnOwnerId]?.institutionId).toBe('institution.charter_compact');
});

test('AI protects its project fund instead of endlessly spending on recruitment', () => {
  const state = prosperityCampaign();
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.civic_accounts' });
  issue(state, { type: 'adoptInstitution', factionId: state.turnOwnerId, institutionId: 'institution.common_stewardship' });
  state.factions[0]!.treasury = PROSPERITY_PROJECT.coinCost - 1;
  const plan = planTurnWithReasons(getObservation(state, state.turnOwnerId));
  expect(plan.commands.some(command => command.type === 'queue' || command.type === 'adoptDoctrine' || command.type === 'startVictoryProject')).toBe(false);
  expect(plan.reasons.join(' ')).toContain('Reserve coin');
  for (const command of plan.commands) issue(state, command);
  issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
  const ready = planTurn(getObservation(state, state.turnOwnerId));
  expect(ready).toHaveLength(1);
  expect(ready[0]?.type).toBe('startVictoryProject');
  issue(state, ready[0]!);
  expect(state.projects[0]?.status).toBe('active');
});

test('AI uses the scaled project fund and keeps an operating purse during a long campaign', () => {
  const state = prosperityCampaign();
  state.pace = 'epic'; state.factions[0]!.knowledge = CAMPAIGN_PACES.epic.civicKnowledgeCost;
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.civic_accounts' });
  issue(state, { type: 'adoptInstitution', factionId: state.turnOwnerId, institutionId: 'institution.charter_compact' });
  issue(state, { type: 'adoptDoctrine', factionId: state.turnOwnerId, doctrineId: 'doctrine.march_columns' });
  state.factions[0]!.treasury = 1000;
  const development = planTurnWithReasons(getObservation(state, state.turnOwnerId));
  expect(development.commands.some(command => command.type === 'queue' && command.itemId === 'unit.colonist')).toBe(true);
  const before = state.factions[0]!.treasury;
  for (const command of development.commands) issue(state, command);
  expect(before - state.factions[0]!.treasury).toBeLessThanOrEqual(24);
  expect(development.reasons.join(' ')).toContain('/' + CAMPAIGN_PACES.epic.projectCoinCost);
  state.factions[0]!.treasury = CAMPAIGN_PACES.epic.projectCoinCost - 1;
  const nearFinish = planTurn(getObservation(state, state.turnOwnerId));
  expect(nearFinish.some(command => command.type === 'queue')).toBe(false);
  for (const command of nearFinish) issue(state, command);
  issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
  expect(planTurn(getObservation(state, state.turnOwnerId))[0]?.type).toBe('startVictoryProject');
});

test.each([74, 2026, 20260905, 17, 99, 31415, 2718, 8128, 4096, 65535])('generated-start AI seed %i reaches true Prosperity with ordinary commands and deterministic save continuation', seed => {
  let state = createGame({ seed, size: 'tiny', factionCount: 4, pace: 'short' });
  let mirror: GameState | undefined;
  const counts = new Map<string, number>();
  const apply = (command: GameCommand): void => {
    issue(state, command);
    if (mirror) issue(mirror, command);
    counts.set(command.type, (counts.get(command.type) ?? 0) + 1);
  };
  for (let round = 0; round < 150 && !state.victory; round++) {
    for (const faction of state.factions) {
      for (const command of planTurn(getObservation(state, faction.id))) {
        apply(command);
        for (let decisions = 0; state.battle || state.pendingCapture; decisions++) {
          if (decisions >= 4) throw new Error('AI pending decision loop exceeded its bound.');
          if (state.battle) {
            const battle = state.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
            apply({ type: 'autoResolveBattle', factionId: controller });
          } else if (state.pendingCapture) {
            const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0];
            if (!choice || choice.type !== 'resolveCapture') throw new Error('AI did not resolve the capture.');
            apply(choice);
          }
        }
      }
    }
    apply({ type: 'endTurn', factionId: state.turnOwnerId });
    const resumed = deserializeGame(serializeGame(state));
    expect(stateHash(resumed)).toBe(stateHash(state));
    if (mirror) expect(stateHash(mirror)).toBe(stateHash(state));
    if (round === 14) mirror = resumed;
    else state = resumed;
  }
  expect(state.victory?.path).toBe('prosperity');
  expect(state.turn).toBeLessThanOrEqual(151);
  for (const command of ['research', 'adoptInstitution', 'adoptDoctrine', 'found', 'queue', 'startVictoryProject']) expect(counts.get(command), command).toBeGreaterThan(0);
  const project = state.projects.find(item => item.id === state.victory?.projectId);
  expect(project).toMatchObject({ progress: PROSPERITY_PROJECT.activeTurns, status: 'completed' });
  for (const faction of state.factions) expect(planTurn(getObservation(state, faction.id))).toEqual([]);
});
