import { describe, expect, it } from 'vitest';
import { ARCANE_DISCOVERIES } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, arcaneSites, createGame, deserializeGame, getObservation, serializeGame, serializeGameForVersion, SITE_EXTRACTION, SITE_SEARCH_COIN, stateHash, type GameCommand, type GameState } from './index';

const scene = (): GameState => {
  const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 2, generatorVersion: 3 });
  for (const faction of state.factions) faction.treasury = 400;
  return state;
};
const issue = (state: GameState, command: GameCommand) => {
  const result = applyCommand(state, command);
  expect(result.ok, result.error).toBe(true);
  return result;
};
const reject = (state: GameState, command: GameCommand, error: string) => {
  const before = stateHash(state);
  expect(applyCommand(state, command)).toMatchObject({ ok: false, error });
  expect(stateHash(state)).toBe(before);
};
/** Put a company on a seam without spending its movement, so the survey itself
 * is what is measured. Moving a company means its realm can see where it stands. */
const standOnSeam = (state: GameState, armyId: string): number => {
  const seam = arcaneSites(state.world)[0]!;
  state.armies[armyId]!.cell = seam.cell;
  refreshAuthoredSight(state);
  return seam.cell;
};

describe('arcane seams (rules 23)', () => {
  it('hides seams until a realm pays to survey the ground it stands on', () => {
    const state = scene(), factionId = state.turnOwnerId;
    const seams = arcaneSites(state.world);
    expect(seams.length).toBeGreaterThanOrEqual(3);
    expect(new Set(seams.map(seam => seam.cell)).size).toBe(seams.length);
    // No realm begins on a seam, and none is visible before it is surveyed.
    for (const seam of seams) for (const start of state.world.starts) expect(hexDistance(seam.cell, start, state.world.width)).toBeGreaterThanOrEqual(4);
    expect(getObservation(state, factionId).arcaneSites).toEqual([]);

    const cell = standOnSeam(state, 'army.2'), purse = state.factions[0]!.treasury;
    const result = issue(state, { type: 'searchArcane', factionId, armyId: 'army.2' });
    expect(result.events.some(event => event.type === 'arcane_site_found')).toBe(true);
    expect(state.factions[0]!.treasury).toBe(purse - SITE_SEARCH_COIN);
    expect(state.armies['army.2']!.movement).toBe(0);
    expect(getObservation(state, factionId).arcaneSites).toMatchObject([{ cell, controlled: false, settlementId: null }]);
    // The find is this realm's alone, and the survey is deterministic across a save.
    expect(getObservation(state, state.factions[1]!.id).arcaneSites).toEqual([]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    reject(state, { type: 'searchArcane', factionId, armyId: 'army.2' }, 'This company has already spent its movement this turn.');
  });

  it('reports an empty survey honestly and refuses one the realm cannot fund', () => {
    const state = scene(), factionId = state.turnOwnerId;
    const away = arcaneSites(state.world).every(seam => hexDistance(seam.cell, state.armies['army.2']!.cell, state.world.width) > 1);
    expect(away).toBe(true);
    const purse = state.factions[0]!.treasury;
    const result = issue(state, { type: 'searchArcane', factionId, armyId: 'army.2' });
    expect(result.events.some(event => event.type === 'arcane_survey_empty')).toBe(true);
    expect(state.factions[0]!.treasury).toBe(purse - SITE_SEARCH_COIN);
    expect(getObservation(state, factionId).arcaneSites).toEqual([]);

    state.factions[0]!.treasury = SITE_SEARCH_COIN - 1;
    state.armies['army.2']!.movement = 2;
    reject(state, { type: 'searchArcane', factionId, armyId: 'army.2' }, `An arcane survey costs ${SITE_SEARCH_COIN} coin.`);
    reject(state, { type: 'searchArcane', factionId, armyId: 'army.404' }, 'Choose one of your own companies.');
  });

  it('gates Arcane Theory on a seam the realm actually holds, and draws ashglass from it', () => {
    const state = scene(), factionId = state.turnOwnerId;
    const town = Object.values(state.settlements).find(item => item.factionId === factionId)
      ?? (issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Seam hearth' }), Object.values(state.settlements)[0]!);
    state.factions[0]!.knowledge = 400;
    town.buildings.push('building.archive');
    const discovery = ARCANE_DISCOVERIES[0]!;
    reject(state, { type: 'researchArcane', factionId, discoveryId: discovery.id }, 'Arcane Theory needs a surveyed arcane seam inside your own borders.');

    // Reach the seam the ordinary way: stand on it, pay for the survey, then hold the ground.
    const cell = standOnSeam(state, 'army.2');
    issue(state, { type: 'searchArcane', factionId, armyId: 'army.2' });
    reject(state, { type: 'researchArcane', factionId, discoveryId: discovery.id }, 'Arcane Theory needs a surveyed arcane seam inside your own borders.');
    const land = state.land.settlements[town.id]!;
    const before = getObservation(state, factionId).resources!.stockpiles.find(stock => stock.resourceId === 'resource.ashglass')!;
    land.claimed.push(cell); land.claimed.sort((a, b) => a - b);
    expect(getObservation(state, factionId).arcaneSites).toMatchObject([{ cell, controlled: true, settlementId: town.id }]);
    issue(state, { type: 'researchArcane', factionId, discoveryId: discovery.id });
    const after = getObservation(state, factionId).resources!.stockpiles.find(stock => stock.resourceId === 'resource.ashglass')!;
    expect(after.perTurn).toBe(before.perTurn + SITE_EXTRACTION);
  });

  it('is absent from historical rules and refused by older envelopes', () => {
    const state = scene(), factionId = state.turnOwnerId;
    expect(applyCommandForVersion(state, { type: 'searchArcane', factionId, armyId: 'army.2' }, 22)).toMatchObject({ ok: false });
    // A campaign that has surveyed nothing still projects into a rules-22 envelope unchanged.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 22)))).toBe(stateHash(state));
    standOnSeam(state, 'army.2');
    issue(state, { type: 'searchArcane', factionId, armyId: 'army.2' });
    expect(() => serializeGameForVersion(state, 22)).toThrow('arcane surveys');
  });
});
