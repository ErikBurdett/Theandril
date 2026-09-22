import { deriveBiomes } from '../../../../packages/mapgen/src/index';
import { createGame, createArmyFormation, deserializeGame, serializeGame, type GameState } from '../../../../packages/sim/src/index';
import { rebuildIndexes } from '../../../../packages/sim/src/visibility';
import { type RulesVersion } from '../../../../packages/sim/src/rules';
import { navalCampaign, NAVAL_FIXTURE } from '../../../../packages/test-fixtures/src/naval-fixture';

export interface CanonicalCase { name: string; state: GameState; factionId: string; armyId: string; target: number; version: RulesVersion }

/** Authored synchronous route-planning coverage, not an earned campaign. */
export function canonicalCorpus(): CanonicalCase[] {
  const source = createGame({ seed: 20260921, size: 'tiny', factionCount: 2, generatorVersion: 4 });
  const factionId = source.turnOwnerId, armyId = 'army.2', cases: CanonicalCase[] = [];
  function field(name: string, version: RulesVersion, row: number): CanonicalCase {
    const state = structuredClone(source), origin = row * state.world.width + 4;
    state.armies = { [armyId]: { ...state.armies[armyId]!, cell: origin, movement: 0,
      formations: [createArmyFormation(armyId, 'unit.guard')] } };
    state.settlements = {}; state.routes = {};
    state.world.terrain.fill(2); state.world.waterDepth.fill(0); state.resources.deposits = {};
    state.world.biome = deriveBiomes(state.world.seed, state.world.width, state.world.height, state.world.terrain, state.world.generatorVersion);
    state.explored[factionId] = new Set(state.world.terrain.keys());
    state.roads.edges = {}; state.roads.known[factionId] = {};
    const item = { name, state, factionId, armyId, target: origin + 8, version };
    cases.push(item); return item;
  }
  for (const version of [7, 11, 12, 17] as const) for (const row of [10, 11]) {
    const item = field(`roads-v${version}-row${row}`, version, row);
    const origin = item.state.armies[armyId]!.cell;
    for (let cell = origin; cell <= item.target; cell++) {
      const mask = cell === origin ? 1 : cell === item.target ? 8 : 9;
      item.state.roads.edges[cell] = mask;
      item.state.roads.known[factionId]![cell] = mask;
    }
  }
  const sea = navalCampaign({ enemyFleet: false });
  for (const version of [7, 8, 17] as const) for (const mode of ['coastal', 'ocean', 'mixed'] as const) {
    const state = structuredClone(sea);
    state.armies[NAVAL_FIXTURE.fleetId]!.movement = 0;
    if (mode !== 'coastal') state.progression[state.turnOwnerId]!.technologies.push('technology.ocean_navigation');
    if (mode === 'mixed') state.armies[NAVAL_FIXTURE.fleetId]!.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.coastal_warship'));
    state.armies[NAVAL_FIXTURE.fleetId]!.formations.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    cases.push({ name: `${mode}-v${version}`, state, factionId: state.turnOwnerId, armyId: NAVAL_FIXTURE.fleetId, target: NAVAL_FIXTURE.deepCell, version });
  }
  for (const item of cases) { rebuildIndexes(item.state); item.state = deserializeGame(serializeGame(item.state)); }
  return cases;
}
