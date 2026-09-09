import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { grainResourceCampaign, politicalOverviewCampaign } from './resource-fixture';

describe('resource and political browser fixtures', () => {
  it('keeps generated ecology and funds, pays its market, then can fund real extraction and household assignment', () => {
    const { state, deposit, townId, marketCost, quote } = grainResourceCampaign();
    const generated = createGame({ seed: 17, size: 'tiny', factionCount: 1, pace: 'epic' });
    expect(state.world.terrain).toEqual(generated.world.terrain); expect(state.world.biome).toEqual(generated.world.biome);
    expect(state.resources.deposits).toEqual(generated.resources.deposits); expect(state.resources.deposits[deposit]).toBe('resource.grain');
    expect(state.land.settlements[townId]!.improvements).toEqual({}); expect(state.resources.stockpiles[state.turnOwnerId]).toEqual({});
    expect(marketCost).toBeGreaterThan(0); const before = state.factions[0]!.treasury;
    expect(applyCommand(state, { type: 'improveTile', factionId: state.turnOwnerId, settlementId: townId, cell: deposit, improvementId: 'improvement.grange' }).ok).toBe(true);
    expect(state.factions[0]!.treasury).toBe(before - quote.coinCost);
    expect(applyCommand(state, { type: 'setWorkedTiles', factionId: state.turnOwnerId, settlementId: townId, cells: [deposit] }).ok).toBe(true);
    for (let turn = 0; turn < quote.turns; turn++) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
    expect(state.land.settlements[townId]!.improvements[deposit]).toBe('improvement.grange');
    const stock = state.resources.stockpiles[state.turnOwnerId]?.['resource.grain'] ?? 0;
    expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
    expect(state.resources.stockpiles[state.turnOwnerId]!['resource.grain']).toBe(stock + 3);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });
  it('exposes two genuinely founded realms through current sight while retaining unexplored geography', () => {
    const state = politicalOverviewCampaign(), view = getObservation(state, state.turnOwnerId);
    expect(view.factions).toHaveLength(2); expect(view.settlements).toHaveLength(2);
    expect(view.cells.length).toBeLessThan(state.world.terrain.length);
    expect(new Set(view.cells.map(cell => cell.factionId).filter(Boolean)).size).toBe(2);
    expect(view.events.filter(event => event.type === 'settlement_founded')).toHaveLength(1);
  });
});
