import type { ArmyView, GameState, Observation, Settlement } from './types';
import { armyUnitId } from './army-composition';
import { armyDomain } from './naval';
import { getLandIndex } from './territory';

/** Map presentation only. No rosters, orders, officers, economy or event history. */
export interface MapObservation extends Pick<Observation, 'factionId' | 'width' | 'height' | 'cells' | 'factions' | 'wars'> {
  armies: (Pick<ArmyView, 'id' | 'name' | 'factionId' | 'cell' | 'unitId' | 'domain' | 'carrierId'> & { formationCount?: number })[];
  settlements: Pick<Settlement, 'id' | 'name' | 'factionId' | 'cell' | 'population'>[];
  ruins: Pick<Observation['ruins'][number], 'id' | 'name' | 'cell'>[];
  land: Pick<Observation['land'], 'capitalSettlementId'>;
}

const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Explicit spectator projection, never an AI observation or a visibility update.
 * The application must authorize AI-watch mode before calling this selector.
 * O(world cells + entities), requested only for a revealed spectator publication.
 */
export function getSpectatorObservation(state: GameState, factionId: string): MapObservation {
  if (!state.factions.some(faction => faction.id === factionId)) throw new Error('Unknown spectator faction');
  const claims = getLandIndex(state);
  return {
    factionId, width: state.world.width, height: state.world.height,
    factions: state.factions.map(({ id, definitionId, name, color }) => ({ id, definitionId, name, color })),
    wars: state.wars.filter(pair => pair.includes(factionId)).map(pair => pair[0] === factionId ? pair[1] : pair[0]).sort(),
    armies: Object.values(state.armies).filter(army => !state.transports[army.id]).sort(byId).map(army => ({
      id: army.id, name: army.name, factionId: army.factionId, cell: army.cell,
      unitId: armyUnitId(army), domain: armyDomain(army), carrierId: null, formationCount: army.formations.length,
    })),
    settlements: Object.values(state.settlements).sort(byId).map(({ id, name, factionId, cell, population }) => ({ id, name, factionId, cell, population })),
    ruins: Object.values(state.ruins).sort(byId).map(({ id, name, cell }) => ({ id, name, cell })),
    land: { capitalSettlementId: state.land.capitals[factionId] ?? null },
    cells: Array.from({ length: state.world.terrain.length }, (_, cell) => {
      const settlementId = claims.get(cell), town = settlementId ? state.settlements[settlementId] : undefined;
      const improvementId = settlementId ? state.land.settlements[settlementId]?.improvements[cell] : undefined;
      return {
        cell, terrain: state.world.terrain[cell] ?? 0, biome: state.land.biomes[cell] ?? state.world.biome[cell] ?? 0,
        waterDepth: state.world.waterDepth[cell] ?? 0, fertility: state.world.fertility[cell] ?? 0, visible: true,
        hydrology: state.world.hydrology[cell] ?? 0, roadMask: state.roads.edges[cell] ?? 0,
        ...(town ? { settlementId: town.id, factionId: town.factionId } : {}), ...(improvementId ? { improvementId } : {}),
      };
    }),
  };
}
