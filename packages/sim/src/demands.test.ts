import { describe, expect, it } from 'vitest';
import { neighbors, isPassable } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { withRules } from './rules';
import { serializeGameForVersion } from './save';
import { DEMAND_COOLDOWN_TURNS, DEMAND_STRENGTH_RATIO, demandBlocker, garrisonStrengthAt, tributeOf, validateDemands } from './demands';
import { armyStrength } from './army-composition';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** A realm, a city-state, and the realm's company standing at the city-state's gate. */
const atTheGate = (strong: boolean) => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 , rulesVersion: 68 /* the first roster, so the campaign also seals under the older rules this file reads */ });
  for (const faction of state.factions) faction.treasury = 200;
  const realm = state.factions.find(faction => !faction.id.startsWith('citystate.'))!.id, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
  // Every seat founds its hearth from its caravan on turn 1; the city-state's goes up first here.
  const caravan = Object.values(state.armies).find(army => army.factionId === city && army.formations.some(item => item.unitId === 'unit.colonist'))!;
  const founded = applyCommand(state, { type: 'found', factionId: city, armyId: caravan.id, name: 'Gate City' });
  if (!founded.ok) throw new Error(founded.error);
  const hearth = Object.values(state.settlements).find(town => town.factionId === city)!;
  const gate = neighbors(hearth.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: realm, name: 'Pressing company', cell: gate, movement: 1, formations: strong ? [0, 1, 2].map(() => ({ ...createArmyFormation(id, 'unit.heavy_infantry'), id: `formation.${state.nextId++}` })) : [createArmyFormation(id, 'unit.scout')] };
  refreshAuthoredSight(state);
  return { state, realm, city, hearth, armyId: id };
};

describe('rules 61: tribute demands of city-states', () => {
  it('pays when the company outweighs the walls, refuses when it does not, remembers either way, and is quoted at the gate', () => {
    const { state, realm, city, armyId } = atTheGate(true);
    const walls = garrisonStrengthAt(state, city), strength = armyStrength(state.armies[armyId]!);
    expect(strength).toBeGreaterThanOrEqual(walls * DEMAND_STRENGTH_RATIO);
    const expected = tributeOf(state, city);
    expect(expected).toBeGreaterThan(0);
    expect(getObservation(state, realm).tribute).toMatchObject({ quotes: [{ cityStateId: city, armyId, coin: expected, blocker: null }], demands: [] });
    expect(getObservation(state, city).tribute).toEqual({ quotes: [], demands: [] });
    const before = { realm: state.factions.find(faction => faction.id === realm)!.treasury, city: state.factions.find(faction => faction.id === city)!.treasury };
    const paid = issue(state, { type: 'demandTribute', factionId: realm, cityStateId: city, armyId });
    expect(paid.events.map(event => event.type)).toEqual(['tribute_paid', 'tribute_paid']);
    expect(paid.events[0]!.message).toContain(`pays ${expected} coin`);
    expect(state.factions.find(faction => faction.id === realm)!.treasury).toBe(before.realm + expected);
    expect(state.factions.find(faction => faction.id === city)!.treasury).toBe(before.city - expected);
    expect(state.demands).toEqual([{ factionId: realm, cityStateId: city, turn: state.turn, paid: true, coin: expected }]);
    const memory = state.diplomacy.relations.find(item => item.parties.includes(realm) && item.parties.includes(city))!;
    expect(memory.grievances).toBe(25); expect(memory.trust).toBe(-20);
    // Not again for twenty turns; the quote says so and the command is refused.
    expect(demandBlocker(state, realm, city, armyId)).toContain(`before turn ${state.turn + DEMAND_COOLDOWN_TURNS}`);
    expect(applyCommand(state, { type: 'demandTribute', factionId: realm, cityStateId: city, armyId }).ok).toBe(false);
    expect(getObservation(state, realm).tribute!.quotes[0]!.blocker).toContain('not pressed again');
    expect(getObservation(state, city).tribute!.demands).toHaveLength(1);
    expect(() => validateDemands(state)).not.toThrow();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // A weak company is refused, and the city remembers that too.
    const weak = atTheGate(false);
    const refused = issue(weak.state, { type: 'demandTribute', factionId: weak.realm, cityStateId: weak.city, armyId: weak.armyId });
    expect(refused.events.map(event => event.type)).toEqual(['tribute_refused', 'tribute_refused']);
    expect(refused.events[0]!.message).toContain('refuses');
    expect(weak.state.demands[0]).toMatchObject({ paid: false, coin: 0 });
    expect(weak.state.diplomacy.relations.find(item => item.parties.includes(weak.realm) && item.parties.includes(weak.city))!.grievances).toBe(10);
  });

  it('is refused for a realm, a client or patron, a company away from the gate, a caravan, a war, and under older rules; a v60 envelope loads with none', () => {
    const { state, realm, city, armyId } = atTheGate(true);
    const other = state.factions.find(faction => faction.id !== realm && !faction.id.startsWith('citystate.'))!.id;
    expect(demandBlocker(state, realm, other, armyId)).toContain('Only a city-state');
    expect(demandBlocker(state, city, realm, armyId)).toContain('presses no one');
    const away = Object.values(state.armies).find(army => army.factionId === realm && army.id !== armyId)!;
    expect(demandBlocker(state, realm, city, away.id)).toMatch(/beside the city-state|land company/);
    const caravanId = `army.${state.nextId++}`;
    state.armies[caravanId] = { id: caravanId, factionId: realm, name: 'Caravan', cell: state.armies[armyId]!.cell, movement: 1, formations: [createArmyFormation(caravanId, 'unit.colonist')] };
    expect(demandBlocker(state, realm, city, caravanId)).toContain('land company');
    const bonded = atTheGate(true);
    issue(bonded.state, { type: 'proposeClient', factionId: bonded.realm, targetFactionId: bonded.city, terms: { giftCoin: 40, tributeCoin: 6, termTurns: 12 } });
    issue(bonded.state, { type: 'respondClient', factionId: bonded.city, offerId: bonded.state.diplomacy.clientOffers[0]!.id, accept: true });
    expect(demandBlocker(bonded.state, bonded.realm, bonded.city, bonded.armyId)).toContain('Patron and client');
    const warring = atTheGate(true);
    issue(warring.state, { type: 'declareWar', factionId: warring.realm, targetFactionId: warring.city });
    expect(demandBlocker(warring.state, warring.realm, warring.city, warring.armyId)).toContain('at war');
    const older = atTheGate(true);
    withRules(older.state, 60, () => {
      expect(applyCommand(older.state, { type: 'demandTribute', factionId: older.realm, cityStateId: older.city, armyId: older.armyId }).error).toContain('not part of these rules');
      expect(getObservation(older.state, older.realm).tribute).toBeUndefined();
    });
    expect(() => serializeGameForVersion(state, 60)).not.toThrow();
    issue(state, { type: 'demandTribute', factionId: realm, cityStateId: city, armyId });
    expect(() => serializeGameForVersion(state, 60)).toThrow('tribute demands unavailable');
    const fresh = atTheGate(true).state;
    const sealed = serializeGameForVersion(fresh, 60);
    expect(JSON.parse(sealed).state.demands).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.demands).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(fresh));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 72 });
  });
});
