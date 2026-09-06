import { expect, test } from 'vitest';
import { applyCommand, createGame, getObservation, serializeGame, deserializeGame, stateHash, type GameState } from '@theandril/sim';
import { planTurn } from './index';
import { BUILDINGS, FACTIONS, UNITS } from '@theandril/content';

function run(state: GameState, count: number): void {
  for (let turn = 0; turn < count && !state.victory; turn++) {
    for (const faction of state.factions) {
      const commands = planTurn(getObservation(state, faction.id));
      expect(commands.length).toBeLessThanOrEqual(128);
      for (const command of commands) {
        applyCommand(state, command);
        if (state.battle) {
          const battle = state.battle;
          const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
          expect(applyCommand(state, { type: 'autoResolveBattle', factionId: controller }).ok).toBe(true);
        }
        if (state.pendingCapture) {
          const choice = planTurn(getObservation(state, state.pendingCapture.factionId));
          expect(choice).toHaveLength(1);
          expect(applyCommand(state, choice[0]).ok).toBe(true);
        }
      }
    }
    expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
  }
}
test.each(FACTIONS)('$name AI settles, builds, recruits and expands through the public command API', culture => {
  // Isolate each culture's economic competence from elimination by a rival.
  // Contested expansion, defeats and long wars have separate pacing/soak cases.
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 1, factionDefinitionId: culture.id });
  run(state, 100);
  for (const faction of state.factions) {
    const towns = Object.values(state.settlements).filter(town => town.factionId === faction.id);
    expect(towns.length).toBeGreaterThan(1);
    expect(towns.some(town => town.buildings.length === 4)).toBe(true);
    expect(faction.treasury).toBeGreaterThanOrEqual(0);
  }
});
test('AI cannot depend on hidden world state and resumes deterministically after save', () => {
  const state = createGame({ seed: 2026, size: 'tiny', factionCount: 4 });
  run(state, 12);
  const resumed = deserializeGame(serializeGame(state));
  expect(planTurn(getObservation(state, state.turnOwnerId))).toEqual(planTurn(getObservation(resumed, resumed.turnOwnerId)));
  run(state, 25);
  run(resumed, 25);
  expect(stateHash(resumed)).toBe(stateHash(state));
});
test('production budget rotates so later settlements receive orders and colonists are not overqueued', () => {
  const state = createGame({ seed: 74, size: 'tiny' });
  const view = getObservation(state, state.turnOwnerId);
  view.treasury = 1_000_000;
  view.armies = [];
  view.settlements = Array.from({ length: 160 }, (_, i) => ({ id: `settlement.${i}`, factionId: view.factionId, founderFactionId: view.factionId, devastation: 0, occupationTurns: 0, name: `Town ${i}`, cell: i, population: 1, food: 0, buildings: [], queue: [] }));
  view.productionOptions = view.settlements.flatMap(town => [...BUILDINGS, ...UNITS].map(item => ({ settlementId: town.id, itemId: item.id, kind: item.id.startsWith('building.') ? 'building' as const : 'land' as const, canQueue: true, blocker: null })));
  const ordered = new Set<string>();
  for (const turn of [1, 2]) {
    for (const command of planTurn({ ...view, turn })) if (command.type === 'queue') ordered.add(command.settlementId);
  }
  expect(ordered.size).toBe(160);
  view.settlements = view.settlements.slice(0, 3).map(town => ({ ...town, buildings: BUILDINGS.map(building => building.id) }));
  expect(planTurn(view).filter(command => command.type === 'queue' && command.itemId === 'unit.colonist')).toHaveLength(1);
});
test('planner does not spend movement proposals on terrain the army cannot afford', () => {
  const state = createGame({ seed: 74, size: 'tiny' });
  const view = getObservation(state, state.turnOwnerId);
  view.armies = view.armies.filter(army => army.unitId === 'unit.scout').map(army => ({ ...army, movement: 1 }));
  view.cells = view.cells.map(cell => ({ ...cell, terrain: 2 }));
  expect(planTurn(view).some(command => command.type === 'move' || command.type === 'moveTo')).toBe(false);
});

test('founding names remain unique after losses leave gaps in the hearth sequence', () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 1, pace: 'short' });
  const view = getObservation(state, state.turnOwnerId);
  view.settlements = ['Hearth 3', 'Hearth 4'].map((name, index) => ({ id: `settlement.${90 + index}`, factionId: view.factionId, founderFactionId: view.factionId, name, cell: index ? 47 : 0, population: 1, food: 0, buildings: [], queue: [], devastation: 0, occupationTurns: 0 }));
  const founding = planTurn(view).find(command => command.type === 'found');
  expect(founding).toMatchObject({ type: 'found', name: 'Hearth 5' });
});

test('a caravan with no remaining movement waits before founding', () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 1 });
  const view = getObservation(state, state.turnOwnerId);
  view.armies = view.armies.map(army => ({ ...army, movement: 0 }));
  expect(planTurn(view).some(command => command.type === 'found')).toBe(false);
});
