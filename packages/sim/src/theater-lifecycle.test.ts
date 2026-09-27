import { describe, expect, it } from 'vitest';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, deserializeGame, getObservation, serializeGame, type GameCommand, type GameState } from './index';
import { advanceTheaters } from './theaters';
import { theaterCampaign } from '../../test-fixtures/src/theater-fixture';
import { characterCampaign, CHARACTER_FIXTURE as C } from '../../test-fixtures/src/character-fixture';
import { conquestCampaign, CONQUEST_FIXTURE as Q } from '../../test-fixtures/src/conquest-fixture';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';

const issue = (game: GameState, command: GameCommand) => {
  const result = applyCommand(game, command);
  expect(result, `${JSON.stringify(command)}: ${result.error ?? ''}`).toMatchObject({ ok: true });
  return result;
};
const end = (game: GameState) => issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
const restore = (game: GameState) => {
  const saved = serializeGame(game), restored = deserializeGame(saved);
  expect(serializeGame(restored)).toBe(saved); return restored;
};
const view = (game: GameState) => getObservation(game, game.turnOwnerId).theaters![0]!;
const ownTowns = (game: GameState) => Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).map(town => town.id).sort();
const config = (game: GameState, armyIds: string[], settlementIds = ownTowns(game), reserveCell = game.armies[armyIds[0]!]!.cell) => ({
  type: 'setTheater' as const, factionId: game.turnOwnerId, name: 'Lifecycle watch', armyIds, settlementIds, reserveCell, guardsPerSettlement: 1, enabled: true,
});

