import { describe, expect, it } from 'vitest';
import { neighbors, isPassable } from '@theandril/mapgen';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { withRules } from './rules';
import { PRE_CITY_STATES_II_CONTENT_HASH, serializeGameForVersion } from './save';
import { HIRE_COOLDOWN_TURNS, HIRED_UNIT_ID, hireBlocker, hirePriceOf, validateHires } from './hires';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** A realm, a city-state, and the realm's company standing at the city-state's gate. */
const atTheGate = () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 , rulesVersion: 68 /* the first roster, so the campaign also seals under the older rules this file reads */ });
  for (const faction of state.factions) faction.treasury = 200;
  const realm = state.factions.find(faction => !faction.id.startsWith('citystate.'))!.id, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
  const caravan = Object.values(state.armies).find(army => army.factionId === city && army.formations.some(item => item.unitId === 'unit.colonist'))!;
  const founded = applyCommand(state, { type: 'found', factionId: city, armyId: caravan.id, name: 'Gate City' });
  if (!founded.ok) throw new Error(founded.error);
  const hearth = Object.values(state.settlements).find(town => town.factionId === city)!;
  const gate = neighbors(hearth.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: realm, name: 'Buying company', cell: gate, movement: 1, formations: [{ ...createArmyFormation(id, 'unit.heavy_infantry'), id: `formation.${state.nextId++}` }] };
  refreshAuthoredSight(state);
  return { state, realm, city, hearth, armyId: id, gate };
};

describe('rules 68: companies hired from city-states', () => {
  it('sells a company at the gate for the city’s price, raises it beside the buyer with no movement, remembers the sale, quotes it, and is refused unpaid, at war or too soon', () => {
    const { state, realm, city, hearth, armyId, gate } = atTheGate();
    const price = hirePriceOf(state, city), cityName = state.factions.find(faction => faction.id === city)!.name;
    expect(price).toBe(30 + 4 * hearth.population);
    const quote = () => getObservation(state, realm).hires!.quotes.find(item => item.cityStateId === city && item.armyId === armyId)!;
    expect(quote()).toEqual({ cityStateId: city, armyId, coin: price, blocker: null });
    expect(getObservation(state, city).hires).toEqual({ quotes: [], hires: [] });
    const realmCoin = state.factions.find(faction => faction.id === realm)!.treasury, cityCoin = state.factions.find(faction => faction.id === city)!.treasury;
    const before = new Set(Object.keys(state.armies));
    const result = issue(state, { type: 'hireCompany', factionId: realm, cityStateId: city, armyId });
    expect(result.events.map(event => event.factionId).sort()).toEqual([realm, city].sort());
    expect(result.events[0]!.message).toContain(`${cityName} sells`);
    expect(result.events[0]!.message).toContain(`for ${price} coin; Hired pikes of ${cityName} stands at the gate beside Buying company.`);
    const hired = Object.values(state.armies).find(army => !before.has(army.id))!;
    expect(hired).toMatchObject({ factionId: realm, cell: gate, name: `Hired pikes of ${cityName}`, movement: 0 });
    expect(hired.formations).toHaveLength(1);
    expect(hired.formations[0]).toMatchObject({ unitId: HIRED_UNIT_ID });
    expect(state.factions.find(faction => faction.id === realm)!.treasury).toBe(realmCoin - price);
    expect(state.factions.find(faction => faction.id === city)!.treasury).toBe(cityCoin + price);
    expect(state.hires).toEqual([{ factionId: realm, cityStateId: city, armyId: hired.id, turn: state.turn, coin: price }]);
    expect(getObservation(state, realm).hires!.hires).toEqual(state.hires);
    expect(getObservation(state, city).hires!.hires).toEqual(state.hires);
    expect(quote().blocker).toContain(`sells again from turn ${state.turn + HIRE_COOLDOWN_TURNS}`);
    expect(() => validateHires(state)).not.toThrow();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Unpaid, besieged, at war; a city-state buys from no one.
    state.hires = [];
    state.factions.find(faction => faction.id === realm)!.treasury = price - 1;
    expect(hireBlocker(state, realm, city, armyId)).toContain('Not enough coin');
    state.factions.find(faction => faction.id === realm)!.treasury = 200;
    expect(hireBlocker(state, city, realm, armyId)).toContain('hires from no one');
    expect(hireBlocker(state, realm, realm, armyId)).toContain('Only a city-state sells');
    issue(state, { type: 'declareWar', factionId: realm, targetFactionId: city });
    expect(hireBlocker(state, realm, city, armyId)).toContain('at war');
    // Validation refuses a hire of the wrong shape.
    const broken = structuredClone(state); broken.hires = [{ factionId: city, cityStateId: realm, armyId: hired.id, turn: state.turn, coin: price }];
    expect(() => validateHires(broken)).toThrow('not a realm');
  });

  it('is nothing under rules 67, cannot be sealed under them once made, and a v67 envelope loads with none', () => {
    const { state, realm, city, armyId } = atTheGate();
    withRules(state, 67, () => {
      expect(applyCommand(state, { type: 'hireCompany', factionId: realm, cityStateId: city, armyId }).error).toContain('not part of these rules');
      expect(getObservation(state, realm).hires).toBeUndefined();
    });
    const sealed = serializeGameForVersion(state, 67);
    expect(JSON.parse(sealed)).toMatchObject({ version: 67, contentHash: PRE_CITY_STATES_II_CONTENT_HASH });
    expect(JSON.parse(sealed).state.hires).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.hires).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 75, contentHash: CONTENT_HASH });
    issue(state, { type: 'hireCompany', factionId: realm, cityStateId: city, armyId });
    expect(() => serializeGameForVersion(state, 67)).toThrow('hired companies unavailable');
    expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true });
  });
});
