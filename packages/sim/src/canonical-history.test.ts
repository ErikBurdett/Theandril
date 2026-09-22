import { describe, expect, it } from 'vitest';
import { characterBattleCampaign } from '../../test-fixtures/src/character-fixture';
import { applyCommand, deserializeGame, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { landStateSchema } from './territory';

const own = 'faction.ashen_compact', enemy = 'faction.reedbound_council';
const issue = (state: GameState, command: GameCommand) => expect(applyCommand(state, command)).toMatchObject({ ok: true });

/** A campaign whose factions remember settled land. */
function rememberedCampaign(): GameState {
  const state = characterBattleCampaign();
  for (let turn = 0; turn < 3; turn++) issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
  expect(Object.values(state.land.known).some(cells => Object.keys(cells).length > 0)).toBe(true);
  return state;
}

describe('remembered land serializes identically on its fast and fully parsed paths', () => {
  it('reordered record keys take the full parse and produce the same bytes and seal', () => {
    const state = rememberedCampaign(), bytes = serializeGame(state), hash = stateHash(state);
    // Same facts, different key order: the fast path declines and zod reorders them.
    for (const cells of Object.values(state.land.known)) for (const [cell, record] of Object.entries(cells)) {
      const { biome, settlementId, factionId, improvementId } = record;
      cells[Number(cell)] = { improvementId, factionId, settlementId, biome };
    }
    expect(serializeGame(state)).toBe(bytes);
    expect(stateHash(state)).toBe(hash);
    expect(serializeGame(deserializeGame(bytes))).toBe(bytes);
  });

  it.each([
    ['an unknown key', (record: Record<string, unknown>) => { record.extra = 1; }],
    ['an out-of-range biome', (record: Record<string, unknown>) => { record.biome = 12; }],
    ['a malformed identifier', (record: Record<string, unknown>) => { record.factionId = 'Bad ID'; }],
  ])('rejects %s with the original schema error', (_name, corrupt) => {
    const state = rememberedCampaign();
    const cells = Object.values(state.land.known).find(item => Object.keys(item).length)!;
    corrupt(cells[Number(Object.keys(cells)[0])] as unknown as Record<string, unknown>);
    const expected = landStateSchema.safeParse(state.land);
    expect(expected.success).toBe(false);
    expect(() => serializeGame(state)).toThrow(expected.error!.message);
  });

  it('keeps rejecting inherited canonical records', () => {
    const state = rememberedCampaign();
    const cells = Object.values(state.land.known).find(item => Object.keys(item).length)!, key = Number(Object.keys(cells)[0]);
    cells[key] = Object.assign(Object.create({ inherited: true }) as object, cells[key]) as typeof cells[number];
    expect(() => serializeGame(state)).toThrow('Canonical land requires plain data records.');
  });
});

describe('finished battle reports are sealed history', () => {
  function foughtCampaign(): GameState {
    const state = characterBattleCampaign();
    issue(state, { type: 'declareWar', factionId: own, targetFactionId: enemy });
    issue(state, { type: 'attack', factionId: own, armyId: 'army.2', targetArmyId: 'army.4' });
    issue(state, { type: 'autoResolveBattle', factionId: own });
    expect(state.battle).toBeNull();
    expect(state.battleReports).toHaveLength(1);
    return state;
  }

  it('freezes the recorded and reloaded report, including nested results', () => {
    const state = foughtCampaign(), report = state.battleReports[0]!;
    for (const value of [report, report.aftermath, report.combat, report.combat.attacker[0]]) expect(Object.isFrozen(value)).toBe(true);
    expect(() => { (report as { turn: number }).turn = 999; }).toThrow(TypeError);
    const reloaded = deserializeGame(serializeGame(state)).battleReports[0]!;
    expect(Object.isFrozen(reloaded.combat)).toBe(true);
  });

  it('seals the same canonical bytes as an unsealed copy of the same history', () => {
    const state = foughtCampaign(), bytes = serializeGame(state);
    expect(serializeGame(state)).toBe(bytes); // Reused canonical report.
    const detached = structuredClone(state); // Plain copies are parsed every time.
    expect(Object.isFrozen(detached.battleReports[0])).toBe(false);
    expect(serializeGame(detached)).toBe(bytes);
    expect(stateHash(detached)).toBe(stateHash(state));
    // A detached, altered copy is still validated rather than served from the cache.
    detached.battleReports[0]!.turn = 0;
    expect(() => serializeGame(detached)).toThrow();
  });
});
