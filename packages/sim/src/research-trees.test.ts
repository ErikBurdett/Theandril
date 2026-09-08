import { expect, test } from 'vitest';
import { IMPROVEMENTS, TECHNOLOGIES, checksum } from '@theandril/content';
import { naturalFeatures } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, replayGame, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { cellsWithin, indexes } from './visibility';
import { landCellYields, refreshLandKnowledge, settlementLandYield } from './territory';
import { withRules } from './rules';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); }
function scenario() {
  // Authored marsh sites preserve the pre-hydrology terrain/feature contract.
  const state = createGame({ seed: 20260906, size: 'tiny', factionCount: 2, pace: 'epic', generatorVersion: 4 });
  for (const cell of cellsWithin(state, state.armies['army.1']!.cell, 3)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.fertility[cell] = 80; state.world.waterDepth[cell] = 0;
  }
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Sluice witness' });
  state.factions[0]!.treasury = 1000; state.factions[0]!.knowledge = 1000;
  return deserializeGame(serializeGame(state));
}
test('research dependencies and immutable observation copies are authoritative, not UI-only locks', () => {
  const state = scenario(), factionId = state.turnOwnerId, before = stateHash(state);
  const view = getObservation(state, factionId), choice = view.progression.technologyChoices.find(item => item.id === 'technology.waterworks')!;
  expect(choice).toMatchObject({ requires: ['technology.stewardship'], branch: 'stewardship', available: false });
  choice.requires.length = 0; expect(stateHash(state)).toBe(before);
  expect(applyCommand(state, { type: 'research', factionId, technologyId: choice.id }).ok).toBe(false); expect(stateHash(state)).toBe(before);
  const coin = state.factions[0]!.treasury, knowledge = state.factions[0]!.knowledge;
  issue(state, { type: 'research', factionId, technologyId: 'technology.stewardship' });
  issue(state, { type: 'research', factionId, technologyId: choice.id });
  expect(state.factions[0]!.knowledge).toBe(knowledge - 36 - 64); expect(state.factions[0]!.treasury).toBe(coin);
  const learned = stateHash(state); expect(applyCommand(state, { type: 'research', factionId, technologyId: choice.id }).ok).toBe(false); expect(stateHash(state)).toBe(learned);
});

test('a researched polder still needs a suitable paid site, real turns and an assigned worker; save and replay agree', () => {
  const state = scenario(), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  const view = () => getObservation(state, factionId).land.settlements[0]!;
  const cell = view().cells.find(item => item.canWork)!.cell;
  const build: GameCommand = { type: 'improveTile', factionId, settlementId: town.id, cell, improvementId: 'improvement.polder' };
  const before = stateHash(state); expect(applyCommand(state, build).ok).toBe(false); expect(stateHash(state)).toBe(before);
  const initial = serializeGame(state), commands: GameCommand[] = [];
  const run = (command: GameCommand) => { issue(state, command); commands.push(command); };
  for (const technologyId of ['technology.stewardship', 'technology.waterworks']) run({ type: 'research', factionId, technologyId });
  const quote = view().cells.find(item => item.cell === cell)!.improvementOptions.find(item => item.improvementId === 'improvement.polder')!;
  expect(quote.canStart).toBe(true); const coin = state.factions[0]!.treasury;
  const yieldsBefore = settlementLandYield(state, town);
  run(build); expect(state.factions[0]!.treasury).toBe(coin - quote.coinCost);
  run({ type: 'endTurn', factionId }); const mirror = deserializeGame(serializeGame(state));
  for (let turn = 1; turn < quote.turns; turn++) { run({ type: 'endTurn', factionId }); issue(mirror, { type: 'endTurn', factionId }); }
  expect(stateHash(mirror)).toBe(stateHash(state));
  expect(state.land.settlements[town.id]!.improvements[cell]).toBe('improvement.polder');
  expect(settlementLandYield(state, town)).toEqual(yieldsBefore);
  run({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [cell] });
  const actual = landCellYields(state, town, cell).total;
  expect(settlementLandYield(state, town)).toEqual(Object.fromEntries(Object.entries(yieldsBefore).map(([key, value]) => [key, value + actual[key as keyof typeof actual]])));
  expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
});

test('advanced constructions enforce terrain/features and keep signed yield penalties', () => {
  const state = scenario(), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  for (const technology of TECHNOLOGIES) {
    state.factions[0]!.knowledge = 10_000;
    issue(state, { type: 'research', factionId, technologyId: technology.id });
  }
  const candidate = getObservation(state, factionId).land.settlements[0]!.cells.find(item => item.canWork)!;
  for (const improvementId of ['improvement.oreworks', 'improvement.spring_garden', 'improvement.grove_archive', 'improvement.tide_observatory']) {
    const definition = IMPROVEMENTS.find(item => item.id === improvementId)!;
    const flags = naturalFeatures(state.world, candidate.cell);
    const possible = definition.sites.some(site => site.terrainIds.includes(candidate.terrain) && (!site.biomeIds || site.biomeIds.includes(candidate.biome)) && (!site.requiredFeatures || (flags & site.requiredFeatures) === site.requiredFeatures));
    const quote = getObservation(state, factionId).land.settlements[0]!.cells.find(item => item.cell === candidate.cell)!.improvementOptions.find(item => item.improvementId === improvementId)!;
    expect(quote.canStart, improvementId).toBe(possible);
  }
  state.land.settlements[town.id]!.improvements[candidate.cell] = 'improvement.polder';
  for (const owner of state.factions) refreshLandKnowledge(state, owner.id, indexes(state).visible.get(owner.id)!);
  const yields = landCellYields(state, town, candidate.cell);
  expect(yields.improvement.coin).toBe(-1); expect(yields.total.coin).toBeGreaterThanOrEqual(0);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('historical command execution cannot acquire future techniques or construction', () => {
  const state = scenario(), factionId = state.turnOwnerId;
  withRules(state, 10, () => {
    expect(getObservation(state, factionId).progression.technologyChoices).toHaveLength(4);
    const cell = getObservation(state, factionId).land.settlements[0]!.cells.find(item => item.canWork)!;
    expect(cell.improvementOptions).toHaveLength(5);
    const before = stateHash(state);
    expect(applyCommand(state, { type: 'research', factionId, technologyId: 'technology.stewardship' }).ok).toBe(false);
    expect(applyCommand(state, { type: 'improveTile', factionId, settlementId: Object.keys(state.settlements)[0]!, cell: cell.cell, improvementId: 'improvement.polder' }).ok).toBe(false);
    expect(stateHash(state)).toBe(before);
  });
});

test('save validation rejects a researched child without its prerequisite', () => {
  const state = scenario();
  const raw = JSON.parse(serializeGame(state)); raw.state.progression[0].technologies = ['technology.waterworks'];
  raw.stateChecksum = checksum(JSON.stringify(raw.state));
  expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/researched technology/);
});