describe('defense theater lifecycle and ordinary order precedence', () => {
  it('retains an actually embarked combat member without counting or dispatching its cargo, then recognizes its return ashore', () => {
    let game = navalCampaign({ enemyFleet: false });
    const factionId = game.turnOwnerId, before = new Set(Object.keys(game.armies));
    const guard = game.armies[N.cargoId]!.formations.find(formation => formation.unitId === 'unit.guard')!;
    issue(game, { type: 'splitArmy', factionId, armyId: N.cargoId, formationIds: [guard.id] });
    const armyId = Object.keys(game.armies).find(id => !before.has(id))!;
    expect(armyId).toBeTruthy();
    issue(game, config(game, [armyId], [N.homeId], N.homeCell));
    end(game);
    expect(view(game).hearths[0]).toMatchObject({ stationed: 1, incoming: 0, deficit: 0 });
    issue(game, { type: 'embarkArmy', factionId, armyId, fleetId: N.fleetId });
    expect(view(game).members[0]).toMatchObject({ armyId, status: 'blocked', blocker: expect.stringMatching(/aboard/) });
    expect(view(game).hearths[0]).toMatchObject({ stationed: 0, incoming: 0, deficit: 1 });
    end(game);
    expect(game.theaters[0]!.armyIds).toEqual([armyId]); expect(game.theaters[0]!.lastDispatches).toEqual([]);
    expect(game.routes[armyId]).toBeUndefined(); expect(game.transports[armyId]).toBe(N.fleetId);
    game = restore(game);
    issue(game, { type: 'disembarkArmy', factionId, armyId, target: N.homeCell });
    expect(view(game).members[0]).toMatchObject({ status: 'garrison', blocker: null });
    expect(view(game).hearths[0]).toMatchObject({ stationed: 1, deficit: 0 });
    restore(game);
  });

  it('waits for a real stationary refit mission and only assigns the army after its canonical completion', () => {
    const game = characterCampaign(), factionId = game.turnOwnerId, army = game.armies[C.armyId]!, home = game.settlements[C.homeId]!;
    const reserve = neighbors(home.cell, game.world.width, game.world.height).find(cell => isPassable(game.world.terrain[cell]!)
      && !Object.values(game.settlements).some(town => town.cell === cell))!;
    issue(game, { type: 'recruitCharacter', factionId, settlementId: C.homeId, definitionId: 'character.engineer' });
    const engineer = Object.values(game.characters).find(character => character.definitionId === 'character.engineer')!;
    issue(game, { type: 'assignCharacter', factionId, characterId: engineer.id, armyId: army.id });
    issue(game, config(game, [army.id], [C.homeId], reserve));
    issue(game, { type: 'startCharacterMission', factionId, characterId: engineer.id, missionId: 'mission.refit' });
    expect(view(game).members[0]?.blocker).toMatch(/character mission/);
    end(game);
    expect(engineer.mission).not.toBeNull(); expect(army.cell).toBe(home.cell);
    expect(game.theaters[0]!.lastDispatches).toEqual([]); expect(game.routes[army.id]).toBeUndefined();
    restore(game);
    end(game);
    expect(engineer.mission).toBeNull(); expect(army.cell).toBe(reserve);
    expect(game.theaters[0]!.lastDispatches).toEqual([expect.objectContaining({ armyId: army.id, targetCell: reserve, accepted: true })]);
    expect(view(game).hearths[0]?.stationed).toBe(1); // The other real company keeps the physical floor.
    restore(game);
  });

  it('does not abandon an actual siege to fill an otherwise empty home garrison', () => {
    const game = conquestCampaign(), factionId = game.turnOwnerId, army = game.armies[Q.playerArmyId]!;
    issue(game, config(game, [army.id], ownTowns(game), game.settlements[ownTowns(game)[0]!]!.cell));
    issue(game, { type: 'declareWar', factionId, targetFactionId: Q.enemyFactionId });
    issue(game, { type: 'besiege', factionId, armyId: army.id, settlementId: Q.settlementId });
    const cell = army.cell;
    expect(view(game).members[0]?.blocker).toMatch(/siege/);
    end(game);
    expect(game.sieges[Q.settlementId]?.armyId).toBe(army.id); expect(army.cell).toBe(cell);
    expect(game.theaters[0]!.lastDispatches).toEqual([]); expect(game.routes[army.id]).toBeUndefined();
    expect(view(game).hearths[0]?.deficit).toBe(1);
    restore(game);
  });

  it('prunes a real merged-away member immediately and keeps the surviving delegate and its exact save', () => {
    const game = theaterCampaign(3), [source, target] = Object.keys(game.armies).sort();
    issue(game, config(game, [source!, target!]));
    const result = issue(game, { type: 'mergeArmies', factionId: game.turnOwnerId, sourceArmyId: source!, targetArmyId: target! });
    expect(game.armies[source!]).toBeUndefined(); expect(game.armies[target!]!.formations).toHaveLength(2);
    expect(game.theaters[0]!.armyIds).toEqual([target]);
    expect(result.events.some(event => event.type === 'theater_members_lost')).toBe(true);
    expect(view(game).members.map(member => member.armyId)).toEqual([target]);
    const loaded = restore(game);
    expect(loaded.theaters[0]!.armyIds).toEqual([target]); expect(loaded.nextTheaterId).toBe(2);
  });

  it('does not count a genuinely composition-paused route as incoming, and assigns a different idle army', () => {
    const game = theaterCampaign(3), [paused, donor, idle] = Object.keys(game.armies).sort();
    const town = Object.values(game.settlements).find(item => item.cell === 500)!;
    issue(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: paused!, target: town.cell });
    const current = game.armies[paused!]!.cell;
    issue(game, { type: 'moveTo', factionId: game.turnOwnerId, armyId: donor!, target: current });
    issue(game, { type: 'mergeArmies', factionId: game.turnOwnerId, sourceArmyId: donor!, targetArmyId: paused! });
    expect(game.routes[paused!]).toMatchObject({ status: 'paused', pauseReason: expect.stringMatching(/composition/i) });
    issue(game, config(game, [paused!, idle!], [town.id], 495));
    expect(view(game).hearths[0]).toMatchObject({ stationed: 0, incoming: 0, deficit: 1 });
    const prior = structuredClone(game.routes[paused!]);
    advanceTheaters(game, []);
    expect(game.routes[paused!]).toEqual(prior);
    expect(game.theaters[0]!.lastDispatches).toEqual([expect.objectContaining({ armyId: idle, targetCell: town.cell, accepted: true })]);
    expect(view(game).hearths[0]).toMatchObject({ incoming: 1, deficit: 0 });
    expect(view(game).members.find(member => member.armyId === paused)?.status).toBe('overridden');
    restore(game);
  });

  it.each(['detach', 'disable', 'delete'] as const)('%s leaves an already issued ordinary route running and saveable', change => {
    let game = theaterCampaign(1);
    const armyId = Object.keys(game.armies)[0]!, town = Object.values(game.settlements).find(item => item.cell === 500)!;
    const initial = config(game, [armyId], [town.id], 495);
    issue(game, initial); end(game);
    const route = structuredClone(game.routes[armyId]); expect(route).toMatchObject({ status: 'active', waypoints: [town.cell] });
    if (change === 'delete') issue(game, { type: 'deleteTheater', factionId: game.turnOwnerId, theaterId: game.theaters[0]!.id });
    else issue(game, { ...initial, theaterId: game.theaters[0]!.id, ...(change === 'detach' ? { armyIds: [] } : { enabled: false }) });
    expect(game.routes[armyId]).toEqual(route);
    game = restore(game); end(game);
    expect(game.armies[armyId]!.cell).toBe(town.cell); expect(game.routes[armyId]).toBeUndefined();
    if (change !== 'delete') expect(game.theaters[0]!.lastDispatches).toEqual([]);
    restore(game);
  });
});
