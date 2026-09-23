import { describe, expect, it } from 'vitest';
import { UNITS } from '@theandril/content';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../test-fixtures/src/naval-fixture';
import { applyCommand, getObservation } from './simulation';
import { armySupply, FLEET_PROVISION_TURNS, SUPPLY_ATTRITION } from './supply';
import { deserializeGame, serializeGame, stateHash } from './save';
import { withRules } from './rules';
import type { GameCommand, GameState } from './types';

const factionId = 'faction.ashen_compact';
const issue = (state: GameState, command: GameCommand): void => {
  const result = applyCommand(state, command);
  expect(result.error ?? 'ok', JSON.stringify(command)).toBe('ok');
};
const end = (state: GameState): void => issue(state, { type: 'endTurn', factionId });
const restore = (state: GameState): GameState => deserializeGame(serializeGame(state));

function voyage(): GameState {
  const state = navalCampaign({ enemyFleet: false });
  issue(state, { type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  issue(state, { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
  issue(state, { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.voyageCell });
  while (state.routes[N.fleetId]) end(state);
  expect(armySupply(state, N.fleetId).sourceSettlementId).toBeNull();
  return state;
}

describe('fleet provisions', () => {
  it('consumes the last ration before attrition, shares stores with passengers, and refills on a saved return', () => {
    const state = voyage();
    const before = state.armies[N.fleetId]!.formations.map(item => item.strength);
    const cargoBefore = state.armies[N.cargoId]!.formations.map(item => item.strength);
    const stores = armySupply(state, N.fleetId).fleetProvisions!;
    expect(stores).toEqual({ remaining: FLEET_PROVISION_TURNS, capacity: FLEET_PROVISION_TURNS, refilling: false });
    for (let remaining = stores.remaining - 1; remaining >= 0; remaining--) {
      end(state);
      expect(armySupply(state, N.fleetId).fleetProvisions?.remaining).toBe(remaining);
      expect(state.armies[N.fleetId]!.formations.map(item => item.strength)).toEqual(before);
      expect(state.armies[N.cargoId]!.formations.map(item => item.strength)).toEqual(cargoBefore);
    }
    expect(armySupply(state, N.fleetId).supplied).toBe(false);
    expect(armySupply(state, N.cargoId)).toMatchObject({ supplied: false, fleetProvisions: { remaining: 0 } });
    expect(state.events.some(event => event.type === 'fleet_stores_empty')).toBe(true);
    const mirror = restore(state);
    for (const game of [state, mirror]) {
      end(game);
      expect(game.armies[N.fleetId]!.formations.map(item => item.strength)).toEqual(before.map(value => value - SUPPLY_ATTRITION));
      expect(game.armies[N.cargoId]!.formations.map(item => item.strength)).toEqual(cargoBefore.map(value => value - SUPPLY_ATTRITION));
      issue(game, { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.fleetCell });
      while (game.routes[N.fleetId]) end(game);
      const strengthAtPort = game.armies[N.fleetId]!.formations.map(item => item.strength);
      expect(armySupply(game, N.fleetId).fleetProvisions?.refilling).toBe(true);
      end(game);
      expect(armySupply(game, N.fleetId).fleetProvisions?.remaining).toBe(FLEET_PROVISION_TURNS);
      expect(game.armies[N.fleetId]!.formations.map(item => item.strength)).toEqual(strengthAtPort);
      expect(game.events.some(event => event.type === 'fleet_resupplied')).toBe(true);
    }
    expect(stateHash(state)).toBe(stateHash(mirror));
    expect(stateHash(restore(state))).toBe(stateHash(state));
  });

  it('never renews endurance through a split, merge or partial transfer', () => {
    const state = navalCampaign({ enemyFleet: false });
    const fleet = state.armies[N.fleetId]!;
    fleet.provisions = 2;
    const detachedId = `army.${state.nextId}`;
    issue(state, { type: 'splitArmy', factionId, armyId: fleet.id, formationIds: [fleet.formations[0]!.id] });
    expect(state.armies[detachedId]!.provisions).toBe(2);
    expect(fleet.provisions).toBe(2);
    // Receiving a fully provisioned hull cannot reset an exhausted force.
    state.armies[detachedId]!.provisions = FLEET_PROVISION_TURNS;
    issue(state, { type: 'transferFormations', factionId, sourceArmyId: fleet.id, targetArmyId: detachedId, formationIds: [fleet.formations[0]!.id] });
    expect(state.armies[detachedId]!.provisions).toBe(2);
    fleet.provisions = 0;
    issue(state, { type: 'mergeArmies', factionId, sourceArmyId: fleet.id, targetArmyId: detachedId });
    expect(state.armies[detachedId]!.provisions).toBe(0);
    expect(stateHash(restore(state))).toBe(stateHash(state));
  });

  it('has no small-fleet or landless exemption and never heals a damaged hull up to the attrition floor', () => {
    const state = navalCampaign({ enemyFleet: false });
    const fleet = state.armies[N.coastalId]!;
    fleet.provisions = 0;
    fleet.formations[0]!.strength = 1;
    fleet.formations[0]!.morale = 1; fleet.formations[0]!.fatigue = 60;
    delete state.settlements[N.homeId];
    // Supply is a derived query: avoid persisting an intentionally removed town's land.
    expect(armySupply(state, fleet.id).supplied).toBe(false);
    end(state);
    expect(fleet.formations[0]).toMatchObject({ strength: 1, morale: 4, fatigue: 55 });
    expect(fleet.provisions).toBe(0);
  });

  it('keeps foreign stores private and preserves the historical fleet exemption', () => {
    const state = navalCampaign();
    state.armies[N.fleetId]!.provisions = 0;
    state.armies[N.enemyFleetId]!.provisions = 2;
    const observation = getObservation(state, factionId);
    expect(observation.supply.every(entry => state.armies[entry.armyId]?.factionId === factionId)).toBe(true);
    expect(observation.armies.every(army => army.provisions === undefined)).toBe(true);
    withRules(state, 30, () => {
      expect(armySupply(state, N.fleetId)).toMatchObject({ supplied: true, reason: 'A fleet carries its own stores.' });
      expect(armySupply(state, N.fleetId).fleetProvisions).toBeUndefined();
    });
  });

  it('bounds long starvation and makes passenger outcomes independent of army ID ordering', () => {
    const state = voyage();
    const fleet = state.armies[N.fleetId]!;
    // The passenger sorts before its carrier, so no loop may read decremented stores.
    const cargo = state.armies[N.cargoId]!;
    delete state.armies[cargo.id]; delete state.transports[cargo.id];
    cargo.id = 'army.1'; state.armies[cargo.id] = cargo; state.transports[cargo.id] = fleet.id;
    fleet.provisions = 1;
    const game = restore(state), initial = game.armies[cargo.id]!.formations.map(item => item.strength);
    end(game);
    expect(game.armies[cargo.id]!.formations.map(item => item.strength)).toEqual(initial);
    for (let turn = 0; turn < 80; turn++) end(game);
    for (const armyId of [fleet.id, cargo.id]) for (const formation of game.armies[armyId]!.formations) {
      expect(formation.strength).toBe(Math.ceil(UNITS.find(unit => unit.id === formation.unitId)!.strength * 0.2));
    }
    expect(stateHash(restore(game))).toBe(stateHash(game));
  });
});
