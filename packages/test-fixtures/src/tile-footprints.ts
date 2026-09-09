import { IMPROVEMENTS, TECHNOLOGIES } from '@theandril/content';
import { hexDistance, naturalFeatures } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { cellsWithin } from '../../sim/src/visibility';
import { refreshAuthoredSight } from './authored-land';

const order = (game: GameState, command: GameCommand) => {
  const result = applyCommand(game, command);
  if (!result.ok) throw new Error(`Tile-footprint fixture ${command.type}: ${result.error}`);
  return result;
};

/** Authored terrain/resources/populations, not an earned campaign or balance
 * benchmark. All ten works are bought/completed through ordinary commands. */
export function tileFootprintCampaign({ rememberForeignSite = false } = {}) {
  const game = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 2, pace: 'epic' });
  const owner = game.turnOwnerId, foreign = game.factions[1]!.id, width = game.world.width;
  const center = 14 * width + 16, hiddenCell = 27 * width + 34;
  game.resources.deposits = {}; // This fixture replaces the entire physical geography with resource-free authored land/water.
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(80);
  game.armies['army.1']!.cell = center;
  game.armies['army.2']!.cell = center - 4;
  game.armies['army.2']!.name = 'Unscaled traveling escort';
  game.armies['army.3']!.cell = hiddenCell;
  game.armies['army.4']!.cell = hiddenCell;
  game.factions[0]!.treasury = 30_000; game.factions[0]!.knowledge = 30_000;
  game.factions[1]!.treasury = 1000;
  game.explored = Object.fromEntries(game.factions.map(faction => [faction.id, new Set<number>()]));
  const cells = cellsWithin(game, center, 3).filter(cell => cell !== center);
  for (const cell of cells) { game.world.terrain[cell] = 2; game.world.biome[cell] = 2; }
  const spring = cells.find(cell => naturalFeatures(game.world, cell) & 1);
  const grove = cells.find(cell => cell !== spring && (naturalFeatures(game.world, cell) & 4));
  if (spring === undefined || grove === undefined) throw new Error('The authored sites need actual spring and old-growth feature cells.');
  for (const cell of cells) if (cell !== spring && cell !== grove) { game.world.terrain[cell] = 3; game.world.biome[cell] = 6; }
  const ore = cells.find(cell => cell !== spring && cell !== grove && (naturalFeatures(game.world, cell) & 2));
  if (ore === undefined) throw new Error('The authored sites need an actual ore seam.');
  const remaining = cells.filter(cell => ![spring, grove, ore].includes(cell));
  const [fields, woodlot, quarry, reeds, fishery, polder, tide] = remaining;
  const siteCells = [fields!, woodlot!, quarry!, reeds!, fishery!, spring, polder!, grove, ore, tide!];
  const terrains = [1, 2, 3, 1, 0, 2, 1, 2, 3, 0], biomes = [1, 2, 11, 7, 0, 2, 7, 2, 6, 0];
  siteCells.forEach((cell, i) => { game.world.terrain[cell] = terrains[i]!; game.world.biome[cell] = biomes[i]!; game.world.waterDepth[cell] = terrains[i] === 0 ? 1 : 0; });
  refreshAuthoredSight(game);
  order(game, { type: 'found', factionId: owner, armyId: 'army.1', name: 'Inset Capital' });
  const capital = Object.values(game.settlements).find(town => town.cell === center)!;
  capital.population = 8; capital.food = 1000;
  for (const technology of TECHNOLOGIES) order(game, { type: 'research', factionId: owner, technologyId: technology.id });
  for (const cell of [...cells].sort((a, b) => hexDistance(center, a, width) - hexDistance(center, b, width) || a - b)) {
    if (!game.land.settlements[capital.id]!.claimed.includes(cell)) order(game, { type: 'claimCell', factionId: owner, settlementId: capital.id, cell });
  }
  const paidWorks: { cell: number; improvementId: string; coinCost: number; completedTurn: number }[] = [];
  // Deposit extraction has its own paid resource fixture; these ten authored
  // terrain/feature sites cover the general works only.
  IMPROVEMENTS.filter(definition => !definition.requiredResourceId).forEach((definition, i) => {
    const before = game.factions[0]!.treasury;
    order(game, { type: 'improveTile', factionId: owner, settlementId: capital.id, cell: siteCells[i]!, improvementId: definition.id });
    const coinCost = before - game.factions[0]!.treasury;
    if (coinCost <= 0) throw new Error('A fixture improvement was not actually paid for.');
    for (let turn = 0; turn < definition.turns; turn++) order(game, { type: 'endTurn', factionId: owner });
    paidWorks.push({ cell: siteCells[i]!, improvementId: definition.id, coinCost, completedTurn: game.turn });
  });
  const found = (name: string, cell: number, population: number) => {
    const id = `army.${game.nextId++}`;
    game.armies[id] = { id, name: `${name} authored founder`, factionId: owner, cell, movement: 4, formations: [createArmyFormation(id, 'unit.colonist')] };
    refreshAuthoredSight(game);
    order(game, { type: 'found', factionId: owner, armyId: id, name });
    const town = Object.values(game.settlements).find(town => town.cell === cell)!;
    town.population = population; town.food = 100;
    return { id: town.id, cell: town.cell, name: town.name };
  };
  const town = found('Inset Town', 14 * width + 23, 4);
  const village = found('Inset Camp', 20 * width + 20, 1);
  order(game, { type: 'found', factionId: foreign, armyId: 'army.3', name: 'Unseen courtyard' });
  const hidden = Object.values(game.settlements).find(town => town.cell === hiddenCell)!;
  hidden.population = 8;
  const hiddenImprovementCell = hiddenCell - 1;
  if (rememberForeignSite) {
    // Explicit scenario reconnaissance: retain the seen empty field, then leave
    // before the foreign owner buys it. No hidden-source art should appear.
    game.armies['army.2']!.cell = hiddenImprovementCell;
    refreshAuthoredSight(game);
    game.armies['army.2']!.cell = center - 4;
    refreshAuthoredSight(game);
  }
  order(game, { type: 'improveTile', factionId: foreign, settlementId: hidden.id, cell: hiddenImprovementCell, improvementId: 'improvement.terraced_fields' });
  for (let turn = 0; turn < 2; turn++) order(game, { type: 'endTurn', factionId: owner });
  capital.population = 8;
  game.settlements[town.id]!.population = 4; game.settlements[village.id]!.population = 1;
  refreshAuthoredSight(game);
  return { game: deserializeGame(serializeGame(game)), siteCells, paidWorks,
    towns: [{ id: capital.id, cell: center, name: capital.name }, town, village], hidden: { id: hidden.id, cell: hidden.cell, improvementCell: hiddenImprovementCell } };
}
