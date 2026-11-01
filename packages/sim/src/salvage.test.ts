import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { withRules } from './rules';
import { serializeGameForVersion } from './save';
import { hasSalvage, SALVAGE_COIN, SALVAGE_KNOWLEDGE, validateSalvage } from './salvage';

const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId, armyId = CONQUEST_FIXTURE.playerArmyId;
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** Reedwatch razed by the vanguard, which stands on its ruins. */
function razed(): GameState {
  const state = conquestCampaign();
  issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) issue(state, { type: 'endTurn', factionId: player });
  issue(state, { type: 'assault', factionId: player, settlementId: townId }); issue(state, { type: 'autoResolveBattle', factionId: player });
  issue(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'raze' });
  expect(state.ruins[townId]).toMatchObject({ cell: state.armies[armyId]!.cell });
  return state;
}

describe('rules 81: salvage from the ruins', () => {
  it('gives the realm whose company stands on untouched ruins their one salvage at the turn’s end, records it on the ruin, reads it in the hex inspector, and is nothing under rules 80', () => {
    const state = razed(), faction = state.factions.find(item => item.id === player)!;
    const treasury = faction.treasury, knowledge = faction.knowledge;
    expect(hasSalvage(state)).toBe(false);
    expect(getObservation(state, player).ruins.find(ruin => ruin.id === townId)!.salvagedByFactionId).toBeUndefined();
    const sealed = serializeGame(state);
    const round = issue(state, { type: 'endTurn', factionId: player });
    const salvaged = round.events.find(event => event.type === 'ruin_salvaged')!;
    expect(salvaged).toMatchObject({ factionId: player, cell: state.ruins[townId]!.cell });
    expect(salvaged.message).toContain(`picks over the ruins of ${CONQUEST_FIXTURE.settlementName}: ${SALVAGE_COIN} coin and ${SALVAGE_KNOWLEDGE} knowledge`);
    // The round's yields come on top of the salvage; the salvage itself is exact.
    const unsalvaged = deserializeGame(sealed);
    withRules(unsalvaged, 80, () => issue(unsalvaged, { type: 'endTurn', factionId: player }));
    const under80 = unsalvaged.factions.find(item => item.id === player)!;
    expect(faction.treasury - under80.treasury).toBe(SALVAGE_COIN);
    expect(faction.knowledge - under80.knowledge).toBe(SALVAGE_KNOWLEDGE);
    expect(faction.treasury).toBeGreaterThan(treasury); expect(faction.knowledge).toBeGreaterThanOrEqual(knowledge);
    expect(state.ruins[townId]!.salvagedByFactionId).toBe(player);
    expect(unsalvaged.ruins[townId]!.salvagedByFactionId).toBeUndefined();
    expect(getObservation(state, player).ruins.find(ruin => ruin.id === townId)!.salvagedByFactionId).toBe(player);
    // Once only: the next round gives nothing more, and the same round from the save is the same round.
    const after = faction.treasury;
    const next = issue(state, { type: 'endTurn', factionId: player });
    expect(next.events.some(event => event.type === 'ruin_salvaged')).toBe(false);
    expect(faction.treasury - after).toBeLessThan(SALVAGE_COIN);
    const replayed = deserializeGame(sealed);
    issue(replayed, { type: 'endTurn', factionId: player }); issue(replayed, { type: 'endTurn', factionId: player });
    expect(stateHash(replayed)).toBe(stateHash(state));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // A salvaged ruin cannot be sealed under rules 80; a v80 envelope loads with none, and one naming salvage is refused.
    expect(() => serializeGameForVersion(state, 80)).toThrow('salvaged ruins unavailable');
    const v80 = serializeGameForVersion(unsalvaged, 80);
    expect(JSON.parse(v80)).toMatchObject({ version: 80, contentHash: CONTENT_HASH });
    expect(JSON.parse(v80).state.ruins[0].salvagedByFactionId).toBeUndefined();
    expect(stateHash(deserializeGame(v80))).toBe(stateHash(unsalvaged));
    expect(JSON.parse(serializeGame(deserializeGame(v80)))).toMatchObject({ version: 81 });
    const forged = JSON.parse(v80) as { state: { ruins: { salvagedByFactionId?: string }[] } };
    forged.state.ruins[0]!.salvagedByFactionId = player;
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow();
    // Validation refuses a salvage by an unknown realm.
    const broken = structuredClone(state); broken.ruins[townId]!.salvagedByFactionId = 'faction.nobody';
    expect(() => validateSalvage(broken)).toThrow('unknown realm');
  });
});
