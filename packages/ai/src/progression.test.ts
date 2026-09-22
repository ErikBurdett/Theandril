import { expect, test } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { CAMPAIGN_PACES, PROSPERITY_PROJECT } from '@theandril/content';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../test-fixtures/src/victory-fixture';
import { planTurn, planTurnWithReasons } from './index';
import { assessProjectHosts, MAX_PROJECT_HOSTS, planProgression } from './progression';

function issue(state: GameState, command: GameCommand): void {
  const result = applyCommand(state, command);
  expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
}

test('project hosting favors observed safety over first ID, remains order-independent, and excludes ships and carried troops', () => {
  const state = prosperityCampaign(), view = getObservation(state, state.turnOwnerId);
  const own = view.settlements.filter(town => town.factionId === view.factionId).sort((a, b) => a.id.localeCompare(b.id));
  view.settlements = own;
  own.forEach((town, index) => { town.cell = [490, 500, 548][index]!; });
  view.progression.project.eligibleSettlementIds = own.map(town => town.id); view.progression.project.blockers = [];
  const enemy = structuredClone(view.armies[0]!);
  enemy.id = 'army.900'; enemy.factionId = state.factions[1]!.id; enemy.cell = 491; enemy.strength = 600; enemy.canAttack = true;
  view.wars = [enemy.factionId]; view.armies = [enemy];
  const ranked = assessProjectHosts(view);
  expect(ranked[0]?.settlementId).not.toBe(own[0]!.id);
  expect(ranked[0]?.uncoveredPressure).toBe(0);
  expect(ranked.find(host => host.settlementId === own[0]!.id)?.uncoveredPressure).toBeGreaterThan(0);
  expect(planProgression(view).commands[0]).toEqual({ type: 'startVictoryProject', factionId: view.factionId, settlementId: ranked[0]!.settlementId });
  const shuffled = structuredClone(view); shuffled.settlements.reverse(); shuffled.progression.project.eligibleSettlementIds.reverse();
  expect(assessProjectHosts(shuffled)).toEqual(ranked);
  shuffled.armies.push({ ...enemy, id: 'army.901', domain: 'naval', strength: 100_000, cell: ranked[0]!.cell }, { ...enemy, id: 'army.902', carrierId: 'army.901', strength: 100_000, cell: ranked[0]!.cell });
  expect(assessProjectHosts(shuffled)).toEqual(ranked);
});

test('project host comparisons are bounded and choose a real eligible site even when all are threatened', () => {
  const state = prosperityCampaign(), view = getObservation(state, state.turnOwnerId), baseTown = view.settlements.find(town => town.factionId === view.factionId)!;
  view.settlements = Array.from({ length: 150 }, (_, i) => ({ ...baseTown, id: `settlement.${1000 + i}`, cell: i + 100 }));
  view.progression.project.eligibleSettlementIds = view.settlements.map(town => town.id); view.progression.project.blockers = [];
  const enemy = structuredClone(view.armies[0]!); enemy.canAttack = true; enemy.factionId = state.factions[1]!.id;
  view.wars = [enemy.factionId]; view.armies = Array.from({ length: 200 }, (_, i) => ({ ...enemy, id: `army.${2000 + i}`, cell: i + 100, strength: 500 }));
  const ranked = assessProjectHosts(view);
  expect(ranked).toHaveLength(MAX_PROJECT_HOSTS);
  expect(ranked.every(host => view.progression.project.eligibleSettlementIds.includes(host.settlementId))).toBe(true);
  expect(planProgression(view).commands[0]?.type).toBe('startVictoryProject');
  view.armies.reverse(); view.settlements.reverse();
  expect(assessProjectHosts(view)).toEqual(ranked);
});

test('ranked project host starts through the ordinary command and survives save/load', () => {
  const state = prosperityCampaign();
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.civic_accounts' });
  issue(state, { type: 'adoptInstitution', factionId: state.turnOwnerId, institutionId: 'institution.charter_compact' });
  const view = getObservation(state, state.turnOwnerId), plan = planProgression(view);
  expect(plan.commands).toHaveLength(1);
  expect(plan.commands[0]?.type).toBe('startVictoryProject');
  expect(plan.reasons[0]).toContain('Prefer observed safety');
  issue(state, plan.commands[0]!);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

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

// Four representative generated starts; each checks every turn's save round trip.
test.each([74, 2026, 20260905, 31415])('generated-start AI seed %i reaches true Prosperity with ordinary commands and deterministic save continuation', seed => {
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
