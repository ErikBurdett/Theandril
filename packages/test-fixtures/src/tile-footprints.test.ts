import { describe, expect, it } from 'vitest';
import { IMPROVEMENTS } from '@theandril/content';
import { deserializeGame, getObservation, serializeGame } from '@theandril/sim';
import { tileFootprintCampaign } from './tile-footprints';

describe('authored tile-footprint visual scenario', () => {
  it('contains ten genuinely paid completed sites, three stages and a genuinely unseen foreign city', () => {
    const { game, siteCells, towns, hidden, paidWorks } = tileFootprintCampaign();
    const view = getObservation(game, game.turnOwnerId);
    expect(paidWorks.map(work => work.improvementId)).toEqual(IMPROVEMENTS.map(item => item.id));
    for (const [i, cell] of siteCells.entries()) {
      expect(view.cells.find(item => item.cell === cell)).toMatchObject({ visible: true, improvementId: IMPROVEMENTS[i]!.id });
      expect(paidWorks[i]!.coinCost).toBeGreaterThan(0);
    }
    expect(towns.map(town => game.settlements[town.id]!.population)).toEqual([8, 4, 1]);
    expect(view.settlements.some(town => town.id === hidden.id)).toBe(false);
    expect(view.cells.some(cell => cell.cell === hidden.cell)).toBe(false);
    const saved = serializeGame(game);
    expect(serializeGame(deserializeGame(saved))).toBe(saved);
  });
  it('retains empty-field last-seen memory instead of leaking a later foreign building', () => {
    const { game, hidden } = tileFootprintCampaign({ rememberForeignSite: true });
    const view = getObservation(game, game.turnOwnerId);
    const cell = view.cells.find(item => item.cell === hidden.improvementCell);
    expect(cell).toMatchObject({ visible: false });
    expect(cell?.improvementId).toBeUndefined();
    expect(Object.values(game.land.settlements).some(town => town.improvements[String(hidden.improvementCell)] === 'improvement.terraced_fields')).toBe(true);
  });
});
