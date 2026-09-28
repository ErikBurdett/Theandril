import { BUILDINGS, UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { rebaseAuthoredLand, refreshAuthoredSight } from './authored-land';
import { matureCampaign } from './index';

const order = (game: GameState, command: GameCommand) => {
  const result = applyCommand(game, command);
  if (!result.ok) throw new Error(`Empire delegation setup (${command.type}): ${result.error}`);
};
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Synthetic mature ownership, infrastructure and army placement, not earned
 * conquest. The Huge generated world remains intact outside one disclosed
 * frontier patch. Every standing order, war and interrupted journey below uses
 * canonical commands; the final snapshot crosses the real strict save loader. */
export function empireDelegationCampaign() {
  let game = matureCampaign('huge');
  const owner = game.turnOwnerId, width = game.world.width;
  const towns = Object.values(game.settlements).sort(byId);
  const playerHome = towns.find(town => town.factionId === owner)!;
  const ownedTowns = [playerHome, ...towns.filter(town => town.id !== playerHome.id)].slice(0, 30);
  const ownedIds = new Set(ownedTowns.map(town => town.id));
  const rivalTowns = towns.filter(town => !ownedIds.has(town.id));
  if (rivalTowns.length !== 2) throw new Error('The delegation exercise needs two surviving rival hearths.');
  const enemyIds = rivalTowns.map(town => town.factionId);
  const centers = new Set(ownedTowns.map(town => town.cell));
  const occupied = new Map(Object.values(game.armies).map(army => [army.cell, army.factionId]));
  const displaced = new Map<number, number>();
  for (const army of Object.values(game.armies)) {
    if (army.factionId === owner || !centers.has(army.cell)) continue;
    let cell = displaced.get(army.cell);
    if (cell === undefined) {
      cell = neighbors(army.cell, width, game.world.height).find(candidate => !centers.has(candidate)
        && isPassable(game.world.terrain[candidate]!) && (!occupied.has(candidate) || occupied.get(candidate) === army.factionId));
      if (cell === undefined) throw new Error('No legal position for the authored former garrison.');
      displaced.set(army.cell, cell); occupied.set(cell, army.factionId);
    }
    army.cell = cell;
  }
  ownedTowns.forEach((town, index) => {
    town.factionId = owner; town.population = 8; town.food = 1_000;
    town.name = `Delegated hearth ${String(index + 1).padStart(2, '0')}`;
    // Explicit mature infrastructure; ordinary empire upkeep still applies and
    // can exhaust the finite purse used by the shared-budget acceptance.
    if (index >= 3) town.buildings = ['building.market'];
  });

  const taken = new Set([
    ...Object.values(game.land.settlements).flatMap(land => land.claimed),
    ...Object.values(game.armies).filter(army => army.factionId !== owner).map(army => army.cell),
  ]);
  let patch: number[] = [], reserve = -1;
  for (let row = 16; row < game.world.height - 20 && reserve < 0; row += 16) {
    const candidate = Array.from({ length: 15 }, (_, y) => Array.from({ length: 48 }, (_, x) => (row + y) * width + 20 + x)).flat();
    if (candidate.some(cell => taken.has(cell))) continue;
    patch = candidate; reserve = (row + 5) * width + 24;
  }
  if (reserve < 0) throw new Error('No empty frontier patch for the delegation exercise.');
  for (const cell of patch) {
    game.world.terrain[cell] = 1; game.world.biome[cell] = 1; game.world.waterDepth[cell] = 0; game.world.fertility[cell] = 60;
    delete game.resources.deposits[cell];
    game.explored[owner]!.add(cell);
  }
  const frontier = ownedTowns.slice(0, 3);
  const names = ['Frontier reserve', 'Frontier west', 'Frontier east'];
  frontier.forEach((town, index) => { town.name = names[index]!; town.cell = reserve + index * 12; });
  const island = reserve + 6 * width + 14;
  for (const cell of neighbors(island, width, game.world.height)) {
    game.world.terrain[cell] = 0; game.world.waterDepth[cell] = 1; game.world.biome[cell] = 0; game.world.fertility[cell] = 0;
  }

  const guard = UNITS.find(unit => unit.id === 'unit.guard')!;
  const own = Object.values(game.armies).filter(army => army.factionId === owner).sort(byId);
  while (own.length < 128) {
    const id = `army.${game.nextId++}`;
    const army = { id, factionId: owner, name: 'Authored guard', cell: reserve, movement: guard.movement, formations: [createArmyFormation(id, guard.id)] };
    game.armies[id] = army; own.push(army);
  }
  own.sort(byId).forEach((army, index) => {
    army.cell = reserve; army.name = `Home guard ${String(index + 1).padStart(3, '0')}`;
    army.movement = guard.movement; army.formations = [createArmyFormation(army.id, guard.id)];
  });
  own[0]!.name = 'Northern relief interrupted';
  own[1]!.name = 'Northern relief ready';
  own[2]!.name = 'Stranded reserve'; own[2]!.cell = island;
  own[3]!.name = 'Direct watch override';
  own.slice(4, 16).forEach((army, index) => { army.name = `Northern watch ${String(index + 1).padStart(2, '0')}`; });
  // A forward company actually sees the first rival before the canonical war
  // command. Merely explored geography does not grant faction contact.
  own[4]!.cell = reserve + 6 + 2 * width;
  const enemyArmies = enemyIds.map(id => Object.values(game.armies).find(army => army.factionId === id)!);
  enemyArmies[0]!.cell = reserve + 6 + width; enemyArmies[1]!.cell = reserve + 14 + width;
  rebaseAuthoredLand(game);
  game = deserializeGame(serializeGame(game));
  for (const targetFactionId of enemyIds) order(game, { type: 'declareWar', factionId: owner, targetFactionId });
  order(game, { type: 'queueMovement', factionId: owner, armyId: own[0]!.id, target: reserve + 12 });
  order(game, { type: 'move', factionId: enemyIds[0]!, armyId: enemyArmies[0]!.id, target: reserve + 6 });
  order(game, { type: 'endTurn', factionId: owner });
  if (game.routes[own[0]!.id]?.status !== 'paused') throw new Error('The actual foreign move must interrupt the saved relief route.');
  // This acceptance exercises delegation under a visible threat, not a tactical
  // battle. The interrupting patrol is placed back at its distant home; a water
  // ring isolates the second threat without touching the interrupted path.
  game.armies[enemyArmies[0]!.id]!.cell = rivalTowns[0]!.cell;
  for (const cell of neighbors(game.armies[enemyArmies[1]!.id]!.cell, width, game.world.height)) {
    if (Object.values(game.armies).some(army => army.cell === cell) || Object.values(game.settlements).some(town => town.cell === cell)) throw new Error('A threat moat must not strand an existing entity on water.');
    game.world.terrain[cell] = 0; game.world.waterDepth[cell] = 1; game.world.biome[cell] = 0; game.world.fertility[cell] = 0;
  }
  rebaseAuthoredLand(game);
  for (const army of [own[3]!, ...own.slice(16)]) order(game, { type: 'setPosting', factionId: owner, armyId: army.id, cell: reserve, mode: 'hold' });
  for (const town of ownedTowns) order(game, { type: 'setCharter', factionId: owner, settlementId: town.id, focus: 'muster', ceiling: 4 });
  order(game, { type: 'queue', factionId: owner, settlementId: frontier[0]!.id, itemId: 'building.granary' });
  const reliefIds = own.slice(0, 3).map(army => army.id), watchIds = own.slice(2, 16).map(army => army.id);
  for (const [kind, name, memberIds] of [
    ['armies', 'Northern relief', reliefIds], ['armies', 'Northern watch', watchIds],
    ['settlements', 'Frontier works', frontier.map(town => town.id)], ['settlements', 'Realm works', ownedTowns.map(town => town.id)],
  ] as const) order(game, { type: 'setSelectionGroup', factionId: owner, kind, name, memberIds: [...memberIds] });

  const workshop = BUILDINGS.find(item => item.id === 'building.workshop')!, cellar = BUILDINGS.find(item => item.id === 'building.granary')!;
  const initialBudget = guard.coinCost * 2 + workshop.coinCost + cellar.coinCost;
  game.factions.find(faction => faction.id === owner)!.treasury = initialBudget;
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  const view = getObservation(game, owner, { landDetails: 'none', developmentCandidates: false });
  if (view.armies.filter(army => army.factionId === owner).length !== 128 || view.settlements.filter(town => town.factionId === owner).length !== 30 || view.wars.length !== 2 || view.events.length < 32) throw new Error('The authored mature-realm acceptance population is incomplete.');
  return {
    game, owner, patch, reserve, island, initialBudget, sequence: [guard.id, workshop.id],
    frontier: frontier.map(town => ({ id: town.id, name: town.name, cell: town.cell })),
    reliefIds, watchIds, interruptedId: own[0]!.id, strandedId: own[2]!.id, overrideId: own[3]!.id,
    threatArmyId: enemyArmies[1]!.id, enemyIds,
    authored: 'Huge/gen4/seed20260905; 30 authored owned hearths,128 owned combat armies,two living rival hearths and wars. Ownership, markets and army positions are synthetic. Generated geography/resources remain outside the disclosed720-cell frontier patch. Orders and route interruption use canonical commands. Before import, the interrupting patrol is placed back at its distant home and water is authored around the remaining visible threat to isolate delegation from tactical battle without altering the saved interrupted path.',
  };
}
