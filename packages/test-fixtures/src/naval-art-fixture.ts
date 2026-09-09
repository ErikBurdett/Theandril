import { FACTIONS } from '@theandril/content';
import { deriveWaterDepth } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, type GameState } from '@theandril/sim';
import { rebaseAuthoredLand } from './authored-land';

export const NAVAL_ART_ROLES = ['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship'] as const;
export const NAVAL_ART_GALLERY_WIDTH = 256;
export const NAVAL_ART_HIDDEN_NAME = 'Unseen naval reserve';
export const NAVAL_ART_CARGO_NAME = 'Embarked gallery guard';
export const NAVAL_ART_COHORTS = [0, 1, 2, 3].map(index => ({
  label: `naval-cohort-${index + 1}`, offset: index * 60,
  families: FACTIONS.slice(index * 6, index * 6 + 6).map(faction => faction.id.slice('faction.'.length)),
}));
export const navalArtCell = (column: number, row: number): number => row * NAVAL_ART_GALLERY_WIDTH + column;

/** Explicitly authored shallow-water display lanes and existing unit formations.
 * This is an art/fog fixture, not evidence of earned ships or generated geography.
 * The passenger boards through the real command; no transport result is injected.
 */
export function navalArtGallery(): GameState {
  const state = createGame({ seed: 20260905, size: 'small', factionCount: 24, pace: 'short', generatorVersion: 4 });
  if (state.world.width !== NAVAL_ART_GALLERY_WIDTH || FACTIONS.length !== 24) throw new Error('Review the twenty-four-culture naval gallery layout after a roster/map change.');
  const world = state.world;
  state.resources.deposits = {}; // This fixture replaces the entire physical geography with resource-free authored land/water.
  world.terrain.fill(1); world.biome.fill(1); world.fertility.fill(60);
  function water(cell: number): void { world.terrain[cell] = 0; world.biome[cell] = 0; world.fertility[cell] = 0; }
  for (const cohort of NAVAL_ART_COHORTS) for (let row = 10; row <= 20; row += 2) {
    for (let column = 14; column <= 26; column++) water(navalArtCell(cohort.offset + column, row));
  }
  water(0);
  // Preserve the generated, distinct starting-ground references even in this authored map.
  for (const cell of world.starts) { world.terrain[cell] = 1; world.biome[cell] = 1; world.fertility[cell] = 60; }
  world.waterDepth = deriveWaterDepth(world.width, world.height, world.terrain);
  state.armies = {};
  function army(factionId: string, unitId: string, cell: number, name: string): string {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId, name, cell, movement: unitId === 'unit.scout' ? 5 : 3, formations: [createArmyFormation(id, unitId)] };
    return id;
  }
  let firstTransport = '';
  state.factions.forEach((faction, index) => {
    const cohort = NAVAL_ART_COHORTS[Math.floor(index / 6)]!, row = 10 + index % 6 * 2;
    NAVAL_ART_ROLES.forEach((role, column) => {
      const id = army(faction.id, role, navalArtCell(cohort.offset + 16 + column * 4, row), `${faction.name} ${['cargo', 'coast', 'ocean'][column]}`);
      if (index === 0 && column === 0) firstTransport = id;
    });
  });
  for (const cohort of NAVAL_ART_COHORTS) {
    for (const [column, row] of [[18, 11], [22, 11], [18, 15], [22, 15], [18, 19], [22, 19]]) {
      army(state.turnOwnerId, 'unit.scout', navalArtCell(cohort.offset + column!, row!), 'Shore observer');
    }
    army(state.turnOwnerId, 'unit.scout', navalArtCell(cohort.offset + 20, 15), `${cohort.label} harbor survey`);
  }
  army(state.factions[3]!.id, 'unit.coastal_warship', 0, NAVAL_ART_HIDDEN_NAME);
  const cargoId = army(state.turnOwnerId, 'unit.guard', navalArtCell(16, 11), NAVAL_ART_CARGO_NAME);
  for (const faction of state.factions) state.explored[faction.id] = new Set();
  rebaseAuthoredLand(state);
  const boarding = applyCommand(state, { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: cargoId, fleetId: firstTransport });
  if (!boarding.ok) throw new Error(`Gallery boarding failed: ${boarding.error}`);
  const restored = deserializeGame(serializeGame(state));
  const view = getObservation(restored, restored.turnOwnerId, { landDetails: 'none' });
  if (view.factions.length !== 24 || view.armies.some(item => item.name === NAVAL_ART_HIDDEN_NAME)) throw new Error('Naval gallery must reveal all twenty-four cultures without its unseen reserve.');
  for (const faction of restored.factions) for (const role of NAVAL_ART_ROLES) {
    if (!view.armies.some(item => item.factionId === faction.id && item.unitId === role)) throw new Error(`Naval gallery sight omitted ${role}/${faction.id}.`);
  }
  return restored;
}
