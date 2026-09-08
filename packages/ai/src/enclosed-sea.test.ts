import { expect, test } from 'vitest';
import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance, isLake, isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { planTurn } from './index';

/** Independent test-only observed connectivity: no canonical terrain is supplied to AI. */
function knownComponent(view: Observation, origin: number, water: boolean): Set<number> {
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const visited = new Set([origin]), queue = [origin];
  for (let index = 0; index < queue.length; index++) {
    for (const next of neighbors(queue[index]!, view.width, view.height)) {
      const cell = cells.get(next);
      // A fully observed water boundary proves closure; exhausted exploration alone does not.
      if (water) expect(cell, `Uncharted boundary at ${next}`).toBeDefined();
      if (!cell || visited.has(next)) continue;
      if (water ? cell.terrain === 0 && !isLake(cell.hydrology ?? 0) : isPassable(cell.terrain)) {
        visited.add(next); queue.push(next);
      }
    }
  }
  return visited;
}

test('Mire Courts earn a same-landmass inland ferry colony, with a saved voyage and exact command replay', () => {
  // Genuine generated resources and fog, not a funded/naval fixture. This is an
  // enclosed-sea crossing on the home landmass, explicitly not overseas proof.
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 1, factionDefinitionId: 'faction.mire_courts' });
  const initialSave = serializeGame(state), factionId = state.turnOwnerId;
  const prices = new Map([...BUILDINGS, ...UNITS].map(item => [item.id, item.coinCost]));
  const records: { command: GameCommand; result: ReturnType<typeof applyCommand> }[] = [];
  const paidItems: string[] = [];
  let mirror: GameState | undefined;
  let ferryId: string | undefined, cargoId: string | undefined, departure = -1;
  const visitedAfterLanding = new Set<number>();
  let passengerIds: string[] = [], loadedMoves = 0, landed = false, founded = false;

  const issue = (command: GameCommand): void => {
    const before = getObservation(state, factionId), beforeCoin = before.treasury;
    if (command.type === 'embarkArmy' && !cargoId) {
      const cargo = before.armies.find(army => army.id === command.armyId)!;
      const fleet = before.armies.find(army => army.id === command.fleetId)!;
      expect(cargo.formations.some(formation => formation.unitId === 'unit.colonist')).toBe(true);
      expect(fleet.formations.some(formation => formation.unitId === 'unit.transport')).toBe(true);
      expect(paidItems).toEqual(expect.arrayContaining(['building.harbor', 'unit.transport', 'unit.colonist']));
      expect(knownComponent(before, fleet.cell, true).size).toBeGreaterThan(1);
      ferryId = fleet.id; cargoId = cargo.id; departure = before.settlements[0]!.cell;
      passengerIds = cargo.formations.map(formation => formation.id);
    }
    if (command.type === 'moveTo' && command.armyId === ferryId && cargoId && state.transports[cargoId] === ferryId) loadedMoves++;
    if (command.type === 'disembarkArmy' && command.armyId === cargoId) {
      expect(loadedMoves).toBeGreaterThan(0);
      expect(hexDistance(command.target, departure, before.width)).toBeGreaterThanOrEqual(4);
      expect(knownComponent(before, departure, false).has(command.target)).toBe(true);
      expect(before.armies.find(army => army.id === cargoId)!.disembarkOptions)
        .toContainEqual({ cell: command.target, canDisembark: true, blocker: null });
      visitedAfterLanding.add(command.target); landed = true;
    }
    const result = applyCommand(state, command);
    expect(result.ok, `Turn ${before.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
    records.push({ command: structuredClone(command), result: structuredClone(result) });
    if (mirror) expect(applyCommand(mirror, command)).toEqual(result);
    if (command.type === 'queue') {
      expect(beforeCoin - state.factions[0]!.treasury).toBe(prices.get(command.itemId));
      paidItems.push(command.itemId);
    }
    if (command.type === 'embarkArmy' && command.armyId === cargoId && !mirror) {
      mirror = deserializeGame(serializeGame(state)); // Continue from the actual loaded-voyage save.
      expect(mirror.transports[cargoId!]).toBe(ferryId);
    }
    if (cargoId && state.armies[cargoId]) expect(state.armies[cargoId]!.formations.map(formation => formation.id)).toEqual(passengerIds);
    if (landed && command.type === 'moveTo' && command.armyId === cargoId) {
      // A real ferry passenger may continue along charted land to found an ocean
      // port; landing is not an automatic or forced settlement command.
      expect(state.armies[cargoId!]!.cell).toBe(command.target);
      expect(state.transports[cargoId!]).toBeUndefined();
      visitedAfterLanding.add(command.target);
    }
    if (command.type === 'found' && command.armyId === cargoId) {
      expect(landed).toBe(true);
      const foundedAt = before.armies.find(army => army.id === cargoId)!.cell;
      expect(visitedAfterLanding.has(foundedAt)).toBe(true);
      expect(Object.values(state.settlements).some(town => town.cell === foundedAt && town.factionId === factionId)).toBe(true);
      expect(state.armies[cargoId!]).toBeUndefined(); // The real lone caravan is consumed once.
      founded = true;
    }
  };

  for (let round = 0; round < 100 && !founded; round++) {
    const view = getObservation(state, factionId), original = structuredClone(view);
    const commands = planTurn(view);
    expect(planTurn(structuredClone(view))).toEqual(commands);
    expect(view).toEqual(original);
    expect(commands.length).toBeLessThanOrEqual(128);
    if (mirror) expect(planTurn(getObservation(mirror, factionId))).toEqual(commands);
    for (const command of commands) issue(command);
    issue({ type: 'endTurn', factionId });
    const saved = serializeGame(state);
    expect(serializeGame(deserializeGame(saved))).toBe(saved);
    if (mirror) expect(serializeGame(mirror)).toBe(saved);
  }

  expect({ resumedLoadedVoyage: Boolean(mirror), landed, founded }).toEqual({ resumedLoadedVoyage: true, landed: true, founded: true });
  expect(Object.values(state.settlements).filter(town => town.factionId === factionId).length).toBeGreaterThanOrEqual(2);
  const replay = deserializeGame(initialSave);
  for (const { command, result } of records) expect(applyCommand(replay, command)).toEqual(result);
  expect(serializeGame(replay)).toBe(serializeGame(state));
  expect(stateHash(replay)).toBe(stateHash(state));
});
